<?php

namespace App\Http\Controllers\MasterData;

use App\Enums\StatusImplementasiKurikulum;
use App\Http\Controllers\Controller;
use App\Services\KurikulumWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Workflow implementasi kurikulum: DRAFT → REVIEW → APPROVED → ACTIVE → COMPLETED.
 *
 * Permission dijaga di route (middleware). Aturan transisi & prasyarat ada di
 * KurikulumWorkflowService (\DomainException → 422 via handler global).
 *
 * Implementasi diidentifikasi lewat ULID (implementasi_ulid dari
 * GET /kurikulum/tahun-ajaran/{tahunAjaranId}).
 */
class KurikulumWorkflowController extends Controller
{
    public function __construct(
        private readonly KurikulumWorkflowService $workflow
    ) {
    }

    /**
     * GET /v1/master-data/kurikulum/implementasi/{ulid}
     * Status workflow + aksi yang tersedia untuk user yang sedang login.
     */
    public function show(Request $request, string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $detail = $this->workflow->detail($schoolId, $ulid);
        if ($detail === null) {
            return $this->notFound('Implementasi kurikulum tidak ditemukan.');
        }

        $detail['aksi_tersedia'] = $this->workflow->aksiTersedia(
            StatusImplementasiKurikulum::dari($detail['status']),
            $request->user()
        );

        return $this->success($detail);
    }

    /** PATCH /kurikulum/implementasi/{ulid}/ajukan-review — Wakasek */
    public function ajukanReview(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        return $this->success(
            $this->workflow->ajukanReview($schoolId, $ulid),
            'Struktur kurikulum diajukan untuk direview kepala sekolah.'
        );
    }

    /** PATCH /kurikulum/implementasi/{ulid}/setujui — Kepsek */
    public function setujui(Request $request, string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $v = $request->validate([
            'catatan' => ['nullable', 'string', 'max:500'],
        ]);

        return $this->success(
            $this->workflow->setujui($schoolId, $ulid, $v['catatan'] ?? null),
            'Struktur kurikulum disetujui.'
        );
    }

    /** PATCH /kurikulum/implementasi/{ulid}/tolak — Kepsek (catatan wajib) */
    public function tolak(Request $request, string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $v = $request->validate([
            'catatan' => ['required', 'string', 'max:500'],
        ], [
            'catatan.required' => 'Catatan alasan penolakan wajib diisi.',
        ]);

        return $this->success(
            $this->workflow->tolak($schoolId, $ulid, $v['catatan']),
            'Struktur kurikulum dikembalikan ke draft. Wakasek dapat memperbaiki dan mengajukan ulang.'
        );
    }

    /** PATCH /kurikulum/implementasi/{ulid}/aktifkan — Kepsek */
    public function aktifkan(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        return $this->success(
            $this->workflow->aktifkan($schoolId, $ulid),
            'Struktur kurikulum diaktifkan.'
        );
    }

    /** PATCH /kurikulum/implementasi/{ulid}/selesaikan — Wakasek */
    public function selesaikan(string $ulid): JsonResponse
    {
        $schoolId = $this->resolveSchoolId();
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        return $this->success(
            $this->workflow->selesaikan($schoolId, $ulid),
            'Struktur kurikulum diselesaikan.'
        );
    }

    private function resolveSchoolId(): ?int
    {
        return app()->bound('current_school_id') ? app('current_school_id') : null;
    }
}
