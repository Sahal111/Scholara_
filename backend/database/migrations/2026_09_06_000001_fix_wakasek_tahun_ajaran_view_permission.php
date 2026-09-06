<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix: Sync seluruh permission wakasek dari SchoolSeeder ke DB existing.
 *
 * Masalah: Migration 2026_09_04 hanya assign sebagian kecil permission ke wakasek.
 * Wakasek adalah role baru — DB lama tidak dapat permission dari seeder karena
 * seeder hanya jalan saat fresh install. Akibatnya wakasek 403 di hampir semua halaman.
 *
 * Solusi: insertOrIgnore seluruh permission yang seharusnya dimiliki wakasek.
 * Idempotent — aman dijalankan berkali-kali.
 */
return new class extends Migration {

    /**
     * Seluruh permission wakasek — sinkron dengan SchoolSeeder.php
     */
    private array $wakasekPermissions = [
        // Data guru & siswa — view only
        'master_data.guru.view',
        'master_data.guru.export',
        'master_data.guru.verify',
        'master_data.siswa.view',
        'master_data.siswa.export',
        'master_data.orang_tua.view',

        // Kebijakan akademik — full manage
        'master_data.kelas.view',
        'master_data.kelas.manage',
        'master_data.mapel.view',
        'master_data.mapel.manage',
        'master_data.tahun_ajaran.view',
        'master_data.tahun_ajaran.manage',
        'master_data.program.view',
        'master_data.program.manage',
        'master_data.kurikulum.view',
        'master_data.kurikulum.manage',

        // Akademik operasional
        'akademik.jadwal.view',
        'akademik.jadwal.manage',
        'akademik.kalender.manage',
        'akademik.nilai.view',
        'akademik.nilai.view_all',
        'akademik.rapor.view',
        'akademik.rapor.manage',

        // Absensi & laporan — oversight
        'absensi.view_all',
        'absensi.rekap',
        'laporan.guru.view',
        'laporan.siswa.view',
        'laporan.absensi.view',
        'laporan.export',

        // Dokumen & pengumuman
        'dms.view_all',
        'dms.approve',
        'dms.download',
        'dms.bulk_download',
        'pengumuman.view',
        'pengumuman.create',
        'pengumuman.update',
        'pengumuman.delete',

        // Pengaturan — view only
        'pengaturan.view',
    ];

    public function up(): void
    {
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            $roleId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', 'wakasek')
                ->value('id');

            if (!$roleId) {
                continue;
            }

            // Ambil ID semua permission yang ada di DB untuk sekolah ini
            $permIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', $this->wakasekPermissions)
                ->pluck('id');

            foreach ($permIds as $permId) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permId,
                    'school_id' => $schoolId,
                ]);
            }
        }
    }

    public function down(): void
    {
        // Tidak di-rollback — ini adalah state yang benar sesuai desain RBAC
    }
};