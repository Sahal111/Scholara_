<?php

namespace App\Enums;

/**
 * Status lifecycle implementasi kurikulum (baris kurikulum_tahun_ajarans).
 *
 * Alur — sama dengan Tahun Ajaran:
 *
 *   DRAFT → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED
 *
 * Siapa yang boleh transisi (dijaga permission di route):
 *   DRAFT        → UNDER_REVIEW : Wakasek  (master_data.kurikulum.review)
 *   UNDER_REVIEW → APPROVED     : Kepsek   (master_data.kurikulum.approve)
 *   UNDER_REVIEW → DRAFT        : Kepsek   (master_data.kurikulum.approve) — reject
 *   APPROVED     → ACTIVE       : Kepsek   (master_data.kurikulum.activate)
 *   ACTIVE       → COMPLETED    : Wakasek  (master_data.kurikulum.complete)
 *
 * BEDA dengan Tahun Ajaran: struktur hanya bisa DIEDIT saat DRAFT. Saat
 * UNDER_REVIEW struktur ikut terkunci supaya yang direview Kepsek tidak
 * berubah di bawah matanya.
 *
 * ARCHIVED sengaja belum ada (belum ada konsumennya). Kolom status VARCHAR,
 * jadi menambahnya nanti tidak butuh ALTER TABLE.
 */
enum StatusImplementasiKurikulum: string
{
    case DRAFT = 'draft';
    case UNDER_REVIEW = 'under_review';
    case APPROVED = 'approved';
    case ACTIVE = 'active';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::UNDER_REVIEW => 'Menunggu Review',
            self::APPROVED => 'Disetujui',
            self::ACTIVE => 'Aktif',
            self::COMPLETED => 'Selesai',
        };
    }

    /**
     * Struktur hanya boleh ditambah/diubah/dihapus saat DRAFT.
     */
    public function isEditable(): bool
    {
        return $this === self::DRAFT;
    }

    /**
     * @return array<int, self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::DRAFT => [self::UNDER_REVIEW],
            self::UNDER_REVIEW => [self::APPROVED, self::DRAFT],
            self::APPROVED => [self::ACTIVE],
            self::ACTIVE => [self::COMPLETED],
            self::COMPLETED => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    /**
     * Baca dari kolom DB; nilai tak dikenal diperlakukan sebagai DRAFT.
     */
    public static function dari(?string $nilai): self
    {
        return self::tryFrom((string) $nilai) ?? self::DRAFT;
    }
}
