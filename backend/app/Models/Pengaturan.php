<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;

class Pengaturan extends Model
{
    use HasSchoolScope;

    protected $table = 'pengaturans';

    // Tidak ada created_at, hanya updated_at
    public $timestamps = false;
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'school_id',
        'key',
        'value',
        'grup',
        'deskripsi',
        'updated_by',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}