<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MataPelajaran extends Model
{
    use HasSchoolScope, SoftDeletes;

    protected $table = 'mapels';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        // school_id diisi otomatis oleh HasSchoolScope (bootHasSchoolScope)
        'kode',
        'nama_mapel',
        'kelompok',
        'tingkat',
        'program_pendidikan_id',
        'kurikulum',
        'jam_per_minggu',
        'is_active',
        'urutan_rapor',
        // Audit columns — TIDAK boleh di-set langsung dari request user
        // Di-set otomatis via boot() di bawah
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $hidden = [
        // Jangan expose audit user ID mentah — tampilkan via resource jika perlu
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

        static::creating(function (self $model) {
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

    public function programPendidikan()
    {
        return $this->belongsTo(ProgramPendidikan::class, 'program_pendidikan_id');
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