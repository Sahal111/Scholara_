<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class TahunAjaran extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'tahun_ajarans';

    protected $fillable = [
        'school_id',
        'ulid',
        'tahun',
        'is_active',
        'is_archived',
        'archived_at',
        // audit fields
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $hidden = [
        'id',        // jangan expose integer ID — gunakan ulid di API
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
    ];

    // ── Boot: auto-set ulid & audit fields ──────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function (TahunAjaran $model) {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
            if (empty($model->created_by) && auth()->check()) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function (TahunAjaran $model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });

        static::deleting(function (TahunAjaran $model) {
            if (auth()->check()) {
                $model->deleted_by = auth()->id();
                $model->saveQuietly();
            }
        });
    }

    // ── Route model binding: pakai ulid, bukan integer id ───────────────────

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    // ── Relasi ──────────────────────────────────────────────────────────────

    public function semesters(): HasMany
    {
        return $this->hasMany(Semester::class, 'tahun_ajaran_id');
    }

    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class, 'tahun_ajaran_id');
    }

    /**
     * Kurikulum yang berlaku di tahun ajaran ini.
     * Many-to-many via pivot kurikulum_tahun_ajarans.
     */
    public function kurikulums(): BelongsToMany
    {
        return $this->belongsToMany(
            Kurikulum::class,
            'kurikulum_tahun_ajarans',
            'tahun_ajaran_id',
            'kurikulum_id'
        )->withPivot(['semester_id', 'tingkat_kelas', 'catatan', 'is_active'])
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    // ── Scopes ──────────────────────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeArsip($query)
    {
        return $query->where('is_archived', true);
    }

    public function scopeAktifDanBelumArsip($query)
    {
        return $query->where('is_archived', false)->whereNull('deleted_at');
    }
}