<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Longgarkan ENUM jenis & jenjang_sasaran menjadi VARCHAR.
 * Nilai lama tetap utuh. Daftar nilai yang sah kini dijaga di aplikasi
 * (ProgramPendidikan::JENIS / JENJANG) dan tabel kurikulum_jenis_programs,
 * sehingga jenis baru tidak lagi butuh ALTER TABLE.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("
            ALTER TABLE `program_pendidikans`
            MODIFY COLUMN `jenis` VARCHAR(40) NOT NULL
            COMMENT 'Jenis program; daftar sah dijaga aplikasi + kurikulum_jenis_programs'
        ");

        DB::statement("
            ALTER TABLE `program_pendidikans`
            MODIFY COLUMN `jenjang_sasaran` VARCHAR(20) NOT NULL DEFAULT 'semua'
            COMMENT 'Jenjang sekolah yang relevan; daftar sah dijaga aplikasi'
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Gagal jika sudah ada nilai di luar daftar lama.
        DB::statement("
            ALTER TABLE `program_pendidikans`
            MODIFY COLUMN `jenis` ENUM(
                'bidang_keahlian','program_keahlian','konsentrasi_keahlian',
                'peminatan','mata_pelajaran_pilihan','keagamaan','umum'
            ) NOT NULL
        ");

        DB::statement("
            ALTER TABLE `program_pendidikans`
            MODIFY COLUMN `jenjang_sasaran` ENUM(
                'SD','MI','SMP','MTs','SMA','MA','SMK','MAK','semua'
            ) NOT NULL DEFAULT 'semua'
        ");
    }
};