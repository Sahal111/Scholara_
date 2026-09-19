# Dokumen Arsitektur 2 — RBAC Design (Per-Tenant)
# SIAKAD Enterprise Platform
# Status: FINAL — Acuan untuk middleware, policy, dan seeder
# Terakhir diperbarui: September 2026

---

## Prinsip Utama

> **"Operator mengelola data, Wakasek mengelola kebijakan akademik,
> Kepsek mengesahkan dan mengawasi, Guru menjalankan pembelajaran,
> role spesialis mengelola domain masing-masing,
> dan Super Admin mengelola platform SaaS."**

RBAC ini menggunakan pola empat lapis:

```
ROLE
  ↓
PERMISSION   — apa yang boleh dilakukan? (curriculum.update)
  ↓
SCOPE        — terhadap data mana? (school_id = 123, atau assigned_class)
  ↓
WORKFLOW     — kapan boleh dilakukan? (DRAFT → REVIEW → APPROVED → ACTIVE)
  ↓
AUDIT LOG    — siapa yang melakukan?
```

Hindari hardcode berdasarkan role (`if role === 'operator' { ... }`).
Selalu lewat permission, lalu enforce scope via Policy.

---

## Model RBAC Multi-Tier (Platform & Tenant)

Sistem menggunakan otorisasi **2 Tingkat (Multi-Tier)**:

### 1. Platform Level Authorization (`platform_admins`)
Untuk pengelola platform SaaS (Global Super Admin), terpisah dari data tenant.
Super Admin **tidak** ikut mengedit operasional sekolah (kurikulum, nilai, jadwal).
Super Admin mengelola: tenant/sekolah, subscription, billing, feature flags,
konfigurasi platform, global reference data, audit platform, support.

| Role Platform | Akses |
|---|---|
| `super_admin` | Akses penuh ke seluruh konfigurasi SaaS, tenant management, billing, migration |
| `admin` | Manajemen sekolah, pengawasan langganan, manajemen promo/coupon |
| `support` | Mode baca & impersonasi tenant (`last_tenant_id`) untuk bantuan teknis |
| `billing` | Kelola tagihan, invoice PPN/tax, refund, dan paket langganan |
| `readonly` | Auditing & reporting platform secara umum |

### 2. Tenant Level Authorization (Per-Sekolah)
```
School (tenant)
  └── Role (per sekolah, bisa dikustomisasi)
        └── Permission (per sekolah, per modul)
              └── Global User (mapped ke tenant via global_user_schools)
```

Setiap sekolah punya **role dan permission sendiri**.
Saat sekolah baru didaftarkan, `SchoolProvisioningService` otomatis seed role default
+ permission default dari template. Operator sekolah bisa tambah role custom sesuai
kebutuhan spesifik sekolah via fitur RBAC (`pengaturan.rbac.manage`).

RBAC bersifat **universal** — isi kurikulumnya yang berbeda per jenjang/sekolah,
bukan RBAC-nya. Jangan hardcode struktur kurikulum SD/SMP/SMA/SMK di permission.

---

## Domain Ownership

Ini konsep terpenting. **Jangan anggap Operator sebagai pemilik semua data.**

| Domain | Pemilik | Pelaksana | Approver/Oversight |
|---|---|---|---|
| Data administrasi (guru, siswa, ortu) | Operator | Operator | Kepsek (read + verify) |
| Kebijakan akademik (kurikulum, TA, mapel, kelas, jadwal) | **Wakasek** | Wakasek | Kepsek (approve + aktivasi) |
| Keuangan | Bendahara | Admin Keuangan | Bendahara (verify + approve) |
| Konseling | Guru BK | Guru BK | — |
| Perpustakaan | Pustakawan | Pustakawan | — |
| Surat & arsip | Tata Usaha | Tata Usaha | — |
| Penerimaan siswa | Admin PPDB | Admin PPDB | Kepsek |
| Platform SaaS | Super Admin | Super Admin | — |

---

## Default Roles (Template)

Ini adalah role yang otomatis dibuat saat sekolah baru terdaftar.
`is_system = 1` artinya tidak bisa dihapus, hanya bisa dinonaktifkan.

> **Catatan September 2026:** `super_operator` telah di-MERGE ke `operator`
> via migration `2026_08_17_000001_merge_super_operator_into_operator.php`.
> `super_operator` tidak lagi ada sebagai role terpisah.
> Tabel di bawah sudah tidak mencantumkan `super_operator`.

| slug | nama | is_system | Deskripsi |
|---|---|---|---|
| `operator` | Operator | 1 | Pelaksana administrasi — CRUD guru, siswa, ortu, import/export. VIEW-ONLY kebijakan akademik |
| `kepsek` | Kepala Sekolah | 1 | Approval & oversight — read semua data, approve dokumen & kebijakan |
| `wakasek` | Waka Kurikulum | 1 | **Pemilik kebijakan akademik** — kurikulum, TA, program, mapel, kelas, jadwal, rapor |
| `guru` | Guru | 1 | Data kelas sendiri + absensi + nilai + profil + LMS |
| `guru_bk` | Guru BK | 1 | Konseling siswa — TANPA akses nilai akademik |
| `wali_kelas` | Wali Kelas | 1 | Guru + rapor siswa kelasnya (guru dengan assignment wali kelas) |
| `bendahara` | Bendahara | 1 | Modul keuangan — verify, approve, laporan |
| `admin_keuangan` | Admin Keuangan | 1 | Input tagihan & pembayaran — TANPA approval |
| `tata_usaha` | Tata Usaha | 1 | Surat, arsip, legalisir — TANPA akses nilai |
| `pustakawan` | Pustakawan | 1 | Kelola buku & peminjaman perpustakaan |
| `ortu` | Orang Tua | 1 | Portal orang tua — data anak sendiri + absensi |
| `siswa` | Siswa | 1 | Portal siswa — profil, nilai, jadwal, tagihan |
| `admin_ppdb` | Admin PPDB | 1 | Modul PPDB — pendaftaran + seleksi |

---

## Permission Slugs (Template)

Format: `{modul}.{resource}.{aksi}` atau `{modul}.{aksi}`

### Modul: master_data

#### Data Administrasi (domain Operator)
```
master_data.guru.view
master_data.guru.create
master_data.guru.update
master_data.guru.delete
master_data.guru.import
master_data.guru.export
master_data.guru.verify        -- verifikasi data guru
master_data.guru.restore       -- restore dari trash

master_data.siswa.view
master_data.siswa.create
master_data.siswa.update
master_data.siswa.delete
master_data.siswa.import
master_data.siswa.export

master_data.orang_tua.view
master_data.orang_tua.manage
```

#### Kebijakan Akademik (domain Wakasek, Operator VIEW-ONLY)
```
-- Kelas
master_data.kelas.view
master_data.kelas.manage       -- create, update, delete (WAKASEK ONLY)

-- Mata Pelajaran
master_data.mapel.view
master_data.mapel.manage       -- create, update, delete, import/export (WAKASEK ONLY)

-- Tahun Ajaran
master_data.tahun_ajaran.view
master_data.tahun_ajaran.manage   -- create + update (Operator untuk DRAFT, Wakasek untuk review)
master_data.tahun_ajaran.review   -- submit TA ke kepsek untuk review (WAKASEK)
master_data.tahun_ajaran.approve  -- approve/reject TA dari wakasek (KEPSEK)
master_data.tahun_ajaran.activate -- aktifkan TA yang sudah approved (KEPSEK)
master_data.tahun_ajaran.complete -- tutup buku / selesaikan TA aktif (WAKASEK)
master_data.tahun_ajaran.archive  -- arsipkan TA completed ke historis (OPERATOR)

-- Program Pendidikan
master_data.program.view
master_data.program.manage     -- create, update, delete (WAKASEK ONLY)

-- Kurikulum
master_data.kurikulum.view
master_data.kurikulum.manage   -- create, update, delete (WAKASEK ONLY)
```

### Modul: akun
```
akun.view                  -- lihat daftar user
akun.create                -- buat user baru
akun.update                -- edit user
akun.delete                -- hapus user
akun.toggle_active         -- aktifkan/nonaktifkan
akun.reset_password        -- reset password user lain
akun.approve_ortu          -- approve registrasi orang tua
akun.manage_roles          -- assign/cabut role dari user
```

### Modul: absensi
```
absensi.input              -- input absensi siswa
absensi.edit               -- edit absensi yang sudah diinput
absensi.view_kelas_sendiri -- lihat absensi kelas sendiri (guru)
absensi.view_all           -- lihat absensi semua kelas (kepsek, operator, wakasek)
absensi.rekap              -- akses rekap dan export absensi
```

### Modul: akademik
```
-- Nilai
akademik.nilai.input       -- input nilai (guru kelas sendiri)
akademik.nilai.view        -- lihat nilai (guru kelas sendiri)
akademik.nilai.view_all    -- lihat nilai semua kelas (wakasek, kepsek)

-- Rapor
akademik.rapor.view        -- lihat rapor
akademik.rapor.manage      -- kelola template & finalisasi rapor (wakasek)
akademik.rapor.generate    -- generate rapor per siswa (wali kelas)

-- Jadwal
akademik.jadwal.view       -- lihat jadwal
akademik.jadwal.manage     -- kelola jadwal pelajaran (wakasek)

-- Kalender
akademik.kalender.manage   -- kelola kalender akademik (kepsek, wakasek)
```

### Modul: dms (Document Management)
```
dms.upload                 -- upload dokumen guru
dms.view_own               -- lihat dokumen milik sendiri
dms.view_all               -- lihat dokumen semua guru
dms.approve                -- approve/reject dokumen
dms.download               -- download dokumen
dms.delete                 -- hapus dokumen
dms.bulk_download          -- bulk download per guru
```

### Modul: keuangan
```
-- Separation of duties: admin_keuangan input, bendahara approve
keuangan.tagihan.view
keuangan.tagihan.create
keuangan.tagihan.update
keuangan.tagihan.delete
keuangan.pembayaran.view
keuangan.pembayaran.input  -- admin_keuangan
keuangan.pembayaran.verify -- bendahara
keuangan.pembayaran.export
keuangan.laporan.view      -- bendahara only
```

### Modul: ppdb
```
ppdb.pendaftar.view
ppdb.pendaftar.update
ppdb.pendaftar.approve
ppdb.pendaftar.reject
ppdb.pengaturan.manage
```

### Modul: pengumuman
```
pengumuman.view
pengumuman.create
pengumuman.update
pengumuman.delete
```

### Modul: pengaturan (Settings sekolah)
```
pengaturan.view
pengaturan.update
pengaturan.smtp.manage
pengaturan.storage.manage
pengaturan.rbac.manage     -- kelola role & permission custom (operator)
```

### Modul: laporan
```
laporan.guru.view
laporan.siswa.view
laporan.absensi.view
laporan.keuangan.view
laporan.export
```

### Modul: bk (Bimbingan Konseling)
```
bk.konseling.view
bk.konseling.create
bk.konseling.update
bk.konseling.delete
bk.catatan.view
bk.catatan.create
bk.catatan.update
bk.laporan.view
bk.laporan.export
```

### Modul: perpustakaan
```
perpustakaan.buku.view
perpustakaan.buku.create
perpustakaan.buku.update
perpustakaan.buku.delete
perpustakaan.peminjaman.view
perpustakaan.peminjaman.manage
perpustakaan.laporan.view
perpustakaan.laporan.export
```

### Modul: surat (Tata Usaha)
```
surat.view
surat.create
surat.update
surat.delete
surat.arsip
surat.legalisir
```

---

## Workflow Per Fitur Utama

### Tahun Ajaran

```
OPERATOR
  │
  │ Create (selalu DRAFT)
  ▼
DRAFT
  │
  ▼
WAKASEK
  │
  │ Review + Submit (master_data.tahun_ajaran.review)
  ▼
UNDER_REVIEW
  │
  ▼
KEPSEK
  │
  ├─ Approve (master_data.tahun_ajaran.approve) → APPROVED
  └─ Reject → kembali ke DRAFT (wakasek perbaiki & submit ulang)
                │
                ▼
             APPROVED
                │
                ▼
             KEPSEK
                │
                │ Aktifkan (master_data.tahun_ajaran.activate)
                ▼
             ACTIVE
                │
                ▼
             WAKASEK
                │
                │ Selesaikan / tutup buku (master_data.tahun_ajaran.complete)
                ▼
            COMPLETED
                │
                ▼
             OPERATOR
                │
                │ Arsipkan (master_data.tahun_ajaran.archive)
                ▼
            ARCHIVED
```

Data **terkunci** (tidak bisa diedit) setelah status >= APPROVED.
Hanya DRAFT yang bisa dihapus.

### Semester

Semester adalah bagian dari Tahun Ajaran.
Kewenangannya:

| Aksi | Operator | Wakasek | Kepsek | Guru | Wali Kelas |
|---|:---:|:---:|:---:|:---:|:---:|
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create / Update | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Set Aktif | ❌ | ✅ | ❌ | ❌ | ❌ |

⚠️ Bukan hard delete — gunakan archive/soft delete.
Semester yang sudah punya transaksi akademik tidak bisa dihapus.

### Kurikulum

```
WAKASEK
  │
  │ Create → Update → (submit — roadmap)
  ▼
KEPSEK
  │
  │ Approve → Activate (roadmap)
  ▼
BERLAKU / LOCK
```

Saat ini kurikulum belum memiliki lifecycle status (roadmap Phase 3).
Operator: **VIEW ONLY**.
Kurikulum platform (school_id NULL) hanya dikelola Super Admin.

---

## Mapping Role Default → Permission

Ini yang di-seed otomatis saat sekolah baru dibuat.

### operator
> Pelaksana administrasi & pengelola data teknis.
> Kebijakan akademik adalah domain Wakasek — Operator hanya VIEW.
```
-- Data administrasi (FULL CRUD)
master_data.guru.*          (view, create, update, delete, import, export, verify, restore)
master_data.siswa.*         (view, create, update, delete, import, export)
master_data.orang_tua.view, master_data.orang_tua.manage

-- Tahun Ajaran — Operator hanya buat DRAFT dan arsipkan
master_data.tahun_ajaran.view
master_data.tahun_ajaran.manage   -- untuk create DRAFT saja
master_data.tahun_ajaran.archive  -- arsipkan setelah COMPLETED

-- Kebijakan akademik — VIEW ONLY
master_data.kelas.view
master_data.mapel.view
master_data.program.view
master_data.kurikulum.view
akademik.jadwal.view

-- Administrasi
akun.*                      (view, create, update, delete, toggle_active, reset_password, approve_ortu)
                            -- KECUALI akun.manage_roles
absensi.view_all, absensi.rekap
dms.view_all, dms.approve, dms.download, dms.bulk_download
pengumuman.*
laporan.*
pengaturan.rbac.manage      -- bisa buat role custom
```

### kepsek
> Approval & Oversight. Bukan "operator tertinggi" — tidak perlu Full CRUD.
> Kepsek melihat, mengawasi, dan mengesahkan.
```
-- Data (read-only)
master_data.guru.view, master_data.guru.export, master_data.guru.verify
master_data.siswa.view, master_data.siswa.export
master_data.kelas.view
master_data.mapel.view
master_data.kurikulum.view
master_data.program.view

-- Tahun Ajaran — approve & aktifkan
master_data.tahun_ajaran.view
master_data.tahun_ajaran.approve
master_data.tahun_ajaran.activate

-- Akademik
absensi.view_all, absensi.rekap
akademik.nilai.view_all
akademik.rapor.view
akademik.kalender.manage

-- Administrasi
dms.view_all, dms.approve, dms.download, dms.bulk_download
pengumuman.*
laporan.*
pengaturan.view
```

### wakasek
> **Pemilik & Penanggung Jawab Kebijakan Akademik.**
> Sesuai Permendiknas, Waka Kurikulum bertanggung jawab atas seluruh struktur akademik.
> Sekolah yang perlu memisahkan "Wakasek Kurikulum" dan "Wakasek Kesiswaan"
> bisa membuat role custom via RBAC (operator punya `pengaturan.rbac.manage`).
```
-- Data guru & siswa — VIEW ONLY (CRUD ada di operator)
master_data.guru.view, master_data.guru.export, master_data.guru.verify
master_data.siswa.view, master_data.siswa.export
master_data.orang_tua.view

-- Tahun Ajaran — manage + review
master_data.tahun_ajaran.view
master_data.tahun_ajaran.manage
master_data.tahun_ajaran.review
master_data.tahun_ajaran.complete

-- Kebijakan akademik — FULL MANAGE (domain utama)
master_data.kelas.view, master_data.kelas.manage
master_data.mapel.view, master_data.mapel.manage
master_data.program.view, master_data.program.manage
master_data.kurikulum.view, master_data.kurikulum.manage

-- Akademik operasional
akademik.jadwal.view, akademik.jadwal.manage
akademik.kalender.manage
akademik.nilai.view, akademik.nilai.view_all
akademik.rapor.view, akademik.rapor.manage

-- Pengawasan
absensi.view_all, absensi.rekap
dms.view_all, dms.approve, dms.download, dms.bulk_download
pengumuman.*
laporan.guru.view, laporan.siswa.view, laporan.absensi.view, laporan.export
pengaturan.view
```

### guru
> Menjalankan pembelajaran. Write access hanya di domain dan scope sendiri.
```
master_data.siswa.view        -- hanya siswa kelas sendiri (enforce via Policy)
absensi.input, absensi.edit, absensi.view_kelas_sendiri
dms.upload, dms.view_own
pengumuman.view
akademik.nilai.input, akademik.nilai.view
akademik.jadwal.view

-- TIDAK punya: kurikulum.*, tahun_ajaran.*, program.*, kelas.manage
-- Guru hanya READ konfigurasi akademik, tidak bisa mengubahnya
```

### wali_kelas
> Guru + assignment sebagai wali kelas. Wali Kelas adalah Guru dengan akses tambahan.
```
Semua permission guru +
akademik.rapor.view           -- rapor siswa kelasnya (scope via Policy)
akademik.rapor.generate       -- generate rapor per siswa kelasnya
```

### guru_bk
> Domain khusus konseling. Sengaja diblokir dari data nilai akademik.
```
master_data.siswa.view        -- untuk cari siswa yang dikonseling
absensi.view_all, absensi.rekap
dms.upload, dms.view_own, dms.download
pengumuman.view
bk.*                          -- akses penuh modul BK

-- TIDAK punya: akademik.nilai.* — sengaja diblokir
```

### bendahara
> Pemilik domain keuangan. Verify + approve input dari admin_keuangan.
```
keuangan.*
master_data.siswa.view        -- cek data siswa saat rekonsiliasi
laporan.keuangan.view, laporan.export
```

### admin_keuangan
> Input keuangan saja — tidak bisa approve atau lihat laporan.
```
master_data.siswa.view
keuangan.tagihan.view, keuangan.tagihan.create, keuangan.tagihan.update
keuangan.pembayaran.view, keuangan.pembayaran.input
keuangan.pembayaran.export

-- TIDAK punya: keuangan.laporan.view, keuangan.pembayaran.verify
```

### tata_usaha
> Surat, arsip, administrasi umum. Tanpa akses nilai.
```
master_data.siswa.view
master_data.guru.view
master_data.orang_tua.view
dms.upload, dms.view_all, dms.download, dms.bulk_download
pengumuman.view, pengumuman.create
surat.*
laporan.siswa.view, laporan.guru.view, laporan.export
```

### pustakawan
```
master_data.siswa.view        -- untuk cari peminjam
pengumuman.view
perpustakaan.*
```

### admin_ppdb
```
ppdb.*
master_data.siswa.view        -- read only untuk referensi
```

### ortu
> Semua scope dibatasi hanya untuk data anak sendiri (enforce via Policy).
```
master_data.siswa.view        -- hanya anak sendiri
absensi.view_kelas_sendiri    -- hanya absensi anak sendiri
pengumuman.view
```

### siswa
```
master_data.siswa.view        -- hanya profil sendiri
akademik.nilai.view           -- hanya nilai sendiri
akademik.jadwal.view          -- jadwal kelasnya
pengumuman.view
```

---

## Matriks Ringkas Per Fitur Utama

| Fitur | Operator | Wakasek | Kepsek | Guru | Wali Kelas |
|---|---|---|---|---|---|
| **Tahun Ajaran** | CRUD (draft) + arsip | Manage + Review | Approve + Activate | Read | Read |
| **Semester** | CRUD | Manage + Set Aktif | Read | Read | Read |
| **Kurikulum** | Read | Full Manage | Read + Approve | Read | Read |
| **Program Pendidikan** | Read | Full Manage | Read + Approve | Read | Read |
| **Mata Pelajaran** | Read | Full Manage | Read | Read | Read |
| **Kelas** | CRUD administrasi | Manage akademik | Read | Assigned only | Assigned class |
| **Jadwal** | Read | Manage | Read | Assigned schedule | Class schedule |
| **Absensi** | View All + Rekap | View All + Rekap | View All + Rekap | Input (kelas sendiri) | Input (kelas sendiri) |
| **Nilai** | — | View All | View All | Input (kelas sendiri) | View (kelas sendiri) |
| **Rapor** | — | Manage policy | Read + Approve | Input nilai | Manage class report |
| **Keuangan** | — | — | — | — | — |

---

## Implementation Notes

### Double-Layer Authorization (WAJIB)

```php
// Layer 1 — Route middleware: cek permission
Route::patch('/tahun-ajaran/{ulid}/approve', ...)
    ->middleware('permission:master_data.tahun_ajaran.approve');

// Layer 2 — Policy: cek ownership/tenant
public function approve(Request $request, string $ulid): JsonResponse
{
    $ta = TahunAjaran::where('ulid', $ulid)->firstOrFail();
    Gate::authorize('approve', $ta);  // TahunAjaranPolicy::approve()
    // ...
}
```

Middleware saja **tidak cukup**. User sekolah A tidak boleh approve TA sekolah B
meskipun punya permission yang sama.

### SchoolScope

```php
// Otomatis inject WHERE school_id = ? di semua query model
// withoutGlobalScope(SchoolScope::class) HANYA boleh di PlatformAdminController
```

### Permission Cache

```php
// Cache per user per request — jangan query DB berkali-kali
Cache::remember("user_{$userId}_permissions", 60, fn() => ...);
```

### Frontend Permission Guard

```jsx
const { hasPermission } = useAuth();

{hasPermission('master_data.tahun_ajaran.review') && (
  <button onClick={handleSubmitReview}>Submit ke Kepsek</button>
)}

{hasPermission('master_data.tahun_ajaran.approve') && (
  <button onClick={handleApprove}>Setujui</button>
)}
```

### SchoolSeeder Flow

```
1. Insert ke schools
2. Insert ke school_domains
3. Copy permission templates → permissions (dengan school_id)
4. Copy role templates → roles (dengan school_id)
5. Assign default permissions ke setiap role
6. Buat user operator pertama
7. Insert school_settings default
```

---

## Catatan Keamanan

1. **Selalu dua lapis**: middleware (permission) + policy (ownership/tenant)
2. Jangan pernah cek permission saja tanpa cek `school_id`
3. `withoutGlobalScope(SchoolScope)` hanya di `PlatformAdminController`
4. Super Admin platform punya akses lintas tenant hanya untuk support & administrasi —
   setiap aksi mereka wajib dicatat di `activity_logs` dengan flag `is_platform_admin`

---

## Changelog

### September 2026 — Konsolidasi RBAC & Cleanup

**Perubahan konseptual:**
- `super_operator` di-MERGE ke `operator` via migration `2026_08_17_000001_merge_super_operator_into_operator.php`
- Pola RBAC diperbarui: Role → Permission → Scope → Workflow → Audit Log
- Domain ownership ditetapkan secara tegas (lihat tabel Domain Ownership di atas)
- Workflow Tahun Ajaran DRAFT→UNDER_REVIEW→APPROVED→ACTIVE→COMPLETED→ARCHIVED diimplementasikan

**Wakasek-Operator Academic Split (Sept 4, 2026):**
- Operator: dicabut permission `*.manage` untuk semua kebijakan akademik
- Wakasek: ditambahkan `tahun_ajaran.manage`, `tahun_ajaran.review`, `tahun_ajaran.complete`,
  `nilai.view_all`, `rapor.manage`
- Kepsek: ditambahkan `tahun_ajaran.approve`, `tahun_ajaran.activate`
- Operator: ditambahkan `tahun_ajaran.archive`
- Route baru `/wakasek/*` dengan portal Wakasek terpisah (tema indigo)

**Keunggulan vs kompetitor (Skoola, Kamadeva, APPSO):**
Semua kompetitor menggabungkan kebijakan akademik dan administrasi data di satu role "admin".
Scholara memisahkannya sesuai struktur organisasi sekolah nyata (Permendiknas) —
ini differentiator utama untuk pasar madrasah dan sekolah formal Indonesia.