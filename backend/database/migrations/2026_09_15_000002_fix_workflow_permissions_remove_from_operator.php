<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix: Cabut permission workflow TA dari operator.
 *
 * Bug: Migration sebelumnya membuat permission review/approve/activate/complete
 * dan assign ke wakasek & kepsek dengan benar, TAPI operator di SchoolSeeder
 * menggunakan pola `array_filter($all, ...)` — sehingga semua permission baru
 * yang tidak ada di blacklist-nya otomatis masuk ke operator juga.
 *
 * Fix ini:
 *   1. Cabut master_data.tahun_ajaran.review   dari operator
 *   2. Cabut master_data.tahun_ajaran.approve  dari operator
 *   3. Cabut master_data.tahun_ajaran.activate dari operator
 *   4. Cabut master_data.tahun_ajaran.complete dari operator
 *   5. Pastikan kepsek punya approve + activate (idempotent)
 *   6. Pastikan wakasek punya review + complete (idempotent)
 *   7. Tambah master_data.tahun_ajaran.manage ke operator jika belum ada
 *      (operator butuh ini untuk CRUD draft)
 */
return new class extends Migration {

    // Slug yang TIDAK boleh dimiliki operator
    private array $operatorBlacklist = [
        'master_data.tahun_ajaran.review',
        'master_data.tahun_ajaran.approve',
        'master_data.tahun_ajaran.activate',
        'master_data.tahun_ajaran.complete',
    ];

    public function up(): void
    {
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {

            // ── 1. Cabut workflow permissions dari operator ───────────────────
            $operatorRoleId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', 'operator')
                ->value('id');

            if ($operatorRoleId) {
                $blacklistPermIds = DB::table('permissions')
                    ->where('school_id', $schoolId)
                    ->whereIn('slug', $this->operatorBlacklist)
                    ->pluck('id');

                DB::table('role_permissions')
                    ->where('role_id', $operatorRoleId)
                    ->whereIn('permission_id', $blacklistPermIds)
                    ->delete();
            }

            // ── 2. Pastikan operator punya manage (untuk CRUD draft) ──────────
            $managePermId = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->where('slug', 'master_data.tahun_ajaran.manage')
                ->value('id');

            if ($managePermId && $operatorRoleId) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $operatorRoleId,
                    'permission_id' => $managePermId,
                    'school_id' => $schoolId,
                ]);
            }

            // ── 3. Pastikan kepsek punya approve + activate ───────────────────
            $kepsekRoleId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', 'kepsek')
                ->value('id');

            if ($kepsekRoleId) {
                foreach (['master_data.tahun_ajaran.approve', 'master_data.tahun_ajaran.activate', 'master_data.tahun_ajaran.view'] as $slug) {
                    $permId = DB::table('permissions')
                        ->where('school_id', $schoolId)
                        ->where('slug', $slug)
                        ->value('id');

                    if ($permId) {
                        DB::table('role_permissions')->insertOrIgnore([
                            'role_id' => $kepsekRoleId,
                            'permission_id' => $permId,
                            'school_id' => $schoolId,
                        ]);
                    }
                }
            }

            // ── 4. Pastikan wakasek punya review + complete ───────────────────
            $wakasekRoleId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', 'wakasek')
                ->value('id');

            if ($wakasekRoleId) {
                foreach (['master_data.tahun_ajaran.review', 'master_data.tahun_ajaran.complete', 'master_data.tahun_ajaran.view'] as $slug) {
                    $permId = DB::table('permissions')
                        ->where('school_id', $schoolId)
                        ->where('slug', $slug)
                        ->value('id');

                    if ($permId) {
                        DB::table('role_permissions')->insertOrIgnore([
                            'role_id' => $wakasekRoleId,
                            'permission_id' => $permId,
                            'school_id' => $schoolId,
                        ]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        // Tidak perlu rollback — permission assignment bisa diatur ulang
        // via SchoolSeeder atau SyncPermissions command
    }
};