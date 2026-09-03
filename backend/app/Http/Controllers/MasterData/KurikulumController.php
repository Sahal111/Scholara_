<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kurikulum\StoreKurikulumRequest;
use App\Http\Requests\Kurikulum\UpdateKurikulumRequest;
use App\Http\Resources\KurikulumDetailResource;
use App\Http\Resources\KurikulumResource;
use App\Services\Kurikulum\KurikulumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KurikulumController extends Controller
{
    public function __construct(
        private readonly KurikulumService $kurikulumService
    ) {
    }

    /**
     * GET /v1/master-data/kurikulum
     * Daftar kurikulum tersedia untuk sekolah ini (platform + custom).
     */
    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $kurikulums = $this->kurikulumService->availableForSchool($schoolId, $request->all());

        return $this->success(KurikulumResource::collection($kurikulums));
    }

    /**
     * GET /v1/master-data/kurikulum/dropdown
     * Dropdown ringan untuk pilihan kelas/mapel.
     */
    public function dropdown(): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $data = $this->kurikulumService->dropdownForSchool($schoolId);

        return $this->success($data);
    }

    /**
     * GET /v1/master-data/kurikulum/{ulid}
     * Detail kurikulum + komponen nilai.
     */
    public function show(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $kurikulum = $this->kurikulumService->findByUlid($ulid, $schoolId);

        return $this->success(new KurikulumDetailResource($kurikulum));
    }

    /**
     * POST /v1/master-data/kurikulum
     * Buat kurikulum custom untuk sekolah ini.
     */
    public function store(StoreKurikulumRequest $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $kurikulum = $this->kurikulumService->createForSchool($schoolId, $request->validated());

        return $this->created(new KurikulumDetailResource($kurikulum), 'Kurikulum berhasil ditambahkan.');
    }

    /**
     * PUT /v1/master-data/kurikulum/{ulid}
     * Update kurikulum custom milik sekolah.
     * Kurikulum platform (school_id NULL) tidak bisa diupdate dari sini.
     */
    public function update(UpdateKurikulumRequest $request, string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $kurikulum = $this->kurikulumService->updateForSchool($ulid, $schoolId, $request->validated());

        return $this->success(new KurikulumDetailResource($kurikulum), 'Kurikulum berhasil diperbarui.');
    }

    /**
     * DELETE /v1/master-data/kurikulum/{ulid}
     * Hapus kurikulum custom. Gagal jika masih dipakai kelas.
     */
    public function destroy(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $this->kurikulumService->delete($ulid, $schoolId);

        return $this->success(message: 'Kurikulum berhasil dihapus.');
    }

    /**
     * PATCH /v1/master-data/kurikulum/{ulid}/deactivate
     * Nonaktifkan kurikulum (soft — tidak hapus, tidak bisa dipakai kelas baru).
     */
    public function deactivate(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $this->kurikulumService->deactivate($ulid, $schoolId);

        return $this->success(message: 'Kurikulum berhasil dinonaktifkan.');
    }

    private function resolveSchoolId(): ?int
    {
        return app()->bound('current_school_id') ? app('current_school_id') : null;
    }
}