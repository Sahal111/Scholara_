<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MataPelajaran extends Model
{
    use HasSchoolScope, SoftDeletes;

    protected $table = 'mapels';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        // school_id diisi otomatis oleh HasSchoolScope (bootHasSchoolScope)
        'ulid',
        'kode',
        'nama_mapel',
        'kelompok',
        'tingkat',
        'program_pendidikan_id',
        'kurikulum',      // legacy — dipertahankan sementara
        'kurikulum_id',   // FK baru ke tabel kurikulums. NULL = berlaku semua kurikulum
        'jam_per_minggu',
        'is_active',
        'urutan_rapor',
        // Audit columns TIDAK di $fillable — di-set otomatis via boot()
    ];

    protected $hidden = [
        'deleted_at',
        'deleted_by',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'jam_per_minggu' => 'integer',
        'tingkat' => 'string',
        'urutan_rapor' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();

        // Auto-generate ULID untuk public identifier
        static::creating(function (self $model) {
            $model->ulid ??= (string) Str::ulid();
            $model->created_by = auth()->id();
            $model->updated_by = auth()->id();
        });

        static::updating(function (self $model) {
            $model->updated_by = auth()->id();
        });

        static::deleting(function (self $model) {
            $model->deleted_by = auth()->id();
            $model->saveQuietly();
        });
    }

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relasi ──────────────────────────────────────────────

    public function programPendidikan(): BelongsTo
    {
        return $this->belongsTo(ProgramPendidikan::class, 'program_pendidikan_id');
    }

    /**
     * Kurikulum spesifik mapel ini.
     * NULL = mapel berlaku untuk semua kurikulum (mapel umum seperti Matematika, B.Indonesia).
     * non-NULL = mapel hanya ada di kurikulum tertentu (misal: P5 hanya ada di Merdeka).
     */
    public function kurikulum(): BelongsTo
    {
        return $this->belongsTo(Kurikulum::class, 'kurikulum_id');
    }

    public function plotGuruMapels()
    {
        return $this->hasMany(PlotGuruMapel::class, 'mapel_id');
    }

    public function jadwals()
    {
        return $this->hasMany(JadwalPelajaran::class, 'mapel_id');
    }
}