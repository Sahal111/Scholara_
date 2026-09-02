<?php

namespace App\Services\Excel;

/**
 * XlsxBuilder — generates minimal .xlsx binary (pure PHP, no composer lib).
 *
 * Extracted from MasterDataMapelController to be reusable
 * across all export features (guru, siswa, keuangan, dll).
 */
class XlsxBuilder
{
    /**
     * Build an xlsx binary from header row + data rows.
     */
    public static function build(array $headerRow, array $dataRows): string
    {
        $strings = [];
        $addStr = function (string $s) use (&$strings): int {
            $key = array_search($s, $strings, true);
            if ($key === false) {
                $strings[] = $s;
                return count($strings) - 1;
            }
            return $key;
        };

        $sheetRowsXml = '';
        $allRows = array_merge([$headerRow], $dataRows);

        foreach ($allRows as $ri => $row) {
            $rowNum = $ri + 1;
            $isHeader = $ri === 0;
            $cellsXml = '';

            foreach ($row as $ci => $val) {
                $colLetter = self::indexToColLetter($ci);
                $cellRef = "{$colLetter}{$rowNum}";
                $sAttr = $isHeader ? ' s="1"' : ($ri % 2 === 0 ? ' s="2"' : '');
                $strIdx = $addStr((string) $val);
                $cellsXml .= "<c r=\"{$cellRef}\" t=\"s\"{$sAttr}><v>{$strIdx}</v></c>";
            }

            $sheetRowsXml .= "<row r=\"{$rowNum}\">{$cellsXml}</row>";
        }

        $ssItems = '';
        foreach ($strings as $s) {
            $ssItems .= '<si><t xml:space="preserve">' . htmlspecialchars($s, ENT_XML1) . '</t></si>';
        }
        $ssCount = count($strings);
        $ssXml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<sst xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" "
            . "count=\"{$ssCount}\" uniqueCount=\"{$ssCount}\">{$ssItems}</sst>";

        $colCount = count($headerRow);
        $colDefsXml = '<cols>';
        for ($ci = 0; $ci < $colCount; $ci++) {
            $maxLen = 10;
            foreach ($allRows as $row) {
                $maxLen = max($maxLen, mb_strlen((string) ($row[$ci] ?? '')));
            }
            $width = min($maxLen + 4, 60);
            $colNum = $ci + 1;
            $colDefsXml .= "<col min=\"{$colNum}\" max=\"{$colNum}\" width=\"{$width}\" customWidth=\"1\"/>";
        }
        $colDefsXml .= '</cols>';

        $sheetXml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">"
            . "{$colDefsXml}<sheetData>{$sheetRowsXml}</sheetData></worksheet>";

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
    <fill><patternFill patternType="solid"><fgColor rgb="FF15803D"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF0FDF4"/></patternFill></fill>
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

        $workbookXml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" "
            . "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">"
            . "<sheets><sheet name=\"Data\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>";

        $workbookRels = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
            . "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>"
            . "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings\" Target=\"sharedStrings.xml\"/>"
            . "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>"
            . "</Relationships>";

        $rootRels = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
            . "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>"
            . "</Relationships>";

        $contentTypes = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
            . "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
            . "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
            . "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
            . "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"
            . "<Override PartName=\"/xl/sharedStrings.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml\"/>"
            . "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>"
            . "</Types>";

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

    public static function indexToColLetter(int $index): string
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
}
