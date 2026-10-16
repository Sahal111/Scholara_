<?php

namespace App\Http\Controllers\MasterData\Guru;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Services\GuruExportService;
use Illuminate\Http\Request;

class GuruExportController extends Controller
{
    public function __construct(private GuruExportService $exportService)
    {
        $this->middleware(function ($req, $next) {
            $this->authorize('export', Guru::class);
            return $next($req);
        });
    }

    public function export(Request $request)
    {
        $gurus = $this->queryGurus()
            ->when($request->jenis_ptk, fn($q) => $q->where('jenis_ptk', $request->jenis_ptk))
            ->when($request->status_kepegawaian, fn($q) => $q->where('status_kepegawaian', $request->status_kepegawaian))
            ->when($request->status_keaktifan, fn($q) => $q->where('status_keaktifan', $request->status_keaktifan))
            ->when($request->search, fn($q) => $q->where('nama', 'like', "%{$request->search}%")
                ->orWhere('nuptk', 'like', "%{$request->search}%"))
            ->orderBy('nama')
            ->get();

        $filename = 'data_guru_' . now()->format('Ymd_His') . '.xlsx';

        return $this->xlsxResponse($this->exportService->build($gurus), $filename);
    }

    public function exportBackup()
    {
        $gurus = $this->queryGurus()->orderBy('nama')->get();

        $filename = 'backup_guru_' . now()->format('Ymd_His') . '.xlsx';

        return $this->xlsxResponse($this->exportService->build($gurus), $filename);
    }

    // ─────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────

    private function queryGurus()
    {
        return Guru::query()->with([
            'keluarga',
            'anaks',
            'rekenings' => fn($q) => $q->where('is_primary', 1),
            'pendidikans',
            'sertifikasis',
            'diklats',
            'jabatans',
            'inpassings',
            'mutasi',
            'kompetensi',
            'kontakDarurat',
            'dokumens',
            'waliKelas' => fn($q) => $q->where('is_active', 1)->with('kelas:id,nama_kelas'),
        ]);
    }

    private function xlsxResponse(string $xlsx, string $filename): \Illuminate\Http\Response
    {
        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Content-Length' => strlen($xlsx),
            'Cache-Control' => 'max-age=0',
        ]);
    }
}