<?php

namespace App\Models;

use App\Enums\StatusSemester;
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
        'status',
        'archived_at',
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
        'archived_at' => 'datetime',
        'status' => StatusSemester::class,
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
            // Default status
            if (empty($model->status)) {
                $model->status = StatusSemester::UPCOMING;
            }
        });

        static::updating(function (Semester $model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
            // Sync is_active dari status agar backward-compat
            if ($model->isDirty('status')) {
                $model->is_active = $model->status === StatusSemester::ACTIVE;
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

    // ── Relasi ───────────────────────────────────────────────────────────────

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

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('status', StatusSemester::ACTIVE->value);
    }

    public function scopeStatus($query, StatusSemester $status)
    {
        return $query->where('status', $status->value);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isLocked(): bool
    {
        return $this->status->isLocked();
    }

    public function canTransitionTo(StatusSemester $target): bool
    {
        return $this->status->canTransitionTo($target);
    }
}