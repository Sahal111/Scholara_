<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mapel\ImportMapelRequest;
use App\Http\Requests\Mapel\StoreMapelRequest;
use App\Http\Requests\Mapel\UpdateMapelRequest;
use App\Jobs\ProcessMapelImport;
use App\Models\MataPelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterDataMapelController extends Controller
{
    /* ── INDEX ───────────────────────────────────────────────── */
    public function index(Request $request): JsonResponse
    {
        $query = MataPelajaran::query()
            ->when($request->search, fn($q) => $q
                ->where('nama_mapel', 'like', "%{$request->search}%")
                ->orWhere('kode', 'like', "%{$request->search}%"))
            ->when($request->kelompok, fn($q) => $q->where('kelompok', $request->kelompok))
            // FIX #1: tingkat disimpan sebagai "1,3,5" — harus LIKE, bukan = (exact match)
            ->when($request->tingkat, fn($q) => $q->where('tingkat', 'LIKE', "%{$request->tingkat}%"))
            ->when(
                $request->is_active !== null && $request->is_active !== '',
                fn($q) => $q->where('is_active', (bool) $request->is_active)
            )
            ->orderBy('kelompok')->orderBy('nama_mapel')
            ->paginate(20);

        return $this->success($query);
    }

    /* ── STORE ───────────────────────────────────────────────── */
    public function store(StoreMapelRequest $request): JsonResponse
    {
        // FIX #2: pakai $request->validated() bukan $request->field langsung
        $validated = $request->validated();

        $mapel = MataPelajaran::create([
            'kode' => strtoupper($validated['kode']),
            'nama_mapel' => $validated['nama_mapel'],
            'kelompok' => $validated['kelompok'],
            'tingkat' => $this->parseTingkat($validated['tingkat'] ?? null),
            'jam_per_minggu' => (int) $validated['jam_per_minggu'],
            'kurikulum' => $validated['kurikulum'],
            'is_active' => true,
        ]);

        return $this->created($mapel, 'Mata pelajaran berhasil ditambahkan.');
    }

    /* ── SHOW ────────────────────────────────────────────────── */
    public function show($id): JsonResponse
    {
        $mapel = MataPelajaran::findOrFail($id);

        // FIX #3: layer 2 auth — pastikan resource milik sekolah yang sama
        $this->authorize('view', $mapel);

        return $this->success($mapel);
    }

    /* ── UPDATE ──────────────────────────────────────────────── */
    public function update(UpdateMapelRequest $request, $id): JsonResponse
    {
        $mapel = MataPelajaran::findOrFail($id);

        // FIX #3: layer 2 auth
        $this->authorize('update', $mapel);

        // FIX #2: pakai $request->validated()
        $validated = $request->validated();

        $mapel->update([
            'kode' => strtoupper($validated['kode']),
            'nama_mapel' => $validated['nama_mapel'],
            'kelompok' => $validated['kelompok'],
            'tingkat' => $this->parseTingkat($validated['tingkat'] ?? null),
            'jam_per_minggu' => (int) $validated['jam_per_minggu'],
            'kurikulum' => $validated['kurikulum'],
            'is_active' => $request->boolean('is_active', $mapel->is_active),
        ]);

        return $this->success($mapel->fresh(), 'Mata pelajaran berhasil diperbarui.');
    }

    /* ── TOGGLE ACTIVE ───────────────────────────────────────── */
    public function toggleActive($id): JsonResponse
    {
        $mapel = MataPelajaran::findOrFail($id);

        // FIX #3: layer 2 auth
        $this->authorize('toggleActive', $mapel);

        $mapel->update(['is_active' => !$mapel->is_active]);

        return $this->success($mapel->fresh(), 'Status berhasil diubah.');
    }

    /* ── DESTROY ─────────────────────────────────────────────── */
    public function destroy($id): JsonResponse
    {
        $mapel = MataPelajaran::findOrFail($id);

        // FIX #3: layer 2 auth
        $this->authorize('delete', $mapel);

        // Sekarang soft delete karena model pakai SoftDeletes trait
        $mapel->delete();

        return $this->success(null, 'Mata pelajaran berhasil dihapus.');
    }

    /* ── DROPDOWN ────────────────────────────────────────────── */
    public function dropdown(): JsonResponse
    {
        $data = MataPelajaran::where('is_active', true)
            ->orderBy('kelompok')->orderBy('nama_mapel')
            ->get(['id', 'kode', 'nama_mapel', 'kelompok', 'tingkat']);

        return $this->success($data);
    }

    /* ── EXPORT ──────────────────────────────────────────────── */
    public function export(Request $request)
    {
        $rows = MataPelajaran::query()
            ->when($request->kelompok, fn($q) => $q->where('kelompok', $request->kelompok))
            // FIX #1: konsisten — filter tingkat pakai LIKE
            ->when($request->tingkat, fn($q) => $q->where('tingkat', 'LIKE', "%{$request->tingkat}%"))
            ->when(
                $request->is_active !== null && $request->is_active !== '',
                fn($q) => $q->where('is_active', (bool) $request->is_active)
            )
            ->orderBy('kelompok')->orderBy('nama_mapel')
            ->get();

        $headers = ['Kode', 'Nama Mata Pelajaran', 'Kelompok', 'Tingkat', 'Jam/Minggu', 'Kurikulum', 'Status'];
        $dataRows = $rows->map(fn($m) => [
            $m->kode,
            $m->nama_mapel,
            $m->kelompok,
            $m->tingkat ?? 'Semua',
            $m->jam_per_minggu,
            $m->kurikulum,
            $m->is_active ? 'Aktif' : 'Non-aktif',
        ])->toArray();

        $filename = 'master_mapel_' . now()->format('Ymd_His') . '.xlsx';
        $xlsx = $this->buildXlsx($headers, $dataRows);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Content-Length' => strlen($xlsx),
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /* ── DOWNLOAD TEMPLATE ───────────────────────────────────── */
    public function downloadTemplate()
    {
        $headers = ['kode', 'nama_mapel', 'kelompok', 'tingkat', 'jam_per_minggu', 'kurikulum'];
        $examples = [
            ['MTK', 'Matematika', 'A - Wajib', 'Semua', '4', 'Keduanya'],
            ['IPA', 'Ilmu Pengetahuan Alam', 'A - Wajib', '4,5,6', '3', 'Kurikulum Merdeka'],
            ['BTQ', 'Baca Tulis Quran', 'C - Muatan Lokal', '1,2,3', '2', 'Kurikulum 2013'],
            ['PJOK', 'Pendidikan Jasmani', 'B - Wajib', 'Semua', '3', 'Keduanya'],
        ];

        $xlsx = $this->buildXlsx($headers, $examples);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="template_import_mapel.xlsx"',
            'Content-Length' => strlen($xlsx),
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /* ── IMPORT ──────────────────────────────────────────────── */
    /* FIX #4: import sekarang async via Job (standar wajib)      */
    public function import(ImportMapelRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $schoolId = app('current_school_id');

        // Simpan file ke storage sementara agar bisa dibaca Job
        $path = $file->store("schools/{$schoolId}/imports/mapel", 'local');

        // Dispatch Job — proses dilakukan async di queue
        ProcessMapelImport::dispatch($path, $schoolId, auth()->id());

        return $this->success(
            ['queued' => true],
            'File sedang diproses di latar belakang. Silakan refresh halaman beberapa saat lagi.'
        );
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  HELPER: Build .xlsx binary (pure PHP, no composer lib)    */
    /* ─────────────────────────────────────────────────────────── */
    private function buildXlsx(array $headerRow, array $dataRows): string
    {
        // ── Kumpulkan shared strings ──────────────────────────────
        $strings = [];
        $addStr = function (string $s) use (&$strings): int {
            $key = array_search($s, $strings, true);
            if ($key === false) {
                $strings[] = $s;
                return count($strings) - 1;
            }
            return $key;
        };

        // ── Build sheet rows XML ──────────────────────────────────
        $sheetRowsXml = '';
        $allRows = array_merge([$headerRow], $dataRows);
        foreach ($allRows as $ri => $row) {
            $rowNum = $ri + 1;
            $isHeader = $ri === 0;
            $cellsXml = '';
            foreach ($row as $ci => $val) {
                $colLetter = $this->indexToColLetter($ci);
                $cellRef = "{$colLetter}{$rowNum}";
                $sAttr = $isHeader ? ' s="1"' : ($ri % 2 === 0 ? ' s="2"' : '');
                $strIdx = $addStr((string) $val);
                $cellsXml .= "<c r=\"{$cellRef}\" t=\"s\"{$sAttr}><v>{$strIdx}</v></c>";
            }
            $sheetRowsXml .= "<row r=\"{$rowNum}\">{$cellsXml}</row>";
        }

        // ── Shared strings XML ────────────────────────────────────
        $ssItems = '';
        foreach ($strings as $s) {
            $ssItems .= '<si><t xml:space="preserve">' . htmlspecialchars($s, ENT_XML1) . '</t></si>';
        }
        $ssCount = count($strings);
        $ssXml = <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{$ssCount}" uniqueCount="{$ssCount}">{$ssItems}</sst>
XML;

        // ── Auto-width via customWidth ────────────────────────────
        $colCount = count($headerRow);
        $colDefsXml = '<cols>';
        for ($ci = 0; $ci < $colCount; $ci++) {
            $maxLen = 10;
            foreach ($allRows as $row) {
                $len = mb_strlen((string) ($row[$ci] ?? ''));
                $maxLen = max($maxLen, $len);
            }
            $width = min($maxLen + 4, 60);
            $colNum = $ci + 1;
            $colDefsXml .= "<col min=\"{$colNum}\" max=\"{$colNum}\" width=\"{$width}\" customWidth=\"1\"/>";
        }
        $colDefsXml .= '</cols>';

        $sheetXml = <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
{$colDefsXml}
<sheetData>{$sheetRowsXml}</sheetData>
</worksheet>
XML;

        // ── Styles (header ungu, zebra lavender) ──────────────────
        $stylesXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>
    <font><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF5B21B6"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF5F3FF"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCCCCCC"/></left>
      <right style="thin"><color rgb="FFCCCCCC"/></right>
      <top style="thin"><color rgb="FFCCCCCC"/></top>
      <bottom style="thin"><color rgb="FFCCCCCC"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"><alignment wrapText="0"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0"><alignment horizontal="center" wrapText="0"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0"><alignment wrapText="0"/></xf>
  </cellXfs>
</styleSheet>
XML;

        // ── Workbook & rels ───────────────────────────────────────
        $workbookXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets>
</workbook>
XML;

        $workbookRels = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
XML;

        $rootRels = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
XML;

        $contentTypes = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"             ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml"        ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml"               ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
XML;

        // ── Zip → .xlsx ───────────────────────────────────────────
        $tmpFile = tempnam(sys_get_temp_dir(), 'xlsx_');
        $zip = new \ZipArchive();
        $zip->open($tmpFile, \ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $contentTypes);
        $zip->addFromString('_rels/.rels', $rootRels);
        $zip->addFromString('xl/workbook.xml', $workbookXml);
        $zip->addFromString('xl/_rels/workbook.xml.rels', $workbookRels);
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);
        $zip->addFromString('xl/sharedStrings.xml', $ssXml);
        $zip->addFromString('xl/styles.xml', $stylesXml);
        $zip->close();

        $binary = file_get_contents($tmpFile);
        unlink($tmpFile);
        return $binary;
    }

    /* ── Helper: column index (0-based) → letter ────────────── */
    private function indexToColLetter(int $index): string
    {
        $letter = '';
        $index++;
        while ($index > 0) {
            $index--;
            $letter = chr(65 + ($index % 26)) . $letter;
            $index = intdiv($index, 26);
        }
        return $letter;
    }

    /* ── Helper: parse tingkat array → string CSV ───────────── */
    private function parseTingkat(?array $tingkat): ?string
    {
        if (empty($tingkat) || count($tingkat) === 6) {
            return null; // null = semua tingkat
        }
        return implode(',', array_values(
            array_filter($tingkat, fn($t) => in_array($t, ['1', '2', '3', '4', '5', '6']))
        ));
    }
}
