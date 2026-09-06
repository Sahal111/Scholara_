<?php

namespace App\Policies;

use App\Models\Kelas;
use App\Models\User;

class KelasPolicy
{
    /**
     * Operator mendapat bypass penuh (pelaksana administrasi).
     * Wakasek adalah pemilik kebijakan akademik — tidak di-bypass di sini
     * supaya sameSchool tetap dicek.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('operator')) {
            return true;
        }
        return null;
    }

    /** Lihat daftar kelas — operator, kepsek, wakasek, wali_kelas. */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('operator')
            || $user->hasRole('kepsek')
            || $user->hasRole('wakasek')
            || $user->hasRole('wali_kelas');
    }

    /** Lihat detail satu kelas — cukup same-school. */
    public function view(User $user, Kelas $kelas): bool
    {
        return $this->sameSchool($user, $kelas);
    }

    /** Tambah kelas — wakasek (pemilik kebijakan) atau operator. */
    public function create(User $user): bool
    {
        return $user->hasRole('operator') || $user->hasRole('wakasek');
    }

    /** Edit kelas — wakasek atau operator, harus same-school. */
    public function update(User $user, Kelas $kelas): bool
    {
        return $this->sameSchool($user, $kelas)
            && ($user->hasRole('operator') || $user->hasRole('wakasek'));
    }

    /** Hapus kelas — wakasek atau operator, harus same-school. */
    public function delete(User $user, Kelas $kelas): bool
    {
        return $this->sameSchool($user, $kelas)
            && ($user->hasRole('operator') || $user->hasRole('wakasek'));
    }

    /** Kelola siswa dalam kelas — wakasek atau operator, harus same-school. */
    public function manageSiswa(User $user, Kelas $kelas): bool
    {
        return $this->sameSchool($user, $kelas)
            && ($user->hasRole('operator') || $user->hasRole('wakasek'));
    }

    private function sameSchool(User $user, Kelas $kelas): bool
    {
        return (int) $user->school_id === (int) $kelas->school_id;
    }
}