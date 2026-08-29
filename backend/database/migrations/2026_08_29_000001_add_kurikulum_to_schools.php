<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom kurikulum ke tabel schools.
 *
 * Alasan kolom ini ada di schools (bukan hanya di kelas/mapels):
 *
 *   Kurikulum menentukan CARA KERJA seluruh Program Pendidikan sekolah:
 *   - SMA Kurikulum Merdeka → program jenis `mata_pelajaran_pilihan` (dipilih per siswa)
 *   - SMA K13               → program jenis `peminatan` (IPA/IPS/Bahasa per rombel)
 *   - MA Kurikulum Merdeka  → program jenis `mata_pelajaran_pilihan` + `keagamaan`
 *   - MA K13                → program jenis `peminatan` + `keagamaan`
 *   - SMK/MAK               → selalu hierarki Bidang → Program → Konsentrasi (kurikulum
 *                             tidak mengubah struktur, hanya konten)
 *
 *   Dengan menyimpan kurikulum di level sekolah, UI bisa adaptive tanpa
 *   membaca setiap kelas/mapel.
 *
 * Nilai yang tersedia:
 *   - 'Kurikulum Merdeka' : default, berlaku mulai 2022/2023 (fase transisi)
 *   - 'K13'              : Kurikulum 2013, masih banyak dipakai sekolah lama
 *   - 'Lainnya'          : Cambridge, IB, Kurikulum Khusus — tanpa restriksi fitur
 *
 * Catatan: kelas.kurikulum dan mapels.kurikulum tetap ada untuk override
 * per-kelas (sekolah bisa punya kelas K13 dan Merdeka bersamaan saat transisi).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('kurikulum', 50)
                ->default('Kurikulum Merdeka')
                ->after('jenjang')
                ->comment(
                    'Kurikulum utama sekolah. Menentukan struktur Program Pendidikan yang relevan. ' .
                    'Nilai: Kurikulum Merdeka | K13 | Lainnya'
                );

            $table->index('kurikulum', 'idx_schools_kurikulum');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropIndex('idx_schools_kurikulum');
            $table->dropColumn('kurikulum');
        });
    }
};