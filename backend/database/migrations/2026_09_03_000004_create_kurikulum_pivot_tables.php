<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Buat dua tabel pivot yang menghubungkan kurikulum dengan:
 *   1. program_pendidikans → KETAT: program hanya bisa dipilih jika kurikulumnya kompatibel
 *   2. tahun_ajarans       → HISTORIS: kurikulum mana yang berlaku di tahun ajaran tertentu
 *                            + semester mana yang berlaku untuk kurikulum itu
 *
 * KENAPA DUA TABEL TERPISAH (BUKAN SATU)?
 *   - Program ↔ Kurikulum : relasi many-to-many ABADI (tidak bergantung waktu)
 *     "Peminatan IPA hanya valid untuk K13" — ini berlaku selamanya
 *   - Kurikulum ↔ Tahun Ajaran : relasi many-to-many TEMPORAL
 *     "Tahun ajaran 2025/2026, sekolah X pakai Merdeka untuk kelas 7, K13 untuk kelas 8-9"
 *     Ini berubah tiap tahun dan perlu lacak historis
 *
 * RELASI LENGKAP SETELAH MIGRATION INI:
 *
 *   Kurikulum ←──── kurikulum_program_pendidikans ────→ ProgramPendidikan
 *       │
 *       └──── kurikulum_tahun_ajarans ────→ TahunAjaran
 *                         │
 *                         └─── (via semester_id) ──→ Semester
 *
 *   Kelas ─── kurikulum_id ──→ Kurikulum   (dipilih dari pivot yang valid)
 *   Kelas ─── program_pendidikan_id ──→ ProgramPendidikan
 *   Kelas ─── tahun_ajaran_id ──→ TahunAjaran
 *   Kelas ─── semester_id ──→ Semester
 *
 * VALIDASI YANG DIENFORCE (di service layer, bukan FK):
 *   Saat operator memilih kurikulum untuk kelas:
 *   1. Kurikulum harus ada di kurikulum_tahun_ajarans untuk tahun ajaran kelas ini
 *   2. Program pendidikan kelas harus kompatibel dengan kurikulum (via pivot)
 *
 * REFERENSI SaaS SEJENIS:
 *   - Classter: curriculum_track per academic year, program compatibility matrix
 *   - PowerSchool: course_catalog per school_year dengan framework constraint
 *   - Emis Kemdikbud: kurikulum valid per tahun pelajaran per satuan pendidikan
 */
return new class extends Migration {
    public function up(): void
    {
        // ── 1. PIVOT: KURIKULUM ↔ PROGRAM PENDIDIKAN ────────────────────────────
        //
        // Relasi abadi: program apa saja yang kompatibel dengan kurikulum tertentu.
        // Contoh data:
        //   K13     ↔ peminatan (IPA, IPS, Bahasa) — SMA/MA
        //   Merdeka ↔ mata_pelajaran_pilihan — SMA/MA
        //   K13     ↔ bidang_keahlian, program_keahlian, konsentrasi_keahlian — SMK/MAK
        //   Merdeka ↔ bidang_keahlian, program_keahlian, konsentrasi_keahlian — SMK/MAK
        //   K13     ↔ keagamaan — MA/MAN
        //   Merdeka ↔ keagamaan — MA/MAN (P2RA = versi Merdeka untuk keagamaan)
        //
        Schema::create('kurikulum_program_pendidikans', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->nullable()
                ->comment('NULL = kompatibilitas platform-level. non-NULL = override per sekolah')
                ->constrained('schools')->cascadeOnDelete();

            $table->foreignId('kurikulum_id')
                ->comment('FK ke kurikulums.id')
                ->constrained('kurikulums')->cascadeOnDelete();

            $table->foreignId('program_pendidikan_id')
                ->comment('FK ke program_pendidikans.id')
                ->constrained('program_pendidikans')->cascadeOnDelete();

            // Catatan opsional — misal: "SMK Merdeka: konsentrasi keahlian menggantikan kompetensi keahlian K13"
            $table->string('catatan', 255)->nullable()
                ->comment('Penjelasan kompatibilitas atau perbedaan implementasi');

            $table->boolean('is_active')->default(true)
                ->comment('0 = kompatibilitas ini sudah tidak berlaku (misal kebijakan berubah)');

            $table->timestamps();

            // Satu pasang kurikulum+program hanya boleh ada sekali per school
            $table->unique(
                ['school_id', 'kurikulum_id', 'program_pendidikan_id'],
                'uq_kur_prog_school'
            );

            $table->index('kurikulum_id', 'idx_kurprog_kurikulum');
            $table->index('program_pendidikan_id', 'idx_kurprog_program');
            $table->index('school_id', 'idx_kurprog_school');
        });

        // ── 2. PIVOT: KURIKULUM ↔ TAHUN AJARAN (+ SEMESTER) ────────────────────
        //
        // Relasi temporal: kurikulum mana yang dipakai sekolah pada tahun ajaran tertentu.
        // Satu sekolah bisa pakai LEBIH DARI SATU kurikulum dalam satu tahun ajaran
        // (kasus transisi K13→Merdeka yang sangat umum di Indonesia).
        //
        // Semester bersifat opsional:
        //   semester_id NULL   = kurikulum berlaku SELURUH tahun ajaran
        //   semester_id non-NULL = kurikulum berlaku untuk semester tertentu saja
        //   (kasus langka, tapi edge case ini nyata di beberapa pesantren)
        //
        Schema::create('kurikulum_tahun_ajarans', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->comment('FK ke schools.id — wajib non-NULL, ini data per sekolah')
                ->constrained('schools')->cascadeOnDelete();

            $table->foreignId('kurikulum_id')
                ->comment('FK ke kurikulums.id')
                ->constrained('kurikulums')->cascadeOnDelete();

            $table->foreignId('tahun_ajaran_id')
                ->comment('FK ke tahun_ajarans.id')
                ->constrained('tahun_ajarans')->cascadeOnDelete();

            // Nullable — NULL berarti berlaku seluruh tahun ajaran
            $table->foreignId('semester_id')
                ->nullable()
                ->comment('FK ke semesters.id. NULL = berlaku seluruh tahun ajaran')
                ->constrained('semesters')->nullOnDelete();

            // Tingkat kelas yang menggunakan kurikulum ini di tahun ajaran ini.
            // JSON array of integers — misal: [7] artinya hanya kelas 7 pakai kurikulum ini.
            // NULL = semua tingkat di tahun ajaran ini.
            // Ini yang solve kasus transisi: K13 untuk tingkat [8,9], Merdeka untuk [7]
            $table->json('tingkat_kelas')->nullable()
                ->comment('Array tingkat yang pakai kurikulum ini. NULL=semua tingkat. Contoh: [7] atau [8,9]');

            $table->boolean('is_active')->default(true)
                ->comment('0 = kurikulum ini tidak lagi dipakai di tahun ajaran ini');

            $table->text('catatan')->nullable()
                ->comment('Alasan pemilihan kurikulum, referensi SK/surat edaran, dll');

            // Audit — siapa yang assign kurikulum ke tahun ajaran ini
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Unique: satu kombinasi school+kurikulum+tahun_ajaran+semester hanya sekali
            $table->unique(
                ['school_id', 'kurikulum_id', 'tahun_ajaran_id', 'semester_id'],
                'uq_kur_ta_sem_school'
            );

            $table->index(['school_id', 'tahun_ajaran_id'], 'idx_kurta_school_ta');
            $table->index('kurikulum_id', 'idx_kurta_kurikulum');
            $table->index('semester_id', 'idx_kurta_semester');
        });

        // ── 3. SEED DATA KOMPATIBILITAS PLATFORM-LEVEL ──────────────────────────
        // Isi pivot kurikulum ↔ program_pendidikan untuk data yang sudah ada.
        // school_id = NULL → berlaku untuk semua sekolah (platform default).
        $this->seedKompatibilitasPlatform();
    }

    public function down(): void
    {
        Schema::dropIfExists('kurikulum_tahun_ajarans');
        Schema::dropIfExists('kurikulum_program_pendidikans');
    }

    // ── Seed helpers ─────────────────────────────────────────────────────────

    private function seedKompatibilitasPlatform(): void
    {
        $now = now();

        $k13Id = DB::table('kurikulums')->whereNull('school_id')->where('kode', 'K13')->value('id');
        $merdekaId = DB::table('kurikulums')->whereNull('school_id')->where('kode', 'MERDEKA')->value('id');

        // Jika kurikulum belum ada (misal test env), skip seed
        if (!$k13Id || !$merdekaId) {
            return;
        }

        // Ambil semua program pendidikan platform-level (school_id NULL)
        // Sesuai konstanta ProgramPendidikan::JENIS
        $programs = DB::table('program_pendidikans')
            ->whereNull('school_id')
            ->whereNull('deleted_at')
            ->select('id', 'jenis', 'jenjang_sasaran')
            ->get()
            ->keyBy('jenis'); // indexing by jenis untuk lookup mudah

        // Jika belum ada program platform, skip (sekolah baru belum tentu punya)
        if ($programs->isEmpty()) {
            return;
        }

        $insert = [];

        foreach ($programs as $jenis => $program) {
            $kompatibel = $this->getKompatibilitasKurikulum($jenis);

            foreach ($kompatibel as $kurikulumId => $catatan) {
                if (!$kurikulumId)
                    continue;

                $insert[] = [
                    'school_id' => null,
                    'kurikulum_id' => $kurikulumId,
                    'program_pendidikan_id' => $program->id,
                    'catatan' => $catatan,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (!empty($insert)) {
            // insertOrIgnore — idempotent jika dijalankan ulang
            DB::table('kurikulum_program_pendidikans')->insertOrIgnore($insert);
        }
    }

    /**
     * Matrix kompatibilitas per jenis program pendidikan.
     * Dikembalikan sebagai [kurikulum_id => catatan].
     */
    private function getKompatibilitasKurikulum(string $jenis): array
    {
        $k13Id = DB::table('kurikulums')->whereNull('school_id')->where('kode', 'K13')->value('id');
        $merdekaId = DB::table('kurikulums')->whereNull('school_id')->where('kode', 'MERDEKA')->value('id');

        return match ($jenis) {
            // SMK/MAK: bidang & program keahlian kompatibel keduanya
            // (nomenklatur berubah di Merdeka tapi strukturnya sama)
            'bidang_keahlian' => [
                $k13Id => 'SMK K13: Bidang Keahlian level-1',
                $merdekaId => 'SMK Merdeka: Bidang Keahlian tetap ada',
            ],
            'program_keahlian' => [
                $k13Id => 'SMK K13: Program Keahlian level-2',
                $merdekaId => 'SMK Merdeka: Program Keahlian level-2',
            ],
            'konsentrasi_keahlian' => [
                $k13Id => 'SMK K13: Kompetensi Keahlian level-3',
                $merdekaId => 'SMK Merdeka: Konsentrasi Keahlian level-3 (berganti nama dari Kompetensi)',
            ],

            // SMA/MA K13: peminatan IPA/IPS/Bahasa — TIDAK ada di Merdeka
            'peminatan' => [
                $k13Id => 'SMA/MA K13: Peminatan IPA, IPS, Bahasa, Keagamaan',
                // Merdeka TIDAK kompatibel — Merdeka tidak pakai peminatan
            ],

            // SMA/MA Merdeka: mata_pelajaran_pilihan — TIDAK ada di K13
            'mata_pelajaran_pilihan' => [
                $merdekaId => 'SMA/MA Merdeka: Kelompok mapel pilihan (MIPA, IPS, Bahasa, Vokasi)',
                // K13 TIDAK kompatibel
            ],

            // Keagamaan: ada di K13 (Tafsir, Hadis, Fikih, dll) dan Merdeka (P2RA)
            'keagamaan' => [
                $k13Id => 'MA/MAN K13: Program Keagamaan (Tafsir, Hadis, Fikih, Ilmu Kalam)',
                $merdekaId => 'MA/MAN Merdeka: P2RA — Projek Penguatan Profil Pelajar Rahmatan lil Alamin',
            ],

            // Umum: tidak terikat kurikulum tertentu
            'umum' => [
                $k13Id => 'Berlaku untuk semua jenjang K13',
                $merdekaId => 'Berlaku untuk semua jenjang Merdeka',
            ],

            // Jenis tidak dikenal — skip
            default => [],
        };
    }
};