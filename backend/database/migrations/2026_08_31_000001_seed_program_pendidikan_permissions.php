<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seed permission master_data.program.view dan master_data.program.manage
 * ke semua tenant yang sudah ada.
 *
 * Context:
 *   Route program-pendidikan sebelumnya menggunakan permission
 *   master_data.kelas.view/manage (salah — melanggar RBAC standard).
 *   Migration ini membuat permission baru dan assign ke:
 *     - operator     → view + manage (via $all di seeder, tapi tenant lama harus di-sync)
 *     - kepsek       → view only
 *     - wakasek      → view + manage
 *
 *   Tidak mengubah permission kelas — tidak ada breaking change.
 */
return new class extends Migration {
    public function up(): void
    {
        // Ambil semua school_id yang ada
        $schoolIds = DB::table('schools')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            // 1. Buat atau ambil permission untuk school ini
            $viewId = $this->firstOrCreatePermission($schoolId, 'master_data.program.view', 'Lihat Program Pendidikan');
            $manageId = $this->firstOrCreatePermission($schoolId, 'master_data.program.manage', 'Kelola Program Pendidikan');

            // 2. Assign ke role berdasarkan slug
            $this->assignToRole($schoolId, 'operator', [$viewId, $manageId]);
            $this->assignToRole($schoolId, 'kepsek', [$viewId]);
            $this->assignToRole($schoolId, 'wakasek', [$viewId, $manageId]);
        }
    }

    public function down(): void
    {
        // Hapus permission baru — detach dari semua role dulu
        DB::table('permissions')
            ->whereIn('slug', ['master_data.program.view', 'master_data.program.manage'])
            ->get(['id'])
            ->each(function ($perm) {
                DB::table('role_permissions')->where('permission_id', $perm->id)->delete();
            });

        DB::table('permissions')
            ->whereIn('slug', ['master_data.program.view', 'master_data.program.manage'])
            ->delete();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
            return; // role belum ada di tenant ini — skip
        }

        foreach ($permissionIds as $permId) {
            // Gunakan insertOrIgnore — idempotent
            DB::table('role_permissions')->insertOrIgnore([
                'role_id' => $roleId,
                'permission_id' => $permId,
                'school_id' => $schoolId,
            ]);
        }
    }
};