<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model untuk tabel activity_logs.
 *
 * Cara pakai — gunakan static helper log() daripada ::create() langsung:
 *
 *   ActivityLog::log('create', 'siswa', $siswa->id, 'Siswa baru ditambahkan');
 *   ActivityLog::log('update', 'guru', $guru->id, 'Data diperbarui', ['old' => [...], 'new' => [...]]);
 *
 * Untuk konteks cron / Artisan (tanpa auth):
 *   ActivityLog::logSystem('cleanup', 'activity_logs', null, '500 baris diarsip', $schoolId);
 */
class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    // Hanya menyimpan created_at, tidak ada updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'school_id',
        'user_id',
        'action',
        'module',
        'subject_id',
        'keterangan',
        'changes',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    // ── Relasi ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    // ── Helper statis ─────────────────────────────────────────────────

    /**
     * Catat aktivitas — versi ringkas tanpa harus ingat semua kolom.
     *
     * @param string     $action     Jenis aksi: create|update|delete|login|logout|...
     * @param string     $module     Nama modul: siswa|guru|nilai|absensi|rapor|...
     * @param int|null   $subjectId  ID record yang diaksi
     * @param string     $keterangan Deskripsi singkat aksi
     * @param array|null $changes    Structured diff: ['old' => [...], 'new' => [...]]
     */
    public static function log(
        string $action,
        string $module,
        ?int $subjectId = null,
        string $keterangan = '',
        ?array $changes = null,
    ): static {
        $schoolId = app()->bound('current_school_id') ? app('current_school_id') : null;

        if ($schoolId === null) {
            return new static(); // skip insert, kembalikan empty model
        }

        return static::create([
            'school_id' => $schoolId,
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => $module,
            'subject_id' => $subjectId,
            'keterangan' => $keterangan,
            'changes' => $changes,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }

    /**
     * Catat aktivitas dari konteks Artisan command / cron (tanpa auth user).
     */
    public static function logSystem(
        string $action,
        string $module,
        ?int $subjectId = null,
        string $keterangan = '',
        ?int $schoolId = null,
    ): static {
        return static::create([
            'school_id' => $schoolId,
            'user_id' => null,
            'action' => $action,
            'module' => $module,
            'subject_id' => $subjectId,
            'keterangan' => $keterangan,
            'changes' => null,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Artisan Scheduler',
        ]);
    }

    // ── Query scopes ──────────────────────────────────────────────────

    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}