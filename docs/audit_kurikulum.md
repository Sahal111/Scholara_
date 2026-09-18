# Audit Komprehensif: Kurikulum (RBAC SaaS Sekolah)

> **Dokumen Audit Teknis & Arsitektur**
> **Target Platform:** SaaS Multi-Jenjang (SD/MI, SMP/MTs, SMA/MA, SMK)
> **Status:** Analisis Kesiapan & Temuan Masalah (Read-Only Audit)
> **Tanggal Audit:** 18 September 2026

---

## 1. Ringkasan Eksekutif

Kurikulum adalah **domain inti akademik** yang menentukan seluruh kerangka penilaian, struktur mata pelajaran, pengaturan kelas, dan validitas laporan (rapor). Audit ini menemukan bahwa arsitektur backend kurikulum memiliki **fondasi yang sangat baik secara konseptual**, namun terdapat **celah implementasi kritis** antara sistem baru (entity-based) dan warisan lama (enum/string-based) yang membuat kedua sistem berjalan bersamaan tanpa kepastian kapan transisi selesai.

### Skor Kesiapan per Dimensi

| Dimensi | Skor | Keterangan |
|:---|:---:|:---|
| **Arsitektur Data (Backend)** | 85% | Model, pivot, migrasi sudah solid |
| **RBAC & Permission** | 60% | Seeder konsisten, tapi tidak ada Policy class |
| **Integrasi Kelas** | 30% | Frontend & API kelas masih pakai ENUM lama |
| **Workflow Lifecycle** | 50% | Tidak ada approval workflow seperti TahunAjaran |
| **Frontend (Halaman Kelola)** | 75% | MasterKurikulum.jsx ada & lengkap, tapi akses terbatas |
| **API Endpoint** | 80% | Endpoint lengkap CRUD + pivot sudah ada |
| **Audit Log** | 40% | Kolom audit ada, tapi belum terintegrasi ActivityLog |

---

## 2. Peta Arsitektur Kurikulum (As-Is)

```
Kurikulum (entity)
    ├── school_id: NULL  → Platform Default (Kemdikbud)
    │     └── K13, Kurikulum Merdeka, Cambridge, IB
    └── school_id: non-NULL → Custom Sekolah
          └── Kurikulum Pesantren, IB School X, dll

Kurikulum → [kurikulum_komponen_nilaians]
         → [kurikulum_program_pendidikans] <-> ProgramPendidikan
         → [kurikulum_tahun_ajarans]       <-> TahunAjaran + Semester

Kelas
    ├── kurikulum (string ENUM: 'K13','Merdeka','Keduanya')  <- LAMA (masih aktif!)
    └── kurikulum_id (FK -> kurikulums.id)                   <- BARU (idle, tidak diisi)
```

---

## 3. Matriks Evaluasi: Blueprint vs Realitas

| Fitur / Dimensi | Blueprint Ideal | Kondisi Aktual | Status |
|:---|:---|:---|:---:|
| **Kurikulum sebagai Entitas** | Tabel mandiri, bukan ENUM | Sudah ada tabel `kurikulums` dengan dual-layer (platform/custom) | BAIK |
| **Platform Default** | Tersedia semua sekolah | K13, Merdeka, Cambridge, IB sudah di-seed | BAIK |
| **Custom per Sekolah** | Sekolah buat kurikulum sendiri | `createForSchool()` sudah ada di KurikulumService | BAIK |
| **Komponen Nilai per Kurikulum** | K13 = KI/KD; Merdeka = Formatif/Sumatif/P5 | `kurikulum_komponen_nilaians` sudah ada & di-seed | BAIK |
| **Pivot Kurikulum <-> TahunAjaran** | Historis per tahun ajaran | `kurikulum_tahun_ajarans` ada, endpoint `daftarkan` ada | BAIK |
| **Pivot Kurikulum <-> Program** | Kompatibilitas program-kurikulum | `kurikulum_program_pendidikans` ada & di-seed platform level | BAIK |
| **Policy (Otorisasi Kurikulum)** | Policy class seperti TahunAjaranPolicy | **KurikulumPolicy.php TIDAK ADA** | KRITIS |
| **Workflow Approval** | Kurikulum disetujui Kepsek sebelum aktif | Tidak ada — hanya `is_active` boolean sederhana | BELUM ADA |
| **Integrasi Kelas (FK)** | `kelas.kurikulum_id` sebagai satu-satunya referensi | Kelas masih memakai kolom enum lama `kurikulum` (string) | KONFLIK |
| **Frontend Buat Kelas** | Pilih kurikulum dari dropdown entitas | MasterKelas.jsx masih render hardcoded option Merdeka/K13 | HARDCODED |
| **Akses Guru ke Kurikulum** | Read-only: lihat kurikulum aktif kelasnya | Diblokir route middleware; Guru punya permission tapi 403 | TERBLOKIR |
| **Audit Log** | Catat siapa, kapan, ubah kurikulum apa | Kolom audit ada, tapi tidak ada trigger ActivityLog | PARSIAL |

---

## 4. Temuan Kritis & Analisis Root Cause

### TEMUAN 1 (KRITIS): Tidak Ada KurikulumPolicy — Zero Authorization Control

**Lokasi berkas:**
- Direktori: `backend/app/Policies/`
- Berkas yang ADA: GuruPolicy, KelasPolicy, MataPelajaranPolicy, ProgramPendidikanPolicy, SiswaPolicy, TahunAjaranPolicy
- **`KurikulumPolicy.php` TIDAK ADA**

**Detail masalah:**
Seluruh otorisasi kurikulum hanya mengandalkan middleware `permission:master_data.kurikulum.manage` di route level. Tidak ada validasi kontekstual di level model:

1. Siapa yang boleh menghapus kurikulum platform default? Tidak ada yang mencegahnya!
2. Siapa yang boleh mengedit kurikulum custom sekolah lain? Tidak terkontrol!
3. Validasi apakah kurikulum yang dipakai kelas bisa dinonaktifkan? Tidak ada!

```
Kondisi sekarang:
  Route Middleware (permission check) -> Controller -> Service (tanpa Policy gate)

Yang seharusnya:
  Route Middleware -> Controller -> Policy (gate per objek) -> Service
```

**Perbandingan dengan TahunAjaran:**
`TahunAjaranPolicy.php` sudah memiliki method lengkap: `viewAny`, `view`, `create`, `update`, `delete`, `approve`, `reject`, `activate`. Kurikulum tidak punya satupun method Policy.

---

### TEMUAN 2 (KRITIS): Dual-Track Kurikulum di Kelas — Legacy vs Entitas Baru Aktif Bersamaan

**Lokasi berkas:**
- Model: `backend/app/Models/Kelas.php` (baris 26-27)
- Frontend: `frontend/src/pages/operator/master/masterDataKelas/MasterKelas.jsx` (baris 40, 168-169)

**Detail masalah:**
Model Kelas memiliki **dua kolom kurikulum** yang aktif bersamaan:

```php
// Kelas.php baris 26-27
'kurikulum',    // legacy — dipertahankan sementara, akan dihapus setelah migrasi selesai
'kurikulum_id', // FK baru ke tabel kurikulums
```

Frontend MasterKelas.jsx masih mengirimkan nilai **string hardcoded**:
```jsx
// MasterKelas.jsx baris 168-169
<option value="Merdeka">Kurikulum Merdeka</option>
<option value="K13">Kurikulum 2013</option>

// Payload yang dikirim ke API (baris 227):
kurikulum: form.kurikulum,  // string "Merdeka" / "K13" — bukan FK!
```

Kelas baru yang dibuat hari ini masih mengisi kolom `kurikulum` (ENUM) bukan `kurikulum_id` (FK). Sistem entity-based (`kurikulums`) menjadi **tidak terpakai dalam alur buat kelas**.

**Dampak lapangan:**
- `kelas.kurikulum_id` selalu NULL untuk kelas baru
- `KurikulumService::assertKurikulumTerdaftarDiTahunAjaran()` selalu gagal untuk kelas ini
- Komponen nilai berdasarkan `kurikulum_id` di rapor akan kosong
- Transisi migrasi tidak pernah "selesai" karena frontend tidak pernah beralih

---

### TEMUAN 3 (KRITIS): Guru & Wali Kelas Tidak Bisa Akses Kurikulum Aktif

**Lokasi berkas:** `backend/routes/api/master-data.php` (baris 24-26)

**Detail masalah:**
```php
Route::middleware(['auth:sanctum', 'role:operator,kepsek,wakasek,super_admin'])
    ->prefix('operator/master-data')
    ->group(function () {
        // Semua endpoint kurikulum ada di sini
        // GET /kurikulum, GET /kurikulum/dropdown, dll.
    });
```

Guru dan Wali Kelas memiliki permission `master_data.kurikulum.view` di tabel permissions (SchoolSeeder.php baris 428 & 443), **namun** endpoint berada di bawah role-guard yang tidak mencakup mereka. Akibatnya:
- Guru tidak bisa mengambil informasi kurikulum kelas yang diajarnya
- Wali Kelas tidak bisa melihat kurikulum kelas binaannya
- Permission yang sudah di-assign menjadi "permission kosong" tanpa efek

Ini adalah **masalah yang persis sama** dengan Temuan 3 pada audit Tahun Ajaran.

---

### TEMUAN 4 (SEDANG): Tidak Ada Workflow Approval untuk Kurikulum Custom

**Konteks bisnis:**
Di sekolah nyata, penetapan kurikulum—terutama kurikulum custom yang dibuat sekolah sendiri (pesantren, sekolah alam, internasional)—seharusnya melalui persetujuan Kepsek sebelum berlaku.

**Kondisi aktual:**
Kurikulum hanya memiliki `is_active` (boolean sederhana). Wakasek bisa langsung mengaktifkan/menonaktifkan kurikulum tanpa persetujuan Kepsek. Tidak ada:
- Status lifecycle (draft -> diajukan -> disetujui -> aktif)
- Endpoint approval: `/kurikulum/{ulid}/approve`
- Halaman review Kepsek untuk kurikulum

**Berbanding terbalik** dengan TahunAjaran yang sudah memiliki `TahunAjaranKepsek.jsx` yang sangat lengkap.

---

### TEMUAN 5 (SEDANG): Perlindungan Platform Default Hanya Implisit, Tidak Eksplisit

**Lokasi berkas:** `backend/app/Services/KurikulumService.php`

**Detail masalah:**
Method `updateForSchool` dan `deactivate` menggunakan `scopeForSchool($schoolId)` yang hanya mengambil kurikulum milik sekolah tersebut (`school_id = $schoolId`). Kurikulum platform (`school_id = NULL`) tidak ter-query.

Ini berarti kurikulum platform aman secara implisit — tapi tidak ada guard eksplisit dan tidak ada error message yang jelas:

```php
// Tidak ada kode seperti ini yang seharusnya ada:
if ($kurikulum->is_platform_default) {
    throw new DomainException('Kurikulum platform default tidak dapat dimodifikasi oleh sekolah.');
}
```

---

### TEMUAN 6 (SEDANG): Validasi Kompatibilitas Program-Kurikulum Tidak Pernah Terpicu

**Lokasi berkas:** `backend/app/Services/KurikulumService.php` (baris 254-271)

**Detail masalah:**
`KurikulumService::assertProgramKompatibel()` sudah dibuat dengan baik — namun tidak pernah terpicu karena:
1. Frontend mengirim string enum (bukan `kurikulum_id`)
2. Controller Kelas tidak bisa memanggil validasi ini jika tidak ada `kurikulum_id`

Validasi kompatibilitas antara program pendidikan dan kurikulum — yang dirancang untuk mencegah mismatch (misal: Peminatan IPA di Kurikulum Merdeka yang tidak mengenal peminatan) — **tidak aktif di production**.

---

### TEMUAN 7 (RINGAN): Duplikasi Prefix API di Frontend Hook

**Lokasi berkas:** `frontend/src/hooks/api/useKurikulum.js` (baris 5)

```javascript
const BASE = "/operator/master-data/kurikulum";
```

Seluruh endpoint kurikulum di frontend memanggil prefix `/operator/master-data/...` meskipun yang mengakses bisa Wakasek. Ini:
1. Semantik yang salah — Wakasek menggunakan "portal operator"?
2. Rentan error jika route group prefix berubah di backend

---

## 5. Audit Tabel Database & Konsistensi Skema

| Tabel | Status | Catatan |
|:---|:---:|:---|
| `kurikulums` | BAIK | Struktur lengkap: ULID, dual-layer, soft delete, audit fields |
| `kurikulum_komponen_nilaians` | BAIK | Komponen nilai K13 & Merdeka sudah di-seed platform level |
| `kurikulum_program_pendidikans` | BAIK | Matrix kompatibilitas platform-level sudah ada |
| `kurikulum_tahun_ajarans` | BAIK | Pivot temporal dengan tingkat_kelas JSON dan semester_id opsional |
| `kelas.kurikulum` (ENUM) | LEGACY | Masih aktif, nilai: K13, Merdeka, Keduanya — belum deprecated |
| `kelas.kurikulum_id` (FK) | IDLE | Kolom ada tapi tidak diisi frontend — selalu NULL untuk kelas baru |
| `mapels.kurikulum` | BELUM DIAUDIT | Masih pakai ENUM K13, Merdeka, Lainnya (lihat migration 2026_09_08) |

---

## 6. Audit RBAC: Matriks Permission per Role

Sumber referensi: `SchoolSeeder.php`

| Role | kurikulum.view | kurikulum.manage | Bisa Akses Endpoint? |
|:---|:---:|:---:|:---:|
| Wakasek | YA | YA | YA (dalam operator route group) |
| Operator | YA | TIDAK | YA (dalam operator route group) |
| Kepsek | YA | TIDAK | YA (dalam operator route group) |
| Guru | YA | TIDAK | TIDAK (diblokir role guard, HTTP 403) |
| Wali Kelas | YA | TIDAK | TIDAK (diblokir role guard, HTTP 403) |
| Bendahara | TIDAK | TIDAK | TIDAK (tidak punya permission) |
| Super Admin | Tergantung | Tergantung | YA |

**Anomali Kritis:** Guru dan Wali Kelas memiliki permission `master_data.kurikulum.view` di tabel permissions, tetapi route guard mencegah mereka masuk ke endpoint. Permission tersebut menjadi "dead permission" yang tidak memberikan efek apapun di sistem.

---

## 7. Audit Frontend: Komponen & Halaman

### Halaman yang Ada

| Halaman | Role | Route | Status |
|:---|:---|:---|:---:|
| `MasterKurikulum.jsx` | Wakasek | `/wakasek/kurikulum` | LENGKAP |
| `ModalKurikulum.jsx` | Wakasek | (modal di dalam Master) | CUKUP BAIK |
| `MasterKelas.jsx` | Operator | `/operator/master/kelas` | MENGGUNAKAN DROPDOWN LAMA |

### Temuan Frontend

**1. MasterKelas.jsx menggunakan dropdown hardcode, bukan dari API:**
Hook `useKurikulumDropdown()` sudah ada dan siap dipakai di `useKurikulum.js`, tapi `MasterKelas.jsx` tidak menggunakannya. Dropdown kurikulum masih berupa static HTML option.

**2. Tidak ada halaman kurikulum untuk Operator:**
Operator punya permission `view` tapi tidak ada route di `App.jsx` untuk halaman read-only kurikulum dari portal operator. Jika Operator perlu melihat daftar kurikulum yang tersedia, tidak ada jalur UI-nya.

**3. Tidak ada halaman review Kepsek untuk Kurikulum:**
Berbeda dengan TahunAjaran yang punya `TahunAjaranKepsek.jsx`, tidak ada `KurikulumKepsek.jsx` yang mengizinkan Kepsek melihat ringkasan kurikulum aktif yang dipakai sekolah.

**4. useKurikulumDropdown sudah ada tapi tidak dipakai di form Kelas:**
Hook di `useKurikulum.js` baris 89-98 sudah mengambil data dari `/kurikulum/dropdown` dengan format yang tepat, tetapi diabaikan oleh `MasterKelas.jsx`.

---

## 8. Status Transisi Migrasi Enum ke FK

Terdapat jejak migrasi yang menunjukkan proses transisi yang sedang berlangsung namun belum selesai:

1. `2026_09_03_000001_create_kurikulums_table.php` — entitas kurikulum dibuat
2. `2026_09_03_000002_migrate_kurikulum_enum_to_fk.php` — data lama dimigrasi ke FK
3. `2026_09_08_000002_fix_kurikulum_enum_consistency.php` — nilai ENUM diseragamkan

Model `Kelas.php` baris 26 secara eksplisit menyatakan:
```php
'kurikulum',  // legacy — dipertahankan sementara, akan dihapus setelah migrasi selesai
```

**Masalah:** Tidak ada migration cutover yang mewajibkan penggunaan `kurikulum_id` dan menonaktifkan kolom lama. Karena frontend tidak pernah beralih, transisi ini bisa berlangsung selamanya.

---

## 9. Rekomendasi Roadmap Perbaikan

### Fase 1: Perbaikan Akses & Policy (Prioritas Tinggi)

1. **Buat `KurikulumPolicy.php`:**
   - `viewAny`: semua role yang punya `master_data.kurikulum.view`
   - `create`, `update`, `delete`: hanya `master_data.kurikulum.manage` (Wakasek)
   - `deactivate`: Wakasek; tambah guard eksplisit cek `is_platform_default`
   - `activate`: Wakasek; pastikan hanya bisa aktifkan kurikulum milik sekolahnya

2. **Buka Akses GET Kurikulum untuk Guru & Wali Kelas:**
   - Buat route group terpisah yang mengizinkan Guru dan Wali Kelas untuk endpoint read-only (`GET /kurikulum`, `GET /kurikulum/dropdown`)
   - Atau tambahkan `guru,wali_kelas` ke role guard master-data.php

### Fase 2: Selesaikan Transisi Enum ke FK (Prioritas Tinggi)

3. **Update `MasterKelas.jsx` untuk menggunakan `useKurikulumDropdown()`:**
   - Hapus dropdown hardcoded option Merdeka / K13
   - Ganti dengan data dari API endpoint kurikulum/dropdown
   - Kirim `kurikulum_id` (ULID dari entitas) ke API, bukan string

4. **Buat migration cutover untuk kelas:**
   - Wajibkan kolom `kelas.kurikulum_id` NOT NULL setelah semua data termigrasi
   - Hapus kolom `kelas.kurikulum` (ENUM lama)

### Fase 3: UI Lengkap & Audit Log (Prioritas Sedang)

5. **Tambah halaman read-only Kurikulum untuk Operator** di portal Operator
6. **Integrasikan ActivityLog** ke KurikulumService menggunakan pola yang sama dengan TahunAjaranService
7. **Pertimbangkan Approval Workflow** untuk kurikulum custom (penting untuk sekolah swasta/internasional)

---

## 10. Perbandingan: Kurikulum vs Tahun Ajaran

| Aspek | Kurikulum | Tahun Ajaran |
|:---|:---:|:---:|
| Entitas Mandiri (bukan ENUM) | YA | YA |
| Policy Class | TIDAK ADA | ADA |
| Workflow Approval Kepsek | TIDAK ADA | ADA (draft->review->approved->active) |
| Halaman Khusus Kepsek | TIDAK ADA | ADA (TahunAjaranKepsek.jsx) |
| Akses Guru (read-only) | DIBLOKIR | DIBLOKIR (masalah sama) |
| Audit Log | PARSIAL | CUKUP BAIK |
| Integrasi ke Form Lain (Kelas) | PARSIAL (masih enum) | BAIK |
| Arsitektur Data | LEBIH CANGGIH (dual-layer, pivot) | BAIK |

**Kesimpulan:**
Tahun Ajaran lebih matang secara workflow dan otorisasi.
Kurikulum memiliki **arsitektur data yang lebih canggih** (dual-layer platform/custom, pivot kompatibilitas, komponen nilai per kurikulum) tetapi **tertinggal jauh dalam lapisan Policy, integrasi UI, dan selesainya transisi migrasi**.
