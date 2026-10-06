<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Permission workflow implementasi kurikulum (per sekolah), mengikuti pola
 * workflow Tahun Ajaran (2026_09_15_000001):
 *
 *   master_data.kurikulum.review    → Wakasek  (ajukan struktur ke review)
 *   master_data.kurikulum.approve   → Kepsek   (setujui / tolak)
 *   master_data.kurikulum.activate  → Kepsek   (aktifkan)
 *   master_data.kurikulum.complete  → Wakasek  (selesaikan)
 *
 * Operator TIDAK mendapat satupun (domain Wakasek & Kepsek). Migration ini juga
 * mencabut jika sudah terlanjur ter-assign (mis. oleh command SyncPermissions).
 *
 * Idempotent.
 */
return new class extends Migration {
    private const PERMISSIONS = [
        'master_data.kurikulum.review' => 'Ajukan Struktur Kurikulum ke Review',
        'master_data.kurikulum.approve' => 'Approve / Reject Struktur Kurikulum',
        'master_data.kurikulum.activate' => 'Aktifkan Struktur Kurikulum',
        'master_data.kurikulum.complete' => 'Selesaikan Struktur Kurikulum',
    ];

    public function up(): void
    {
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            $id = [];
            foreach (self::PERMISSIONS as $slug => $nama) {
                $id[$slug] = $this->firstOrCreatePermission($schoolId, $slug, $nama);
            }

            $this->assignToRole($schoolId, 'wakasek', [
                $id['master_data.kurikulum.review'],
                $id['master_data.kurikulum.complete'],
            ]);

            $this->assignToRole($schoolId, 'kepsek', [
                $id['master_data.kurikulum.approve'],
                $id['master_data.kurikulum.activate'],
            ]);

            // Pastikan operator bersih
            $operatorId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', 'operator')
                ->value('id');

            if ($operatorId) {
                DB::table('role_permissions')
                    ->where('role_id', $operatorId)
                    ->whereIn('permission_id', array_values($id))
                    ->delete();
            }
        }
    }

    public function down(): void
    {
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            $permIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', array_keys(self::PERMISSIONS))
                ->pluck('id');

            DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
            DB::table('permissions')->whereIn('id', $permIds)->delete();
        }
    }

    private function firstOrCreatePermission(int $schoolId, string $slug, string $nama): int
    {
        $existing = DB::table('permissions')
            ->where('school_id', $schoolId)
            ->where('slug', $slug)
            ->value('id');

        if ($existing) {
            return (int) $existing;
        }

        return (int) DB::table('permissions')->insertGetId([
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
