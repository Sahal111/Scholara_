<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Kelas extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'kelas';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'school_id',
        'tahun_ajaran_id',
        'semester_id',
        'nama_kelas',
        'tingkat',
        'program_pendidikan_id',
        'kurikulum',
        'wali_kelas_id',
        'kapasitas',
        'ruangan',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tingkat' => 'integer',
        'kapasitas' => 'integer',
    ];

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relasi ──────────────────────────────────────────────

    public function programPendidikan()
    {
        return $this->belongsTo(ProgramPendidikan::class, 'program_pendidikan_id');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function wali()
    {
        return $this->belongsTo(Guru::class, 'wali_kelas_id');
    }

    public function riwayatKelas()
    {
        return $this->hasMany(RiwayatKelas::class, 'kelas_id');
    }

    public function absensis()
    {
        return $this->hasMany(Absensi::class, 'kelas_id');
    }

    public function jadwals()
    {
        return $this->hasMany(JadwalPelajaran::class, 'kelas_id');
    }

    public function plotGuruMapels()
    {
        return $this->hasMany(PlotGuruMapel::class, 'kelas_id');
    }
}