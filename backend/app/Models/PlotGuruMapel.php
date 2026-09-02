<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlotGuruMapel extends Model
{
    use HasSchoolScope, SoftDeletes;

    protected $table = 'plot_guru_mapels';

    protected $fillable = [
        // school_id diisi otomatis oleh HasSchoolScope (bootHasSchoolScope)
        'guru_id',
        'mapel_id',
        'kelas_id',
        'tahun_ajaran_id',
        'semester_id',
        'beban_jam',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'beban_jam' => 'integer',
    ];


    // ── Relasi ──────────────────────────────────────────────

    public function guru()
    {
        return $this->belongsTo(Guru::class, 'guru_id');
    }

    public function mapel()
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function jadwals()
    {
        return $this->hasMany(JadwalPelajaran::class, 'plot_id');
    }
}