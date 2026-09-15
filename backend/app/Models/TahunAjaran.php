<?php

namespace App\Models;

use App\Enums\StatusTahunAjaran;
use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'is_active',       // deprecated — disync otomatis dari status
        'is_archived',     // deprecated — disync otomatis dari status
        'archived_at',
        'status',
        'reviewed_by',
        'reviewed_at',
        'approved_by',
        'approved_at',
        'completed_at',
        'catatan_review',
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
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
        'status' => StatusTahunAjaran::class,
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // ── Boot ─────────────────────────────────────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function (TahunAjaran $model) {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
            // Status default saat baru dibuat
            if (empty($model->status)) {
                $model->status = StatusTahunAjaran::DRAFT;
            }
            // Sync is_active / is_archived dari status
            $model->syncLegacyFlags();

            if (empty($model->created_by) && auth()->check()) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function (TahunAjaran $model) {
            // Sync is_active / is_archived setiap kali status berubah
            if ($model->isDirty('status')) {
                $model->syncLegacyFlags();
            }
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

    // ── Route model binding ──────────────────────────────────────────────────

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Jaga sinkronisasi kolom legacy is_active & is_archived
     * agar query lama yang masih pakai kolom ini tetap bekerja.
     */
    public function syncLegacyFlags(): void
    {
        $status = $this->status instanceof StatusTahunAjaran
            ? $this->status
            : StatusTahunAjaran::from($this->status ?? StatusTahunAjaran::DRAFT->value);

        $this->is_active = $status === StatusTahunAjaran::ACTIVE;
        $this->is_archived = $status === StatusTahunAjaran::ARCHIVED;

        if ($status === StatusTahunAjaran::ARCHIVED && !$this->archived_at) {
            $this->archived_at = now();
        }
        if ($status !== StatusTahunAjaran::ARCHIVED) {
            $this->archived_at = null;
        }
    }

    /**
     * Apakah data TA ini terkunci (tidak boleh diedit).
     * Terkunci setelah status >= APPROVED.
     */
    public function isLocked(): bool
    {
        return $this->status instanceof StatusTahunAjaran
            ? $this->status->isLocked()
            : StatusTahunAjaran::from($this->status ?? 'draft')->isLocked();
    }

    /**
     * Apakah transisi ke status target valid dari status saat ini.
     */
    public function canTransitionTo(StatusTahunAjaran $target): bool
    {
        $current = $this->status instanceof StatusTahunAjaran
            ? $this->status
            : StatusTahunAjaran::from($this->status ?? 'draft');

        return $current->canTransitionTo($target);
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

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
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

    /** @deprecated Pakai scopeStatus(StatusTahunAjaran::ACTIVE) */
    public function scopeAktif($query)
    {
        return $query->where('status', StatusTahunAjaran::ACTIVE->value);
    }

    /** @deprecated Pakai scopeStatus(StatusTahunAjaran::ARCHIVED) */
    public function scopeArsip($query)
    {
        return $query->where('status', StatusTahunAjaran::ARCHIVED->value);
    }

    public function scopeAktifDanBelumArsip($query)
    {
        return $query->whereNotIn('status', [
            StatusTahunAjaran::ARCHIVED->value,
        ])->whereNull('deleted_at');
    }

    /**
     * Filter berdasarkan satu atau lebih status.
     *
     * Contoh:
     *   TahunAjaran::status(StatusTahunAjaran::ACTIVE)->get()
     *   TahunAjaran::status([StatusTahunAjaran::DRAFT, StatusTahunAjaran::UNDER_REVIEW])->get()
     */
    public function scopeStatus($query, StatusTahunAjaran|array $status)
    {
        $values = is_array($status)
            ? array_map(fn($s) => $s->value, $status)
            : [$status->value];

        return $query->whereIn('status', $values);
    }
}