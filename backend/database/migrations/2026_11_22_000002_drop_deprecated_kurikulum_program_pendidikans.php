<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel pivot lama kurikulum_program_pendidikans sudah digantikan
 * kurikulum_jenis_programs. Hanya dibuang jika memang kosong; bila ada
 * baris tersisa, dibiarkan agar tidak ada data yang hilang.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('kurikulum_program_pendidikans')) {
            return;
        }

        if (DB::table('kurikulum_program_pendidikans')->count() > 0) {
            return;
        }

        Schema::drop('kurikulum_program_pendidikans');
    }

    public function down(): void
    {
        // Sengaja kosong: tabel ini deprecated. Skema aslinya ada di
        // 2026_09_03_000004_create_kurikulum_pivot_tables.php bila perlu dipulihkan manual.
    }
};