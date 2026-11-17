# Modul Kurikulum — Arsitektur & Keputusan Desain

---

## Masalah yang Diselesaikan

Sebelumnya kurikulum di-hardcode sebagai `ENUM` di tiga tabel:

```sql
mapels.kurikulum              ENUM('Kurikulum 2013', 'Kurikulum Merdeka', 'Keduanya')
kelas.kurikulum               ENUM('K13', 'Merdeka', 'Lainnya')
komponen_penilaians.kurikulum ENUM('K13', 'Merdeka', 'Semua')
```

**Dampak:** setiap kurikulum baru dari pemerintah memerlukan `ALTER TABLE` di 3+ tabel, migration baru, dan deploy ulang — semua tenant terdampak sekaligus.

---

## Solusi: Kurikulum sebagai Entitas Data

Kurikulum disimpan di tabel `kurikulums` dengan pola **two-layer** yang sudah ada di Scholara (lihat `master_religions`):

| `school_id` | Makna |
|---|---|
| `NULL` | Platform default — tersedia untuk semua sekolah, dikelola super admin |
| non-`NULL` | Kurikulum custom milik sekolah tersebut (Cambridge, IB, Pesantren, dll) |

**Kurikulum baru dari pemerintah** → INSERT satu row di tabel `kurikulums` → langsung tersedia semua sekolah. Tidak perlu deploy ulang.

**Sekolah custom** → buat kurikulum sendiri dengan `school_id` mereka → tidak mengganggu sekolah lain.

---

## Skema Tabel

### `kurikulums`

```
id, school_id (nullable), ulid
nama, kode, tahun_berlaku, tahun_berakhir
jenis: nasional | internasional | khusus | custom
penerbit, deskripsi
metadata JSON  ← konfigurasi dinamis per kurikulum
is_active, is_platform_default
[audit: created_by, updated_by, deleted_by, soft_delete]
```

### `kurikulum_komponen_nilaians`

Komponen penilaian per kurikulum — menggantikan ENUM di `komponen_penilaians`:

```
id, school_id (nullable), kurikulum_id
nama, kode
kategori: pengetahuan | keterampilan | sikap | projek | ekstrakurikuler | lainnya
bobot_persen, urutan, is_wajib, is_active
```

### `kurikulum_program_pendidikans` (pivot — KETAT)

Relasi abadi: program mana yang **kompatibel** dengan kurikulum tertentu.

```
id, school_id (nullable)   ← NULL = platform-level, non-NULL = override sekolah
kurikulum_id FK
program_pendidikan_id FK
catatan                    ← penjelasan kompatibilitas / perbedaan implementasi
is_active
```

**Matrix kompatibilitas default:**

| Program | K13 | Merdeka |
|---|---|---|
| `peminatan` (IPA/IPS/Bahasa) | ✅ | ❌ — tidak ada di Merdeka |
| `mata_pelajaran_pilihan` | ❌ | ✅ — pengganti peminatan di Merdeka |
| `bidang_keahlian` (SMK) | ✅ | ✅ |
| `program_keahlian` (SMK) | ✅ | ✅ |
| `konsentrasi_keahlian` (SMK) | ✅ | ✅ |
| `keagamaan` (MA) | ✅ | ✅ — P2RA di Merdeka |
| `umum` | ✅ | ✅ |

### `kurikulum_tahun_ajarans` (pivot — TEMPORAL + HISTORIS)

Relasi temporal: kurikulum mana yang **berlaku** di tahun ajaran tertentu.

```
id, school_id (wajib non-NULL)
kurikulum_id FK
tahun_ajaran_id FK
semester_id FK (nullable) ← NULL = berlaku seluruh tahun ajaran
tingkat_kelas JSON (nullable) ← NULL = semua tingkat. [7] = hanya kelas 7
catatan, is_active, created_by
```

**Contoh data — masa transisi K13 → Merdeka:**

| Kurikulum | Tahun Ajaran | Semester | Tingkat |
|---|---|---|---|
| K13 | 2025/2026 | NULL | [8, 9] |
| Merdeka | 2025/2026 | NULL | [7] |

---

## Kolom yang Diperbarui

| Tabel | Kolom lama (tetap ada) | Kolom baru |
|---|---|---|
| `kelas` | `kurikulum` ENUM | `kurikulum_id` FK → `kurikulums` |
| `mapels` | `kurikulum` VARCHAR | `kurikulum_id` FK → `kurikulums` (nullable) |
| `komponen_penilaians` | `kurikulum` ENUM | `kurikulum_id` FK → `kurikulums` (nullable) |

> **Kolom lama tidak langsung dihapus** — dipertahankan sebagai fallback selama masa transisi. Hapus kolom lama setelah semua backend + frontend sudah pakai `kurikulum_id`.

---

## Semantik NULL di `mapels.kurikulum_id` dan `komponen_penilaians.kurikulum_id`

```
kurikulum_id = NULL    → berlaku untuk SEMUA kurikulum (pengganti nilai "Keduanya"/"Semua")
kurikulum_id = K13     → hanya untuk Kurikulum 2013
kurikulum_id = MERDEKA → hanya untuk Kurikulum Merdeka
```

Ini berbeda dengan `kelas.kurikulum_id` yang **wajib NOT NULL** — setiap kelas harus memiliki satu kurikulum yang aktif.

---

## Multi-Kurikulum dalam Satu Sekolah

Kasus nyata: masa transisi K13 → Merdeka

```
Kelas 7A (2025) → kurikulum_id = MERDEKA
Kelas 8A (2024) → kurikulum_id = K13
Kelas 9A (2023) → kurikulum_id = K13
```

Ini bisa dihandle karena `kurikulum_id` ada di level **kelas**, bukan di level **sekolah**. Sistem nilai, komponen penilaian, dan rapor otomatis menyesuaikan berdasarkan kurikulum kelas masing-masing.

---

## Data Platform Default (Seed)

Diseed otomatis di `2026_09_03_000001_create_kurikulums_table.php`:

| Kode | Nama | Jenis | Default |
|---|---|---|---|
| `K13` | Kurikulum 2013 | nasional | ✗ |
| `MERDEKA` | Kurikulum Merdeka | nasional | ✓ |
| `CAMBRIDGE` | Cambridge IGCSE / A-Level | internasional | ✗ |
| `IB` | International Baccalaureate | internasional | ✗ |

---

## Permission

| Permission | Role Default |
|---|---|
| `master_data.kurikulum.view` | operator, kepsek, wakasek, guru, wali_kelas |
| `master_data.kurikulum.manage` | operator, wakasek |
| `master_data.kurikulum.review` | wakasek (ajukan review) |
| `master_data.kurikulum.complete` | wakasek (selesaikan) |
| `master_data.kurikulum.approve` | kepsek (setujui / tolak) |
| `master_data.kurikulum.activate` | kepsek (aktifkan) |

> Kurikulum **platform** (school_id NULL) hanya bisa dikelola oleh super admin via panel platform — bukan lewat endpoint ini.

---
## Kurikulum Bawaan vs Milik Sekolah

| | Bawaan Scholara | Milik Sekolah |
|---|---|---|
| `school_id` | NULL | id sekolah |
| Dikelola oleh | Super admin (`/api/superadmin/kurikulum-platform`) | Wakasek / operator (`/kurikulum`) |
| Muncul di dropdown | Ya, bila aktif dan masih berlaku | Ya, bila aktif dan masih berlaku |

- Kode kurikulum sekolah tidak boleh sama dengan kode kurikulum bawaan (supaya dropdown tidak ambigu).
- Satu `is_platform_default` per jenis. Menjadikan satu kurikulum default melepas default lain pada jenis yang sama.
- Kode dan jenis kurikulum bawaan terkunci setelah dipakai sekolah mana pun. Menghapusnya ditolak bila sudah dipakai; nonaktif tetap boleh dan sekolah yang sudah memakainya tidak terganggu.
- **Salin jadi milik sekolah** (`POST /kurikulum/{ulid}/salin`): menyalin kurikulum bawaan beserta komponen nilainya. Kode menjadi `<KODE>-SEK` (`-2`, `-3`, … bila bentrok, termasuk dengan baris yang sudah dihapus), nama diberi akhiran "(Salinan)", status selalu Aktif. Struktur mapel tidak ikut disalin karena milik implementasi, bukan kurikulum.

---

## Implementasi per Tahun Ajaran (`kurikulum_tahun_ajarans`)

Status: `draft → under_review → approved → active → completed`. Penolakan: `under_review → draft` dengan catatan.

| Aksi | Siapa | Prasyarat |
|---|---|---|
| Ajukan review | Wakasek | Struktur terisi untuk setiap tingkat yang diizinkan |
| Setujui / Tolak | Kepsek | Tolak wajib menyertakan catatan |
| Aktifkan | Kepsek | Tidak ada kurikulum aktif lain pada tingkat yang sama di tahun ajaran yang sama; tahun ajaran belum selesai |
| Selesaikan | Wakasek | Status aktif |

Aturan pendaftaran:
- Tingkat kosong = semua tingkat jenjang sekolah (`dasar` 1–6, `menengah_pertama` 7–9, `menengah_atas` 10–12). Tingkat di luar jenjang ditolak.
- Bentrok tingkat saat mendaftarkan hanya **peringatan** (respons `data.peringatan`), dihitung terhadap implementasi lain berstatus draft / under_review / approved / active pada tahun ajaran yang sama. Penolakan tegas baru terjadi saat **aktivasi**.
- Hanya satu implementasi aktif per tingkat per tahun ajaran.

Ubah dan hapus (`PUT` / `DELETE /kurikulum/implementasi/{ulid}`, permission `manage`):
- Hanya status **draft**.
- Ubah hanya tingkat dan catatan. Mengeluarkan tingkat yang sudah punya struktur mapel ditolak.
- Hapus ditolak selama masih ada baris struktur mapel.

---

## Pemantauan

- Kepsek: antrian implementasi sekolahnya (`GET /kurikulum/implementasi`).
- Super admin: read-only per sekolah lewat `/api/superadmin/sekolah/{school}/kurikulum/...`; hanya route GET yang dibuka.

---

## Files yang Dibuat / Dimodifikasi

### Baru
```
backend/database/migrations/2026_09_03_000001_create_kurikulums_table.php
backend/database/migrations/2026_09_03_000002_migrate_kurikulum_enum_to_fk.php
backend/database/migrations/2026_09_03_000003_seed_kurikulum_permissions.php
backend/database/migrations/2026_09_03_000004_create_kurikulum_pivot_tables.php
backend/app/Models/Kurikulum.php
backend/app/Models/KurikulumKomponenNilai.php
backend/app/Services/KurikulumService.php
backend/app/Http/Controllers/MasterData/KurikulumController.php
backend/app/Http/Requests/Kurikulum/StoreKurikulumRequest.php
backend/app/Http/Requests/Kurikulum/UpdateKurikulumRequest.php
```

### Dimodifikasi
```
backend/app/Models/Kelas.php              — tambah kurikulum_id fillable + relasi
backend/app/Models/MataPelajaran.php      — tambah kurikulum_id fillable + relasi
backend/app/Models/ProgramPendidikan.php  — tambah relasi kurikulums() BelongsToMany
backend/app/Models/TahunAjaran.php        — tambah relasi kurikulums() BelongsToMany
backend/database/seeders/SchoolSeeder.php — tambah permission kurikulum
backend/routes/api/master-data.php        — tambah route /kurikulum
```

---

## Roadmap Berikutnya

Setelah migrasi ini stabil dan Phase 2 (Frontend Refactor) selesai:

1. **Capaian Pembelajaran (CP)** — tabel `capaian_pembela jarans` linked ke `kurikulum_id` + `mapel_id` + fase
2. **KKTP per kurikulum** — kriteria ketuntasan berbeda antara K13 (KKM angka) dan Merdeka (deskripsi predikat)
3. **Template Rapor per Kurikulum** — format rapor K13 vs Merdeka berbeda signifikan
4. **Hapus kolom lama** — `kelas.kurikulum`, `mapels.kurikulum`, `komponen_penilaians.kurikulum` setelah semua code sudah pakai FK baru