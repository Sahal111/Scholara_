<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model komponen penilaian yang digunakan oleh sekolah.
 *
 * Komponen adalah "jenis" nilai: Formatif, Sumatif, PTS, PAS, Sikap, Ekskul, dll.
 * Setiap sekolah bisa punya komponen platform (school_id = NULL) atau
 * komponen kustom sendiri (school_id = ID sekolah tersebut).
 *
 * @property int         $id
 * @property int|null    $school_id
 * @property string      $nama_komponen   Nama tampilan (Nilai Formatif, PTS, dll)
 * @property string|null $kode            Kode singkat (NF, NS, PTS, PAS)
 * @property string      $jenis           formatif|sumatif|sikap|ekstrakurikuler|lainnya
 * @property float|null  $bobot_persentase Bobot dalam nilai akhir
 * @property string      $kurikulum       K13|Merdeka|Semua
 * @property bool        $is_active
 */
class KomponenPenilaian extends Model
{
    use HasSchoolScope;

    protected $table = 'komponen_penilaians';

    protected $fillable = [
        'school_id',
        'nama_komponen',
        'kode',
        'jenis',
        'bobot_persentase',
        'kurikulum',
        'is_active',
    ];

    protected $casts = [
        'bobot_persentase' => 'float',
        'is_active'        => 'boolean',
    ];

    // ── Konstanta ────────────────────────────────────────────────────────────

    const JENIS = [
        'formatif'       => 'Nilai Formatif',
        'sumatif'        => 'Nilai Sumatif',
        'sikap'          => 'Sikap',
        'ekstrakurikuler'=> 'Ekstrakurikuler',
        'lainnya'        => 'Lainnya',
    ];

    const KURIKULUM = ['K13', 'Merdeka', 'Semua'];

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForKurikulum($query, string $kurikulum)
    {
        return $query->where(function ($q) use ($kurikulum) {
            $q->where('kurikulum', $kurikulum)
              ->orWhere('kurikulum', 'Semua');
        });
    }

    // ── Relasi ───────────────────────────────────────────────────────────────

    public function nilais(): HasMany
    {
        return $this->hasMany(Nilai::class, 'komponen_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    // ── Accessor ─────────────────────────────────────────────────────────────

    public function getJenisLabelAttribute(): string
    {
        return self::JENIS[$this->jenis] ?? $this->jenis;
    }
}

