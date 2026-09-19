# 07 · RBAC Standard
# Status: Updated September 2026 — mencerminkan implementasi aktual P0/P1/P2
# Sumber kebenaran teknis: doc2-rbac-design.md

---

## Prinsip

> **Jangan hardcode berdasarkan role — selalu lewat permission.**
> Sekolah bisa membuat role custom (mis. "Plt. Kepsek"). Sistem tetap bekerja
> selama permission yang tepat di-assign ke role tersebut.

Empat lapis otorisasi:
```
ROLE → PERMISSION → SCOPE → WORKFLOW → AUDIT LOG
```

---

## Model Otorisasi (Multi-Tier)

### 1. Platform Level (`platform_admins`)
User global di `global_users` — **terpisah** dari data tenant.
Super Admin tidak mengedit operasional harian sekolah (kurikulum, nilai, jadwal).

| Role | Akses |
|---|---|
| `super_admin` | Akses penuh konfigurasi SaaS, tenant, billing, migration |
| `admin` | Manajemen sekolah, langganan, promo |
| `support` | Impersonasi tenant (`last_tenant_id`) untuk bantuan teknis |
| `billing` | Invoice, tax, refund, paket |
| `readonly` | Audit log platform |

### 2. Tenant Level (Per-Sekolah)
```
School
  └── Role (per sekolah, bisa dikustomisasi)
        └── Permission (per sekolah, per modul)
              └── Global User (via global_user_schools)
```

Saat sekolah baru didaftarkan, `SchoolProvisioningService` otomatis seed
role default + permission default dari template.

---

## Role Default (Template)

> **Catatan:** `super_operator` sudah di-MERGE ke `operator`
> via migration `2026_08_17`. Tidak ada lagi sebagai role terpisah.

| slug | nama | is_system | Domain Utama |
|---|---|:---:|---|
| `operator` | Operator | ✓ | Data & system administration |
| `kepsek` | Kepala Sekolah | ✓ | Approval & oversight |
| `wakasek` | Waka Kurikulum | ✓ | **Pemilik kebijakan akademik** |
| `guru` | Guru | ✓ | Pelaksanaan pembelajaran |
| `guru_bk` | Guru BK | ✓ | Konseling |
| `wali_kelas` | Wali Kelas | ✓ | Administrasi kelas & rapor |
| `bendahara` | Bendahara | ✓ | Keuangan (verify + approve) |
| `admin_keuangan` | Admin Keuangan | ✓ | Input keuangan |
| `tata_usaha` | Tata Usaha | ✓ | Surat & arsip |
| `pustakawan` | Pustakawan | ✓ | Perpustakaan |
| `ortu` | Orang Tua | ✓ | Portal anak sendiri |
| `siswa` | Siswa | ✓ | Portal siswa |
| `admin_ppdb` | Admin PPDB | ✓ | Penerimaan siswa |

Operator sekolah bisa tambah role custom via `pengaturan.rbac.manage`.

---

## Domain Ownership

**Jangan anggap Operator sebagai pemilik semua data.**

| Domain | Pemilik | Pelaksana | Approver |
|---|---|---|---|
| Data siswa, guru, ortu | Operator | Operator | Kepsek (read) |
| Kebijakan akademik | **Wakasek** | Wakasek | Kepsek (approve + aktifkan) |
| Keuangan | Bendahara | Admin Keuangan | Bendahara |
| Konseling | Guru BK | Guru BK | — |
| Platform SaaS | Super Admin | Super Admin | — |

---

## Permission Format

```
{modul}.{resource}.{aksi}
```

### Tahun Ajaran & Semester (granular — P0/P1)

```
master_data.tahun_ajaran.view      ← semua role sekolah
master_data.tahun_ajaran.manage    ← Operator (buat DRAFT), Wakasek
master_data.tahun_ajaran.review    ← Wakasek (submit ke kepsek)
master_data.tahun_ajaran.approve   ← Kepsek
master_data.tahun_ajaran.activate  ← Kepsek
master_data.tahun_ajaran.complete  ← Wakasek (tutup buku)
master_data.tahun_ajaran.archive   ← Operator (arsipkan setelah COMPLETED)

master_data.semester.view          ← semua role sekolah
master_data.semester.manage        ← Operator + Wakasek (edit tanggal/nama)
master_data.semester.activate      ← Wakasek (ganti semester aktif)
master_data.semester.archive       ← Operator (arsipkan setelah CLOSED)
```

### Kebijakan Akademik

```
master_data.kelas.view             ← semua role sekolah
master_data.kelas.manage           ← Wakasek

master_data.mapel.view             ← semua role sekolah
master_data.mapel.manage           ← Wakasek

master_data.kurikulum.view         ← semua role sekolah
master_data.kurikulum.manage       ← Wakasek (Operator VIEW-ONLY)

master_data.program.view           ← semua role sekolah
master_data.program.manage         ← Wakasek
```

### Data Administrasi

```
master_data.guru.view / create / update / delete / import / export / verify / restore
master_data.siswa.view / create / update / delete / import / export
master_data.orang_tua.view / manage
```

### Modul Lain

```
absensi.input / edit / view_kelas_sendiri / view_all / rekap
akademik.nilai.input / view / view_all
akademik.rapor.view / manage / generate
akademik.jadwal.view / manage
akademik.kalender.manage
dms.upload / view_own / view_all / approve / download / delete / bulk_download
keuangan.tagihan.* / keuangan.pembayaran.* / keuangan.laporan.*
bk.* / perpustakaan.* / surat.*
pengumuman.* / laporan.* / pengaturan.*
akun.view / create / update / delete / toggle_active / reset_password / manage_roles
pengaturan.rbac.manage    ← operator (buat role custom)
```

---

## Workflow Status

### Tahun Ajaran
```
DRAFT → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED → ARCHIVED
         (Wakasek)      (Kepsek)   (Kepsek)  (Wakasek)   (Operator)
```
Data terkunci (tidak bisa diedit) setelah status ≥ APPROVED.

### Semester
```
UPCOMING → ACTIVE → CLOSED → ARCHIVED
           (Wakasek) (Wakasek) (Operator)
```
Lock berlaku di level status semester — bukan status TA.
Wakasek tetap bisa edit tanggal Semester Genap saat TA sudah ACTIVE.

---

## Implementation

### Backend — Double Layer (WAJIB)

```php
// Layer 1 — Route middleware: cek permission
Route::patch('/tahun-ajaran/{ulid}/approve', ...)
    ->middleware('permission:master_data.tahun_ajaran.approve');

// Layer 2 — Policy di controller: cek ownership + workflow state
public function approve(ApproveTahunAjaranRequest $request, string $ulid): JsonResponse
{
    $ta = TahunAjaran::where('ulid', $ulid)->firstOrFail();
    Gate::authorize('approve', $ta);   // TahunAjaranPolicy::approve()
    // ...
}
```

### Policy — Gunakan `hasPermission()`, bukan `hasRole()`

```php
// ❌ SALAH — hardcode role, gagal untuk role custom
public function approve(User $user, TahunAjaran $ta): bool
{
    return $user->hasRole('kepsek');
}

// ✅ BENAR — evaluasi permission dinamis
public function approve(User $user, TahunAjaran $ta): bool
{
    return $this->sameSchool($user, $ta)
        && $user->hasPermission('master_data.tahun_ajaran.approve')
        && $ta->canTransitionTo(StatusTahunAjaran::APPROVED);
}
```

### Frontend — Permission Guard

```jsx
const { hasPermission } = useAuth();

// Tombol hanya muncul jika user punya permission yang tepat
{hasPermission('master_data.tahun_ajaran.manage') && (
  <button onClick={handleTambah}>Tambah Tahun Ajaran</button>
)}

{hasPermission('master_data.tahun_ajaran.approve') && (
  <button onClick={handleApprove}>Setujui</button>
)}

{hasPermission('master_data.semester.activate') && (
  <button onClick={handleAktifkanSemester}>Aktifkan Semester</button>
)}
```

### Read-Only untuk Guru & Wali Kelas

```jsx
// Guru & wali kelas bisa akses referensi periode aktif
import { useTahunAjaranAktif, useSemesterAktif } from "hooks/api/useTahunAjaran";

const { data: taAktif }      = useTahunAjaranAktif();   // GET /aktif
const { data: semesterAktif } = useSemesterAktif();      // GET /aktif/semester

// Endpoint ini di luar middleware 'role:operator,kepsek,wakasek'
// Aksesnya via permission: master_data.tahun_ajaran.view (semua role punya ini)
```

---

## Aturan Keamanan

1. **Selalu dua lapis**: middleware (permission) + policy (ownership/tenant)
2. Jangan pernah cek permission saja tanpa cek `school_id`
3. `withoutGlobalScope(SchoolScope)` **hanya** di `PlatformAdminController`
4. Cache permission per user per request — jangan query DB berkali-kali
5. Super Admin lintas tenant → catat di `activity_logs` dengan flag `is_platform_admin`

---

## Matriks Ringkas

| Permission | operator | wakasek | kepsek | guru | wali_kelas |
|---|:---:|:---:|:---:|:---:|:---:|
| tahun_ajaran.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| tahun_ajaran.manage | ✓ | ✓ | — | — | — |
| tahun_ajaran.review | — | ✓ | — | — | — |
| tahun_ajaran.approve | — | — | ✓ | — | — |
| tahun_ajaran.activate | — | — | ✓ | — | — |
| tahun_ajaran.complete | — | ✓ | — | — | — |
| tahun_ajaran.archive | ✓ | — | — | — | — |
| semester.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| semester.manage | ✓ | ✓ | — | — | — |
| semester.activate | — | ✓ | — | — | — |
| semester.archive | ✓ | — | — | — | — |
| kurikulum.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| kurikulum.manage | — | ✓ | — | — | — |
| mapel.manage | — | ✓ | — | — | — |
| kelas.manage | — | ✓ | — | — | — |
| guru.create/update/delete | ✓ | — | — | — | — |
| guru.verify | — | — | ✓ | — | — |
| absensi.input | — | — | — | ✓ | ✓ |
| absensi.view_all | ✓ | ✓ | ✓ | — | — |
| nilai.input | — | — | — | ✓ | — |
| nilai.view_all | — | ✓ | ✓ | — | — |
| pengaturan.rbac.manage | ✓ | — | — | — | — |

Detail lengkap + workflow: **`doc2-rbac-design.md`**

---

## Changelog

### September 2026 — Major Update (P0/P1/P2)
- `super_operator` dihapus dari daftar role (sudah merge ke `operator`)
- Permission Tahun Ajaran dipecah granular: manage/review/approve/activate/complete/archive
- Semester jadi entitas mandiri dengan permission + workflow sendiri
- Policy refaktor total: `hasRole()` → `hasPermission()` (mendukung role custom)
- Guru & Wali Kelas: tidak lagi 403 untuk endpoint read Tahun Ajaran/Semester aktif
- `useTahunAjaranAktif()` dan `useSemesterAktif()` hooks — dipakai semua modul yang
  butuh referensi periode aktif (monitoring absensi, rekap guru, dashboard)
- Domain ownership ditegaskan: Wakasek = pemilik kebijakan akademik;
  Operator = pelaksana administrasi data