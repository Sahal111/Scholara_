<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Jurusan\StoreJurusanRequest;
use App\Http\Requests\Jurusan\UpdateJurusanRequest;
use App\Models\Jurusan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JurusanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $jurusans = Jurusan::query()
            ->when($request->search, fn($q) => $q
                ->where('nama', 'like', "%{$request->search}%")
                ->orWhere('kode', 'like', "%{$request->search}%"))
            ->when(
                $request->is_active !== null && $request->is_active !== '',
                fn($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN))
            )
            ->withCount(['kelas', 'mapels'])
            ->orderBy('nama')
            ->paginate((int) ($request->per_page ?? 15));

        return $this->success($jurusans);
    }

    public function store(StoreJurusanRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $jurusan = Jurusan::create([
            'nama' => $validated['nama'],
            'kode' => strtoupper($validated['kode']),
            'deskripsi' => $validated['deskripsi'] ?? null,
            'tingkat_berlaku' => $this->parseTingkat($validated['tingkat_berlaku'] ?? null),
            'is_active' => true,
        ]);

        return $this->created($jurusan, 'Jurusan berhasil ditambahkan.');
    }

    public function show(int $id): JsonResponse
    {
        $jurusan = Jurusan::withCount(['kelas', 'mapels'])->findOrFail($id);

        return $this->success($jurusan);
    }

    public function update(UpdateJurusanRequest $request, int $id): JsonResponse
    {
        $jurusan = Jurusan::findOrFail($id);
        $validated = $request->validated();

        $jurusan->update([
            'nama' => $validated['nama'],
            'kode' => strtoupper($validated['kode']),
            'deskripsi' => $validated['deskripsi'] ?? $jurusan->deskripsi,
            'tingkat_berlaku' => $this->parseTingkat($validated['tingkat_berlaku'] ?? null),
            'is_active' => $validated['is_active'] ?? $jurusan->is_active,
        ]);

        return $this->success($jurusan->fresh(), 'Jurusan berhasil diperbarui.');
    }

    public function destroy(int $id): JsonResponse
    {
        $jurusan = Jurusan::withCount('kelas')->findOrFail($id);

        // Cegah hapus jurusan yang masih dipakai kelas aktif
        if ($jurusan->kelas_count > 0) {
            return $this->error(
                'Jurusan masih digunakan oleh ' . $jurusan->kelas_count . ' kelas. Pindahkan kelas terlebih dahulu.',
                'JURUSAN_IN_USE',
                422
            );
        }

        $jurusan->delete();

        return $this->success(null, 'Jurusan berhasil dihapus.');
    }

    public function dropdown(): JsonResponse
    {
        $data = Jurusan::aktif()
            ->orderBy('nama')
            ->get(['id', 'nama', 'kode', 'tingkat_berlaku']);

        return $this->success($data);
    }

    // ── Helper ───────────────────────────────────────────────────

    /**
     * Konversi array tingkat → CSV string.
     * ['10','11','12'] → "10,11,12"
     * null / kosong    → null (berlaku untuk semua tingkat)
     */
    private function parseTingkat(?array $tingkat): ?string
    {
        if (empty($tingkat)) {
            return null;
        }

        $valid = array_filter(
            array_map('trim', $tingkat),
            fn($t) => in_array($t, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
        );

        return empty($valid) ? null : implode(',', array_values($valid));
    }
}