<?php

namespace App\Enums;

/**
 * Status lifecycle Tahun Ajaran.
 *
 * Workflow resmi:
 *
 *   DRAFT → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED → ARCHIVED
 *
 * Siapa yang boleh transisi:
 *   DRAFT        → UNDER_REVIEW  : Wakasek (submit untuk review)
 *   UNDER_REVIEW → APPROVED      : Kepsek (approve)
 *   UNDER_REVIEW → DRAFT         : Kepsek (reject / kembalikan)
 *   APPROVED     → ACTIVE        : Kepsek (aktifkan)
 *   ACTIVE       → COMPLETED     : Wakasek (tutup buku / selesaikan)
 *   COMPLETED    → ARCHIVED      : Operator (arsipkan ke historis)
 *
 * Data dikunci (tidak bisa diedit) setelah status >= APPROVED.
 */
enum StatusTahunAjaran: string
{
    case DRAFT = 'draft';
    case UNDER_REVIEW = 'under_review';
    case APPROVED = 'approved';
    case ACTIVE = 'active';
    case COMPLETED = 'completed';
    case ARCHIVED = 'archived';

    /**
     * Label dalam Bahasa Indonesia untuk API response dan UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::UNDER_REVIEW => 'Menunggu Review',
            self::APPROVED => 'Disetujui',
            self::ACTIVE => 'Aktif',
            self::COMPLETED => 'Selesai',
            self::ARCHIVED => 'Diarsipkan',
        };
    }

    /**
     * Data terkunci — tidak boleh diedit setelah status ini.
     * Berlaku untuk: tahun, is_active, semesters tgl_mulai/tgl_selesai.
     */
    public function isLocked(): bool
    {
        return match ($this) {
            self::DRAFT, self::UNDER_REVIEW => false,
            default => true,
        };
    }

    /**
     * Apakah status ini masih bisa ditransisi ke status berikutnya.
     */
    public function isTerminal(): bool
    {
        return $this === self::ARCHIVED;
    }

    /**
     * Transisi yang valid dari status ini.
     * Digunakan untuk validasi di Service layer.
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::DRAFT => [self::UNDER_REVIEW],
            self::UNDER_REVIEW => [self::APPROVED, self::DRAFT],   // approved atau reject balik ke draft
            self::APPROVED => [self::ACTIVE],
            self::ACTIVE => [self::COMPLETED],
            self::COMPLETED => [self::ARCHIVED],
            self::ARCHIVED => [],
        };
    }

    /**
     * Cek apakah transisi ke status target valid.
     */
    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    /**
     * Semua nilai sebagai array string — untuk validasi request.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}