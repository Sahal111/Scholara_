<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Komponen penilaian yang berlaku per kurikulum.
 *
 * Contoh:
 *   K13      → KI-1 (Sikap Spiritual), KI-2 (Sikap Sosial), KI-3 (Pengetahuan), KI-4 (Keterampilan)
 *   Merdeka  → Formatif, Sumatif, P5, Sikap
 *   Cambridge → Coursework, Written Exam, Practical
 *
 * Pola school_id sama dengan kurikulums:
 *   NULL = komponen platform, non-NULL = custom sekolah.
 *
 * @property int         $id
 * @property int|null    $school_id
 * @property int         $kurikulum_id
 * @property string      $nama
 * @property string|null $kode
 * @property string      $kategori  pengetahuan|keterampilan|sikap|projek|ekstrakurikuler|lainnya
 * @property float|null  $bobot_persen
 * @property int         $urutan
 * @property bool        $is_wajib
 * @property bool        $is_active
 */
class KurikulumKomponenNilai extends Model
{
    use SoftDeletes;

    protected $table = 'kurikulum_komponen_nilaians';

    protected $fillable = [
        'school_id',
        'kurikulum_id',
        'nama',
        'kode',
        'kategori',
        'bobot_persen',
        'urutan',
        'is_wajib',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'bobot_persen' => 'float',
        'urutan' => 'integer',
        'is_wajib' => 'boolean',
        'is_active' => 'boolean',
    ];

    const KATEGORI_LABEL = [
        'pengetahuan' => 'Pengetahuan / Kognitif',
        'keterampilan' => 'Keterampilan / Psikomotorik',
        'sikap' => 'Sikap / Afektif',
        'projek' => 'Projek (P5/P2RA)',
        'ekstrakurikuler' => 'Ekstrakurikuler',
        'lainnya' => 'Lainnya',
    ];

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWajib($query)
    {
        return $query->where('is_wajib', true);
    }

    // ── Relasi ───────────────────────────────────────────────────────────────

    public function kurikulum(): BelongsTo
    {
        return $this->belongsTo(Kurikulum::class, 'kurikulum_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    // ── Accessor ─────────────────────────────────────────────────────────────

    public function getKategoriLabelAttribute(): string
    {
        return self::KATEGORI_LABEL[$this->kategori] ?? $this->kategori;
    }
}