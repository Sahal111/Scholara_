<?php

namespace App\Services;

use App\Enums\StatusImplementasiKurikulum;
use App\Models\KurikulumStruktur;
use Illuminate\Database\QueryException;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Struktur kurikulum per implementasi (kurikulum_tahun_ajarans).
 *
 * Aturan bisnis:
 *   - Implementasi harus milik sekolah ini dan masih aktif.
 *   - Struktur hanya bisa diubah saat status implementasi = DRAFT
 *     (terkunci saat UNDER_REVIEW, APPROVED, ACTIVE, COMPLETED).
 *   - Tingkat harus termasuk tingkat_kelas implementasi (jika dibatasi).
 *   - Program (jika diisi) harus kompatibel dengan kurikulum (per JENIS program).
 *   - Satu mapel hanya sekali per (implementasi, tingkat, program).
 *   - Identitas (tingkat, program, mapel) tidak diubah — hapus lalu tambah ulang.
 *
 * Semua pelanggaran aturan dilempar sebagai \DomainException → 422 (handler global
 * di bootstrap/app.php).
 */
class KurikulumStrukturService
{
    public function __construct(
        private readonly KurikulumService $kurikulumService
    ) {
    }

    /**
     * Cari implementasi kurikulum milik sekolah berdasarkan ULID.
     */
    public function cariImplementasi(int $schoolId, string $ulid): ?object
    {
        return DB::table('kurikulum_tahun_ajarans')
            ->where('school_id', $schoolId)
            ->where('ulid', $ulid)
            ->first();
    }

    /**
     * Daftar struktur sebuah implementasi.
     *
     * Jika $programId diisi → baris untuk program itu DITAMBAH baris umum (program NULL),
     * sesuai struktur efektif yang berlaku bagi kelas pada program tersebut.
     *
     * @return Collection<int, KurikulumStruktur>
     */
    public function daftar(
        int $schoolId,
        int $implementasiId,
        ?int $tingkat = null,
        ?int $programId = null
    ): Collection {
        return KurikulumStruktur::query()
            ->where('school_id', $schoolId)
            ->where('kurikulum_tahun_ajaran_id', $implementasiId)
            ->when($tingkat !== null, fn ($q) => $q->where('tingkat', $tingkat))
            ->when($programId !== null, function ($q) use ($programId) {
                $q->where(function ($w) use ($programId) {
                    $w->whereNull('program_pendidikan_id')
                        ->orWhere('program_pendidikan_id', $programId);
                });
            })
            ->with(['mapel', 'program'])
            ->orderBy('tingkat')
            ->orderBy('program_pendidikan_id')
            ->orderBy('urutan_rapor')
            ->orderBy('id')
            ->get();
    }

    /**
     * Tambah mapel ke struktur.
     *
     * @param array{
     *   tingkat:int, mapel_id:int, program_pendidikan_id:?int, kelompok:?string,
     *   alokasi_jp_minggu:int, alokasi_jp_tahun:?int, jenis_komponen:string,
     *   is_wajib:bool, urutan_rapor:?int
     * } $data
     *
     * @throws \DomainException
     */
    public function tambah(object $implementasi, array $data): KurikulumStruktur
    {
        $this->assertBisaDiedit($implementasi);

        $this->assertTingkatDiizinkan($implementasi, (int) $data['tingkat']);

        if (!empty($data['program_pendidikan_id'])) {
            $this->kurikulumService->assertProgramKompatibel(
                (int) $implementasi->kurikulum_id,
                (int) $data['program_pendidikan_id']
            );
        }

        try {
            return KurikulumStruktur::create(
                ['kurikulum_tahun_ajaran_id' => $implementasi->id] + $data
            );
        } catch (QueryException $e) {
            if (($e->errorInfo[1] ?? null) === 1062) {
                throw new \DomainException(
                    'Mata pelajaran ini sudah ada di struktur untuk tingkat dan program tersebut.'
                );
            }

            throw $e;
        }
    }

    /**
     * Ubah atribut struktur (alokasi, kelompok, dst). Identitas tidak bisa diubah.
     */
    public function ubah(int $schoolId, string $ulid, array $data): KurikulumStruktur
    {
        $struktur = KurikulumStruktur::query()
            ->where('school_id', $schoolId)
            ->where('ulid', $ulid)
            ->firstOrFail();

        $this->assertBisaDiedit($this->implementasiDari($struktur));

        $struktur->update(Arr::only($data, [
            'kelompok',
            'alokasi_jp_minggu',
            'alokasi_jp_tahun',
            'jenis_komponen',
            'is_wajib',
            'urutan_rapor',
        ]));

        return $struktur->load(['mapel', 'program']);
    }

    public function hapus(int $schoolId, string $ulid): void
    {
        $struktur = KurikulumStruktur::query()
            ->where('school_id', $schoolId)
            ->where('ulid', $ulid)
            ->firstOrFail();

        $this->assertBisaDiedit($this->implementasiDari($struktur));

        $struktur->delete();
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private function implementasiDari(KurikulumStruktur $struktur): object
    {
        return DB::table('kurikulum_tahun_ajarans')
            ->where('id', $struktur->kurikulum_tahun_ajaran_id)
            ->first();
    }

    /**
     * Struktur hanya boleh diubah saat implementasi aktif-secara-flag DAN
     * berstatus DRAFT.
     *
     * @throws \DomainException
     */
    private function assertBisaDiedit(object $implementasi): void
    {
        if (!$implementasi->is_active) {
            throw new \DomainException(
                'Implementasi kurikulum ini dinonaktifkan, struktur tidak bisa diubah.'
            );
        }

        $status = StatusImplementasiKurikulum::dari($implementasi->status ?? null);

        if (!$status->isEditable()) {
            throw new \DomainException(
                "Struktur terkunci karena berstatus \"{$status->label()}\". "
                . 'Hanya struktur berstatus Draft yang bisa diubah.'
            );
        }
    }

    /**
     * tingkat_kelas NULL = semua tingkat; selain itu hanya tingkat yang terdaftar.
     */
    private function assertTingkatDiizinkan(object $implementasi, int $tingkat): void
    {
        if ($implementasi->tingkat_kelas === null) {
            return;
        }

        $diizinkan = json_decode($implementasi->tingkat_kelas, true) ?: [];

        if ($diizinkan === []) {
            return; // daftar kosong diperlakukan sama dengan NULL (tidak dibatasi)
        }

        if (!in_array($tingkat, array_map('intval', $diizinkan), true)) {
            throw new \DomainException(
                "Tingkat {$tingkat} tidak termasuk tingkat yang memakai kurikulum ini "
                . '(' . implode(', ', $diizinkan) . ').'
            );
        }
    }
}
