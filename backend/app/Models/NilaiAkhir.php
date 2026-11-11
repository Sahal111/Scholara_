<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model untuk nilai akhir per mata pelajaran per siswa per semester.
 *
 * Ini adalah nilai final yang masuk ke rapor — hasil rekapitulasi dari
 * semua komponen nilai (formatif, sumatif, PTS, PAS) dengan bobot masing-masing.
 *
 * @property int         $id
 * @property int|null    $school_id
 * @property int         $siswa_id
 * @property int         $plot_id          FK ke plot_guru_mapels
 * @property int         $tahun_ajaran_id
 * @property int         $semester_id
 * @property float|null  $nilai_angka      0.00 – 100.00
 * @property string|null $nilai_huruf
 * @property string|null $predikat         A|B|C|D
 * @property string|null $deskripsi        Deskripsi pencapaian final untuk rapor
 */
class NilaiAkhir extends Model
{
    use HasSchoolScope;

    protected $table = 'nilai_akhirs';

    protected $fillable = [
        'school_id',
        'siswa_id',
        'plot_id',
        'tahun_ajaran_id',
        'semester_id',
        'nilai_angka',
        'nilai_huruf',
        'predikat',
        'deskripsi',
    ];

    protected $casts = [
        'nilai_angka' => 'float',
    ];

    // ── Konstanta ────────────────────────────────────────────────────────────

    /** Label predikat untuk tampilan di UI */
    const PREDIKAT_LABEL = [
        'A' => 'Sangat Baik',
        'B' => 'Baik',
        'C' => 'Cukup',
        'D' => 'Perlu Bimbingan',
    ];

    // ── Relasi ───────────────────────────────────────────────────────────────

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }

    public function plot(): BelongsTo
    {
        return $this->belongsTo(PlotGuruMapel::class, 'plot_id');
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

    // ── Helper ───────────────────────────────────────────────────────────────

    /** Label predikat yang mudah dibaca. */
    public function getPredikatLabelAttribute(): string
    {
        return self::PREDIKAT_LABEL[$this->predikat] ?? ($this->predikat ?? '-');
    }

    /**
     * Hitung predikat otomatis dari nilai angka.
     * Gunakan sebelum menyimpan jika predikat belum di-set.
     */
    public static function hitungPredikat(float $nilai): string
    {
        return match (true) {
            $nilai >= 90 => 'A',
            $nilai >= 80 => 'B',
            $nilai >= 70 => 'C',
            default => 'D',
        };
    }
}

