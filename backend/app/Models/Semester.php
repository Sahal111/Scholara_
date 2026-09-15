<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Semester extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'semesters';

    protected $fillable = [
        'school_id',
        'ulid',
        'tahun_ajaran_id',
        'nama',
        'tgl_mulai',
        'tgl_selesai',
        'is_active',
        // audit fields
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $hidden = [
        'id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tgl_mulai' => 'date:Y-m-d',
        'tgl_selesai' => 'date:Y-m-d',
    ];

    // ── Boot ─────────────────────────────────────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function (Semester $model) {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
            if (empty($model->created_by) && auth()->check()) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function (Semester $model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });

        static::deleting(function (Semester $model) {
            if (auth()->check()) {
                $model->deleted_by = auth()->id();
                $model->saveQuietly();
            }
        });
    }

    // ── Route model binding ──────────────────────────────────────────────────

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    // ── Relasi ──────────────────────────────────────────────────────────────

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }

    public function kelas()
    {
        return $this->hasMany(Kelas::class, 'semester_id');
    }

    public function absensis()
    {
        return $this->hasMany(Absensi::class, 'semester_id');
    }

    // ── Scopes ──────────────────────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }
}