<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\MataPelajaran;

class CourseMaterial extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'course_materials';

    protected $fillable = [
        'school_id',
        'mapel_id',
        'kelas_id',
        'guru_id',
        'semester_id',
        'judul',
        'deskripsi',
        'tipe',
        'storage_path',
        'url_eksternal',
        'mime_type',
        'ukuran_bytes',
        'urutan',
        'is_published',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'ukuran_bytes' => 'integer',
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

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scope ────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}