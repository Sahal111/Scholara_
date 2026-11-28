<?php

namespace App\Services;

use App\Models\Kurikulum;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * Helper pemilihan kurikulum untuk form Kelas & Mapel.
 * Menerima ULID kurikulum (platform ATAU milik sekolah ini, dan masih aktif).
 */
class KurikulumPilihan
{
    public static function schoolId(): ?int
    {
        if (app()->bound('current_school_id')) {
            return (int) app('current_school_id');
        }

        $id = auth()->user()?->school_id;

        return $id !== null ? (int) $id : null;
    }

    /** Aturan validasi: ulid harus ada, aktif, tidak terhapus, dan platform/milik sekolah ini. */
    public static function rule(): Exists
    {
        $schoolId = self::schoolId();

        return Rule::exists('kurikulums', 'ulid')->where(function ($q) use ($schoolId) {
            $q->whereNull('deleted_at')
                ->where('is_active', true)
                ->where(function ($s) use ($schoolId) {
                    $s->whereNull('school_id')->orWhere('school_id', $schoolId);
                });
        });
    }

    public static function cari(?string $ulid): ?Kurikulum
    {
        if (!$ulid) {
            return null;
        }

        return Kurikulum::availableForSchool((int) self::schoolId())
            ->aktif()
            ->where('ulid', $ulid)
            ->first();
    }

    /** Nilai ENUM lama kelas.kurikulum ('K13' | 'Merdeka' | 'Keduanya'). Sementara, sampai kolom dihapus. */
    public static function legacyKelas(Kurikulum $k): string
    {
        return $k->kode === 'K13' ? 'K13' : 'Merdeka';
    }

    /** Nilai lama mapels.kurikulum (varchar 50). NULL (semua kurikulum) = 'Keduanya'. */
    public static function legacyMapel(?Kurikulum $k): string
    {
        if ($k === null) {
            return 'Keduanya';
        }

        return match ($k->kode) {
            'K13' => 'Kurikulum 2013',
            'MERDEKA' => 'Kurikulum Merdeka',
            default => mb_substr($k->nama, 0, 50),
        };
    }
}