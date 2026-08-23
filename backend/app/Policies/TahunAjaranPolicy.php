<?php

namespace App\Policies;

use App\Models\TahunAjaran;
use App\Models\User;

class TahunAjaranPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('operator')) {
            return true;
        }

        return null;
    }

    public function manage(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasRole('operator') || $user->hasRole('kepsek');
    }

    public function view(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id
            && ($user->hasRole('operator') || $user->hasRole('kepsek'));
    }

    public function restore(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id;
    }

    public function forceDelete(User $user, TahunAjaran $tahunAjaran): bool
    {
        return (int) $user->school_id === (int) $tahunAjaran->school_id;
    }
}