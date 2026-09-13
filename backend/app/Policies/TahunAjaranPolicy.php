<?php

namespace App\Policies;

use App\Models\TahunAjaran;
use App\Models\User;

class TahunAjaranPolicy
{
    /**
     * before() hanya di-bypass untuk operator — tidak untuk role lain.
     * Dengan begitu wakasek tetap masuk ke method individual dan
     * mendapat permission yang tepat sesuai RBAC split.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('operator')) {
            return true;
        }

        return null;
    }

    /**
     * Hanya operator (sudah di-bypass via before()) dan wakasek yang boleh buat.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('wakasek');
    }

    /**
     * Mutasi (update, setAktif, arsip, dll) hanya boleh oleh:
     * - operator (bypass via before())
     * - wakasek dari sekolah yang sama
     * Mencegah lintas-tenant (school_id check WAJIB).
     */
    public function manage(User $user, TahunAjaran $tahunAjaran): bool
    {
        $sameSchool = (int) $user->school_id === (int) $tahunAjaran->school_id;

        return $sameSchool && (
            $user->hasRole('operator') ||
            $user->hasRole('wakasek')
        );
    }

    /**
     * Lihat daftar — operator, kepsek, wakasek.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('operator')
            || $user->hasRole('kepsek')
            || $user->hasRole('wakasek');
    }

    /**
     * Lihat detail satu record — harus sekolah yang sama + role yang berhak.
     */
    public function view(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id
            && (
                $user->hasRole('operator') ||
                $user->hasRole('kepsek') ||
                $user->hasRole('wakasek')
            );
    }

    /**
     * Restore dari recycle bin — operator (bypass) atau wakasek sekolah sama.
     */
    public function restore(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id
            && (
                $user->hasRole('operator') ||
                $user->hasRole('wakasek')
            );
    }

    /**
     * Hapus permanen — hanya operator (via bypass) atau wakasek sekolah sama.
     */
    public function forceDelete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id
            && (
                $user->hasRole('operator') ||
                $user->hasRole('wakasek')
            );
    }
}