<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\TahunAjaran\AktifkanSemesterRequest as SetSemesterAktifRequest;
use App\Http\Requests\TahunAjaran\ArsipTahunAjaranRequest;
use App\Http\Requests\TahunAjaran\StoreTahunAjaranRequest;
use App\Http\Requests\TahunAjaran\UpdateTahunAjaranRequest;
use App\Models\Absensi;
use App\Models\ActivityLog;
use App\Models\Kelas;
use App\Models\RiwayatKelas;
use App\Models\Semester;
use App\Models\PlotGuruMapel;
use App\Models\KalenderAkademik;
use App\Models\UserWaliKelas;
use App\Models\TahunAjaran;
use App\Services\TahunAjaranService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TahunAjaranController extends Controller
{
    public function __construct(private readonly TahunAjaranService $service)
    {
    }

    /**
     * List semua tahun ajaran yang aktif (belum diarsipkan, belum dihapus).
     */
    public function index(): JsonResponse
    {
        $data = TahunAjaran::with('semesters')
            ->where('is_archived', false)
            ->orderByDesc('tahun')
            ->get();

        return $this->success($data);
    }

    public function show(int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::with('semesters')->findOrFail($id);

        return $this->success($this->service->buildDetail($tahunAjaran));
    }

    public function store(StoreTahunAjaranRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            if ($request->is_active) {
                TahunAjaran::query()->update(['is_active' => false]);
            }

            $tahunAjaran = TahunAjaran::create([
                'tahun' => $request->tahun,
                'is_active' => $request->is_active ?? false,
            ]);

            if ($request->buat_semester) {
                if ($request->semester_aktif) {
                    Semester::query()->update(['is_active' => false]);
                }

                $schoolId = $tahunAjaran->school_id;

                Semester::create([
                    'school_id' => $schoolId,
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama' => 'Ganjil',
                    'tgl_mulai' => $request->semester_ganjil_mulai,
                    'tgl_selesai' => $request->semester_ganjil_selesai,
                    'is_active' => $request->is_active && $request->semester_aktif === 'Ganjil',
                ]);

                Semester::create([
                    'school_id' => $schoolId,
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama' => 'Genap',
                    'tgl_mulai' => $request->semester_genap_mulai,
                    'tgl_selesai' => $request->semester_genap_selesai,
                    'is_active' => $request->is_active && $request->semester_aktif === 'Genap',
                ]);
            }

            DB::commit();

            ActivityLog::log(
                'create',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Membuat tahun ajaran {$tahunAjaran->tahun}" . ($request->buat_semester ? ' beserta semester.' : '.'),
            );

            return $this->created(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil ditambahkan.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public function update(UpdateTahunAjaranRequest $request, int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        Gate::authorize('manage', $tahunAjaran);

        DB::beginTransaction();
        try {
            if ($request->is_active && !$tahunAjaran->is_active) {
                TahunAjaran::query()->update(['is_active' => false]);
            }

            $tahunAjaran->update([
                'tahun' => $request->tahun,
                'is_active' => $request->is_active ?? $tahunAjaran->is_active,
            ]);

            if ($request->buat_semester) {
                $schoolId = $tahunAjaran->school_id;

                $semGanjilLama = Semester::where('school_id', $schoolId)
                    ->where('tahun_ajaran_id', $tahunAjaran->id)
                    ->where('nama', 'Ganjil')
                    ->withTrashed()
                    ->first();

                $semGenapLama = Semester::where('school_id', $schoolId)
                    ->where('tahun_ajaran_id', $tahunAjaran->id)
                    ->where('nama', 'Genap')
                    ->withTrashed()
                    ->first();

                if ($request->has('semester_aktif') && $request->semester_aktif && $request->is_active) {
                    Semester::query()->update(['is_active' => false]);
                }

                if ($request->has('semester_ganjil_mulai') || $request->has('semester_ganjil_selesai') || !$semGanjilLama) {
                    Semester::where('school_id', $schoolId)->updateOrCreate(
                        ['tahun_ajaran_id' => $tahunAjaran->id, 'nama' => 'Ganjil'],
                        [
                            'school_id' => $schoolId,
                            'tgl_mulai' => $request->has('semester_ganjil_mulai') ? $request->semester_ganjil_mulai : $semGanjilLama?->tgl_mulai,
                            'tgl_selesai' => $request->has('semester_ganjil_selesai') ? $request->semester_ganjil_selesai : $semGanjilLama?->tgl_selesai,
                            'is_active' => $request->has('semester_aktif') && $request->is_active
                                ? ($request->semester_aktif === 'Ganjil')
                                : ($semGanjilLama?->is_active ?? false),
                            'deleted_at' => null,
                        ]
                    );
                }

                if ($request->has('semester_genap_mulai') || $request->has('semester_genap_selesai') || !$semGenapLama) {
                    Semester::where('school_id', $schoolId)->updateOrCreate(
                        ['tahun_ajaran_id' => $tahunAjaran->id, 'nama' => 'Genap'],
                        [
                            'school_id' => $schoolId,
                            'tgl_mulai' => $request->has('semester_genap_mulai') ? $request->semester_genap_mulai : $semGenapLama?->tgl_mulai,
                            'tgl_selesai' => $request->has('semester_genap_selesai') ? $request->semester_genap_selesai : $semGenapLama?->tgl_selesai,
                            'is_active' => $request->has('semester_aktif') && $request->is_active
                                ? ($request->semester_aktif === 'Genap')
                                : ($semGenapLama?->is_active ?? false),
                            'deleted_at' => null,
                        ]
                    );
                }
            }

            DB::commit();

            ActivityLog::log(
                'update',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Memperbarui tahun ajaran {$tahunAjaran->tahun}" . ($request->buat_semester ? ' dan semester.' : '.'),
            );

            return $this->success(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil diperbarui.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public function setAktif(int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        Gate::authorize('manage', $tahunAjaran);

        $taIds = TahunAjaran::pluck('id');
        TahunAjaran::whereIn('id', $taIds)->update(['is_active' => false]);
        Semester::whereIn('tahun_ajaran_id', $taIds)->update(['is_active' => false]);
        $tahunAjaran->update(['is_active' => true]);

        Semester::where('tahun_ajaran_id', $id)
            ->where('nama', 'Ganjil')
            ->update(['is_active' => true]);

        ActivityLog::log('set_aktif', 'tahun_ajaran', $id, "Mengaktifkan tahun ajaran {$tahunAjaran->tahun}.");

        return $this->success(
            $tahunAjaran->load('semesters'),
            'Tahun ajaran aktif berhasil diubah.'
        );
    }

    public function setSemesterAktif(SetSemesterAktifRequest $request, int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        Gate::authorize('manage', $tahunAjaran);

        if (!$tahunAjaran->is_active) {
            return $this->error(
                'Aktifkan tahun ajaran ini terlebih dahulu.',
                'VALIDATION_ERROR',
                422
            );
        }

        Semester::where('tahun_ajaran_id', $id)->update(['is_active' => false]);
        Semester::where('tahun_ajaran_id', $id)
            ->where('nama', $request->semester_nama)
            ->update(['is_active' => true]);

        ActivityLog::log(
            'set_semester_aktif',
            'tahun_ajaran',
            $id,
            "Mengaktifkan Semester {$request->semester_nama} pada tahun ajaran {$tahunAjaran->tahun}.",
        );

        return $this->success(
            $tahunAjaran->load('semesters'),
            "Semester {$request->semester_nama} berhasil diaktifkan."
        );
    }

    /**
     * Arsipkan tahun ajaran (periode selesai → arsip historis).
     * Berbeda dengan delete: data tetap ada, hanya ditandai selesai.
     */
    public function arsip(ArsipTahunAjaranRequest $request, int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        Gate::authorize('manage', $tahunAjaran);

        if ($tahunAjaran->is_active) {
            return $this->error(
                'Tahun ajaran aktif tidak dapat diarsipkan. Nonaktifkan terlebih dahulu.',
                'CONFLICT',
                422
            );
        }

        if ($tahunAjaran->is_archived) {
            return $this->error(
                'Tahun ajaran ini sudah diarsipkan.',
                'CONFLICT',
                422
            );
        }

        DB::beginTransaction();
        try {
            // Nonaktifkan semua semester milik TA ini
            Semester::where('tahun_ajaran_id', $id)->update(['is_active' => false]);

            $tahunAjaran->update([
                'is_archived' => true,
                'archived_at' => now(),
            ]);

            $catatan = $request->catatan
                ? " Catatan: {$request->catatan}"
                : '';

            ActivityLog::log(
                'arsip',
                'tahun_ajaran',
                $id,
                "Mengarsipkan tahun ajaran {$tahunAjaran->tahun}.{$catatan}",
            );

            DB::commit();

            return $this->success(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil diarsipkan.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal mengarsipkan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * Keluarkan tahun ajaran dari arsip → kembali ke daftar aktif (tidak otomatis aktif).
     */
    public function unarsip(int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        Gate::authorize('manage', $tahunAjaran);

        if (!$tahunAjaran->is_archived) {
            return $this->error(
                'Tahun ajaran ini tidak sedang diarsipkan.',
                'CONFLICT',
                422
            );
        }

        DB::beginTransaction();
        try {
            $tahunAjaran->update([
                'is_archived' => false,
                'archived_at' => null,
            ]);

            ActivityLog::log(
                'unarsip',
                'tahun_ajaran',
                $id,
                "Mengeluarkan tahun ajaran {$tahunAjaran->tahun} dari arsip.",
            );

            DB::commit();

            return $this->success(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil dikeluarkan dari arsip.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal mengeluarkan dari arsip: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * Daftar tahun ajaran yang diarsipkan (historis).
     */
    public function arsipList(): JsonResponse
    {
        $data = TahunAjaran::with('semesters')
            ->where('is_archived', true)
            ->orderByDesc('archived_at')
            ->get();

        return $this->success($data);
    }

    public function destroy(int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        Gate::authorize('manage', $tahunAjaran);

        if ($tahunAjaran->is_active) {
            return $this->error(
                'Tahun ajaran aktif tidak dapat dihapus. Nonaktifkan terlebih dahulu.',
                'CONFLICT',
                422
            );
        }

        if ($tahunAjaran->is_archived) {
            return $this->error(
                'Tahun ajaran yang diarsipkan tidak dapat dihapus langsung. Keluarkan dari arsip terlebih dahulu jika ingin menghapus.',
                'CONFLICT',
                422
            );
        }

        DB::beginTransaction();
        try {
            $tahunAjaran->semesters()->delete();
            $tahunAjaran->delete();

            ActivityLog::log('delete', 'tahun_ajaran', $id, "Memindahkan tahun ajaran {$tahunAjaran->tahun} ke recycle bin.");

            DB::commit();

            return $this->success(null, 'Tahun ajaran dipindahkan ke recycle bin.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal menghapus tahun ajaran: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public function trash(): JsonResponse
    {
        $data = TahunAjaran::onlyTrashed()
            ->with(['semesters' => fn($q) => $q->withTrashed()])
            ->orderByDesc('deleted_at')
            ->get();

        return $this->success($data);
    }

    public function restore(int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::onlyTrashed()->findOrFail($id);
        Gate::authorize('manage', $tahunAjaran);

        DB::beginTransaction();
        try {
            $tahunAjaran->restore();
            $tahunAjaran->semesters()->withTrashed()->restore();

            ActivityLog::log('restore', 'tahun_ajaran', $id, "Memulihkan tahun ajaran {$tahunAjaran->tahun} dari recycle bin.");

            DB::commit();

            return $this->success(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil dipulihkan.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal memulihkan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public function forceDelete(int $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::onlyTrashed()->findOrFail($id);
        Gate::authorize('forceDelete', $tahunAjaran);

        $blockers = [
            'kelas' => Kelas::withTrashed()->where('tahun_ajaran_id', $id)->exists(),
            'plot_guru' => PlotGuruMapel::where('tahun_ajaran_id', $id)->exists(),
            'riwayat' => RiwayatKelas::where('tahun_ajaran_id', $id)->exists(),
            'absensi' => Absensi::where('tahun_ajaran_id', $id)->exists(),
            'kalender' => KalenderAkademik::where('tahun_ajaran_id', $id)->exists(),
            'wali_kelas' => UserWaliKelas::where('tahun_ajaran_id', $id)->exists(),
        ];

        if (in_array(true, $blockers, true)) {
            return $this->error(
                'Tidak dapat dihapus permanen — masih ada data akademik yang terikat (kelas, absensi, kalender, dll).',
                'CONFLICT',
                422
            );
        }

        DB::beginTransaction();
        try {
            $tahunAjaran->semesters()->withTrashed()->forceDelete();
            $tahunAjaran->forceDelete();

            ActivityLog::log('force_delete', 'tahun_ajaran', $id, "Menghapus permanen tahun ajaran {$tahunAjaran->tahun}.");

            DB::commit();

            return $this->success(null, 'Tahun ajaran dihapus secara permanen.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal menghapus permanen: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }
}