<?php

namespace App\Policies;

use App\Enums\StatusTahunAjaran;
use App\Models\TahunAjaran;
use App\Models\User;

/**
 * Policy TahunAjaran — evaluasi via permission, bukan hardcode role.
 *
 * Prinsip: Role → Permission → Scope → Workflow
 * Jangan pernah cek $user->hasRole(...) di sini — gunakan hasPermission().
 * Sekolah bisa membuat role custom (mis. "Plt. Kepsek") dan sistem tetap bekerja
 * selama permission yang tepat sudah di-assign ke role tersebut.
 *
 * Siapa boleh apa (via permission):
 *
 *   master_data.tahun_ajaran.view     → viewAny, view
 *   master_data.tahun_ajaran.manage   → create, update (hanya saat DRAFT), delete, restore
 *   master_data.tahun_ajaran.review   → submitReview, setSemesterAktif, complete
 *   master_data.tahun_ajaran.approve  → approve, reject
 *   master_data.tahun_ajaran.activate → activate
 *   master_data.tahun_ajaran.archive  → arsip, unarsip
 *
 * Lock rule: data terkunci (tidak bisa diedit/dihapus) setelah status >= APPROVED.
 * Workflow transitions dicek via canTransitionTo() di model.
 */
class TahunAjaranPolicy
{
    // ── VIEW ─────────────────────────────────────────────────────────────────

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('master_data.tahun_ajaran.view');
    }

    public function view(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.view');
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    /**
     * Buat draft TA baru.
     * Default: Operator (master_data.tahun_ajaran.manage).
     * Wakasek juga punya manage — lihat SchoolSeeder.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('master_data.tahun_ajaran.manage');
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    /**
     * Edit data TA (nama, rentang tanggal, semester dates).
     * Hanya boleh saat status DRAFT — setelah itu data terkunci.
     */
    public function update(User $user, TahunAjaran $tahunAjaran): bool
    {
        if (!$this->sameSchool($user, $tahunAjaran)) {
            return false;
        }

        if ($tahunAjaran->isLocked()) {
            return false;
        }

        return $user->hasPermission('master_data.tahun_ajaran.manage');
    }

    // ── WORKFLOW TRANSITIONS ─────────────────────────────────────────────────

    /**
     * Submit TA dari DRAFT ke UNDER_REVIEW.
     * Permission: master_data.tahun_ajaran.review (default: Wakasek).
     */
    public function submitReview(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.review')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::UNDER_REVIEW);
    }

    /**
     * Approve TA dari UNDER_REVIEW ke APPROVED.
     * Permission: master_data.tahun_ajaran.approve (default: Kepsek).
     */
    public function approve(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.approve')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::APPROVED);
    }

    /**
     * Reject TA dari UNDER_REVIEW kembali ke DRAFT.
     * Permission: master_data.tahun_ajaran.approve (default: Kepsek).
     */
    public function reject(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.approve')
            && $tahunAjaran->status === StatusTahunAjaran::UNDER_REVIEW;
    }

    /**
     * Aktifkan TA dari APPROVED ke ACTIVE.
     * Permission: master_data.tahun_ajaran.activate (default: Kepsek).
     */
    public function activate(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.activate')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::ACTIVE);
    }

    /**
     * Ganti semester aktif (Ganjil ↔ Genap) dalam TA yang sedang ACTIVE.
     * Permission: master_data.tahun_ajaran.review (default: Wakasek).
     * Mengatur ritme akademik adalah tanggung jawab Wakasek.
     */
    public function setSemesterAktif(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.review')
            && $tahunAjaran->status === StatusTahunAjaran::ACTIVE;
    }

    /**
     * Selesaikan / tutup buku TA dari ACTIVE ke COMPLETED.
     * Permission: master_data.tahun_ajaran.complete (default: Wakasek).
     */
    public function complete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.complete')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::COMPLETED);
    }

    /**
     * Arsipkan TA dari COMPLETED ke ARCHIVED.
     * Permission: master_data.tahun_ajaran.archive (default: Operator).
     */
    public function arsip(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.archive')
            && $tahunAjaran->canTransitionTo(StatusTahunAjaran::ARCHIVED);
    }

    /**
     * Keluarkan dari arsip (ARCHIVED → COMPLETED).
     * Permission: master_data.tahun_ajaran.archive (default: Operator).
     */
    public function unarsip(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.archive')
            && $tahunAjaran->status === StatusTahunAjaran::ARCHIVED;
    }

    // ── DELETE & RESTORE ─────────────────────────────────────────────────────

    /**
     * Hapus ke recycle bin — hanya boleh saat masih DRAFT.
     * Permission: master_data.tahun_ajaran.manage (default: Operator & Wakasek).
     */
    public function delete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.manage')
            && $tahunAjaran->status === StatusTahunAjaran::DRAFT;
    }

    public function restore(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.manage');
    }

    /**
     * Hapus permanen — hanya untuk TA yang masih DRAFT di recycle bin.
     * TA yang sudah pernah melewati DRAFT tidak boleh dihapus permanen.
     */
    public function forceDelete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return $this->sameSchool($user, $tahunAjaran)
            && $user->hasPermission('master_data.tahun_ajaran.manage')
            && $tahunAjaran->status === StatusTahunAjaran::DRAFT;
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private function sameSchool(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id;
    }
}