<?php

namespace App\Jobs;

use App\Models\Guru;
use App\Models\GuruImportLog;
use App\Models\ActivityLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProcessGuruImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;
    public int $tries = 1;

    public function __construct(
        private string $batchId,
        private string $storedFilePath, // path di storage/app/imports/
        private array $columnMapping,
        private string $modeDuplikat,   // skip | replace | merge
        private int $userId,
        private string $ipAddress,
    ) {
    }

    public function handle(): void
    {
        $log = GuruImportLog::where('batch_id', $this->batchId)->firstOrFail();
        $log->update(['status' => 'processing', 'started_at' => now()]);

        $startTime = microtime(true);

        try {
            $filePath = storage_path('app/' . $this->storedFilePath);
            $allSheets = $this->parseXlsx($filePath);

            $sheetUtama = $this->getSheet($allSheets, 'Data Utama') ?? ($allSheets[0] ?? null);
            if (!$sheetUtama) {
                throw new \Exception('Sheet "Data Utama" tidak ditemukan.');
            }

            $rows = $sheetUtama['rows'];
            if (empty($rows)) {
                throw new \Exception('Sheet "Data Utama" kosong.');
            }

            $headerRow = array_map('trim', array_shift($rows));
            $mapping = $this->columnMapping; // user header → db field
            $totalBaris = count($rows);

            $log->update(['total_baris' => $totalBaris]);

            $stats = [
                'insert' => 0,
                'update' => 0,
                'skip' => 0,
                'gagal' => 0,
                'errors' => [],
                'relasi' => [],
            ];

            // ── Proses chunk per 50 baris ───────────────────────────────
            $chunks = array_chunk($rows, 50);
            $processed = 0;

            foreach ($chunks as $chunk) {
                DB::transaction(function () use ($chunk, $headerRow, $mapping, &$stats, &$processed, $totalBaris, $log) {
                    foreach ($chunk as $rowIdx => $row) {
                        $baris = $processed + $rowIdx + 2;

                        if (empty(array_filter($row, fn($v) => trim($v) !== ''))) {
                            continue;
                        }

                        $get = fn(string $dbField): ?string => $this->getCell($row, $headerRow, $mapping, $dbField);

                        $nuptk = $get('nuptk');
                        $nip = $get('nip');
                        $nik = $get('nik');
                        $email = $get('email');
                        $nama = $get('nama');

                        if (!$nama) {
                            $stats['gagal']++;
                            $stats['errors'][] = "Baris {$baris}: Kolom 'nama' wajib diisi.";
                            continue;
                        }

                        // ── Duplicate Detection: NUPTK → NIP → NIK → Email
                        $existing = null;
                        if ($nuptk)
                            $existing = Guru::where('nuptk', $nuptk)->first();
                        if (!$existing && $nip)
                            $existing = Guru::where('nip', $nip)->first();
                        if (!$existing && $nik)
                            $existing = Guru::where('nik', $nik)->first();
                        if (!$existing && $email)
                            $existing = Guru::where('email', $email)->first();

                        if ($existing && $this->modeDuplikat === 'skip') {
                            $stats['skip']++;
                            continue;
                        }

                        $payload = array_filter([
                            'nuptk' => $nuptk,
                            'nip' => $nip,
                            'nip_lama' => $get('nip_lama'),
                            'no_karpeg' => $get('no_karpeg'),
                            'no_karis_karsu' => $get('no_karis_karsu'),
                            'nik' => $nik,
                            'no_kk' => $get('no_kk'),
                            'nama' => $nama,
                            'gelar_depan' => $get('gelar_depan'),
                            'gelar_belakang' => $get('gelar_belakang'),
                            'jenis_kelamin' => strtoupper($get('jenis_kelamin') ?? 'L'),
                            'tempat_lahir' => $get('tempat_lahir'),
                            'tanggal_lahir' => $this->parseDate($get('tanggal_lahir')),
                            'agama' => $get('agama') ?? 'Islam',
                            'golongan_darah' => $get('golongan_darah'),
                            'kewarganegaraan' => $get('kewarganegaraan') ?? 'WNI',
                            'status_hidup' => $get('status_hidup') ?? 'Aktif',
                            'nama_ibu_kandung' => $get('nama_ibu_kandung'),
                            'no_hp' => $get('no_hp') ?? '-',
                            'no_wa' => $get('no_wa'),
                            'email' => $email,
                            'alamat_jalan' => $get('alamat_jalan'),
                            'rt' => $get('rt'),
                            'rw' => $get('rw'),
                            'dusun' => $get('dusun'),
                            'desa_kelurahan' => $get('desa_kelurahan'),
                            'kecamatan' => $get('kecamatan'),
                            'kota_kabupaten' => $get('kota_kabupaten'),
                            'provinsi' => $get('provinsi'),
                            'kode_pos' => $get('kode_pos'),
                            'jenis_ptk' => $get('jenis_ptk') ?? 'Guru Kelas',
                            'status_kepegawaian' => $get('status_kepegawaian') ?? 'GTT',
                            'status_keaktifan' => $get('status_keaktifan') ?? 'Aktif',
                            'tanggal_bergabung' => $this->parseDate($get('tanggal_bergabung')),
                            'tmt_pns' => $this->parseDate($get('tmt_pns')),
                            'tmt_gty' => $this->parseDate($get('tmt_gty')),
                            'masa_kerja_tahun' => $get('masa_kerja_tahun'),
                            'no_sk_pengangkatan' => $get('no_sk_pengangkatan'),
                            'tgl_sk_pengangkatan' => $this->parseDate($get('tgl_sk_pengangkatan')),
                            'instansi_pengangkat' => $get('instansi_pengangkat'),
                        ], fn($v) => $v !== null);

                        try {
                            if ($existing) {
                                if ($this->modeDuplikat === 'merge') {
                                    // Hanya update field yang tidak kosong
                                    $payload = array_filter($payload, fn($v) => $v !== null && $v !== '');
                                }
                                unset($payload['nuptk']); // jangan override NUPTK
                                $existing->update($payload);
                                $stats['update']++;
                            } else {
                                if (!$nuptk) {
                                    $stats['gagal']++;
                                    $stats['errors'][] = "Baris {$baris}: NUPTK wajib untuk data baru (nama: {$nama}).";
                                    continue;
                                }
                                Guru::create($payload);
                                $stats['insert']++;
                            }
                        } catch (\Exception $e) {
                            $stats['gagal']++;
                            $stats['errors'][] = "Baris {$baris} ({$nama}): " . $e->getMessage();
                        }
                    }

                    $processed += count($chunk);
                    $persen = $totalBaris > 0 ? (int) round($processed / $totalBaris * 90) : 90;
                    $log->update(['progress_persen' => $persen]);
                });
            }

            // ── Proses sheet-sheet relasi (sama seperti import() yang ada) ──
            $this->importRelasi($allSheets, $headerRow, $stats, $log);

            // ── Selesai ──
            $durasi = round(microtime(true) - $startTime, 2);
            $log->update([
                'status' => 'done',
                'jumlah_insert' => $stats['insert'],
                'jumlah_update' => $stats['update'],
                'jumlah_skip' => $stats['skip'],
                'jumlah_gagal' => $stats['gagal'],
                'error_detail' => $stats['errors'],
                'statistik_relasi' => $stats['relasi'],
                'progress_persen' => 100,
                'durasi_detik' => $durasi,
                'finished_at' => now(),
            ]);

            // Audit log ke activity_logs
            ActivityLog::create([
                'user_id' => $this->userId,
                'action' => 'import',
                'module' => 'guru',
                'keterangan' => json_encode([
                    'batch_id' => $this->batchId,
                    'insert' => $stats['insert'],
                    'update' => $stats['update'],
                    'skip' => $stats['skip'],
                    'gagal' => $stats['gagal'],
                    'durasi' => $durasi . 's',
                    'file' => $log->nama_file,
                ]),
                'ip_address' => $this->ipAddress,
            ]);

            // Hapus file temp
            Storage::delete($this->storedFilePath);

        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_detail' => [['baris' => 0, 'pesan' => $e->getMessage()]],
                'finished_at' => now(),
                'durasi_detik' => round(microtime(true) - $startTime, 2),
            ]);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function getCell(array $row, array $headerRow, array $mapping, string $dbField): ?string
    {
        // Cari header user yang di-map ke dbField ini
        $userHeader = array_search($dbField, $mapping);
        if ($userHeader === false) {
            // Fallback: cari header yang namanya mirip
            foreach ($headerRow as $i => $h) {
                $normalized = strtolower(trim(str_replace(['*', ' ', '-', '_', '(', ')'], '', $h)));
                $target = strtolower(str_replace('_', '', $dbField));
                if ($normalized === $target) {
                    return trim($row[$i] ?? '') !== '' ? trim($row[$i]) : null;
                }
            }
            return null;
        }

        $idx = array_search($userHeader, $headerRow);
        if ($idx === false)
            return null;

        $val = trim($row[$idx] ?? '');
        return $val !== '' ? $val : null;
    }

    private function parseDate(?string $val): ?string
    {
        if (!$val)
            return null;
        try {
            return \Carbon\Carbon::parse($val)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    private function getSheet(array $sheets, string $name): ?array
    {
        foreach ($sheets as $s) {
            if (strtolower($s['name']) === strtolower($name))
                return $s;
        }
        return null;
    }

    private function importRelasi(array $allSheets, array $mainHeader, array &$stats, GuruImportLog $log): void
    {
        $findGuru = function (string $nuptk) use (&$stats): ?Guru {
            return Guru::where('nuptk', $nuptk)->first();
        };

        $countRelasi = function (string $key) use (&$stats) {
            $stats['relasi'][$key] = ($stats['relasi'][$key] ?? 0) + 1;
        };

        // Sheet Keluarga & Anak
        $sheetKel = $this->getSheet($allSheets, 'Keluarga & Anak');
        if ($sheetKel && !empty($sheetKel['rows'])) {
            $rows = $sheetKel['rows'];
            $hRow = array_map('trim', array_shift($rows));
            $hMap = array_flip($hRow);
            $get = fn($row, $key) => (($i = $hMap[$key] ?? null) !== null && trim($row[$i] ?? '') !== '') ? trim($row[$i]) : null;

            foreach ($rows as $row) {
                $nuptk = $get($row, 'nuptk* (harus ada di Sheet1)') ?? $get($row, 'nuptk');
                if (!$nuptk)
                    continue;
                $guru = $findGuru($nuptk);
                if (!$guru)
                    continue;
                try {
                    if ($spk = $get($row, 'status_perkawinan')) {
                        $guru->keluarga()->updateOrCreate(['guru_id' => $guru->id], array_filter([
                            'status_perkawinan' => $spk,
                            'nama_pasangan' => $get($row, 'nama_pasangan'),
                            'nik_pasangan' => $get($row, 'nik_pasangan'),
                            'pekerjaan_pasangan' => $get($row, 'pekerjaan_pasangan'),
                            'jumlah_anak' => $get($row, 'jumlah_anak'),
                        ], fn($v) => $v !== null));
                        $countRelasi('keluarga');
                    }
                    if ($namaAnak = $get($row, 'nama_anak')) {
                        $guru->anaks()->create(array_filter([
                            'nama' => $namaAnak,
                            'jenis_kelamin' => $get($row, 'jenis_kelamin_anak (L/P)'),
                            'tanggal_lahir' => $this->parseDate($get($row, 'tanggal_lahir_anak (YYYY-MM-DD)')),
                            'urutan' => $get($row, 'urutan_anak'),
                        ], fn($v) => $v !== null));
                        $countRelasi('anak');
                    }
                } catch (\Exception $e) {
                    $stats['errors'][] = "Keluarga (NUPTK {$nuptk}): " . $e->getMessage();
                }
            }
        }

        // Pendidikan
        $sheetPend = $this->getSheet($allSheets, 'Pendidikan');
        if ($sheetPend && !empty($sheetPend['rows'])) {
            $rows = $sheetPend['rows'];
            $hRow = array_map('trim', array_shift($rows));
            $hMap = array_flip($hRow);
            $get = fn($row, $key) => (($i = $hMap[$key] ?? null) !== null && trim($row[$i] ?? '') !== '') ? trim($row[$i]) : null;

            foreach ($rows as $row) {
                $nuptk = $get($row, 'nuptk* (harus ada di Sheet1)') ?? $get($row, 'nuptk');
                if (!$nuptk)
                    continue;
                $guru = $findGuru($nuptk);
                if (!$guru)
                    continue;
                try {
                    $guru->pendidikans()->create(array_filter([
                        'jenjang' => str_replace('-', '/', $get($row, 'jenjang (SD/SMP/SMA-SMK/D1/D2/D3/D4/S1/S2/S3)*') ?? $get($row, 'jenjang')),
                        'nama_sekolah' => $get($row, 'nama_sekolah*') ?? $get($row, 'nama_sekolah'),
                        'jurusan' => $get($row, 'jurusan'),
                        'prodi' => $get($row, 'prodi'),
                        'tahun_masuk' => $get($row, 'tahun_masuk'),
                        'tahun_lulus' => $get($row, 'tahun_lulus'),
                        'no_ijazah' => $get($row, 'no_ijazah'),
                    ], fn($v) => $v !== null));
                    $countRelasi('pendidikan');
                } catch (\Exception $e) {
                    $stats['errors'][] = "Pendidikan (NUPTK {$nuptk}): " . $e->getMessage();
                }
            }
        }

        $log->update(['progress_persen' => 95]);
    }

    private function parseXlsx(string $filePath): array
    {
        // Reuse logic yang sudah ada di controller
        $zip = new \ZipArchive();
        if ($zip->open($filePath) !== true)
            return [];

        $sharedStrings = [];
        $ssXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssXml !== false) {
            $ss = simplexml_load_string($ssXml);
            foreach ($ss->si as $si) {
                $t = '';
                foreach ($si->r as $r)
                    $t .= (string) $r->t;
                if ($t === '' && isset($si->t))
                    $t = (string) $si->t;
                $sharedStrings[] = $t;
            }
        }

        $wbXml = $zip->getFromName('xl/workbook.xml');
        $wbRelsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');
        $sheetList = [];

        if ($wbXml && $wbRelsXml) {
            $wb = simplexml_load_string($wbXml);
            $wbRels = simplexml_load_string($wbRelsXml);
            $relMap = [];
            foreach ($wbRels->Relationship as $rel) {
                $relMap[(string) $rel['Id']] = (string) $rel['Target'];
            }
            $ns = $wb->getNamespaces(true);
            $rNs = $ns['r'] ?? 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
            foreach ($wb->sheets->sheet as $sheet) {
                $rId = (string) $sheet->attributes($rNs)['id'];
                $target = $relMap[$rId] ?? null;
                if (!$target)
                    continue;
                $path = (str_starts_with($target, '/')) ? ltrim($target, '/') : 'xl/' . $target;
                $sheetList[] = ['name' => (string) $sheet['name'], 'path' => $path];
            }
        }

        $result = [];
        foreach ($sheetList as $meta) {
            $sheetXml = $zip->getFromName($meta['path']);
            if ($sheetXml === false)
                continue;
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
                    if ($t === 's' && $val !== '')
                        $val = $sharedStrings[(int) $val] ?? '';
                    $rowArr[$colIdx] = $val;
                }
                for ($i = 0; $i <= $maxCol; $i++) {
                    if (!isset($rowArr[$i]))
                        $rowArr[$i] = '';
                }
                ksort($rowArr);
                $rows[] = array_values($rowArr);
            }
            $result[] = ['name' => $meta['name'], 'rows' => $rows];
        }
        $zip->close();
        return $result;
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