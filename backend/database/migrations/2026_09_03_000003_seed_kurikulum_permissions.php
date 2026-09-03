<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seed permission modul kurikulum ke semua tenant yang sudah ada.
 *
 * Permission baru:
 *   - master_data.kurikulum.view   → Lihat daftar kurikulum yang tersedia
 *   - master_data.kurikulum.manage → Tambah/edit kurikulum custom sekolah
 *
 * Assignment per role (mengikuti pola dari 2026_08_31_000001):
 *   operator  → view + manage  (full access)
 *   kepsek    → view           (read only — kurikulum adalah kebijakan sekolah)
 *   wakasek   → view + manage  (wakasek biasanya kelola kurikulum)
 *   guru      → view           (guru perlu tahu kurikulum kelas yang diajar)
 *   wali_kelas → view          (sama dengan guru)
 *
 * Tenant lama diupdate lewat migration ini (tidak perlu deploy ulang).
 * Tenant baru otomatis dapat permission ini via SchoolSeeder.
 */
return new class extends Migration {
    public function up(): void
    {
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            $viewId = $this->firstOrCreatePermission($schoolId, 'master_data.kurikulum.view', 'Lihat Kurikulum');
            $manageId = $this->firstOrCreatePermission($schoolId, 'master_data.kurikulum.manage', 'Kelola Kurikulum');

            $this->assignToRole($schoolId, 'operator', [$viewId, $manageId]);
            $this->assignToRole($schoolId, 'kepsek', [$viewId]);
            $this->assignToRole($schoolId, 'wakasek', [$viewId, $manageId]);
            $this->assignToRole($schoolId, 'guru', [$viewId]);
            $this->assignToRole($schoolId, 'wali_kelas', [$viewId]);
        }
    }

    public function down(): void
    {
        $permIds = DB::table('permissions')
            ->whereIn('slug', [
                'master_data.kurikulum.view',
                'master_data.kurikulum.manage',
            ])
            ->pluck('id');

        DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('id', $permIds)->delete();
    }

    // ── Helpers (pola identik dengan 2026_08_31_000001) ──────────────────────

    private function firstOrCreatePermission(int $schoolId, string $slug, string $nama): int
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
            'modul' => 'master_data',
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