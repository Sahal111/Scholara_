<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Struktur kurikulum: satu baris = (implementasi × tingkat × program × mapel) + alokasi JP.
 *
 * Implementasi = baris kurikulum_tahun_ajarans (sekolah + kurikulum + tahun ajaran).
 * program_pendidikan_id NULL = berlaku untuk semua program.
 *
 * Tanpa SoftDeletes (lihat migration 2026_10_04_000002 untuk alasannya).
 *
 * @property int         $id
 * @property string      $ulid
 * @property int         $school_id
 * @property int         $kurikulum_tahun_ajaran_id
 * @property int         $tingkat
 * @property int|null    $program_pendidikan_id
 * @property int         $mapel_id
 * @property string|null $kelompok
 * @property int         $alokasi_jp_minggu
 * @property int|null    $alokasi_jp_tahun
 * @property string      $jenis_komponen
 * @property bool        $is_wajib
 * @property int|null    $urutan_rapor
 */
class KurikulumStruktur extends Model
{
    use HasSchoolScope;

    /** Nilai yang diterima untuk jenis_komponen (divalidasi di Request, bukan ENUM DB). */
    public const JENIS_KOMPONEN = [
        'intrakurikuler',
        'kokurikuler',
        'ekstrakurikuler',
        'muatan_lokal',
        'lainnya',
    ];

    protected $table = 'kurikulum_strukturs';

    protected $fillable = [
        // school_id diisi otomatis oleh HasSchoolScope
        'ulid',
        'kurikulum_tahun_ajaran_id',
        'tingkat',
        'program_pendidikan_id',
        'mapel_id',
        'kelompok',
        'alokasi_jp_minggu',
        'alokasi_jp_tahun',
        'jenis_komponen',
        'is_wajib',
        'urutan_rapor',
        // Audit columns TIDAK di $fillable — di-set otomatis via boot()
    ];

    protected $hidden = [
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tingkat' => 'integer',
        'alokasi_jp_minggu' => 'integer',
        'alokasi_jp_tahun' => 'integer',
        'is_wajib' => 'boolean',
        'urutan_rapor' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model) {
            $model->ulid ??= (string) Str::ulid();
            $model->created_by = auth()->id();
            $model->updated_by = auth()->id();
        });

        static::updating(function (self $model) {
            $model->updated_by = auth()->id();
        });
    }

    // ── Relasi ──────────────────────────────────────────────

    public function mapel(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id')->withTrashed();
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(ProgramPendidikan::class, 'program_pendidikan_id')->withTrashed();
    }
}
