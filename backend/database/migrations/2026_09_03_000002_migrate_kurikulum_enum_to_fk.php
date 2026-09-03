<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migrasi kolom kurikulum ENUM ke FK kurikulum_id di tiga tabel:
 *   - kelas.kurikulum              ENUM('K13','Merdeka','Lainnya')
 *   - mapels.kurikulum             VARCHAR (setelah fix di 2026_08_07)
 *   - komponen_penilaians.kurikulum ENUM('K13','Merdeka','Semua')
 *
 * STRATEGI MIGRASI (zero breaking change):
 *   1. Tambah kolom kurikulum_id (nullable) di setiap tabel
 *   2. Isi kurikulum_id berdasarkan nilai ENUM lama (mapping)
 *   3. Buat FK constraint
 *   4. Kolom lama TIDAK langsung dihapus — dijaga nullable
 *      sebagai fallback sampai semua kode frontend & backend diupdate
 *   (Penghapusan kolom lama di migration terpisah setelah semua kode siap)
 *
 * MAPPING ENUM → kurikulum_id:
 *   'K13' / 'Kurikulum 2013' / 'Kurikulum Merdeka' (sebagian) → ID dari tabel kurikulums
 *   'Merdeka'                   → kurikulum MERDEKA
 *   'Lainnya' / 'Semua' / NULL  → kurikulum MERDEKA (default platform)
 */
return new class extends Migration {
    public function up(): void
    {
        // Ambil ID kurikulum platform (school_id = NULL)
        $k13Id = DB::table('kurikulums')->whereNull('school_id')->where('kode', 'K13')->value('id');
        $merdekaId = DB::table('kurikulums')->whereNull('school_id')->where('kode', 'MERDEKA')->value('id');

        if (!$k13Id || !$merdekaId) {
            throw new \RuntimeException(
                'Kurikulum platform default (K13, MERDEKA) belum ada. ' .
                'Jalankan migration 2026_09_03_000001_create_kurikulums_table.php terlebih dahulu.'
            );
        }

        // ── 1. TABEL KELAS ───────────────────────────────────────────────────────
        Schema::table('kelas', function (Blueprint $table) {
            $table->foreignId('kurikulum_id')
                ->nullable()
                ->after('kurikulum')
                ->comment('FK ke kurikulums.id. Menggantikan kolom kurikulum ENUM')
                ->constrained('kurikulums')->restrictOnDelete();

            $table->index('kurikulum_id', 'idx_kelas_kurikulum_id');
        });

        // Isi kurikulum_id dari nilai enum lama
        DB::table('kelas')->whereIn('kurikulum', ['K13', 'Kurikulum 2013'])->update(['kurikulum_id' => $k13Id]);
        DB::table('kelas')->whereIn('kurikulum', ['Merdeka', 'Kurikulum Merdeka'])->update(['kurikulum_id' => $merdekaId]);
        DB::table('kelas')->whereNull('kurikulum_id')->update(['kurikulum_id' => $merdekaId]); // fallback

        // ── 2. TABEL MAPELS ──────────────────────────────────────────────────────
        Schema::table('mapels', function (Blueprint $table) {
            $table->foreignId('kurikulum_id')
                ->nullable()
                ->after('kurikulum')
                ->comment('FK ke kurikulums.id. NULL = berlaku untuk semua kurikulum')
                ->constrained('kurikulums')->nullOnDelete();

            $table->index('kurikulum_id', 'idx_mapels_kurikulum_id');
        });

        // NULL = berlaku semua kurikulum (logika "Keduanya" / "Semua" yang lama)
        DB::table('mapels')->whereIn('kurikulum', ['K13', 'Kurikulum 2013'])->update(['kurikulum_id' => $k13Id]);
        DB::table('mapels')->whereIn('kurikulum', ['Merdeka', 'Kurikulum Merdeka'])->update(['kurikulum_id' => $merdekaId]);
        // 'Keduanya' / NULL → kurikulum_id tetap NULL (berarti berlaku semua kurikulum)

        // ── 3. TABEL KOMPONEN_PENILAIANS ─────────────────────────────────────────
        Schema::table('komponen_penilaians', function (Blueprint $table) {
            $table->foreignId('kurikulum_id')
                ->nullable()
                ->after('kurikulum')
                ->comment('FK ke kurikulums.id. NULL = berlaku semua kurikulum')
                ->constrained('kurikulums')->nullOnDelete();

            $table->index('kurikulum_id', 'idx_komponen_kurikulum_id');
        });

        DB::table('komponen_penilaians')->whereIn('kurikulum', ['K13'])->update(['kurikulum_id' => $k13Id]);
        DB::table('komponen_penilaians')->whereIn('kurikulum', ['Merdeka'])->update(['kurikulum_id' => $merdekaId]);
        // 'Semua' / NULL → kurikulum_id tetap NULL (berlaku semua kurikulum)
    }

    public function down(): void
    {
        // Hapus kolom baru dan index — kolom lama sudah ada, tidak perlu restore
        Schema::table('komponen_penilaians', function (Blueprint $table) {
            $table->dropForeign(['kurikulum_id']);
            $table->dropIndex('idx_komponen_kurikulum_id');
            $table->dropColumn('kurikulum_id');
        });

        Schema::table('mapels', function (Blueprint $table) {
            $table->dropForeign(['kurikulum_id']);
            $table->dropIndex('idx_mapels_kurikulum_id');
            $table->dropColumn('kurikulum_id');
        });

        Schema::table('kelas', function (Blueprint $table) {
            $table->dropForeign(['kurikulum_id']);
            $table->dropIndex('idx_kelas_kurikulum_id');
            $table->dropColumn('kurikulum_id');
        });
    }
};