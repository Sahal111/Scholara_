<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mapel\ImportMapelRequest;
use App\Http\Requests\Mapel\StoreMapelRequest;
use App\Http\Requests\Mapel\UpdateMapelRequest;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;

class MasterDataMapelController extends Controller
{
    private const KELOMPOK_VALID = ['A - Wajib', 'B - Wajib', 'C - Muatan Lokal', 'Pengembangan Diri', 'Ekstrakurikuler', 'Lainnya'];
    private const KURIKULUM_VALID = ['Kurikulum 2013', 'Kurikulum Merdeka', 'Keduanya'];

    /* ── INDEX ───────────────────────────────────────────────── */
    public function index(Request $request)
    {
        $query = MataPelajaran::query()
            ->when($request->search, fn($q) => $q
                ->where('nama_mapel', 'like', "%{$request->search}%")
                ->orWhere('kode', 'like', "%{$request->search}%"))
            ->when($request->kelompok, fn($q) => $q->where('kelompok', $request->kelompok))
            ->when($request->tingkat, fn($q) => $q->where('tingkat', $request->tingkat))
            ->when(
                $request->is_active !== null && $request->is_active !== '',
                fn($q) => $q->where('is_active', (bool) $request->is_active)
            )
            ->orderBy('kelompok')->orderBy('nama_mapel')
            ->paginate(20);

        return $this->success($query);
    }

    /* ── STORE ───────────────────────────────────────────────── */
    public function store(StoreMapelRequest $request)
    {

        $mapel = MataPelajaran::create([
            'kode' => strtoupper($request->kode),
            'nama_mapel' => $request->nama_mapel,
            'kelompok' => $request->kelompok,
            'tingkat' => $this->parseTingkat($request->tingkat),
            'jam_per_minggu' => (int) $request->jam_per_minggu,
            'kurikulum' => $request->kurikulum,
            'is_active' => true,
        ]);

        return $this->created($mapel, 'Mata pelajaran berhasil ditambahkan.');
    }

    /* ── SHOW ────────────────────────────────────────────────── */
    public function show($id)
    {
        return $this->success(MataPelajaran::findOrFail($id));
    }

    /* ── UPDATE ──────────────────────────────────────────────── */
    public function update(UpdateMapelRequest $request, $id)
    {
        $mapel = MataPelajaran::findOrFail($id);
        $mapel->update([
            'kode' => strtoupper($request->kode),
            'nama_mapel' => $request->nama_mapel,
            'kelompok' => $request->kelompok,
            'tingkat' => $this->parseTingkat($request->tingkat),
            'jam_per_minggu' => (int) $request->jam_per_minggu,
            'kurikulum' => $request->kurikulum,
            'is_active' => $request->boolean('is_active', $mapel->is_active),
        ]);
        return $this->success($mapel->fresh(), 'Mata pelajaran berhasil diperbarui.');
    }

    /* ── TOGGLE ACTIVE ───────────────────────────────────────── */
    public function toggleActive($id)
    {
        $mapel = MataPelajaran::findOrFail($id);
        $mapel->update(['is_active' => !$mapel->is_active]);
        return $this->success($mapel->fresh(), 'Status berhasil diubah.');
    }

    /* ── DESTROY ─────────────────────────────────────────────── */
    public function destroy($id)
    {
        MataPelajaran::findOrFail($id)->delete();
        return $this->success(null, 'Mata pelajaran berhasil dihapus.');
    }

    /* ── DROPDOWN ────────────────────────────────────────────── */
    public function dropdown()
    {
        $data = MataPelajaran::where('is_active', true)
            ->orderBy('kelompok')->orderBy('nama_mapel')
            ->get(['id', 'kode', 'nama_mapel', 'kelompok', 'tingkat']);
        return $this->success($data);
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  EXPORT  →  .xlsx  (pure PHP, no library)                  */
    /* ─────────────────────────────────────────────────────────── */
    public function export(Request $request)
    {
        $rows = MataPelajaran::query()
            ->when($request->kelompok, fn($q) => $q->where('kelompok', $request->kelompok))
            ->when($request->tingkat, fn($q) => $q->where('tingkat', $request->tingkat))
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

    /* ─────────────────────────────────────────────────────────── */
    /*  DOWNLOAD TEMPLATE  →  .xlsx  (pure PHP, no library)       */
    /* ─────────────────────────────────────────────────────────── */
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

    /* ─────────────────────────────────────────────────────────── */
    /*  IMPORT  →  baca .xlsx (ZipArchive + SimpleXML, built-in)  */
    /*             atau .csv sebagai fallback                      */
    /* ─────────────────────────────────────────────────────────── */
    public function import(ImportMapelRequest $request)
    {

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $allRows = [];

        if (in_array($ext, ['xlsx', 'xls'])) {
            // ── Baca xlsx via ZipArchive + SimpleXML ──────────────
            $zip = new \ZipArchive();
            if ($zip->open($file->getRealPath()) !== true) {
                return $this->error('File Excel tidak bisa dibuka.', 'INVALID_EXCEL', 422);
            }

            // Baca shared strings
            $sharedStrings = [];
            $ssXml = $zip->getFromName('xl/sharedStrings.xml');
            if ($ssXml !== false) {
                $ss = simplexml_load_string($ssXml);
                foreach ($ss->si as $si) {
                    // Gabungkan semua <t> dalam satu <si>
                    $text = '';
                    foreach ($si->r ?? [$si] as $r) {
                        $text .= (string) ($r->t ?? '');
                    }
                    if ($text === '' && isset($si->t)) {
                        $text = (string) $si->t;
                    }
                    $sharedStrings[] = $text;
                }
            }

            // Baca sheet pertama
            $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
            $zip->close();

            if ($sheetXml === false) {
                return $this->error('Sheet Excel tidak ditemukan.', 'INVALID_EXCEL_SHEET', 422);
            }

            $sheet = simplexml_load_string($sheetXml);
            $ns = $sheet->getNamespaces(true);
            $sheet->registerXPathNamespace('ns', reset($ns) ?: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

            foreach ($sheet->sheetData->row as $row) {
                $rowData = [];
                foreach ($row->c as $cell) {
                    $type = (string) ($cell['t'] ?? '');
                    $value = (string) ($cell->v ?? '');
                    if ($type === 's') {
                        $value = $sharedStrings[(int) $value] ?? '';
                    } elseif ($type === 'inlineStr') {
                        $value = (string) ($cell->is->t ?? '');
                    }
                    // Tentukan posisi kolom dari referensi sel (A1, B2, dst)
                    $ref = (string) ($cell['r'] ?? '');
                    preg_match('/^([A-Z]+)/', $ref, $colMatch);
                    $colIdx = $colMatch ? $this->colLetterToIndex($colMatch[1]) : count($rowData);
                    // Isi gap jika ada kolom kosong di tengah
                    while (count($rowData) < $colIdx)
                        $rowData[] = '';
                    $rowData[] = $value;
                }
                $allRows[] = $rowData;
            }
        } else {
            // ── CSV fallback ──────────────────────────────────────
            $handle = fopen($file->getRealPath(), 'r');
            $bom = fread($handle, 3);
            if ($bom !== "\xEF\xBB\xBF")
                rewind($handle);
            while (($row = fgetcsv($handle)) !== false)
                $allRows[] = $row;
            fclose($handle);
        }

        if (empty($allRows)) {
            return response()->json(['success' => false, 'message' => 'File kosong atau tidak valid.'], 422);
        }

        // ── Proses header ─────────────────────────────────────────
        $rawHeader = array_shift($allRows);
        $header = array_map(fn($h) => strtolower(trim((string) $h)), $rawHeader);

        $required = ['kode', 'nama_mapel', 'kelompok', 'jam_per_minggu', 'kurikulum'];
        $missing = array_diff($required, $header);
        if ($missing) {
            return response()->json([
                'success' => false,
                'message' => 'Kolom wajib tidak ditemukan: ' . implode(', ', $missing),
            ], 422);
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $rowNum = 1;

        foreach ($allRows as $cols) {
            $rowNum++;
            if (count(array_filter($cols, fn($c) => trim((string) $c) !== '')) === 0)
                continue;

            $data = array_combine($header, array_pad(array_map('strval', $cols), count($header), ''));
            $kode = strtoupper(trim($data['kode'] ?? ''));
            $namaMapel = trim($data['nama_mapel'] ?? '');
            $kelompok = trim($data['kelompok'] ?? '');
            $tingkatRaw = trim($data['tingkat'] ?? '');
            $jamRaw = trim($data['jam_per_minggu'] ?? '');
            $kurikulum = trim($data['kurikulum'] ?? '');

            if (!$kode || !$namaMapel || !$kelompok || !$jamRaw || !$kurikulum) {
                $errors[] = "Baris {$rowNum}: kolom wajib ada yang kosong.";
                $skipped++;
                continue;
            }
            if (!in_array($kelompok, self::KELOMPOK_VALID)) {
                $errors[] = "Baris {$rowNum}: kelompok '{$kelompok}' tidak valid.";
                $skipped++;
                continue;
            }
            if (!in_array($kurikulum, self::KURIKULUM_VALID)) {
                $errors[] = "Baris {$rowNum}: kurikulum '{$kurikulum}' tidak valid.";
                $skipped++;
                continue;
            }
            if (!is_numeric($jamRaw) || (int) $jamRaw < 1 || (int) $jamRaw > 40) {
                $errors[] = "Baris {$rowNum}: jam_per_minggu harus angka 1–40, ditemukan '{$jamRaw}'.";
                $skipped++;
                continue;
            }

            if (!$tingkatRaw || strtolower($tingkatRaw) === 'semua') {
                $tingkatValue = null;
            } else {
                $tList = array_map('trim', explode(',', $tingkatRaw));
                $valid = array_filter($tList, fn($t) => in_array($t, ['1', '2', '3', '4', '5', '6']));
                $tingkatValue = count($valid) === 6 ? null : implode(',', array_values($valid));
            }

            MataPelajaran::updateOrCreate(['kode' => $kode, 'school_id' => app('current_school_id')], [
                'nama_mapel' => $namaMapel,
                'kelompok' => $kelompok,
                'tingkat' => $tingkatValue,
                'jam_per_minggu' => (int) $jamRaw,
                'kurikulum' => $kurikulum,
                'is_active' => true,
            ]);
            $imported++;
        }

        return response()->json([
            'success' => true,
            'message' => "Import selesai. {$imported} data berhasil diimpor, {$skipped} baris dilewati.",
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
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
            // s=1 → header style, s=2 → zebra even, s=0 → default
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

        // ── Sheet XML ─────────────────────────────────────────────
        // Auto-width via customWidth (estimasi karakter × 7 px)
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

        // ── Styles XML ────────────────────────────────────────────
        // Index 0 = default, 1 = header (ungu+bold+white), 2 = zebra (lavender)
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

        // ── Workbook & rels XML ───────────────────────────────────
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

        // ── Zip semua jadi .xlsx ──────────────────────────────────
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

    /* ── Helper: column index (0-based) → letter (A, B, … Z, AA) */
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

    /* ── Helper: column letter → 0-based index ─────────────── */
    private function colLetterToIndex(string $col): int
    {
        $col = strtoupper($col);
        $index = 0;
        for ($i = 0; $i < strlen($col); $i++) {
            $index = $index * 26 + (ord($col[$i]) - 64);
        }
        return $index - 1;
    }

    /* ── Helper: parse tingkat array ────────────────────────── */
    private function parseTingkat(?array $tingkat): ?string
    {
        if (empty($tingkat) || count($tingkat) === 6)
            return null;
        return implode(',', array_values(
            array_filter($tingkat, fn($t) => in_array($t, ['1', '2', '3', '4', '5', '6']))
        ));
    }
}