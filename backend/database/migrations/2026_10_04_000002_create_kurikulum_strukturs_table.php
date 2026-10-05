<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Struktur kurikulum: mapel apa, untuk tingkat/program apa, berapa JP.
 *
 * Satu baris = (implementasi kurikulum × tingkat × program × mapel) + alokasi.
 *
 *   - implementasi  = kurikulum_tahun_ajarans (sekolah + kurikulum + tahun ajaran)
 *   - program NULL  = berlaku untuk semua program (mapel umum / jenjang tanpa program)
 *   - mapel         = master mapels (tidak diduplikasi per kurikulum)
 *
 * Kenapa TANPA soft delete: data konfigurasi dengan unique identitas; baris yang
 * dihapus tidak boleh menghalangi penambahan ulang mapel yang sama. Riwayat
 * perubahan dicatat lewat activity_logs + kolom created_by/updated_by.
 *
 * jenis_komponen & kelompok sengaja VARCHAR (bukan ENUM) agar bisa berkembang
 * mengikuti regulasi tanpa ALTER TABLE.
 *
 * Unique identitas dibuat NULL-safe (functional index, MySQL >= 8.0.13) karena
 * program_pendidikan_id boleh NULL dan UNIQUE biasa tidak mencegah duplikat NULL.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('kurikulum_strukturs')) {
            Schema::create('kurikulum_strukturs', function (Blueprint $table) {
                $table->id();
                $table->char('ulid', 26)->unique('uq_kurstruk_ulid')
                    ->comment('Public identifier — pakai ini di URL, bukan integer id');

                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('kurikulum_tahun_ajaran_id')
                    ->constrained('kurikulum_tahun_ajarans')->cascadeOnDelete();

                $table->unsignedTinyInteger('tingkat')->comment('Tingkat kelas, mis. 7, 10');
                $table->foreignId('program_pendidikan_id')->nullable()
                    ->constrained('program_pendidikans')->restrictOnDelete()
                    ->comment('NULL = berlaku untuk semua program');
                $table->foreignId('mapel_id')->constrained('mapels')->restrictOnDelete();

                $table->string('kelompok', 50)->nullable();
                $table->unsignedTinyInteger('alokasi_jp_minggu');
                $table->unsignedSmallInteger('alokasi_jp_tahun')->nullable();
                $table->string('jenis_komponen', 30)->default('intrakurikuler');
                $table->boolean('is_wajib')->default(true);
                $table->unsignedSmallInteger('urutan_rapor')->nullable();

                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(
                    ['school_id', 'kurikulum_tahun_ajaran_id', 'tingkat'],
                    'idx_kurstruk_school_impl_tingkat'
                );
            });
        }

        $this->buatUniqueIdentitas();
    }

    public function down(): void
    {
        Schema::dropIfExists('kurikulum_strukturs');
    }

    private function buatUniqueIdentitas(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return; // functional index khusus MySQL 8
        }

        $versi = (string) DB::selectOne('SELECT VERSION() AS v')->v;
        $bersih = preg_replace('/[^0-9.].*$/', '', $versi);

        if (stripos($versi, 'mariadb') !== false || version_compare($bersih, '8.0.13', '<')) {
            throw new RuntimeException(
                "Migration ini butuh MySQL >= 8.0.13 (functional index). Versi terdeteksi: {$versi}"
            );
        }

        DB::statement(
            'CREATE UNIQUE INDEX `uq_kurstruk_identitas` ON `kurikulum_strukturs`
                (`kurikulum_tahun_ajaran_id`, `tingkat`, (COALESCE(`program_pendidikan_id`, 0)), `mapel_id`)'
        );
    }
};
