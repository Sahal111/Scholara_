<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model untuk rapor siswa per semester.
 *
 * Satu rapor = satu siswa + satu semester. Berisi ringkasan akademik siswa
 * termasuk rekap absensi, catatan wali kelas, status kelulusan/kenaikan kelas.
 *
 * @property int         $id
 * @property int|null    $school_id
 * @property int         $siswa_id
 * @property int|null    $kelas_id          Snapshot kelas siswa saat rapor diterbitkan
 * @property int         $tahun_ajaran_id
 * @property int         $semester_id
 * @property int|null    $wali_kelas_id     FK ke gurus.id
 * @property int|null    $total_hadir
 * @property int|null    $total_sakit
 * @property int|null    $total_izin
 * @property int|null    $total_alpa
 * @property string|null $catatan_wali
 * @property string|null $deskripsi_sikap_spiritual
 * @property string|null $deskripsi_sikap_sosial
 * @property string      $status             draft|final
 * @property string|null $status_kenaikan    Naik Kelas|Tinggal Kelas|Lulus|Tidak Lulus
 * @property \Carbon\Carbon|null $finalisasi_at
 * @property int|null    $finalisasi_oleh
 */
class Rapor extends Model
{
    use HasSchoolScope, SoftDeletes;

    protected $table = 'rapors';

    protected $fillable = [
        'school_id',
        'siswa_id',
        'kelas_id',
        'tahun_ajaran_id',
        'semester_id',
        'wali_kelas_id',
        'total_hadir',
        'total_sakit',
        'total_izin',
        'total_alpa',
        'catatan_wali',
        'deskripsi_sikap_spiritual',
        'deskripsi_sikap_sosial',
        'status',
        'status_kenaikan',
        'finalisasi_at',
        'finalisasi_oleh',
    ];

    protected $casts = [
        'finalisasi_at'  => 'datetime',
        'total_hadir'    => 'integer',
        'total_sakit'    => 'integer',
        'total_izin'     => 'integer',
        'total_alpa'     => 'integer',
    ];

    // ── Konstanta ────────────────────────────────────────────────────────────

    const STATUS_DRAFT = 'draft';
    const STATUS_FINAL = 'final';

    const STATUS_KENAIKAN = [
        'Naik Kelas',
        'Tinggal Kelas',
        'Lulus',
        'Tidak Lulus',
    ];

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeFinal($query)
    {
        return $query->where('status', self::STATUS_FINAL);
    }

    // ── Relasi ───────────────────────────────────────────────────────────────

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function waliKelas(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'wali_kelas_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    // ── Accessor ─────────────────────────────────────────────────────────────

    /** True jika rapor sudah difinalisasi */
    public function getIsFinalAttribute(): bool
    {
        return $this->status === self::STATUS_FINAL;
    }

    /** Total hari tidak hadir (semua alasan) */
    public function getTotalTidakHadirAttribute(): int
    {
        return ($this->total_sakit ?? 0)
            + ($this->total_izin ?? 0)
            + ($this->total_alpa ?? 0);
    }
}

