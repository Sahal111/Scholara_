<?php

namespace App\Services;

use App\Enums\StatusImplementasiKurikulum;
use App\Models\KurikulumStruktur;
use Illuminate\Database\QueryException;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use App\Models\Kelas;
use App\Models\MataPelajaran;

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

    /**
     * Daftar mapel yang berlaku untuk sebuah kelas (sumber kebenaran tunggal).
     *
     * Kelas → kurikulum_id + tahun_ajaran_id + tingkat + program → implementasi AKTIF → struktur.
     * Fallback ke katalog mapels HANYA bila tidak ada implementasi aktif. Bila ada
     * implementasi aktif, struktur dipakai sepenuhnya (kosong pun tidak fallback).
     *
     * @return array{sumber:string, alasan_fallback:?string, implementasi:?array, mapel:array}
     */
    public function mapelUntukKelas(Kelas $kelas): array
    {
        if (!$kelas->kurikulum_id) {
            return $this->fallbackKatalog('KELAS_TANPA_KURIKULUM');
        }

        $impl = $this->implementasiAktifUntukKelas($kelas);
        if (!$impl) {
            return $this->fallbackKatalog('TIDAK_ADA_IMPLEMENTASI_AKTIF');
        }

        $programId = $kelas->program_pendidikan_id ? (int) $kelas->program_pendidikan_id : null;

        $baris = KurikulumStruktur::query()
            ->where('school_id', $kelas->school_id)
            ->where('kurikulum_tahun_ajaran_id', $impl->id)
            ->where('tingkat', (int) $kelas->tingkat)
            ->where(function ($q) use ($programId) {
                $q->whereNull('program_pendidikan_id');
                if ($programId !== null) {
                    $q->orWhere('program_pendidikan_id', $programId);
                }
            })
            ->with(['mapel', 'program'])
            ->get();

        // Satu mapel hanya sekali: baris khusus program mengungguli baris umum.
        $terpilih = [];
        foreach ($baris as $b) {
            $ada = $terpilih[$b->mapel_id] ?? null;
            if (
                $ada === null
                || ($ada->program_pendidikan_id === null && $b->program_pendidikan_id !== null)
            ) {
                $terpilih[$b->mapel_id] = $b;
            }
        }

        $items = collect($terpilih)
            ->filter(fn($b) => $b->mapel && !$b->mapel->trashed() && $b->mapel->is_active)
            ->sort(fn($a, $b) => [$a->urutan_rapor ?? PHP_INT_MAX, $a->id]
                <=> [$b->urutan_rapor ?? PHP_INT_MAX, $b->id])
            ->map(fn($b) => [
                'mapel_ulid' => $b->mapel->ulid,
                'kode' => $b->mapel->kode,
                'nama' => $b->mapel->nama_mapel,
                'kelompok' => $b->kelompok,
                'alokasi_jp_minggu' => (int) $b->alokasi_jp_minggu,
                'alokasi_jp_tahun' => $b->alokasi_jp_tahun !== null ? (int) $b->alokasi_jp_tahun : null,
                'jenis_komponen' => $b->jenis_komponen,
                'is_wajib' => (bool) $b->is_wajib,
                'urutan_rapor' => $b->urutan_rapor,
                'program_ulid' => $b->program?->ulid,
                'asal_baris' => $b->program_pendidikan_id === null ? 'umum' : 'program',
            ])
            ->values()
            ->all();

        return [
            'sumber' => 'struktur',
            'alasan_fallback' => null,
            'implementasi' => [
                'ulid' => $impl->ulid,
                'status' => $impl->status,
                'kurikulum_kode' => $impl->kurikulum_kode,
                'kurikulum_nama' => $impl->kurikulum_nama,
                'tahun_ajaran' => $impl->tahun_ajaran,
            ],
            'mapel' => $items,
        ];
    }

    /** Implementasi AKTIF yang berlaku bagi kelas (kurikulum, tahun ajaran, semester, tingkat). */
    private function implementasiAktifUntukKelas(Kelas $kelas): ?object
    {
        $tingkat = (int) $kelas->tingkat;

        return DB::table('kurikulum_tahun_ajarans as kta')
            ->join('kurikulums as k', 'k.id', '=', 'kta.kurikulum_id')
            ->join('tahun_ajarans as ta', 'ta.id', '=', 'kta.tahun_ajaran_id')
            ->where('kta.school_id', $kelas->school_id)
            ->where('kta.kurikulum_id', $kelas->kurikulum_id)
            ->where('kta.tahun_ajaran_id', $kelas->tahun_ajaran_id)
            ->where('kta.status', 'active')
            ->where('kta.is_active', true)
            ->where(function ($q) use ($kelas) {
                $q->whereNull('kta.semester_id')
                    ->orWhere('kta.semester_id', $kelas->semester_id);
            })
            ->get([
                'kta.id',
                'kta.ulid',
                'kta.status',
                'kta.semester_id',
                'kta.tingkat_kelas',
                'k.kode as kurikulum_kode',
                'k.nama as kurikulum_nama',
                'ta.tahun as tahun_ajaran',
            ])
            ->filter(function ($r) use ($tingkat) {
                $cakupan = json_decode($r->tingkat_kelas ?? 'null', true);

                return empty($cakupan) || in_array($tingkat, array_map('intval', $cakupan), true);
            })
            ->sortByDesc(fn($r) => $r->semester_id !== null ? 1 : 0)
            ->first();
    }

    /** Katalog mapels aktif sebagai cadangan saat belum ada struktur aktif. */
    private function fallbackKatalog(string $alasan): array
    {
        $items = MataPelajaran::aktif()
            ->orderByRaw('urutan_rapor IS NULL')
            ->orderBy('urutan_rapor')
            ->orderBy('nama_mapel')
            ->get()
            ->map(fn($m) => [
                'mapel_ulid' => $m->ulid,
                'kode' => $m->kode,
                'nama' => $m->nama_mapel,
                'kelompok' => $m->kelompok,
                'alokasi_jp_minggu' => $m->jam_per_minggu,
                'alokasi_jp_tahun' => null,
                'jenis_komponen' => null,
                'is_wajib' => null,
                'urutan_rapor' => $m->urutan_rapor,
                'program_ulid' => null,
                'asal_baris' => 'katalog',
            ])
            ->all();

        return [
            'sumber' => 'katalog',
            'alasan_fallback' => $alasan,
            'implementasi' => null,
            'mapel' => $items,
        ];
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