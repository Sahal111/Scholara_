<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom `subtipe` ke tabel schools.
 *
 * Latar belakang:
 *   Kolom `jenis` (MA, SMA, SMK, dll) menangkap tipe kelembagaan utama,
 *   tapi tidak cukup untuk membedakan varian MA yang memiliki program dan
 *   kebutuhan UI yang berbeda secara signifikan:
 *
 *   MA reguler       → peminatan/mapel pilihan + keagamaan (sudah ada)
 *   MAN IC           → riset, sains, teknologi, keimanan (program sains kuat)
 *   MAN PK           → keagamaan padat, kitab kuning, Bahasa Arab/Inggris
 *   MAN Plus Keterampilan → seperti MA reguler DITAMBAH hierarki vokasi
 *                           (Bidang → Program → Konsentrasi, mirip SMK)
 *
 *   Tanpa `subtipe`, operator MAN Plus tidak bisa membuat program vokasi
 *   bertingkat karena UI tidak menampilkan tab Bidang/Program/Konsentrasi
 *   untuk jenis MA.
 *
 * Desain:
 *   - NULL = sekolah reguler tanpa subtipe khusus (default, backward compatible)
 *   - Hanya berlaku untuk MA saat ini, tapi dibuat generik (nullable string)
 *     agar bisa dipakai jenis lain di masa depan tanpa migrasi baru
 *   - Tidak mengubah logika yang sudah ada — kode lama yang tidak kenal
 *     subtipe tetap berjalan normal (NULL dianggap reguler)
 *
 * Nilai valid (dikontrol via konstanta School::SUBTIPE_*):
 *   NULL               → reguler (default)
 *   'man_ic'           → MAN Insan Cendekia
 *   'man_pk'           → MAN Program Keagamaan
 *   'man_plus_vokasi'  → MAN Plus Keterampilan (vokasi)
 *
 * Sumber: Peraturan Menteri Agama, nomenklatur Kemenag.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('subtipe', 50)
                ->nullable()
                ->default(null)
                ->after('jenis')
                ->comment(
                    'Varian spesifik sekolah dalam jenis yang sama. ' .
                    'NULL = reguler. ' .
                    'Nilai: man_ic | man_pk | man_plus_vokasi. ' .
                    'Lihat School::SUBTIPE_* untuk konstanta.'
                );

            $table->index(['jenis', 'subtipe'], 'idx_schools_jenis_subtipe');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropIndex('idx_schools_jenis_subtipe');
            $table->dropColumn('subtipe');
        });
    }
};