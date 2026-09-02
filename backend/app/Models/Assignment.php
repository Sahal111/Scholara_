<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\MataPelajaran;

class Assignment extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'assignments';

    protected $fillable = [
        'school_id',
        'mapel_id',
        'kelas_id',
        'guru_id',
        'semester_id',
        'judul',
        'instruksi',
        'lampiran',
        'tipe',
        'batas_pengumpulan',
        'late_policy',
        'late_penalty_persen',
        'nilai_maksimal',
        'boleh_revisi',
        'is_published',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'batas_pengumpulan' => 'datetime',
        'published_at' => 'datetime',
        'nilai_maksimal' => 'decimal:2',
        'late_penalty_persen' => 'decimal:2',
        'boleh_revisi' => 'boolean',
        'is_published' => 'boolean',
    ];

    // ── Relasi ───────────────────────────────────────────────

    public function mapel()
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class, 'guru_id');
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class, 'assignment_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scope ────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeAktif($query)
    {
        return $query->where('is_published', true)
            ->where('batas_pengumpulan', '>', now());
    }
}