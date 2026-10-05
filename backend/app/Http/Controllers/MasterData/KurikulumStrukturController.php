<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kurikulum\StoreKurikulumStrukturRequest;
use App\Http\Requests\Kurikulum\UpdateKurikulumStrukturRequest;
use App\Http\Resources\KurikulumStrukturResource;
use App\Models\MataPelajaran;
use App\Models\ProgramPendidikan;
use App\Services\KurikulumStrukturService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Struktur kurikulum: mapel + alokasi JP per (implementasi × tingkat × program).
 *
 * Implementasi = kurikulum_tahun_ajarans, diidentifikasi lewat ULID-nya
 * (didapat dari GET /kurikulum/tahun-ajaran/{tahunAjaranId} → implementasi_ulid).
 *
 * Aturan bisnis dilempar sebagai \DomainException → 422 (handler global).
 */
class KurikulumStrukturController extends Controller
{
    public function __construct(
        private readonly KurikulumStrukturService $strukturService
    ) {
    }

    /**
     * GET /v1/master-data/kurikulum/implementasi/{implementasiUlid}/struktur
     * Query opsional: ?tingkat=7&program_ulid=...
     */
    public function index(Request $request, string $implementasiUlid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $filter = $request->validate([
            'tingkat' => ['nullable', 'integer', 'between:1,13'],
            'program_ulid' => ['nullable', 'string', 'size:26'],
        ]);

        $implementasi = $this->strukturService->cariImplementasi($schoolId, $implementasiUlid);
        if (!$implementasi) {
            return $this->notFound('Implementasi kurikulum tidak ditemukan.');
        }

        $programId = !empty($filter['program_ulid'])
            ? ProgramPendidikan::where('ulid', $filter['program_ulid'])->value('id')
            : null;

        if (!empty($filter['program_ulid']) && $programId === null) {
            return $this->notFound('Program pendidikan tidak ditemukan.');
        }

        $items = $this->strukturService->daftar(
            $schoolId,
            (int) $implementasi->id,
            isset($filter['tingkat']) ? (int) $filter['tingkat'] : null,
            $programId !== null ? (int) $programId : null
        );

        return $this->success(KurikulumStrukturResource::collection($items)->resolve());
    }

    /**
     * POST /v1/master-data/kurikulum/implementasi/{implementasiUlid}/struktur
     */
    public function store(StoreKurikulumStrukturRequest $request, string $implementasiUlid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $implementasi = $this->strukturService->cariImplementasi($schoolId, $implementasiUlid);
        if (!$implementasi) {
            return $this->notFound('Implementasi kurikulum tidak ditemukan.');
        }

        $v = $request->validated();

        // Resolve ulid → integer id (konvensi Scholara: expose ULID, internal pakai id).
        // Global SchoolScope + rule exists() memastikan hanya data sekolah ini.
        $mapel = MataPelajaran::where('ulid', $v['mapel_ulid'])->firstOrFail();

        $programId = !empty($v['program_ulid'])
            ? ProgramPendidikan::where('ulid', $v['program_ulid'])->value('id')
            : null;

        $struktur = $this->strukturService->tambah($implementasi, [
            'tingkat' => (int) $v['tingkat'],
            'mapel_id' => $mapel->id,
            'program_pendidikan_id' => $programId !== null ? (int) $programId : null,
            'kelompok' => $v['kelompok'] ?? null,
            'alokasi_jp_minggu' => (int) $v['alokasi_jp_minggu'],
            'alokasi_jp_tahun' => $v['alokasi_jp_tahun'] ?? null,
            'jenis_komponen' => $v['jenis_komponen'] ?? 'intrakurikuler',
            'is_wajib' => $v['is_wajib'] ?? true,
            'urutan_rapor' => $v['urutan_rapor'] ?? null,
        ]);

        $struktur->load(['mapel', 'program']);

        return $this->created(
            new KurikulumStrukturResource($struktur),
            'Mata pelajaran berhasil ditambahkan ke struktur kurikulum.'
        );
    }

    /**
     * PUT /v1/master-data/kurikulum/struktur/{ulid}
     * Hanya atribut non-identitas (alokasi, kelompok, jenis, wajib, urutan).
     */
    public function update(UpdateKurikulumStrukturRequest $request, string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $struktur = $this->strukturService->ubah($schoolId, $ulid, $request->validated());

        return $this->success(
            new KurikulumStrukturResource($struktur),
            'Struktur kurikulum berhasil diperbarui.'
        );
    }

    /**
     * DELETE /v1/master-data/kurikulum/struktur/{ulid}
     */
    public function destroy(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $this->strukturService->hapus($schoolId, $ulid);

        return $this->success(message: 'Mata pelajaran dihapus dari struktur kurikulum.');
    }

    private function resolveSchoolId(): ?int
    {
        return app()->bound('current_school_id') ? app('current_school_id') : null;
    }
}
