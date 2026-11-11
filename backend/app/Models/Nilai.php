<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model untuk nilai per komponen per siswa per mata pelajaran.
 *
 * Skema penilaian:
 *   Siswa → Mapel (via plot_guru_mapels) → Komponen (Formatif/Sumatif/PTS/PAS) → Nilai
 *
 * @property int         $id
 * @property int|null    $school_id
 * @property int         $siswa_id
 * @property int         $plot_id          FK ke plot_guru_mapels (menentukan mapel + guru + kelas)
 * @property int|null    $komponen_id      FK ke komponen_penilaians (opsional)
 * @property int         $tahun_ajaran_id
 * @property int         $semester_id
 * @property float|null  $nilai            0.00 – 100.00
 * @property string|null $nilai_huruf      A, B, C, D / SB, B, C, PB
 * @property string|null $deskripsi        Deskripsi kualitatif (wajib Kurikulum Merdeka)
 * @property int|null    $created_by
 * @property int|null    $updated_by
 */
class Nilai extends Model
{
    use HasSchoolScope, SoftDeletes;

    protected $table = 'nilais';

    protected $fillable = [
        'school_id',
        'siswa_id',
        'plot_id',
        'komponen_id',
        'tahun_ajaran_id',
        'semester_id',
        'nilai',
        'nilai_huruf',
        'deskripsi',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'nilai' => 'float',
    ];

    // ── Relasi ───────────────────────────────────────────────────────────────

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }

    /** Plot guru–mapel: memberi tahu mapel apa dan guru siapa yang mengajar. */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(PlotGuruMapel::class, 'plot_id');
    }

    public function komponen(): BelongsTo
    {
        return $this->belongsTo(KomponenPenilaian::class, 'komponen_id');
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    // ── Accessor ─────────────────────────────────────────────────────────────

    /**
     * Hitung predikat dari nilai angka.
     * A=90-100, B=80-89, C=70-79, D=<70
     */
    public function getPredikatAttribute(): ?string
    {
        if ($this->nilai === null) {
            return null;
        }

        return match (true) {
            $this->nilai >= 90 => 'A',
            $this->nilai >= 80 => 'B',
            $this->nilai >= 70 => 'C',
            default => 'D',
        };
    }
}

