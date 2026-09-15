<?php

use App\Enums\StatusTahunAjaran;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Migration: Workflow status untuk Tahun Ajaran + ULID untuk Semester
 * + Permission baru Kepsek untuk approve/aktivasi.
 *
 * ═══════════════════════════════════════════════════════════════
 * PERUBAHAN
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. tahun_ajarans
 *    + status ENUM('draft','under_review','approved','active','completed','archived')
 *      default 'draft'
 *    + reviewed_by  FK → users (wakasek yang submit)
 *    + reviewed_at  timestamp
 *    + approved_by  FK → users (kepsek yang approve)
 *    + approved_at  timestamp
 *    + completed_at timestamp
 *    - is_active (DEPRECATED — diganti oleh status = 'active')
 *      Kolom ini TIDAK dihapus agar backward-compat, tapi
 *      disync via Model boot setiap kali status berubah.
 *
 * 2. semesters
 *    + ulid CHAR(26) UNIQUE
 *      Backfill otomatis untuk baris lama.
 *
 * 3. permissions (per-school)
 *    + master_data.tahun_ajaran.review   → Wakasek submit ke review
 *    + master_data.tahun_ajaran.approve  → Kepsek approve / reject
 *    + master_data.tahun_ajaran.activate → Kepsek aktifkan
 *    + master_data.tahun_ajaran.complete → Wakasek tutup buku
 *
 * 4. role_permissions
 *    - Assign permission baru ke wakasek dan kepsek.
 *    - Wakasek: review + complete
 *    - Kepsek:  approve + activate
 *
 * ═══════════════════════════════════════════════════════════════
 * BACKWARD COMPATIBILITY
 * ═══════════════════════════════════════════════════════════════
 * Data lama:
 *   is_active = true  → status diset ke 'active'
 *   is_active = false + is_archived = true → status = 'archived'
 *   is_active = false → status = 'draft'
 *
 * ═══════════════════════════════════════════════════════════════
 * IDEMPOTENT — aman dijalankan berulang kali.
 * ═══════════════════════════════════════════════════════════════
 */
return new class extends Migration {

    public function up(): void
    {
        // ── 1. Tambah kolom workflow ke tahun_ajarans ────────────────────────
        Schema::table('tahun_ajarans', function (Blueprint $table) {
            if (!Schema::hasColumn('tahun_ajarans', 'status')) {
                $table->string('status', 20)->default(StatusTahunAjaran::DRAFT->value)
                    ->after('is_active')
                    ->comment('Workflow status: draft|under_review|approved|active|completed|archived');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()
                    ->after('deleted_by')
                    ->constrained('users')->nullOnDelete()
                    ->comment('Wakasek yang men-submit ke review');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()
                    ->after('reviewed_by')
                    ->comment('Waktu disubmit ke review');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()
                    ->after('reviewed_at')
                    ->constrained('users')->nullOnDelete()
                    ->comment('Kepsek yang menyetujui');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()
                    ->after('approved_by')
                    ->comment('Waktu disetujui oleh kepsek');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()
                    ->after('approved_at')
                    ->comment('Waktu tutup buku / selesai');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'catatan_review')) {
                $table->text('catatan_review')->nullable()
                    ->after('completed_at')
                    ->comment('Catatan dari kepsek saat approve atau reject');
            }

            // Index untuk filter by status
            if (!$this->indexExists('tahun_ajarans', 'idx_ta_status')) {
                $table->index('status', 'idx_ta_status');
            }
        });

        // ── 2. Backfill status dari is_active / is_archived lama ────────────
        DB::table('tahun_ajarans')
            ->whereNull('deleted_at')
            ->get(['id', 'is_active', 'is_archived'])
            ->each(function ($row) {
                $status = match (true) {
                    (bool) $row->is_archived => StatusTahunAjaran::ARCHIVED->value,
                    (bool) $row->is_active => StatusTahunAjaran::ACTIVE->value,
                    default => StatusTahunAjaran::DRAFT->value,
                };
                DB::table('tahun_ajarans')
                    ->where('id', $row->id)
                    ->update(['status' => $status]);
            });

        // Juga untuk soft-deleted — set archived agar tidak menggantung
        DB::table('tahun_ajarans')
            ->whereNotNull('deleted_at')
            ->update(['status' => StatusTahunAjaran::ARCHIVED->value]);

        // ── 3. ULID untuk semesters ──────────────────────────────────────────
        if (!Schema::hasColumn('semesters', 'ulid')) {
            Schema::table('semesters', function (Blueprint $table) {
                $table->char('ulid', 26)->nullable()->unique('uq_semesters_ulid')
                    ->after('id')
                    ->comment('Public identifier — pakai ini di URL, bukan integer id');
            });

            // Backfill ULID untuk baris lama
            DB::table('semesters')->whereNull('ulid')->orderBy('id')->each(function ($row) {
                DB::table('semesters')->where('id', $row->id)->update([
                    'ulid' => (string) Str::ulid(),
                ]);
            });
        }

        // ── 4. Permission baru + assign ke roles (per school) ───────────────
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            // Buat permission baru (idempotent)
            $reviewId = $this->firstOrCreatePermission(
                $schoolId,
                'master_data.tahun_ajaran.review',
                'Submit Tahun Ajaran ke Review',
                'master_data'
            );
            $approveId = $this->firstOrCreatePermission(
                $schoolId,
                'master_data.tahun_ajaran.approve',
                'Approve / Reject Tahun Ajaran',
                'master_data'
            );
            $activateId = $this->firstOrCreatePermission(
                $schoolId,
                'master_data.tahun_ajaran.activate',
                'Aktifkan Tahun Ajaran',
                'master_data'
            );
            $completeId = $this->firstOrCreatePermission(
                $schoolId,
                'master_data.tahun_ajaran.complete',
                'Selesaikan (Tutup Buku) Tahun Ajaran',
                'master_data'
            );

            // Wakasek: bisa review dan complete
            $this->assignToRole($schoolId, 'wakasek', [$reviewId, $completeId]);

            // Kepsek: bisa approve dan activate
            $this->assignToRole($schoolId, 'kepsek', [$approveId, $activateId]);

            // Kepsek juga dapat view permission jika belum ada
            $viewId = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->where('slug', 'master_data.tahun_ajaran.view')
                ->value('id');
            if ($viewId) {
                $this->assignToRole($schoolId, 'kepsek', [$viewId]);
            }
        }
    }

    public function down(): void
    {
        // ── Hapus permission baru dari roles dan tabel permissions ───────────
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');
        $slugsToRemove = [
            'master_data.tahun_ajaran.review',
            'master_data.tahun_ajaran.approve',
            'master_data.tahun_ajaran.activate',
            'master_data.tahun_ajaran.complete',
        ];

        foreach ($schoolIds as $schoolId) {
            $permIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', $slugsToRemove)
                ->pluck('id');

            DB::table('role_permissions')
                ->whereIn('permission_id', $permIds)
                ->delete();

            DB::table('permissions')
                ->whereIn('id', $permIds)
                ->delete();
        }

        // ── Hapus ULID dari semesters ────────────────────────────────────────
        if (Schema::hasColumn('semesters', 'ulid')) {
            Schema::table('semesters', function (Blueprint $table) {
                $table->dropUnique('uq_semesters_ulid');
                $table->dropColumn('ulid');
            });
        }

        // ── Hapus kolom workflow dari tahun_ajarans ──────────────────────────
        Schema::table('tahun_ajarans', function (Blueprint $table) {
            $dropCols = [
                'catatan_review',
                'completed_at',
                'approved_at',
                'approved_by',
                'reviewed_at',
                'reviewed_by',
                'status',
            ];
            foreach ($dropCols as $col) {
                if (Schema::hasColumn('tahun_ajarans', $col)) {
                    // Drop FK dulu jika ada
                    if (in_array($col, ['reviewed_by', 'approved_by'])) {
                        try {
                            $table->dropForeign([$col]);
                        } catch (\Throwable) {
                        }
                    }
                    $table->dropColumn($col);
                }
            }

            try {
                $table->dropIndex('idx_ta_status');
            } catch (\Throwable) {
            }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return !empty($indexes);
    }

    private function firstOrCreatePermission(
        int $schoolId,
        string $slug,
        string $nama,
        string $modul
    ): int {
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

    private function assignToRole(int $schoolId, string $roleSlug, array $permissionIds): void
    {
        $roleId = DB::table('roles')
            ->where('school_id', $schoolId)
            ->where('slug', $roleSlug)
            ->value('id');

        if (!$roleId) {
            return;
        }

        foreach ($permissionIds as $permId) {
            DB::table('role_permissions')->insertOrIgnore([
                'role_id' => $roleId,
                'permission_id' => $permId,
                'school_id' => $schoolId,
            ]);
        }
    }
};