<?php

namespace App\Enums;

/**
 * Status lifecycle Semester.
 *
 * Workflow:
 *   UPCOMING → ACTIVE → CLOSED → ARCHIVED
 *
 * Siapa yang transisi:
 *   UPCOMING → ACTIVE   : Wakasek (set semester aktif, permission: tahun_ajaran.review)
 *   ACTIVE   → CLOSED   : Wakasek (tutup semester — biasanya otomatis saat TA selesai
 *                          atau saat beralih ke semester berikutnya)
 *   CLOSED   → ARCHIVED : Operator (arsipkan setelah rapor selesai)
 *
 * Semester yang sudah punya transaksi akademik (absensi, nilai) tidak bisa
 * di-hard delete — gunakan ARCHIVED.
 */
enum StatusSemester: string
{
    case UPCOMING = 'upcoming';
    case ACTIVE = 'active';
    case CLOSED = 'closed';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::UPCOMING => 'Akan Datang',
            self::ACTIVE => 'Aktif',
            self::CLOSED => 'Selesai',
            self::ARCHIVED => 'Diarsipkan',
        };
    }

    /**
     * Semester yang sudah CLOSED/ARCHIVED tidak bisa diedit.
     */
    public function isLocked(): bool
    {
        return match ($this) {
            self::UPCOMING, self::ACTIVE => false,
            default => true,
        };
    }

    public function isTerminal(): bool
    {
        return $this === self::ARCHIVED;
    }

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::UPCOMING => [self::ACTIVE],
            self::ACTIVE => [self::CLOSED],
            self::CLOSED => [self::ARCHIVED],
            self::ARCHIVED => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}