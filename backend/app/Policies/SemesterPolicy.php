<?php

namespace App\Policies;

use App\Enums\StatusSemester;
use App\Models\Semester;
use App\Models\User;

/**
 * Policy Semester — evaluasi via permission, bukan hardcode role.
 *
 * Permission map:
 *   master_data.semester.view     → viewAny, view
 *   master_data.semester.manage   → update (hanya saat belum CLOSED/ARCHIVED)
 *   master_data.semester.activate → activate (UPCOMING/CLOSED → ACTIVE)
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
     * Hanya boleh selama status belum CLOSED atau ARCHIVED.
     * Ini solusi untuk Temuan 5 (over-locking) — Wakasek tetap bisa
     * ubah rentang tanggal Semester Genap saat TA sudah ACTIVE.
     */
    public function update(User $user, Semester $semester): bool
    {
        return $this->sameSchool($user, $semester)
            && !$semester->isLocked()
            && $user->hasPermission('master_data.semester.manage');
    }

    /**
     * Set semester ini sebagai ACTIVE.
     * Otomatis menutup (CLOSED) semester lain di TA yang sama.
     * Permission: master_data.semester.activate (default: Wakasek).
     */
    public function activate(User $user, Semester $semester): bool
    {
        return $this->sameSchool($user, $semester)
            && $user->hasPermission('master_data.semester.activate')
            && $semester->canTransitionTo(StatusSemester::ACTIVE);
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