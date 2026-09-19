<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix: SyncPermissions command selama ini auto-assign SEMUA permission baru
 * ke operator — termasuk domain Wakasek (review, complete) dan Kepsek
 * (approve, activate). Migration ini cabut permission yang salah ter-assign.
 *
 * Root cause: SyncPermissions::syncForSchool() tidak punya blacklist,
 * sehingga permission baru apapun langsung masuk ke operator.
 * Fix permanen sudah ada di SyncPermissions.php (tambah $operatorBlacklist).
 *
 * Migration ini hanya untuk membersihkan data yang sudah salah di DB.
 */
return new class extends Migration {

    private array $operatorBlacklist = [
        'master_data.tahun_ajaran.review',
        'master_data.tahun_ajaran.approve',
        'master_data.tahun_ajaran.activate',
        'master_data.tahun_ajaran.complete',
        'master_data.semester.activate',
        'master_data.kelas.manage',
        'master_data.mapel.manage',
        'master_data.program.manage',
        'master_data.kurikulum.manage',
        'akademik.jadwal.manage',
        'akademik.kalender.manage',
        'akademik.rapor.manage',
        'master_data.guru.verify',
    ];

    public function up(): void
    {
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            $operatorRoleId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', 'operator')
                ->value('id');

            if (!$operatorRoleId) {
                continue;
            }

            $blacklistPermIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', $this->operatorBlacklist)
                ->pluck('id');

            if ($blacklistPermIds->isEmpty()) {
                continue;
            }

            $deleted = DB::table('role_permissions')
                ->where('role_id', $operatorRoleId)
                ->whereIn('permission_id', $blacklistPermIds)
                ->delete();

            if ($deleted > 0) {
                \Illuminate\Support\Facades\Log::info(
                    "Migration 2026_09_19_000002: Cabut {$deleted} permission dari operator school_id={$schoolId}"
                );
            }
        }
    }

    public function down(): void
    {
        // Tidak perlu rollback — ini fix data, bukan schema change
    }
};