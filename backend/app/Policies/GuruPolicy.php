<?php

namespace App\Policies;

use App\Models\Guru;
use App\Models\User;

/**
 * Policy untuk resource Guru.
 *
 * Prinsip:
 *  - SchoolScope sudah memfilter query → Guru yang bisa ditemukan
 *    pasti milik school_id yang sama dengan user.
 *  - Policy ini menjadi LAPISAN KEDUA: mencegah privilege escalation
 *    kalau SchoolScope di-bypass atau ada bug di resolver.
 *  - Tidak ada business logic di sini — hanya authorization.
 */
class GuruPolicy
{
    /**
     * Super operator bisa melakukan apapun lintas sekolah.
     * Dipanggil otomatis oleh Gate sebelum method lain.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('operator')) {
            return true;
        }

        return null; // lanjut ke method spesifik
    }

    /** Lihat daftar guru — operator dan kepsek sekolah yang sama. */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('operator') || $user->hasRole('kepsek');
    }

    /** Lihat detail satu guru — harus sekolah yang sama. */
    public function view(User $user, Guru $guru): bool
    {
        return $this->sameSchool($user, $guru)
            && ($user->hasRole('operator') || $user->hasRole('kepsek'));
    }

    /** Tambah guru baru — hanya operator. */
    public function create(User $user): bool
    {
        return $user->hasRole('operator');
    }

    /** Edit data guru — hanya operator sekolah yang sama. */
    public function update(User $user, Guru $guru): bool
    {
        return $this->sameSchool($user, $guru)
            && $user->hasRole('operator');
    }

    /** Soft-delete guru — hanya operator sekolah yang sama. */
    public function delete(User $user, Guru $guru): bool
    {
        return $this->sameSchool($user, $guru)
            && $user->hasRole('operator');
    }

    /** Restore dari trash — hanya operator sekolah yang sama. */
    public function restore(User $user, Guru $guru): bool
    {
        return $this->sameSchool($user, $guru)
            && $user->hasRole('operator');
    }

    /** Hard-delete permanen — hanya operator sekolah yang sama. */
    public function forceDelete(User $user, Guru $guru): bool
    {
        return $this->sameSchool($user, $guru)
            && $user->hasRole('operator');
    }

    /** Verifikasi data guru — operator, kepsek, atau wakasek sekolah yang sama. */
    public function verify(User $user, Guru $guru): bool
    {
        return $this->sameSchool($user, $guru)
            && ($user->hasRole('operator') || $user->hasRole('kepsek') || $user->hasRole('wakasek'));
    }

    /** Upload dokumen / foto guru. */
    public function uploadDocument(User $user, Guru $guru): bool
    {
        return $this->sameSchool($user, $guru)
            && $user->hasRole('operator');
    }

    /** Import massal — hanya operator. */
    public function import(User $user): bool
    {
        return $user->hasRole('operator');
    }

    /** Export data — operator, kepsek, atau wakasek. */
    public function export(User $user): bool
    {
        return $user->hasRole('operator') || $user->hasRole('kepsek') || $user->hasRole('wakasek');
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function sameSchool(User $user, Guru $guru): bool
    {
        return (int) $user->school_id === (int) $guru->school_id;
    }
}