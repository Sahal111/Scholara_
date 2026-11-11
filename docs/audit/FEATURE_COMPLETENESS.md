# FEATURE COMPLETENESS — SCHOLARA

**Versi:** 2.0 (menggantikan draft v1 yang menandai banyak modul rusak sebagai COMPLETE)
**Tanggal:** 11 November 2026
**Metode:** Static inspection terhadap route, controller, model, migrasi, dan halaman React
**Status runtime:** MySQL tidak berjalan; status `COMPLETE` berarti lengkap secara statis, bukan jaminan lulus uji runtime

---

## 1. Ringkasan Eksekutif

Dari **80 fitur** yang diaudit:

| Status | Jumlah | Persentase |
|---|---:|---:|
| COMPLETE | 24 | 30,0% |
| PARTIALLY COMPLETE | 19 | 23,75% |
| BROKEN | 17 | 21,25% |
| BACKEND ONLY | 9 | 11,25% |
| UI ONLY | 4 | 5,0% |
| NOT IMPLEMENTED | 4 | 5,0% |
| NEEDS VERIFICATION | 3 | 3,75% |
| **Total** | **80** | **100%** |

**Estimasi kelengkapan fungsional:** ±45%
**Estimasi kesiapan produksi:** ±30%

Angka ini jauh di bawah klaim `PROJECT_COMPLETION_MATRIX.md` (62% dan mayoritas `✅`). Alasannya:

1. Banyak modul hanya tersedia di backend tanpa UI yang terdaftar.
2. Beberapa alur inti rusak karena lookup PII terenkripsi.
3. Beberapa modul UI hanya placeholder `ComingSoon`.
4. Tabel nilai/rapor ada, tetapi tidak ada model, API, atau UI.

---

## 2. Legenda

| Status | Definisi |
|---|---|
| **COMPLETE** | UI, API, dan database tersedia serta saling terhubung secara statis |
| **PARTIALLY COMPLETE** | Alur utama ada, tetapi ada bug, relasi belum lengkap, atau sebagian role belum terlayani |
| **UI ONLY** | Tampilan ada, tetapi API/logika belum tersedia atau masih placeholder |
| **BACKEND ONLY** | API/model ada, tetapi UI tidak terdaftar atau tidak berfungsi |
| **NOT IMPLEMENTED** | Tidak ada implementasi yang dapat dipakai |
| **BROKEN** | Kode ada, tetapi alur utama gagal secara desain |
| **NEEDS VERIFICATION** | Tampak lengkap secara statis, tetapi perlu runtime |

Kolom UI/API/Database: **Ada**, **Sebagian**, **Tidak**, **ComingSoon**.

---

## 3. Matriks Kelengkapan

| No | Modul | Fitur | UI | API | Database | Status | Temuan |
|---:|---|---|---|---|---|---|---|
| 1 | Auth | Login multi-role | Ada | Ada | Ada | COMPLETE | Throttle 5/menit, anti-enumerasi, filter tenant |
| 2 | Auth | Logout / revoke token | Ada | Ada | Ada | COMPLETE | Menghapus token aktif |
| 3 | Auth | Session /me | Ada | Ada | Ada | COMPLETE | Profil per role |
| 4 | Auth | Register orang tua | Ada | Ada | Ada | PARTIALLY COMPLETE | Unique global; kode registrasi global |
| 5 | Auth | Lupa password | Ada | Ada | Ada | BROKEN | Tanpa subdomain `school_id` null |
| 6 | Auth | Reset password | Ada | Ada | Ada | BROKEN | Bergantung resolusi tenant |
| 7 | Auth | Ubah password mandiri | Sebagian | Sebagian | Ada | PARTIALLY COMPLETE | Hanya profil ortu |
| 8 | Operator | Dashboard | Ada | Ada | Ada | COMPLETE | Statistik agregat |
| 9 | Operator | Manajemen akun | Ada | Ada | Ada | PARTIALLY COMPLETE | `createOperator` tanpa `school_id` |
| 10 | Operator | Approval orang tua | Ada | Ada | Ada | COMPLETE | Perlu verifikasi runtime |
| 11 | Operator | Master guru — list/tambah | Ada | Ada | Ada | PARTIALLY COMPLETE | Lookup/unique NUPTK terenkripsi |
| 12 | Operator | Master guru — detail/edit/hapus | Ada | Ada | Ada | BROKEN | `where('nuptk')` gagal; hapus punya fallback ID |
| 13 | Operator | Master guru — import Excel | Ada | Ada | Ada | PARTIALLY COMPLETE | `GuruImportService` lookup NUPTK gagal |
| 14 | Operator | Master guru — export Excel | Ada | Ada | Ada | NEEDS VERIFICATION | Perlu uji kolom PII |
| 15 | Operator | Master guru — upload foto | Ada | Ada | Ada | BROKEN | Lookup NUPTK |
| 16 | Operator | DMS guru — upload/version | Ada | Ada | Ada | BROKEN | `school_id` kosong; disk mismatch |
| 17 | Operator | DMS guru — download | Ada | Ada | Ada | BROKEN | Path traversal + disk mismatch |
| 18 | Operator | Master siswa — list/cari | Ada | Ada | Ada | PARTIALLY COMPLETE | `orWhere` bocor; NISN terenkripsi |
| 19 | Operator | Master siswa — detail/edit | Ada | Ada | Ada | BROKEN | `where('nisn')` gagal |
| 20 | Operator | Master siswa — upload foto | Ada | Ada | Ada | BROKEN | Lookup NISN |
| 21 | Operator | Master siswa — import/export | Ada | Ada | Ada | NEEDS VERIFICATION | Risiko duplikat NISN |
| 22 | Operator | Mutasi siswa | Ada | Ada | Ada | PARTIALLY COMPLETE | `RiwayatKelas` tanpa `school_id` |
| 23 | Operator | Master kelas | Ada | Ada | Ada | PARTIALLY COMPLETE | Assign riwayat gagal |
| 24 | Operator | Naik kelas massal | Ada | Ada | Ada | BROKEN | `RiwayatKelas::create` tanpa `school_id` |
| 25 | Operator | Tahun ajaran & semester | Ada | Ada | Ada | COMPLETE | Workflow draft/review/approve |
| 26 | Operator | Mata pelajaran | Ada | Ada | Ada | COMPLETE | Composite unique |
| 27 | Operator | Jadwal pelajaran | Ada | Ada | Ada | COMPLETE | Perlu verifikasi bentrok |
| 28 | Operator | Pengumuman | Ada | Ada | Ada | COMPLETE | Scoped |
| 29 | Operator | Galeri | Ada | Ada | Ada | BROKEN | Tanpa scope; create gagal |
| 30 | Operator | Pengaturan kode registrasi | Ada | Ada | Ada | BROKEN | Global per `key` |
| 31 | Guru | Dashboard | Ada | Ada | Ada | COMPLETE | Statistik guru |
| 32 | Guru | Data siswa | Ada | Ada | Ada | PARTIALLY COMPLETE | Detail siswa terenkripsi |
| 33 | Guru | Input absensi | Ada | Ada | Ada | PARTIALLY COMPLETE | Cek kepemilikan hanya role guru |
| 34 | Guru | Rekap & riwayat absensi | Ada | Ada | Ada | PARTIALLY COMPLETE | Tanpa cek kepemilikan kelas |
| 35 | Guru | Jadwal mengajar | Ada | Ada | Ada | COMPLETE | Read-only |
| 36 | Guru | Profil guru | Ada | Ada | Ada | BROKEN | `where('nuptk')` |
| 37 | Guru | LMS — materi | Ada | Ada | Ada | PARTIALLY COMPLETE | Guru lain dapat edit/hapus |
| 38 | Guru | LMS — tugas | Ada | Ada | Ada | PARTIALLY COMPLETE | Guru lain dapat edit/nilai |
| 39 | Guru | LMS — ujian | Ada | Ada | Ada | PARTIALLY COMPLETE | Guru lain dapat edit; siswa lintas kelas |
| 40 | Guru | DMS & cuti | Ada | Ada | Ada | BROKEN | Model anak tanpa `school_id` |
| 41 | Kepsek | Dashboard | Ada | Ada | Ada | COMPLETE | Read-only |
| 42 | Kepsek | Monitoring absensi | Ada | Ada | Ada | COMPLETE | Perlu verifikasi agregasi |
| 43 | Kepsek | Data guru/siswa | Ada | Ada | Ada | BROKEN | Detail PII terenkripsi |
| 44 | Kepsek | Tahun ajaran | Ada | Ada | Ada | COMPLETE | Approve/activate |
| 45 | Kepsek | Kalender akademik | Ada | Ada | Ada | COMPLETE | — |
| 46 | Kepsek | Pengumuman | Ada | Ada | Ada | COMPLETE | — |
| 47 | Wakasek | Dashboard | Ada | Ada | Ada | COMPLETE | — |
| 48 | Wakasek | Kurikulum | Ada | Ada | Ada | COMPLETE | Modul paling matang |
| 49 | Wakasek | Program pendidikan | Ada | Ada | Ada | COMPLETE | — |
| 50 | Wakasek | Mapel & kelas | Ada | Ada | Ada | COMPLETE | — |
| 51 | Wakasek | Data guru/siswa | Ada | Ada | Ada | BROKEN | Detail PII terenkripsi |
| 52 | Wakasek | Monitoring absensi | Ada | Ada | Ada | COMPLETE | Read-only |
| 53 | Wakasek | Laporan | Ada | Ada | Ada | NEEDS VERIFICATION | Perlu uji isi |
| 54 | Bendahara | Jenis tagihan | Tidak | Ada | Ada | BACKEND ONLY | UI keuangan tidak terdaftar |
| 55 | Bendahara | Tagihan | Tidak | Ada | Ada | BACKEND ONLY | — |
| 56 | Bendahara | Pembayaran | Tidak | Ada | Ada | BACKEND ONLY | — |
| 57 | Bendahara | Laporan keuangan | Tidak | Ada | Ada | BACKEND ONLY | — |
| 58 | Bendahara | Halaman keuangan | Ada | Ada | Ada | UI ONLY | 4 halaman tidak di-route |
| 59 | Admin keuangan | Dashboard | ComingSoon | Ada | Ada | UI ONLY | Placeholder |
| 60 | PPDB | Pendaftaran publik | Ada | Ada | Ada | PARTIALLY COMPLETE | Perlu verifikasi upload |
| 61 | PPDB | Verifikasi pendaftar | Tidak | Ada | Ada | BACKEND ONLY | UI admin PPDB ComingSoon |
| 62 | PPDB | Konversi calon → siswa | Tidak | Ada | Ada | PARTIALLY COMPLETE | Unique NISN plaintext |
| 63 | PPDB | Pembayaran PPDB | Tidak | Ada | Ada | BACKEND ONLY | — |
| 64 | BK | Catatan & sesi konseling | ComingSoon | Ada | Ada | BACKEND ONLY | Dashboard BK placeholder |
| 65 | Perpustakaan | Buku & peminjaman | ComingSoon | Ada | Ada | BACKEND ONLY | Dashboard pustakawan placeholder |
| 66 | Tata usaha | Surat & legalisir | ComingSoon | Ada | Ada | BACKEND ONLY | Dashboard TU placeholder |
| 67 | Ortu | Dashboard | Ada | Ada | Ada | COMPLETE | — |
| 68 | Ortu | Absensi anak | Ada | Ada | Ada | PARTIALLY COMPLETE | Filter NISN terenkripsi |
| 69 | Ortu | Data anak | Ada | Ada | Ada | PARTIALLY COMPLETE | Sebagian lookup NISN |
| 70 | Ortu | Tambah anak | Ada | Ada | Ada | BROKEN | `where('nisn')` gagal |
| 71 | Ortu | Profil & ubah password | Ada | Ada | Ada | COMPLETE | — |
| 72 | Siswa | Dashboard | ComingSoon | Tidak | Ada | UI ONLY | Tidak ada API siswa |
| 73 | Siswa | LMS siswa | Tidak | Tidak | Ada | NOT IMPLEMENTED | Folder UI tidak ada |
| 74 | Penilaian | Input nilai | Tidak | Tidak | Ada | NOT IMPLEMENTED | Tabel `nilais` ada |
| 75 | Rapor | Nilai akhir & rapor | Tidak | Tidak | Ada | NOT IMPLEMENTED | Tabel `nilai_akhirs`, `rapors` ada |
| 76 | Superadmin | Dashboard SaaS | ComingSoon | Tidak | Ada | UI ONLY | Model SaaS ada |
| 77 | Superadmin | Kelola sekolah/langganan | Tidak | Tidak | Ada | NOT IMPLEMENTED | Tabel SaaS tidak diekspos |
| 78 | Publik | Landing & profil sekolah | Ada | Ada | Ada | COMPLETE | — |
| 79 | Publik | Galeri publik | Ada | Ada | Ada | BROKEN | Bocor lintas tenant |
| 80 | Publik | PPDB publik | Ada | Ada | Ada | PARTIALLY COMPLETE | Lihat modul PPDB |

---

## 4. Analisis per Modul

### 4.1 Auth

**Status modul: 70%**

| Fitur | Kondisi |
|---|---|
| Login | Solid: throttle, anti-enumerasi, filter tenant, multi-kandidat password |
| Logout | Menghapus token aktif |
| Session | Mengembalikan user, roles, permissions, profile, school |
| Register ortu | Berfungsi, tetapi unique global dan kode registrasi global |
| Lupa/reset password | Gagal senyap tanpa subdomain |
| Ubah password | Hanya tersedia di profil ortu |

**Gap utama:** reset password tidak dapat diandalkan; tidak ada 2FA; tidak ada manajemen sesi perangkat.

### 4.2 Operator

**Status modul: 55%**

Kekuatan:
- Dashboard, manajemen akun, approval ortu, tahun ajaran, mapel, jadwal, pengumuman.
- Import/export guru dan siswa tersedia.

Kelemahan:
- **Master guru** — detail/edit/hapus/foto/verifikasi gagal karena `where('nuptk')`.
- **Master siswa** — detail/edit/foto gagal karena `where('nisn')`.
- **DMS** — upload gagal karena `school_id`; download gagal karena disk; path traversal kritis.
- **Kelas/naik kelas** — `RiwayatKelas::create` tanpa `school_id`.
- **Galeri** — tanpa scope, create gagal, delete lintas tenant.
- **Pengaturan** — global per `key`.
- **Manajemen akun** — create operator/bendahara tanpa `school_id`.

### 4.3 Guru

**Status modul: 55%**

Kekuatan:
- Dashboard, data siswa, jadwal, absensi, LMS (materi/tugas/ujian), pengumuman.

Kelemahan:
- Profil guru gagal karena NUPTK.
- Absensi tidak memiliki cek kepemilikan objek.
- LMS tidak memiliki cek kepemilikan konten.
- DMS dan cuti gagal karena `school_id`.
- Tidak ada UI siswa untuk LMS.

### 4.4 Kepala Sekolah

**Status modul: 65%**

Kekuatan:
- Dashboard, monitoring absensi, tahun ajaran (approve/activate), kalender, pengumuman.

Kelemahan:
- Detail guru/siswa gagal karena PII.
- Tidak ada laporan eksekutif yang lengkap.
- Beberapa data bergantung pada modul yang belum lengkap (keuangan, PPDB).

### 4.5 Wakasek

**Status modul: 75%**

Modul paling matang:
- Kurikulum (struktur, komponen, workflow review/approve/activate).
- Program pendidikan, mapel, kelas.
- Monitoring absensi dan laporan.

Kelemahan:
- Detail guru/siswa mewarisi bug PII.
- Laporan perlu verifikasi isi dan format.

### 4.6 Bendahara / Keuangan

**Status modul: 40%**

Backend:
- 20 route: jenis tagihan, tagihan, pembayaran, laporan.
- Model scoped: `JenisTagihan`, `Tagihan`, `Pembayaran`.

Frontend:
- 4 halaman keuangan ada (`DashboardKeuangan`, `JenisTagihan`, `Pembayaran`, `Tagihan`), tetapi **tidak diimpor/didaftarkan** di `App.jsx`.
- `DashboardBendahara` masih `ComingSoon`.
- `BendaharaLayout` menautkan `/bendahara/laporan` dan `/bendahara/profil` yang tidak ada.

**Kesimpulan:** fitur secara fungsional ada di backend, tetapi pengguna tidak dapat mengaksesnya.

### 4.7 PPDB

**Status modul: 45%**

Backend:
- 16 route: pendaftaran, berkas, verifikasi, konversi, pembayaran.
- Model scoped: `CalonSiswa`, `BerkasPendaftar`, `PembayaranPpdb`.

Frontend:
- Halaman publik PPDB ada.
- Dashboard admin PPDB `ComingSoon`.
- Tidak ada UI verifikasi/konversi.

Kelemahan:
- Konversi calon → siswa memakai unique NISN yang tidak efektif.
- Upload berkas perlu verifikasi keamanan.

### 4.8 BK

**Status modul: 30%**

- 12 route backend (catatan, konseling).
- Dashboard `ComingSoon`.
- Tidak ada UI CRUD.

### 4.9 Perpustakaan

**Status modul: 30%**

- 12 route backend (buku, peminjaman).
- Dashboard `ComingSoon`.
- Tidak ada UI CRUD.

### 4.10 Tata Usaha

**Status modul: 30%**

- 12 route backend (surat, legalisir).
- Dashboard `ComingSoon`.
- Tidak ada UI CRUD.

### 4.11 Orang Tua

**Status modul: 55%**

Kekuatan:
- Dashboard, absensi anak, data anak, pengumuman, profil, ubah password.

Kelemahan:
- Tambah anak gagal karena `where('nisn')`.
- Sebagian filter NISN gagal.
- Tidak ada pembayaran SPP atau rapor.

### 4.12 Siswa

**Status modul: 10%**

- Hanya dashboard `ComingSoon`.
- Tidak ada route API siswa.
- Tidak ada LMS, nilai, rapor, jadwal, atau absensi pribadi.
- Folder `pages/siswa/lms` tidak ada.

### 4.13 Penilaian dan Rapor

**Status modul: 10% (database only)**

- Tabel `nilais`, `nilai_akhirs`, `rapors` **ada** di migrasi `2026_08_05_000006`.
- Composite unique per sekolah ditambahkan.
- **Tidak ada model, controller, route, atau UI.**
- Tidak ada kalkulasi nilai akhir, bobot, atau cetak rapor.

Ini gap terbesar untuk aplikasi yang menyebut dirinya sistem akademik.

### 4.14 Superadmin / SaaS

**Status modul: 15%**

- Model dan migrasi SaaS: `SaasPlan`, `SaasPlanFeature`, `SchoolSubscription`, `SaasInvoice`, `SaasPayment`, `SaasCoupon`, `TenantUsageSnapshot`.
- **Tidak ada controller, route, atau UI.**
- Dashboard superadmin `ComingSoon`.
- Tidak ada pengelolaan sekolah, langganan, invoice, atau kuota.

### 4.15 Publik

**Status modul: 75%**

- Landing, about, program, akademik, PPDB, contact, galeri.
- Galeri bocor lintas tenant dan create gagal.
- `solution.html` kosong.

---

## 5. Matriks Portal per Role

| Role | Layout | Dashboard | Modul Utama | Status UI |
|---|---|---|---|---|
| `operator` | Ada | Berfungsi | Master data, akun, tahun ajaran | Sebagian besar ada; banyak dead link |
| `guru` | Ada | Berfungsi | Absensi, LMS, siswa, jadwal, profil | Profil/DMS rusak |
| `wali_kelas` | Ada | **ComingSoon** | Seharusnya absensi & siswa | Tidak berfungsi |
| `kepsek` | Ada | Berfungsi | Monitoring, approve TA, kalender | Detail PII rusak |
| `wakasek` | Ada | Berfungsi | Kurikulum, program, mapel, kelas | Paling lengkap |
| `bendahara` | Ada | **ComingSoon** | Keuangan | Halaman ada, tidak terdaftar |
| `admin_keuangan` | Ada | **ComingSoon** | Keuangan | Placeholder |
| `admin_ppdb` | Ada | **ComingSoon** | PPDB | Placeholder |
| `guru_bk` | Ada | **ComingSoon** | BK | Placeholder |
| `pustakawan` | Ada | **ComingSoon** | Perpustakaan | Placeholder |
| `tata_usaha` | Ada | **ComingSoon** | Surat/legalisir | Placeholder |
| `ortu` | Ada | Berfungsi | Anak, absensi, pengumuman | Tambah anak rusak |
| `siswa` | Ada | **ComingSoon** | LMS/nilai/rapor | Tidak ada |
| `super_admin` | Ada | **ComingSoon** | SaaS | Tidak ada API |

---

## 6. Halaman dan Route yang Tidak Terhubung

### 6.1 Halaman ada, route tidak ada

| Halaman | Lokasi | Dampak |
|---|---|---|
| Dashboard keuangan | `pages/bendahara/keuangan/DashboardKeuangan.jsx` | Tidak dapat diakses |
| Jenis tagihan | `pages/bendahara/keuangan/JenisTagihan.jsx` | Tidak dapat diakses |
| Tagihan | `pages/bendahara/keuangan/Tagihan.jsx` | Tidak dapat diakses |
| Pembayaran | `pages/bendahara/keuangan/Pembayaran.jsx` | Tidak dapat diakses |

### 6.2 Link sidebar tanpa route

| Link | Sidebar |
|---|---|
| `/operator/keuangan*` | Operator |
| `/operator/approval-ortu` | Operator (route aktual `ortu-pending`) |
| `/operator/manajemen-akun` | Operator (halaman di index) |
| `/operator/akademik/*` | Operator |
| `/operator/kesiswaan/*` | Operator |
| `/operator/ppdb/*` | Operator |
| `/operator/laporan/*` | Operator |
| `/operator/absensi` | Operator |
| `/operator/surat` | Operator |
| `/bendahara/laporan` | Bendahara |
| `/bendahara/profil` | Bendahara |

### 6.3 Route ada, UI placeholder

- `/walikelas` → `ComingSoonDashboard`
- `/siswa` → `ComingSoonDashboard`
- `/guru-bk` → `ComingSoonDashboard`
- `/pustakawan` → `ComingSoonDashboard`
- `/tata-usaha` → `ComingSoonDashboard`
- `/admin-keuangan` → `ComingSoonDashboard`
- `/admin-ppdb` → `ComingSoonDashboard`
- `/superadmin` → `ComingSoonDashboard`
- `/bendahara` → `ComingSoonDashboard`

---

## 7. Tabel Database Tanpa Implementasi Aplikasi

| Tabel | Migrasi | Model | Controller | Route | UI |
|---|---|---|---|---|---|
| `nilais` | Ada | Tidak | Tidak | Tidak | Tidak |
| `nilai_akhirs` | Ada | Tidak | Tidak | Tidak | Tidak |
| `rapors` | Ada | Tidak | Tidak | Tidak | Tidak |
| `saas_plans` | Ada | Ada | Tidak | Tidak | Tidak |
| `saas_plan_features` | Ada | Ada | Tidak | Tidak | Tidak |
| `school_subscriptions` | Ada | Ada | Tidak | Tidak | Tidak |
| `saas_invoices` | Ada | Ada | Tidak | Tidak | Tidak |
| `saas_payments` | Ada | Ada | Tidak | Tidak | Tidak |
| `saas_coupons` | Ada | Ada | Tidak | Tidak | Tidak |
| `tenant_usage_snapshots` | Ada | Ada | Tidak | Tidak | Tidak |

Catatan: untuk tabel SaaS, model sudah ada tetapi tidak ada API/UI. Untuk nilai/rapor, bahkan model belum ada.

---

## 8. Estimasi Kelengkapan per Modul

| Modul | Estimasi | Alasan |
|---|---:|---|
| Auth | 70% | Reset password rusak, tanpa 2FA/manajemen sesi |
| Operator | 55% | Banyak alur PII/tenant rusak |
| Guru | 55% | LMS dan absensi tanpa otorisasi objek |
| Kepsek | 65% | Detail PII rusak, laporan belum lengkap |
| Wakasek | 75% | Kurikulum matang |
| Keuangan | 40% | Backend ada, UI tidak terdaftar |
| PPDB | 45% | Backend ada, UI admin placeholder |
| BK | 30% | Backend saja |
| Perpustakaan | 30% | Backend saja |
| Tata usaha | 30% | Backend saja |
| Ortu | 55% | Tambah anak rusak |
| Siswa | 10% | Dashboard placeholder |
| Penilaian/Rapor | 10% | Database only |
| Superadmin/SaaS | 15% | Model only |
| Publik | 75% | Galeri rusak |
| **Rata-rata tertimbang** | **±45%** | |

---

## 9. Prioritas Penyelesaian Fitur

### 9.1 Untuk mencapai "usable MVP"

1. Perbaiki auth (reset password, register ortu).
2. Perbaiki master guru/siswa/ortu (PII lookup).
3. Perbaiki kelas/naik kelas/DMS/galeri (`school_id`).
4. Perbaiki absensi dan LMS (otorisasi).
5. Daftarkan halaman keuangan yang sudah ada.
6. Sediakan dashboard wali kelas.

### 9.2 Untuk mencapai "production"

1. UI keuangan lengkap.
2. UI PPDB lengkap.
3. UI BK/Perpustakaan/TU.
4. LMS siswa + nilai + rapor.
5. Superadmin SaaS.
6. Laporan dan export.

### 9.3 Untuk mencapai "competitive"

1. 2FA dan manajemen sesi.
2. Notifikasi real-time.
3. Mobile app/PWA.
4. Integrasi pembayaran.
5. Analitik dan benchmarking.
6. Multi-bahasa.

---

## 10. Kesimpulan

Scholara memiliki **cakupan modul yang luas**, tetapi kelengkapan fungsional baru sekitar **45%**. Kekuatan utamanya ada di master data, kurikulum, tahun ajaran, dan auth. Kelemahan utamanya adalah:

- Alur inti guru/siswa/ortu rusak karena PII.
- Modul keuangan, PPDB, BK, perpustakaan, dan TU belum memiliki UI.
- Siswa dan penilaian/rapor hampir tidak ada.
- Banyak halaman dan tautan tidak terhubung.

Klaim completion di dokumen lama tidak dapat dipertahankan. Status di dokumen ini harus dijadikan acuan hingga ada audit runtime yang membuktikan sebaliknya.

---

**Auditor:** AI technical audit
**Tanggal:** 11 November 2026
**Versi:** 2.0
