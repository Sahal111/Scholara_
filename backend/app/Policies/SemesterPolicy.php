<?php

namespace App\Policies;

use App\Enums\StatusSemester;
use App\Enums\StatusTahunAjaran;
use App\Models\Semester;
use App\Models\User;

/**
 * Policy Semester — evaluasi via permission, bukan hardcode role.
 *
 * Permission map:
 *   master_data.semester.view     → viewAny, view
 *   master_data.semester.manage   → update (hanya saat belum CLOSED/ARCHIVED)
 *   master_data.semester.activate → activate (UPCOMING → ACTIVE, TA harus ACTIVE)
 *   master_data.semester.archive  → archive (CLOSED → ARCHIVED), unarchive
 *
 * Semester tidak punya create/delete mandiri — dibuat otomatis saat TA dibuat.
 * Hard delete tidak diizinkan jika semester punya transaksi akademik.
 */
class SemesterPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('master_data.semester.view');
    }

    public function view(User $user, Semester $semester): bool
    {
        return $this->sameSchool($user, $semester)
            && $user->hasPermission('master_data.semester.view');
    }

    /**
     * Edit tanggal/nama semester.
     * - TA draft/under_review → Operator & Wakasek (manage permission)
     * - TA approved/active    → Wakasek saja (activate permission)
     * Semester yang sudah CLOSED/ARCHIVED tidak bisa diedit.
     */
    public function update(User $user, Semester $semester): bool
    {
        if (!$this->sameSchool($user, $semester) || $semester->isLocked()) {
            return false;
        }

        $ta = $semester->tahunAjaran;

        // Setelah TA disetujui/aktif, hanya Wakasek yang boleh ubah tanggal
        if ($ta && $ta->status->isLocked()) {
            return $user->hasPermission('master_data.semester.activate');
        }

        // TA masih draft/under_review — Operator dan Wakasek boleh
        return $user->hasPermission('master_data.semester.manage');
    }

    /**
     * Set semester ini sebagai ACTIVE.
     * Otomatis menutup (CLOSED) semester lain di TA yang sama.
     * Permission: master_data.semester.activate (default: Wakasek).
     * Syarat: TA harus berstatus ACTIVE.
     */
    public function activate(User $user, Semester $semester): bool
    {
        return $this->sameSchool($user, $semester)
            && $user->hasPermission('master_data.semester.activate')
            && $semester->canTransitionTo(StatusSemester::ACTIVE)
            && $semester->tahunAjaran
            && $semester->tahunAjaran->status === StatusTahunAjaran::ACTIVE;
    }

    /**
     * Tutup semester (ACTIVE → CLOSED).
     * Otomatis dilakukan saat aktivasi semester lain, tapi bisa juga manual.
     * Permission: master_data.semester.activate (Wakasek yang mengatur ritme).
     */
    public function close(User $user, Semester $semester): bool
    {
        return $this->sameSchool($user, $semester)
            && $user->hasPermission('master_data.semester.activate')
            && $semester->canTransitionTo(StatusSemester::CLOSED);
    }

    /**
     * Arsipkan semester (CLOSED → ARCHIVED).
     * Operator mengarsipkan setelah semua rapor selesai.
     */
    public function archive(User $user, Semester $semester): bool
    {
        return $this->sameSchool($user, $semester)
            && $user->hasPermission('master_data.semester.archive')
            && $semester->canTransitionTo(StatusSemester::ARCHIVED);
    }

    /**
     * Keluarkan dari arsip (ARCHIVED → CLOSED) — koreksi arsip yang salah.
     */
    public function unarchive(User $user, Semester $semester): bool
    {
        return $this->sameSchool($user, $semester)
            && $user->hasPermission('master_data.semester.archive')
            && $semester->status === StatusSemester::ARCHIVED;
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private function sameSchool(User $user, Semester $semester): bool
    {
        return (int) $user->school_id === (int) $semester->school_id;
    }
}