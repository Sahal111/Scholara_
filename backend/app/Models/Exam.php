<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\MataPelajaran;

class Exam extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'exams';

    protected $fillable = [
        'school_id',
        'mapel_id',
        'kelas_id',
        'guru_id',
        'semester_id',
        'judul',
        'deskripsi',
        'tipe',
        'waktu_mulai',
        'waktu_selesai',
        'acak_soal',
        'acak_pilihan',
        'tampilkan_skor_langsung',
        'boleh_buka_lagi',
        'nilai_lulus',
        'is_published',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
        'published_at' => 'datetime',
        'acak_soal' => 'boolean',
        'acak_pilihan' => 'boolean',
        'tampilkan_skor_langsung' => 'boolean',
        'boleh_buka_lagi' => 'boolean',
        'is_published' => 'boolean',
        'nilai_lulus' => 'decimal:2',
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

    public function questions()
    {
        return $this->hasMany(ExamQuestion::class, 'exam_id');
    }

    public function sessions()
    {
        return $this->hasMany(ExamStudentSession::class, 'exam_id');
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

    public function scopeSedangBerlangsung($query)
    {
        return $query->where('is_published', true)
            ->where('waktu_mulai', '<=', now())
            ->where('waktu_selesai', '>=', now());
    }
}