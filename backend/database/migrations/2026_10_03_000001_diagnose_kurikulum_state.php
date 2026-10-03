<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * DIAGNOSTIK READ-ONLY — LANGKAH 0 domain Kurikulum.
 *
 * File ini TIDAK mengubah skema maupun data. Hanya menjalankan SELECT lalu
 * mencetak laporan ke console dan menyimpannya ke:
 *   storage/logs/diagnosa-kurikulum.txt
 *
 * JALANKAN HANYA DI DB DEV/LOKAL, dan hanya file ini:
 *   php artisan migrate --path=database/migrations/2026_10_03_000001_diagnose_kurikulum_state.php
 *
 * Jalankan ulang:
 *   php artisan migrate:rollback --path=database/migrations/2026_10_03_000001_diagnose_kurikulum_state.php
 *   (lalu jalankan perintah migrate di atas lagi)
 *
 * JANGAN di-commit. Hapus file ini setelah hasilnya dikirim.
 */
return new class extends Migration {
    private array $lines = [];

    public function up(): void
    {
        $this->line('=== DIAGNOSA KURIKULUM — ' . now()->toDateTimeString() . ' ===');
        $this->line();

        // ── A. Status migration ─────────────────────────────────────────────
        $this->line('--- A. STATUS MIGRATION ---');
        $this->check('A1. migration 09_03 / 09_08 yang sudah Ran', function () {
            $rows = DB::table('migrations')
                ->where('migration', 'like', '2026_09_03%')
                ->orWhere('migration', 'like', '2026_09_08%')
                ->orderBy('migration')
                ->pluck('migration');

            return $rows->isEmpty() ? 'TIDAK ADA' : PHP_EOL . '    ' . $rows->implode(PHP_EOL . '    ');
        });

        // ── B. Matriks kompatibilitas (temuan #2 dan #3) ────────────────────
        $this->line();
        $this->line('--- B. MATRIKS KOMPATIBILITAS ---');
        $this->check('B1. kurikulum_program_pendidikans (total baris)', fn () => $this->total('kurikulum_program_pendidikans'));
        $this->check('B2. program_pendidikans (total baris)', fn () => $this->total('program_pendidikans'));
        $this->check('B3. program_pendidikans WHERE school_id IS NULL', function () {
            return Schema::hasTable('program_pendidikans')
                ? DB::table('program_pendidikans')->whereNull('school_id')->count()
                : 'TABEL TIDAK ADA';
        });
        $this->check('B4. kolom program_pendidikans.school_id', fn () => $this->kolom('program_pendidikans', 'school_id'));
        $this->check('B5. jumlah program per jenis', fn () => $this->grup('program_pendidikans', 'jenis'));

        // ── C. Kelas (temuan #1 dan #8) ─────────────────────────────────────
        $this->line();
        $this->line('--- C. KELAS ---');
        $this->check('C1. kelas (total baris)', fn () => $this->total('kelas'));
        $this->check('C2. kelas WHERE kurikulum_id IS NULL', function () {
            if (!Schema::hasTable('kelas')) {
                return 'TABEL TIDAK ADA';
            }
            if (!Schema::hasColumn('kelas', 'kurikulum_id')) {
                return 'KOLOM kurikulum_id TIDAK ADA';
            }

            return DB::table('kelas')->whereNull('kurikulum_id')->count();
        });
        $this->check('C3. kolom kelas.kurikulum (tipe ENUM saat ini)', fn () => $this->kolom('kelas', 'kurikulum'));
        $this->check('C4. sebaran nilai kelas.kurikulum', fn () => $this->grup('kelas', 'kurikulum'));
        $this->check('C5. sebaran kelas.kurikulum_id', fn () => $this->grup('kelas', 'kurikulum_id'));

        // ── D. Unique yang bocor karena NULL (temuan #4) ────────────────────
        $this->line();
        $this->line('--- D. DUPLIKAT (UNIQUE TIDAK BERLAKU SAAT KOLOM NULL) ---');
        $this->check('D1. kurikulums platform dengan kode kembar', function () {
            if (!Schema::hasTable('kurikulums')) {
                return 'TABEL TIDAK ADA';
            }
            $rows = DB::table('kurikulums')
                ->whereNull('school_id')
                ->select('kode', DB::raw('COUNT(*) AS n'))
                ->groupBy('kode')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            return $rows->isEmpty()
                ? 'tidak ada (OK)'
                : $rows->map(fn ($r) => "{$r->kode} x{$r->n}")->implode(', ');
        });
        $this->check('D2. kurikulum_program_pendidikans platform kembar', function () {
            if (!Schema::hasTable('kurikulum_program_pendidikans')) {
                return 'TABEL TIDAK ADA';
            }
            $rows = DB::table('kurikulum_program_pendidikans')
                ->whereNull('school_id')
                ->select('kurikulum_id', 'program_pendidikan_id', DB::raw('COUNT(*) AS n'))
                ->groupBy('kurikulum_id', 'program_pendidikan_id')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            return $rows->isEmpty()
                ? 'tidak ada (OK)'
                : $rows->map(fn ($r) => "kur#{$r->kurikulum_id}/prog#{$r->program_pendidikan_id} x{$r->n}")->implode(', ');
        });
        $this->check('D3. kurikulum_tahun_ajarans kembar (semester_id NULL)', function () {
            if (!Schema::hasTable('kurikulum_tahun_ajarans')) {
                return 'TABEL TIDAK ADA';
            }
            $rows = DB::table('kurikulum_tahun_ajarans')
                ->whereNull('semester_id')
                ->select('school_id', 'kurikulum_id', 'tahun_ajaran_id', DB::raw('COUNT(*) AS n'))
                ->groupBy('school_id', 'kurikulum_id', 'tahun_ajaran_id')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            return $rows->isEmpty()
                ? 'tidak ada (OK)'
                : $rows->map(fn ($r) => "school#{$r->school_id}/kur#{$r->kurikulum_id}/ta#{$r->tahun_ajaran_id} x{$r->n}")->implode(', ');
        });

        // ── E. Data kurikulum & implementasi ────────────────────────────────
        $this->line();
        $this->line('--- E. DATA KURIKULUM & IMPLEMENTASI ---');
        $this->check('E1. kurikulums (total baris)', fn () => $this->total('kurikulums'));
        $this->check('E2. kurikulums per school_id (NULL = platform)', function () {
            if (!Schema::hasTable('kurikulums')) {
                return 'TABEL TIDAK ADA';
            }
            $rows = DB::table('kurikulums')
                ->select('school_id', DB::raw('COUNT(*) AS n'))
                ->groupBy('school_id')
                ->get();

            return $rows->map(fn ($r) => 'school#' . ($r->school_id ?? 'NULL') . "={$r->n}")->implode(', ');
        });
        $this->check('E3. kurikulum_tahun_ajarans (total baris)', fn () => $this->total('kurikulum_tahun_ajarans'));
        $this->check('E4. kurikulum_komponen_nilaians (total baris)', fn () => $this->total('kurikulum_komponen_nilaians'));

        // ── F. Mapel (temuan #5) ────────────────────────────────────────────
        $this->line();
        $this->line('--- F. MAPEL (bahan rencana backfill struktur) ---');
        $this->check('F1. mapels (total baris, termasuk soft-deleted)', fn () => $this->total('mapels'));
        $this->check('F2. mapels WHERE kurikulum_id IS NULL', function () {
            if (!Schema::hasTable('mapels') || !Schema::hasColumn('mapels', 'kurikulum_id')) {
                return 'TABEL/KOLOM TIDAK ADA';
            }

            return DB::table('mapels')->whereNull('kurikulum_id')->count();
        });
        $this->check('F3. mapels.tingkat berformat CSV (mengandung koma)', function () {
            if (!Schema::hasTable('mapels')) {
                return 'TABEL TIDAK ADA';
            }

            return DB::table('mapels')->where('tingkat', 'like', '%,%')->count();
        });
        $this->check('F4. mapels.tingkat NULL (berlaku semua tingkat)', function () {
            if (!Schema::hasTable('mapels')) {
                return 'TABEL TIDAK ADA';
            }

            return DB::table('mapels')->whereNull('tingkat')->count();
        });
        $this->check('F5. sebaran mapels.kelompok', fn () => $this->grup('mapels', 'kelompok'));
        $this->check('F6. kolom mapels.kurikulum', fn () => $this->kolom('mapels', 'kurikulum'));
        $this->check('F7. mapels dengan program_pendidikan_id terisi', function () {
            if (!Schema::hasTable('mapels') || !Schema::hasColumn('mapels', 'program_pendidikan_id')) {
                return 'TABEL/KOLOM TIDAK ADA';
            }

            return DB::table('mapels')->whereNotNull('program_pendidikan_id')->count();
        });

        // ── G. Penugasan guru (temuan #6) ───────────────────────────────────
        $this->line();
        $this->line('--- G. PENUGASAN GURU ---');
        $this->check('G1. plot_guru_mapels (total baris)', fn () => $this->total('plot_guru_mapels'));
        $this->check('G2. plot_guru_mapels dengan beban_jam = 0', function () {
            if (!Schema::hasTable('plot_guru_mapels')) {
                return 'TABEL TIDAK ADA';
            }

            return DB::table('plot_guru_mapels')->where('beban_jam', 0)->count();
        });

        // ── Cetak & simpan ──────────────────────────────────────────────────
        $this->line();
        $this->line('=== SELESAI. Tidak ada perubahan data/skema. ===');

        $report = implode(PHP_EOL, $this->lines) . PHP_EOL;

        echo PHP_EOL . $report;
        @file_put_contents(storage_path('logs/diagnosa-kurikulum.txt'), $report);
    }

    public function down(): void
    {
        // Sengaja kosong — migration ini hanya membaca.
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private function line(string $text = ''): void
    {
        $this->lines[] = $text;
    }

    /**
     * Jalankan satu pengecekan; error apa pun ditangkap supaya cek lain tetap jalan.
     */
    private function check(string $label, callable $fn): void
    {
        try {
            $this->line("[{$label}] " . $fn());
        } catch (\Throwable $e) {
            $this->line("[{$label}] ERROR: " . $e->getMessage());
        }
    }

    private function total(string $table): string
    {
        return Schema::hasTable($table) ? (string) DB::table($table)->count() : 'TABEL TIDAK ADA';
    }

    private function kolom(string $table, string $kolom): string
    {
        $row = DB::selectOne(
            'SELECT IS_NULLABLE AS nullable, COLUMN_TYPE AS tipe
               FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$table, $kolom]
        );

        return $row ? "nullable={$row->nullable}, tipe={$row->tipe}" : 'KOLOM TIDAK ADA';
    }

    private function grup(string $table, string $kolom): string
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $kolom)) {
            return 'TABEL/KOLOM TIDAK ADA';
        }

        $rows = DB::table($table)
            ->select($kolom, DB::raw('COUNT(*) AS n'))
            ->groupBy($kolom)
            ->orderByDesc('n')
            ->get();

        if ($rows->isEmpty()) {
            return '(kosong)';
        }

        return $rows
            ->map(fn ($r) => (($r->{$kolom} === null) ? 'NULL' : $r->{$kolom}) . "={$r->n}")
            ->implode(', ');
    }
};
