<?php

namespace App\Models;

use App\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model Kurikulum — kurikulum sebagai entitas data, bukan hardcoded enum.
 *
 * Pola two-layer (sama dengan master_religions, master_education_levels):
 *   school_id = NULL     → platform default, tersedia untuk semua sekolah
 *   school_id = non-NULL → kurikulum custom milik sekolah tersebut
 *
 * CATATAN: Model ini TIDAK menggunakan HasSchoolScope karena school_id nullable.
 * Query harus eksplisit: Kurikulum::platformDefaults(), Kurikulum::forSchool($id).
 *
 * @property int         $id
 * @property int|null    $school_id
 * @property string      $ulid
 * @property string      $nama
 * @property string      $kode
 * @property int         $tahun_berlaku
 * @property int|null    $tahun_berakhir
 * @property string      $jenis           nasional|internasional|khusus|custom
 * @property string|null $penerbit
 * @property string|null $deskripsi
 * @property array|null  $metadata
 * @property bool        $is_active
 * @property bool        $is_platform_default
 */
class Kurikulum extends Model
{
    use SoftDeletes, HasUlid;

    protected $table = 'kurikulums';

    protected $fillable = [
        // school_id diisi manual (bukan auto via scope karena nullable)
        'school_id',
        'nama',
        'kode',
        'tahun_berlaku',
        'tahun_berakhir',
        'jenis',
        'penerbit',
        'deskripsi',
        'metadata',
        'is_active',
        'is_platform_default',
    ];

    protected $casts = [
        'tahun_berlaku' => 'integer',
        'tahun_berakhir' => 'integer',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'is_platform_default' => 'boolean',
    ];

    // Jangan ekspos audit fields dan FK internal ke API
    protected $hidden = ['created_by', 'updated_by', 'deleted_by', 'deleted_at'];

    // ── Konstanta ────────────────────────────────────────────────────────────

    const JENIS_NASIONAL = 'nasional';
    const JENIS_INTERNASIONAL = 'internasional';
    const JENIS_KHUSUS = 'khusus';
    const JENIS_CUSTOM = 'custom';

    const JENIS_LABEL = [
        'nasional' => 'Kurikulum Nasional',
        'internasional' => 'Kurikulum Internasional',
        'khusus' => 'Kurikulum Khusus',
        'custom' => 'Kurikulum Mandiri',
    ];

    // ── Boot ─────────────────────────────────────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function ($model) {
            $model->created_by ??= auth()->id();
            $model->updated_by ??= auth()->id();
        });

        static::updating(function ($model) {
            $model->updated_by = auth()->id();
        });

        static::deleting(function ($model) {
            $model->deleted_by = auth()->id();
            $model->save();
        });
    }

    // ── Scopes ───────────────────────────────────────────────────────────────

    /** Kurikulum platform default (school_id = NULL) — tersedia semua sekolah */
    public function scopePlatformDefaults($query)
    {
        return $query->whereNull('school_id');
    }

    /** Kurikulum custom milik sekolah tertentu */
    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    /**
     * Kurikulum yang tersedia untuk sekolah tertentu:
     * platform defaults + custom milik sekolah itu sendiri.
     */
    public function scopeAvailableForSchool($query, int $schoolId)
    {
        return $query->where(function ($q) use ($schoolId) {
            $q->whereNull('school_id')
                ->orWhere('school_id', $schoolId);
        });
    }

    /** Hanya yang masih aktif */
    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    /** Hanya yang belum berakhir (tahun_berakhir null atau di masa depan) */
    public function scopeMasihBerlaku($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('tahun_berakhir')
                ->orWhere('tahun_berakhir', '>=', now()->year);
        });
    }

    // ── Relasi ───────────────────────────────────────────────────────────────

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function komponenNilais(): HasMany
    {
        return $this->hasMany(KurikulumKomponenNilai::class, 'kurikulum_id')
            ->orderBy('urutan');
    }

    /** Kelas-kelas yang menggunakan kurikulum ini */
    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class, 'kurikulum_id');
    }

    /** Mapel yang spesifik untuk kurikulum ini */
    public function mapels(): HasMany
    {
        return $this->hasMany(MataPelajaran::class, 'kurikulum_id');
    }

    /**
     * Program pendidikan yang kompatibel dengan kurikulum ini.
     * Many-to-many via pivot kurikulum_program_pendidikans.
     */
    public function programPendidikans(): BelongsToMany
    {
        return $this->belongsToMany(
            ProgramPendidikan::class,
            'kurikulum_program_pendidikans',
            'kurikulum_id',
            'program_pendidikan_id'
        )->withPivot(['catatan', 'is_active'])
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    /**
     * Tahun ajaran yang menggunakan kurikulum ini.
     * Many-to-many via pivot kurikulum_tahun_ajarans.
     */
    public function tahunAjarans(): BelongsToMany
    {
        return $this->belongsToMany(
            TahunAjaran::class,
            'kurikulum_tahun_ajarans',
            'kurikulum_id',
            'tahun_ajaran_id'
        )->withPivot(['semester_id', 'tingkat_kelas', 'catatan', 'is_active'])
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    // ── Accessor ─────────────────────────────────────────────────────────────

    public function getJenisLabelAttribute(): string
    {
        return self::JENIS_LABEL[$this->jenis] ?? $this->jenis;
    }

    /** Apakah kurikulum ini milik platform (bukan custom sekolah) */
    public function getIsPlatformAttribute(): bool
    {
        return is_null($this->school_id);
    }

    /** Apakah kurikulum masih berlaku berdasarkan tahun */
    public function getIsMasihBerlakuAttribute(): bool
    {
        return is_null($this->tahun_berakhir) || $this->tahun_berakhir >= now()->year;
    }
}