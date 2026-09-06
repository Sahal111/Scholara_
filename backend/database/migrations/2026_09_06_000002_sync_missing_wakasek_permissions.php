<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Sync permission wakasek yang tidak ter-apply karena migration sebelumnya
 * (2026_09_06_000001_fix_wakasek_tahun_ajaran_view_permission.php) sudah
 * pernah dijalankan saat isinya lebih sedikit, lalu file-nya diedit
 * untuk menambah permission baru — tapi Laravel tidak akan re-run migration
 * yang sudah tercatat di tabel migrations.
 *
 * Permission yang BARU ditambahkan ke file lama (belum ada di DB):
 *   - master_data.program.manage
 *   - akademik.nilai.view
 *   - akademik.nilai.view_all
 *   - akademik.rapor.view
 *   - akademik.rapor.manage
 *
 * Migration ini: insertOrIgnore — aman dijalankan berkali-kali.
 * down(): tidak di-rollback — ini state yang benar sesuai desain RBAC.
 */
return new class extends Migration {

    /**
     * Permission yang dipastikan ada di DB untuk role wakasek.
     * Daftar lengkap sesuai SchoolSeeder — superset dari migration lama.
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
        'master_data.program.manage',   // ← belum ter-apply ke DB
        'master_data.kurikulum.view',
        'master_data.kurikulum.manage',

        // Akademik operasional
        'akademik.jadwal.view',
        'akademik.jadwal.manage',
        'akademik.kalender.manage',
        'akademik.nilai.view',          // ← belum ter-apply ke DB
        'akademik.nilai.view_all',      // ← belum ter-apply ke DB
        'akademik.rapor.view',          // ← belum ter-apply ke DB
        'akademik.rapor.manage',        // ← belum ter-apply ke DB

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
        // Tidak di-rollback — ini adalah state yang benar sesuai desain RBAC.
    }
};