<?php

namespace App\Services\Mapel;

use App\Models\MataPelajaran;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use App\Services\KurikulumPilihan;

/**
 * MapelService — semua business logic mata pelajaran.
 *
 * Controller hanya boleh memanggil service ini, tidak boleh
 * query DB langsung (per standar doc 05-laravel-standard.md).
 */
class MapelService
{
    /**
     * Daftar mapel dengan filter & paginasi.
     */
    public function paginate(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return MataPelajaran::query()
            ->when($filters['search'] ?? null, fn($q, $search) => $q->where(function ($sub) use ($search) {
                $sub->where('nama_mapel', 'like', "%{$search}%")
                    ->orWhere('kode', 'like', "%{$search}%");
            }))
            ->when($filters['kelompok'] ?? null, fn($q, $v) => $q->where('kelompok', $v))
            ->when(
                $filters['tingkat'] ?? null,
                fn($q, $v) => $q->whereRaw('FIND_IN_SET(?, tingkat)', [$v])
            )
            ->when(
                isset($filters['is_active']) && $filters['is_active'] !== '',
                fn($q) => $q->where('is_active', (bool) $filters['is_active'])
            )
            ->with(['programPendidikan', 'kurikulumRef:id,ulid,nama,kode'])
            ->orderBy('kelompok')
            ->orderBy('nama_mapel')
            ->paginate($perPage);
    }

    /**
     * Dropdown mapel aktif (untuk select di form jadwal, LMS, dll).
     */
    public function dropdown(): Collection
    {
        return MataPelajaran::aktif()
            ->with('programPendidikan')
            ->orderBy('kelompok')
            ->orderBy('nama_mapel')
            ->get(['id', 'ulid', 'kode', 'nama_mapel', 'kelompok', 'tingkat', 'program_pendidikan_id']);
    }

    /**
     * Statistik ringkasan mapel untuk header page.
     * Menghitung dari SELURUH data (bukan per-halaman).
     */
    public function getStats(): array
    {
        return [
            'total'       => MataPelajaran::count(),
            'total_aktif' => MataPelajaran::where('is_active', true)->count(),
            'total_non_aktif' => MataPelajaran::where('is_active', false)->count(),
            'total_kelompok'  => MataPelajaran::distinct('kelompok')->count('kelompok'),
        ];
    }

    /**
     * Temukan mapel by integer ID (internal), pastikan milik school yang sama (via SchoolScope).
     */
    public function findOrFail(int|string $id): MataPelajaran
    {
        return MataPelajaran::with('programPendidikan')->findOrFail($id);
    }

    /**
     * Temukan mapel by ULID (public identifier).
     */
    public function findByUlid(string $ulid): MataPelajaran
    {
        return MataPelajaran::where('ulid', $ulid)
            ->with(['programPendidikan', 'kurikulumRef:id,ulid,nama,kode'])
            ->firstOrFail();
    }

    /**
     * Simpan mapel baru.
     */
    public function store(array $validated): MataPelajaran
    {
        return DB::transaction(function () use ($validated) {
            [$kurikulumId, $kurikulumLegacy] = $this->kurikulumDariInput($validated);

            $mapel = MataPelajaran::create([
                'kode' => strtoupper($validated['kode']),
                'nama_mapel' => $validated['nama_mapel'],
                'kelompok' => $this->normalizeKelompok($validated['kelompok']),
                'tingkat' => $this->parseTingkat($validated['tingkat'] ?? null),
                'program_pendidikan_id' => $validated['program_pendidikan_id'] ?? null,
                'jam_per_minggu' => (int) $validated['jam_per_minggu'],
                'kurikulum' => $kurikulumLegacy,
                'kurikulum_id' => $kurikulumId,
                'is_active' => true,
            ]);

            return $mapel->load('kurikulumRef:id,ulid,nama,kode');
        });
    }

    /**
     * Update mapel yang sudah ada.
     */
    public function update(MataPelajaran $mapel, array $validated, ?bool $isActive = null): MataPelajaran
    {
        return DB::transaction(function () use ($mapel, $validated, $isActive) {
            [$kurikulumId, $kurikulumLegacy] = $this->kurikulumDariInput($validated);

            $mapel->update([
                'kode' => strtoupper($validated['kode']),
                'nama_mapel' => $validated['nama_mapel'],
                'kelompok' => $this->normalizeKelompok($validated['kelompok']),
                'tingkat' => $this->parseTingkat($validated['tingkat'] ?? null),
                'program_pendidikan_id' => array_key_exists('program_pendidikan_id', $validated)
                    ? $validated['program_pendidikan_id']
                    : $mapel->program_pendidikan_id,
                'jam_per_minggu' => (int) $validated['jam_per_minggu'],
                'kurikulum' => $kurikulumLegacy,
                'kurikulum_id' => $kurikulumId,
                'is_active' => $isActive ?? $mapel->is_active,
            ]);

            return $mapel->fresh(['programPendidikan', 'kurikulumRef:id,ulid,nama,kode']);
        });
    }

    /**
     * Tentukan [kurikulum_id, nilai legacy] dari input.
     * - ada key kurikulum_ulid  → jalur baru (null = berlaku semua kurikulum)
     * - tidak ada               → jalur lama (string)
     */
    private function kurikulumDariInput(array $validated): array
    {
        if (array_key_exists('kurikulum_ulid', $validated)) {
            $k = KurikulumPilihan::cari($validated['kurikulum_ulid']);

            return [$k?->id, KurikulumPilihan::legacyMapel($k)];
        }

        return [
            $this->resolveKurikulumId($validated['kurikulum'] ?? null),
            $validated['kurikulum'] ?? null,
        ];
    }
    /**
     * Toggle status aktif.
     */
    public function toggleActive(MataPelajaran $mapel): MataPelajaran
    {
        $mapel->update(['is_active' => !$mapel->is_active]);
        return $mapel->fresh();
    }

    /**
     * Terjemahkan nilai legacy mapels.kurikulum → kurikulums.id (kurikulum platform).
     * 'Keduanya' atau nilai tak dikenal → NULL (= berlaku semua kurikulum).
     */
    public function resolveKurikulumId(?string $legacy): ?int
    {
        $kode = match ($legacy) {
            'K13', 'Kurikulum 2013' => 'K13',
            'Merdeka', 'Kurikulum Merdeka' => 'MERDEKA',
            default => null,
        };

        if ($kode === null) {
            return null;
        }

        $id = DB::table('kurikulums')
            ->whereNull('school_id')
            ->whereNull('deleted_at')
            ->where('kode', $kode)
            ->value('id');

        return $id !== null ? (int) $id : null;
    }

    /**
     * Kelompok yang pernah dipakai SEKOLAH INI (saran & filter).
     * Eksplisit per school_id, tidak bergantung pada global scope.
     */
    public function kelompokList(): array
    {
        return DB::table('mapels')
            ->where('school_id', app('current_school_id'))
            ->whereNull('deleted_at')
            ->whereNotNull('kelompok')
            ->where('kelompok', '!=', '')
            ->distinct()
            ->orderBy('kelompok')
            ->pluck('kelompok')
            ->all();
    }

    /**
     * Rapikan input bebas: rapatkan spasi, lalu samakan penulisan dengan
     * kelompok yang SUDAH ada di sekolah (tanpa peduli huruf besar/kecil),
     * supaya "seni budaya" tidak menjadi grup baru di samping "Seni Budaya".
     */
    public function normalizeKelompok(string $value, ?int $schoolId = null): string
    {
        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
        if ($value === '') {
            return $value;
        }

        $existing = DB::table('mapels')
            ->where('school_id', $schoolId ?? app('current_school_id'))
            ->whereNull('deleted_at')
            ->where('kelompok', $value) // collation MySQL _ci: tidak peka huruf besar/kecil
            ->value('kelompok');

        return $existing ?? $value;
    }
    
    /**
     * Soft-delete mapel.
     */
    public function delete(MataPelajaran $mapel): void
    {
        DB::transaction(fn() => $mapel->delete());
    }

    /**
     * Daftar pemakaian mapel: label => jumlah (hanya yang > 0).
     * Soft delete tidak memicu FK, jadi pengecekan dilakukan di aplikasi.
     */
    public function pemakaian(MataPelajaran $mapel): array
    {
        $hitung = [
            'penugasan guru' => \App\Models\PlotGuruMapel::where('mapel_id', $mapel->id)->count(),
            'jadwal pelajaran' => DB::table('jadwals')->where('mapel_id', $mapel->id)->count(),
            'struktur kurikulum' => DB::table('kurikulum_strukturs')->where('mapel_id', $mapel->id)->count(),
            'materi LMS' => DB::table('course_materials')->where('mapel_id', $mapel->id)->count(),
            'tugas LMS' => DB::table('assignments')->where('mapel_id', $mapel->id)->count(),
            'ujian' => DB::table('exams')->where('mapel_id', $mapel->id)->count(),
        ];

        return array_filter($hitung, fn($n) => $n > 0);
    }

    /**
     * Data untuk ekspor Excel (tanpa paginasi, dengan filter).
     */
    public function forExport(array $filters): Collection
    {
        return MataPelajaran::query()
            ->when($filters['kelompok'] ?? null, fn($q, $v) => $q->where('kelompok', $v))
            ->when(
                $filters['tingkat'] ?? null,
                fn($q, $v) => $q->whereRaw('FIND_IN_SET(?, tingkat)', [$v])
            )
            ->when(
                isset($filters['is_active']) && $filters['is_active'] !== '',
                fn($q) => $q->where('is_active', (bool) $filters['is_active'])
            )
            ->with('programPendidikan')
            ->orderBy('kelompok')
            ->orderBy('nama_mapel')
            ->get();
    }

    /**
     * Parse array tingkat → CSV string.
     * null atau semua tingkat → null (artinya semua tingkat).
     */
    public function parseTingkat(?array $tingkat): ?string
    {
        $allLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

        if (empty($tingkat) || count($tingkat) === count($allLevels)) {
            return null;
        }

        $filtered = array_values(array_filter($tingkat, fn($t) => in_array($t, $allLevels)));

        return empty($filtered) ? null : implode(',', $filtered);
    }
}