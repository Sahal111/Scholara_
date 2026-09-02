<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProgramPendidikan\StoreProgramPendidikanRequest;
use App\Http\Requests\ProgramPendidikan\UpdateProgramPendidikanRequest;
use App\Http\Resources\ProgramPendidikanResource;
use App\Models\ProgramPendidikan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramPendidikanController extends Controller
{
    // ── Index — daftar flat dengan pagination ─────────────────────

    public function index(Request $request): JsonResponse
    {
        $data = ProgramPendidikan::query()
            ->with('parent:id,ulid,nama,kode,jenis')
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
            ->withCount(['kelas', 'children', 'siswas'])
            ->orderByRaw('ISNULL(parent_id) DESC') // root dulu
            ->orderBy('nama')
            ->paginate((int) ($request->per_page ?? 15));

        return $this->success(ProgramPendidikanResource::collection($data));
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
        $filterActive = $request->is_active !== null && $request->is_active !== ''
            ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)
            : null;

        // Resolve school_id aktif untuk isolasi tenant yang eksplisit
        // SchoolScope global sudah handle query utama, tapi kita explicit
        // di setiap level eager load 'descendantsTree' agar tidak bocor.
        $schoolId = app()->bound('current_school_id') ? app('current_school_id') : null;
        $schoolId ??= auth('sanctum')->user()?->school_id;

        // PENTING: eager load closure di Laravel hanya mengandalkan SIDE EFFECT
        // pada $q, bukan return value. Semua modifikasi harus langsung ke $q.
        $buildDescendantQuery = function ($q) use ($filterActive, $schoolId, &$buildDescendantQuery): void {
            if ($filterActive !== null) {
                $q->where('is_active', $filterActive);
            }
            if ($schoolId) {
                $q->where('school_id', $schoolId);
            }
            $q->with(['descendantsTree' => $buildDescendantQuery]);
        };

        $data = ProgramPendidikan::query()
            ->root()
            ->when($filterActive !== null, fn($q) => $q->where('is_active', $filterActive))
            ->with(['descendantsTree' => $buildDescendantQuery])
            ->withCount(['kelas', 'siswas'])
            ->orderBy('nama')
            ->get();

        return $this->success(ProgramPendidikanResource::collection($data));
    }

    // ── Store ─────────────────────────────────────────────────────

    public function store(StoreProgramPendidikanRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // parent_id dikirim sebagai ULID dari frontend — resolve ke integer PK
        $parentId = null;
        if (!empty($validated['parent_id'])) {
            $parentId = ProgramPendidikan::where('ulid', $validated['parent_id'])->value('id');
        }

        $program = ProgramPendidikan::create([
            'parent_id' => $parentId,
            'nama' => $validated['nama'],
            'kode' => isset($validated['kode']) ? strtoupper($validated['kode']) : null,
            'jenis' => $validated['jenis'],
            'jenjang_sasaran' => $validated['jenjang_sasaran'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'is_active' => true,
        ]);

        return $this->created(
            new ProgramPendidikanResource($program->load('parent:id,ulid,nama,kode,jenis')),
            'Program pendidikan berhasil ditambahkan.'
        );
    }

    // ── Show ──────────────────────────────────────────────────────

    public function show(string $ulid): JsonResponse
    {
        $program = ProgramPendidikan::with([
            'parent:id,ulid,nama,kode,jenis',
            'children:id,ulid,parent_id,nama,kode,jenis,is_active',
            'children.children:id,ulid,parent_id,nama,kode,jenis,is_active',
        ])
            ->withCount(['kelas', 'children', 'mapels'])
            ->where('ulid', $ulid)
            ->firstOrFail();

        $this->authorize('view', $program);

        return $this->success(new ProgramPendidikanResource($program));
    }

    // ── Update ────────────────────────────────────────────────────

    public function update(UpdateProgramPendidikanRequest $request, string $ulid): JsonResponse
    {
        $program = ProgramPendidikan::where('ulid', $ulid)->firstOrFail();

        $this->authorize('update', $program);
        $validated = $request->validated();

        // parent_id dikirim sebagai ULID dari frontend — resolve ke integer PK
        $parentId = null;
        if (!empty($validated['parent_id'])) {
            $parentId = ProgramPendidikan::where('ulid', $validated['parent_id'])->value('id');
        }

        // Guard: jangan izinkan circular reference (parent adalah descendant sendiri)
        if ($parentId !== null) {
            if ($this->isDescendantOf($parentId, $program->id)) {
                return $this->error(
                    'Program induk yang dipilih adalah turunan dari program ini. Tidak diizinkan (circular).',
                    'CIRCULAR_REFERENCE',
                    422
                );
            }
        }

        $program->update([
            'parent_id' => $parentId,
            'nama' => $validated['nama'],
            'kode' => isset($validated['kode']) ? strtoupper($validated['kode']) : null,
            'jenis' => $validated['jenis'],
            'jenjang_sasaran' => $validated['jenjang_sasaran'],
            'deskripsi' => $validated['deskripsi'] ?? $program->deskripsi,
            'is_active' => $validated['is_active'] ?? $program->is_active,
        ]);

        return $this->success(
            new ProgramPendidikanResource($program->fresh(['parent:id,ulid,nama,kode,jenis'])),
            'Program pendidikan berhasil diperbarui.'
        );
    }

    // ── Destroy ───────────────────────────────────────────────────

    public function destroy(string $ulid): JsonResponse
    {
        $program = ProgramPendidikan::withCount(['kelas', 'children'])
            ->where('ulid', $ulid)
            ->firstOrFail();

        $this->authorize('delete', $program);

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

    // ── Toggle Active ─────────────────────────────────────────────

    /**
     * Toggle status aktif/nonaktif program.
     * Dipisah dari update() agar intent jelas dan audit trail lebih granular.
     */
    public function toggleActive(string $ulid): JsonResponse
    {
        $program = ProgramPendidikan::where('ulid', $ulid)->firstOrFail();

        $this->authorize('update', $program);

        $program->update(['is_active' => !$program->is_active]);

        $status = $program->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return $this->success(
            new ProgramPendidikanResource($program),
            "Program pendidikan berhasil {$status}."
        );
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

        // Mapping ringan — tidak pakai Resource penuh agar tidak trigger extra queries
        $mapped = $data->map(fn($p) => [
            'ulid' => $p->ulid,
            'parent_ulid' => null, // akan di-resolve jika diperlukan; dropdown tidak butuh parent ref
            'nama' => $p->nama,
            'kode' => $p->kode,
            'jenis' => $p->jenis,
            'jenjang_sasaran' => $p->jenjang_sasaran,
        ]);

        return $this->success($mapped);
    }

    // ── Recycle Bin ───────────────────────────────────────────────

    /**
     * Daftar program yang sudah di-soft delete (recycle bin).
     * Hanya tampilkan milik sekolah aktif — SchoolScope tetap berlaku
     * pada onlyTrashed() query.
     */
    public function trash(Request $request): JsonResponse
    {
        $data = ProgramPendidikan::onlyTrashed()
            ->with('parent')
            ->withCount(['kelas', 'children'])
            ->orderByDesc('deleted_at')
            ->get();

        return $this->success(ProgramPendidikanResource::collection($data));
    }

    /**
     * Pulihkan satu program dari recycle bin.
     * Guard: tidak boleh restore jika parent-nya masih di recycle bin.
     */
    public function restore(string $ulid): JsonResponse
    {
        $program = ProgramPendidikan::onlyTrashed()
            ->where('ulid', $ulid)
            ->firstOrFail();

        $this->authorize('restore', $program);

        // Cegah restore jika parent sudah dihapus dan belum dipulihkan
        if ($program->parent_id !== null) {
            $parentExists = ProgramPendidikan::withoutTrashed()
                ->where('id', $program->parent_id)
                ->exists();

            if (!$parentExists) {
                return $this->error(
                    'Program induk sudah dihapus. Pulihkan program induk terlebih dahulu sebelum memulihkan program ini.',
                    'PARENT_TRASHED',
                    422
                );
            }
        }

        $program->restore();

        return $this->success(
            new ProgramPendidikanResource($program->fresh('parent')),
            'Program pendidikan berhasil dipulihkan.'
        );
    }

    /**
     * Hapus permanen dari database.
     * Blokir jika masih ada children (aktif maupun di trash) atau kelas.
     */
    public function forceDelete(string $ulid): JsonResponse
    {
        $program = ProgramPendidikan::onlyTrashed()
            ->where('ulid', $ulid)
            ->firstOrFail();

        $this->authorize('forceDelete', $program);

        // Cek apakah masih punya children (aktif maupun di-trash)
        $hasChildren = ProgramPendidikan::withTrashed()
            ->where('parent_id', $program->id)
            ->exists();

        if ($hasChildren) {
            return $this->error(
                'Tidak dapat dihapus permanen — program ini masih memiliki sub-program (aktif atau di recycle bin). Hapus atau pulihkan sub-program terlebih dahulu.',
                'PROGRAM_HAS_CHILDREN',
                422
            );
        }

        // Cek apakah masih dipakai kelas (termasuk yang soft-deleted)
        $kelasCount = \App\Models\Kelas::withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)
            ->where('program_pendidikan_id', $program->id)
            ->count();

        if ($kelasCount > 0) {
            return $this->error(
                "Tidak dapat dihapus permanen — program masih digunakan oleh {$kelasCount} kelas.",
                'PROGRAM_HAS_KELAS',
                422
            );
        }

        $program->forceDelete();

        return $this->success(null, 'Program pendidikan dihapus secara permanen.');
    }

    // ── Helper ────────────────────────────────────────────────────

    /**
     * Cek apakah $candidateParentId adalah descendant dari $programId.
     * Digunakan untuk cegah circular reference saat update parent.
     *
     * Load semua parent_id sekolah dalam 1 query, traverse in-memory
     * untuk menghindari N+1 (sebelumnya: 1 query per node).
     */
    private function isDescendantOf(int $candidateParentId, int $programId): bool
    {
        // 1 query — ambil map id → parent_id untuk seluruh sekolah
        /** @var array<int, int|null> $parentMap */
        $parentMap = ProgramPendidikan::pluck('parent_id', 'id')->all();

        $current = $candidateParentId;

        while ($current !== null) {
            if ($current === $programId) {
                return true;
            }
            $current = $parentMap[$current] ?? null;
        }

        return false;
    }
}