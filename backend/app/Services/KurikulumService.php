<?php

namespace App\Services;

use App\Models\Kurikulum;
use App\Models\KurikulumKomponenNilai;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service untuk manajemen Kurikulum.
 *
 * Business rules:
 *   - Kurikulum platform (school_id NULL) hanya bisa dikelola super admin
 *   - Setiap sekolah bisa tambah kurikulum custom (school_id = sekolah tersebut)
 *   - Hanya SATU is_platform_default = true per jenis (nasional, internasional, dll)
 *   - Kurikulum yang sudah dipakai kelas TIDAK bisa dihapus — hanya dinonaktifkan
 *   - Sekolah mendapat akses ke platform defaults + custom mereka sendiri
 */
class KurikulumService
{
    /**
     * Daftar kurikulum yang tersedia untuk sekolah tertentu (platform + custom).
     * Digunakan di dropdown pilih kurikulum kelas.
     */
    public function availableForSchool(int $schoolId, array $filters = []): LengthAwarePaginator
    {
        return Kurikulum::availableForSchool($schoolId)
            ->aktif()
            ->when(
                $filters['search'] ?? null,
                fn($q, $s) =>
                $q->where('nama', 'like', "%{$s}%")
                    ->orWhere('kode', 'like', "%{$s}%")
            )
            ->when(
                $filters['jenis'] ?? null,
                fn($q, $j) =>
                $q->where('jenis', $j)
            )
            ->with('komponenNilais')
            ->orderByRaw('school_id IS NULL DESC') // platform defaults duluan
            ->orderBy('tahun_berlaku', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Dropdown ringan — hanya id, ulid, nama, kode — untuk pilihan di form kelas/mapel.
     */
    public function dropdownForSchool(int $schoolId): Collection
    {
        return Kurikulum::availableForSchool($schoolId)
            ->aktif()
            ->masihBerlaku()
            ->select('id', 'ulid', 'nama', 'kode', 'jenis', 'tahun_berlaku', 'school_id')
            ->orderByRaw('school_id IS NULL DESC')
            ->orderBy('tahun_berlaku', 'desc')
            ->get()
            ->map(fn($k) => [
                'ulid' => $k->ulid,
                'nama' => $k->nama,
                'kode' => $k->kode,
                'jenis' => $k->jenis,
                'jenis_label' => $k->jenis_label,
                'tahun_berlaku' => $k->tahun_berlaku,
                'is_platform' => $k->is_platform,
            ]);
    }

    /**
     * Detail kurikulum beserta komponen nilainya.
     */
    public function findByUlid(string $ulid, int $schoolId): Kurikulum
    {
        return Kurikulum::availableForSchool($schoolId)
            ->where('ulid', $ulid)
            ->with(['komponenNilais' => fn($q) => $q->aktif()->orderBy('urutan')])
            ->firstOrFail();
    }

    /**
     * Buat kurikulum custom untuk sekolah.
     * Kurikulum platform (school_id NULL) hanya bisa dibuat via Platform Admin.
     */
    public function createForSchool(int $schoolId, array $data): Kurikulum
    {
        return DB::transaction(function () use ($schoolId, $data) {
            $kurikulum = Kurikulum::create([
                ...$data,
                'school_id' => $schoolId, // force ke sekolah yang request
                'is_platform_default' => false, // custom sekolah tidak bisa jadi platform default
            ]);

            // Jika ada komponen nilai yang dikirim, simpan sekaligus
            if (!empty($data['komponen_nilais'])) {
                $this->syncKomponenNilais($kurikulum, $schoolId, $data['komponen_nilais']);
            }

            return $kurikulum->load('komponenNilais');
        });
    }

    /**
     * Update kurikulum custom milik sekolah.
     * Hanya bisa update kurikulum milik sekolah sendiri (bukan platform defaults).
     */
    public function updateForSchool(string $ulid, int $schoolId, array $data): Kurikulum
    {
        $kurikulum = Kurikulum::forSchool($schoolId)
            ->where('ulid', $ulid)
            ->firstOrFail();

        DB::transaction(function () use ($kurikulum, $schoolId, $data) {
            $kurikulum->update($data);

            if (isset($data['komponen_nilais'])) {
                $this->syncKomponenNilais($kurikulum, $schoolId, $data['komponen_nilais']);
            }
        });

        return $kurikulum->fresh(['komponenNilais']);
    }

    /**
     * Nonaktifkan kurikulum (soft approach — tidak hapus).
     * Kurikulum yang masih dipakai kelas tidak bisa dihapus sama sekali.
     */
    public function deactivate(string $ulid, int $schoolId): void
    {
        $kurikulum = Kurikulum::forSchool($schoolId)
            ->where('ulid', $ulid)
            ->firstOrFail();

        $kelasCount = $kurikulum->kelas()->count();
        if ($kelasCount > 0) {
            throw new \DomainException(
                "Kurikulum \"{$kurikulum->nama}\" masih digunakan oleh {$kelasCount} kelas. " .
                "Nonaktifkan kelas terlebih dahulu atau ganti kurikulum kelas tersebut."
            );
        }

        $kurikulum->update(['is_active' => false]);
    }

    /**
     * Hapus permanen — hanya jika tidak ada kelas yang pakai.
     */
    public function delete(string $ulid, int $schoolId): void
    {
        $kurikulum = Kurikulum::forSchool($schoolId)
            ->where('ulid', $ulid)
            ->firstOrFail();

        $kelasCount = $kurikulum->kelas()->count();
        if ($kelasCount > 0) {
            throw new \DomainException(
                "Kurikulum \"{$kurikulum->nama}\" tidak bisa dihapus karena masih digunakan oleh {$kelasCount} kelas."
            );
        }

        DB::transaction(function () use ($kurikulum) {
            $kurikulum->komponenNilais()->delete();
            $kurikulum->delete();
        });
    }

    // ── Validasi Kompatibilitas (dipakai service lain) ───────────────────────

    /**
     * Validasi apakah kombinasi kurikulum + program_pendidikan valid.
     * Dipakai oleh KelasService sebelum simpan kelas baru.
     *
     * @throws \DomainException jika tidak kompatibel
     */
    public function assertProgramKompatibel(int $kurikulumId, int $programPendidikanId): void
    {
        $kompatibel = \DB::table('kurikulum_program_pendidikans')
            ->where('kurikulum_id', $kurikulumId)
            ->where('program_pendidikan_id', $programPendidikanId)
            ->where('is_active', true)
            ->whereNull('deleted_at') // soft-delete aman
            ->exists();

        if (!$kompatibel) {
            $kurikulum = Kurikulum::find($kurikulumId);
            $program = \App\Models\ProgramPendidikan::find($programPendidikanId);

            throw new \DomainException(
                "Program \"{$program?->nama}\" tidak kompatibel dengan kurikulum \"{$kurikulum?->nama}\". " .
                "Pilih kombinasi yang valid atau tambahkan kompatibilitas terlebih dahulu."
            );
        }
    }

    /**
     * Validasi apakah kurikulum terdaftar untuk tahun ajaran (dan semester) tertentu.
     * Dipakai oleh KelasService saat assign kurikulum ke kelas.
     *
     * @throws \DomainException jika belum didaftarkan
     */
    public function assertKurikulumTerdaftarDiTahunAjaran(
        int $kurikulumId,
        int $tahunAjaranId,
        ?int $semesterId = null,
        ?int $tingkat = null
    ): void {
        $query = \DB::table('kurikulum_tahun_ajarans')
            ->where('kurikulum_id', $kurikulumId)
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('is_active', true);

        // Cek semester: bisa semester spesifik ATAU entry yang berlaku semua semester (NULL)
        $query->where(function ($q) use ($semesterId) {
            $q->whereNull('semester_id');
            if ($semesterId) {
                $q->orWhere('semester_id', $semesterId);
            }
        });

        $pivot = $query->first();

        if (!$pivot) {
            $kurikulum = Kurikulum::find($kurikulumId);
            $tahunAjaran = \App\Models\TahunAjaran::find($tahunAjaranId);

            throw new \DomainException(
                "Kurikulum \"{$kurikulum?->nama}\" belum didaftarkan untuk tahun ajaran " .
                "\"{$tahunAjaran?->tahun}\". Daftarkan dulu di pengaturan kurikulum tahun ajaran."
            );
        }

        // Jika pivot punya tingkat_kelas spesifik, validasi tingkat kelas ini termasuk
        if ($tingkat && $pivot->tingkat_kelas) {
            $tingkatYangBoleh = json_decode($pivot->tingkat_kelas, true) ?? [];
            if (!empty($tingkatYangBoleh) && !in_array($tingkat, $tingkatYangBoleh)) {
                $kurikulum = Kurikulum::find($kurikulumId);
                throw new \DomainException(
                    "Kurikulum \"{$kurikulum?->nama}\" hanya berlaku untuk tingkat " .
                    implode(', ', $tingkatYangBoleh) . ". Kelas tingkat {$tingkat} tidak termasuk."
                );
            }
        }
    }

    // ── Manajemen Pivot Tahun Ajaran ─────────────────────────────────────────

    /**
     * Daftarkan kurikulum ke tahun ajaran sekolah.
     * Operator memanggil ini saat setup awal tahun ajaran baru.
     */
    public function daftarkanKeTahunAjaran(int $schoolId, array $data): void
    {
        // Pastikan kurikulum tersedia untuk sekolah ini
        $kurikulum = Kurikulum::availableForSchool($schoolId)
            ->where('id', $data['kurikulum_id'])
            ->firstOrFail();

        // Pastikan tahun ajaran milik sekolah ini
        $tahunAjaran = \App\Models\TahunAjaran::where('school_id', $schoolId)
            ->where('id', $data['tahun_ajaran_id'])
            ->firstOrFail();

        \DB::table('kurikulum_tahun_ajarans')->insertOrIgnore([
            'school_id' => $schoolId,
            'kurikulum_id' => $kurikulum->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
            'semester_id' => $data['semester_id'] ?? null,
            'tingkat_kelas' => isset($data['tingkat_kelas'])
                ? json_encode($data['tingkat_kelas'])
                : null,
            'catatan' => $data['catatan'] ?? null,
            'is_active' => true,
            'created_by' => auth()->id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Daftar kurikulum yang berlaku di tahun ajaran tertentu.
     * Dipakai saat operator buka form buat kelas — hanya tampilkan kurikulum yang valid.
     */
    public function kurikulumUntukTahunAjaran(int $schoolId, int $tahunAjaranId): \Illuminate\Support\Collection
    {
        return \DB::table('kurikulum_tahun_ajarans as kta')
            ->join('kurikulums as k', 'k.id', '=', 'kta.kurikulum_id')
            ->where('kta.school_id', $schoolId)
            ->where('kta.tahun_ajaran_id', $tahunAjaranId)
            ->where('kta.is_active', true)
            ->whereNull('k.deleted_at')
            ->select([
                'k.ulid',
                'k.nama',
                'k.kode',
                'k.jenis',
                'kta.semester_id',
                'kta.tingkat_kelas',
                'kta.catatan',
            ])
            ->orderBy('k.tahun_berlaku', 'desc')
            ->get()
            ->map(function ($row) {
                $row->tingkat_kelas = $row->tingkat_kelas
                    ? json_decode($row->tingkat_kelas, true)
                    : null;
                return $row;
            });
    }

    // ── Manajemen Pivot Program Pendidikan ───────────────────────────────────

    /**
     * Tambah kompatibilitas kurikulum ↔ program pendidikan (custom per sekolah).
     * Platform-level dikelola via seeder/super admin.
     */
    public function tambahKompatibilitasProgram(
        int $schoolId,
        int $kurikulumId,
        int $programPendidikanId,
        ?string $catatan = null
    ): void {
        \DB::table('kurikulum_program_pendidikans')->insertOrIgnore([
            'school_id' => $schoolId,
            'kurikulum_id' => $kurikulumId,
            'program_pendidikan_id' => $programPendidikanId,
            'catatan' => $catatan,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Program pendidikan yang kompatibel dengan kurikulum tertentu di sekolah ini.
     * Menggabungkan platform-level (school_id NULL) + custom sekolah.
     */
    public function programKompatibel(int $schoolId, int $kurikulumId): \Illuminate\Support\Collection
    {
        return \DB::table('kurikulum_program_pendidikans as kpp')
            ->join('program_pendidikans as pp', 'pp.id', '=', 'kpp.program_pendidikan_id')
            ->where('kpp.kurikulum_id', $kurikulumId)
            ->where('kpp.is_active', true)
            ->where(function ($q) use ($schoolId) {
                $q->whereNull('kpp.school_id')      // platform default
                    ->orWhere('kpp.school_id', $schoolId); // custom sekolah
            })
            ->whereNull('pp.deleted_at')
            ->select(['pp.id', 'pp.ulid', 'pp.nama', 'pp.jenis', 'pp.jenjang_sasaran', 'kpp.catatan'])
            ->orderBy('pp.jenis')
            ->get();
    }

    // ── Helpers Private ──────────────────────────────────────────────────────

    private function syncKomponenNilais(Kurikulum $kurikulum, int $schoolId, array $komponens): void
    {
        // Hapus yang lama (custom sekolah saja — jangan hapus platform defaults)
        $kurikulum->komponenNilais()->where('school_id', $schoolId)->delete();

        $insert = collect($komponens)->map(fn($k, $idx) => [
            'school_id' => $schoolId,
            'kurikulum_id' => $kurikulum->id,
            'nama' => $k['nama'],
            'kode' => $k['kode'] ?? null,
            'kategori' => $k['kategori'],
            'bobot_persen' => $k['bobot_persen'] ?? null,
            'urutan' => $k['urutan'] ?? ($idx + 1),
            'is_wajib' => $k['is_wajib'] ?? true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        KurikulumKomponenNilai::insert($insert);
    }
}