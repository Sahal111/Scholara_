<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\School;
use App\Models\SchoolDomain;
use App\Models\SchoolSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seed satu sekolah dengan seluruh data default-nya:
 * - School record
 * - Domain
 * - School settings
 * - Role default (system roles)
 * - Permission default (semua modul)
 * - Mapping role → permission
 * - User operator pertama
 *
 * Seeder ini juga dipakai oleh SchoolProvisioningService saat sekolah baru
 * didaftarkan dari production (bukan hanya untuk dev).
 */
class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $school = $this->createSchool();
        $this->createDomain($school);
        $this->createSettings($school);

        $permissions = $this->createPermissions($school);
        $roles = $this->createRoles($school);
        $this->assignPermissionsToRoles($roles, $permissions);

        $this->createSuperOperator($school, $roles['operator']);

        $this->command->info("✅ Sekolah '{$school->nama}' berhasil di-seed.");
        $this->command->info("   👤 Login: admin@minurulhuda3.sch.id / password: password");
    }

    // ────────────────────────────────────────────────────────

    private function createSchool(): School
    {
        return School::create([
            'nama' => 'MI Nurul Huda 3',
            'npsn' => '60717525',
            'jenis' => 'MI',
            'jenjang' => 'dasar',
            'kurikulum' => School::KURIKULUM_MERDEKA,
            'status' => 'active',
        ]);
    }

    private function createDomain(School $school): void
    {
        SchoolDomain::create([
            'school_id' => $school->id,
            'domain' => 'minurulhuda3.siakad.id',
            'is_primary' => true,
        ]);
    }

    private function createSettings(School $school): void
    {
        $defaults = [
            ['key' => 'sekolah.nama_lengkap', 'value' => 'MI Nurul Huda 3', 'grup' => 'sekolah'],
            ['key' => 'sekolah.nama_singkat', 'value' => 'MIN Huda 3', 'grup' => 'sekolah'],
            ['key' => 'sekolah.alamat', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.kota', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.provinsi', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.no_telp', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.email', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'akademik.kkm_default', 'value' => '70', 'grup' => 'akademik'],
            ['key' => 'akademik.kurikulum', 'value' => 'Merdeka', 'grup' => 'akademik'],
            ['key' => 'tampilan.primary_color', 'value' => '#2563EB', 'grup' => 'tampilan'],
            ['key' => 'tampilan.theme', 'value' => 'default', 'grup' => 'tampilan'],
        ];

        foreach ($defaults as $setting) {
            SchoolSetting::create(array_merge($setting, ['school_id' => $school->id]));
        }
    }

    private function createPermissions(School $school): array
    {
        $definitions = $this->permissionDefinitions();
        $created = [];

        foreach ($definitions as $def) {
            $permission = Permission::create([
                'school_id' => $school->id,
                'slug' => $def['slug'],
                'nama' => $def['nama'],
                'modul' => $def['modul'],
            ]);

            $created[$def['slug']] = $permission;
        }

        return $created;
    }

    private function createRoles(School $school): array
    {
        $roleDefs = [
            ['slug' => 'operator', 'nama' => 'Operator', 'is_system' => true],
            ['slug' => 'kepsek', 'nama' => 'Kepala Sekolah', 'is_system' => true],
            ['slug' => 'guru', 'nama' => 'Guru', 'is_system' => true],
            ['slug' => 'wali_kelas', 'nama' => 'Wali Kelas', 'is_system' => true],
            ['slug' => 'bendahara', 'nama' => 'Bendahara', 'is_system' => true],
            ['slug' => 'ortu', 'nama' => 'Orang Tua', 'is_system' => true],
            ['slug' => 'siswa', 'nama' => 'Siswa', 'is_system' => true],
            ['slug' => 'admin_ppdb', 'nama' => 'Admin PPDB', 'is_system' => true],
            ['slug' => 'wakasek', 'nama' => 'Wakil Kepala Sekolah', 'is_system' => true],
            ['slug' => 'guru_bk', 'nama' => 'Guru Bimbingan Konseling', 'is_system' => true],
            ['slug' => 'pustakawan', 'nama' => 'Pustakawan', 'is_system' => true],
            ['slug' => 'tata_usaha', 'nama' => 'Tata Usaha', 'is_system' => true],
            ['slug' => 'admin_keuangan', 'nama' => 'Admin Keuangan', 'is_system' => true],
        ];

        $created = [];
        foreach ($roleDefs as $def) {
            $role = Role::create(array_merge($def, [
                'school_id' => $school->id,
                'is_active' => true,
            ]));
            $created[$def['slug']] = $role;
        }

        return $created;
    }

    private function assignPermissionsToRoles(array $roles, array $permissions): void
    {
        $matrix = $this->rolePermissionMatrix();

        foreach ($matrix as $roleSlug => $permSlugs) {
            if (!isset($roles[$roleSlug])) {
                continue;
            }

            $role = $roles[$roleSlug];
            $permIds = collect($permSlugs)
                ->filter(fn($slug) => isset($permissions[$slug]))
                ->map(fn($slug) => $permissions[$slug]->id)
                ->toArray();

            $pivotData = collect($permIds)
                ->mapWithKeys(fn($id) => [$id => ['school_id' => $role->school_id]])
                ->toArray();

            $role->permissions()->sync($pivotData);
        }
    }

    private function createSuperOperator(School $school, Role $role): void
    {
        // Bypass SchoolScope karena school_id belum di-set di container saat seeder
        $user = User::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Admin Sekolah',
            'email' => 'admin@minurulhuda3.sch.id',
            'username' => 'admin',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $user->roles()->attach($role->id, ['school_id' => $school->id]);
    }

    // ────────────────────────────────────────────────────────
    // Permission definitions
    // ────────────────────────────────────────────────────────

    private function permissionDefinitions(): array
    {
        return [
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

            // master_data — kelas, mapel, tahun ajaran
            ['slug' => 'master_data.kelas.view', 'nama' => 'Lihat Kelas', 'modul' => 'master_data'],
            ['slug' => 'master_data.kelas.manage', 'nama' => 'Kelola Kelas', 'modul' => 'master_data'],
            ['slug' => 'master_data.mapel.view', 'nama' => 'Lihat Mata Pelajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.mapel.manage', 'nama' => 'Kelola Mata Pelajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.view', 'nama' => 'Lihat Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.manage', 'nama' => 'Kelola Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.orang_tua.view', 'nama' => 'Lihat Data Orang Tua', 'modul' => 'master_data'],
            ['slug' => 'master_data.orang_tua.manage', 'nama' => 'Kelola Data Orang Tua', 'modul' => 'master_data'],

            // akun
            ['slug' => 'akun.view', 'nama' => 'Lihat Daftar Akun', 'modul' => 'akun'],
            ['slug' => 'akun.create', 'nama' => 'Buat Akun', 'modul' => 'akun'],
            ['slug' => 'akun.update', 'nama' => 'Edit Akun', 'modul' => 'akun'],
            ['slug' => 'akun.delete', 'nama' => 'Hapus Akun', 'modul' => 'akun'],
            ['slug' => 'akun.toggle_active', 'nama' => 'Aktifkan/Nonaktifkan Akun', 'modul' => 'akun'],
            ['slug' => 'akun.reset_password', 'nama' => 'Reset Password Akun', 'modul' => 'akun'],
            ['slug' => 'akun.approve_ortu', 'nama' => 'Approve Registrasi Ortu', 'modul' => 'akun'],
            ['slug' => 'akun.manage_roles', 'nama' => 'Kelola Role Akun', 'modul' => 'akun'],

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

            // keuangan
            ['slug' => 'keuangan.tagihan.view', 'nama' => 'Lihat Tagihan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.tagihan.manage', 'nama' => 'Kelola Tagihan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.pembayaran.view', 'nama' => 'Lihat Pembayaran', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.pembayaran.input', 'nama' => 'Input Pembayaran', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.laporan.view', 'nama' => 'Laporan Keuangan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.export', 'nama' => 'Export Keuangan', 'modul' => 'keuangan'],

            // ppdb
            ['slug' => 'ppdb.pendaftar.view', 'nama' => 'Lihat Pendaftar PPDB', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.update', 'nama' => 'Edit Pendaftar PPDB', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.approve', 'nama' => 'Approve Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.reject', 'nama' => 'Tolak Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pengaturan.manage', 'nama' => 'Pengaturan PPDB', 'modul' => 'ppdb'],

            // akademik
            ['slug' => 'akademik.nilai.input', 'nama' => 'Input Nilai', 'modul' => 'akademik'],
            ['slug' => 'akademik.nilai.view', 'nama' => 'Lihat Nilai', 'modul' => 'akademik'],
            ['slug' => 'akademik.rapor.generate', 'nama' => 'Generate Rapor', 'modul' => 'akademik'],
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

            // siswa portal — hak akses siswa ke data dirinya sendiri
            ['slug' => 'siswa_portal.profil.view', 'nama' => 'Lihat Profil Diri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.profil.update', 'nama' => 'Update Profil Diri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.absensi.view', 'nama' => 'Lihat Absensi Diri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.nilai.view', 'nama' => 'Lihat Nilai Diri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.jadwal.view', 'nama' => 'Lihat Jadwal Pelajaran', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.pengumuman.view', 'nama' => 'Lihat Pengumuman', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.tagihan.view', 'nama' => 'Lihat Tagihan SPP', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.rapor.view', 'nama' => 'Lihat Rapor', 'modul' => 'siswa_portal'],

            // laporan
            ['slug' => 'laporan.guru.view', 'nama' => 'Laporan Guru', 'modul' => 'laporan'],
            ['slug' => 'laporan.siswa.view', 'nama' => 'Laporan Siswa', 'modul' => 'laporan'],
            ['slug' => 'laporan.absensi.view', 'nama' => 'Laporan Absensi', 'modul' => 'laporan'],
            ['slug' => 'laporan.keuangan.view', 'nama' => 'Laporan Keuangan', 'modul' => 'laporan'],
            ['slug' => 'laporan.export', 'nama' => 'Export Laporan', 'modul' => 'laporan'],

            // BK (Bimbingan Konseling)
            ['slug' => 'bk.konseling.view', 'nama' => 'Lihat Data Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.konseling.create', 'nama' => 'Buat Sesi Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.konseling.update', 'nama' => 'Edit Sesi Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.konseling.delete', 'nama' => 'Hapus Sesi Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.catatan.view', 'nama' => 'Lihat Catatan BK', 'modul' => 'bk'],
            ['slug' => 'bk.catatan.create', 'nama' => 'Buat Catatan BK', 'modul' => 'bk'],
            ['slug' => 'bk.catatan.update', 'nama' => 'Edit Catatan BK', 'modul' => 'bk'],
            ['slug' => 'bk.laporan.view', 'nama' => 'Laporan BK', 'modul' => 'bk'],
            ['slug' => 'bk.laporan.export', 'nama' => 'Export Laporan BK', 'modul' => 'bk'],

            // Perpustakaan
            ['slug' => 'perpustakaan.buku.view', 'nama' => 'Lihat Katalog Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.create', 'nama' => 'Tambah Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.update', 'nama' => 'Edit Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.delete', 'nama' => 'Hapus Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.peminjaman.view', 'nama' => 'Lihat Peminjaman', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.peminjaman.manage', 'nama' => 'Kelola Peminjaman', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.laporan.view', 'nama' => 'Laporan Perpustakaan', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.laporan.export', 'nama' => 'Export Laporan Perpustakaan', 'modul' => 'perpustakaan'],

            // Surat & Tata Usaha
            ['slug' => 'surat.view', 'nama' => 'Lihat Surat', 'modul' => 'surat'],
            ['slug' => 'surat.create', 'nama' => 'Buat Surat', 'modul' => 'surat'],
            ['slug' => 'surat.update', 'nama' => 'Edit Surat', 'modul' => 'surat'],
            ['slug' => 'surat.delete', 'nama' => 'Hapus Surat', 'modul' => 'surat'],
            ['slug' => 'surat.arsip', 'nama' => 'Arsip Surat', 'modul' => 'surat'],
            ['slug' => 'surat.legalisir', 'nama' => 'Legalisir Dokumen', 'modul' => 'surat'],
        ];
    }

    // ────────────────────────────────────────────────────────
    // Role → Permission matrix
    // ────────────────────────────────────────────────────────

    private function rolePermissionMatrix(): array
    {
        $all = array_column($this->permissionDefinitions(), 'slug');

        return [
            'operator' => $all,

            'kepsek' => [
                'master_data.guru.view',
                'master_data.guru.export',
                'master_data.guru.verify',
                'master_data.siswa.view',
                'master_data.siswa.export',
                'master_data.kelas.view',
                'master_data.mapel.view',
                'master_data.tahun_ajaran.view',
                'master_data.orang_tua.view',
                'absensi.view_all',
                'absensi.rekap',
                'dms.view_all',
                'dms.approve',
                'dms.download',
                'dms.bulk_download',
                'pengumuman.view',
                'pengumuman.create',
                'pengumuman.update',
                'pengumuman.delete',
                'laporan.guru.view',
                'laporan.siswa.view',
                'laporan.absensi.view',
                'laporan.keuangan.view',
                'laporan.export',
                'akademik.rapor.view',
                'akademik.kalender.manage',
                'pengaturan.view',
            ],

            'guru' => [
                'master_data.siswa.view',
                'absensi.input',
                'absensi.edit',
                'absensi.view_kelas_sendiri',
                'dms.upload',
                'dms.view_own',
                'dms.download',
                'pengumuman.view',
                'akademik.nilai.input',
                'akademik.nilai.view',
            ],

            'wali_kelas' => [
                'master_data.siswa.view',
                'absensi.input',
                'absensi.edit',
                'absensi.view_kelas_sendiri',
                'dms.upload',
                'dms.view_own',
                'dms.download',
                'pengumuman.view',
                'akademik.nilai.input',
                'akademik.nilai.view',
                'akademik.rapor.view',
            ],

            'bendahara' => [
                'master_data.siswa.view',
                'keuangan.tagihan.view',
                'keuangan.tagihan.manage',
                'keuangan.pembayaran.view',
                'keuangan.pembayaran.input',
                'keuangan.laporan.view',
                'keuangan.export',
                'laporan.keuangan.view',
                'laporan.export',
            ],

            'ortu' => [
                'master_data.siswa.view',
                'absensi.view_kelas_sendiri',
                'pengumuman.view',
                'siswa_portal.tagihan.view',
                'siswa_portal.rapor.view',
            ],

            'siswa' => [
                'siswa_portal.profil.view',
                'siswa_portal.profil.update',
                'siswa_portal.absensi.view',
                'siswa_portal.nilai.view',
                'siswa_portal.jadwal.view',
                'siswa_portal.pengumuman.view',
                'siswa_portal.tagihan.view',
                'siswa_portal.rapor.view',
            ],

            'admin_ppdb' => [
                'master_data.siswa.view',
                'ppdb.pendaftar.view',
                'ppdb.pendaftar.update',
                'ppdb.pendaftar.approve',
                'ppdb.pendaftar.reject',
                'ppdb.pengaturan.manage',
            ],

            // Wakil Kepala Sekolah — hampir setara kepsek, tambahan manage kurikulum/kesiswaan
            'wakasek' => [
                'master_data.guru.view',
                'master_data.guru.export',
                'master_data.guru.verify',
                'master_data.siswa.view',
                'master_data.siswa.export',
                'master_data.kelas.view',
                'master_data.kelas.manage',
                'master_data.mapel.view',
                'master_data.mapel.manage',
                'master_data.tahun_ajaran.view',
                'master_data.orang_tua.view',
                'absensi.view_all',
                'absensi.rekap',
                'dms.view_all',
                'dms.approve',
                'dms.download',
                'dms.bulk_download',
                'pengumuman.view',
                'pengumuman.create',
                'pengumuman.update',
                'pengumuman.delete',
                'laporan.guru.view',
                'laporan.siswa.view',
                'laporan.absensi.view',
                'laporan.export',
                'akademik.jadwal.manage',
                'akademik.rapor.view',
                'akademik.kalender.manage',
                'pengaturan.view',
            ],

            // Guru BK — akses konseling, tidak bisa lihat nilai akademik
            'guru_bk' => [
                'master_data.siswa.view',
                'absensi.view_all',
                'absensi.rekap',
                'dms.upload',
                'dms.view_own',
                'dms.download',
                'pengumuman.view',
                'bk.konseling.view',
                'bk.konseling.create',
                'bk.konseling.update',
                'bk.catatan.view',
                'bk.catatan.create',
                'bk.laporan.view',
                'bk.laporan.export',
            ],

            // Pustakawan — kelola perpustakaan, tidak ada akses akademik
            'pustakawan' => [
                'master_data.siswa.view',
                'pengumuman.view',
                'perpustakaan.buku.view',
                'perpustakaan.buku.create',
                'perpustakaan.buku.update',
                'perpustakaan.buku.delete',
                'perpustakaan.peminjaman.view',
                'perpustakaan.peminjaman.manage',
                'perpustakaan.laporan.view',
                'perpustakaan.laporan.export',
            ],

            // Tata Usaha — surat, arsip, legalisir, tidak akses data akademik sensitif
            'tata_usaha' => [
                'master_data.siswa.view',
                'master_data.guru.view',
                'master_data.orang_tua.view',
                'dms.upload',
                'dms.view_all',
                'dms.download',
                'dms.bulk_download',
                'pengumuman.view',
                'pengumuman.create',
                'surat.view',
                'surat.create',
                'surat.update',
                'surat.delete',
                'surat.arsip',
                'surat.legalisir',
                'laporan.siswa.view',
                'laporan.guru.view',
                'laporan.export',
            ],

            // Admin Keuangan — input tagihan & invoice, tidak bisa approve/laporan tingkat bendahara
            'admin_keuangan' => [
                'master_data.siswa.view',
                'keuangan.tagihan.view',
                'keuangan.tagihan.manage',
                'keuangan.pembayaran.view',
                'keuangan.pembayaran.input',
                'keuangan.export',
            ],
        ];
    }
}