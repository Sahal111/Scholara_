# RPL_Group1 — SIAKAD MI Nurul Huda 3

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: TailwindCSS v4
- **Server State**: TanStack React Query v5
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios v1.18
- **Icons**: Lucide React v1.21
- **Charts**: Recharts v3
- **PDF Export**: jsPDF v4 + jsPDF-AutoTable v5
- **Excel**: SheetJS (xlsx v0.18) — tersedia di frontend
- **Notifikasi**: React Hot Toast v2
- **Date**: Day.js v1.11
- **Linter**: OxLint

### Backend
- **Framework**: Laravel 12.x (PHP 8.2+)
- **Auth**: Laravel Sanctum v4 (token-based, `Bearer` via header)
- **Database**: MySQL 8.x
- **Entry points**: `backend/routes/api.php`
- **Dependencies**: `backend/composer.json`
- **⚠️ TIDAK ADA library eksternal selain yang ada di composer.json saat ini** — jangan tambahkan tanpa konfirmasi user. Khususnya: PhpSpreadsheet **belum diinstall**. Gunakan pure-PHP ZipArchive + SimpleXML untuk baca/tulis .xlsx.

---

## 👥 Platform & Tenant Multi-Tier Access Model

### Platform Super Admin (`platform_admins`)
- User terdaftar di `global_users` dan dikoneksikan ke `platform_admins`.
- Level access: `super_admin`, `admin`, `support` (impersonasi via `last_tenant_id`), `billing`, `readonly`.

### Tenant Roles (Per-Sekolah di tabel `roles`)
| Slug | Nama | Keterangan |
|------|------|------------|
| `super_operator` | Operator Utama | Akses penuh ke semua fitur sekolah |
| `operator` | Operator / Admin | Manajemen akun, master data, pengumuman, galeri |
| `guru` | Guru | Dashboard, input absensi, rekap, jadwal, LMS, profil |
| `ortu` | Orang Tua / Wali | Pantau absensi anak, tagihan, pengumuman, profil |
| `kepsek` | Kepala Sekolah | Monitoring, data guru & siswa (read-only), kalender, pengumuman |
| `wali_kelas` | Wali Kelas | Dashboard & manajemen wali kelas |
| `bendahara` | Bendahara | Keuangan & pembayaran |
| `siswa` | Siswa | Portal siswa — lihat absensi diri, nilai, LMS, jadwal, tagihan |
| `admin_ppdb` | Admin PPDB | Modul PPDB — pendaftaran & seleksi |

> **Global User Multi-Tenant**: Autentikasi utama tersimpan di `global_users`. Mapping ke sekolah disimpan di `global_user_schools`.
> **Master Reference Data**: Tabel `master_religions`, `master_education_levels`, `master_status_kepegawaians`, `master_jenis_cutis`, `master_marital_statuses`, `master_school_types`, `master_blood_types`, `akun_kass`, `kategori_bukus` mendukung default platform (`school_id = NULL`) dan custom override sekolah.

---

## ✅ COMPLETED FEATURES — DO NOT TOUCH

> Update section ini setiap kali user bilang "done" / "selesai" / "fix".
> **AI wajib baca section ini dulu sebelum nulis satu baris pun.**
> File di sini = SUDAH SELESAI = JANGAN DIMODIFIKASI kecuali user minta eksplisit fix bug.

### Operator
- [x] Autentikasi — login, logout, guard token via Sanctum; `AuthContext.jsx`, `axios.js`, `ProtectedRoute.jsx`
- [x] Dashboard Operator; `DashboardOperator.jsx`
- [x] Manajemen Akun — CRUD user, toggle aktif, reset password, hapus; `ManajemenAkun.jsx`
- [x] Approval Ortu — list pending, approve/reject; `ApprovalOrtu.jsx`
- [x] Master Data Guru — CRUD guru, upload foto, lihat detail & akun terhubung; `MasterGuru.jsx`, `DetailGuru.jsx`, `TambahEditGuru.jsx`
- [x] Master Data Siswa — CRUD siswa, upload foto, assign kelas, mutasi, regenerate kode anak; `MasterSiswa.jsx`, `DetailSiswa.jsx`, `TambahEditSiswa.jsx`, `MutasiSiswa.jsx`
- [x] Master Data Kelas — CRUD kelas, filter tahun ajaran & semester, detail kelas dinamis dari API, riwayat akademik per tahun ajaran, riwayat wali kelas; `MasterKelas.jsx`, `DetailKelas.jsx`, `DetailKelasPeriodeAkademik.jsx`
- [x] Master Data Orang Tua — CRUD ortu, attach anak, detail keluarga; `MasterOrtu.jsx`, `DetailOrtu.jsx`, `DetailDataOrtu.jsx`, `TambahEditOrtu.jsx`
- [x] Master Data Mapel — CRUD mapel, toggle aktif, **import/export/template Excel (.xlsx) via pure-PHP ZipArchive** (tanpa PhpSpreadsheet); `MasterMapel.jsx`, `MasterDataMapelController.php`
- [x] Master Data Jadwal Pelajaran — CRUD jadwal; `MasterJadwal.jsx`, `JadwalPelajaranController.php`
- [x] Master Data Tahun Ajaran & Semester — CRUD, set aktif, set semester aktif, detail TA & Semester, validasi hapus & DB integrity; `TahunAjaranSemester.jsx`, `DetailTahunAjaran.jsx`, `DetailSemester.jsx`, `TahunAjaranController.php`
- [x] Naik Kelas — preview & proses naik kelas massal; `NaikKelas.jsx`, `NaikKelasController.php`
- [x] Pengumuman — CRUD; `PengumumanOperator.jsx`, `PengumumanController.php`
- [x] Galeri Foto — upload & hapus; `GaleriOperator.jsx`, `GaleriController.php`

### Guru
- [x] Dashboard Guru; `DashboardGuru.jsx`
- [x] Input Absensi; `InputAbsensi.jsx`
- [x] Rekap Absensi; `RekapAbsensiGuru.jsx`
- [x] Data Siswa; `DataSiswaGuru.jsx`, `DetailSiswaGuru.jsx`
- [x] Riwayat Absensi Siswa; `RiwayatAbsensiSiswaGuru.jsx`
- [x] Jadwal Mengajar; `JadwalMengajarGuru.jsx`
- [x] Pengumuman Guru; `PengumumanGuru.jsx`
- [x] Profil Guru; `ProfilGuru.jsx`

### Kepsek
- [x] Dashboard Kepsek; `DashboardKepsek.jsx`
- [x] Monitoring Absensi; `MonitoringAbsensi.jsx`
- [x] Data Guru (read-only); `DataGuruKepsek.jsx`, `DetailGuruKepsek.jsx`
- [x] Data Siswa (read-only); `DataSiswaKepsek.jsx`, `DetailSiswaKepsek.jsx`
- [x] Pengumuman Kepsek; `PengumumanKepsek.jsx`
- [x] Kalender Akademik — CRUD event; `KalenderAkademik.jsx`, `KalenderAkademikController.php`
- [x] Profil Kepsek; `ProfilKepsek.jsx`
- [x] Kurikulum — antrian review implementasi (setujui / tolak / aktifkan); `KurikulumKepsek.jsx`, `DaftarImplementasiKurikulum.jsx`, `DetailImplementasiKurikulum.jsx`, `KurikulumWorkflowController.php`

### Wakasek
- [x] Master Kurikulum — daftar kurikulum bawaan Scholara + milik sekolah, filter sumber, detail read-only, CRUD kurikulum sekolah, salin kurikulum bawaan jadi milik sekolah, recycle bin; `MasterKurikulum.jsx`, `ModalKurikulum.jsx`, `KurikulumController.php`
- [x] Implementasi Kurikulum per Tahun Ajaran — daftarkan (tingkat sesuai jenjang, peringatan bentrok tingkat), ubah/hapus saat Draft, workflow ajukan-review → selesaikan, struktur mapel per tingkat; `KurikulumTahunAjaranSection.jsx`, `ModalUbahImplementasi.jsx`, `StrukturKurikulumSection.jsx`, `KurikulumService.php`, `KurikulumWorkflowService.php`, `KurikulumStrukturService.php`
- [x] Aturan Program per Kurikulum — jenis program yang boleh dipakai ditentukan per kurikulum (`kurikulum_jenis_programs`; tanpa aturan = bebas), modal Aturan Program (checkbox terkunci untuk jenis yang tidak relevan di jenjang sekolah), salinan kurikulum platform ikut menyalin aturan; `ModalAturanProgram.jsx`, `KurikulumController.php` (`aturanProgram`, `simpanAturanProgram`), `KurikulumService.php`, `School.php` (`jenisProgramJenjang()`)
- [x] Program Pendidikan mengikuti Kurikulum — dropdown jenis = jenis relevan jenjang ∩ aturan kurikulum berstatus Berlaku (fallback: kurikulum terdaftar belum selesai, lalu legacy `schools.kurikulum`); guard backend `JENIS_TIDAK_TERSEDIA` (`ProgramPendidikanController.php`) & `PROGRAM_TIDAK_KOMPATIBEL` (`MasterDataKelasController.php`); label "Konsentrasi / Paket Keahlian"; cache jenis-tersedia ter-invalidate saat status implementasi / aturan program berubah; `MasterProgramWakasek.jsx`, `programConfig.js`, `useProgramPendidikan.js`
- [x] Kebersihan status Kurikulum — katalog: Tersedia/Disembunyikan; implementasi: Berlaku; kolom "Tahun Ajaran Ini" (`implementasi_status` + `implementasi_tahun_ajaran`) di Daftar Kurikulum; `MasterKurikulum.jsx`, `implementasiStatus.js`, `KurikulumResource.php`

### Super Admin
- [x] Kurikulum Platform — CRUD kurikulum bawaan (satu default per jenis, aktif/nonaktif, hapus hanya bila belum dipakai, kolom "Dipakai X sekolah", pagination); `KurikulumPlatform.jsx`, `KurikulumPlatformController.php`
- [x] Pantau Kurikulum per Sekolah (read-only); `KurikulumSekolahList.jsx`, `KurikulumSekolah.jsx`, `DetailImplementasiSuperAdmin.jsx`, `UseSchoolFromRoute.php`

### Ortu
- [x] Absensi Anak; `AbsensiAnak.jsx`
- [x] Riwayat Absensi Anak; `RiwayatAbsensiAnak.jsx`
- [x] Data Anak; `DataAnak.jsx`
- [x] Tambah Anak; `TambahAnak.jsx`
- [x] Pengumuman Ortu; `PengumumanOrtu.jsx`
- [x] Profil Ortu; `ProfilOrtu.jsx`

### Public
- [x] Landing Page; `LandingPage.jsx`
- [x] Galeri Publik; `GalleryPage.jsx`
- [x] Tentang; `AboutPage.jsx`
- [x] Kontak; `ContactPage.jsx`
- [x] Login; `LoginPage.jsx`
- [x] Daftar Ortu; `RegisterOrtuPage.jsx`

### Wali Kelas — Placeholder
- [x] Layout & Dashboard Placeholder; `WaliKelasLayout.jsx`, `DashboardWaliKelas.jsx`

### Bendahara — Placeholder
- [x] Layout & Dashboard Placeholder; `BendaharaLayout.jsx`, `DashboardBendahara.jsx`

### Admin PPDB — Placeholder
- [x] Layout & Dashboard Placeholder; `AdminPpdbLayout.jsx`, `DashboardAdminPpdb.jsx`

### Auth & Login System
- [x] Perbaikan notifikasi error login — ambil detail dari `errors` object Laravel, bukan hanya `message` global; `LoginPage.jsx`
- [x] Perbaikan prioritas role pada `getRoleSlug()` untuk user multi-role (prioritaskan role yang punya dashboard); `User.php`
- [x] Penambahan redirect ke semua role baru (`wali_kelas`, `bendahara`, `admin_ppdb`) pada `redirectMap`; `LoginPage.jsx`
- [x] Pendaftaran rute baru untuk semua role di `App.jsx`

### Bug Fixes yang Sudah Diselesaikan
- [x] **Fix route mapel** — `export`, `import`, `template` tidak terdaftar di `api.php` sehingga jatuh ke wildcard `{id}` → 404; diperbaiki dengan menambahkan 3 route statis sebelum `GET /mapel/{id}`; `api.php`
- [x] **Fix import/export/template mapel dari CSV → Excel** — controller diganti menggunakan pure-PHP ZipArchive + SimpleXML untuk generate `.xlsx` (tanpa PhpSpreadsheet); frontend diupdate untuk accept `.xlsx`/`.xls`; `MasterDataMapelController.php`, `MasterMapel.jsx`
- [x] **Fix dropdown program pendidikan salah jenis** — `schools.kurikulum` (string legacy "Kurikulum Merdeka") tidak sinkron dengan kurikulum terdaftar; sekarang sumber kebenarannya `kurikulum_tahun_ajarans` berstatus `active`; `KurikulumService.php`
- [x] **Migrasi program pendidikan** — enum `program_pendidikans` dilonggarkan dan tabel pivot `kurikulum_program_pendidikans` dihapus (`2026_11_22_000001_relax_program_pendidikans_enums.php`, `2026_11_22_000002_drop_deprecated_kurikulum_program_pendidikans.php`); `ProgramPendidikanTest` 18 lolos

### Testing
- [x] `TestingUserSeeder.php` — Seed akun uji coba semua role:
  - `operator` / `operator123`
  - `kepsek` / `kepsek123`
  - `guru` / `guru123`
  - `walikelas` / `walikelas123`
  - `bendahara` / `bendahara123`
  - `ortu` / `ortu123`
  - `siswa` / `siswa123`
  - `adminppdb` / `adminppdb123`

---

## 🔒 Komponen & File Stabil — JANGAN DIUBAH kecuali ada bug eksplisit

### Frontend
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/lib/axios.js`
- `frontend/src/routes/ProtectedRoute.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/pages/operator/master/masterDataTahunAjaranSemester/TahunAjaranSemester.jsx`
- `frontend/src/pages/operator/master/masterDataTahunAjaranSemester/DetailTahunAjaran.jsx`
- `frontend/src/pages/operator/master/masterDataTahunAjaranSemester/DetailSemester.jsx`

### Backend
- `backend/app/Http/Controllers/MasterData/TahunAjaranController.php`
- `backend/app/Services/KurikulumService.php`
- `backend/app/Services/KurikulumWorkflowService.php`
- `backend/app/Http/Controllers/MasterData/KurikulumController.php`
- `backend/app/Http/Controllers/MasterData/ProgramPendidikanController.php`
- `backend/app/Models/School.php` (`jenisProgramJenjang()`)

---

## 🚧 IN PROGRESS — Sedang Dikerjakan

- [ ] *(kosong)*

---

## ❌ NEVER MODIFY — Tanpa Izin Eksplisit

- `frontend/dist/` — hasil build otomatis
- `backend/vendor/` — dikelola composer
- `frontend/node_modules/` — dikelola npm
- `.env` / `.env.example`
- `package-lock.json` / `composer.lock`
- `db_minurulhuda3.sql` — source of truth database, jangan diubah

---

## 📁 Struktur Project Lengkap

```
RPL_Group1/
├── frontend/
│   └── src/
│       ├── contexts/
│       │   └── AuthContext.jsx
│       ├── lib/
│       │   └── axios.js              ← baseURL: VITE_API_URL ?? http://127.0.0.1:8001/api
│       ├── routes/
│       │   └── ProtectedRoute.jsx
│       ├── hooks/
│       │   └── useSelectedAnak.js
│       ├── components/layout/
│       │   ├── Sidebar.jsx
│       │   ├── OperatorSidebar.jsx
│       │   ├── OperatorTopBar.jsx
│       │   └── OperatorFooter.jsx
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx
│       │   │   └── RegisterOrtuPage.jsx
│       │   ├── public/
│       │   │   ├── LandingPage.jsx
│       │   │   ├── GalleryPage.jsx
│       │   │   ├── AboutPage.jsx
│       │   │   ├── ContactPage.jsx
│       │   │   ├── PublicNavbar.jsx
│       │   │   └── PublicFooter.jsx
│       │   ├── operator/
│       │   │   ├── OperatorLayout.jsx
│       │   │   ├── DashboardOperator.jsx
│       │   │   ├── ManajemenAkun.jsx
│       │   │   ├── ApprovalOrtu.jsx
│       │   │   └── master/
│       │   │       ├── MasterJadwal.jsx
│       │   │       ├── NaikKelas.jsx
│       │   │       ├── PengumumanOperator.jsx
│       │   │       ├── GaleriOperator.jsx
│       │   │       ├── masterDataGuru/
│       │   │       │   ├── MasterGuru.jsx
│       │   │       │   ├── DetailGuru.jsx
│       │   │       │   └── TambahEditGuru.jsx
│       │   │       ├── masterDataSiswa/
│       │   │       │   ├── MasterSiswa.jsx
│       │   │       │   ├── DetailSiswa.jsx
│       │   │       │   ├── TambahEditSiswa.jsx
│       │   │       │   └── MutasiSiswa.jsx
│       │   │       ├── masterDataKelas/
│       │   │       │   ├── MasterKelas.jsx
│       │   │       │   ├── DetailKelas.jsx
│       │   │       │   └── DetailKelasPeriodeAkademik.jsx
│       │   │       ├── masterDataOrtu/
│       │   │       │   ├── MasterOrtu.jsx
│       │   │       │   ├── DetailOrtu.jsx
│       │   │       │   ├── DetailDataOrtu.jsx
│       │   │       │   └── TambahEditOrtu.jsx
│       │   │       ├── masterDataMapel/
│       │   │       │   ├── MasterMapel.jsx       ← import/export Excel (.xlsx)
│       │   │       │   └── TambahEditMapel.jsx
│       │   │       └── masterDataTahunAjaranSemester/
│       │   │           ├── TahunAjaranSemester.jsx  ← STABIL
│       │   │           ├── DetailTahunAjaran.jsx    ← STABIL
│       │   │           └── DetailSemester.jsx       ← STABIL
│       │   ├── guru/
│       │   │   ├── GuruLayout.jsx
│       │   │   ├── DashboardGuru.jsx
│       │   │   ├── DataSiswaGuru.jsx
│       │   │   ├── DetailSiswaGuru.jsx
│       │   │   ├── InputAbsensi.jsx
│       │   │   ├── RekapAbsensiGuru.jsx
│       │   │   ├── RiwayatAbsensiSiswaGuru.jsx
│       │   │   ├── JadwalMengajarGuru.jsx
│       │   │   ├── PengumumanGuru.jsx
│       │   │   └── ProfilGuru.jsx
│       │   ├── kepsek/
│       │   │   ├── KepsekLayout.jsx
│       │   │   ├── DashboardKepsek.jsx
│       │   │   ├── MonitoringAbsensi.jsx
│       │   │   ├── DataGuruKepsek.jsx
│       │   │   ├── DetailGuruKepsek.jsx
│       │   │   ├── DataSiswaKepsek.jsx
│       │   │   ├── DetailSiswaKepsek.jsx
│       │   │   ├── PengumumanKepsek.jsx
│       │   │   ├── KalenderAkademik.jsx
│       │   │   └── ProfilKepsek.jsx
│       │   ├── ortu/
│       │   │   ├── OrtuLayout.jsx
│       │   │   ├── AbsensiAnak.jsx
│       │   │   ├── RiwayatAbsensiAnak.jsx
│       │   │   ├── DataAnak.jsx
│       │   │   ├── TambahAnak.jsx
│       │   │   ├── PengumumanOrtu.jsx
│       │   │   └── ProfilOrtu.jsx
│       │   ├── walikelas/
│       │   │   ├── WaliKelasLayout.jsx
│       │   │   └── DashboardWaliKelas.jsx      ← placeholder
│       │   ├── bendahara/
│       │   │   ├── BendaharaLayout.jsx
│       │   │   └── DashboardBendahara.jsx      ← placeholder
│       │   └── adminppdb/
│       │       ├── AdminPpdbLayout.jsx
│       │       └── DashboardAdminPpdb.jsx      ← placeholder
│       ├── App.jsx
│       └── main.jsx
│
└── backend/
    ├── app/
    │   ├── Http/
    │   │   ├── Controllers/
    │   │   │   ├── Auth/AuthController.php
    │   │   │   ├── Operator/OperatorController.php
    │   │   │   ├── Guru/GuruController.php
    │   │   │   ├── Kepsek/KepsekController.php
    │   │   │   ├── Kepsek/KalenderAkademikController.php
    │   │   │   ├── Ortu/OrtuController.php
    │   │   │   ├── Absensi/AbsensiController.php
    │   │   │   ├── GaleriController.php
    │   │   │   ├── PengumumanController.php
    │   │   │   └── MasterData/
    │   │   │       ├── MasterDataGuruController.php
    │   │   │       ├── MasterDataSiswaController.php
    │   │   │       ├── MasterDataKelasController.php
    │   │   │       ├── MasterDataOrtuController.php
    │   │   │       ├── MasterDataMapelController.php  ← xlsx pure-PHP
    │   │   │       ├── JadwalPelajaranController.php
    │   │   │       ├── TahunAjaranController.php      ← STABIL
    │   │   │       └── NaikKelasController.php
    │   │   └── Middleware/RoleMiddleware.php
    │   └── Models/
    │       ├── User.php
    │       ├── Role.php
    │       ├── Guru.php
    │       ├── Siswa.php
    │       ├── OrangTua.php
    │       ├── Kelas.php
    │       ├── RiwayatKelas.php      ← alias: SiswaKelas.php (backward-compat)
    │       ├── TahunAjaran.php
    │       ├── Semester.php
    │       ├── MataPelajaran.php     ← $table = 'mapels'
    │       ├── JadwalPelajaran.php   ← $table = 'jadwals'
    │       ├── PlotGuruMapel.php
    │       ├── Absensi.php
    │       ├── Pengumuman.php
    │       ├── Galeri.php
    │       ├── KalenderAkademik.php
    │       ├── Pengaturan.php
    │       ├── OperatorProfile.php
    │       ├── UserBendahara.php
    │       ├── UserWaliKelas.php
    │       └── ActivityLog.php
    ├── routes/api.php
    └── database/
        ├── migrations/
        └── db_minurulhuda3.sql       ← GROUND TRUTH schema
```

---

## 🗄️ Skema Database — Tabel Aktual

> ⚠️ Nama tabel, kolom, dan PK di bawah ini adalah GROUND TRUTH dari `db_minurulhuda3.sql`.
> Jangan asumsikan nama lain. Cek file SQL dulu sebelum nulis query apapun.

### Tabel Utama

| Tabel | Primary Key | Catatan Penting |
|-------|-------------|-----------------|
| `users` | `id` (bigint) | Akun login semua role |
| `roles` | `id` (tinyint) | Kolom: `slug`, `nama`, `is_active` |
| `user_roles` | pivot | Kolom: `user_id`, `role_id` |
| `gurus` | `id` (bigint) | `nuptk` = unique, **bukan PK** |
| `siswas` | `id` (bigint) | `nisn` = unique, **bukan PK** |
| `orang_tuas` | `id` (bigint) | Data orang tua / wali |
| `orang_tua_siswa` | pivot | Kolom: `orang_tua_id`, `siswa_id` |
| `kelas` | `id` (bigint) | FK wali: `wali_kelas_id` → `gurus.id` |
| `riwayat_kelas` | `id` (bigint) | Pengganti `siswa_kelas`. Kolom: `siswa_id`, `kelas_id`, `tanggal_keluar`, `jenis_perubahan` |
| `tahun_ajarans` | `id` (bigint) | Nama tabel plural dengan suffix `s` |
| `semesters` | `id` (bigint) | FK ke `tahun_ajarans.id` |
| `mapels` | `id` (bigint) | Kolom kode: `kode` (bukan `kode_mapel`) |
| `jadwals` | `id` (bigint) | Kolom: `plot_id`, `kelas_id`, `guru_id`, `mapel_id`, `semester_id`, `hari`, `jam_ke`, `jam_mulai`, `jam_selesai` |
| `plot_guru_mapels` | `id` (bigint) | Penugasan guru mengajar mapel di kelas |
| `absensis` | `id` (bigint) | FK: `siswa_id`, `kelas_id`, `jadwal_id` (bukan `id_kelas`/`id_jadwal`) |
| `pengumumans` | `id` (bigint) | Pengumuman |
| `galeris` | `id` (bigint) | Galeri foto |
| `kalender_akademiks` | `id` (bigint) | Kalender event |
| `pengaturans` | `id` (bigint) | Setting sistem (key-value) |
| `operator_profiles` | `id` (bigint) | Profil operator |
| `wali_kelas` | `id` (bigint) | Kolom: `guru_id`, `kelas_id`, `tahun_ajaran_id`, `semester_id`, `is_active` |
| `bendaharas` | `id` (bigint) | Profil bendahara |
| `activity_logs` | `id` (bigint) | Log aktivitas |
| `personal_access_tokens` | `id` | Sanctum tokens |

### ⚠️ Perbedaan Kritis vs Asumsi Umum

| Yang SALAH (asumsi lama / umum) | Yang BENAR (aktual DB) |
|----------------------------------|------------------------|
| PK `siswas` = `nisn` | PK `siswas` = `id`, `nisn` hanya unique |
| PK `gurus` = `nuptk` | PK `gurus` = `id`, `nuptk` hanya unique |
| Tabel `siswa_kelas` | Tabel `riwayat_kelas` |
| Kolom `status_keluar` di siswa_kelas | Pakai `scopeAktif()` — cek `tanggal_keluar` IS NULL |
| FK `id_kelas` di absensis | FK `kelas_id` di `absensis` |
| FK `id_jadwal` di absensis | FK `jadwal_id` di `absensis` |
| FK `nuptk_wali` di kelas | FK `wali_kelas_id` di `kelas` |
| Kolom `kode_mapel` di mapels | Kolom `kode` di `mapels` |
| Tabel `jadwal_pelajaran` | Tabel `jadwals` |
| Tabel `mata_pelajaran` | Tabel `mapels` |
| Tabel `absensi` | Tabel `absensis` |
| Tabel `tahun_ajaran` | Tabel `tahun_ajarans` |
| Tabel `pengumuman` | Tabel `pengumumans` |
| Kolom `semester` di jadwals | Kolom `semester_id` (FK ke `semesters`) |
| Kolom `tahun_ajaran` di jadwals | Tidak ada — resolve via `semester.tahun_ajaran_id` |
| Kolom `id_mapel`, `nuptk` di jadwals | Kolom `mapel_id`, `guru_id` di `jadwals` |

---

## 🌐 API Routes Terdaftar (`backend/routes/api.php`)

### Public (tanpa auth)
| Method | Path | Controller |
|--------|------|------------|
| POST | `/api/auth/login` | `AuthController@login` |
| POST | `/api/auth/register-ortu` | `AuthController@registerOrtu` |
| GET | `/api/galeri` | `GaleriController@index` |

### Auth (Sanctum)
| Method | Path | Controller |
|--------|------|------------|
| POST | `/api/auth/logout` | `AuthController@logout` |
| GET | `/api/auth/me` | `AuthController@me` |
| GET | `/api/pengumuman` | `PengumumanController@index` |

### Absensi (role: guru, operator)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/absensi/kelas/{id_kelas}` | |
| POST | `/api/absensi` | |
| PUT | `/api/absensi/{id}` | |
| GET | `/api/absensi/rekap/{id_kelas}` | role: guru, kepsek, operator |
| GET | `/api/absensi/siswa/{nisn}` | role: guru, operator, ortu |

### Operator (`/api/operator/*`, role: operator)
| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/operator/pengaturan/kode-registrasi` | |
| POST | `/operator/pengaturan/kode-registrasi` | |
| GET | `/operator/users` | |
| POST | `/operator/operator\|guru\|kepsek\|ortu\|bendahara\|walikelas` | Create user |
| PATCH | `/operator/users/{id}/toggle-active` | |
| PATCH | `/operator/users/{id}/approve-ortu` | |
| PATCH | `/operator/users/{id}/reset-password` | |
| DELETE | `/operator/users/{id}` | |
| GET/PUT | `/operator/ortu/{id}` | |
| GET | `/operator/ortu/pending` | |
| POST | `/operator/ortu/{id}/anak` | |
| **master-data/guru** | CRUD + dropdown + foto + akun | |
| **master-data/siswa** | CRUD + foto + assign-kelas + mutasi | |
| **master-data/orang-tua** | CRUD | |
| **master-data/kelas** | CRUD + dropdown + riwayat | |
| **master-data/tahun-ajaran** | CRUD + setAktif + setSemesterAktif | |
| **master-data/naik-kelas** | preview + proses | |
| GET | `master-data/mapel/dropdown` | ⚠️ Harus SEBELUM `{id}` |
| GET | `master-data/mapel/export` | ⚠️ Harus SEBELUM `{id}` |
| GET | `master-data/mapel/template` | ⚠️ Harus SEBELUM `{id}` |
| POST | `master-data/mapel/import` | ⚠️ Harus SEBELUM `{id}` |
| GET/POST | `master-data/mapel` | CRUD mapel |
| GET/PUT/PATCH/DELETE | `master-data/mapel/{id}` | |
| **master-data/jadwal-pelajaran** | CRUD | |
| POST/PUT/DELETE | `/operator/pengumuman` | |
| POST/DELETE | `/operator/galeri` | |

### Guru (`/api/guru/*`, role: guru)
`dashboard`, `siswa`, `siswa/{nisn}`, `kelas`, `kelas/{id_kelas}`, `kelas/{id}/riwayat`, `kelas/{id}/rekap`, `kelas/{id}/jadwal-hari-ini`, `jadwal`, `profil`, `profil/update`

### Kepsek (`/api/kepsek/*`, role: kepsek)
`dashboard`, `rekap`, `siswa-alpa`, `guru`, `guru/{nuptk}`, `siswa`, `siswa/{nisn}`, `kelas-filter`, `pengumuman` (CRUD), `kalender` (CRUD), `profil`, `profil/update`

### Ortu (`/api/ortu/*`, role: ortu)
`dashboard`, `profil-anak`, `absensi`, `pengumuman`, `daftar-anak`, `anak` (CRUD), `profil`, `profil` (update)

---

## 🔧 Konvensi Kode

### Frontend
- Setiap role punya **Layout sendiri** (`OperatorLayout.jsx`, `GuruLayout.jsx`, dst.)
- Auth state via `useAuth()` dari `AuthContext`
- `api` dari `lib/axios.js` — sudah auto-attach Bearer token dari `localStorage.getItem("token")`
- `BASE_URL` foto: `import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001"`
- Styling hanya TailwindCSS v4
- API call langsung di komponen via React Query — tidak ada folder `api/` terpisah
- State management: React Query untuk server state, `useState` untuk UI state lokal

### Backend (Laravel)
- Semua route di `backend/routes/api.php` prefix `/api`
- Protected routes: `middleware('auth:sanctum')`
- Role guard: `middleware('role:operator')` via `RoleMiddleware` — cek lewat slug di `user_roles`
- **⚠️ Route statis WAJIB didaftar SEBELUM wildcard `{id}`** (contoh: `/mapel/export` harus sebelum `/mapel/{id}`)
- Model `Siswa` → `$table = 'siswas'`, PK = `id`, `nisn` unique
- Model `Guru` → `$table = 'gurus'`, PK = `id`, `nuptk` unique
- Model `RiwayatKelas` → `$table = 'riwayat_kelas'`, punya `scopeAktif()` untuk filter siswa aktif
- Model `SiswaKelas` → alias backward-compatible untuk `RiwayatKelas`; gunakan `RiwayatKelas` untuk kode baru
- Model `JadwalPelajaran` → `$table = 'jadwals'`
- Model `MataPelajaran` → `$table = 'mapels'`
- **Excel**: gunakan `ZipArchive` + `SimpleXML` (built-in PHP) — PhpSpreadsheet belum diinstall

---

## 🚀 Cara Menjalankan

```bash
# Frontend
cd frontend && npm install && npm run dev   # port 5173

# Backend
cd backend && composer install
cp .env.example .env && php artisan key:generate
php artisan migrate && php artisan serve    # port 8000/8001

# Keduanya sekaligus (dari root)
npm run dev
```

---

## ⚠️ ATURAN AI — WAJIB DIIKUTI

### Sebelum Mulai
1. **Baca section COMPLETED dulu** — semua file di sana tidak boleh diubah tanpa izin eksplisit user.
2. **Tulis fitur ke IN PROGRESS dulu** sebelum mulai mengerjakan apapun.
3. **Konfirmasi scope** — pastikan sudah paham apa yang diminta sebelum nulis kode.

### Selama Mengerjakan
4. **Satu sesi = satu fitur** — jangan ubah file di luar scope yang sedang dikerjakan.
5. **Jangan refactor** kode yang tidak diminta direfactor, meskipun kelihatan bisa diperbaiki.
6. **Jangan ubah** `App.jsx`, `AuthContext.jsx`, `axios.js`, atau `ProtectedRoute.jsx` tanpa konfirmasi eksplisit.
7. **Jangan install** dependency baru tanpa konfirmasi user.
8. **Kalau ragu apakah boleh ubah sesuatu — tanya dulu, jangan asumsi boleh.**
9. **⚠️ Route statis dulu, baru wildcard** — saat tambah route baru di Laravel, pastikan route seperti `/mapel/export` didaftar SEBELUM `/mapel/{id}` agar tidak tertimpa.

### Soal Status Fitur
10. **Fitur HANYA boleh dipindahkan ke COMPLETED kalau user sudah bilang secara eksplisit**: "done", "selesai", "udah beres", "fix", atau kata setara lainnya.
11. **Selama user belum bilang done = fitur masih IN PROGRESS** — meskipun kode sudah ditulis, meskipun kelihatan sudah berjalan.
12. **Jangan auto-complete** — jangan anggap fitur selesai hanya karena AI sudah selesai menulis kodenya.
13. **Jangan pindahkan** fitur dari IN PROGRESS ke COMPLETED atas inisiatif sendiri.

### Setelah Selesai (hanya jika user bilang done)
14. Centang `[x]` di IN PROGRESS, lalu pindahkan ke section COMPLETED role yang sesuai.
15. Kosongkan IN PROGRESS (isi kembali jadi `- [ ] *(kosong)*`).

### 🧠 Aturan Eksekusi & Kualitas Kode (Power Rules)
16. **Search Before Write:** Periksa model, kolom database, atau komponen yang sudah ada sebelum menulis kode baru. Dilarang menebak nama variabel/kolom/fungsi!
17. **Plan Before Code:** Untuk fitur baru/kompleks, berikan rancangan alur terlebih dahulu dan tunggu persetujuan user sebelum generate kode.
18. **Re-use Over Re-create:** Cek komponen atau helper yang sudah ada sebelum membuat baru. Hindari duplikasi kode.
19. **Mandatory Auth & Role Check:** Setiap endpoint Laravel baru WAJIB dilengkapi middleware role yang sesuai.
20. **Root Cause Analysis:** Saat fix bug, jelaskan AKAR MASALAH-nya terlebih dahulu sebelum memberikan solusi.
21. **Targeted Output:** Saat mengedit file panjang, berikan HANYA bagian kode yang diubah (gunakan komentar `// ... existing code ...`). Jangan cetak ulang seluruh file.
22. **No Over-Engineering:** Fokus 100% pada requirement. Jangan tambahkan fitur ekstra, styling berlebihan, atau refactor yang tidak diminta.

### 🛡️ Aturan Keamanan Database & Migrasi
23. **DILARANG KERAS `migrate:fresh` / `migrate:reset`** tanpa izin eksplisit. Data di database adalah SUCI.
24. **Dilarang Edit File Migrasi Lama:** Perlu ubah skema? **Buat file migrasi baru** (contoh: `add_kolom_to_tabel`).
25. **Cek Skema Sebelum Query:** Sebelum menulis Eloquent/SQL, periksa nama tabel dan kolom yang benar-benar ada. Jangan berasumsi!
26. **Jaga Integritas Relasi:** Saat membuat tabel baru atau fitur hapus, pertimbangkan Foreign Key constraint dan Soft Deletes.
27. **Aman Saat Seeding & Import:** Gunakan `updateOrCreate()` atau `firstOrCreate()`, hindari `create()` biasa yang bisa trigger duplicate error.
28. **Konsistensi Penamaan:** snake_case plural untuk tabel, snake_case untuk foreign key.