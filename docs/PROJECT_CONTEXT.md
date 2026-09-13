# PROJECT CONTEXT

> **Single source of truth untuk AI coding agent.**
> Baca file ini SEBELUM menulis satu baris kode pun.
> Jika ada konflik antar dokumen, urutan prioritas: source code aktual → migrations/schema → composer.json/package.json → file ini → docs lainnya.

---

## 1. Identitas Project

| Field | Value |
|---|---|
| **Nama** | SIAKAD / Scholara |
| **Tipe** | Multi-tenant SaaS School Management System |
| **Target** | Madrasah (MI, MTs, MA) & sekolah umum (SD, SMP, SMA, SMK) di Indonesia |
| **Stack Backend** | Laravel 12 (PHP 8.2+) |
| **Stack Frontend** | React 19 + Vite 8 + Tailwind CSS 4 + TanStack React Query 5 |
| **Database** | MySQL 8.x — shared DB dengan `school_id` untuk isolasi tenant |
| **Auth** | Laravel Sanctum (token Bearer) |
| **Repo** | `Sahal111/Scholara_` |

**Prinsip utama:** "5 fitur solid > 20 fitur rapuh" — selesaikan phase 2 sebelum tambah fitur baru.

---

## 2. Arsitektur Sistem

### Multi-Tenant
- Strategi: **Shared Database + `school_id`** — setiap tabel operasional wajib punya `school_id`
- `SchoolScope` (Global Scope) otomatis inject `WHERE school_id = ?` di semua query
- `withoutGlobalScope(SchoolScope::class)` HANYA boleh di `PlatformAdminController`
- Isolasi file storage: `storage/app/schools/{school_id}/`

### Request Lifecycle (Backend)
```
Request → TenantMiddleware → auth:sanctum → PermissionMiddleware
→ FormRequest (validasi) → Controller → Service → Model+SchoolScope → ApiResource → JSON
```

### Authorization — DUA LAYER (WAJIB)
1. **Route middleware**: cek permission (`permission:master_data.guru.delete`)
2. **Policy**: cek ownership/tenant (`$user->school_id === $guru->school_id`)

> Middleware saja TIDAK cukup. User sekolah A tidak boleh hapus data sekolah B meski punya permission.

### Frontend Architecture
- **Page** = orchestration (atur layout, panggil komponen)
- **Component** = reusable, tidak tahu domain lain
- **Data** = React Query (JANGAN axios langsung di komponen, JANGAN useEffect untuk fetch)
- **State** = minimal, hanya yang tidak bisa di-derive dari React Query

---

## 3. Tech Stack Detail

| Layer | Teknologi | Versi |
|---|---|---|
| Backend | Laravel | 12.x |
| Frontend | React + Vite | 19.x + 8.x |
| Styling | Tailwind CSS | 4.x |
| Server State | TanStack React Query | 5.x |
| HTTP Client | Axios | 1.18.x |
| Routing FE | React Router DOM | 7.x |
| Icons | Lucide React | 1.21.x |
| Charts | Recharts | 3.x |
| PDF | jsPDF + AutoTable | 4.x / 5.x |
| Excel FE | SheetJS (xlsx) | 0.18.x |
| Excel BE | PhpSpreadsheet | 5.9.x ✅ (sudah diinstall di composer.json) |
| Toast | react-hot-toast | 2.x |
| Testing | PHPUnit | 11.x |

> ⚠️ **CLAUDE.md menyebut PhpSpreadsheet belum diinstall — INI SALAH/OUTDATED.** `composer.json` membuktikan `"phpoffice/phpspreadsheet": "^5.9"` sudah ada. Gunakan PhpSpreadsheet untuk Excel backend.

---

## 4. Roles & Permission

### 13 Tenant Roles

| Slug | Nama | Tugas Utama |
|---|---|---|
| `operator` | Operator | Pelaksana administrasi — CRUD guru, siswa, ortu, import/export. VIEW-ONLY kebijakan akademik |
| `kepsek` | Kepala Sekolah | Read-only semua data + approve dokumen |
| `wakasek` | Waka Kurikulum | **Pemilik kebijakan akademik** — kurikulum, TA, program, mapel, kelas, jadwal, rapor |
| `guru` | Guru | Data kelas sendiri + absensi + profil + LMS |
| `guru_bk` | Guru BK | Konseling — TANPA akses nilai |
| `wali_kelas` | Wali Kelas | Guru + rapor siswa |
| `bendahara` | Bendahara | Modul keuangan |
| `admin_keuangan` | Admin Keuangan | Input tagihan — TANPA approval |
| `tata_usaha` | Tata Usaha | Surat & arsip — TANPA akses nilai |
| `pustakawan` | Pustakawan | Manajemen perpustakaan |
| `ortu` | Orang Tua | Portal ortu — data anak sendiri |
| `siswa` | Siswa | Portal siswa |
| `admin_ppdb` | Admin PPDB | Modul penerimaan siswa |

> `super_operator` sudah DIMERGE ke `operator` via migration `2026_08_17_000001_merge_super_operator_into_operator.php`. Operator sekarang punya SEMUA permission.

### Format Permission
```
{module}.{resource}.{action}
Contoh: master_data.guru.view | dms.approve | absensi.input | pengaturan.rbac.manage
```

### Key RBAC Decision (September 2026)
`wakasek` = pemilik kebijakan akademik. `operator` = pelaksana administrasi. Ini keunggulan vs kompetitor (Skoola, Kamadeva, APPSO) yang menggabungkan keduanya dalam satu role "admin".

---

## 5. Database Conventions

| Aspek | Standard |
|---|---|
| Engine | MySQL 8.x |
| Penamaan tabel | `snake_case` plural: `gurus`, `siswas`, `tahun_ajarans` |
| Primary key | `BIGINT UNSIGNED AUTO_INCREMENT` bernama `id` |
| Public identifier | `CHAR(26) ULID` — **JANGAN expose integer ID di API** |
| Boolean | `TINYINT(1)` dengan prefix `is_`: `is_active` |
| Money | `DECIMAL(15,2)` |
| Soft delete | WAJIB di semua master table (`deleted_at`) |
| Audit fields | `created_by`, `updated_by`, `deleted_by` |
| `school_id` | Kolom ke-2 setelah `id` di SEMUA tabel operasional |

### Nama Tabel Kritis (Jangan Salah Asumsi)

| Asumsi SALAH | Aktual BENAR |
|---|---|
| `siswa_kelas` | `riwayat_kelas` |
| `jadwal_pelajaran` | `jadwals` |
| `mata_pelajaran` | `mapels` |
| `absensi` | `absensis` |
| `tahun_ajaran` | `tahun_ajarans` |
| `kode_mapel` (kolom) | `kode` (di tabel `mapels`) |
| FK `id_kelas` di absensis | FK `kelas_id` |
| FK `nuptk_wali` di kelas | FK `wali_kelas_id` |
| PK gurus = `nuptk` | PK = `id`, `nuptk` hanya unique |
| PK siswas = `nisn` | PK = `id`, `nisn` hanya unique |

### Migration Rules
- **JANGAN PERNAH edit migration yang sudah di-commit** — buat migration baru
- **JANGAN PERNAH `migrate:fresh` / `migrate:reset`** tanpa izin eksplisit user
- `down()` WAJIB ada dan bisa dijalankan
- Format nama: `{YYYY}_{MM}_{DD}_{seq}_{action}_{table}.php`

---

## 6. API Conventions

### Format Response
```json
// Success single
{ "success": true, "data": { ... } }

// Success collection
{ "success": true, "data": [...], "meta": { "current_page": 1, "total": 74 } }

// Error
{ "success": false, "code": "ERROR_CODE", "message": "...", "errors": { ... } }
```

### ApiResponse Trait (WAJIB dipakai)
```php
$this->success($data);
$this->created($data, 'Berhasil dibuat.');
$this->notFound('Data tidak ditemukan.');
$this->forbidden();
$this->error('Pesan error', 'ERROR_CODE', 500);
```
**JANGAN pernah pakai `return response()->json([...])` langsung.**

### Route Conventions
- Base URL: `https://{subdomain}.siakad.id/api/v1/...`
- Parameter: ULID (bukan integer ID): `/guru/{ulid}`
- **Route statis HARUS didaftar SEBELUM wildcard**: `/mapel/export` sebelum `/mapel/{id}`
- Semua route wajib punya `name` dan middleware (auth + permission)

---

## 7. Backend Coding Rules

### Controller
- Extends `App\Http\Controllers\Controller`
- Return type: `JsonResponse`
- JANGAN `$request->validate()` — pakai FormRequest
- JANGAN query DB langsung — pakai Service
- Max 30-40 baris per method, max 8-10 method per controller

### Service
- Berisi SEMUA business logic
- JANGAN tahu tentang HTTP (Request/Response)
- Wrap create/update dalam `DB::transaction()`

### Model
- `$fillable` HARUS eksplisit — **JANGAN `$guarded = []`**
- Boot method: auto-set `ulid`, `created_by`, `updated_by`, tambahkan `SchoolScope`
- Pakai `SoftDeletes` di semua master table

### FormRequest
- SELALU pakai `$request->validated()` — JANGAN `$request->all()`
- Organized dalam 18 subdirektori per domain

---

## 8. Frontend Coding Rules

### Data Fetching
- **WAJIB React Query** untuk semua data fetching
- **DILARANG** axios langsung di komponen
- **DILARANG** useEffect untuk fetch data
- Hooks di `src/hooks/api/` (useGuru.js, useSiswa.js, dst.)

### Layout
- **Satu AppLayout untuk semua role** — perbedaan hanya di menu items
- Custom sidebar/topbar/footer boleh sebagai prop ke AppLayout
- 14/14 roles sudah pakai AppLayout

### Import Order Komponen
1. React & built-in hooks
2. External libraries
3. Internal hooks
4. Components
5. Assets, utils, constants

### UI Components (WAJIB pakai, jangan buat sendiri)
- `<DataTable>` — jangan raw `<table>`
- `<Modal>` — jangan custom modal
- `<Confirm>` — sebelum delete
- `react-hot-toast` — jangan `alert()`
- `Lucide React` — jangan campur icon library

---

## 9. Design System

### Warna Utama
- **Primary**: `bg-emerald-700` / `#15803D` (Madrasah identity — bg-blue-600 di docs lama adalah OUTDATED)
- **Danger**: `bg-red-600`
- **Success**: `bg-green-600`
- **Warning**: `bg-amber-500`
- **Wakasek sidebar**: indigo theme

### Tipografi & Spacing
- Font: Inter atau Plus Jakarta Sans
- Card padding: `p-6` | Section gap: `space-y-6` | Field gap: `space-y-4`
- Border radius: Card 18px, Button 12px, Input 12px, Modal 20px

---

## 10. Folder Structure (Ringkas)

### Backend
```
backend/app/
├── Http/Controllers/
│   ├── Auth/AuthController.php
│   ├── MasterData/
│   │   ├── Guru/          ← 9 sub-controllers (SPLIT DONE)
│   │   ├── MasterDataSiswaController.php
│   │   ├── MasterDataKelasController.php
│   │   ├── MasterDataOrtuController.php
│   │   ├── MasterDataMapelController.php
│   │   ├── TahunAjaranController.php
│   │   ├── JadwalPelajaranController.php
│   │   └── NaikKelasController.php
│   ├── Operator/, Guru/, Kepsek/, Ortu/
│   ├── Absensi/, Bk/, Keuangan/, Lms/
│   ├── Perpustakaan/, Ppdb/, TataUsaha/
│   └── Controller.php     ← base, pakai ApiResponse trait
├── Services/              ← GuruService, GuruDokumenService, dll.
├── Models/                ← 76 files + Scopes/SchoolScope.php
├── Traits/ApiResponse.php
├── Policies/              ← GuruPolicy, KelasPolicy, SiswaPolicy
└── Http/Requests/         ← 18 subdirektori per domain

routes/api/                ← 15 file: auth, operator, guru, kepsek, wakasek,
                              ortu, absensi, master-data, public, lms,
                              keuangan, ppdb, bk, perpustakaan, tata-usaha
```

### Frontend
```
frontend/src/
├── components/
│   ├── layout/            ← AppLayout, OperatorSidebar, WakasekSidebar, Sidebar
│   ├── ortu/AnakSelector.jsx
│   └── ui/                ← Badge, DataTable, Modal, Confirm, Pagination,
│                             Skeleton, StatusBadge, FileUpload, SearchInput,
│                             EmptyState, DataField, SectionCard
├── contexts/AuthContext.jsx
├── hooks/
│   ├── api/               ← useAbsensi, useGuru, useKelas, useKeuangan,
│   │                         useLms, usePpdb, useSiswa
│   └── useDebounce, useDisclosure, useSelectedAnak
├── lib/axios.js, storage.js
└── pages/
    ├── operator/, guru/, kepsek/, ortu/
    ├── bendahara/, adminppdb/, walikelas/
    ├── wakasek/            ← BARU Sept 2026, 11 halaman aktif
    ├── guru-bk/, tata-usaha/, pustakawan/
    ├── admin-keuangan/, siswa/, superadmin/
    └── auth/, public/
```

**Folder Rules:**
- `components/ui/` — JANGAN import dari `hooks/api/` atau `pages/`
- `hooks/api/` — JANGAN import dari `components/` atau `pages/`
- Layout files ada di dalam `pages/{role}/` (bukan di `components/layout/`, kecuali AppLayout & sidebar shared)

---

## 11. Status Phase

| Phase | Status |
|---|---|
| Phase 0 — Multi-Tenant Foundation | ✅ COMPLETED |
| Phase 1 — Backend Refactor | ✅ MOSTLY COMPLETED |
| Phase 2 — Frontend Refactor | 🔄 IN PROGRESS |
| Phase 3 — Akademik (Nilai, Rapor) | ⬜ PLANNED |
| Phase 4 — Keuangan/SPP | 🔄 EARLY IMPL |
| Phase 5 — PPDB Online | 🔄 EARLY IMPL |
| Phase 6 — Notification Center | ⬜ PLANNED |
| Phase 7 — Integrasi Dapodik/EMIS | ⬜ PLANNED |
| Phase 8 — Platform Admin Dashboard | ⬜ PLANNED |

---

## 12. ✅ COMPLETED FEATURES — JANGAN DISENTUH

> **AI WAJIB baca section ini sebelum nulis kode apapun.**
> File/fitur di sini = SUDAH SELESAI & DITEST USER = **JANGAN DIMODIFIKASI** kecuali ada bug eksplisit dari user.
> Fitur dipindahkan ke sini HANYA jika user sudah bilang: "done", "selesai", "udah beres", atau kata setara.

### 🔐 Auth & Multi-Tenant Foundation
- [x] Login multi-role, logout, guard token via Sanctum — `AuthContext.jsx`, `axios.js`, `ProtectedRoute.jsx`
- [x] Register Orang Tua — `RegisterOrtuPage.jsx`
- [x] Forgot & Reset Password
- [x] Multi-tenant: SchoolScope, TenantMiddleware, subdomain detection
- [x] 13 system roles seeded per school (`super_operator` merged ke `operator`)
- [x] RBAC Wakasek-Operator split (Sept 2026) — wakasek = kebijakan akademik, operator = administrasi

### 🏫 Operator Portal
- [x] Dashboard Operator — `DashboardOperator.jsx`
- [x] Manajemen Akun — CRUD user, toggle aktif, reset password, hapus — `ManajemenAkun.jsx`
- [x] Approval Ortu — list pending, approve/reject — `ApprovalOrtu.jsx`
- [x] Master Data Guru — CRUD, foto, detail 9 tab, import/export — `MasterGuru.jsx`, `DetailGuru.jsx`, `TambahEditGuru.jsx`
- [x] Master Data Siswa — CRUD, foto, assign kelas, mutasi — `MasterSiswa.jsx`, `DetailSiswa.jsx`, `TambahEditSiswa.jsx`, `MutasiSiswa.jsx`
- [x] Master Data Kelas — CRUD, filter TA & semester, riwayat akademik & wali kelas — `MasterKelas.jsx`, `DetailKelas.jsx`, `DetailKelasPeriodeAkademik.jsx`
- [x] Master Data Orang Tua — CRUD, attach anak, detail keluarga — `MasterOrtu.jsx`, `DetailOrtu.jsx`, `TambahEditOrtu.jsx`
- [x] Master Data Mapel — CRUD, toggle aktif, import/export/template Excel (.xlsx) — `MasterMapel.jsx`, `MasterDataMapelController.php`
- [x] Master Data Jadwal Pelajaran — CRUD — `MasterJadwal.jsx`, `JadwalPelajaranController.php`
- [x] **Master Data Tahun Ajaran & Semester** — CRUD tahun ajaran, CRUD semester, set aktif, set semester aktif, detail TA, detail Semester, validasi hapus & DB integrity — `TahunAjaranSemester.jsx`, `DetailTahunAjaran.jsx`, `DetailSemester.jsx`, `TahunAjaranController.php`
- [x] Naik Kelas — preview & proses massal — `NaikKelas.jsx`, `NaikKelasController.php`
- [x] Pengumuman — CRUD — `PengumumanOperator.jsx`, `PengumumanController.php`
- [x] Galeri Foto — upload & hapus — `GaleriOperator.jsx`, `GaleriController.php`

### 👨‍🏫 Guru Portal
- [x] Dashboard Guru — `DashboardGuru.jsx`
- [x] Input Absensi — `InputAbsensi.jsx`
- [x] Rekap Absensi — `RekapAbsensiGuru.jsx`
- [x] Data Siswa + Detail — `DataSiswaGuru.jsx`, `DetailSiswaGuru.jsx`
- [x] Riwayat Absensi Siswa — `RiwayatAbsensiSiswaGuru.jsx`
- [x] Jadwal Mengajar — `JadwalMengajarGuru.jsx`
- [x] Pengumuman Guru — `PengumumanGuru.jsx`
- [x] Profil Guru — `ProfilGuru.jsx`

### 🏛️ Kepsek Portal
- [x] Dashboard Kepsek — `DashboardKepsek.jsx`
- [x] Monitoring Absensi — `MonitoringAbsensi.jsx`
- [x] Data Guru (read-only) + Detail — `DataGuruKepsek.jsx`, `DetailGuruKepsek.jsx`
- [x] Data Siswa (read-only) + Detail — `DataSiswaKepsek.jsx`, `DetailSiswaKepsek.jsx`
- [x] Kalender Akademik — CRUD event — `KalenderAkademik.jsx`, `KalenderAkademikController.php`
- [x] Pengumuman Kepsek — `PengumumanKepsek.jsx`
- [x] Profil Kepsek — `ProfilKepsek.jsx`

### 👪 Orang Tua Portal
- [x] Absensi Anak — `AbsensiAnak.jsx`
- [x] Riwayat Absensi Anak — `RiwayatAbsensiAnak.jsx`
- [x] Data Anak — `DataAnak.jsx`
- [x] Tambah Anak — `TambahAnak.jsx`
- [x] Pengumuman Ortu — `PengumumanOrtu.jsx`
- [x] Profil Ortu — `ProfilOrtu.jsx`

### 🆕 Wakasek Portal (September 2026)
- [x] Portal Wakasek dengan sidebar indigo, route `/wakasek/*`, API `/wakasek/*`
- [x] Dashboard Wakasek, Profil Wakasek
- [x] Data Guru & Siswa (view-only) — `DataGuruWakasek.jsx`, `DataSiswaWakasek.jsx`
- [x] Master Kurikulum — `MasterKurikulum.jsx`
- [x] Master Program Pendidikan + Recycle Bin — `MasterProgramWakasek.jsx`, `RecycleBinProgramWakasek.jsx`
- [x] Master Mapel Wakasek — `MasterMapelWakasek.jsx`
- [x] Master Kelas & Rombel + Detail — `MasterKelasWakasek.jsx`, `DetailKelasWakasek.jsx`, `DetailKelasPeriodeAkademikWakasek.jsx`
- [x] Monitoring Absensi Wakasek — `MonitoringAbsensiWakasek.jsx`
- [x] Pengumuman Wakasek — `PengumumanWakasek.jsx`
- [x] Laporan Wakasek — `LaporanWakasek.jsx`

### 🌐 Public Pages
- [x] Landing Page, Gallery, About, Contact — `LandingPage.jsx`, `GalleryPage.jsx`, dll.
- [x] Login Page — `LoginPage.jsx`
- [x] Register Ortu — `RegisterOrtuPage.jsx`

### 🔲 Placeholder Portals (Layout + Dashboard saja)
- [x] WaliKelas — `WaliKelasLayout.jsx`, `DashboardWaliKelas.jsx`
- [x] Bendahara — `BendaharaLayout.jsx`, `DashboardBendahara.jsx`
- [x] Admin PPDB — `AdminPpdbLayout.jsx`, `DashboardAdminPpdb.jsx`
- [x] Guru BK — `GuruBkLayout.jsx`, `DashboardGuruBk.jsx`
- [x] Tata Usaha — `TataUsahaLayout.jsx`, `DashboardTataUsaha.jsx`
- [x] Pustakawan — `PustakawanLayout.jsx`, `DashboardPustakawan.jsx`
- [x] Admin Keuangan — `AdminKeuanganLayout.jsx`, `DashboardAdminKeuangan.jsx`
- [x] Siswa — `SiswaLayout.jsx`, `DashboardSiswa.jsx`
- [x] Super Admin — `SuperAdminLayout.jsx`, `DashboardSuperAdmin.jsx`

### 🔧 Technical Refactoring Completed
- [x] `MasterDataGuruController` split jadi 9 sub-controller
- [x] `DetailGuru.jsx` split jadi 8 tab komponen
- [x] `MasterGuru.jsx` split 5 file modular (114KB → 35KB)
- [x] FormRequests organized ke 18 subdirektori domain
- [x] AppLayout unified: 14/14 roles (termasuk SiswaLayout & SuperAdminLayout)
- [x] React Query migration selesai — tidak ada useEffect untuk data fetching

### 🐛 Bug Fixes
- [x] Fix route mapel: `/export`, `/import`, `/template` didaftarkan SEBELUM `/{id}` agar tidak jatuh ke wildcard
- [x] Fix import/export mapel: ganti CSV → Excel (.xlsx) menggunakan PhpSpreadsheet
- [x] Fix `WaliKelasLayout.jsx`: path diperbaiki dari `/wakasek/*` ke `/walikelas/*`

---

## 13. 🚧 IN PROGRESS — Sedang Dikerjakan

- [ ] *(kosong)*

---

## 14. ❌ DILARANG (Forbidden Practices)

### Backend
- `$guarded = []` → pakai `$fillable` eksplisit
- `$request->validate()` di controller → pakai FormRequest
- Query DB langsung di controller → pakai Service
- `return response()->json([...])` → pakai ApiResponse trait
- `dd()`, `dump()` di production code
- Edit migration yang sudah di-commit
- `migrate:fresh` / `migrate:reset` tanpa izin eksplisit
- Expose integer ID di API → pakai ULID
- `withoutGlobalScope(SchoolScope)` di endpoint biasa
- Route wildcard sebelum route statis

### Frontend
- `axios` langsung di komponen → pakai hooks/api/
- `useEffect` untuk data fetching → pakai React Query
- Raw `<table>` → pakai `<DataTable>`
- `alert()` → pakai `react-hot-toast`
- Buat layout baru per role → pakai AppLayout
- Custom modal → pakai `<Modal>`
- Campur icon library → Lucide React only

### General
- Install dependency baru tanpa konfirmasi user
- Commit `.env` dengan kredensial nyata
- Modifikasi file COMPLETED tanpa izin eksplisit user
- Auto-mark fitur sebagai selesai tanpa user bilang "done"

---

## 15. Aturan AI

1. **Baca section COMPLETED** sebelum nulis satu baris pun
2. **Jangan sentuh file COMPLETED** kecuali ada bug eksplisit
3. **Satu sesi = satu fitur** — jangan ubah file di luar scope
4. **Search before write** — verifikasi nama model, kolom, komponen yang ada
5. **Targeted output** — tunjukkan hanya bagian kode yang berubah, bukan seluruh file
6. **Fitur HANYA pindah ke COMPLETED** jika user bilang: "done", "selesai", "udah beres", atau setara
7. **Jangan refactor** kode yang tidak diminta
8. **Root cause first** — saat fix bug, jelaskan akar masalah sebelum beri solusi
9. **Konfirmasi scope** sebelum mulai coding fitur baru/kompleks
10. **Static routes SEBELUM wildcard** di Laravel routing — selalu

---

## 16. Referensi Dokumen Detail

Untuk detail implementasi, lihat dokumen spesifik:

| Dokumen | Topik |
|---|---|
| `01-vision.md` | Visi, misi, target user |
| `02-architecture.md` | Arsitektur sistem lengkap |
| `03-database-standard.md` | Schema, naming, migration |
| `05-laravel-standard.md` | Template controller, service, model |
| `06-react-standard.md` | React Query, hooks, layout |
| `07-rbac-standard.md` | RBAC lengkap, permission matrix |
| `08-kurikulum-architecture.md` | Arsitektur kurikulum & wakasek |
| `10-ui-design-system.md` | Design system lengkap |
| `11-dms-standard.md` | DMS workflow |
| `12-import-export-standard.md` | Import/export flow |
| `doc1-schema-design.md` | SQL schema detail |
| `doc2-rbac-design.md` | RBAC design + full permission matrix |
| `doc3-api-contract.md` | API contract & error codes |