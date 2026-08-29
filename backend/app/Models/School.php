<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class School extends Model
{
    use SoftDeletes;

    protected $table = 'schools';

    protected $fillable = [
        'ulid',
        'nama',
        'npsn',
        'jenis',
        'subtipe',
        'jenjang',
        'kurikulum',
        'status',
        'trial_ends_at',
        'logo',
        'timezone',
        'locale',
    ];

    // ── Konstanta kurikulum ──────────────────────────────────

    const KURIKULUM_MERDEKA = 'Kurikulum Merdeka';
    const KURIKULUM_K13 = 'K13';
    const KURIKULUM_LAINNYA = 'Lainnya';

    // ── Konstanta jenis sekolah ──────────────────────────────

    /**
     * Jenis sekolah yang MEMILIKI program pendidikan hierarkis (SMK/MAK).
     * Struktur: Bidang Keahlian → Program Keahlian → Konsentrasi Keahlian.
     * Kurikulum tidak mengubah struktur hierarki, hanya konten.
     */
    const JENIS_DENGAN_PROGRAM_HIERARKI = ['SMK', 'MAK'];

    /**
     * Jenis sekolah menengah atas umum (SMA/MA).
     * Struktur program bergantung pada kurikulum:
     *   - Kurikulum Merdeka → mata_pelajaran_pilihan (dipilih per siswa)
     *   - K13               → peminatan (IPA/IPS/Bahasa, melekat ke rombel)
     * MA juga bisa punya program jenis `keagamaan` di kedua kurikulum.
     */
    const JENIS_MENENGAH_ATAS_UMUM = ['SMA', 'MA'];

    /**
     * Jenis sekolah tanpa program pendidikan khusus.
     * program_pendidikan_id pada kelas selalu NULL untuk jenis ini.
     */
    const JENIS_TANPA_PROGRAM = ['SD', 'MI', 'SMP', 'MTs', 'SDLB', 'SMPLB', 'SMALB', 'SLB'];

    // ── Konstanta subtipe ────────────────────────────────────

    /**
     * MAN Insan Cendekia — fokus riset, sains, teknologi, dan keimanan.
     * Struktur program: sama dengan MA reguler (peminatan/mapel pilihan + keagamaan).
     * Bedanya ada di konten program dan intensitas — bukan di struktur hierarki.
     */
    const SUBTIPE_MAN_IC = 'man_ic';

    /**
     * MAN Program Keagamaan — peminatan keagamaan super padat.
     * Pendalaman kitab kuning, Bahasa Arab & Inggris tingkat tinggi (asrama).
     * Struktur program: dominan `keagamaan`, tetap bisa punya peminatan umum.
     */
    const SUBTIPE_MAN_PK = 'man_pk';

    /**
     * MAN Plus Keterampilan (Vokasi) — MA reguler DITAMBAH program vokasi.
     * Contoh: MA + TKJ, MA + Multimedia, MA + Tata Busana, MA + Tata Boga.
     * Struktur program: peminatan/mapel pilihan + keagamaan + hierarki vokasi
     * (Bidang Keahlian → Program Keahlian → Konsentrasi Keahlian).
     * Sumber: Peraturan Menteri Agama tentang MAN Plus Keterampilan.
     */
    const SUBTIPE_MAN_PLUS_VOKASI = 'man_plus_vokasi';

    /** Semua nilai subtipe yang valid — untuk validasi FormRequest */
    const SUBTIPE_VALID = [
        self::SUBTIPE_MAN_IC,
        self::SUBTIPE_MAN_PK,
        self::SUBTIPE_MAN_PLUS_VOKASI,
    ];

    // ── Helper subtipe ───────────────────────────────────────

    /** Apakah sekolah ini MAN Plus Vokasi? */
    public function isManPlusVokasi(): bool
    {
        return $this->jenis === 'MA' && $this->subtipe === self::SUBTIPE_MAN_PLUS_VOKASI;
    }

    /** Apakah sekolah ini MAN IC? */
    public function isManIc(): bool
    {
        return $this->jenis === 'MA' && $this->subtipe === self::SUBTIPE_MAN_IC;
    }

    /** Apakah sekolah ini MAN PK? */
    public function isManPk(): bool
    {
        return $this->jenis === 'MA' && $this->subtipe === self::SUBTIPE_MAN_PK;
    }

    /**
     * Apakah sekolah ini memiliki program vokasi bertingkat?
     * True untuk SMK, MAK, dan MAN Plus Vokasi.
     */
    public function hasVokasiHierarki(): bool
    {
        return in_array($this->jenis, self::JENIS_DENGAN_PROGRAM_HIERARKI)
            || $this->isManPlusVokasi();
    }

    protected $casts = [
        'trial_ends_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (School $model) {
            $model->ulid ??= (string) Str::ulid();
        });
    }

    // ── Relasi ──────────────────────────────────────────────

    public function settings()
    {
        return $this->hasMany(SchoolSetting::class);
    }

    public function domains()
    {
        return $this->hasMany(SchoolDomain::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function roles()
    {
        return $this->hasMany(Role::class);
    }

    public function permissions()
    {
        return $this->hasMany(Permission::class);
    }

    // ── Helper ──────────────────────────────────────────────

    public function getSetting(string $key, mixed $default = null): mixed
    {
        return $this->settings->where('key', $key)->first()?->value ?? $default;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isOnTrial(): bool
    {
        return $this->status === 'trial' &&
            ($this->trial_ends_at === null || $this->trial_ends_at->isFuture());
    }

    public function isAccessible(): bool
    {
        return $this->isActive() || $this->isOnTrial();
    }
}