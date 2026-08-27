<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menggantikan tabel `jurusans` yang terlalu flat dengan `program_pendidikans`
 * yang mendukung hierarki multi-jenjang:
 *
 *   SMK  : Bidang Keahlian → Program Keahlian → Konsentrasi Keahlian (3 level)
 *   SMA  : Peminatan                                                  (1 level)
 *   MA   : Peminatan Keagamaan                                        (1 level)
 *   SD/MI, SMP/MTs: tidak memakai program (kelas.program_pendidikan_id = NULL)
 *
 * Desain self-referencing parent_id memungkinkan hierarki n-level
 * tanpa perlu tambah tabel baru saat ada jenjang baru.
 */
return new class extends Migration {
    public function up(): void
    {
        // ── 1. Lepas FK jurusan_id dari kelas & mapels ───────────────
        Schema::table('kelas', function (Blueprint $table) {
            $table->dropForeign(['jurusan_id']);
            $table->dropColumn('jurusan_id');
        });

        Schema::table('mapels', function (Blueprint $table) {
            $table->dropForeign(['jurusan_id']);
            $table->dropIndex('idx_mapels_jurusan');
            $table->dropColumn('jurusan_id');
        });

        // ── 2. Drop tabel jurusans ────────────────────────────────────
        Schema::dropIfExists('jurusans');

        // ── 3. Buat tabel program_pendidikans ─────────────────────────
        Schema::create('program_pendidikans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_id')
                ->comment('FK ke schools.id — program bersifat per-sekolah')
                ->constrained('schools')->cascadeOnDelete();

            // Self-reference: NULL = root/level-1, non-NULL = child node
            // Contoh SMK: Bidang (parent=NULL) → Program (parent=Bidang) → Konsentrasi (parent=Program)
            $table->foreignId('parent_id')
                ->nullable()
                ->comment('FK ke program_pendidikans.id. NULL=root. Mendukung hierarki n-level.')
                ->constrained('program_pendidikans')->nullOnDelete();

            $table->char('ulid', 26)->unique()->comment('Public identifier — tidak ekspos integer ID ke API');
            $table->string('nama', 150)->comment('Nama program: Teknik Komputer & Jaringan, MIPA, Rekayasa Perangkat Lunak');
            $table->string('kode', 20)->nullable()->comment('Kode singkat: TKJ, RPL, MIPA — untuk label rombel/kelas');

            // Jenis mengikuti nomenklatur Kemdikbud
            $table->enum('jenis', [
                'bidang_keahlian',       // SMK level-1: Teknologi Informasi dan Komunikasi
                'program_keahlian',      // SMK level-2: Teknik Komputer dan Informatika
                'konsentrasi_keahlian',  // SMK level-3: Rekayasa Perangkat Lunak
                'peminatan',             // SMA/MA: MIPA, IPS, Bahasa, Keagamaan
                'umum',                  // Fleksibel untuk jenjang lain / custom sekolah
            ])->comment('Jenis program mengikuti nomenklatur Kemdikbud');

            // Jenjang yang relevan — membantu UI filter, tidak hardcode di logic
            $table->enum('jenjang_sasaran', [
                'SD',
                'MI',
                'SMP',
                'MTs',
                'SMA',
                'MA',
                'SMK',
                'MAK',
                'semua',
            ])->default('semua')->comment('Jenjang sekolah yang relevan dengan program ini');

            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Kode unik per sekolah (NULL diabaikan dari unique — kode boleh kosong)
            $table->unique(['school_id', 'kode'], 'uq_program_school_kode');
            $table->index('school_id', 'idx_program_school');
            $table->index('parent_id', 'idx_program_parent');
            $table->index('jenis', 'idx_program_jenis');
            $table->index('is_active', 'idx_program_aktif');
        });

        // ── 4. Tambah program_pendidikan_id ke kelas (nullable) ──────
        Schema::table('kelas', function (Blueprint $table) {
            $table->foreignId('program_pendidikan_id')
                ->nullable()
                ->after('tingkat')
                ->comment('FK ke program_pendidikans.id. NULL = jenjang tanpa program (SD/SMP)')
                ->constrained('program_pendidikans')->nullOnDelete();

            $table->index('program_pendidikan_id', 'idx_kelas_program');
        });

        // ── 5. Tambah program_pendidikan_id ke mapels (nullable) ─────
        Schema::table('mapels', function (Blueprint $table) {
            $table->foreignId('program_pendidikan_id')
                ->nullable()
                ->after('tingkat')
                ->comment('FK ke program_pendidikans.id. NULL=mapel umum. non-NULL=khusus program tertentu')
                ->constrained('program_pendidikans')->nullOnDelete();

            $table->index('program_pendidikan_id', 'idx_mapels_program');
        });
    }

    public function down(): void
    {
        // ── Balik urutan: lepas FK dulu, baru drop/recreate ──────────

        Schema::table('mapels', function (Blueprint $table) {
            $table->dropForeign(['program_pendidikan_id']);
            $table->dropIndex('idx_mapels_program');
            $table->dropColumn('program_pendidikan_id');
        });

        Schema::table('kelas', function (Blueprint $table) {
            $table->dropForeign(['program_pendidikan_id']);
            $table->dropIndex('idx_kelas_program');
            $table->dropColumn('program_pendidikan_id');
        });

        Schema::dropIfExists('program_pendidikans');

        // Recreate jurusans (rollback ke state sebelumnya)
        Schema::create('jurusans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('nama', 100);
            $table->string('kode', 20)->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('tingkat_berlaku', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['school_id', 'kode'], 'uq_jurusans_school_kode');
            $table->index('school_id', 'idx_jurusans_school');
            $table->index('is_active', 'idx_jurusans_aktif');
        });

        Schema::table('kelas', function (Blueprint $table) {
            $table->foreignId('jurusan_id')->nullable()->after('tingkat')
                ->constrained('jurusans')->nullOnDelete();
        });

        Schema::table('mapels', function (Blueprint $table) {
            $table->foreignId('jurusan_id')->nullable()->after('tingkat')
                ->constrained('jurusans')->nullOnDelete();
            $table->index('jurusan_id', 'idx_mapels_jurusan');
        });
    }
};