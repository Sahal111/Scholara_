<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Services\KurikulumCakupanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Laporan cakupan: struktur kurikulum vs penugasan guru (read-only).
 *
 * GET /v1/master-data/kurikulum/implementasi/{ulid}/cakupan
 *     ?semester_ulid=   (opsional; default: semester aktif / semester implementasi)
 *     &tingkat=         (opsional)
 *     &kelas_id=        (opsional; kelas belum punya ulid, mengikuti KelasResource)
 *
 * Aturan bisnis dilempar sebagai \DomainException → 422 (handler global).
 */
class KurikulumCakupanController extends Controller
{
    public function __construct(
        private readonly KurikulumCakupanService $cakupan
    ) {
    }

    public function index(Request $request, string $ulid): JsonResponse
    {
        $schoolId = app()->bound('current_school_id') ? app('current_school_id') : null;
        if ($schoolId === null) {
            return $this->error('Sekolah tidak teridentifikasi.', 'SCHOOL_NOT_FOUND', 400);
        }

        $v = $request->validate([
            'semester_ulid' => ['nullable', 'string', 'size:26'],
            'tingkat' => ['nullable', 'integer', 'between:1,13'],
            'kelas_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $implementasi = $this->cakupan->cariImplementasi($schoolId, $ulid);
        if (!$implementasi) {
            return $this->notFound('Implementasi kurikulum tidak ditemukan.');
        }

        $semesterId = null;
        if (!empty($v['semester_ulid'])) {
            $semesterId = $this->cakupan->idSemesterDariUlid($schoolId, $v['semester_ulid']);

            if ($semesterId === null) {
                return $this->notFound('Semester tidak ditemukan.');
            }
        }

        return $this->success($this->cakupan->laporan(
            $schoolId,
            $implementasi,
            $semesterId,
            isset($v['tingkat']) ? (int) $v['tingkat'] : null,
            isset($v['kelas_id']) ? (int) $v['kelas_id'] : null,
        ));
    }
}
