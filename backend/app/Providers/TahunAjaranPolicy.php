<?php

namespace App\Policies;

use App\Models\TahunAjaran;
use App\Models\User;

class TahunAjaranPolicy
{
    /**
     * Operator selalu lolos semua gate (bypass).
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('operator')) {
            return true;
        }

        return null;
    }

    public function view(User $user, TahunAjaran $ta): bool
    {
        return $this->sameSchool($user, $ta);
    }

    public function manage(User $user, TahunAjaran $ta): bool
    {
        return $this->sameSchool($user, $ta);
    }

    private function sameSchool(User $user, TahunAjaran $ta): bool
    {
        return (int) $user->school_id === (int) $ta->school_id;
    }
}