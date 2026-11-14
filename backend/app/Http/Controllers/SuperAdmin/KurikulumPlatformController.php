<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kurikulum\PlatformKurikulumRequest;
use App\Http\Resources\KurikulumResource;
use App\Services\KurikulumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KurikulumPlatformController extends Controller
{
    public function __construct(private readonly KurikulumService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return $this->success(KurikulumResource::collection($this->service->listPlatform($request->all())));
    }

    public function store(PlatformKurikulumRequest $request): JsonResponse
    {
        $kurikulum = $this->service->createPlatform($request->validated());

        return $this->created(new KurikulumResource($kurikulum), 'Kurikulum platform berhasil ditambahkan.');
    }

    public function update(PlatformKurikulumRequest $request, string $ulid): JsonResponse
    {
        $kurikulum = $this->service->updatePlatform($ulid, $request->validated());

        return $this->success(new KurikulumResource($kurikulum), 'Kurikulum platform berhasil diperbarui.');
    }

    public function deactivate(string $ulid): JsonResponse
    {
        $this->service->setAktifPlatform($ulid, false);

        return $this->success(message: 'Kurikulum platform dinonaktifkan.');
    }

    public function activate(string $ulid): JsonResponse
    {
        $this->service->setAktifPlatform($ulid, true);

        return $this->success(message: 'Kurikulum platform diaktifkan.');
    }

    public function destroy(string $ulid): JsonResponse
    {
        $this->service->deletePlatform($ulid);

        return $this->success(message: 'Kurikulum platform dihapus.');
    }
}