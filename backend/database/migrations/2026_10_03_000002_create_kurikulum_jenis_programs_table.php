<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Matriks kompatibilitas Kurikulum ↔ JENIS program pendidikan.
 *
 * Menggantikan peran `kurikulum_program_pendidikans` untuk validasi default.
 *
 * Kenapa tabel baru, bukan memperbaiki pivot lama?
 *   - Pivot lama terikat ke BARIS program (yang per-sekolah, school_id NOT NULL),
 *     padahal aturannya berlaku per JENIS program → seed platform tidak pernah
 *     menemukan program dan matriksnya kosong.
 *   - Pivot lama memakai school_id NULL sehingga UNIQUE tidak bekerja di MySQL.
 *   - Tabel ini tanpa kolom NULL di unique key → idempotent & aman.
 *
 * `jenis_program` sengaja VARCHAR (bukan ENUM) agar jenis baru tidak perlu ALTER TABLE.
 * Aturan ini bisa berubah mengikuti regulasi → ubah lewat DATA, bukan deploy.
 *
 * Tabel lama `kurikulum_program_pendidikans` TIDAK disentuh (deprecated, kosong).
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('kurikulum_jenis_programs')) {
            Schema::create('kurikulum_jenis_programs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kurikulum_id')
                    ->constrained('kurikulums')
                    ->cascadeOnDelete();
                $table->string('jenis_program', 40)
                    ->comment('Sama dengan program_pendidikans.jenis (bidang_keahlian, peminatan, dst)');
                $table->string('catatan', 255)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['kurikulum_id', 'jenis_program'], 'uq_kurjenis_kur_jenis');
                $table->index('jenis_program', 'idx_kurjenis_jenis');
            });
        }

        $this->seedMatriks();
    }

    public function down(): void
    {
        Schema::dropIfExists('kurikulum_jenis_programs');
    }

    /**
     * Matriks awal — sama dengan docs/08-kurikulum-architecture.md.
     * Setiap baris: [jenis_program, catatan].
     *
     * CATATAN: aturan peminatan vs mata_pelajaran_pilihan untuk SMA berpotensi
     * berubah mengikuti kebijakan penjurusan terbaru → verifikasi ke regulasi
     * sebelum dianggap final. CAMBRIDGE/IB → 'umum' adalah asumsi agar tidak
     * buntu; ubah jika tidak sesuai.
     */
    private function seedMatriks(): void
    {
        $vokasi = [
            ['bidang_keahlian', 'Struktur SMK/MAK tidak berubah antar kurikulum'],
            ['program_keahlian', 'Struktur SMK/MAK tidak berubah antar kurikulum'],
            ['konsentrasi_keahlian', 'Struktur SMK/MAK tidak berubah antar kurikulum'],
        ];

        $matriks = [
            'K13' => array_merge($vokasi, [
                ['peminatan', 'SMA/MA K13: IPA, IPS, Bahasa'],
                ['keagamaan', 'MA/MAN'],
                ['umum', 'Fleksibel / custom'],
            ]),
            'MERDEKA' => array_merge($vokasi, [
                ['mata_pelajaran_pilihan', 'SMA/MA Merdeka: kelompok mapel pilihan'],
                ['keagamaan', 'MA/MAN'],
                ['umum', 'Fleksibel / custom'],
            ]),
            'CAMBRIDGE' => [['umum', 'Asumsi awal — sesuaikan jika perlu']],
            'IB' => [['umum', 'Asumsi awal — sesuaikan jika perlu']],
        ];

        $ids = DB::table('kurikulums')
            ->whereNull('school_id')
            ->whereNull('deleted_at')
            ->whereIn('kode', array_keys($matriks))
            ->pluck('id', 'kode');

        $now = now();

        foreach ($matriks as $kode => $baris) {
            $kurikulumId = $ids[$kode] ?? null;

            if (!$kurikulumId) {
                continue; // kurikulum platform ini belum ada → lewati
            }

            foreach ($baris as [$jenis, $catatan]) {
                DB::table('kurikulum_jenis_programs')->insertOrIgnore([
                    'kurikulum_id' => $kurikulumId,
                    'jenis_program' => $jenis,
                    'catatan' => $catatan,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
};
