<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Http\Requests\Guru\StoreGuruRequest;
use App\Http\Requests\Guru\UpdateGuruRequest;
use App\Http\Resources\GuruResource;
use App\Models\Guru;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GuruProfileController extends Controller
{
    /**
     * Display a listing of teachers with filtering & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Guru::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhere('nik', 'like', "%{$search}%")
                    ->orWhere('nuptk', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status_aktif')) {
            $query->where('status_aktif', filter_var($request->status_aktif, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('jenis_ptk')) {
            $query->where('jenis_ptk', $request->jenis_ptk);
        }

        $perPage = (int) $request->get('per_page', 15);
        $gurus = $query->latest()->paginate($perPage);

        return $this->success(GuruResource::collection($gurus));
    }

    /**
     * Store a newly created teacher profile.
     */
    public function store(StoreGuruRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('foto-guru', 'public');
            $data['foto'] = $path;
        }

        $guru = Guru::create($data);

        return $this->created(new GuruResource($guru), 'Data guru berhasil ditambahkan.');
    }

    /**
     * Display the specified teacher profile.
     */
    public function show(string $nuptk): JsonResponse
    {
        $guru = Guru::with(['user', 'dokumens', 'pendidikans', 'keluarga'])
            ->where('nuptk', $nuptk)
            ->first();

        if (!$guru) {
            return $this->notFound('Data guru tidak ditemukan.');
        }

        return $this->success(new GuruResource($guru));
    }

    /**
     * Update the specified teacher profile.
     */
    public function update(UpdateGuruRequest $request, string $nuptk): JsonResponse
    {
        $guru = Guru::where('nuptk', $nuptk)->first();

        if (!$guru) {
            return $this->notFound('Data guru tidak ditemukan.');
        }

        $data = $request->validated();

        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('foto-guru', 'public');
            $data['foto'] = $path;
        }

        $guru->update($data);

        return $this->success(new GuruResource($guru), 'Data guru berhasil diperbarui.');
    }

    /**
     * Remove the specified teacher profile (soft delete).
     */
    public function destroy(string $id): JsonResponse
    {
        $guru = Guru::find($id) ?? Guru::where('nuptk', $id)->first();

        if (!$guru) {
            return $this->notFound('Data guru tidak ditemukan.');
        }

        $guru->delete();

        return $this->success(null, 'Data guru berhasil dihapus.');
    }

    /**
     * Force delete (permanent).
     */
    public function forceDelete(string $nuptk): JsonResponse
    {
        $guru = Guru::withTrashed()->where('nuptk', $nuptk)->first();

        if (!$guru) {
            return $this->notFound('Data guru tidak ditemukan.');
        }

        if ($guru->foto && Storage::disk('public')->exists($guru->foto)) {
            Storage::disk('public')->delete($guru->foto);
        }

        $guru->forceDelete();

        return $this->success(null, 'Data guru berhasil dihapus permanen.');
    }

    /**
     * Statistik ringkasan guru untuk dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $total = Guru::count();
        $aktif = Guru::where('status_aktif', true)->count();
        $nonAktif = Guru::where('status_aktif', false)->count();
        $terverifikasi = Guru::whereNotNull('verified_at')->count();

        $perJenisPtk = Guru::selectRaw('jenis_ptk, count(*) as total')
            ->groupBy('jenis_ptk')
            ->pluck('total', 'jenis_ptk');

        return $this->success([
            'total' => $total,
            'aktif' => $aktif,
            'non_aktif' => $nonAktif,
            'terverifikasi' => $terverifikasi,
            'per_jenis_ptk' => $perJenisPtk,
        ]);
    }

    /**
     * Dropdown list (id + nama) untuk select/autocomplete.
     */
    public function dropdown(Request $request): JsonResponse
    {
        $gurus = Guru::where('status_aktif', true)
            ->when($request->filled('search'), fn($q) => $q->where('nama', 'like', '%' . $request->search . '%'))
            ->select('id', 'nuptk', 'nama', 'jenis_ptk')
            ->orderBy('nama')
            ->limit(50)
            ->get();

        return $this->success($gurus);
    }

    /**
     * Guru yang perlu perhatian (non-aktif / belum verifikasi).
     */
    public function perhatianDetail(Request $request): JsonResponse
    {
        $gurus = Guru::where(function ($q) {
            $q->where('status_aktif', false)
                ->orWhereNull('verified_at');
        })
            ->select('id', 'nuptk', 'nama', 'jenis_ptk', 'status_aktif', 'verified_at')
            ->latest()
            ->paginate((int) $request->get('per_page', 15));

        return $this->success($gurus);
    }

    /**
     * Guru yang belum ada penugasan mengajar.
     */
    public function tanpaPenugasan(Request $request): JsonResponse
    {
        $gurus = Guru::where('status_aktif', true)
            ->doesntHave('jadwals')
            ->select('id', 'nuptk', 'nama', 'jenis_ptk')
            ->orderBy('nama')
            ->paginate((int) $request->get('per_page', 15));

        return $this->success($gurus);
    }

    /**
     * Aktivitas terkini (guru yang baru dibuat/diupdate).
     */
    public function aktivitasTerkini(Request $request): JsonResponse
    {
        $gurus = Guru::with('user:id,username,last_login_at')
            ->select('id', 'nuptk', 'nama', 'jenis_ptk', 'status_aktif', 'updated_at')
            ->latest('updated_at')
            ->limit(10)
            ->get();

        return $this->success($gurus);
    }

    /**
     * Daftar guru yang sudah di-soft delete (trash).
     */
    public function trash(Request $request): JsonResponse
    {
        $gurus = Guru::onlyTrashed()
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->search . '%')
                    ->orWhere('nuptk', 'like', '%' . $request->search . '%');
            })
            ->paginate((int) $request->get('per_page', 15));

        return $this->success($gurus);
    }

    /**
     * Upload/ganti foto guru.
     */
    public function uploadFoto(Request $request, string $nuptk): JsonResponse
    {
        $request->validate(['foto' => 'required|image|max:2048']);

        $guru = Guru::where('nuptk', $nuptk)->firstOrFail();

        if ($guru->foto && Storage::disk('public')->exists($guru->foto)) {
            Storage::disk('public')->delete($guru->foto);
        }

        $path = $request->file('foto')->store('foto-guru', 'public');
        $guru->update(['foto' => $path]);

        return $this->success(['foto' => $path], 'Foto berhasil diupload.');
    }

    /**
     * Koreksi NUPTK guru.
     */
    public function koreksiNuptk(Request $request, string $nuptk): JsonResponse
    {
        $request->validate([
            'nuptk_baru' => 'required|string|size:16|unique:gurus,nuptk',
        ]);

        $guru = Guru::where('nuptk', $nuptk)->firstOrFail();
        $guru->update(['nuptk' => $request->nuptk_baru]);

        return $this->success(new GuruResource($guru), 'NUPTK berhasil dikoreksi.');
    }

    /**
     * Restore guru dari trash.
     */
    public function restore(string $nuptk): JsonResponse
    {
        $guru = Guru::withTrashed()->where('nuptk', $nuptk)->firstOrFail();
        $guru->restore();

        return $this->success(new GuruResource($guru), 'Data guru berhasil dipulihkan.');
    }

    /**
     * Verifikasi data guru.
     */
    public function verifikasi(string $nuptk): JsonResponse
    {
        $guru = Guru::where('nuptk', $nuptk)->firstOrFail();
        $guru->update(['verified_at' => now()]);

        return $this->success(new GuruResource($guru), 'Data guru berhasil diverifikasi.');
    }

    /**
     * Batalkan verifikasi guru.
     */
    public function batalVerifikasi(string $nuptk): JsonResponse
    {
        $guru = Guru::where('nuptk', $nuptk)->firstOrFail();
        $guru->update(['verified_at' => null]);

        return $this->success(new GuruResource($guru), 'Verifikasi guru berhasil dibatalkan.');
    }
}