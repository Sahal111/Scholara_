# SECURITY AUDIT — SCHOLARA

**Versi:** 2.0 (menggantikan draft v1)
**Tanggal:** 11 November 2026
**Metode:** Read-only static inspection + route enumeration
**Status runtime:** MySQL tidak berjalan; tidak ada eksploitasi aktif yang dijalankan
**Ruang lingkup:** Backend Laravel 12, frontend React 19, konfigurasi auth/CORS/cookie, multi-tenancy, otorisasi modul, DMS, dan penanganan PII

> Dokumen ini adalah hasil audit defensif pada repositori yang diotorisasi. Tidak ada data rahasia yang dicetak. Lokasi secret disebutkan, nilainya tidak.

---

## 1. Ringkasan

Audit menemukan **18 temuan**: 2 kritis, 6 tinggi, 5 sedang, 4 rendah, dan 1 informasi.

| Tingkat | Jumlah | ID |
|---|---:|---|
| CRITICAL | 2 | SEC-01, SEC-02 |
| HIGH | 6 | SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08 |
| MEDIUM | 5 | SEC-09, SEC-10, SEC-11, SEC-12, SEC-13 |
| LOW | 4 | SEC-14, SEC-15, SEC-16, SEC-17 |
| INFO | 1 | SEC-18 |

**Kesimpulan:** aplikasi **belum layak production** dari sisi keamanan. Temuan paling mendesak adalah **arbitrary file read** pada endpoint download DMS yang dapat membaca `backend/.env`, serta **desain enkripsi PII yang tidak kompatibel dengan pencarian** sehingga alur inti gagal dan unique constraint tidak berfungsi.

---

## 2. Metodologi dan Batasan

### 2.1 Metode

1. Enumerasi 394 route (`php artisan route:list`) dan pemetaan middleware.
2. Pembacaan controller, FormRequest, service, model, scope, cast, observer, dan middleware.
3. Pembacaan 83 migrasi untuk constraint dan kolom tenant.
4. Pencarian statis pola berisiko:
   - `where('nuptk')`, `where('nisn')`, `where('nik')`
   - `orWhere` tanpa closure
   - `findOrFail($id)` tanpa cek kepemilikan
   - `storage_path`, `response()->download`, `file_get_contents`
   - `school_id`, `HasSchoolScope`, `$fillable`
   - `ComingSoon`, `withoutGlobalScope`
5. Pemeriksaan konfigurasi `bootstrap/app.php`, `config/cors.php`, `config/sanctum.php`, `config/filesystems.php`.
6. Pemeriksaan frontend untuk cookie handling, role guard, dan sink XSS.

### 2.2 Batasan

- **Tidak ada pengujian runtime** karena MySQL tidak berjalan dan tidak ada server yang dijalankan.
- **Tidak ada exploitation attempt**; temuan path traversal diverifikasi dari alur kode, bukan dengan mengunduh file.
- **Tidak ada pengujian browser**, sehingga perilaku cookie/CORS hanya dinilai dari konfigurasi.
- **Tidak ada akses ke server produksi**, WAF, atau infrastruktur.
- **Tidak ada secret yang dicetak**; hanya lokasi dan jenisnya.

### 2.3 Label status

| Label | Arti |
|---|---|
| **Terverifikasi statis** | Didukung file/baris kode atau konfigurasi |
| **Belum terverifikasi** | Butuh runtime untuk memastikan dampak |
| **Tidak dapat diuji** | DB/server tidak tersedia |

---

## 3. Rubrik Severity

| Tingkat | Kriteria |
|---|---|
| **CRITICAL** | Dapat membaca/mengubah seluruh data atau kredensial; eskalasi penuh; tanpa interaksi korban |
| **HIGH** | Kebocoran data lintas tenant; bypass otorisasi signifikan; integritas data rusak |
| **MEDIUM** | Memperbesar permukaan serangan; butuh kondisi tambahan; dampak terbatas |
| **LOW** | Hardening/defense-in-depth; dampak kecil atau butuh akses lokal |
| **INFO** | Observasi tanpa dampak langsung |

---

## 4. Temuan Detail

---

### SEC-01 — Arbitrary File Read pada DMS `downloadFile`

| Field | Nilai |
|---|---|
| **Tingkat** | CRITICAL |
| **Komponen** | DMS Guru |
| **Lokasi** | `backend/app/Http/Controllers/MasterData/Guru/GuruDokumenController.php:178–199` |
| **Route** | `GET /api/operator/master-data/guru/{nuptk}/file-download` |
| **Middleware** | `auth:sanctum`, `role:operator,kepsek,wakasek,super_admin`, `permission:dms.download` |
| **Status** | Terverifikasi statis; eksploitasi belum dijalankan |
| **CVSS 3.1 (estimasi)** | 8.5–9.0 (AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N) |

#### Deskripsi

Endpoint menerima parameter `path` dari query string dan menggabungkannya langsung ke `storage_path('app/public/')` tanpa normalisasi, validasi `realpath`, atau allowlist direktori.

```php
$filePath = $request->query('path');
$fullPath = storage_path('app/public/' . $filePath);

if (!file_exists($fullPath)) {
    return $this->notFound('File tidak ditemukan.');
}

return response()->download($fullPath, $safeName . '.' . $ext);
```

Tidak ada pengecekan bahwa file berada di direktori dokumen guru, tidak ada pengecekan kepemilikan, dan tidak ada penolakan terhadap `..`.

#### Dampak

Dengan `path=../../../.env`, penyerang yang memiliki akun operator/kepsek/wakasek dapat membaca `backend/.env`. File tersebut umumnya berisi:

- `APP_KEY` → dapat mendekripsi cookie, payload terenkripsi, dan data PII.
- Kredensial database → akses langsung ke seluruh tenant.
- Kredensial mail → pengiriman email palsu/phishing.
- Kredensial layanan lain jika ada.

Ini adalah jalur langsung menuju **kompromi penuh aplikasi dan data seluruh sekolah**.

#### Skenario eksploitasi (konseptual, tidak dijalankan)

1. Login sebagai operator (atau role lain dengan `dms.download`).
2. Kirim request ke endpoint dengan `path=../../../.env`.
3. Respons berisi file `.env`.
4. Gunakan `APP_KEY` untuk mendekripsi data PII dan token.
5. Gunakan kredensial DB untuk membaca/mengubah seluruh data.

#### Perbaikan

1. **Jangan menerima path dari user.** Terima `dokumen_id`, ambil `file_path` dari database.
2. Validasi `realpath`:
   ```php
   $base = realpath(storage_path('app/private/guru-dokumen'));
   $full = realpath($base . '/' . $relative);
   if ($full === false || !str_starts_with($full, $base . DIRECTORY_SEPARATOR)) {
       abort(403);
   }
   ```
3. Tolak `..`, absolute path, null byte, dan symlink.
4. Batasi ekstensi yang diizinkan (pdf, jpg, png, docx).
5. Tambahkan test untuk `../`, `..%2f`, absolute path, symlink, dan double encoding.
6. Rotasi `APP_KEY` dan kredensial jika endpoint pernah terekspos.

#### Test regresi yang disarankan

- `test_download_rejects_path_traversal`
- `test_download_rejects_absolute_path`
- `test_download_rejects_symlink_outside_base`
- `test_download_only_own_school_document`

---

### SEC-02 — PII Terenkripsi Dipakai sebagai Kunci Query dan Unique

| Field | Nilai |
|---|---|
| **Tingkat** | CRITICAL |
| **Komponen** | Master guru, siswa, orang tua, absensi, PPDB |
| **Lokasi** | 124 occurrence `where('nuptk')`/`where('nisn')` di controller; cast `EncryptedString`; unique rule |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 8.0 (integritas + ketersediaan) |

#### Deskripsi

`EncryptedString` memakai `Crypt::encryptString` dengan **random IV**. Ciphertext berbeda setiap kali nilai disimpan. Dokumentasi cast sendiri menyatakan:

> Field yang menggunakan cast ini TIDAK BISA di-WHERE/filter langsung di DB.

Namun kode tetap melakukan:

```php
Guru::where('nuptk', $nuptk)->firstOrFail();
Siswa::where('nisn', $nisn)->firstOrFail();
```

Contoh lokasi:

- `GuruProfileController::show/update/forceDelete/uploadFoto/koreksiNuptk/restore/verifikasi/batalVerifikasi` (`destroy` memakai fallback ID, jadi tidak selalu gagal)
- `MasterDataSiswaController::show/update/regenerateKodeAnak/uploadFoto/destroy`
- `OrtuController::tambahAnak/updateAnak/hapusAnak/getOrtuAnak`
- `OperatorController::createGuru/createWaliKelas`
- `AbsensiController` (filter NISN)
- `KepsekController::detailSiswa` (detail guru punya fallback ULID)
- `GuruController::detailSiswa`
- `UpdateSiswaRequest`, `StoreSiswaRequest`, `KonversiSiswaRequest`

Unique rule juga membandingkan plaintext dengan ciphertext:

```php
'nisn' => 'required|size:10|unique:siswas,nisn',
'nuptk' => 'unique:gurus,nuptk',
```

Composite unique index `(school_id, nuptk)` dan `(school_id, nisn)` **tidak efektif** karena ciphertext berbeda untuk nilai yang sama.

#### Dampak

1. **Alur inti gagal** — detail/edit/hapus guru dan siswa, upload foto, verifikasi, absensi, dan tambah anak oleh ortu mengembalikan 404.
2. **Duplikat data** — dua siswa dengan NISN sama dapat dibuat; dua guru dengan NUPTK sama dapat dibuat.
3. **Integritas akademik** — absensi, nilai, dan relasi dapat tertukar.
4. **False sense of security** — data terenkripsi tetapi tidak dapat dioperasikan; tim mungkin melonggarkan enkripsi untuk "memperbaiki" fitur.

#### Perbaikan

1. Tambahkan kolom hash deterministik:
   - `nisn_hash`, `nuptk_hash`, `nik_hash`, `no_kk_hash`
   - SHA-256 dari nilai + pepper (`APP_KEY` turunan), disimpan sebagai `CHAR(64)`.
2. Backfill dari data yang sudah didekripsi.
3. Ganti semua lookup ke hash:
   ```php
   $hash = hash_hmac('sha256', $nisn, config('app.pii_pepper'));
   Siswa::where('nisn_hash', $hash)->firstOrFail();
   ```
4. Tambahkan unique index `(school_id, nisn_hash)` dan `(school_id, nuptk_hash)`.
5. Pertahankan cast enkripsi untuk tampilan.
6. Ganti unique rule menjadi `Rule::unique('siswas')->where('school_id', $schoolId)->where('nisn_hash', $hash)`.
7. Tambahkan test duplikat dan test lintas sekolah.

#### Catatan migrasi

- Hash harus dibuat **sebelum** data dienkripsi atau sebagai bagian dari command `encrypt:sensitive-data`.
- Jangan hash ciphertext; hash plaintext.
- Jika pepper berubah, semua hash harus di-rebuild.

---

### SEC-03 — Kebocoran Lintas Tenant melalui `orWhere` Tanpa Grouping

| Field | Nilai |
|---|---|
| **Tingkat** | HIGH |
| **Komponen** | Pencarian user, orang tua, siswa |
| **Lokasi** | `OperatorController:73–76`, `OperatorController:287–288`, `MasterDataSiswaController:80–84` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 6.5 |

#### Deskripsi

Global scope `SchoolScope` menambahkan `AND school_id = ?`. Ketika query memiliki `OR` tanpa grouping, SQL membaca:

```sql
WHERE name LIKE ? OR username LIKE ? OR email LIKE ? AND school_id = ?
```

`AND` mengikat hanya cabang terakhir. Cabang `name` dan `username` tidak dibatasi tenant.

Contoh:

```php
$query->where('name', 'like', "%{$search}%")
    ->orWhere('username', 'like', "%{$search}%")
    ->orWhere('email', 'like', "%{$search}%");
```

#### Dampak

- Operator sekolah A dapat melihat nama/username/email user sekolah B.
- Pada `OperatorController::index`, filter role juga dapat terlewati untuk cabang `name`/`username`.
- Data siswa dan orang tua lintas sekolah dapat terlihat.

#### Perbaikan

```php
$query->where(function ($q) use ($search) {
    $q->where('name', 'like', "%{$search}%")
      ->orWhere('username', 'like', "%{$search}%")
      ->orWhere('email', 'like', "%{$search}%");
});
```

Tambahkan test isolasi tenant untuk setiap endpoint pencarian.

---

### SEC-04 — `pengaturans` Global dan Dapat Ditimpa Lintas Tenant

| Field | Nilai |
|---|---|
| **Tingkat** | HIGH |
| **Komponen** | Pengaturan sekolah / registrasi orang tua |
| **Lokasi** | `OperatorController:44–56`, `AuthController:190`, `Model Pengaturan` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 6.0 |

#### Deskripsi

Tabel `pengaturans` memiliki `school_id` NOT NULL dan unique `(school_id, key)`, tetapi model tidak memakai `HasSchoolScope` dan tidak memiliki `school_id` di `$fillable`. Query hanya memakai `key`:

```php
Pengaturan::where('key', 'kode_registrasi_ortu')->first();
Pengaturan::updateOrCreate(
    ['key' => 'kode_registrasi_ortu'],
    ['value' => $request->kode_registrasi]
);
```

#### Dampak

1. Sekolah A dapat mengubah kode registrasi yang dibaca sekolah B.
2. `updateOrCreate` dapat menimpa baris sekolah lain atau gagal karena unique `(school_id, key)`.
3. Sekolah yang belum punya baris tidak dapat menyimpan kode.
4. Registrasi orang tua dapat diarahkan ke sekolah yang salah.

#### Perbaikan

- Tambahkan `school_id` ke `$fillable` dan `HasSchoolScope`.
- Query dengan `school_id = current`.
- Gunakan `updateOrCreate(['school_id' => $schoolId, 'key' => ...], [...])`.
- Tambahkan unique `(school_id, key)` (sudah ada) dan test isolasi.

---

### SEC-05 — Galeri Tanpa Scope Tenant

| Field | Nilai |
|---|---|
| **Tingkat** | HIGH |
| **Komponen** | Galeri publik dan operator |
| **Lokasi** | `GaleriController:13–49`, `Model Galeri` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 6.5 |

#### Deskripsi

`galeris.school_id` NOT NULL, tetapi model tidak memakai `HasSchoolScope` dan tidak memiliki `school_id` di `$fillable`.

- `index` mengembalikan semua galeri semua sekolah.
- `destroy` menghapus baris berdasarkan ID tanpa cek tenant.
- `store` gagal karena `school_id` tidak diisi.

#### Dampak

- Kebocoran foto/aktivitas sekolah lain ke publik.
- Penghapusan data sekolah lain oleh operator mana pun.
- Fitur galeri tidak dapat digunakan.

#### Perbaikan

- Tambahkan scope dan `$fillable`.
- Gunakan policy `GaleriPolicy` dengan cek `school_id` dan `uploaded_by`.
- Tambahkan test publik dan delete lintas tenant.

---

### SEC-06 — `school_id` NOT NULL tetapi Create-Path Tidak Mengisi

| Field | Nilai |
|---|---|
| **Tingkat** | HIGH |
| **Komponen** | Operator, kelas, DMS, cuti, mutasi |
| **Lokasi** | Lihat tabel di bawah |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 6.0 (availability/integrity) |

| Alur | Lokasi | Model |
|---|---|---|
| Buat operator | `OperatorController:98` | `OperatorProfile` |
| Buat bendahara | `OperatorController:204` | `UserBendahara` |
| Riwayat kelas | `MasterDataKelasController:216`, `NaikKelasController:95`, `MasterDataSiswaController:549` | `RiwayatKelas` |
| DMS | `GuruDokumenService` | `GuruDokumen`, `GuruDokumenVersion`, `GuruDokumenLog` |
| Galeri | `GaleriController::store` | `Galeri` |
| Cuti | `GuruCutiService` | `GuruCuti` |
| Mutasi | `MutasiGuruService` | `GuruMutasi` |

#### Dampak

- HTTP 500 pada alur normal.
- Data tidak tersimpan; pengguna mengira berhasil.
- Jika `school_id` diisi manual dari request, ada risiko cross-tenant assignment.

#### Perbaikan

- Tambahkan `HasSchoolScope` dan `school_id` ke `$fillable`.
- Isi `school_id` dari parent (`$guru->school_id`, `$kelas->school_id`), bukan dari request.
- Tambahkan test create untuk setiap model.

---

### SEC-07 — Otorisasi Object-Level LMS Tidak Ada

| Field | Nilai |
|---|---|
| **Tingkat** | HIGH |
| **Komponen** | LMS (materi, tugas, ujian) |
| **Lokasi** | `AssignmentController:95,120,133,152,167`; `ExamController:87,108,123,144,159,169,191,206`; `CourseMaterialController` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 7.1 |

#### Deskripsi

Controller memakai `findOrFail($id)` tanpa memeriksa `guru_id` terhadap guru yang login. Contoh:

```php
$tugas = Assignment::findOrFail($id);
$tugas->update($validated); // guru lain bisa edit
```

Pada sisi siswa:

- `CourseMaterialController::index` tidak memaksa `is_published = true` dan tidak membatasi `kelas_id`; siswa dapat melihat daftar materi draf dan materi kelas lain.
- `showForSiswa`, `mulai`, dan `submit` tidak memeriksa enrollment kelas. Siswa dapat mengakses tugas/ujian kelas lain yang sudah publish.
- `jawab` dan `submit` ujian memvalidasi session milik siswa, tetapi tidak memvalidasi bahwa ujian itu milik kelas siswa.

#### Dampak

- Guru A dapat mengubah/menghapus/menilai konten Guru B.
- Siswa dapat melihat materi draf, mengikuti ujian kelas lain, dan mengirim jawaban.
- Integritas penilaian dan ujian rusak.

#### Perbaikan

- Buat policy:
  - `AssignmentPolicy@update/delete/viewSubmissions` → `$assignment->guru_id === $user->guru->id`.
  - `ExamPolicy` serupa.
  - `CourseMaterialPolicy` serupa.
- Untuk siswa: cek `siswa_kelas`/`riwayat_kelas` terhadap `kelas_id` materi/ujian.
- Tambahkan test negatif.

---

### SEC-08 — Otorisasi Object-Level Absensi Tidak Ada

| Field | Nilai |
|---|---|
| **Tingkat** | HIGH |
| **Komponen** | Absensi |
| **Lokasi** | `AbsensiController:192–207` (update), `:147` (store), `:78` (showKelas), `:212` (rekap) |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 7.0 |

#### Deskripsi

`update` mengambil `Absensi::findOrFail($id)` lalu langsung mengubah status tanpa cek apakah guru berhak atas kelas/jadwal tersebut.

`store` hanya memeriksa kepemilikan jika `$user->hasRole('guru')`:

```php
if ($user->hasRole('guru') && !$user->hasRole('operator')) {
    // cek kepemilikan
}
```

User dengan role `wali_kelas` saja (tanpa `guru`) melewati pengecekan.

`showKelas` dan `rekap` tidak memeriksa kepemilikan kelas.

#### Dampak

- Guru dapat mengubah absensi kelas/siswa mana pun di sekolah.
- Wali kelas dapat menginput absensi kelas lain.
- Rekap dapat dibaca tanpa hak.

#### Perbaikan

- Policy `AbsensiPolicy` dengan cek:
  - `operator`/`kepsek` → view all.
  - `guru` → hanya jadwal/kelas yang diampu.
  - `wali_kelas` → hanya kelas yang menjadi tanggung jawabnya.
- Terapkan di `store`, `update`, `showKelas`, `rekap`, `bySiswa`.
- Perbaiki bug `'nisn' => $sk->siswa_id` menjadi NISN siswa.

---

### SEC-09 — Token Sanctum Tidak Pernah Kedaluwarsa

| Field | Nilai |
|---|---|
| **Tingkat** | MEDIUM |
| **Komponen** | Autentikasi |
| **Lokasi** | `backend/config/sanctum.php:53` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 5.9 |

#### Deskripsi

```php
'expiration' => null,
```

Token yang dibuat saat login berlaku selamanya. Cookie 7 hari, tetapi token di database tetap valid setelah cookie hilang. Logout hanya menghapus token aktif; token lain (perangkat lain) tetap hidup.

#### Dampak

- Token yang bocor (XSS di masa depan, cookie tossing, backup, log) berlaku permanen.
- Tidak ada cara membatasi sesi perangkat.
- Tidak ada revoke massal saat password berubah.

#### Perbaikan

- Set `expiration` 120 menit.
- Implementasikan refresh token atau re-login.
- Revoke semua token pada perubahan password dan "logout semua perangkat".
- Tambahkan kolom `last_used_at` dan alarm untuk token mencurigakan.

---

### SEC-10 — Tidak Ada Proteksi CSRF pada API Cookie-Auth

| Field | Nilai |
|---|---|
| **Tingkat** | MEDIUM |
| **Komponen** | API auth |
| **Lokasi** | `bootstrap/app.php` (middleware API), `InjectTokenFromCookie`, cookie `SameSite=Lax` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 5.4 |

#### Deskripsi

API memakai cookie `auth_token` (HttpOnly) dan `withCredentials: true`, tetapi middleware API tidak memuat `ValidateCsrfToken`. `SameSite=Lax` memitigasi POST lintas situs, tetapi tidak menutup:

- Same-site sibling subdomain.
- Browser lama/perilaku Lax inconsistency.
- GET yang mengubah state (jika ada).

#### Dampak

- Permintaan yang mengubah data dapat dipicu dari origin same-site.
- Jika ada subdomain yang dapat dikontrol penyerang, cookie dapat ikut terkirim.

#### Perbaikan

- Aktifkan CSRF untuk cookie-auth:
  - frontend memanggil `/sanctum/csrf-cookie`,
  - axios mengirim `X-XSRF-TOKEN`,
  - API memakai `ValidateCsrfToken`.
- Atau gunakan token header dengan expiry pendek dan tanpa cookie.
- Set `SameSite=Strict` jika alur memungkinkan.

---

### SEC-11 — Permission Middleware Tidak Diterapkan di 6 Modul

| Field | Nilai |
|---|---|
| **Tingkat** | MEDIUM |
| **Komponen** | RBAC |
| **Lokasi** | `routes/api/keuangan.php`, `ppdb.php`, `lms.php`, `bk.php`, `perpustakaan.php`, `tata-usaha.php` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 5.3 |

#### Deskripsi

Route group modul tersebut hanya memakai `role:...`. Tidak ada `permission:...`, sehingga seluruh aksi (view/create/update/delete/export) dapat dilakukan oleh siapa pun yang memiliki role, terlepas dari permission yang diberikan atau dicabut.

#### Dampak

- Prinsip least privilege tidak berjalan.
- Pencabutan permission tidak berefek.
- Role yang terlalu luas (mis. `bendahara`) dapat menghapus data.

#### Perbaikan

- Tambahkan `permission:` per operasi di semua route group.
- Tambahkan test role/permission matrix.
- Audit ulang `RbacCatalog` dan `permissions:sync`.

---

### SEC-12 — PII Terdekripsi Ditulis ke Activity Log

| Field | Nilai |
|---|---|
| **Tingkat** | MEDIUM |
| **Komponen** | Logging / observability |
| **Lokasi** | `GuruObserver`, `SiswaObserver`, `KelasObserver`, `KurikulumObserver` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 4.7 |

#### Deskripsi

Observer menulis nilai field yang berubah ke `activity_logs.keterangan`, termasuk NUPTK/NISN/NIK yang sudah didekripsi oleh cast. Enkripsi at-rest pada tabel utama menjadi sia-sia karena salinan plaintext ada di tabel log.

#### Dampak

- Siapa pun dengan akses DB/log dapat membaca PII.
- Retensi log memperpanjang eksposur.
- Melanggar prinsip data minimization UU PDP.

#### Perbaikan

- Log hanya `field_name` dan `model_id`, bukan nilai.
- Jika perlu diff, simpan hash atau mask.
- Terapkan retensi dan akses ketat ke `activity_logs`.
- Audit log lama dan hapus PII.

---

### SEC-13 — DMS: Simpan di `local`, Baca dari `public`

| Field | Nilai |
|---|---|
| **Tingkat** | MEDIUM |
| **Komponen** | DMS |
| **Lokasi** | `GuruDokumenService::storeFile`, `downloadDokumen`, `downloadFile`, `bulkDownload` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 4.3 (availability/integrity) |

#### Deskripsi

`storeFile` menyimpan ke disk `local` (`storage/app/private`), sedangkan download membaca `storage_path('app/public/...')`. File yang diunggah tidak akan ditemukan saat diunduh.

#### Dampak

- Fitur DMS tidak berfungsi.
- Pengguna mungkin memakai path manual (yang memicu SEC-01).
- Data dokumen tidak konsisten.

#### Perbaikan

- Gunakan satu disk dan satu base path.
- Simpan metadata path relatif di DB.
- Gunakan `Storage::disk('local')->download($path)`.
- Tambahkan test upload → download.

---

### SEC-14 — Cookie Token Plaintext dan `InjectTokenFromCookie` Menerima Nilai Arbitrer

| Field | Nilai |
|---|---|
| **Tingkat** | LOW |
| **Komponen** | Autentikasi |
| **Lokasi** | `InjectTokenFromCookie`, `AuthController::login` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 4.0 |

#### Deskripsi

Cookie `auth_token` berisi token Sanctum mentah karena middleware API tidak memuat `EncryptCookies`. `InjectTokenFromCookie` mencoba `Crypt::decryptString`, lalu fallback ke nilai mentah. Artinya cookie apa pun dapat dijadikan bearer token; validasi tetap dilakukan Sanctum, sehingga tidak bisa memalsukan token tanpa nilai valid.

#### Dampak

- Jika cookie bocor, token langsung dapat dipakai.
- Cookie tossing dari subdomain saudara dapat menimpa cookie (domain host-only mengurangi risiko).
- Tidak ada integritas cookie di level aplikasi.

#### Perbaikan

- Enkripsi cookie dengan `EncryptCookies` atau gunakan token acak server-side yang dipetakan ke sesi.
- Tolak cookie yang tidak dapat didekripsi (jangan fallback).
- Set `__Host-` prefix jika memungkinkan.

---

### SEC-15 — Reset Password Gagal Senyap Tanpa Subdomain

| Field | Nilai |
|---|---|
| **Tingkat** | LOW |
| **Komponen** | Auth |
| **Lokasi** | `PasswordResetController::resolveSchoolId` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 3.1 |

#### Deskripsi

`resolveSchoolId()` mengembalikan `null` jika `current_school_id` tidak ter-bind. `forgotPassword` tetap mengembalikan sukses generik, tetapi tidak mengirim email.

#### Dampak

- Pengguna tidak dapat reset password di domain pusat/localhost.
- Tidak ada pesan error; pengguna menunggu email yang tidak datang.
- Beban support meningkat.

#### Perbaikan

- Resolve sekolah dari subdomain **atau** dari email user (jika unik).
- Jika tidak dapat resolve, kembalikan pesan yang jelas.
- Tambahkan test untuk domain pusat dan subdomain.

---

### SEC-16 — Unique Global pada Register Orang Tua

| Field | Nilai |
|---|---|
| **Tingkat** | LOW |
| **Komponen** | Registrasi |
| **Lokasi** | `RegisterOrtuRequest:17` |
| **Status** | Terverifikasi statis |
| **CVSS 3.1 (estimasi)** | 3.0 |

#### Deskripsi

`unique:users,username` dan `unique:users,email` tidak dibatasi `school_id`, padahal index DB komposit `(school_id, username)`. Registrasi orang tua dengan username sama di sekolah berbeda ditolak.

#### Dampak

- Registrasi lintas sekolah gagal.
- Inkonsistensi dengan model multi-tenant.

#### Perbaikan

- Gunakan `Rule::unique('users')->where('school_id', $schoolId)`.
- Tambahkan test dua sekolah dengan username sama.

---

### SEC-17 — Dependensi `xlsx@0.18.5` dengan CVE Known

| Field | Nilai |
|---|---|
| **Tingkat** | LOW |
| **Komponen** | Frontend export/import |
| **Lokasi** | `frontend/package.json` |
| **Status** | Terverifikasi statis; perlu `npm audit` |
| **CVSS 3.1 (estimasi)** | 5.0 (tergantung CVE) |

#### Deskripsi

Package `xlsx` versi 0.18.5 (npm) memiliki CVE known terkait prototype pollution dan ReDoS. SheetJS tidak lagi merilis versi terbaru ke npm registry dengan nama `xlsx`.

#### Dampak

- Jika file Excel dari sumber tidak tepercaya diproses, ada risiko prototype pollution/DoS di browser.
- Risiko lebih tinggi jika import dilakukan server-side dengan library serupa.

#### Perbaikan

- Jalankan `npm audit`.
- Ganti ke build resmi SheetJS dari CDN/registry resmi, atau library alternatif yang maintained.
- Batasi ukuran file dan validasi tipe.
- Jangan memproses file dari pengguna tanpa sandbox.

---

### SEC-18 — Secret Lokal dan Dokumentasi Berisi Kredensial

| Field | Nilai |
|---|---|
| **Tingkat** | INFO |
| **Komponen** | Repositori lokal |
| **Lokasi** | `backend/.env`, `frontend/.env`, `backend/phpunit.xml`, `PROGRESS.md` |
| **Status** | Terverifikasi statis (keberadaan), nilai tidak dicetak |

#### Deskripsi

- `backend/.env` berisi `APP_KEY`, kredensial DB, dan mail.
- `frontend/.env` berisi URL backend.
- `phpunit.xml` (gitignored) berisi kredensial DB test.
- `PROGRESS.md` mencatat kredensial test account secara plaintext.

#### Dampak

- Jika file ini tercommit atau dibagikan, kredensial bocor.
- `PROGRESS.md` adalah tracked file; risiko lebih tinggi.

#### Perbaikan

- Pastikan `.env` dan `phpunit.xml` tetap gitignored.
- Hapus kredensial dari `PROGRESS.md`.
- Gunakan secret manager di production.
- Rotasi kredensial yang pernah terekspos.
- Tambahkan pre-commit secret scanning.

---

## 5. Kontrol Keamanan yang Sudah Baik

| Kontrol | Status | Bukti |
|---|---|---|
| CORS exact origin | ✅ | `config/cors.php`, env-driven, bukan `*` |
| HttpOnly cookie | ✅ | `AuthController::login` |
| SameSite Lax | ✅ | `AuthController::login` |
| Password hashing | ✅ | `Hash::make`, `Hash::check` |
| Login throttle | ✅ | `throttle:5,1` |
| Anti-enumerasi login | ✅ | Pesan generik |
| Tenant scope fail-closed | ✅ | `SchoolScope::apply` |
| Tidak ada `X-School-ID` | ✅ | Header tidak dipercaya |
| FormRequest validation | ✅ | 108 request |
| Tidak ada sink XSS | ✅ | Tidak ditemukan `dangerouslySetInnerHTML`/`eval` |
| Token revocation saat logout | ✅ | `currentAccessToken()->delete()` |
| `PersonalAccessToken` scope bypass | ✅ | Sengaja, untuk bootstrap auth |
| CSRF endpoint tersedia | ⚠️ | `/sanctum/csrf-cookie` ada, tetapi tidak dipakai |
| Security headers | ❓ | Tidak dapat diverifikasi tanpa server |

---

## 6. Permukaan Serangan

### 6.1 Endpoint publik

| Endpoint | Risiko |
|---|---|
| `POST /api/auth/login` | Throttle 5/menit; aman secara desain |
| `POST /api/auth/register-ortu` | Kode registrasi global (SEC-04), unique global (SEC-16) |
| `POST /api/auth/forgot-password` | Reset senyap (SEC-15) |
| `GET /api/public/galeri` | Bocor lintas tenant (SEC-05) |
| `GET /api/public/pengumuman` | Scoped, perlu verifikasi |
| `GET /api/ppdb/*` | Perlu verifikasi akses |

### 6.2 Endpoint terautentikasi berisiko tinggi

| Endpoint | Temuan |
|---|---|
| `GET /api/operator/master-data/guru/{nuptk}/file-download` | SEC-01 |
| `GET/PUT/DELETE /api/operator/master-data/guru/{nuptk}` | SEC-02 |
| `GET/PUT/DELETE /api/operator/master-data/siswa/{nisn}` | SEC-02 |
| `GET /api/operator/users?search=` | SEC-03 |
| `GET /api/operator/ortu?search=` | SEC-03 |
| `GET /api/operator/master-data/siswa?search=` | SEC-03 |
| `PUT /api/absensi/{id}` | SEC-08 |
| `PUT/DELETE /api/lms/*` | SEC-07 |
| `DELETE /api/operator/master-data/galeri/{id}` | SEC-05 |

### 6.3 Endpoint yang tidak memakai permission

- Seluruh `keuangan.php`, `ppdb.php`, `lms.php` (blok guru), `bk.php`, `perpustakaan.php`, `tata-usaha.php`.

---

## 7. Rekomendasi Prioritas

### 7.1 Dalam 24 jam

1. Nonaktifkan sementara route `file-download` atau tambahkan validasi `realpath`.
2. Rotasi `APP_KEY` dan kredensial DB/mail jika endpoint pernah dapat diakses publik.
3. Audit akses log untuk pola `path=..`.

### 7.2 Dalam 1 minggu

1. Implementasikan blind index PII dan migrasikan lookup.
2. Group semua `orWhere`; tambahkan test tenant.
3. Scope `Pengaturan` dan `Galeri`.
4. Tambahkan `school_id` ke model anak dan create-path.
5. Tambahkan policy LMS dan Absensi.

### 7.3 Dalam 2–4 minggu

1. Token expiry + refresh + revoke massal.
2. CSRF untuk cookie-auth.
3. Permission middleware di semua modul.
4. Hapus PII dari activity log.
5. Perbaiki DMS storage.
6. Audit dependensi dan secret scanning.

---

## 8. Checklist Verifikasi Ulang

- [ ] Path traversal DMS ditolak untuk `../`, absolute, symlink, encoded.
- [ ] Semua lookup NISN/NUPTK memakai hash; unique menolak duplikat.
- [ ] Test lintas tenant lulus untuk user, siswa, ortu, galeri, pengaturan.
- [ ] Semua create model anak menghasilkan `school_id`.
- [ ] Guru tidak dapat mengubah konten guru lain.
- [ ] Siswa hanya dapat mengakses materi published dan ujian kelasnya.
- [ ] Absensi hanya dapat diedit oleh guru/wali kelas yang berhak.
- [ ] Token kedaluwarsa dan dapat direvoke.
- [ ] CSRF aktif untuk cookie-auth.
- [ ] Semua route modul memakai permission.
- [ ] Activity log tidak berisi PII.
- [ ] DMS upload → download berhasil.
- [ ] `npm audit` bersih/terdokumentasi.
- [ ] Tidak ada kredensial di file tracked.

---

## 9. Pernyataan

Audit ini bersifat defensif dan read-only. Tidak ada exploitation yang dijalankan, tidak ada data yang diubah, dan tidak ada secret yang dicetak. Temuan path traversal dan lookup PII diverifikasi dari alur kode; dampak runtime perlu dikonfirmasi di environment staging yang terisolasi.

**Auditor:** AI technical audit
**Tanggal:** 11 November 2026
**Versi:** 2.0
