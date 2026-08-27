<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Jurusan extends Model
{
    use HasSchoolScope, SoftDeletes;

    protected $table = 'jurusans';

    protected $fillable = [
        // school_id diisi otomatis oleh HasSchoolScope
        'nama',
        'kode',
        'deskripsi',
        'tingkat_berlaku',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ── Scopes ──────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relasi ──────────────────────────────────────────────

    public function kelas()
    {
        return $this->hasMany(Kelas::class, 'jurusan_id');
    }

    public function mapels()
    {
        return $this->hasMany(MataPelajaran::class, 'jurusan_id');
    }
}