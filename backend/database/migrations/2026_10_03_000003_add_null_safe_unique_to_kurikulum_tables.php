<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Unique index yang TAHAN NULL untuk tabel kurikulum.
 *
 * Masalah: di MySQL, UNIQUE mengizinkan banyak baris dengan nilai NULL, jadi
 *   - kurikulums UNIQUE(school_id, kode)      → kode kembar lolos jika school_id NULL (platform)
 *   - kurikulum_tahun_ajarans UNIQUE(..., semester_id) → duplikat lolos jika semester_id NULL
 *
 * Solusi: functional index dengan COALESCE(kolom_nullable, 0).
 *   Butuh MySQL >= 8.0.13 (functional key parts). MariaDB tidak didukung.
 *
 * Index lama TIDAK dihapus (aman untuk foreign key & tidak mengubah perilaku lama).
 *
 * Migration BERHENTI dengan pesan jelas jika data duplikat sudah ada.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return; // functional index khusus MySQL 8
        }

        $this->pastikanVersiMysql();
        $this->pastikanTidakAdaDuplikat();

        DB::statement(
            'CREATE UNIQUE INDEX `uq_kurikulums_scope_kode`
                ON `kurikulums` ((COALESCE(`school_id`, 0)), `kode`)'
        );

        DB::statement(
            'CREATE UNIQUE INDEX `uq_kur_ta_scope`
                ON `kurikulum_tahun_ajarans`
                   (`school_id`, `kurikulum_id`, `tahun_ajaran_id`, (COALESCE(`semester_id`, 0)))'
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('DROP INDEX `uq_kur_ta_scope` ON `kurikulum_tahun_ajarans`');
        DB::statement('DROP INDEX `uq_kurikulums_scope_kode` ON `kurikulums`');
    }

    private function pastikanVersiMysql(): void
    {
        $versi = (string) DB::selectOne('SELECT VERSION() AS v')->v;

        $bersih = preg_replace('/[^0-9.].*$/', '', $versi);

        if (stripos($versi, 'mariadb') !== false || version_compare($bersih, '8.0.13', '<')) {
            throw new RuntimeException(
                "Migration ini butuh MySQL >= 8.0.13 (functional index). Versi terdeteksi: {$versi}"
            );
        }
    }

    private function pastikanTidakAdaDuplikat(): void
    {
        $kodeKembar = DB::select(
            'SELECT COALESCE(school_id, 0) AS scope, kode, COUNT(*) AS n
               FROM kurikulums
              GROUP BY COALESCE(school_id, 0), kode
             HAVING COUNT(*) > 1'
        );

        if ($kodeKembar) {
            throw new RuntimeException(
                'Ada kode kurikulum kembar di tabel kurikulums (scope/kode): '
                . collect($kodeKembar)->map(fn ($r) => "{$r->scope}/{$r->kode} x{$r->n}")->implode(', ')
                . '. Bersihkan dulu sebelum menjalankan migration ini.'
            );
        }

        $implKembar = DB::select(
            'SELECT school_id, kurikulum_id, tahun_ajaran_id, COALESCE(semester_id, 0) AS sem, COUNT(*) AS n
               FROM kurikulum_tahun_ajarans
              GROUP BY school_id, kurikulum_id, tahun_ajaran_id, COALESCE(semester_id, 0)
             HAVING COUNT(*) > 1'
        );

        if ($implKembar) {
            throw new RuntimeException(
                'Ada data kembar di kurikulum_tahun_ajarans (school/kurikulum/ta/semester): '
                . collect($implKembar)
                    ->map(fn ($r) => "{$r->school_id}/{$r->kurikulum_id}/{$r->tahun_ajaran_id}/{$r->sem} x{$r->n}")
                    ->implode(', ')
                . '. Bersihkan dulu sebelum menjalankan migration ini.'
            );
        }
    }
};
