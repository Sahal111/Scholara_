<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Perluas enum `jenis` pada tabel program_pendidikans.
 *
 * Tambahan:
 *
 *   mata_pelajaran_pilihan
 *     → Untuk SMA/MA Kurikulum Merdeka.
 *       Siswa memilih 4-5 mapel dari kelompok MIPA/IPS/Bahasa/Vokasi secara
 *       individual — bukan jurusan per rombel. Program ini merepresentasikan
 *       KELOMPOK (bukan jurusan), misal: "Kelompok MIPA", "Kelompok IPS".
 *       Berbeda dari `peminatan` (K13) yang melekat ke rombel.
 *
 *   keagamaan
 *     → Untuk MA/MAN (semua kurikulum).
 *       Merepresentasikan peminatan/program berbasis keagamaan Islam:
 *       Tafsir-Ilmu Tafsir, Hadis-Ilmu Hadis, Fikih-Ushul Fikih, Ilmu Kalam,
 *       Bahasa Arab Tingkat Lanjut.
 *       MA Negeri (MAN) bukan jenis satuan pendidikan tersendiri — tetap MA,
 *       dibedakan hanya oleh status (negeri/swasta) dan program keagamaannya.
 *
 * Enum lengkap setelah migration ini:
 *   bidang_keahlian       — SMK/MAK level-1
 *   program_keahlian      — SMK/MAK level-2
 *   konsentrasi_keahlian  — SMK/MAK level-3
 *   peminatan             — SMA/MA K13: IPA, IPS, Bahasa
 *   mata_pelajaran_pilihan — SMA/MA Kurikulum Merdeka: Kelompok MIPA, IPS, Bahasa, Vokasi
 *   keagamaan             — MA/MAN: Tafsir, Hadis, Fikih, Ilmu Kalam, Bahasa Arab
 *   umum                  — Fleksibel / custom
 *
 * Teknis:
 *   MySQL/MariaDB tidak mendukung ALTER COLUMN pada ENUM secara langsung via Blueprint.
 *   Pakai DB::statement untuk MODIFY COLUMN.
 *   Nilai lama tetap valid — tidak ada data loss.
 */
return new class extends Migration {
    public function up(): void
    {
        DB::statement("
            ALTER TABLE `program_pendidikans`
            MODIFY COLUMN `jenis` ENUM(
                'bidang_keahlian',
                'program_keahlian',
                'konsentrasi_keahlian',
                'peminatan',
                'mata_pelajaran_pilihan',
                'keagamaan',
                'umum'
            ) NOT NULL
            COMMENT 'Jenis program: lihat docs/programConfig untuk mapping per jenjang+kurikulum'
        ");
    }

    public function down(): void
    {
        // Rollback: hapus nilai baru. Data dengan nilai baru akan ERROR jika ada.
        // Pastikan tidak ada row dengan jenis IN ('mata_pelajaran_pilihan','keagamaan') sebelum rollback.
        DB::statement("
            ALTER TABLE `program_pendidikans`
            MODIFY COLUMN `jenis` ENUM(
                'bidang_keahlian',
                'program_keahlian',
                'konsentrasi_keahlian',
                'peminatan',
                'umum'
            ) NOT NULL
            COMMENT 'Jenis program mengikuti nomenklatur Kemdikbud'
        ");
    }
};