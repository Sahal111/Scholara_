?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TahunAjaran extends Model
{
    use SoftDeletes, HasSchoolScope;

    protected $table = 'tahun_ajarans';

    protected $fillable = [
        'school_id',
        'tahun',
        'is_active',
        'is_archived',
        'archived_at',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
    ];

    // ── Relasi ──────────────────────────────────────────────

    public function semesters()
    {
        return $this->hasMany(Semester::class, 'tahun_ajaran_id');
    }

    public function kelas()
    {
        return $this->hasMany(Kelas::class, 'tahun_ajaran_id');
    }

    // ── Scopes ──────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeArsip($query)
    {
        return $query->where('is_archived', true);
    }

    public function scopeAktifDanBelumArsip($query)
    {
        return $query->where('is_archived', false)->whereNull('deleted_at');
    }
}