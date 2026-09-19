<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Sync permission definitions ke semua sekolah yang sudah ada di database.
 *
 * Berguna ketika ada permission baru yang ditambahkan ke SchoolSeeder
 * tapi sekolah sudah terdaftar sebelum permission baru itu ada.
 *
 * Jalankan: php artisan permissions:sync
 */
class SyncPermissions extends Command
{
    protected $signature = 'permissions:sync {--school= : Sync hanya untuk school_id tertentu}';
    protected $description = 'Sync permission definitions ke semua sekolah yang ada';

    private array $permissionDefinitions = [
        // master_data — guru
        ['slug' => 'master_data.guru.view', 'nama' => 'Lihat Data Guru', 'modul' => 'master_data'],
        ['slug' => 'master_data.guru.create', 'nama' => 'Tambah Guru', 'modul' => 'master_data'],
        ['slug' => 'master_data.guru.update', 'nama' => 'Edit Guru', 'modul' => 'master_data'],
        ['slug' => 'master_data.guru.delete', 'nama' => 'Hapus Guru', 'modul' => 'master_data'],
        ['slug' => 'master_data.guru.import', 'nama' => 'Import Data Guru', 'modul' => 'master_data'],
        ['slug' => 'master_data.guru.export', 'nama' => 'Export Data Guru', 'modul' => 'master_data'],
        ['slug' => 'master_data.guru.verify', 'nama' => 'Verifikasi Data Guru', 'modul' => 'master_data'],

        // master_data — siswa
        ['slug' => 'master_data.siswa.view', 'nama' => 'Lihat Data Siswa', 'modul' => 'master_data'],
        ['slug' => 'master_data.siswa.create', 'nama' => 'Tambah Siswa', 'modul' => 'master_data'],
        ['slug' => 'master_data.siswa.update', 'nama' => 'Edit Siswa', 'modul' => 'master_data'],
        ['slug' => 'master_data.siswa.delete', 'nama' => 'Hapus Siswa', 'modul' => 'master_data'],
        ['slug' => 'master_data.siswa.import', 'nama' => 'Import Data Siswa', 'modul' => 'master_data'],
        ['slug' => 'master_data.siswa.export', 'nama' => 'Export Data Siswa', 'modul' => 'master_data'],

        // master_data — lainnya
        ['slug' => 'master_data.kelas.view', 'nama' => 'Lihat Kelas', 'modul' => 'master_data'],
        ['slug' => 'master_data.kelas.manage', 'nama' => 'Kelola Kelas', 'modul' => 'master_data'],
        ['slug' => 'master_data.mapel.view', 'nama' => 'Lihat Mata Pelajaran', 'modul' => 'master_data'],
        ['slug' => 'master_data.mapel.manage', 'nama' => 'Kelola Mata Pelajaran', 'modul' => 'master_data'],
        ['slug' => 'master_data.tahun_ajaran.view', 'nama' => 'Lihat Tahun Ajaran', 'modul' => 'master_data'],
        ['slug' => 'master_data.tahun_ajaran.manage', 'nama' => 'Kelola Tahun Ajaran', 'modul' => 'master_data'],
        ['slug' => 'master_data.tahun_ajaran.review', 'nama' => 'Submit Tahun Ajaran ke Review', 'modul' => 'master_data'],
        ['slug' => 'master_data.tahun_ajaran.approve', 'nama' => 'Approve / Reject Tahun Ajaran', 'modul' => 'master_data'],
        ['slug' => 'master_data.tahun_ajaran.activate', 'nama' => 'Aktifkan Tahun Ajaran', 'modul' => 'master_data'],
        ['slug' => 'master_data.tahun_ajaran.complete', 'nama' => 'Selesaikan Tahun Ajaran', 'modul' => 'master_data'],
        ['slug' => 'master_data.tahun_ajaran.archive', 'nama' => 'Arsipkan Tahun Ajaran', 'modul' => 'master_data'],

        // master_data — semester (entitas mandiri P1)
        ['slug' => 'master_data.semester.view', 'nama' => 'Lihat Semester', 'modul' => 'master_data'],
        ['slug' => 'master_data.semester.manage', 'nama' => 'Kelola Semester', 'modul' => 'master_data'],
        ['slug' => 'master_data.semester.activate', 'nama' => 'Set Semester Aktif', 'modul' => 'master_data'],
        ['slug' => 'master_data.semester.archive', 'nama' => 'Arsipkan Semester', 'modul' => 'master_data'],

        ['slug' => 'master_data.orang_tua.view', 'nama' => 'Lihat Data Orang Tua', 'modul' => 'master_data'],
        ['slug' => 'master_data.orang_tua.manage', 'nama' => 'Kelola Data Orang Tua', 'modul' => 'master_data'],

        // akun
        ['slug' => 'akun.view', 'nama' => 'Lihat Akun Pengguna', 'modul' => 'akun'],
        ['slug' => 'akun.create', 'nama' => 'Buat Akun Pengguna', 'modul' => 'akun'],
        ['slug' => 'akun.update', 'nama' => 'Edit Akun Pengguna', 'modul' => 'akun'],
        ['slug' => 'akun.delete', 'nama' => 'Hapus Akun Pengguna', 'modul' => 'akun'],
        ['slug' => 'akun.toggle_active', 'nama' => 'Aktif/Nonaktif Akun', 'modul' => 'akun'],
        ['slug' => 'akun.reset_password', 'nama' => 'Reset Password Pengguna', 'modul' => 'akun'],
        ['slug' => 'akun.approve_ortu', 'nama' => 'Approve Registrasi Ortu', 'modul' => 'akun'],

        // absensi
        ['slug' => 'absensi.input', 'nama' => 'Input Absensi', 'modul' => 'absensi'],
        ['slug' => 'absensi.edit', 'nama' => 'Edit Absensi', 'modul' => 'absensi'],
        ['slug' => 'absensi.view_kelas_sendiri', 'nama' => 'Lihat Absensi Kelas Sendiri', 'modul' => 'absensi'],
        ['slug' => 'absensi.view_all', 'nama' => 'Lihat Semua Absensi', 'modul' => 'absensi'],
        ['slug' => 'absensi.rekap', 'nama' => 'Rekap & Export Absensi', 'modul' => 'absensi'],

        // dms
        ['slug' => 'dms.upload', 'nama' => 'Upload Dokumen', 'modul' => 'dms'],
        ['slug' => 'dms.view_own', 'nama' => 'Lihat Dokumen Sendiri', 'modul' => 'dms'],
        ['slug' => 'dms.view_all', 'nama' => 'Lihat Semua Dokumen Guru', 'modul' => 'dms'],
        ['slug' => 'dms.approve', 'nama' => 'Approve/Reject Dokumen', 'modul' => 'dms'],
        ['slug' => 'dms.download', 'nama' => 'Download Dokumen', 'modul' => 'dms'],
        ['slug' => 'dms.delete', 'nama' => 'Hapus Dokumen', 'modul' => 'dms'],
        ['slug' => 'dms.bulk_download', 'nama' => 'Bulk Download Dokumen', 'modul' => 'dms'],

        // akademik
        ['slug' => 'akademik.nilai.input', 'nama' => 'Input Nilai', 'modul' => 'akademik'],
        ['slug' => 'akademik.nilai.view', 'nama' => 'Lihat Nilai', 'modul' => 'akademik'],
        ['slug' => 'akademik.rapor.view', 'nama' => 'Lihat Rapor', 'modul' => 'akademik'],
        ['slug' => 'akademik.jadwal.manage', 'nama' => 'Kelola Jadwal', 'modul' => 'akademik'],
        ['slug' => 'akademik.kalender.manage', 'nama' => 'Kelola Kalender', 'modul' => 'akademik'],

        // pengumuman
        ['slug' => 'pengumuman.view', 'nama' => 'Lihat Pengumuman', 'modul' => 'pengumuman'],
        ['slug' => 'pengumuman.create', 'nama' => 'Buat Pengumuman', 'modul' => 'pengumuman'],
        ['slug' => 'pengumuman.update', 'nama' => 'Edit Pengumuman', 'modul' => 'pengumuman'],
        ['slug' => 'pengumuman.delete', 'nama' => 'Hapus Pengumuman', 'modul' => 'pengumuman'],

        // pengaturan
        ['slug' => 'pengaturan.view', 'nama' => 'Lihat Pengaturan', 'modul' => 'pengaturan'],
        ['slug' => 'pengaturan.update', 'nama' => 'Edit Pengaturan', 'modul' => 'pengaturan'],
        ['slug' => 'pengaturan.rbac.manage', 'nama' => 'Kelola Role & Permission', 'modul' => 'pengaturan'],

        // laporan
        ['slug' => 'laporan.guru.view', 'nama' => 'Laporan Guru', 'modul' => 'laporan'],
        ['slug' => 'laporan.siswa.view', 'nama' => 'Laporan Siswa', 'modul' => 'laporan'],
        ['slug' => 'laporan.absensi.view', 'nama' => 'Laporan Absensi', 'modul' => 'laporan'],
        ['slug' => 'laporan.keuangan.view', 'nama' => 'Laporan Keuangan', 'modul' => 'laporan'],
        ['slug' => 'laporan.export', 'nama' => 'Export Laporan', 'modul' => 'laporan'],
    ];

    public function handle(): int
    {
        $schoolId = $this->option('school');

        $schools = $schoolId
            ? DB::table('schools')->where('id', $schoolId)->get()
            : DB::table('schools')->whereNull('deleted_at')->get();

        if ($schools->isEmpty()) {
            $this->warn('Tidak ada sekolah ditemukan.');
            return 0;
        }

        foreach ($schools as $school) {
            $this->info("Syncing permissions untuk: {$school->nama} (ID: {$school->id})");
            $this->syncForSchool($school->id);
        }

        $this->info('✅ Sync selesai.');
        return 0;
    }

    /**
     * Permission yang TIDAK boleh di-auto-assign ke operator.
     * Ini domain Wakasek & Kepsek — bukan administrasi harian operator.
     */
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

    private function syncForSchool(int $schoolId): void
    {
        $existing = DB::table('permissions')
            ->where('school_id', $schoolId)
            ->pluck('slug')
            ->toArray();

        $toInsert = [];
        foreach ($this->permissionDefinitions as $def) {
            if (!in_array($def['slug'], $existing)) {
                $toInsert[] = array_merge($def, [
                    'school_id' => $schoolId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if (empty($toInsert)) {
            $this->line("   ✓ Semua permission sudah ada.");
            return;
        }

        DB::table('permissions')->insert($toInsert);
        $this->line("   + Ditambahkan " . count($toInsert) . " permission baru.");

        // Auto-assign ke operator — KECUALI yang masuk blacklist domain Wakasek/Kepsek
        $superOpRole = DB::table('roles')
            ->where('school_id', $schoolId)
            ->where('slug', 'operator')
            ->first();

        if ($superOpRole) {
            $allowedSlugs = array_diff(
                array_column($toInsert, 'slug'),
                $this->operatorBlacklist
            );

            if (!empty($allowedSlugs)) {
                $newPermIds = DB::table('permissions')
                    ->where('school_id', $schoolId)
                    ->whereIn('slug', $allowedSlugs)
                    ->pluck('id');

                $pivotData = $newPermIds->map(fn($permId) => [
                    'role_id' => $superOpRole->id,
                    'permission_id' => $permId,
                ])->toArray();

                DB::table('role_permissions')->insertOrIgnore($pivotData);
                $this->line('   + Ditambahkan ke role operator (' . count($allowedSlugs) . ' permission).');
            }

            // Cabut ulang blacklist dari operator — jaga-jaga kalau sebelumnya
            // sudah terlanjur ter-assign (misal dari run SyncPermissions lama)
            $blacklistPermIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', $this->operatorBlacklist)
                ->pluck('id');

            if ($blacklistPermIds->isNotEmpty()) {
                $deleted = DB::table('role_permissions')
                    ->where('role_id', $superOpRole->id)
                    ->whereIn('permission_id', $blacklistPermIds)
                    ->delete();

                if ($deleted > 0) {
                    $this->line("   - Dicabut {$deleted} permission dari operator (domain Wakasek/Kepsek).");
                }
            }
        }
    }
}