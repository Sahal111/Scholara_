<?php

namespace App\Http\Controllers\MasterData;

use App\Enums\StatusSemester;
use App\Enums\StatusTahunAjaran;
use App\Http\Controllers\Controller;
use App\Http\Requests\TahunAjaran\AktifkanSemesterRequest as SetSemesterAktifRequest;
use App\Http\Requests\TahunAjaran\ArsipTahunAjaranRequest;
use App\Http\Requests\TahunAjaran\StoreTahunAjaranRequest;
use App\Http\Requests\TahunAjaran\UpdateTahunAjaranRequest;
use App\Models\Absensi;
use App\Models\ActivityLog;
use App\Models\Kelas;
use App\Models\KalenderAkademik;
use App\Models\PlotGuruMapel;
use App\Models\RiwayatKelas;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\UserWaliKelas;
use App\Services\TahunAjaranService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TahunAjaranController extends Controller
{
    public function __construct(private readonly TahunAjaranService $service)
    {
    }

    // ── READ ─────────────────────────────────────────────────────────────────

    public function index(): JsonResponse
    {
        $data = TahunAjaran::with('semesters')
            ->whereNotIn('status', [StatusTahunAjaran::ARCHIVED->value])
            ->orderByDesc('tahun')
            ->paginate(request()->integer('per_page', 15));

        return $this->success($data);
    }

    public function show(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::with('semesters')->where('ulid', $ulid)->firstOrFail();

        return $this->success($this->service->buildDetail($tahunAjaran));
    }

    /**
     * Tahun ajaran yang sedang ACTIVE — endpoint publik untuk semua role sekolah.
     * Dipakai Guru & Wali Kelas sebagai referensi periode aktif di absensi/nilai/LMS.
     */
    public function aktif(): JsonResponse
    {
        $tahunAjaran = TahunAjaran::with('semesters')
            ->where('status', StatusTahunAjaran::ACTIVE->value)
            ->first();

        if (!$tahunAjaran) {
            return $this->error('Tidak ada tahun ajaran aktif saat ini.', 'NOT_FOUND', 404);
        }

        return $this->success($tahunAjaran);
    }

    /**
     * Semester aktif dari tahun ajaran yang sedang ACTIVE.
     * Dipakai modul absensi, penilaian, dan LMS sebagai referensi periode.
     */
    public function semesterAktif(): JsonResponse
    {
        $semester = Semester::whereHas(
            'tahunAjaran',
            fn($q) =>
                $q->where('status', StatusTahunAjaran::ACTIVE->value)
        )
            ->where('is_active', true)
            ->first();

        if (!$semester) {
            return $this->error('Tidak ada semester aktif saat ini.', 'NOT_FOUND', 404);
        }

        return $this->success($semester);
    }

    public function arsipList(): JsonResponse
    {
        $data = TahunAjaran::with('semesters')
            ->status(StatusTahunAjaran::ARCHIVED)
            ->orderByDesc('archived_at')
            ->paginate(request()->integer('per_page', 15));

        return $this->success($data);
    }

    public function trash(): JsonResponse
    {
        $data = TahunAjaran::onlyTrashed()
            ->with(['semesters' => fn($q) => $q->withTrashed()])
            ->orderByDesc('deleted_at')
            ->paginate(request()->integer('per_page', 15));

        return $this->success($data);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    public function store(StoreTahunAjaranRequest $request): JsonResponse
    {
        Gate::authorize('create', TahunAjaran::class);

        $schoolId = app('current_school_id');

        DB::beginTransaction();
        try {
            // Operator hanya bisa buat DRAFT — tidak langsung ACTIVE
            $tahunAjaran = TahunAjaran::create([
                'school_id' => $schoolId,
                'tahun' => $request->tahun,
                'status' => StatusTahunAjaran::DRAFT,
            ]);

            if ($request->buat_semester) {
                Semester::create([
                    'school_id' => $schoolId,
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama' => 'Ganjil',
                    'tgl_mulai' => $request->semester_ganjil_mulai,
                    'tgl_selesai' => $request->semester_ganjil_selesai,
                    'is_active' => false,
                ]);

                Semester::create([
                    'school_id' => $schoolId,
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama' => 'Genap',
                    'tgl_mulai' => $request->semester_genap_mulai,
                    'tgl_selesai' => $request->semester_genap_selesai,
                    'is_active' => false,
                ]);
            }

            ActivityLog::log(
                'create',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Membuat draft tahun ajaran {$tahunAjaran->tahun}" . ($request->buat_semester ? ' beserta semester.' : '.'),
            );

            DB::commit();

            return $this->created(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil dibuat sebagai draft.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    public function update(UpdateTahunAjaranRequest $request, string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('update', $tahunAjaran);

        // Lock rule: data tidak bisa diedit setelah APPROVED
        if ($tahunAjaran->isLocked()) {
            return $this->error(
                "Tahun ajaran berstatus \"{$tahunAjaran->status->label()}\" tidak dapat diedit. " .
                'Data terkunci setelah disetujui kepsek.',
                'LOCKED',
                422
            );
        }

        DB::beginTransaction();
        try {
            $tahunAjaran->update(['tahun' => $request->tahun]);

            if ($request->buat_semester) {
                $this->syncSemesters($tahunAjaran, $request);
            }

            ActivityLog::log(
                'update',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Memperbarui draft tahun ajaran {$tahunAjaran->tahun}."
            );

            DB::commit();

            return $this->success(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil diperbarui.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    // ── WORKFLOW TRANSITIONS ─────────────────────────────────────────────────

    /**
     * WAKASEK: Submit TA dari DRAFT → UNDER_REVIEW.
     * PATCH /tahun-ajaran/{ulid}/submit-review
     */
    public function submitReview(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::with('semesters')->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('submitReview', $tahunAjaran);

        // Validasi: semester harus sudah ada sebelum bisa direview
        if ($tahunAjaran->semesters->count() < 2) {
            return $this->error(
                'Semester Ganjil dan Genap harus sudah dibuat sebelum submit ke review.',
                'VALIDATION_ERROR',
                422
            );
        }

        $tahunAjaran->update([
            'status' => StatusTahunAjaran::UNDER_REVIEW,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        ActivityLog::log(
            'submit_review',
            'tahun_ajaran',
            $tahunAjaran->id,
            "Wakasek men-submit tahun ajaran {$tahunAjaran->tahun} untuk direview kepsek."
        );

        return $this->success(
            $tahunAjaran->load('semesters'),
            'Tahun ajaran berhasil disubmit untuk review kepala sekolah.'
        );
    }

    /**
     * KEPSEK: Approve TA dari UNDER_REVIEW → APPROVED.
     * PATCH /tahun-ajaran/{ulid}/approve
     */
    public function approve(Request $request, string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('approve', $tahunAjaran);

        $tahunAjaran->update([
            'status' => StatusTahunAjaran::APPROVED,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'catatan_review' => $request->catatan,
        ]);

        ActivityLog::log(
            'approve',
            'tahun_ajaran',
            $tahunAjaran->id,
            "Kepsek menyetujui tahun ajaran {$tahunAjaran->tahun}." .
            ($request->catatan ? " Catatan: {$request->catatan}" : '')
        );

        return $this->success(
            $tahunAjaran->load('semesters'),
            'Tahun ajaran berhasil disetujui.'
        );
    }

    /**
     * KEPSEK: Reject TA dari UNDER_REVIEW → DRAFT.
     * PATCH /tahun-ajaran/{ulid}/reject
     */
    public function reject(Request $request, string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('reject', $tahunAjaran);

        if (!$request->filled('catatan')) {
            return $this->error(
                'Catatan alasan penolakan wajib diisi.',
                'VALIDATION_ERROR',
                422
            );
        }

        $tahunAjaran->update([
            'status' => StatusTahunAjaran::DRAFT,
            'catatan_review' => $request->catatan,
            // Reset reviewed fields agar wakasek bisa submit ulang
            'reviewed_by' => null,
            'reviewed_at' => null,
        ]);

        ActivityLog::log(
            'reject',
            'tahun_ajaran',
            $tahunAjaran->id,
            "Kepsek menolak tahun ajaran {$tahunAjaran->tahun}. Catatan: {$request->catatan}"
        );

        return $this->success(
            $tahunAjaran->load('semesters'),
            'Tahun ajaran dikembalikan ke draft. Wakasek dapat memperbaiki dan submit ulang.'
        );
    }

    /**
     * KEPSEK: Aktifkan TA dari APPROVED → ACTIVE.
     * PATCH /tahun-ajaran/{ulid}/aktifkan
     *
     * Hanya satu TA yang boleh ACTIVE per sekolah.
     * Otomatis set semester Ganjil sebagai aktif.
     */
    public function aktifkan(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::with('semesters')->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('activate', $tahunAjaran);

        $schoolId = $tahunAjaran->school_id;

        DB::beginTransaction();
        try {
            // Non-aktifkan TA lain yang masih ACTIVE → COMPLETED
            // Semesternya sekalian di-CLOSE via Eloquent agar model hook jalan
            TahunAjaran::where('school_id', $schoolId)
                ->where('status', StatusTahunAjaran::ACTIVE->value)
                ->where('id', '!=', $tahunAjaran->id)
                ->each(function (TahunAjaran $ta) {
                    $ta->update(['status' => StatusTahunAjaran::COMPLETED]);
                    Semester::where('tahun_ajaran_id', $ta->id)
                        ->whereIn('status', [StatusSemester::UPCOMING->value, StatusSemester::ACTIVE->value])
                        ->each(fn(Semester $s) => $s->update(['status' => StatusSemester::CLOSED]));
                });

            // Aktifkan TA
            $tahunAjaran->update(['status' => StatusTahunAjaran::ACTIVE]);

            // Aktifkan semester pertama (urut tgl_mulai) — tidak hardcode nama 'Ganjil'
            // agar kompatibel dengan sekolah yang menamai semesternya berbeda
            $semesterPertama = Semester::where('tahun_ajaran_id', $tahunAjaran->id)
                ->whereNotNull('tgl_mulai')
                ->orderBy('tgl_mulai')
                ->first();

            if ($semesterPertama) {
                $semesterPertama->update(['status' => StatusSemester::ACTIVE]);
            }

            ActivityLog::log(
                'aktifkan',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Kepsek mengaktifkan tahun ajaran {$tahunAjaran->tahun}." .
                ($semesterPertama ? " Semester {$semesterPertama->nama} otomatis aktif." : '')
            );

            DB::commit();

            $namaAktif = $semesterPertama?->nama ?? 'pertama';

            return $this->success(
                $tahunAjaran->load('semesters'),
                "Tahun ajaran berhasil diaktifkan. Semester {$namaAktif} otomatis aktif."
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * WAKASEK: Ganti semester aktif (Ganjil ↔ Genap).
     * PATCH /tahun-ajaran/{ulid}/semester-aktif
     *
     * @deprecated Gunakan PATCH /semesters/{ulid}/activate via SemesterController::activate().
     *             Endpoint ini dipertahankan untuk backward-compat. Logika di-fix agar
     *             konsisten: mengubah status enum via Eloquent (bukan raw query builder),
     *             sehingga model hook sync is_active berjalan dengan benar.
     */
    public function setSemesterAktif(SetSemesterAktifRequest $request, string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('setSemesterAktif', $tahunAjaran);

        $semester = Semester::where('tahun_ajaran_id', $tahunAjaran->id)
            ->where('nama', $request->semester_nama)
            ->firstOrFail();

        if (!$semester->canTransitionTo(StatusSemester::ACTIVE)) {
            return $this->error(
                "Semester {$semester->nama} tidak dapat diaktifkan dari status {$semester->status->label()}.",
                'INVALID_TRANSITION',
                422
            );
        }

        DB::beginTransaction();
        try {
            // Tutup semester lain di TA yang sama yang sedang ACTIVE — via Eloquent agar model hook jalan
            Semester::where('tahun_ajaran_id', $tahunAjaran->id)
                ->where('status', StatusSemester::ACTIVE->value)
                ->where('id', '!=', $semester->id)
                ->each(fn(Semester $s) => $s->update(['status' => StatusSemester::CLOSED]));

            // Aktifkan via status enum — model updating hook akan sync is_active otomatis
            $semester->update(['status' => StatusSemester::ACTIVE]);

            ActivityLog::log(
                'set_semester_aktif',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Wakasek mengaktifkan Semester {$semester->nama} pada tahun ajaran {$tahunAjaran->tahun}."
            );

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }

        return $this->success(
            $tahunAjaran->load('semesters'),
            "Semester {$semester->nama} berhasil diaktifkan."
        );
    }

    /**
     * WAKASEK: Selesaikan / tutup buku TA dari ACTIVE → COMPLETED.
     * PATCH /tahun-ajaran/{ulid}/selesaikan
     */
    public function selesaikan(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('complete', $tahunAjaran);

        DB::beginTransaction();
        try {
            // Tutup semua semester via Eloquent agar model hook jalan dan status ter-update
            Semester::where('tahun_ajaran_id', $tahunAjaran->id)
                ->whereIn('status', [StatusSemester::UPCOMING->value, StatusSemester::ACTIVE->value])
                ->each(fn(Semester $s) => $s->update(['status' => StatusSemester::CLOSED]));

            $tahunAjaran->update([
                'status' => StatusTahunAjaran::COMPLETED,
                'completed_at' => now(),
            ]);

            ActivityLog::log(
                'selesaikan',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Wakasek menyelesaikan (tutup buku) tahun ajaran {$tahunAjaran->tahun}."
            );

            DB::commit();

            return $this->success(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil diselesaikan.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * OPERATOR: Arsipkan TA dari COMPLETED → ARCHIVED.
     * PATCH /tahun-ajaran/{ulid}/arsip
     */
    public function arsip(ArsipTahunAjaranRequest $request, string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('arsip', $tahunAjaran);

        DB::beginTransaction();
        try {
            $tahunAjaran->update(['status' => StatusTahunAjaran::ARCHIVED]);

            $catatan = $request->catatan ? " Catatan: {$request->catatan}" : '';
            ActivityLog::log(
                'arsip',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Mengarsipkan tahun ajaran {$tahunAjaran->tahun}.{$catatan}"
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
     * OPERATOR: Keluarkan dari arsip (ARCHIVED → COMPLETED).
     * PATCH /tahun-ajaran/{ulid}/unarsip
     */
    public function unarsip(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('unarsip', $tahunAjaran);

        DB::beginTransaction();
        try {
            $tahunAjaran->update(['status' => StatusTahunAjaran::COMPLETED]);

            ActivityLog::log(
                'unarsip',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Mengeluarkan tahun ajaran {$tahunAjaran->tahun} dari arsip."
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

    // ── DELETE ───────────────────────────────────────────────────────────────

    public function destroy(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('delete', $tahunAjaran);

        // Policy sudah enforce hanya DRAFT yang bisa dihapus,
        // tapi tambahkan pesan eksplisit untuk UX
        if ($tahunAjaran->status !== StatusTahunAjaran::DRAFT) {
            return $this->error(
                "Hanya tahun ajaran berstatus Draft yang dapat dihapus. " .
                "Status saat ini: {$tahunAjaran->status->label()}.",
                'CONFLICT',
                422
            );
        }

        DB::beginTransaction();
        try {
            $tahunAjaran->semesters()->delete();
            $tahunAjaran->delete();

            ActivityLog::log(
                'delete',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Memindahkan draft tahun ajaran {$tahunAjaran->tahun} ke recycle bin."
            );

            DB::commit();

            return $this->success(null, 'Tahun ajaran dipindahkan ke recycle bin.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal menghapus tahun ajaran: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public function restore(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::onlyTrashed()->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('restore', $tahunAjaran);

        DB::beginTransaction();
        try {
            $tahunAjaran->restore();
            $tahunAjaran->semesters()->withTrashed()->restore();

            ActivityLog::log(
                'restore',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Memulihkan tahun ajaran {$tahunAjaran->tahun} dari recycle bin."
            );

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

    public function forceDelete(string $ulid): JsonResponse
    {
        $tahunAjaran = TahunAjaran::onlyTrashed()->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('forceDelete', $tahunAjaran);

        $blockers = [
            'kelas' => Kelas::withTrashed()->where('tahun_ajaran_id', $tahunAjaran->id)->exists(),
            'plot_guru' => PlotGuruMapel::where('tahun_ajaran_id', $tahunAjaran->id)->exists(),
            'riwayat' => RiwayatKelas::where('tahun_ajaran_id', $tahunAjaran->id)->exists(),
            'absensi' => Absensi::where('tahun_ajaran_id', $tahunAjaran->id)->exists(),
            'kalender' => KalenderAkademik::where('tahun_ajaran_id', $tahunAjaran->id)->exists(),
            'wali_kelas' => UserWaliKelas::where('tahun_ajaran_id', $tahunAjaran->id)->exists(),
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

            ActivityLog::log(
                'force_delete',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Menghapus permanen tahun ajaran {$tahunAjaran->tahun}."
            );

            DB::commit();

            return $this->success(null, 'Tahun ajaran dihapus secara permanen.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal menghapus permanen: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function syncSemesters(TahunAjaran $tahunAjaran, Request $request): void
    {
        $schoolId = $tahunAjaran->school_id;

        foreach (['Ganjil', 'Genap'] as $nama) {
            $keyMulai = 'semester_' . strtolower($nama) . '_mulai';
            $keySelesai = 'semester_' . strtolower($nama) . '_selesai';

            $existing = Semester::where('school_id', $schoolId)
                ->where('tahun_ajaran_id', $tahunAjaran->id)
                ->where('nama', $nama)
                ->withTrashed()
                ->first();

            $hasMulai = $request->has($keyMulai);
            $hasSelesai = $request->has($keySelesai);

            if (!$hasMulai && !$hasSelesai && !$existing) {
                continue;
            }

            $payload = [
                'school_id' => $schoolId,
                'tgl_mulai' => $hasMulai ? $request->$keyMulai : $existing?->tgl_mulai,
                'tgl_selesai' => $hasSelesai ? $request->$keySelesai : $existing?->tgl_selesai,
                'deleted_at' => null,
            ];

            if ($existing) {
                $existing->update($payload);
            } elseif ($hasMulai || $hasSelesai) {
                Semester::create(array_merge($payload, [
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama' => $nama,
                    'is_active' => false,
                ]));
            }
        }
    }
}