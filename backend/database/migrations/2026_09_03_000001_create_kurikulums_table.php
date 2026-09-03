<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Buat tabel `kurikulums` — kurikulum sebagai entitas data, bukan hardcoded enum.
 *
 * MASALAH YANG DISELESAIKAN:
 *   Sebelumnya kurikulum disimpan sebagai ENUM di tiga tabel berbeda:
 *     - mapels.kurikulum          : ENUM('Kurikulum 2013','Kurikulum Merdeka','Keduanya')
 *     - kelas.kurikulum           : ENUM('K13','Merdeka','Lainnya')
 *     - komponen_penilaians.kurikulum : ENUM('K13','Merdeka','Semua')
 *
 *   Dampak: setiap kurikulum baru dari pemerintah (misal Kurikulum Nasional 2027)
 *   memerlukan ALTER TABLE di 3+ tabel dan deploy ulang — semua tenant terdampak.
 *
 * SOLUSI:
 *   Kurikulum menjadi entitas tabel sendiri dengan dua layer:
 *     - school_id NULL     → data platform (dikelola super admin, tersedia semua sekolah)
 *     - school_id non-NULL → kurikulum custom per sekolah (Cambridge, IB, Pesantren, dll)
 *
 *   Kurikulum baru dari pemerintah → cukup INSERT row baru, tidak perlu deploy.
 *   Sekolah custom → buat kurikulum sendiri tanpa mengganggu sekolah lain.
 *
 * MULTI-KURIKULUM SEKOLAH:
 *   Satu sekolah boleh pakai lebih dari satu kurikulum sekaligus — kasus nyata:
 *   masa transisi K13 → Merdeka di mana kelas 7 pakai Merdeka, kelas 8-9 masih K13.
 *   Ini dihandle dengan kurikulum_id di level kelas (FK per baris, bukan flag per sekolah).
 *
 * REFERENSI SaaS SEJENIS:
 *   - Classter (Yunani/Global): kurikulum disimpan sebagai master data per tenant
 *   - Kindergarden (Indonesia): framework_id per kelas, bisa multi-kurikulum
 *   - PowerSchool (USA): curriculum_framework sebagai tabel referensi
 */
return new class extends Migration {
    public function up(): void
    {
        // ── 1. TABEL KURIKULUMS ──────────────────────────────────────────────────
        Schema::create('kurikulums', function (Blueprint $table) {

            $table->id();

            // school_id NULLABLE: pola shared master data Scholara
            // NULL  = kurikulum platform (tersedia semua sekolah, dikelola super admin)
            // non-NULL = kurikulum custom sekolah tertentu
            $table->foreignId('school_id')
                ->nullable()
                ->comment('NULL=platform default tersedia semua sekolah. non-NULL=custom sekolah ini.')
                ->constrained('schools')->cascadeOnDelete();

            $table->char('ulid', 26)
                ->unique()
                ->comment('Public identifier — tidak ekspos integer ID ke API');

            $table->string('nama', 100)
                ->comment('Nama lengkap: Kurikulum Merdeka, Kurikulum 2013, Cambridge IGCSE');

            $table->string('kode', 30)
                ->comment('Kode singkat unik untuk referensi internal: K13, MERDEKA, CAMBRIDGE, IB');

            // Tahun berlaku untuk tracking historis dan validasi
            $table->smallInteger('tahun_berlaku')->unsigned()
                ->comment('Tahun kurikulum mulai berlaku: 2013, 2022, 2024');

            $table->smallInteger('tahun_berakhir')->unsigned()->nullable()
                ->comment('Tahun kurikulum tidak berlaku lagi. NULL = masih aktif/berlaku');

            // Jenis kurikulum untuk logika UI adaptif
            // Nilai ini menentukan tampilan fitur: CP vs KI-KD, KKTP vs KKM, dll
            $table->enum('jenis', [
                'nasional',    // Kurikulum dari Kemdikbud/Kemenag: K13, Merdeka, KTSP
                'internasional', // Cambridge, IB, IGCSE
                'khusus',      // Kurikulum Pesantren, sekolah alam, montessori
                'custom',      // Kurikulum mandiri sekolah sendiri
            ])->default('nasional')
                ->comment('Jenis kurikulum — menentukan logika fitur yang aktif');

            // Penerbit/instansi yang mengeluarkan kurikulum
            $table->string('penerbit', 100)->nullable()
                ->comment('Kemdikbud, Kemenag, Cambridge Assessment, IBO, dll');

            $table->text('deskripsi')->nullable()
                ->comment('Deskripsi singkat kurikulum, konteks penerapan, catatan penting');

            // Metadata fleksibel untuk konfigurasi per kurikulum tanpa ALTER TABLE
            // Contoh: {"fase_model":"A-F","komponen_nilai":["formatif","sumatif"],"ada_p5":true}
            $table->json('metadata')->nullable()
                ->comment('Konfigurasi dinamis per kurikulum. Hindari logika di sini — pakai jenis.');

            $table->boolean('is_active')->default(true)
                ->comment('1=Kurikulum masih bisa dipilih. 0=Tidak tersedia untuk sekolah baru');

            // is_platform_default: kurikulum yang secara otomatis di-assign ke sekolah baru
            // Hanya boleh ada SATU per jenjang (divalidasi di service layer)
            $table->boolean('is_platform_default')->default(false)
                ->comment('1=Kurikulum default untuk sekolah baru. Hanya satu yang boleh true per jenis');

            $table->timestamps();
            $table->softDeletes();

            // Audit fields — wajib di tabel master sesuai standar Scholara
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()
                ->constrained('users')->nullOnDelete();

            // Kode unik per sekolah (NULL school_id = platform)
            // Partial unique dengan kondisi: unik per (school_id, kode) — null dikecualikan secara MySQL
            $table->unique(['school_id', 'kode'], 'uq_kurikulums_school_kode');

            // Index performa
            $table->index('school_id', 'idx_kurikulums_school');
            $table->index('jenis', 'idx_kurikulums_jenis');
            $table->index('is_active', 'idx_kurikulums_active');
            $table->index('tahun_berlaku', 'idx_kurikulums_tahun');
        });

        // ── 2. TABEL KURIKULUM_KOMPONEN_NILAIANS ────────────────────────────────
        // Komponen penilaian yang berlaku per kurikulum (menggantikan enum di komponen_penilaians)
        // Contoh: K13 punya KI-1,KI-2,KI-3,KI-4 | Merdeka punya Formatif,Sumatif,P5
        Schema::create('kurikulum_komponen_nilaians', function (Blueprint $table) {

            $table->id();
            $table->foreignId('school_id')
                ->nullable()
                ->comment('Ikut school_id dari kurikulums yang direferensikan')
                ->constrained('schools')->cascadeOnDelete();

            $table->foreignId('kurikulum_id')
                ->comment('FK ke kurikulums.id')
                ->constrained('kurikulums')->cascadeOnDelete();

            $table->string('nama', 100)
                ->comment('Nilai Formatif, Nilai Sumatif, Penilaian Akhir Semester, Projek P5');

            $table->string('kode', 20)->nullable()
                ->comment('Kode singkat: NF, NS, PAS, P5');

            $table->enum('kategori', [
                'pengetahuan',    // Kognitif: tugas, ulangan, kuis
                'keterampilan',   // Psikomotorik: praktik, portofolio
                'sikap',          // Afektif: spiritual (KI-1), sosial (KI-2)
                'projek',         // P5 Kurikulum Merdeka / P2RA Kemenag
                'ekstrakurikuler',
                'lainnya',
            ])->comment('Kategori besar komponen — menentukan cara tampil di rapor');

            $table->decimal('bobot_persen', 5, 2)->nullable()
                ->comment('Bobot dalam persen untuk nilai akhir. NULL = tidak berkontribusi ke angka');

            $table->unsignedTinyInteger('urutan')
                ->default(0)
                ->comment('Urutan tampil di UI dan rapor');

            $table->boolean('is_wajib')->default(true)
                ->comment('1=Wajib diisi guru. 0=Opsional');

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('kurikulum_id', 'idx_kurkomp_kurikulum');
            $table->index('school_id', 'idx_kurkomp_school');
        });

        // ── 3. SEED DATA PLATFORM DEFAULT ───────────────────────────────────────
        // Kurikulum nasional yang tersedia untuk semua sekolah (school_id = NULL)
        $now = now();

        $kurikulums = [
            [
                'school_id' => null,
                'ulid' => \Illuminate\Support\Str::ulid(),
                'nama' => 'Kurikulum 2013',
                'kode' => 'K13',
                'tahun_berlaku' => 2013,
                'tahun_berakhir' => 2024,
                'jenis' => 'nasional',
                'penerbit' => 'Kemdikbud',
                'deskripsi' => 'Kurikulum berbasis Kompetensi Inti (KI) dan Kompetensi Dasar (KD). Masih digunakan sekolah dalam masa transisi.',
                'metadata' => json_encode([
                    'model_penilaian' => 'KI-KD',
                    'ada_pts' => true,
                    'ada_pas' => true,
                    'predikat_model' => 'A-D',
                ]),
                'is_active' => true,
                'is_platform_default' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'school_id' => null,
                'ulid' => \Illuminate\Support\Str::ulid(),
                'nama' => 'Kurikulum Merdeka',
                'kode' => 'MERDEKA',
                'tahun_berlaku' => 2022,
                'tahun_berakhir' => null,
                'jenis' => 'nasional',
                'penerbit' => 'Kemdikbud',
                'deskripsi' => 'Kurikulum berbasis Capaian Pembelajaran (CP) per fase. Menekankan diferensiasi, projek P5, dan profil pelajar Pancasila.',
                'metadata' => json_encode([
                    'model_penilaian' => 'CP-TP',
                    'ada_fase' => true,
                    'fase_model' => 'A-F',
                    'ada_p5' => true,
                    'predikat_model' => 'SB-PB',
                ]),
                'is_active' => true,
                'is_platform_default' => true, // default untuk sekolah baru
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'school_id' => null,
                'ulid' => \Illuminate\Support\Str::ulid(),
                'nama' => 'Cambridge IGCSE / A-Level',
                'kode' => 'CAMBRIDGE',
                'tahun_berlaku' => 2000,
                'tahun_berakhir' => null,
                'jenis' => 'internasional',
                'penerbit' => 'Cambridge Assessment International Education',
                'deskripsi' => 'Kurikulum internasional Cambridge untuk sekolah bertaraf internasional.',
                'metadata' => json_encode([
                    'model_penilaian' => 'grade-letter',
                    'skala_nilai' => 'A*-G',
                ]),
                'is_active' => true,
                'is_platform_default' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'school_id' => null,
                'ulid' => \Illuminate\Support\Str::ulid(),
                'nama' => 'International Baccalaureate (IB)',
                'kode' => 'IB',
                'tahun_berlaku' => 1968,
                'tahun_berakhir' => null,
                'jenis' => 'internasional',
                'penerbit' => 'International Baccalaureate Organization',
                'deskripsi' => 'Kurikulum IB untuk PYP, MYP, dan DP. Digunakan sekolah internasional.',
                'metadata' => json_encode([
                    'model_penilaian' => 'IB-criteria',
                    'ada_cas' => true,
                ]),
                'is_active' => true,
                'is_platform_default' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('kurikulums')->insert($kurikulums);

        // Seed komponen nilai untuk K13 dan Merdeka
        $k13Id = DB::table('kurikulums')->where('kode', 'K13')->value('id');
        $merdekaId = DB::table('kurikulums')->where('kode', 'MERDEKA')->value('id');

        DB::table('kurikulum_komponen_nilaians')->insert([
            // K13
            ['school_id' => null, 'kurikulum_id' => $k13Id, 'nama' => 'Pengetahuan (KI-3)', 'kode' => 'KI3', 'kategori' => 'pengetahuan', 'bobot_persen' => 50.00, 'urutan' => 1, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $k13Id, 'nama' => 'Keterampilan (KI-4)', 'kode' => 'KI4', 'kategori' => 'keterampilan', 'bobot_persen' => 30.00, 'urutan' => 2, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $k13Id, 'nama' => 'Sikap Spiritual', 'kode' => 'KI1', 'kategori' => 'sikap', 'bobot_persen' => null, 'urutan' => 3, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $k13Id, 'nama' => 'Sikap Sosial', 'kode' => 'KI2', 'kategori' => 'sikap', 'bobot_persen' => null, 'urutan' => 4, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $k13Id, 'nama' => 'Ekstrakurikuler', 'kode' => 'EKSKUL', 'kategori' => 'ekstrakurikuler', 'bobot_persen' => null, 'urutan' => 5, 'is_wajib' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Kurikulum Merdeka
            ['school_id' => null, 'kurikulum_id' => $merdekaId, 'nama' => 'Nilai Formatif', 'kode' => 'NF', 'kategori' => 'pengetahuan', 'bobot_persen' => 40.00, 'urutan' => 1, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $merdekaId, 'nama' => 'Nilai Sumatif', 'kode' => 'NS', 'kategori' => 'pengetahuan', 'bobot_persen' => 40.00, 'urutan' => 2, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $merdekaId, 'nama' => 'Projek P5', 'kode' => 'P5', 'kategori' => 'projek', 'bobot_persen' => 20.00, 'urutan' => 3, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $merdekaId, 'nama' => 'Sikap', 'kode' => 'SIKAP', 'kategori' => 'sikap', 'bobot_persen' => null, 'urutan' => 4, 'is_wajib' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['school_id' => null, 'kurikulum_id' => $merdekaId, 'nama' => 'Ekstrakurikuler', 'kode' => 'EKSKUL', 'kategori' => 'ekstrakurikuler', 'bobot_persen' => null, 'urutan' => 5, 'is_wajib' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('kurikulum_komponen_nilaians');
        Schema::dropIfExists('kurikulums');
    }
};