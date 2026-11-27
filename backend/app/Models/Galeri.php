<?php

namespace App\Models;

use App\Traits\HasSchoolScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Galeri extends Model
{
    use SoftDeletes, HasSchoolScope;
    protected $table = 'galeris';

    protected $fillable = [
        'school_id',
        'judul',
        'deskripsi',
        'kategori',
        'foto',
        'uploaded_by',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}