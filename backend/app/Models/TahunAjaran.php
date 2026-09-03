<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TahunAjaran extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'tahun_ajarans';

    protected $fillable = [
        'school_id',
        'tahun',
        'is_active',
        'is_archived',
        'archived_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
    ];

    // ── Relasi ──────────────────────────────────────────────

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
     * Pivot menyimpan: semester_id, tingkat_kelas, catatan.
     *
     * Contoh penggunaan:
     *   $tahunAjaran->kurikulums  → [K13 (tingkat [8,9]), Merdeka (tingkat [7])]
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

    // ── Scopes ──────────────────────────────────────────────

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