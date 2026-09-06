# 18 · Roadmap

---

## Status Saat Ini

Project sudah punya fondasi yang berjalan:
- ✅ Auth lengkap: login multi-role, register ortu, forgot/reset password via email
- ✅ Multi-tenant login: cross-tenant prevention via subdomain + SchoolScope
- ✅ 13 role sistem: operator (super_operator merged), kepsek, wakasek, guru, guru_bk, wali_kelas, bendahara, admin_keuangan, tata_usaha, pustakawan, ortu, siswa, admin_ppdb
- ✅ DB + Model untuk modul BK, Perpustakaan, Surat/TU
- ✅ Master Data Guru (split 9 sub-controllers), Siswa, Kelas, Mapel, Jadwal, Tahun Ajaran
- ✅ Portal Guru, Kepsek, Ortu, Bendahara (functional)
- ✅ **Portal Wakasek Kurikulum** (September 2026) — portal dedicated, 11 halaman aktif, sidebar indigo, API route `/wakasek/*` sendiri
- ✅ **RBAC Wakasek-Operator Split** (September 2026) — pemisahan kebijakan akademik (wakasek) vs administrasi (operator), migration + seeder + 20+ frontend guards + sidebar restrukturisasi
- ✅ React frontend dengan layout per role + redirectMap 13 role

---

## Phase 0 — Fondasi Multi-Tenant & Database Overhaul
*Target: Fondasi Global SaaS & Multi-Tenancy (COMPLETED)*

- [x] Tambah kolom `school_id` ke semua tabel operasional
- [x] Buat tabel `schools`, `school_settings`, `school_domains`
- [x] Buat `global_users`, `global_user_schools`, `platform_admins` (Global Auth Lookup)
- [x] Buat Master Reference Tables: `master_religions`, `master_education_levels`, `master_status_kepegawaians`, `master_jenis_cutis`, `master_marital_statuses`, `master_school_types`, `master_blood_types` (`school_id` NULLABLE)
- [x] Buat Kupon & Diskon Billing: `saas_coupons`, `saas_coupon_usages`, `tax_rate` di `saas_invoices`
- [x] Buat LMS Tables (`lms_courses`, `lms_quizzes`, dll), Notification Engine (`saas_notifications`), & Backups (`tenant_backups`)
- [x] Tambah kolom JSON Fleksibel i18n (`national_ids`, `address_details`) di `gurus` & `siswas`
- [x] Buat `SchoolScope` (Global Scope)
- [x] Buat `TenantMiddleware`
- [x] Ganti `RoleMiddleware` dengan `PermissionMiddleware`
- [x] Buat tabel `permissions` dan `role_permissions`
- [x] Buat `SchoolProvisioningService` (seed role + permission saat sekolah baru)
- [x] Update `users` table: `school_id`, `ulid`, `global_user_id`
- [x] Update `roles` table: `school_id`, ganti `TINYINT` id jadi `BIGINT`

---

## Phase 1 — Refactor Backend (No New Feature)
*Target: semua yang ada jadi rapi dan aman*

- [ ] Pecah `routes/api.php` → `routes/api/*.php`
- [ ] Buat semua Form Request (85 inline validate)
- [ ] Buat `ApiResponse` trait + update semua controller
- [ ] Buat `GuruResource`, `SiswaResource` dll (API Resource)
- [ ] Pecah `MasterDataGuruController` (5078 baris) jadi 9 controller
- [ ] Pindah inline closure route ke controller
- [ ] Rename `app/jobs/` → `app/Jobs/` (naming convention)
- [ ] Tambah `$hidden` di model (hapus field sensitif dari serialisasi)
- [ ] Tambah scope `scopeAktif()`, `scopeVerified()` di model Guru, Siswa
- [ ] Tambah `GuruPolicy`, `SiswaPolicy`, `DokumenPolicy`
- [ ] Buat `GuruObserver`, `SiswaObserver` untuk audit log

---

## Phase 2 — Refactor Frontend (No New Feature)
*Target: komponen reusable, React Query konsisten*

- [x] Buat `components/ui/` (DataTable, Modal, Badge, Skeleton, dll) `[DONE]`
- [x] Satukan semua Layout jadi satu `AppLayout.jsx` — 12/14 roles `[MOSTLY DONE]`
- [ ] Satukan semua Sidebar jadi satu `Sidebar.jsx` (dinamis per permission) `[IN PROGRESS]`
- [x] Buat `hooks/api/` (useGuru, useSiswa, useAbsensi, useKelas, dll) `[DONE]`
- [x] Migrasi halaman yang masih pakai `useEffect` + axios manual → React Query `[DONE]`
- [x] Pecah `DetailGuru.jsx` (7641 baris) jadi 8 tab komponen `[DONE]`
- [x] Pecah `MasterGuru.jsx` jadi komponen modular `[DONE]`
- [ ] Pecah `TambahEditGuru.jsx` (~64KB) `[NEEDS ATTENTION]`
- [x] Tambah `useDisclosure.js`, `useDebounce.js` hook `[DONE]`
- [x] **Portal Wakasek Kurikulum** — sidebar, layout, 11 halaman, API route dedicated `[DONE — September 2026]`
- [x] **RBAC Wakasek-Operator Split** — operator frontend: 20+ file dengan canManage/canCreate/canDelete guards, OperatorSidebar restrukturisasi dengan grup "Referensi Akademik" `[DONE — September 2026]`

---

## Phase 3 — Akademik Core
*Target: nilai, rapor, kalender akademik*

- [ ] Tabel: `komponen_penilaians`, `nilais`, `nilai_akhirs`
- [ ] Input nilai per mapel (permission `akademik.nilai.input` sudah ada di guru)
- [ ] Rekap nilai semua kelas (permission `akademik.nilai.view_all` sudah ada di wakasek & kepsek)
- [ ] Generate & finalisasi rapor semester (permission `akademik.rapor.manage` sudah ada di wakasek)
- [ ] Kalender akademik (sudah ada tabelnya, lengkapi fitur)
- [ ] Portal Wakasek: halaman Rapor & Nilai (saat ini masih "Soon" di sidebar)
- [ ] Portal Wakasek: Jadwal Pelajaran, Kalender Akademik, Penempatan Siswa, Pengampu Mapel

---

## Phase 4 — Keuangan
*Target: tagihan SPP dan pembayaran*

- [ ] CRUD jenis tagihan
- [ ] Generate tagihan per siswa per bulan
- [ ] Input pembayaran
- [ ] Laporan keuangan bulanan
- [ ] Export tagihan ke Excel / PDF

---

## Phase 5 — PPDB Online
*Target: penerimaan siswa baru digital*

- [ ] Form pendaftaran publik (tanpa login)
- [ ] Upload berkas pendaftaran
- [ ] Verifikasi berkas oleh admin PPDB
- [ ] Pengumuman hasil seleksi
- [ ] Konversi calon siswa → siswa aktif

---

## Phase 6 — Notification Center
*Target: notifikasi multi-channel*

- [ ] In-app notification (bell icon)
- [ ] Email via SMTP per sekolah (konfigurasi di school_settings)
- [ ] Template notifikasi per event (dokumen approve, absensi, dll)
- [ ] WhatsApp (via API gateway — opsional)

---

## Phase 7 — Integrasi Dapodik & EMIS
*Target: tidak perlu entry data dua kali*

- [ ] Export data guru format Dapodik
- [ ] Export data siswa format Dapodik
- [ ] Export format EMIS (Kemenag)
- [ ] Validasi data sesuai requirement Dapodik

---

## Phase 8 — Platform Admin Dashboard
*Target: Super Admin bisa kelola semua sekolah*

- [ ] Dashboard: daftar sekolah, status, jumlah user
- [ ] Kelola paket langganan
- [ ] Impersonate tenant untuk support
- [ ] Monitor penggunaan storage per sekolah

---

## Phase 9+ — Enterprise Features
*(setelah Phase 0-8 selesai dan stabil)*

- Workflow Engine (approval bertingkat)
- DMS lanjutan (OCR, retention, recycle bin)
- Global Search
- Reporting Engine (chart, pivot, export)
- Scheduler (backup, reminder, auto-archive)
- Theme Engine (per sekolah)
- Plugin System (perpustakaan, asrama, kantin)
- CI/CD Pipeline
- Monitoring (CPU, RAM, Queue, Slow Query)
- AI Integration

---

## Aturan Prioritas

**Jangan mulai Phase N+1 sebelum Phase N selesai.**

Kalau Phase 0 (multi-tenant) belum beres, semua fitur baru yang dibangun
akan harus diubah lagi. Itu buang waktu.

Urutan yang tidak bisa dilangkahi:
```
Phase 0 (fondasi) ✅ → Phase 1 (backend rapi) ✅ mostly → Phase 2 (frontend rapi) 🔄
→ baru boleh Phase 3, 4, 5, dst
```

### Progress Update — September 2026

**Yang sudah selesai di luar rencana awal (nilai positif):**
- Portal Wakasek Kurikulum selesai lebih awal — sebelumnya hanya placeholder
- RBAC Wakasek-Operator split selesai — diferensiasi vs kompetitor (Skoola, Kamadeva)
- Permission guards di 20+ halaman operator — UI konsisten dengan RBAC backend

**Yang masih harus diselesaikan sebelum Phase 3:**
- [ ] TambahEditGuru.jsx masih ~64KB — perlu dipecah
- [ ] Sidebar unifikasi belum selesai (WakasekSidebar, OperatorSidebar, Sidebar masih terpisah)
- [ ] Sisa portal placeholder: WaliKelas, GuruBK, TataUsaha, Pustakawan, AdminKeuangan, Siswa, SuperAdmin
- [ ] API Resource belum sistematis diterapkan di semua controller
- [ ] Observer pattern belum diimplementasikan