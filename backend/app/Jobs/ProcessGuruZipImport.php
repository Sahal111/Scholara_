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
use Illuminate\Support\Facades\Storage;

class ProcessGuruZipImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;
    public int $tries = 1;

    public function __construct(
        private string $batchId,
        private string $storedZipPath,
        private string $modeDuplikat,
        private int $userId,
        private string $ipAddress,
    ) {
    }

    public function handle(): void
    {
        $log = GuruImportLog::where('batch_id', $this->batchId)->firstOrFail();
        $log->update(['status' => 'processing', 'started_at' => now()]);

        $startTime = microtime(true);
        $zipPath = storage_path('app/' . $this->storedZipPath);

        $zip = new \ZipArchive();
        if ($zip->open($zipPath) !== true) {
            $log->update(['status' => 'failed', 'error_detail' => [['pesan' => 'ZIP tidak bisa dibuka.']]]);
            return;
        }

        // ── Step 1: Cari file Excel di dalam ZIP ────────────────────────
        $excelContent = null;
        $excelName = null;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $name = $stat['name'];
            $base = basename($name);
            $ext = strtolower(pathinfo($base, PATHINFO_EXTENSION));
            if (in_array($ext, ['xlsx', 'xls']) && !str_contains($name, '__MACOSX')) {
                $excelContent = $zip->getFromIndex($i);
                $excelName = $base;
                break;
            }
        }

        if (!$excelContent) {
            $zip->close();
            $log->update(['status' => 'failed', 'error_detail' => [['pesan' => 'File Excel (.xlsx) tidak ditemukan dalam ZIP.']]]);
            return;
        }

        // Simpan Excel sementara untuk di-parse
        $tmpExcel = storage_path('app/imports/tmp_' . $this->batchId . '.xlsx');
        file_put_contents($tmpExcel, $excelContent);

        // ── Step 2: Dispatch ProcessGuruImport untuk data Excel ─────────
        ProcessGuruImport::dispatchSync(
            $this->batchId . '_excel',
            'imports/tmp_' . $this->batchId . '.xlsx',
            [], // auto-mapping
            $this->modeDuplikat,
            $this->userId,
            $this->ipAddress,
        );

        // ── Step 3: Proses file-file media dari ZIP ─────────────────────
        $mediaStats = [
            'foto' => 0,
            'ijazah' => 0,
            'sertifikasi' => 0,
            'diklat' => 0,
            'inpassing' => 0,
            'mutasi' => 0,
            'dokumen' => 0,
            'dilewati' => 0,
            'errors' => [],
        ];

        $allowedImg = ['jpg', 'jpeg', 'png', 'webp'];
        $allowedDoc = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

        // Folder yang dikenali (sama dengan importFoto yang sudah ada)
        $folderMap = [
            'foto' => 'foto-guru',
            'foto-guru' => 'foto-guru',
            'ijazah' => 'file-ijazah',
            'file-ijazah' => 'file-ijazah',
            'sertifikat' => 'file-sertifikasi',
            'sertifikasi' => 'file-sertifikasi',
            'file-sertifikasi' => 'file-sertifikasi',
            'diklat' => 'file-diklat',
            'file-diklat' => 'file-diklat',
            'inpassing' => 'file-inpassing',
            'file-inpassing' => 'file-inpassing',
            'mutasi' => 'file-mutasi',
            'file-mutasi' => 'file-mutasi',
            'dokumen' => 'file-dokumen',
            'ktp' => 'file-dokumen',
            'kk' => 'file-dokumen',
            'sk' => 'file-dokumen',
            'transkrip' => 'file-dokumen',
            'file-dokumen' => 'file-dokumen',
        ];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $zipPath_inner = $stat['name'];
            $filename = basename($zipPath_inner);
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            if (
                substr($zipPath_inner, -1) === '/' ||
                str_contains($zipPath_inner, '__MACOSX') ||
                str_starts_with($filename, '._') ||
                $filename === '' ||
                in_array($ext, ['xlsx', 'xls', 'csv'])
            ) {
                $mediaStats['dilewati']++;
                continue;
            }

            // Tentukan folder dari path ZIP
            $parts = explode('/', $zipPath_inner);
            $rawFolder = count($parts) > 1 ? strtolower($parts[count($parts) - 2]) : '';
            $targetFolder = $folderMap[$rawFolder] ?? null;

            // Jika file di root ZIP dan itu gambar → anggap foto
            if (!$targetFolder && count($parts) === 1 && in_array($ext, $allowedImg)) {
                $targetFolder = 'foto-guru';
            }

            if (!$targetFolder) {
                $mediaStats['dilewati']++;
                continue;
            }

            // Ambil NUPTK dari nama file
            $stem = pathinfo($filename, PATHINFO_FILENAME);
            $nuptk = explode('_', $stem)[0];

            $guru = Guru::where('nuptk', $nuptk)->first();
            if (!$guru) {
                $mediaStats['errors'][] = "{$filename}: NUPTK {$nuptk} tidak ditemukan.";
                $mediaStats['dilewati']++;
                continue;
            }

            $content = $zip->getFromIndex($i);

            try {
                if ($targetFolder === 'foto-guru') {
                    if (!in_array($ext, $allowedImg)) {
                        $mediaStats['dilewati']++;
                        continue;
                    }
                    if ($guru->foto)
                        Storage::disk('public')->delete($guru->foto);
                    $path = "foto-guru/{$nuptk}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $guru->update(['foto' => $path]);
                    $mediaStats['foto']++;

                } elseif ($targetFolder === 'file-ijazah') {
                    if (!in_array($ext, $allowedDoc)) {
                        $mediaStats['dilewati']++;
                        continue;
                    }
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $pendidikan = $recordId ? $guru->pendidikans()->find($recordId) : $guru->pendidikans()->latest()->first();
                    if (!$pendidikan) {
                        $mediaStats['errors'][] = "{$filename}: Data pendidikan tidak ditemukan.";
                        continue;
                    }
                    if ($pendidikan->file_ijazah)
                        Storage::disk('public')->delete($pendidikan->file_ijazah);
                    $path = "file-ijazah/{$nuptk}_{$pendidikan->id}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $pendidikan->update(['file_ijazah' => $path]);
                    $mediaStats['ijazah']++;

                } elseif ($targetFolder === 'file-dokumen') {
                    if (!in_array($ext, $allowedDoc)) {
                        $mediaStats['dilewati']++;
                        continue;
                    }
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $dokumen = $recordId ? $guru->dokumens()->find($recordId) : null;
                    $path = "file-dokumen/{$nuptk}_" . time() . ".{$ext}";
                    Storage::disk('public')->put($path, $content);
                    if ($dokumen) {
                        if ($dokumen->file_path)
                            Storage::disk('public')->delete($dokumen->file_path);
                        $dokumen->update(['file_path' => $path]);
                    } else {
                        // Buat record dokumen baru — kategori dari nama folder asli
                        $kategoriRaw = count($parts) > 1 ? strtolower($parts[count($parts) - 2]) : 'lainnya';
                        $kategoriMap = ['ktp' => 'identitas', 'kk' => 'identitas', 'sk' => 'kepegawaian', 'transkrip' => 'pendidikan'];
                        $guru->dokumens()->create([
                            'nama_dokumen' => strtoupper($kategoriRaw) . ' - ' . $guru->nama,
                            'file_path' => $path,
                            'file_type' => $ext,
                            'file_size' => strlen($content),
                            'kategori' => $kategoriMap[$kategoriRaw] ?? 'lainnya',
                        ]);
                    }
                    $mediaStats['dokumen']++;
                }
            } catch (\Exception $e) {
                $mediaStats['errors'][] = "{$filename}: " . $e->getMessage();
            }
        }

        $zip->close();

        // Merge hasil media ke log
        $existingErrors = $log->fresh()->error_detail ?? [];
        $allErrors = array_merge($existingErrors, $mediaStats['errors']);
        $durasi = round(microtime(true) - $startTime, 2);

        $log->update([
            'status' => 'done',
            'error_detail' => $allErrors,
            'statistik_relasi' => array_merge($log->fresh()->statistik_relasi ?? [], $mediaStats),
            'progress_persen' => 100,
            'durasi_detik' => $durasi,
            'finished_at' => now(),
        ]);

        // Hapus file temp
        Storage::delete($this->storedZipPath);
        if (file_exists($tmpExcel))
            unlink($tmpExcel);

        ActivityLog::create([
            'user_id' => $this->userId,
            'action' => 'import',
            'module' => 'guru',
            'keterangan' => json_encode(['batch_id' => $this->batchId, 'tipe' => 'zip', 'durasi' => $durasi . 's']),
            'ip_address' => $this->ipAddress,
        ]);
    }
}