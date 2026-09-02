<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mapel\ImportMapelRequest;
use App\Http\Requests\Mapel\StoreMapelRequest;
use App\Http\Requests\Mapel\UpdateMapelRequest;
use App\Http\Resources\MasterData\MapelResource;
use App\Jobs\ProcessMapelImport;
use App\Services\Mapel\MapelService;
use App\Services\Excel\XlsxBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MasterDataMapelController extends Controller
{
    public function __construct(private MapelService $service)
    {
    }

    /* ── INDEX ───────────────────────────────────────────────── */
    public function index(Request $request): JsonResponse
    {
        $paginated = $this->service->paginate($request->only([
            'search',
            'kelompok',
            'tingkat',
            'is_active',
        ]));

        return $this->success(MapelResource::collection($paginated));
    }

    /* ── STORE ───────────────────────────────────────────────── */
    public function store(StoreMapelRequest $request): JsonResponse
    {
        $mapel = $this->service->store($request->validated());

        return $this->created(new MapelResource($mapel), 'Mata pelajaran berhasil ditambahkan.');
    }

    /* ── STATS ───────────────────────────────────────────────── */
    public function stats(): JsonResponse
    {
        return $this->success($this->service->getStats());
    }

    /* ── SHOW ────────────────────────────────────────────────── */
    public function show(string $ulid): JsonResponse
    {
        $mapel = $this->service->findByUlid($ulid);

        return $this->success(new MapelResource($mapel));
    }

    /* ── UPDATE ──────────────────────────────────────────────── */
    public function update(UpdateMapelRequest $request, string $ulid): JsonResponse
    {
        $mapel = $this->service->findByUlid($ulid);

        $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;
        $updated = $this->service->update($mapel, $request->validated(), $isActive);

        return $this->success(new MapelResource($updated), 'Mata pelajaran berhasil diperbarui.');
    }

    /* ── TOGGLE ACTIVE ───────────────────────────────────────── */
    public function toggleActive(string $ulid): JsonResponse
    {
        $mapel = $this->service->findByUlid($ulid);
        $updated = $this->service->toggleActive($mapel);

        return $this->success(new MapelResource($updated), 'Status berhasil diubah.');
    }

    /* ── DESTROY ─────────────────────────────────────────────── */
    public function destroy(string $ulid): JsonResponse
    {
        $mapel = $this->service->findByUlid($ulid);
        $this->service->delete($mapel);

        return $this->success(null, 'Mata pelajaran berhasil dihapus.');
    }

    /* ── DROPDOWN ────────────────────────────────────────────── */
    public function dropdown(): JsonResponse
    {
        return $this->success(MapelResource::collection($this->service->dropdown()));
    }

    /* ── EXPORT ──────────────────────────────────────────────── */
    public function export(Request $request): Response
    {
        $rows = $this->service->forExport($request->only(['kelompok', 'tingkat', 'is_active']));

        $headers = ['Kode', 'Nama Mata Pelajaran', 'Kelompok', 'Tingkat', 'Jam/Minggu', 'Kurikulum', 'Status'];
        $dataRows = $rows->map(fn($m) => [
            $m->kode,
            $m->nama_mapel,
            $m->kelompok,
            $m->tingkat ?? 'Semua',
            $m->jam_per_minggu,
            $m->kurikulum,
            $m->is_active ? 'Aktif' : 'Non-aktif',
        ])->toArray();

        $filename = 'master_mapel_' . now()->format('Ymd_His') . '.xlsx';
        $xlsx = XlsxBuilder::build($headers, $dataRows);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Content-Length' => strlen($xlsx),
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /* ── DOWNLOAD TEMPLATE ───────────────────────────────────── */
    public function downloadTemplate(): Response
    {
        $headers = ['kode', 'nama_mapel', 'kelompok', 'tingkat', 'jam_per_minggu', 'kurikulum'];
        $examples = [
            ['MTK', 'Matematika', 'A - Wajib', 'Semua', '4', 'Keduanya'],
            ['IPA', 'Ilmu Pengetahuan Alam', 'A - Wajib', '4,5,6', '3', 'Kurikulum Merdeka'],
            ['BTQ', 'Baca Tulis Quran', 'C - Muatan Lokal', '1,2,3', '2', 'Kurikulum 2013'],
            ['MAT7', 'Matematika SMP', 'A - Wajib', '7,8,9', '4', 'Keduanya'],
            ['FIS', 'Fisika', 'A - Wajib', '10,11,12', '4', 'Kurikulum Merdeka'],
            ['PJOK', 'Pendidikan Jasmani', 'B - Wajib', 'Semua', '3', 'Keduanya'],
        ];

        $xlsx = XlsxBuilder::build($headers, $examples);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="template_import_mapel.xlsx"',
            'Content-Length' => strlen($xlsx),
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /* ── IMPORT ──────────────────────────────────────────────── */
    public function import(ImportMapelRequest $request): JsonResponse
    {
        $path = $request->file('file')->store("schools/" . app('current_school_id') . "/imports/mapel", 'local');
        $schoolId = app('current_school_id');

        ProcessMapelImport::dispatch($path, $schoolId, auth()->id());

        return $this->success(
            ['queued' => true],
            'File sedang diproses di latar belakang. Silakan refresh halaman beberapa saat lagi.'
        );
    }
}