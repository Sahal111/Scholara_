<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kurikulum\DaftarkanKurikulumRequest;
use App\Http\Requests\Kurikulum\StoreKurikulumRequest;
use App\Http\Requests\Kurikulum\UpdateKurikulumRequest;
use App\Http\Resources\KurikulumDetailResource;
use App\Http\Resources\KurikulumResource;
use App\Models\Kurikulum;
use App\Models\TahunAjaran;
use App\Services\KurikulumService;
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

    public function stats(): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $data = $this->kurikulumService->getStats($schoolId);

        return $this->success($data);
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
     * Hapus kurikulum custom. Gagal jika masih dipakai kelas atau mapel.
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

    /**
     * PATCH /v1/master-data/kurikulum/{ulid}/activate
     * Aktifkan kembali kurikulum yang sebelumnya dinonaktifkan.
     */
    public function activate(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $this->kurikulumService->activate($ulid, $schoolId);

        return $this->success(message: 'Kurikulum berhasil diaktifkan kembali.');
    }

    /**
     * GET /v1/master-data/kurikulum/trash
     * Daftar kurikulum yang sudah dihapus (recycle bin).
     */
    public function trash(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $data = $this->kurikulumService->trash($schoolId, $request->all());

        return $this->success(KurikulumResource::collection($data));
    }

    /**
     * PATCH /v1/master-data/kurikulum/{ulid}/restore
     * Pulihkan kurikulum dari recycle bin.
     */
    public function restore(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $kurikulum = $this->kurikulumService->restore($ulid, $schoolId);

        return $this->success(new KurikulumDetailResource($kurikulum), 'Kurikulum berhasil dipulihkan.');
    }

    /**
     * POST /v1/master-data/kurikulum/tahun-ajaran/daftarkan
     * Daftarkan kurikulum ke tahun ajaran sekolah.
     *
     * BUG 3 FIX: ganti inline $request->validate() → DaftarkanKurikulumRequest (FormRequest).
     * Input diterima sebagai ULID (bukan integer id), lalu di-resolve ke id di service.
     */
    public function daftarkanKeTahunAjaran(DaftarkanKurikulumRequest $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $validated = $request->validated();

        // Resolve ulid → integer id (konvensi Scholara: expose ULID, internal pakai id)
        $kurikulum = Kurikulum::availableForSchool($schoolId)
            ->where('ulid', $validated['kurikulum_ulid'])
            ->firstOrFail();

        $tahunAjaran = TahunAjaran::where('school_id', $schoolId)
            ->where('ulid', $validated['tahun_ajaran_ulid'])
            ->firstOrFail();

        $semesterId = null;
        if (!empty($validated['semester_ulid'])) {
            $semesterId = \App\Models\Semester::where('tahun_ajaran_id', $tahunAjaran->id)
                ->where('ulid', $validated['semester_ulid'])
                ->value('id');
        }

        $this->kurikulumService->daftarkanKeTahunAjaran($schoolId, [
            'kurikulum_id' => $kurikulum->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
            'semester_id' => $semesterId,
            'tingkat_kelas' => $validated['tingkat_kelas'] ?? null,
            'catatan' => $validated['catatan'] ?? null,
        ]);

        return $this->success(message: 'Kurikulum berhasil didaftarkan ke tahun ajaran.');
    }

    /**
     * GET /v1/master-data/kurikulum/tahun-ajaran/{tahunAjaran}
     * Daftar kurikulum yang berlaku di tahun ajaran tertentu.
     *
     * Parameter {tahunAjaran} diterima sebagai ULID (standar API Scholara).
     * Di-resolve ke integer PK sebelum diteruskan ke service.
     */
    public function kurikulumUntukTahunAjaran(string $tahunAjaran): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $tahunAjaranRecord = \App\Models\TahunAjaran::withoutGlobalScopes()
            ->where('ulid', $tahunAjaran)
            ->select('id')
            ->first();

        if ($tahunAjaranRecord === null) {
            return $this->notFound('Tahun ajaran tidak ditemukan.');
        }

        $data = $this->kurikulumService->kurikulumUntukTahunAjaran($schoolId, $tahunAjaranRecord->id);

        return $this->success($data);
    }

    private function resolveSchoolId(): ?int
    {
        return app()->bound('current_school_id') ? app('current_school_id') : null;
    }
}