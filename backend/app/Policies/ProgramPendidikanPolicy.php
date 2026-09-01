<?php

namespace App\Policies;

use App\Models\ProgramPendidikan;
use App\Models\User;

/**
 * Policy untuk resource ProgramPendidikan.
 *
 * Prinsip:
 *  - SchoolScope sudah memfilter query → ProgramPendidikan yang bisa
 *    ditemukan pasti milik school_id yang sama dengan user.
 *  - Policy ini menjadi LAPISAN KEDUA: mencegah privilege escalation
 *    kalau SchoolScope di-bypass atau ada bug di resolver.
 *  - Route middleware sudah cek permission (master_data.kelas.view/manage).
 *    Policy hanya cek kepemilikan tenant — tidak duplikasi role check.
 */
class ProgramPendidikanPolicy
{
    /** Lihat daftar program — siapapun yang punya permission view. */
    public function viewAny(User $user): bool
    {
        return true; // sudah dijaga permission middleware
    }

    /** Lihat detail satu program — harus sekolah yang sama. */
    public function view(User $user, ProgramPendidikan $program): bool
    {
        return $this->sameSchool($user, $program);
    }

    /**
     * Tambah program baru — hanya operator (dijaga permission middleware).
     * Tidak pakai before() agar pengecekan school_id tetap aktif di semua role.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('operator');
    }

    /** Edit program — harus sekolah yang sama. Operator pun harus pass cek ini. */
    public function update(User $user, ProgramPendidikan $program): bool
    {
        return $this->sameSchool($user, $program);
    }

    /** Hapus program — harus sekolah yang sama. */
    public function delete(User $user, ProgramPendidikan $program): bool
    {
        return $this->sameSchool($user, $program);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function sameSchool(User $user, ProgramPendidikan $program): bool
    {
        return (int) $user->school_id === (int) $program->school_id;
    }
}