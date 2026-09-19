<?php

use App\Enums\StatusSemester;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Status lifecycle untuk Semester + permission baru
 *
 * PERUBAHAN
 * ─────────────────────────────────────────────────────────────
 * 1. semesters
 *    + status ENUM('upcoming','active','closed','archived') default 'upcoming'
 *    + archived_at timestamp nullable
 *    Backfill: is_active = true → 'active', is_active = false → 'upcoming'
 *    Kolom is_active TIDAK dihapus (backward-compat, di-sync via model boot).
 *
 * 2. permissions (per-school)
 *    + master_data.semester.view
 *    + master_data.semester.manage   → create, update (Operator & Wakasek)
 *    + master_data.semester.activate → set semester aktif (Wakasek)
 *    + master_data.semester.archive  → arsipkan semester (Operator)
 *    + master_data.tahun_ajaran.archive → ditambah jika belum ada (dari fix P0)
 *
 * 3. role_permissions
 *    Assign permission semester ke role yang sesuai per sekolah.
 *
 * IDEMPOTENT — aman dijalankan berulang kali.
 */
return new class extends Migration {

    public function up(): void
    {
        // ── 1. Tambah kolom status ke semesters ──────────────────────────────
        Schema::table('semesters', function (Blueprint $table) {
            if (!Schema::hasColumn('semesters', 'status')) {
                $table->string('status', 20)
                    ->default(StatusSemester::UPCOMING->value)
                    ->after('is_active')
                    ->comment('Lifecycle: upcoming|active|closed|archived');
            }
            if (!Schema::hasColumn('semesters', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()
                    ->after('status')
                    ->comment('Waktu semester diarsipkan');
            }

            if (!$this->indexExists('semesters', 'idx_semesters_status')) {
                $table->index('status', 'idx_semesters_status');
            }
        });

        // ── 2. Backfill status dari is_active ────────────────────────────────
        // is_active = true  → status 'active'
        // is_active = false → status 'upcoming' (belum berjalan atau sudah selesai)
        // Semester yang tahun ajarannya COMPLETED/ARCHIVED → 'closed'
        DB::statement("
            UPDATE semesters s
            INNER JOIN tahun_ajarans ta ON ta.id = s.tahun_ajaran_id
            SET s.status = CASE
                WHEN s.is_active = 1 THEN 'active'
                WHEN ta.status IN ('completed', 'archived') THEN 'closed'
                ELSE 'upcoming'
            END
            WHERE s.deleted_at IS NULL
              AND (s.status IS NULL OR s.status = 'upcoming')
        ");

        // ── 3. Permission semester baru per sekolah ──────────────────────────
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            $viewId = $this->upsertPermission($schoolId, 'master_data.semester.view', 'Lihat Semester', 'master_data');
            $manageId = $this->upsertPermission($schoolId, 'master_data.semester.manage', 'Kelola Semester', 'master_data');
            $activateId = $this->upsertPermission($schoolId, 'master_data.semester.activate', 'Set Semester Aktif', 'master_data');
            $archiveId = $this->upsertPermission($schoolId, 'master_data.semester.archive', 'Arsipkan Semester', 'master_data');

            // Juga pastikan tahun_ajaran.archive ada (dari fix P0)
            $taArchiveId = $this->upsertPermission($schoolId, 'master_data.tahun_ajaran.archive', 'Arsipkan Tahun Ajaran', 'master_data');

            // Operator: view + manage + archive semester; arsip TA
            $this->assignToRole($schoolId, 'operator', [
                $viewId,
                $manageId,
                $archiveId,
                $taArchiveId,
            ]);

            // Wakasek: view + manage + activate semester
            $this->assignToRole($schoolId, 'wakasek', [
                $viewId,
                $manageId,
                $activateId,
            ]);

            // Kepsek: view only
            $this->assignToRole($schoolId, 'kepsek', [$viewId]);

            // Guru & Wali Kelas: view only (referensi semester aktif)
            foreach (['guru', 'wali_kelas', 'guru_bk'] as $role) {
                $this->assignToRole($schoolId, $role, [$viewId]);
            }
        }
    }

    public function down(): void
    {
        // Hapus permission semester dari role_permissions & permissions
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');
        $slugs = [
            'master_data.semester.view',
            'master_data.semester.manage',
            'master_data.semester.activate',
            'master_data.semester.archive',
        ];

        foreach ($schoolIds as $schoolId) {
            $permIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', $slugs)
                ->pluck('id');

            DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
            DB::table('permissions')->whereIn('id', $permIds)->delete();
        }

        Schema::table('semesters', function (Blueprint $table) {
            if ($this->indexExists('semesters', 'idx_semesters_status')) {
                $table->dropIndex('idx_semesters_status');
            }
            foreach (['archived_at', 'status'] as $col) {
                if (Schema::hasColumn('semesters', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function indexExists(string $table, string $indexName): bool
    {
        return !empty(DB::select(
            "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
            [$indexName]
        ));
    }

    private function upsertPermission(int $schoolId, string $slug, string $nama, string $modul): int
    {
        $existing = DB::table('permissions')
            ->where('school_id', $schoolId)
            ->where('slug', $slug)
            ->value('id');

        if ($existing) {
            return $existing;
        }

        return DB::table('permissions')->insertGetId([
            'school_id' => $schoolId,
            'slug' => $slug,
            'nama' => $nama,
            'modul' => $modul,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function assignToRole(int $schoolId, string $roleSlug, array $permIds): void
    {
        $roleId = DB::table('roles')
            ->where('school_id', $schoolId)
            ->where('slug', $roleSlug)
            ->value('id');

        if (!$roleId)
            return;

        foreach ($permIds as $permId) {
            DB::table('role_permissions')->insertOrIgnore([
                'role_id' => $roleId,
                'permission_id' => $permId,
                'school_id' => $schoolId,
            ]);
        }
    }
};