# Audit Menyeluruh: Master Data Mata Pelajaran (Mapel)

Audit dilakukan dengan membandingkan **kode aktual** terhadap **15+ dokumen standar** di folder `docs/`, mencakup seluruh stack dari database, model, service, controller, form request, API resource, routes, hooks, hingga frontend components.

---

## Ringkasan Skor

| Layer | Kepatuhan | Catatan |
|---|---|---|
| Database & Model | ⚠️ 70% | Tidak ada ULID, `$hidden` kosong, audit cols di fillable |
| Service Layer | ✅ 90% | Baik, tapi parsing tingkat duplikasi |
| Controller | ⚠️ 65% | Terlalu besar (303 baris), xlsx helper harusnya di service |
| Form Request | ✅ 85% | `authorize()` selalu `true` — tidak cek permission |
| API Resource | ⚠️ 70% | Expose integer `id`, tidak pakai ULID |
| Routes | ✅ 85% | Baik, permission middleware terpasang |
| Frontend Hook | ✅ 90% | Pattern React Query benar |
| Frontend Page | ⚠️ 60% | 632 baris, hardcode hex, tidak pakai DataTable |
| Frontend Form | ⚠️ 75% | Duplikasi KELOMPOK_OPTIONS, UI inkonsisten |
| Import Modal | ✅ 80% | Baik, tapi `alert()` dipakai |
| Import Job | ✅ 85% | Solid, multi-tenant aware |

---

## Temuan Detail

### 🔴 KRITIS (Harus Diperbaiki)

---

#### 1. API Expose Integer ID — Melanggar doc3-api-contract.md

> [!CAUTION]
> Standar: *"Response tidak pernah expose ID integer mentah ke public — gunakan ULID atau slug"* (doc3 §Prinsip Dasar #5)

**File:** [MapelResource.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Resources/MasterData/MapelResource.php#L31)
```php
// ❌ Saat ini
'id' => $this->id,  // expose integer mentah

// ✅ Seharusnya (setelah tambah kolom ulid)
'id' => $this->ulid,
```

**File:** [MasterDataMapelController.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Controllers/MasterData/MasterDataMapelController.php#L43-L82)
```php
// ❌ show(), update(), toggleActive(), destroy() pakai int $id
public function show(int $id): JsonResponse
public function update(UpdateMapelRequest $request, int $id): JsonResponse

// ✅ Seharusnya pakai string $ulid
public function show(string $ulid): JsonResponse
```

**Dampak:** Semua frontend juga kirim `m.id` (integer) — harus migrasi ke ULID.

---

#### 2. Model Tidak Punya ULID — Melanggar doc1 §ULID & doc3 §Prinsip

> [!CAUTION]
> Standar: *"Semua tabel master punya ulid. ulid dipakai untuk public-facing identifier"* (doc1 §ULID, 03-database-standard.md §ULID)

**File:** [MataPelajaran.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Models/MataPelajaran.php)

- Tidak ada kolom `ulid` di `$fillable`
- Tidak ada auto-generate ULID di `boot()`
- Migration untuk mapels tidak punya kolom `ulid CHAR(26) NOT NULL UNIQUE`

**Fix:** Buat migration tambah kolom `ulid`, generate untuk data existing, tambah di model boot.

---

#### 3. Form Request `authorize()` Selalu `true` — Melanggar doc5

> [!WARNING]
> Standar: *"Cek permission di sini, atau biarkan true dan cek di middleware"* (doc5 §Form Request). Saat ini `authorize()` return `true` tanpa cek, tapi controller malah panggil `$this->authorize('view', $mapel)` yang butuh **Policy**.

**File:** [StoreMapelRequest.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Requests/Mapel/StoreMapelRequest.php#L13-L16) dan [UpdateMapelRequest.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Requests/Mapel/UpdateMapelRequest.php#L13-L16)

```php
// ❌ Saat ini — tidak ada cek
public function authorize(): bool { return true; }

// ✅ Opsi A (cek di Form Request)
public function authorize(): bool {
    return $this->user()->can('master_data.mapel.manage');
}
```

**Masalah terkait:** Controller memanggil `$this->authorize('view', $mapel)`, `$this->authorize('update', $mapel)`, dll. tapi **MapelPolicy tidak ada** (`grep` return kosong). Ini akan throw error 500 saat diakses.

---

#### 4. Controller Terlalu Besar — 303 Baris, Melanggar doc5

> [!WARNING]
> Standar: *"Satu controller tidak boleh lebih dari 8-10 method"* dan *"Satu method tidak boleh lebih dari 30-40 baris"* (doc5 §Controller)

**File:** [MasterDataMapelController.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Controllers/MasterData/MasterDataMapelController.php)

- **11 method** (index, store, show, update, toggleActive, destroy, dropdown, export, downloadTemplate, import, buildXlsx + helper) → melebihi 8-10
- Method `buildXlsx()` = **130+ baris** → harusnya di service/utility terpisah
- Total **303 baris** — controller seharusnya tipis

**Fix:** Extract `buildXlsx()` + `indexToColLetter()` ke `App\Services\Excel\XlsxBuilder` atau utility class. Pisah `export/import/template` ke `MapelExportController` dan `MapelImportController`.

---

#### 5. Frontend MasterMapel.jsx — 632 Baris, Melanggar doc6

> [!WARNING]
> Standar: *"Satu file komponen tidak boleh lebih dari 200-250 baris"* (doc6 §Komponen)

**File:** [MasterMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/MasterMapel.jsx)

**632 baris** — hampir 3x batas. Harus dipecah:
- `MapelStatsGrid.jsx` — kartu statistik (line 242-318)
- `MapelToolbar.jsx` — search + filter bar (line 321-402)
- `MapelTable.jsx` — tabel + pagination (line 404-601)
- Helper `renderTingkat`, `renderKurikulum`, `renderPages` → pindah ke `utils/`

---

### 🟡 SEDANG (Perlu Diperbaiki)

---

#### 6. Tidak Pakai Reusable `<DataTable>` — Melanggar doc10

> [!IMPORTANT]
> Standar: *"Pakai DataTable component dari components/ui/. Jangan buat tabel dari `<table>` langsung di page."* (doc10 §Table)

**File:** [MasterMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/MasterMapel.jsx#L449-L545)

Tabel dibangun manual dengan `<table>` langsung. Seharusnya pakai `<DataTable columns={...} data={...} meta={...} />`.

---

#### 7. Loading Spinner Bukan Skeleton — Melanggar doc10

> [!IMPORTANT]
> Standar: *"Selalu tampilkan skeleton, bukan spinner"* dan *"❌ SALAH: if (isLoading) return `<Spinner />`"* (doc10 §Loading State)

**File:** [MasterMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/MasterMapel.jsx#L407-L411)

```jsx
// ❌ Saat ini — spinner
<div className="w-10 h-10 border-2 border-[#006e2a] border-t-transparent rounded-full animate-spin" />

// ✅ Seharusnya
<TableSkeleton rows={10} cols={8} />
```

---

#### 8. Hardcode Hex Color — Melanggar doc10

> [!IMPORTANT]
> Standar: *"Pakai Tailwind utility classes. Jangan hardcode hex color."* (doc10 §Warna)

**File:** [MasterMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/MasterMapel.jsx)

Ada **puluhan** hardcoded hex di seluruh file:
```jsx
// ❌ Contoh
bg-[#006e2a], text-[#00342b], bg-[#d1fae5], text-[#065f46], bg-[#fef3c7], ...
border-[#bfc9c4]/20, text-[#3f4945], bg-[#f2f4f3]/50, ...

// ✅ Seharusnya
bg-emerald-700, text-emerald-900, bg-emerald-100, text-emerald-800, bg-amber-100, ...
```

Lebih dari **50 unique hex values** — ini membuat maintenance sangat sulit dan inkonsisten dengan halaman lain.

---

#### 9. Duplikasi KELOMPOK_OPTIONS

**File:** [MasterMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/MasterMapel.jsx#L9-L16) dan [TambahEditMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/TambahEditMapel.jsx#L8-L15)

Konstanta `KELOMPOK_OPTIONS` diduplikasi di 2 file. Selain itu juga diduplikasi di backend di 3 tempat:
- [StoreMapelRequest.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Requests/Mapel/StoreMapelRequest.php#L10)
- [UpdateMapelRequest.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Requests/Mapel/UpdateMapelRequest.php#L10)
- [ProcessMapelImport.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Jobs/ProcessMapelImport.php#L63-L70)

**Fix frontend:** Buat `constants/mapel.js` dan import dari sana.
**Fix backend:** Gunakan konstanta dari model `MataPelajaran::KELOMPOK_VALID` atau buat shared class.

---

#### 10. `alert()` Dipakai di Import Modal — Melanggar doc10

> [!IMPORTANT]
> Standar: *"Toast pakai react-hot-toast — jangan `alert()` atau custom toast"* (doc10 §Aturan UI #3)

**File:** [ModalImportMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/components/ModalImportMapel.jsx#L33)

```jsx
// ❌ Saat ini
alert("Hanya file .xlsx yang diizinkan.");

// ✅ Seharusnya
toast.error("Hanya file .xlsx yang diizinkan.");
```

---

#### 11. Import File Validation Kurang — Melanggar doc13

**File:** [ImportMapelRequest.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Requests/Mapel/ImportMapelRequest.php#L13-L14)

```php
// ❌ Saat ini — tidak validasi tipe file
'file' => 'required|file|max:5120',

// ✅ Seharusnya — validasi MIME type
'file' => 'required|file|max:5120|mimes:xlsx',
```

Tanpa validasi MIME, user bisa upload file `.php` atau `.zip` berbahaya yang kemudian diproses oleh `parseXlsx()`.

---

#### 12. Statistik Dihitung Dari Data Halaman Saat Ini (Bukan Total)

**File:** [MasterMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/MasterMapel.jsx#L132)

```jsx
// ❌ Ini hanya menghitung dari list halaman saat ini (15-20 item per page)
const totalAktif = list.filter((m) => m.is_active).length;

// Card "Non-Aktif" juga berdasar list halaman:
value: isLoading ? "—" : list.length - totalAktif,
```

Kalau ada 100 mapel dan page menampilkan 20, "Total Aktif" cuma menghitung dari 20 yang terlihat — **data menyesatkan**.

**Fix:** Minta backend kirim `stats` terpisah (total_aktif, total_nonaktif) atau tambahkan di response meta.

---

#### 13. `$hidden` Kosong di Model — Melanggar doc5

**File:** [MataPelajaran.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Models/MataPelajaran.php#L35-L37)

```php
// ❌ Saat ini — kosong
protected $hidden = [];

// ✅ Seharusnya (minimal)
protected $hidden = [
    'deleted_at', 'deleted_by', 'created_by', 'updated_by',
];
```

Standar: *"sembunyikan minimal: password, token, audit fields"* (doc5 §Model)

---

#### 14. Audit Columns di `$fillable` — Risiko Mass Assignment

**File:** [MataPelajaran.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Models/MataPelajaran.php#L28-L33)

```php
// ❌ Risiko — audit columns bisa di-set langsung via mass assignment
'created_by',
'updated_by',
'deleted_by',
```

Walaupun di-set otomatis via `boot()`, menyertakan di `$fillable` berarti user bisa inject `created_by` via request. Hapus dari `$fillable`.

---

### 🟢 MINOR (Nice to Have)

---

#### 15. Icon Library Campur — Melanggar doc10

Standar: *"Icon pakai Lucide React — jangan campur dengan library lain"* (doc10 §Aturan UI #2)

- [MasterMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/MasterMapel.jsx) — pakai **Material Symbols** (`material-symbols-outlined`)
- [TambahEditMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/TambahEditMapel.jsx) — pakai **Lucide React** (`BookOpen`, `Hash`, `Clock`)
- [ModalImportMapel.jsx](file:///Users/sahalanwarhadi/project_Sahal/Scholara/frontend/src/pages/operator/master/masterDataMapel/components/ModalImportMapel.jsx) — pakai **Lucide React**

Dalam 1 fitur saja sudah campur 2 library icon.

---

#### 16. Tidak Ada Named Routes untuk Mapel

**File:** [master-data.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/routes/api/master-data.php#L275-L293)

```php
// ❌ Saat ini — tidak ada ->name(...)
Route::get('/mapel', [MasterDataMapelController::class, 'index']);
Route::post('/mapel', [MasterDataMapelController::class, 'store']);

// ✅ Seharusnya
Route::get('/mapel', [...])->name('master-data.mapel.index');
Route::post('/mapel', [...])->name('master-data.mapel.store');
```

Standar: *"✅ BENAR — named route, pakai resource helper"* (doc5 §Route)

---

#### 17. Controller Index Response Format

**File:** [MasterDataMapelController.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Controllers/MasterData/MasterDataMapelController.php#L31)

```php
// ❌ Agak aneh — double wrapping resource → getData()
return $this->success(MapelResource::collection($paginated)->response()->getData());

// ✅ Lebih bersih dan konsisten dengan doc3
$paginated = $this->service->paginate(...);
return $this->success($paginated);
// Biarkan ApiResponse trait handle pagination meta/links
```

---

#### 18. `export()` Tidak Return `JsonResponse` — Melanggar doc5

**File:** [MasterDataMapelController.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Http/Controllers/MasterData/MasterDataMapelController.php#L92-L93)

```php
// ❌ Tidak ada return type hint
public function export(Request $request)
public function downloadTemplate()

// ✅ Walaupun return binary, minimal beri return type
public function export(Request $request): \Illuminate\Http\Response
```

Standar: *"Setiap public method wajib type hint return"* (doc5 §Controller)

---

#### 19. Tingkat Filter — `LIKE` Query Bisa Salah Match

**File:** [MapelService.php](file:///Users/sahalanwarhadi/project_Sahal/Scholara/backend/app/Services/Mapel/MapelService.php#L29)

```php
// ❌ Saat ini — "1" bisa match "10", "11", "12"
->when($filters['tingkat'] ?? null, fn($q, $v) => $q->where('tingkat', 'LIKE', "%{$v}%"))

// ✅ Lebih aman — exact match atau FIND_IN_SET
->when($filters['tingkat'] ?? null, fn($q, $v) => $q->whereRaw('FIND_IN_SET(?, tingkat)', [$v]))
```

---

## Matriks File yang Diaudit

| File | Path | Baris | Temuan |
|---|---|---|---|
| MataPelajaran.php | `app/Models/` | 86 | #2, #13, #14 |
| MasterDataMapelController.php | `app/Http/Controllers/MasterData/` | 303 | #1, #3, #4, #17, #18 |
| MapelService.php | `app/Services/Mapel/` | 153 | #9, #19 |
| MapelResource.php | `app/Http/Resources/MasterData/` | 52 | #1 |
| StoreMapelRequest.php | `app/Http/Requests/Mapel/` | 59 | #3, #9 |
| UpdateMapelRequest.php | `app/Http/Requests/Mapel/` | 63 | #3, #9 |
| ImportMapelRequest.php | `app/Http/Requests/Mapel/` | 25 | #11 |
| ProcessMapelImport.php | `app/Jobs/` | 233 | #9 |
| master-data.php (routes) | `routes/api/` | 337 | #16 |
| useMapel.js | `frontend/src/hooks/api/` | 231 | ✅ OK |
| MasterMapel.jsx | `frontend/src/pages/.../` | 632 | #5, #6, #7, #8, #12, #15 |
| TambahEditMapel.jsx | `frontend/src/pages/.../` | 351 | #9, #15 |
| ModalImportMapel.jsx | `frontend/src/pages/.../components/` | 211 | #10 |
| HasSchoolScope.php | `app/Traits/` | 36 | ✅ OK |

---

## Prioritas Perbaikan

### Fase 1 — Kritis & Security
1. ~~Buat MapelPolicy~~ atau hapus `$this->authorize()` di controller (permission sudah di middleware route)
2. Validasi MIME type di ImportMapelRequest (`mimes:xlsx`)
3. Hapus audit columns (`created_by`, `updated_by`, `deleted_by`) dari `$fillable`

### Fase 2 — Arsitektur & Standar
4. Tambah kolom `ulid` ke tabel `mapels` + migration
5. Ganti semua endpoint dari `int $id` ke `string $ulid`
6. Pecah controller: extract xlsx builder, pisah export/import controller
7. Pecah MasterMapel.jsx (632 baris → 4-5 komponen)
8. Ganti tabel manual → `<DataTable>`

### Fase 3 — Konsistensi UI
9. Ganti semua hardcode hex → Tailwind utility
10. Unifikasi icon library ke Lucide React
11. Ganti spinner → skeleton
12. Ganti `alert()` → `toast.error()`
13. Centralize KELOMPOK_OPTIONS ke shared constants
14. Fix statistik agar hitung dari total, bukan halaman saat ini

### Fase 4 — Polish
15. Tambah named routes
16. Fix LIKE query tingkat → FIND_IN_SET
17. Tambah `$hidden` di model
18. Return type hint di export methods

---

## Open Questions

> [!IMPORTANT]
> **Q1:** Apakah kita sudah siap migrasi semua endpoint mapel dari integer `id` ke `ulid`? Ini butuh update frontend, hooks, dan semua tempat yang referensi `m.id`.

> [!IMPORTANT]
> **Q2:** Untuk `$this->authorize()` di controller — apakah mau buat `MapelPolicy` baru, atau hapus saja karena sudah ada permission check di middleware route?

> [!IMPORTANT]
> **Q3:** Mau langkah per fase, atau mau saya kerjakan langsung semuanya sekaligus?
