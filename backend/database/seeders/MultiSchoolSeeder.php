<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\School;
use App\Models\SchoolDomain;
use App\Models\SchoolSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Seed multiple schools untuk keperluan dev & demo multi-tenant.
 * Mencakup semua jenjang: SD, SMP, SMA, SMK, MI, MTs, MA, MAK.
 *
 * ⚡ IDEMPOTENT — aman dijalankan berulang kali (skip jika NPSN sudah ada).
 *
 * Akun admin masing-masing sekolah: admin@{subdomain}.sch.id / password
 */
class MultiSchoolSeeder extends Seeder
{
    public function run(): void
    {
        $schools = $this->schoolDefinitions();

        foreach ($schools as $def) {
            $this->seedSchool($def);
        }

        $this->command->info('✅ MultiSchoolSeeder selesai — ' . count($schools) . ' sekolah di-seed.');
    }

    // ─────────────────────────────────────────────────────────────────────
    // Definisi sekolah-sekolah demo
    // ─────────────────────────────────────────────────────────────────────

    private function schoolDefinitions(): array
    {
        return [
            [
                'nama' => 'SD Negeri Budi Utama',
                'npsn' => '10000001',
                'jenis' => 'SD',
                'jenjang' => 'dasar',
                'subdomain' => 'sdbudiutama',
                'operator' => ['name' => 'Admin SD Budi Utama', 'username' => 'admin_sd'],
            ],
            [
                'nama' => 'SMP Negeri 1 Nusantara',
                'npsn' => '20000001',
                'jenis' => 'SMP',
                'jenjang' => 'menengah_pertama',
                'subdomain' => 'smpn1nusantara',
                'operator' => ['name' => 'Admin SMP N 1', 'username' => 'admin_smp'],
            ],
            [
                'nama' => 'SMA Negeri 1 Merdeka',
                'npsn' => '30000001',
                'jenis' => 'SMA',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'sman1merdeka',
                'operator' => ['name' => 'Admin SMA N 1', 'username' => 'admin_sma'],
            ],
            [
                'nama' => 'SMK Negeri 2 Teknologi',
                'npsn' => '30000002',
                'jenis' => 'SMK',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'smkn2teknologi',
                'operator' => ['name' => 'Admin SMK N 2', 'username' => 'admin_smk'],
            ],
            [
                'nama' => 'MI Al-Ikhlas',
                'npsn' => '60000001',
                'jenis' => 'MI',
                'jenjang' => 'dasar',
                'subdomain' => 'mialikhlasdev',
                'operator' => ['name' => 'Admin MI Al-Ikhlas', 'username' => 'admin_mi'],
            ],
            [
                'nama' => 'MTs Darul Ulum',
                'npsn' => '70000001',
                'jenis' => 'MTs',
                'jenjang' => 'menengah_pertama',
                'subdomain' => 'mtsdarululum',
                'operator' => ['name' => 'Admin MTs Darul Ulum', 'username' => 'admin_mts'],
            ],
            [
                'nama' => 'MA Nurul Huda',
                'npsn' => '80000001',
                'jenis' => 'MA',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'manurulhuda',
                'operator' => ['name' => 'Admin MA Nurul Huda', 'username' => 'admin_ma'],
            ],
            [
                'nama' => 'MAK Farmasi Al-Hikmah',
                'npsn' => '80000002',
                'jenis' => 'MAK',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'makalhikmah',
                'operator' => ['name' => 'Admin MAK Al-Hikmah', 'username' => 'admin_mak'],
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    // Core: seed satu sekolah
    // ─────────────────────────────────────────────────────────────────────

    private function seedSchool(array $def): void
    {
        // Skip jika NPSN sudah ada (idempotent)
        $exists = School::withoutGlobalScopes()
            ->where('npsn', $def['npsn'])
            ->exists();

        if ($exists) {
            $this->command->warn("⏭️  Skip '{$def['nama']}' — NPSN {$def['npsn']} sudah ada.");
            return;
        }

        DB::transaction(function () use ($def) {
            // 1. Buat sekolah
            $school = School::create([
                'nama' => $def['nama'],
                'npsn' => $def['npsn'],
                'jenis' => $def['jenis'],
                'jenjang' => $def['jenjang'],
                'status' => 'active',
            ]);

            // 2. Domain
            DB::table('school_domains')->insertOrIgnore([
                'school_id' => $school->id,
                'domain' => "{$def['subdomain']}.siakad.id",
                'is_primary' => true,
                'created_at' => now(),
            ]);

            // 3. Settings default
            $this->createSettings($school, $def['nama']);

            // 4. Permissions & Roles
            $permissions = $this->createPermissions($school);
            $roles = $this->createRoles($school);
            $this->assignPermissionsToRoles($roles, $permissions);

            // 5. User operator
            $this->createOperator($school, $roles['operator'], $def);

            $this->command->info("✅ '{$def['nama']}' ({$def['jenis']}) berhasil di-seed.");
            $this->command->info("   👤 Login: {$def['operator']['username']}@{$def['subdomain']}.sch.id / password");
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    private function createSettings(School $school, string $namaSekolah): void
    {
        $defaults = [
            ['key' => 'sekolah.nama_lengkap', 'value' => $namaSekolah, 'grup' => 'sekolah'],
            ['key' => 'sekolah.nama_singkat', 'value' => $namaSekolah, 'grup' => 'sekolah'],
            ['key' => 'sekolah.alamat', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.kota', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.provinsi', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.no_telp', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.email', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'akademik.kkm_default', 'value' => '70', 'grup' => 'akademik'],
            ['key' => 'akademik.kurikulum', 'value' => 'Merdeka', 'grup' => 'akademik'],
            ['key' => 'tampilan.primary_color', 'value' => '#15803D', 'grup' => 'tampilan'],
            ['key' => 'tampilan.theme', 'value' => 'default', 'grup' => 'tampilan'],
        ];

        $rows = array_map(fn($s) => array_merge($s, [
            'school_id' => $school->id,
            'updated_at' => now(),
        ]), $defaults);

        DB::table('school_settings')->insertOrIgnore($rows);
    }

    private function createPermissions(School $school): array
    {
        $result = [];

        foreach ($this->permissionDefinitions() as $def) {
            $permission = Permission::withoutGlobalScopes()->firstOrCreate(
                ['school_id' => $school->id, 'slug' => $def['slug']],
                ['nama' => $def['nama'], 'modul' => $def['modul']]
            );
            $result[$def['slug']] = $permission;
        }

        return $result;
    }

    private function createRoles(School $school): array
    {
        $roleDefs = [
            ['slug' => 'operator', 'nama' => 'Operator'],
            ['slug' => 'kepsek', 'nama' => 'Kepala Sekolah'],
            ['slug' => 'guru', 'nama' => 'Guru'],
            ['slug' => 'wali_kelas', 'nama' => 'Wali Kelas'],
            ['slug' => 'bendahara', 'nama' => 'Bendahara'],
            ['slug' => 'ortu', 'nama' => 'Orang Tua'],
            ['slug' => 'siswa', 'nama' => 'Siswa'],
            ['slug' => 'admin_ppdb', 'nama' => 'Admin PPDB'],
            ['slug' => 'wakasek', 'nama' => 'Wakil Kepala Sekolah'],
            ['slug' => 'guru_bk', 'nama' => 'Guru Bimbingan Konseling'],
            ['slug' => 'pustakawan', 'nama' => 'Pustakawan'],
            ['slug' => 'tata_usaha', 'nama' => 'Tata Usaha'],
            ['slug' => 'admin_keuangan', 'nama' => 'Admin Keuangan'],
        ];

        $created = [];
        foreach ($roleDefs as $def) {
            $role = Role::withoutGlobalScopes()->firstOrCreate(
                ['school_id' => $school->id, 'slug' => $def['slug']],
                array_merge($def, ['school_id' => $school->id, 'is_system' => true, 'is_active' => true])
            );
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

    private function createOperator(School $school, Role $role, array $def): void
    {
        $subdomain = $def['subdomain'];
        $username = $def['operator']['username'];
        $email = "{$username}@{$subdomain}.sch.id";

        $user = User::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('username', $username)
            ->first();

        if (!$user) {
            $user = User::withoutGlobalScopes()->create([
                'school_id' => $school->id,
                'name' => $def['operator']['name'],
                'email' => $email,
                'username' => $username,
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
        }

        DB::table('user_roles')->insertOrIgnore([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'school_id' => $school->id,
            'created_at' => now(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Permission definitions (sama dengan SchoolSeeder)
    // ─────────────────────────────────────────────────────────────────────

    private function permissionDefinitions(): array
    {
        return [
            ['slug' => 'master_data.guru.view', 'nama' => 'Lihat Data Guru', 'modul' => 'master_data'],
            ['slug' => 'master_data.guru.create', 'nama' => 'Tambah Guru', 'modul' => 'master_data'],
            ['slug' => 'master_data.guru.update', 'nama' => 'Edit Guru', 'modul' => 'master_data'],
            ['slug' => 'master_data.guru.delete', 'nama' => 'Hapus Guru', 'modul' => 'master_data'],
            ['slug' => 'master_data.guru.import', 'nama' => 'Import Data Guru', 'modul' => 'master_data'],
            ['slug' => 'master_data.guru.export', 'nama' => 'Export Data Guru', 'modul' => 'master_data'],
            ['slug' => 'master_data.guru.verify', 'nama' => 'Verifikasi Data Guru', 'modul' => 'master_data'],
            ['slug' => 'master_data.siswa.view', 'nama' => 'Lihat Data Siswa', 'modul' => 'master_data'],
            ['slug' => 'master_data.siswa.create', 'nama' => 'Tambah Siswa', 'modul' => 'master_data'],
            ['slug' => 'master_data.siswa.update', 'nama' => 'Edit Siswa', 'modul' => 'master_data'],
            ['slug' => 'master_data.siswa.delete', 'nama' => 'Hapus Siswa', 'modul' => 'master_data'],
            ['slug' => 'master_data.siswa.import', 'nama' => 'Import Data Siswa', 'modul' => 'master_data'],
            ['slug' => 'master_data.siswa.export', 'nama' => 'Export Data Siswa', 'modul' => 'master_data'],
            ['slug' => 'master_data.kelas.view', 'nama' => 'Lihat Kelas', 'modul' => 'master_data'],
            ['slug' => 'master_data.kelas.manage', 'nama' => 'Kelola Kelas', 'modul' => 'master_data'],
            ['slug' => 'master_data.mapel.view', 'nama' => 'Lihat Mata Pelajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.mapel.manage', 'nama' => 'Kelola Mata Pelajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.view', 'nama' => 'Lihat Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.manage', 'nama' => 'Kelola Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.orang_tua.view', 'nama' => 'Lihat Data Orang Tua', 'modul' => 'master_data'],
            ['slug' => 'master_data.orang_tua.manage', 'nama' => 'Kelola Data Orang Tua', 'modul' => 'master_data'],
            ['slug' => 'absensi.input', 'nama' => 'Input Absensi', 'modul' => 'absensi'],
            ['slug' => 'absensi.edit', 'nama' => 'Edit Absensi', 'modul' => 'absensi'],
            ['slug' => 'absensi.view_all', 'nama' => 'Lihat Semua Absensi', 'modul' => 'absensi'],
            ['slug' => 'absensi.view_kelas_sendiri', 'nama' => 'Lihat Absensi Kelas Sendiri', 'modul' => 'absensi'],
            ['slug' => 'absensi.rekap', 'nama' => 'Rekap Absensi', 'modul' => 'absensi'],
            ['slug' => 'dms.upload', 'nama' => 'Upload Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.view_own', 'nama' => 'Lihat Dokumen Sendiri', 'modul' => 'dms'],
            ['slug' => 'dms.view_all', 'nama' => 'Lihat Semua Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.approve', 'nama' => 'Approve Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.download', 'nama' => 'Download Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.bulk_download', 'nama' => 'Bulk Download Dokumen', 'modul' => 'dms'],
            ['slug' => 'pengumuman.view', 'nama' => 'Lihat Pengumuman', 'modul' => 'pengumuman'],
            ['slug' => 'pengumuman.create', 'nama' => 'Buat Pengumuman', 'modul' => 'pengumuman'],
            ['slug' => 'pengumuman.update', 'nama' => 'Edit Pengumuman', 'modul' => 'pengumuman'],
            ['slug' => 'pengumuman.delete', 'nama' => 'Hapus Pengumuman', 'modul' => 'pengumuman'],
            ['slug' => 'akademik.nilai.input', 'nama' => 'Input Nilai', 'modul' => 'akademik'],
            ['slug' => 'akademik.nilai.view', 'nama' => 'Lihat Nilai', 'modul' => 'akademik'],
            ['slug' => 'akademik.rapor.view', 'nama' => 'Lihat Rapor', 'modul' => 'akademik'],
            ['slug' => 'akademik.jadwal.manage', 'nama' => 'Kelola Jadwal', 'modul' => 'akademik'],
            ['slug' => 'akademik.kalender.manage', 'nama' => 'Kelola Kalender Akademik', 'modul' => 'akademik'],
            ['slug' => 'keuangan.tagihan.view', 'nama' => 'Lihat Tagihan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.tagihan.manage', 'nama' => 'Kelola Tagihan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.pembayaran.view', 'nama' => 'Lihat Pembayaran', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.pembayaran.input', 'nama' => 'Input Pembayaran', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.laporan.view', 'nama' => 'Lihat Laporan Keuangan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.export', 'nama' => 'Export Keuangan', 'modul' => 'keuangan'],
            ['slug' => 'ppdb.pendaftar.view', 'nama' => 'Lihat Pendaftar PPDB', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.update', 'nama' => 'Edit Data Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.approve', 'nama' => 'Approve Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.reject', 'nama' => 'Tolak Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pengaturan.manage', 'nama' => 'Kelola Pengaturan PPDB', 'modul' => 'ppdb'],
            ['slug' => 'bk.konseling.view', 'nama' => 'Lihat Data Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.konseling.create', 'nama' => 'Tambah Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.konseling.update', 'nama' => 'Edit Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.catatan.view', 'nama' => 'Lihat Catatan BK', 'modul' => 'bk'],
            ['slug' => 'bk.catatan.create', 'nama' => 'Tambah Catatan BK', 'modul' => 'bk'],
            ['slug' => 'bk.laporan.view', 'nama' => 'Lihat Laporan BK', 'modul' => 'bk'],
            ['slug' => 'bk.laporan.export', 'nama' => 'Export Laporan BK', 'modul' => 'bk'],
            ['slug' => 'perpustakaan.buku.view', 'nama' => 'Lihat Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.create', 'nama' => 'Tambah Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.update', 'nama' => 'Edit Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.delete', 'nama' => 'Hapus Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.peminjaman.view', 'nama' => 'Lihat Peminjaman', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.peminjaman.manage', 'nama' => 'Kelola Peminjaman', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.laporan.view', 'nama' => 'Lihat Laporan Perpustakaan', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.laporan.export', 'nama' => 'Export Laporan Perpustakaan', 'modul' => 'perpustakaan'],
            ['slug' => 'surat.view', 'nama' => 'Lihat Surat', 'modul' => 'surat'],
            ['slug' => 'surat.create', 'nama' => 'Buat Surat', 'modul' => 'surat'],
            ['slug' => 'surat.update', 'nama' => 'Edit Surat', 'modul' => 'surat'],
            ['slug' => 'surat.delete', 'nama' => 'Hapus Surat', 'modul' => 'surat'],
            ['slug' => 'surat.arsip', 'nama' => 'Arsip Surat', 'modul' => 'surat'],
            ['slug' => 'surat.legalisir', 'nama' => 'Proses Legalisir', 'modul' => 'surat'],
            ['slug' => 'laporan.guru.view', 'nama' => 'Lihat Laporan Guru', 'modul' => 'laporan'],
            ['slug' => 'laporan.siswa.view', 'nama' => 'Lihat Laporan Siswa', 'modul' => 'laporan'],
            ['slug' => 'laporan.absensi.view', 'nama' => 'Lihat Laporan Absensi', 'modul' => 'laporan'],
            ['slug' => 'laporan.keuangan.view', 'nama' => 'Lihat Laporan Keuangan', 'modul' => 'laporan'],
            ['slug' => 'laporan.export', 'nama' => 'Export Laporan', 'modul' => 'laporan'],
            ['slug' => 'pengaturan.view', 'nama' => 'Lihat Pengaturan', 'modul' => 'pengaturan'],
            ['slug' => 'pengaturan.rbac.manage', 'nama' => 'Kelola Role & Permission', 'modul' => 'pengaturan'],
            ['slug' => 'siswa_portal.profil.view', 'nama' => 'Lihat Profil Siswa', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.profil.update', 'nama' => 'Edit Profil Siswa', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.absensi.view', 'nama' => 'Lihat Absensi Sendiri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.nilai.view', 'nama' => 'Lihat Nilai Sendiri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.jadwal.view', 'nama' => 'Lihat Jadwal', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.pengumuman.view', 'nama' => 'Lihat Pengumuman', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.tagihan.view', 'nama' => 'Lihat Tagihan SPP', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.rapor.view', 'nama' => 'Lihat Rapor Online', 'modul' => 'siswa_portal'],
        ];
    }

    private function rolePermissionMatrix(): array
    {
        $all = array_column($this->permissionDefinitions(), 'slug');

        return [
            'operator' => $all,
            'kepsek' => ['master_data.guru.view', 'master_data.guru.export', 'master_data.guru.verify', 'master_data.siswa.view', 'master_data.siswa.export', 'master_data.kelas.view', 'master_data.mapel.view', 'master_data.tahun_ajaran.view', 'master_data.orang_tua.view', 'absensi.view_all', 'absensi.rekap', 'dms.view_all', 'dms.approve', 'dms.download', 'dms.bulk_download', 'pengumuman.view', 'pengumuman.create', 'pengumuman.update', 'pengumuman.delete', 'laporan.guru.view', 'laporan.siswa.view', 'laporan.absensi.view', 'laporan.keuangan.view', 'laporan.export', 'akademik.rapor.view', 'akademik.kalender.manage', 'pengaturan.view'],
            'guru' => ['master_data.siswa.view', 'absensi.input', 'absensi.edit', 'absensi.view_kelas_sendiri', 'dms.upload', 'dms.view_own', 'dms.download', 'pengumuman.view', 'akademik.nilai.input', 'akademik.nilai.view'],
            'wali_kelas' => ['master_data.siswa.view', 'absensi.input', 'absensi.edit', 'absensi.view_kelas_sendiri', 'dms.upload', 'dms.view_own', 'dms.download', 'pengumuman.view', 'akademik.nilai.input', 'akademik.nilai.view', 'akademik.rapor.view'],
            'bendahara' => ['master_data.siswa.view', 'keuangan.tagihan.view', 'keuangan.tagihan.manage', 'keuangan.pembayaran.view', 'keuangan.pembayaran.input', 'keuangan.laporan.view', 'keuangan.export', 'laporan.keuangan.view', 'laporan.export'],
            'ortu' => ['master_data.siswa.view', 'absensi.view_kelas_sendiri', 'pengumuman.view', 'siswa_portal.tagihan.view', 'siswa_portal.rapor.view'],
            'siswa' => ['siswa_portal.profil.view', 'siswa_portal.profil.update', 'siswa_portal.absensi.view', 'siswa_portal.nilai.view', 'siswa_portal.jadwal.view', 'siswa_portal.pengumuman.view', 'siswa_portal.tagihan.view', 'siswa_portal.rapor.view'],
            'admin_ppdb' => ['master_data.siswa.view', 'ppdb.pendaftar.view', 'ppdb.pendaftar.update', 'ppdb.pendaftar.approve', 'ppdb.pendaftar.reject', 'ppdb.pengaturan.manage'],
            'wakasek' => ['master_data.guru.view', 'master_data.guru.export', 'master_data.guru.verify', 'master_data.siswa.view', 'master_data.siswa.export', 'master_data.kelas.view', 'master_data.kelas.manage', 'master_data.mapel.view', 'master_data.mapel.manage', 'master_data.tahun_ajaran.view', 'master_data.orang_tua.view', 'absensi.view_all', 'absensi.rekap', 'dms.view_all', 'dms.approve', 'dms.download', 'dms.bulk_download', 'pengumuman.view', 'pengumuman.create', 'pengumuman.update', 'pengumuman.delete', 'laporan.guru.view', 'laporan.siswa.view', 'laporan.absensi.view', 'laporan.export', 'akademik.jadwal.manage', 'akademik.rapor.view', 'akademik.kalender.manage', 'pengaturan.view'],
            'guru_bk' => ['master_data.siswa.view', 'absensi.view_all', 'absensi.rekap', 'dms.upload', 'dms.view_own', 'dms.download', 'pengumuman.view', 'bk.konseling.view', 'bk.konseling.create', 'bk.konseling.update', 'bk.catatan.view', 'bk.catatan.create', 'bk.laporan.view', 'bk.laporan.export'],
            'pustakawan' => ['master_data.siswa.view', 'pengumuman.view', 'perpustakaan.buku.view', 'perpustakaan.buku.create', 'perpustakaan.buku.update', 'perpustakaan.buku.delete', 'perpustakaan.peminjaman.view', 'perpustakaan.peminjaman.manage', 'perpustakaan.laporan.view', 'perpustakaan.laporan.export'],
            'tata_usaha' => ['master_data.siswa.view', 'master_data.guru.view', 'master_data.orang_tua.view', 'dms.upload', 'dms.view_all', 'dms.download', 'dms.bulk_download', 'pengumuman.view', 'pengumuman.create', 'surat.view', 'surat.create', 'surat.update', 'surat.delete', 'surat.arsip', 'surat.legalisir', 'laporan.siswa.view', 'laporan.guru.view', 'laporan.export'],
            'admin_keuangan' => ['master_data.siswa.view', 'keuangan.tagihan.view', 'keuangan.tagihan.manage', 'keuangan.pembayaran.view', 'keuangan.pembayaran.input', 'keuangan.export'],
        ];
    }
}