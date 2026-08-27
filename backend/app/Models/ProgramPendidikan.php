<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use App\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model untuk Program Pendidikan — mendukung hierarki multi-jenjang:
 *   SMK  : Bidang Keahlian → Program Keahlian → Konsentrasi Keahlian
 *   SMA  : Peminatan
 *   SD/MI, SMP/MTs: tidak memakai program (nullable di kelas)
 *
 * @property int         $id
 * @property int         $school_id
 * @property int|null    $parent_id
 * @property string      $ulid
 * @property string      $nama
 * @property string|null $kode
 * @property string      $jenis           bidang_keahlian|program_keahlian|konsentrasi_keahlian|peminatan|umum
 * @property string      $jenjang_sasaran SD|MI|SMP|MTs|SMA|MA|SMK|MAK|semua
 * @property string|null $deskripsi
 * @property bool        $is_active
 */
class ProgramPendidikan extends Model
{
    use SoftDeletes, HasSchoolScope, HasUlid;

    protected $table = 'program_pendidikans';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        // school_id diisi otomatis oleh HasSchoolScope
        'parent_id',
        'nama',
        'kode',
        'jenis',
        'jenjang_sasaran',
        'deskripsi',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ── Konstanta ────────────────────────────────────────────────

    /** Jenis program mengikuti nomenklatur Kemdikbud */
    const JENIS = [
        'bidang_keahlian',
        'program_keahlian',
        'konsentrasi_keahlian',
        'peminatan',
        'umum',
    ];

    /** Label tampilan untuk UI */
    const JENIS_LABEL = [
        'bidang_keahlian' => 'Bidang Keahlian',
        'program_keahlian' => 'Program Keahlian',
        'konsentrasi_keahlian' => 'Konsentrasi Keahlian',
        'peminatan' => 'Peminatan',
        'umum' => 'Umum',
    ];

    const JENJANG = [
        'SD',
        'MI',
        'SMP',
        'MTs',
        'SMA',
        'MA',
        'SMK',
        'MAK',
        'semua',
    ];

    // ── Scopes ───────────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    /** Hanya node root (tidak punya parent) */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /** Filter berdasarkan jenis */
    public function scopeJenis($query, string $jenis)
    {
        return $query->where('jenis', $jenis);
    }

    // ── Relasi ───────────────────────────────────────────────────

    /** Parent program (misal: Program Keahlian → Bidang Keahlian) */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ProgramPendidikan::class, 'parent_id');
    }

    /** Child programs (misal: Bidang Keahlian → Program Keahlian[]) */
    public function children(): HasMany
    {
        return $this->hasMany(ProgramPendidikan::class, 'parent_id');
    }

    /**
     * Semua turunan secara rekursif (eager load via nested children).
     * Gunakan dengan ->with('descendantsTree') untuk tampilan hierarki.
     */
    public function descendantsTree(): HasMany
    {
        return $this->children()->with('descendantsTree');
    }

    /** Kelas yang menggunakan program ini */
    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class, 'program_pendidikan_id');
    }

    /** Mata pelajaran yang khusus program ini (NULL = mapel umum) */
    public function mapels(): HasMany
    {
        return $this->hasMany(MataPelajaran::class, 'program_pendidikan_id');
    }

    // ── Accessor ─────────────────────────────────────────────────

    /** Label jenis yang human-readable */
    public function getJenisLabelAttribute(): string
    {
        return self::JENIS_LABEL[$this->jenis] ?? $this->jenis;
    }
}