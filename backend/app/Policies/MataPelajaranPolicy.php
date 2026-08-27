<?php

namespace App\Policies;

use App\Models\MataPelajaran;
use App\Models\User;

class MataPelajaranPolicy
{
    /**
     * Operator selalu punya akses penuh ke semua action.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('operator')) {
            return true;
        }
        return null;
    }

    public function view(User $user, MataPelajaran $mapel): bool
    {
        return $this->sameSchool($user, $mapel);
    }

    public function update(User $user, MataPelajaran $mapel): bool
    {
        return $this->sameSchool($user, $mapel);
    }

    public function delete(User $user, MataPelajaran $mapel): bool
    {
        return $this->sameSchool($user, $mapel);
    }

    public function toggleActive(User $user, MataPelajaran $mapel): bool
    {
        return $this->sameSchool($user, $mapel);
    }

    /**
     * Pastikan resource milik sekolah yang sama dengan user.
     * Ini lapisan kedua setelah SchoolScope — defense-in-depth.
     */
    private function sameSchool(User $user, MataPelajaran $mapel): bool
    {
        return (int) $user->school_id === (int) $mapel->school_id;
    }
}