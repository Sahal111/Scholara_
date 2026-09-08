<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use App\Traits\HasUlid;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes, HasSchoolScope, HasUlid;

    protected $table = 'users';

    protected $fillable = [
        'global_user_id',
        'school_id',
        'ulid',
        'name',
        'username',
        'email',
        'password',
        'foto',
        'is_active',
        'last_login_at',
        'last_login_ip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    // ── Global User Relation ─────────────────────────────────

    public function globalUser(): BelongsTo
    {
        return $this->belongsTo(GlobalUser::class, 'global_user_id');
    }

    // ── Roles (many-to-many) ─────────────────────────────────

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id')
            ->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)
            ->withPivot('bidang'); // bidang_wakasek: Kurikulum|Kesiswaan|Sarpras|Humas
    }

    public function getRoleSlug(): ?string
    {
        $slugs = $this->roles->pluck('slug')->toArray();
        foreach (['operator', 'kepsek', 'wakasek', 'guru', 'guru_bk', 'wali_kelas', 'bendahara', 'admin_keuangan', 'tata_usaha', 'pustakawan', 'admin_ppdb', 'ortu', 'siswa'] as $role) {
            if (in_array($role, $slugs)) {
                return $role;
            }
        }
        return $this->roles->first()?->slug;
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles->contains('slug', $slug);
    }

    public function hasPermission(string $slug): bool
    {
        return $this->getAllPermissions()->contains('slug', $slug);
    }

    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        if (!$this->relationLoaded('roles') || $this->roles->isEmpty()) {
            $this->load([
                'roles' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class),
                'roles.permissions' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class),
            ]);
        }

        return $this->roles
            ->flatMap(fn($role) => $role->permissions)
            ->unique('slug');
    }

    // ── Local Scope ──────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    // ── Accessor ─────────────────────────────────────────────

    public function getNamaLengkapAttribute(): string
    {
        return $this->name ?? '';
    }

    // ── Relasi profil ────────────────────────────────────────

    public function guru()
    {
        return $this->hasOne(Guru::class, 'user_id');
    }

    public function orangTua()
    {
        return $this->hasMany(OrangTua::class, 'user_id');
    }

    public function operatorProfile()
    {
        return $this->hasOne(OperatorProfile::class, 'user_id');
    }

    public function bendaharaProfile()
    {
        return $this->hasOne(UserBendahara::class, 'user_id');
    }

    public function waliKelasProfile()
    {
        return $this->hasOneThrough(UserWaliKelas::class, Guru::class, 'user_id', 'guru_id', 'id', 'id');
    }
}