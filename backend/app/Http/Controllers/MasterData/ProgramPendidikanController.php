<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProgramPendidikan\StoreProgramPendidikanRequest;
use App\Http\Requests\ProgramPendidikan\UpdateProgramPendidikanRequest;
use App\Models\ProgramPendidikan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramPendidikanController extends Controller
{
    // ── Index — daftar flat dengan pagination ─────────────────────

    public function index(Request $request): JsonResponse
    {
        $data = ProgramPendidikan::query()
            ->with('parent:id,nama,kode,jenis')
            ->when(
                $request->search,
                fn($q) => $q
                    ->where('nama', 'like', "%{$request->search}%")
                    ->orWhere('kode', 'like', "%{$request->search}%")
            )
            ->when(
                $request->jenis,
                fn($q) => $q->where('jenis', $request->jenis)
            )
            ->when(
                $request->jenjang_sasaran,
                fn($q) => $q->where('jenjang_sasaran', $request->jenjang_sasaran)
            )
            ->when(
                $request->parent_id !== null && $request->parent_id !== '',
                fn($q) => $request->parent_id === 'null'
                ? $q->whereNull('parent_id')
                : $q->where('parent_id', $request->parent_id)
            )
            ->when(
                $request->is_active !== null && $request->is_active !== '',
                fn($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN))
            )
            ->withCount(['kelas', 'children'])
            ->orderByRaw('ISNULL(parent_id) DESC') // root dulu
            ->orderBy('nama')
            ->paginate((int) ($request->per_page ?? 15));

        return $this->success($data);
    }

    // ── Tree — hierarki lengkap untuk UI struktur ─────────────────

    /**
     * Kembalikan pohon program (hanya root dengan nested children).
     * Cocok untuk tampilan hierarki seperti:
     *   Teknik Komputer dan Informatika
     *     ├── Rekayasa Perangkat Lunak
     *     └── Teknik Komputer dan Jaringan
     */
    public function tree(Request $request): JsonResponse
    {
        $data = ProgramPendidikan::query()
            ->root()
            ->when(
                $request->is_active !== null && $request->is_active !== '',
                fn($q) =>
                $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN))
            )
            ->with('descendantsTree')
            ->withCount('kelas')
            ->orderBy('nama')
            ->get();

        return $this->success($data);
    }

    // ── Store ─────────────────────────────────────────────────────

    public function store(StoreProgramPendidikanRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $program = ProgramPendidikan::create([
            'parent_id' => $validated['parent_id'] ?? null,
            'nama' => $validated['nama'],
            'kode' => isset($validated['kode']) ? strtoupper($validated['kode']) : null,
            'jenis' => $validated['jenis'],
            'jenjang_sasaran' => $validated['jenjang_sasaran'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'is_active' => true,
        ]);

        return $this->created(
            $program->load('parent:id,nama,kode'),
            'Program pendidikan berhasil ditambahkan.'
        );
    }

    // ── Show ──────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $program = ProgramPendidikan::with([
            'parent:id,ulid,nama,kode,jenis',
            'children:id,ulid,parent_id,nama,kode,jenis,is_active',
            'children.children:id,ulid,parent_id,nama,kode,jenis,is_active', // 1 level lagi untuk SMK
        ])
            ->withCount(['kelas', 'children', 'mapels'])
            ->findOrFail($id);

        // Append label jenis ke response
        $program->append('jenis_label');

        return $this->success($program);
    }

    // ── Update ────────────────────────────────────────────────────

    public function update(UpdateProgramPendidikanRequest $request, int $id): JsonResponse
    {
        $program = ProgramPendidikan::findOrFail($id);
        $validated = $request->validated();

        // Guard: jangan izinkan circular reference (parent adalah descendant sendiri)
        if (isset($validated['parent_id']) && $validated['parent_id'] !== null) {
            if ($this->isDescendantOf($validated['parent_id'], $id)) {
                return $this->error(
                    'Program induk yang dipilih adalah turunan dari program ini. Tidak diizinkan (circular).',
                    'CIRCULAR_REFERENCE',
                    422
                );
            }
        }

        $program->update([
            'parent_id' => $validated['parent_id'] ?? null,
            'nama' => $validated['nama'],
            'kode' => isset($validated['kode']) ? strtoupper($validated['kode']) : null,
            'jenis' => $validated['jenis'],
            'jenjang_sasaran' => $validated['jenjang_sasaran'],
            'deskripsi' => $validated['deskripsi'] ?? $program->deskripsi,
            'is_active' => $validated['is_active'] ?? $program->is_active,
        ]);

        return $this->success(
            $program->fresh(['parent:id,nama,kode'])->append('jenis_label'),
            'Program pendidikan berhasil diperbarui.'
        );
    }

    // ── Destroy ───────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        $program = ProgramPendidikan::withCount(['kelas', 'children'])->findOrFail($id);

        if ($program->kelas_count > 0) {
            return $this->error(
                "Program masih digunakan oleh {$program->kelas_count} kelas. Pindahkan kelas terlebih dahulu.",
                'PROGRAM_HAS_KELAS',
                422
            );
        }

        if ($program->children_count > 0) {
            return $this->error(
                "Program masih memiliki {$program->children_count} sub-program. Hapus atau pindahkan sub-program terlebih dahulu.",
                'PROGRAM_HAS_CHILDREN',
                422
            );
        }

        $program->delete();

        return $this->success(null, 'Program pendidikan berhasil dihapus.');
    }

    // ── Dropdown — ringan untuk select/combobox ───────────────────

    /**
     * Flat list untuk dropdown pilih program di form kelas/mapel.
     * Query param: jenis, jenjang_sasaran
     */
    public function dropdown(Request $request): JsonResponse
    {
        $data = ProgramPendidikan::aktif()
            ->when($request->jenis, fn($q) => $q->where('jenis', $request->jenis))
            ->when(
                $request->jenjang_sasaran,
                fn($q) => $q->where(function ($q) use ($request) {
                    $q->where('jenjang_sasaran', $request->jenjang_sasaran)
                        ->orWhere('jenjang_sasaran', 'semua');
                })
            )
            ->orderByRaw('ISNULL(parent_id) DESC')
            ->orderBy('nama')
            ->get(['id', 'ulid', 'parent_id', 'nama', 'kode', 'jenis', 'jenjang_sasaran']);

        return $this->success($data);
    }

    // ── Helper ────────────────────────────────────────────────────

    /**
     * Cek apakah $candidateParentId adalah descendant dari $programId.
     * Digunakan untuk cegah circular reference saat update parent.
     */
    private function isDescendantOf(int $candidateParentId, int $programId): bool
    {
        $current = ProgramPendidikan::find($candidateParentId);

        while ($current !== null) {
            if ($current->id === $programId) {
                return true;
            }
            $current = $current->parent_id
                ? ProgramPendidikan::find($current->parent_id)
                : null;
        }

        return false;
    }
}