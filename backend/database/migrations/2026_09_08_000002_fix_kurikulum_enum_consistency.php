<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Samakan nilai enum kurikulum antara tabel kelas dan mapels.
 *
 * Sebelumnya:
 *   kelas.kurikulum  → ['Kurikulum 2013', 'Kurikulum Merdeka', 'Keduanya']
 *   mapels.kurikulum → ['K13', 'Merdeka', 'Lainnya']
 *
 * Setelah fix (standar tunggal):
 *   kelas.kurikulum  → ['K13', 'Merdeka', 'Keduanya']
 *   mapels.kurikulum → ['K13', 'Merdeka', 'Lainnya']   ← tidak berubah
 *
 * Catatan: mapels.kurikulum sudah menggunakan nilai singkat ('K13','Merdeka')
 * sehingga tidak perlu diubah. Hanya kelas yang perlu disesuaikan.
 */
return new class extends Migration {
    public function up(): void
    {
        // MySQL tidak bisa langsung ALTER ENUM dengan nilai baru jika ada
        // row yang pakai nilai lama. Lakukan dalam 3 langkah:
        // 1. Ubah ke string sementara
        // 2. Migrasi data lama → nilai baru
        // 3. Ubah kembali ke ENUM dengan nilai standar

        // Step 1: ubah ke varchar sementara agar bisa menampung nilai lama & baru
        \DB::statement("ALTER TABLE `kelas` MODIFY `kurikulum` VARCHAR(30) NOT NULL DEFAULT 'K13'");

        // Step 2: migrasi nilai lama → baru
        \DB::table('kelas')->where('kurikulum', 'Kurikulum 2013')->update(['kurikulum' => 'K13']);
        \DB::table('kelas')->where('kurikulum', 'Kurikulum Merdeka')->update(['kurikulum' => 'Merdeka']);
        // 'Keduanya' tetap sama — tidak perlu diubah

        // Step 3: kunci kembali ke ENUM standar
        \DB::statement("ALTER TABLE `kelas` MODIFY `kurikulum` ENUM('K13','Merdeka','Keduanya') NOT NULL DEFAULT 'K13'");
    }

    public function down(): void
    {
        // Kembalikan ke nilai lama
        \DB::statement("ALTER TABLE `kelas` MODIFY `kurikulum` VARCHAR(30) NOT NULL DEFAULT 'Kurikulum 2013'");

        \DB::table('kelas')->where('kurikulum', 'K13')->update(['kurikulum' => 'Kurikulum 2013']);
        \DB::table('kelas')->where('kurikulum', 'Merdeka')->update(['kurikulum' => 'Kurikulum Merdeka']);

        \DB::statement("ALTER TABLE `kelas` MODIFY `kurikulum` ENUM('Kurikulum 2013','Kurikulum Merdeka','Keduanya') NOT NULL DEFAULT 'Kurikulum 2013'");
    }
};