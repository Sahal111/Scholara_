<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── KELAS: tambah jurusan_id + perluas tingkat ke 1-12 ──────
        Schema::table('kelas', function (Blueprint $table) {
            // jurusan_id nullable — SD/SMP tidak pakai jurusan
            $table->foreignId('jurusan_id')
                ->nullable()
                ->after('tingkat')
                ->comment('FK ke jurusans.id. NULL untuk jenjang SD/SMP yang tidak ada jurusan')
                ->constrained('jurusans')->nullOnDelete();

            // tingkat saat ini TINYINT — max 255, sudah cukup untuk 1-12.
            // Tidak perlu ubah tipe kolom.
            // Hanya update comment via DB::statement karena Blueprint tidak support changeComment tanpa Doctrine.
        });

        // ── MAPELS: tambah jurusan_id ────────────────────────────────
        Schema::table('mapels', function (Blueprint $table) {
            // NULL = mapel umum (semua jurusan pakai)
            // non-NULL = mapel spesifik jurusan (misal Fisika hanya IPA)
            $table->foreignId('jurusan_id')
                ->nullable()
                ->after('tingkat')
                ->comment('FK ke jurusans.id. NULL=mapel umum semua jurusan. non-NULL=khusus jurusan tertentu')
                ->constrained('jurusans')->nullOnDelete();

            $table->index('jurusan_id', 'idx_mapels_jurusan');
        });
    }

    public function down(): void
    {
        Schema::table('mapels', function (Blueprint $table) {
            $table->dropForeign(['jurusan_id']);
            $table->dropIndex('idx_mapels_jurusan');
            $table->dropColumn('jurusan_id');
        });

        Schema::table('kelas', function (Blueprint $table) {
            $table->dropForeign(['jurusan_id']);
            $table->dropColumn('jurusan_id');
        });
    }
};