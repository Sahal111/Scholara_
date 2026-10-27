<?php

namespace Database\Seeders\Support;

/**
 * SATU-SATUNYA sumber daftar permission & pembagian peran (RBAC).
 *
 * Dipakai oleh:
 *   - SchoolSeeder
 *   - MultiSchoolSeeder
 *   - php artisan permissions:sync
 *
 * Menambah permission baru: cukup ubah file ini, lalu
 *   php artisan db:seed --class=MultiSchoolSeeder   (sekolah dev)
 *   php artisan permissions:sync                    (sekolah yang sudah ada)
 *
 * Dijaga oleh tests/Feature/RbacCatalogTest.php.
 */
final class RbacCatalog
{
    public static function permissionDefinitions(): array
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

            // master_data — kelas, mapel, tahun ajaran, program pendidikan, kurikulum
            ['slug' => 'master_data.kelas.view', 'nama' => 'Lihat Kelas', 'modul' => 'master_data'],
            ['slug' => 'master_data.kelas.manage', 'nama' => 'Kelola Kelas', 'modul' => 'master_data'],
            ['slug' => 'master_data.program.view', 'nama' => 'Lihat Program Pendidikan', 'modul' => 'master_data'],
            ['slug' => 'master_data.program.manage', 'nama' => 'Kelola Program Pendidikan', 'modul' => 'master_data'],
            ['slug' => 'master_data.mapel.view', 'nama' => 'Lihat Mata Pelajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.mapel.manage', 'nama' => 'Kelola Mata Pelajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.view', 'nama' => 'Lihat Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.manage', 'nama' => 'Kelola Tahun Ajaran (Draft)', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.review', 'nama' => 'Submit Tahun Ajaran ke Review', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.approve', 'nama' => 'Approve / Reject Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.activate', 'nama' => 'Aktifkan Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.complete', 'nama' => 'Selesaikan Tahun Ajaran', 'modul' => 'master_data'],
            ['slug' => 'master_data.tahun_ajaran.archive', 'nama' => 'Arsipkan Tahun Ajaran', 'modul' => 'master_data'],

            // Semester (entitas mandiri)
            ['slug' => 'master_data.semester.view', 'nama' => 'Lihat Semester', 'modul' => 'master_data'],
            ['slug' => 'master_data.semester.manage', 'nama' => 'Kelola Semester', 'modul' => 'master_data'],
            ['slug' => 'master_data.semester.activate', 'nama' => 'Set Semester Aktif', 'modul' => 'master_data'],
            ['slug' => 'master_data.semester.archive', 'nama' => 'Arsipkan Semester', 'modul' => 'master_data'],

            ['slug' => 'master_data.orang_tua.view', 'nama' => 'Lihat Data Orang Tua', 'modul' => 'master_data'],
            ['slug' => 'master_data.orang_tua.manage', 'nama' => 'Kelola Data Orang Tua', 'modul' => 'master_data'],
            // kurikulum — fleksibel per sekolah, bisa custom atau pakai platform default
            ['slug' => 'master_data.kurikulum.view', 'nama' => 'Lihat Kurikulum', 'modul' => 'master_data'],
            ['slug' => 'master_data.kurikulum.manage', 'nama' => 'Kelola Kurikulum', 'modul' => 'master_data'],
            ['slug' => 'master_data.kurikulum.review', 'nama' => 'Ajukan Struktur Kurikulum ke Review', 'modul' => 'master_data'],
            ['slug' => 'master_data.kurikulum.approve', 'nama' => 'Approve / Reject Struktur Kurikulum', 'modul' => 'master_data'],
            ['slug' => 'master_data.kurikulum.activate', 'nama' => 'Aktifkan Struktur Kurikulum', 'modul' => 'master_data'],
            ['slug' => 'master_data.kurikulum.complete', 'nama' => 'Selesaikan Struktur Kurikulum', 'modul' => 'master_data'],

            // absensi
            ['slug' => 'absensi.input', 'nama' => 'Input Absensi', 'modul' => 'absensi'],
            ['slug' => 'absensi.edit', 'nama' => 'Edit Absensi', 'modul' => 'absensi'],
            ['slug' => 'absensi.view_all', 'nama' => 'Lihat Semua Absensi', 'modul' => 'absensi'],
            ['slug' => 'absensi.view_kelas_sendiri', 'nama' => 'Lihat Absensi Kelas Sendiri', 'modul' => 'absensi'],
            ['slug' => 'absensi.rekap', 'nama' => 'Rekap Absensi', 'modul' => 'absensi'],

            // dms
            ['slug' => 'dms.upload', 'nama' => 'Upload Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.view_own', 'nama' => 'Lihat Dokumen Sendiri', 'modul' => 'dms'],
            ['slug' => 'dms.view_all', 'nama' => 'Lihat Semua Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.approve', 'nama' => 'Approve Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.download', 'nama' => 'Download Dokumen', 'modul' => 'dms'],
            ['slug' => 'dms.bulk_download', 'nama' => 'Bulk Download Dokumen', 'modul' => 'dms'],

            // pengumuman
            ['slug' => 'pengumuman.view', 'nama' => 'Lihat Pengumuman', 'modul' => 'pengumuman'],
            ['slug' => 'pengumuman.create', 'nama' => 'Buat Pengumuman', 'modul' => 'pengumuman'],
            ['slug' => 'pengumuman.update', 'nama' => 'Edit Pengumuman', 'modul' => 'pengumuman'],
            ['slug' => 'pengumuman.delete', 'nama' => 'Hapus Pengumuman', 'modul' => 'pengumuman'],

            // akademik
            ['slug' => 'akademik.nilai.input', 'nama' => 'Input Nilai', 'modul' => 'akademik'],
            ['slug' => 'akademik.nilai.view', 'nama' => 'Lihat Nilai', 'modul' => 'akademik'],
            ['slug' => 'akademik.nilai.view_all', 'nama' => 'Lihat Nilai Semua Kelas', 'modul' => 'akademik'],
            ['slug' => 'akademik.rapor.view', 'nama' => 'Lihat Rapor', 'modul' => 'akademik'],
            ['slug' => 'akademik.rapor.manage', 'nama' => 'Kelola & Finalisasi Rapor', 'modul' => 'akademik'],
            ['slug' => 'akademik.jadwal.view', 'nama' => 'Lihat Jadwal Pelajaran', 'modul' => 'akademik'],
            ['slug' => 'akademik.jadwal.manage', 'nama' => 'Kelola Jadwal', 'modul' => 'akademik'],
            ['slug' => 'akademik.kalender.manage', 'nama' => 'Kelola Kalender Akademik', 'modul' => 'akademik'],

            // keuangan
            ['slug' => 'keuangan.tagihan.view', 'nama' => 'Lihat Tagihan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.tagihan.manage', 'nama' => 'Kelola Tagihan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.pembayaran.view', 'nama' => 'Lihat Pembayaran', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.pembayaran.input', 'nama' => 'Input Pembayaran', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.laporan.view', 'nama' => 'Lihat Laporan Keuangan', 'modul' => 'keuangan'],
            ['slug' => 'keuangan.export', 'nama' => 'Export Keuangan', 'modul' => 'keuangan'],

            // ppdb
            ['slug' => 'ppdb.pendaftar.view', 'nama' => 'Lihat Pendaftar PPDB', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.update', 'nama' => 'Edit Data Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.approve', 'nama' => 'Approve Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pendaftar.reject', 'nama' => 'Tolak Pendaftar', 'modul' => 'ppdb'],
            ['slug' => 'ppdb.pengaturan.manage', 'nama' => 'Kelola Pengaturan PPDB', 'modul' => 'ppdb'],

            // bk
            ['slug' => 'bk.konseling.view', 'nama' => 'Lihat Data Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.konseling.create', 'nama' => 'Tambah Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.konseling.update', 'nama' => 'Edit Konseling', 'modul' => 'bk'],
            ['slug' => 'bk.catatan.view', 'nama' => 'Lihat Catatan BK', 'modul' => 'bk'],
            ['slug' => 'bk.catatan.create', 'nama' => 'Tambah Catatan BK', 'modul' => 'bk'],
            ['slug' => 'bk.laporan.view', 'nama' => 'Lihat Laporan BK', 'modul' => 'bk'],
            ['slug' => 'bk.laporan.export', 'nama' => 'Export Laporan BK', 'modul' => 'bk'],

            // perpustakaan
            ['slug' => 'perpustakaan.buku.view', 'nama' => 'Lihat Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.create', 'nama' => 'Tambah Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.update', 'nama' => 'Edit Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.buku.delete', 'nama' => 'Hapus Buku', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.peminjaman.view', 'nama' => 'Lihat Peminjaman', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.peminjaman.manage', 'nama' => 'Kelola Peminjaman', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.laporan.view', 'nama' => 'Lihat Laporan Perpus', 'modul' => 'perpustakaan'],
            ['slug' => 'perpustakaan.laporan.export', 'nama' => 'Export Laporan Perpus', 'modul' => 'perpustakaan'],

            // surat / tata usaha
            ['slug' => 'surat.view', 'nama' => 'Lihat Surat', 'modul' => 'surat'],
            ['slug' => 'surat.create', 'nama' => 'Buat Surat', 'modul' => 'surat'],
            ['slug' => 'surat.update', 'nama' => 'Edit Surat', 'modul' => 'surat'],
            ['slug' => 'surat.delete', 'nama' => 'Hapus Surat', 'modul' => 'surat'],
            ['slug' => 'surat.arsip', 'nama' => 'Arsip Surat', 'modul' => 'surat'],
            ['slug' => 'surat.legalisir', 'nama' => 'Proses Legalisir', 'modul' => 'surat'],

            // laporan
            ['slug' => 'laporan.guru.view', 'nama' => 'Lihat Laporan Guru', 'modul' => 'laporan'],
            ['slug' => 'laporan.siswa.view', 'nama' => 'Lihat Laporan Siswa', 'modul' => 'laporan'],
            ['slug' => 'laporan.absensi.view', 'nama' => 'Lihat Laporan Absensi', 'modul' => 'laporan'],
            ['slug' => 'laporan.keuangan.view', 'nama' => 'Lihat Laporan Keuangan', 'modul' => 'laporan'],
            ['slug' => 'laporan.export', 'nama' => 'Export Laporan', 'modul' => 'laporan'],

            // pengaturan
            ['slug' => 'pengaturan.view', 'nama' => 'Lihat Pengaturan', 'modul' => 'pengaturan'],
            ['slug' => 'pengaturan.rbac.manage', 'nama' => 'Kelola Role & Permission', 'modul' => 'pengaturan'],

            // portal siswa
            ['slug' => 'siswa_portal.profil.view', 'nama' => 'Lihat Profil Siswa', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.profil.update', 'nama' => 'Edit Profil Siswa', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.absensi.view', 'nama' => 'Lihat Absensi Sendiri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.nilai.view', 'nama' => 'Lihat Nilai Sendiri', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.jadwal.view', 'nama' => 'Lihat Jadwal', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.pengumuman.view', 'nama' => 'Lihat Pengumuman', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.tagihan.view', 'nama' => 'Lihat Tagihan SPP', 'modul' => 'siswa_portal'],
            ['slug' => 'siswa_portal.rapor.view', 'nama' => 'Lihat Rapor Online', 'modul' => 'siswa_portal'],

            // ── Dulu hanya ada di command permissions:sync, tidak di seeder ──
            ['slug' => 'akun.view', 'nama' => 'Lihat Akun Pengguna', 'modul' => 'akun'],
            ['slug' => 'akun.create', 'nama' => 'Buat Akun Pengguna', 'modul' => 'akun'],
            ['slug' => 'akun.update', 'nama' => 'Edit Akun Pengguna', 'modul' => 'akun'],
            ['slug' => 'akun.delete', 'nama' => 'Hapus Akun Pengguna', 'modul' => 'akun'],
            ['slug' => 'akun.toggle_active', 'nama' => 'Aktif/Nonaktif Akun', 'modul' => 'akun'],
            ['slug' => 'akun.reset_password', 'nama' => 'Reset Password Pengguna', 'modul' => 'akun'],
            ['slug' => 'akun.approve_ortu', 'nama' => 'Approve Registrasi Ortu', 'modul' => 'akun'],
            ['slug' => 'dms.delete', 'nama' => 'Hapus Dokumen', 'modul' => 'dms'],
            ['slug' => 'pengaturan.update', 'nama' => 'Edit Pengaturan', 'modul' => 'pengaturan'],
        ];
    }

    public static function rolePermissionMatrix(): array
    {
        $all = array_column(self::permissionDefinitions(), 'slug');

        return [
            // ─────────────────────────────────────────────────────────────────
            // OPERATOR — pelaksana administrasi & pengelola data teknis.
            //
            // Operator BOLEH:
            //   - tahun_ajaran.manage  → buat draft & edit saat masih DRAFT
            //   - tahun_ajaran.archive → arsipkan TA yang sudah COMPLETED
            //   - VIEW semua data akademik (kelas, mapel, kurikulum, program)
            //
            // Operator TIDAK BOLEH:
            //   - tahun_ajaran.review   → domain Wakasek (submit ke kepsek)
            //   - tahun_ajaran.approve  → domain Kepsek
            //   - tahun_ajaran.activate → domain Kepsek
            //   - tahun_ajaran.complete → domain Wakasek (tutup buku)
            //   - manage kebijakan akademik (kurikulum, mapel, program, kelas,
            //     jadwal, kalender, rapor) — itu domain Wakasek
            // ─────────────────────────────────────────────────────────────────
            'operator' => array_values(array_filter(
                $all,
                fn($slug) => !in_array($slug, [
                    // Kebijakan akademik — domain Wakasek
                    'master_data.kelas.manage',
                    'master_data.mapel.manage',
                    'master_data.program.manage',
                    'master_data.kurikulum.manage',
                    'master_data.kurikulum.review',
                    'master_data.kurikulum.approve',
                    'master_data.kurikulum.activate',
                    'master_data.kurikulum.complete',
                    'akademik.jadwal.manage',
                    'akademik.kalender.manage',
                    'akademik.rapor.manage',
                    // Workflow TA — domain Wakasek & Kepsek
                    'master_data.tahun_ajaran.review',
                    'master_data.tahun_ajaran.approve',
                    'master_data.tahun_ajaran.activate',
                    'master_data.tahun_ajaran.complete',
                    // Activate semester — domain Wakasek
                    'master_data.semester.activate',
                    // Kepsek-only
                    'master_data.guru.verify',
                ])
            )),

            // ─────────────────────────────────────────────────────────────────
            // KEPALA SEKOLAH — oversight penuh, tidak menginput langsung.
            // Approve kebijakan, pantau semua laporan, tidak ubah data teknis.
            // ─────────────────────────────────────────────────────────────────
            'kepsek' => [
                // Master data — view only
                'master_data.guru.view',
                'master_data.guru.export',
                'master_data.guru.verify',
                'master_data.siswa.view',
                'master_data.siswa.export',
                'master_data.kelas.view',
                'master_data.mapel.view',
                'master_data.tahun_ajaran.view',
                'master_data.tahun_ajaran.approve',  // kepsek approve/reject TA dari wakasek
                'master_data.tahun_ajaran.activate', // kepsek aktifkan TA yang sudah approved
                'master_data.orang_tua.view',

                // Semester — view only
                'master_data.semester.view',
                'master_data.program.view',
                'master_data.kurikulum.view',
                'master_data.kurikulum.approve',
                'master_data.kurikulum.activate',

                // Akademik — pantau semua, tidak kelola
                'akademik.jadwal.view',
                'akademik.nilai.view_all',
                'akademik.rapor.view',
                'akademik.kalender.manage',          // kepsek bisa set kalender akademik

                // Absensi & laporan lengkap
                'absensi.view_all',
                'absensi.rekap',
                'laporan.guru.view',
                'laporan.siswa.view',
                'laporan.absensi.view',
                'laporan.keuangan.view',
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

                'pengaturan.view',
            ],

            'guru' => [
                'master_data.siswa.view',
                'master_data.kurikulum.view',
                'master_data.tahun_ajaran.view',  // referensi periode aktif
                'master_data.semester.view',      // referensi semester aktif
                'absensi.input',
                'absensi.edit',
                'absensi.view_kelas_sendiri',
                'dms.upload',
                'dms.view_own',
                'dms.download',
                'pengumuman.view',
                'akademik.jadwal.view',
                'akademik.nilai.input',
                'akademik.nilai.view',
            ],

            'wali_kelas' => [
                'master_data.siswa.view',
                'master_data.kurikulum.view',
                'master_data.tahun_ajaran.view',  // referensi periode aktif
                'master_data.semester.view',      // referensi semester aktif
                'absensi.input',
                'absensi.edit',
                'absensi.view_kelas_sendiri',
                'dms.upload',
                'dms.view_own',
                'dms.download',
                'pengumuman.view',
                'akademik.jadwal.view',
                'akademik.nilai.input',
                'akademik.nilai.view',
                'akademik.nilai.view_all',           // wali kelas pantau semua nilai di kelasnya
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

            // ─────────────────────────────────────────────────────────────────
            // WAKASEK KURIKULUM — pemilik & penanggung jawab kebijakan akademik.
            // Mengelola seluruh struktur akademik: tahun ajaran, semester,
            // kurikulum, program pendidikan, mapel, kelas, jadwal.
            // Read-only untuk data guru & siswa (administrasi milik operator).
            // ─────────────────────────────────────────────────────────────────
            'wakasek' => [
                // ── Data guru & siswa — hanya view & export (bukan CRUD) ──
                'master_data.guru.view',
                'master_data.guru.export',
                'master_data.guru.verify',
                'master_data.siswa.view',
                'master_data.siswa.export',
                'master_data.orang_tua.view',

                // ── Kebijakan akademik — FULL manage (domain utama wakasek) ──
                'master_data.kelas.view',
                'master_data.kelas.manage',
                'master_data.mapel.view',
                'master_data.mapel.manage',
                'master_data.tahun_ajaran.view',
                'master_data.tahun_ajaran.manage',   // ← fix: sebelumnya tidak ada!
                'master_data.tahun_ajaran.review',   // wakasek submit TA ke kepsek
                'master_data.tahun_ajaran.complete', // wakasek tutup buku TA yang aktif

                // ── Semester — wakasek kelola & atur pergantian semester ──
                'master_data.semester.view',
                'master_data.semester.manage',   // edit tanggal/nama semester
                'master_data.semester.activate', // ganti semester aktif (Ganjil↔Genap)
                'master_data.program.view',
                'master_data.program.manage',
                'master_data.kurikulum.view',
                'master_data.kurikulum.manage',
                'master_data.kurikulum.review',
                'master_data.kurikulum.complete',

                // ── Akademik operasional ──
                'akademik.jadwal.view',
                'akademik.jadwal.manage',
                'akademik.kalender.manage',
                'akademik.nilai.view',
                'akademik.nilai.view_all',           // ← baru: pantau semua kelas
                'akademik.rapor.view',
                'akademik.rapor.manage',             // ← baru: finalisasi rapor

                // ── Absensi & laporan — oversight ──
                'absensi.view_all',
                'absensi.rekap',
                'laporan.guru.view',
                'laporan.siswa.view',
                'laporan.absensi.view',
                'laporan.export',

                // ── Dokumen & pengumuman ──
                'dms.view_all',
                'dms.approve',
                'dms.download',
                'dms.bulk_download',
                'pengumuman.view',
                'pengumuman.create',
                'pengumuman.update',
                'pengumuman.delete',

                // ── Pengaturan — hanya view (bukan RBAC manage) ──
                'pengaturan.view',
            ],

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
