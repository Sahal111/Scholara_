<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lebarkan kolom yang dienkripsi lewat cast EncryptedString.
 *
 * Masalah: kolom ini dibuat string(16)/(18)/(10) untuk angka polos, padahal
 * model menyimpan payload terenkripsi (~230 karakter). Akibatnya insert gagal
 * "Data too long" di database yang dibangun dari migration saja.
 *
 * Dipakai VARCHAR(512), bukan TEXT, supaya index/unique yang masih ada tetap
 * valid (TEXT tidak bisa di-index tanpa panjang prefix). 512 x 4 byte (utf8mb4)
 * = 2048 byte, masih di bawah batas 3072 byte InnoDB.
 *
 * Melebarkan kolom aman untuk data yang sudah ada. down() sengaja kosong:
 * menyempitkan lagi akan memotong data terenkripsi.
 */
return new class extends Migration {
    /** tabel => daftar kolom yang dienkripsi */
    private const KOLOM = [
        'gurus' => ['nik', 'no_kk', 'nip', 'nuptk'],
        'siswas' => ['nik', 'no_kk', 'nisn'],
        'orang_tuas' => ['nik', 'no_kk'],
        'global_users' => ['two_factor_secret'],
    ];

    public function up(): void
    {
        foreach (self::KOLOM as $tabel => $kolomList) {
            if (!Schema::hasTable($tabel)) {
                continue;
            }

            foreach ($kolomList as $kolom) {
                if (!Schema::hasColumn($tabel, $kolom)) {
                    continue;
                }

                Schema::table($tabel, function (Blueprint $table) use ($kolom) {
                    $table->string($kolom, 512)->nullable()->change();
                });
            }
        }
    }

    public function down(): void
    {
        // Tidak di-rollback: menyempitkan kolom akan memotong payload terenkripsi.
    }
};