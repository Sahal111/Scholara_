<?php

namespace App\Jobs;

use App\Models\MataPelajaran;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessMapelImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 1;

    public function __construct(
        private string $storedFilePath,
        private int $schoolId,
        private int $userId,
    ) {
    }

    public function handle(): void
    {
        // Set school_id ke app container supaya SchoolScope bisa inject WHERE school_id = ?
        app()->instance('current_school_id', $this->schoolId);

        $filePath = Storage::disk('local')->path($this->storedFilePath);

        if (!file_exists($filePath)) {
            Log::warning("ProcessMapelImport: file tidak ditemukan — {$this->storedFilePath}");
            return;
        }

        try {
            $rows = $this->parseXlsx($filePath);

            if (empty($rows)) {
                Log::warning("ProcessMapelImport: file kosong atau gagal di-parse — {$this->storedFilePath}");
                return;
            }

            // Baris pertama = header
            $headerRow = array_map('strtolower', array_map('trim', array_shift($rows)));

            // Map header → index kolom
            $col = [];
            foreach ($headerRow as $i => $h) {
                $col[$h] = $i;
            }

            $get = fn(array $row, string $key): ?string =>
                isset($col[$key], $row[$col[$key]])
                ? (trim($row[$col[$key]]) !== '' ? trim($row[$col[$key]]) : null)
                : null;

            $kelompokValid = [
                'A - Wajib',
                'B - Wajib',
                'C - Muatan Lokal',
                'Pengembangan Diri',
                'Ekstrakurikuler',
                'Lainnya',
            ];
            $kurikulumValid = ['Kurikulum 2013', 'Kurikulum Merdeka', 'Keduanya'];

            DB::transaction(function () use ($rows, $get, $kelompokValid, $kurikulumValid) {
                foreach ($rows as $rowIndex => $row) {
                    // Skip baris kosong
                    if (empty(array_filter($row, fn($v) => trim($v) !== ''))) {
                        continue;
                    }

                    $kode = $get($row, 'kode');
                    $namaMapel = $get($row, 'nama_mapel');

                    // kode & nama wajib
                    if (!$kode || !$namaMapel) {
                        continue;
                    }

                    $kelompok = $get($row, 'kelompok') ?? 'A - Wajib';
                    if (!in_array($kelompok, $kelompokValid)) {
                        $kelompok = 'Lainnya';
                    }

                    $kurikulum = $get($row, 'kurikulum') ?? 'Keduanya';
                    if (!in_array($kurikulum, $kurikulumValid)) {
                        $kurikulum = 'Keduanya';
                    }

                    // Tingkat: "Semua" → null, "1,2,3" → "1,2,3"
                    $tingkatRaw = $get($row, 'tingkat');
                    $tingkat = null;
                    if ($tingkatRaw && strtolower($tingkatRaw) !== 'semua') {
                        $tingkat = implode(',', array_filter(
                            array_map('trim', explode(',', $tingkatRaw)),
                            fn($t) => in_array($t, ['1', '2', '3', '4', '5', '6'])
                        ));
                        if ($tingkat === '') {
                            $tingkat = null;
                        }
                    }

                    $jamPerMinggu = (int) ($get($row, 'jam_per_minggu') ?? 2);
                    if ($jamPerMinggu < 1 || $jamPerMinggu > 40) {
                        $jamPerMinggu = 2;
                    }

                    // FIX: sertakan school_id di search key agar updateOrCreate
                    // cocok dengan unique constraint (school_id, kode) di DB.
                    // SchoolScope sudah inject WHERE school_id secara otomatis
                    // untuk SELECT-nya, tapi INSERT butuh school_id eksplisit.
                    MataPelajaran::updateOrCreate(
                        [
                            'school_id' => $this->schoolId,
                            'kode' => strtoupper($kode),
                        ],
                        [
                            'nama_mapel' => $namaMapel,
                            'kelompok' => $kelompok,
                            'tingkat' => $tingkat,
                            'jam_per_minggu' => $jamPerMinggu,
                            'kurikulum' => $kurikulum,
                            'is_active' => true,
                        ]
                    );
                }
            });

            Log::info("ProcessMapelImport: selesai — school_id={$this->schoolId}, rows=" . count($rows));

        } catch (\Throwable $e) {
            // Log error supaya tidak diam-diam hilang
            Log::error("ProcessMapelImport gagal: " . $e->getMessage(), [
                'school_id' => $this->schoolId,
                'file' => $this->storedFilePath,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e; // re-throw agar job ditandai failed
        } finally {
            Storage::delete($this->storedFilePath);
        }
    }

    /* ── Parse .xlsx → array of rows ────────────────────────────── */

    private function parseXlsx(string $filePath): array
    {
        $zip = new \ZipArchive();
        if ($zip->open($filePath) !== true) {
            return [];
        }

        // Shared strings
        $sharedStrings = [];
        $ssXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssXml !== false) {
            $ss = simplexml_load_string($ssXml);
            foreach ($ss->si as $si) {
                $t = '';
                foreach ($si->r as $r) {
                    $t .= (string) $r->t;
                }
                if ($t === '' && isset($si->t)) {
                    $t = (string) $si->t;
                }
                $sharedStrings[] = $t;
            }
        }

        // Ambil sheet pertama
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            $zip->close();
            return [];
        }

        $sheet = simplexml_load_string($sheetXml);
        $rows = [];

        foreach ($sheet->sheetData->row as $row) {
            $rowArr = [];
            $maxCol = 0;

            foreach ($row->c as $cell) {
                $ref = (string) $cell['r'];
                $colLet = preg_replace('/[0-9]/', '', $ref);
                $colIdx = $this->colLetterToIndex($colLet);
                $maxCol = max($maxCol, $colIdx);

                $t = (string) $cell['t'];
                $val = isset($cell->v) ? (string) $cell->v : '';

                if ($t === 's' && $val !== '') {
                    $val = $sharedStrings[(int) $val] ?? '';
                }

                $rowArr[$colIdx] = $val;
            }

            for ($i = 0; $i <= $maxCol; $i++) {
                if (!isset($rowArr[$i])) {
                    $rowArr[$i] = '';
                }
            }

            ksort($rowArr);
            $rows[] = array_values($rowArr);
        }

        $zip->close();
        return $rows;
    }

    private function colLetterToIndex(string $col): int
    {
        $col = strtoupper($col);
        $index = 0;
        for ($i = 0; $i < strlen($col); $i++) {
            $index = $index * 26 + (ord($col[$i]) - 64);
        }
        return $index - 1;
    }
}