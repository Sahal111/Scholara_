<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GuruMutasi extends Model
{
    use SoftDeletes;

    protected $table = 'guru_mutasis';

    protected $fillable = [
        'guru_id',
        'jenis_mutasi',
        'jenis_keluar',
        'status_sebelum',
        'status_setelah',
        'sekolah_asal',
        'npsn_asal',
        'sekolah_tujuan',
        'npsn_tujuan',
        'tanggal_mutasi',
        'tmt_mutasi',
        'jabatan_sebelum',
        'jabatan_sesudah',
        'status_kepegawaian',
        'no_sk',
        'tanggal_sk',
        'instansi_penerbit_sk',
        'alasan_mutasi',
        'file_sk',
        'keterangan',
        'tanggal_berakhir',
        'is_locked',        // ← baru
    ];

    protected $casts = [
        'tanggal_mutasi' => 'date',
        'tmt_mutasi' => 'date',
        'tanggal_sk' => 'date',
        'tanggal_berakhir' => 'date',
        'is_locked' => 'boolean', // ← baru
    ];

    public function guru()
    {
        return $this->belongsTo(Guru::class, 'guru_id');
    }
}