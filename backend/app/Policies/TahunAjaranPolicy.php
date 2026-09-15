<?php

namespace App\Policies;

use App\Enums\StatusTahunAjaran;
use App\Models\TahunAjaran;
use App\Models\User;

/**
 * Policy TahunAjaran — RBAC 3-layer Workflow.
 *
 * Siapa boleh apa:
 *
 *   OPERATOR  → create (buat draft), view, update (hanya saat draft), delete (hanya draft), restore
 *   WAKASEK   → semua operator + submitReview, complete (tutup buku)
 *   KEPSEK    → view + approve + reject + activate
 *
 * TIDAK ada before() bypass untuk operator lagi.
 * Setiap aksi diperiksa eksplisit + school_id check.
 *
 * Lock rule: data terkunci (tidak bisa diedit/dihapus) setelah status >= APPROVED.
 */
class TahunAjaranPolicy
{
    // ── VIEW ─────────────────────────────────────────────────────────────────

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['operator', 'wakasek', 'kepsek']);
    }

    public function view(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasAnyRole(['operator', 'wakasek', 'kepsek']);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    /**
     * Hanya operator yang boleh membuat draft TA.
     * Wakasek tidak membuat — mereka mereview & mengelola kebijakan akademik.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('operator');
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    /**
     * Edit data TA (tahun, semester dates).
     * Hanya boleh saat status DRAFT — setelah itu data terkunci.
     */
    public function update(User $user, TahunAjaran $tahunAjaran): bool
    {
        if (!$this->sameSchool($user, $tahunAjaran)) {
            return false;
        }

        // Data terkunci setelah APPROVED
        if ($tahunAjaran->isLocked()) {
            return false;
        }

        return $user->hasAnyRole(['operator', 'wakasek']);
    }

    // ── WORKFLOW TRANSITIONS ─────────────────────────────────────────────────

    /**
     * Submit TA dari DRAFT ke UNDER_REVIEW.
     * Hak: Wakasek — dialah yang memastikan data akademik siap direview kepsek.
     */
    public function submitReview(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('wakasek')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::UNDER_REVIEW);
    }

    /**
     * Approve TA dari UNDER_REVIEW ke APPROVED.
     * Hak: Kepsek — final approver.
     */
    public function approve(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('kepsek')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::APPROVED);
    }

    /**
     * Reject TA dari UNDER_REVIEW kembali ke DRAFT.
     * Hak: Kepsek — memberikan catatan dan mengembalikan ke wakasek.
     */
    public function reject(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('kepsek')
            && $tahunAjaran->status === StatusTahunAjaran::UNDER_REVIEW;
    }

    /**
     * Aktifkan TA dari APPROVED ke ACTIVE.
     * Hak: Kepsek — keputusan final untuk menjadikan TA berlaku.
     */
    public function activate(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('kepsek')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::ACTIVE);
    }

    /**
     * Ganti semester aktif (Ganjil ↔ Genap) dalam TA yang sedang ACTIVE.
     * Hak: Wakasek — mengatur ritme akademik.
     */
    public function setSemesterAktif(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('wakasek')
            && $tahunAjaran->status === StatusTahunAjaran::ACTIVE;
    }

    /**
     * Selesaikan / tutup buku TA dari ACTIVE ke COMPLETED.
     * Hak: Wakasek — menandai bahwa proses akademik sudah selesai.
     */
    public function complete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('wakasek')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::COMPLETED);
    }

    /**
     * Arsipkan TA dari COMPLETED ke ARCHIVED.
     * Hak: Operator — administrasi historis.
     */
    public function arsip(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('operator')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::ARCHIVED);
    }

    /**
     * Keluarkan dari arsip (ARCHIVED → COMPLETED).
     * Hak: Operator — koreksi arsip yang salah.
     */
    public function unarsip(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('operator')
            && $tahunAjaran->status === StatusTahunAjaran::ARCHIVED;
    }

    // ── DELETE & RESTORE ─────────────────────────────────────────────────────

    /**
     * Hapus ke recycle bin — hanya boleh saat masih DRAFT.
     * Setelah DRAFT, TA tidak bisa dihapus biasa (harus lewat workflow).
     */
    public function delete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('operator')
            && $tahunAjaran->status === StatusTahunAjaran::DRAFT;
    }

    public function restore(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('operator');
    }

    /**
     * Hapus permanen — hanya untuk TA yang masih DRAFT di recycle bin.
     * TA yang sudah pernah ACTIVE tidak boleh dihapus permanen.
     */
    public function forceDelete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasRole('operator');
    }

    // ── Private helper ───────────────────────────────────────────────────────

    private function sameSchool(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id;
    }
}
