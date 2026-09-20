<?php

namespace App\Http\Controllers\MasterData;

use App\Enums\StatusSemester;
use App\Enums\StatusTahunAjaran;
use App\Http\Controllers\Controller;
use App\Http\Requests\Semester\ActivateSemesterRequest;
use App\Http\Requests\Semester\ArchiveSemesterRequest;
use App\Http\Requests\Semester\UpdateSemesterRequest;
use App\Models\ActivityLog;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * SemesterController — semester sebagai entitas mandiri.
 *
 * Semester tidak punya create/delete endpoint sendiri:
 *   - Dibuat otomatis saat TahunAjaran dibuat (via syncSemesters)
 *   - Tidak bisa di-hard delete jika punya transaksi akademik
 *
 * Endpoint yang tersedia:
 *   GET    /semesters                  → index (per TA)
 *   GET    /semesters/{ulid}           → show
 *   PUT    /semesters/{ulid}           → update tanggal/nama
 *   PATCH  /semesters/{ulid}/activate  → set ACTIVE (ganti semester)
 *   PATCH  /semesters/{ulid}/close     → tutup semester (ACTIVE → CLOSED)
 *   PATCH  /semesters/{ulid}/archive   → arsipkan (CLOSED → ARCHIVED)
 *   PATCH  /semesters/{ulid}/unarchive → keluarkan dari arsip
 */
class SemesterController extends Controller
{
    // ── READ ─────────────────────────────────────────────────────────────────

    /**
     * Daftar semester — filter by tahun_ajaran_ulid jika ada.
     */
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Semester::class);

        $taUlid = request()->query('tahun_ajaran_ulid');

        $query = Semester::with('tahunAjaran')
            ->orderByRaw("FIELD(status, 'active', 'upcoming', 'closed', 'archived')")
            ->orderBy('tgl_mulai');

        if ($taUlid) {
            $query->whereHas(
                'tahunAjaran',
                fn($q) => $q->where('ulid', $taUlid)
            );
        }

        return $this->success($query->paginate(request()->integer('per_page', 20)));
    }

    public function show(string $ulid): JsonResponse
    {
        $semester = Semester::with('tahunAjaran')->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('view', $semester);

        return $this->success($semester);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    /**
     * Update tanggal atau nama semester.
     *
     * Ini solusi untuk Temuan 5 (over-locking):
     * Wakasek bisa mengubah rentang tanggal Semester Genap bahkan saat
     * TA sudah ACTIVE — karena lock hanya berlaku pada Semester yang
     * sudah CLOSED atau ARCHIVED, bukan pada status TA-nya.
     */
    public function update(UpdateSemesterRequest $request, string $ulid): JsonResponse
    {
        $semester = Semester::with('tahunAjaran')->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('update', $semester);

        $semester->update($request->validated());

        ActivityLog::log(
            'update',
            'semester',
            $semester->id,
            "Memperbarui data Semester {$semester->nama} (TA {$semester->tahunAjaran->tahun})."
        );

        return $this->success($semester->fresh(), 'Semester berhasil diperbarui.');
    }

    // ── WORKFLOW TRANSITIONS ─────────────────────────────────────────────────

    /**
     * Aktifkan semester ini — menutup semester lain yang sedang ACTIVE di TA yang sama.
     *
     * Dipakai Wakasek untuk pergantian semester (Ganjil → Genap atau sebaliknya).
     * Berjalan dalam satu transaksi: close yang lama, activate yang baru.
     */
    public function activate(ActivateSemesterRequest $request, string $ulid): JsonResponse
    {
        $semester = Semester::with('tahunAjaran')->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('activate', $semester);

        DB::transaction(function () use ($semester) {
            // Tutup semester lain di TA yang sama yang sedang ACTIVE
            Semester::where('tahun_ajaran_id', $semester->tahun_ajaran_id)
                ->where('status', StatusSemester::ACTIVE->value)
                ->where('id', '!=', $semester->id)
                ->each(function (Semester $lain) {
                    $lain->update(['status' => StatusSemester::CLOSED]);
                });

            $semester->update(['status' => StatusSemester::ACTIVE]);
        });

        ActivityLog::log(
            'activate',
            'semester',
            $semester->id,
            "Mengaktifkan Semester {$semester->nama} (TA {$semester->tahunAjaran->tahun})."
        );

        return $this->success(
            $semester->fresh(),
            "Semester {$semester->nama} berhasil diaktifkan."
        );
    }

    /**
     * Tutup semester (ACTIVE → CLOSED) secara manual.
     * Biasanya ini otomatis saat activate() semester berikutnya,
     * tapi bisa juga dilakukan manual oleh Wakasek.
     *
     * Validasi: TA induk harus berstatus ACTIVE — tidak boleh close semester
     * saat TA sudah COMPLETED/ARCHIVED (TA lifecycle sudah di luar kendali Wakasek).
     */
    public function close(string $ulid): JsonResponse
    {
        $semester = Semester::with('tahunAjaran')->where('ulid', $ulid)->firstOrFail();
        Gate::authorize('close', $semester);

        if ($semester->tahunAjaran->status !== StatusTahunAjaran::ACTIVE) {
            return $this->error(
                'Semester hanya bisa ditutup saat tahun ajaran sedang AKTIF.',
                'TA_NOT_ACTIVE',
                422
            );
        }

        $semester->update(['status' => StatusSemester::CLOSED]);

        ActivityLog::log(
            'close',
            'semester',
            $semester->id,
            "Menutup Semester {$semester->nama} (TA {$semester->tahunAjaran->tahun})."
        );

        return $this->success($semester->fresh(), "Semester {$semester->nama} berhasil ditutup.");
    }

    /**
     * Arsipkan semester (CLOSED → ARCHIVED).
     * Operator mengarsipkan setelah semua rapor selesai.
     */
    public function archive(ArchiveSemesterRequest $request, string $ulid): JsonResponse
    {
        $semester = Semester::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('archive', $semester);

        $semester->update([
            'status' => StatusSemester::ARCHIVED,
            'archived_at' => now(),
        ]);

        ActivityLog::log(
            'archive',
            'semester',
            $semester->id,
            "Mengarsipkan Semester {$semester->nama} (TA {$semester->tahunAjaran->tahun})."
        );

        return $this->success($semester->fresh(), "Semester {$semester->nama} berhasil diarsipkan.");
    }

    /**
     * Keluarkan dari arsip (ARCHIVED → CLOSED).
     * Untuk koreksi arsip yang tidak sengaja.
     */
    public function unarchive(string $ulid): JsonResponse
    {
        $semester = Semester::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('unarchive', $semester);

        $semester->update([
            'status' => StatusSemester::CLOSED,
            'archived_at' => null,
        ]);

        ActivityLog::log(
            'unarchive',
            'semester',
            $semester->id,
            "Mengeluarkan Semester {$semester->nama} dari arsip (TA {$semester->tahunAjaran->tahun})."
        );

        return $this->success($semester->fresh(), "Semester {$semester->nama} berhasil dikeluarkan dari arsip.");
    }
}