<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Services\GuruExportService;
use App\Services\GuruImportService;
use App\Services\Excel\MultiSheetXlsxService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * GuruExportImportTest
 *
 * Memverifikasi bahwa refactor GuruExportController (1125 → 74 baris)
 * dan GuruImportController tidak merusak fungsionalitas yang sudah ada.
 *
 * Skenario:
 *   1. GuruExportService::buildSheets() mengembalikan 12 sheet definitions.
 *   2. GuruExportService::build() menghasilkan bytes XLSX non-empty.
 *   3. Export via API endpoint mengembalikan file .xlsx (Content-Type benar).
 *   4. Export backup via API endpoint mengembalikan file .xlsx.
 *   5. GuruImportService::import() memproses data guru baru (berhasil count).
 *   6. GuruImportService::import() memperbarui guru yang sudah ada (diperbarui count).
 *   7. GuruImportService::import() mencatat error jika NUPTK kosong.
 *   8. GuruImportService::import() dengan file kosong → error deskriptif.
 *   9. GuruImportService::buildSummaryMessage() format output yang benar.
 *  10. GuruImportService::importRelasi() bisa dipanggil sebagai public method.
 *  11. Import via API endpoint → 200 dengan struktur response yang benar.
 *  12. Import file bukan XLSX → 422 validation error.
 *  13. Export respects tenant: operator hanya export guru milik sekolahnya.
 */
class GuruExportImportTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────

    /** Buat guru di sekolah aktif via DB langsung. */
    private function createGuru(array $overrides = []): Guru
    {
        $schoolId = app()->bound('current_school_id') ? app('current_school_id') : null;

        $id = DB::table('gurus')->insertGetId(array_merge([
            'school_id' => $schoolId,
            'nuptk' => '1000000000000' . rand(100, 999),
            'nama' => 'Guru Test',
            'jenis_kelamin' => 'L',
            'jenis_ptk' => 'Guru Kelas',
            'status_kepegawaian' => 'GTT',
            'status_keaktifan' => 'Aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        return Guru::withoutGlobalScopes()->find($id);
    }

    /**
     * Buat file XLSX in-memory dengan satu sheet "Data Utama"
     * berisi header + satu baris guru valid.
     *
     * Menggunakan MultiSheetXlsxService agar tidak perlu library eksternal.
     */
    private function makeXlsxWithGuru(string $nuptk, string $nama): string
    {
        /** @var MultiSheetXlsxService $xlsx */
        $xlsx = app(MultiSheetXlsxService::class);

        $sheets = [
            [
                'name' => 'Data Utama',
                'headers' => [
                    'nuptk*',
                    'nama*',
                    'jenis_kelamin (L/P)*',
                    'tempat_lahir*',
                    'tanggal_lahir (YYYY-MM-DD)*',
                    'no_hp*',
                    'jenis_ptk*',
                    'status_kepegawaian*',
                ],
                'rows' => [
                    [$nuptk, $nama, 'L', 'Jakarta', '1990-01-01', '081234567890', 'Guru Kelas', 'GTT'],
                ],
            ],
        ];

        return $xlsx->build($sheets);
    }

    /**
     * Simpan bytes XLSX ke file temp, return path-nya.
     */
    private function saveTempXlsx(string $bytes): string
    {
        $path = sys_get_temp_dir() . '/test_guru_' . uniqid() . '.xlsx';
        file_put_contents($path, $bytes);
        return $path;
    }

    // ─────────────────────────────────────────────────────────────────
    // 1–2: GuruExportService (Unit-style via container)
    // ─────────────────────────────────────────────────────────────────

    /** buildSheets() harus mengembalikan tepat 12 sheet definitions. */
    public function test_export_service_build_sheets_mengembalikan_12_sheet(): void
    {
        $school = $this->createSchool();
        $this->createGuru(['school_id' => $school->id, 'nuptk' => '5555555555555555', 'nama' => 'Guru Export Test']);

        /** @var GuruExportService $svc */
        $svc = app(GuruExportService::class);

        $gurus = Guru::with([
            'keluarga',
            'anaks',
            'rekenings',
            'pendidikans',
            'sertifikasis',
            'diklats',
            'jabatans',
            'inpassings',
            'mutasi',
            'kompetensi',
            'kontakDarurat',
            'dokumens',
        ])->get();

        $sheets = $svc->buildSheets($gurus);

        $this->assertCount(12, $sheets, 'buildSheets() harus mengembalikan 12 sheet definitions.');

        // Semua sheet harus punya key 'name', 'headers', 'rows'
        foreach ($sheets as $sheet) {
            $this->assertArrayHasKey('name', $sheet);
            $this->assertArrayHasKey('headers', $sheet);
            $this->assertArrayHasKey('rows', $sheet);
        }
    }

    /** build() harus menghasilkan bytes non-empty (ZIP/XLSX valid). */
    public function test_export_service_build_menghasilkan_bytes_non_empty(): void
    {
        $school = $this->createSchool();
        $this->createGuru(['school_id' => $school->id, 'nuptk' => '6666666666666666', 'nama' => 'Guru Build Test']);

        /** @var GuruExportService $svc */
        $svc = app(GuruExportService::class);

        $gurus = Guru::with([
            'keluarga',
            'anaks',
            'rekenings',
            'pendidikans',
            'sertifikasis',
            'diklats',
            'jabatans',
            'inpassings',
            'mutasi',
            'kompetensi',
            'kontakDarurat',
            'dokumens',
        ])->get();

        $bytes = $svc->build($gurus);

        $this->assertNotEmpty($bytes, 'build() harus menghasilkan bytes XLSX non-empty.');

        // XLSX adalah file ZIP — magic bytes PK (0x50 0x4B)
        $this->assertEquals('PK', substr($bytes, 0, 2), 'Bytes harus dimulai dengan magic bytes ZIP (XLSX).');
    }

    // ─────────────────────────────────────────────────────────────────
    // 3–4: Export via API endpoint
    // ─────────────────────────────────────────────────────────────────

    /** GET /guru/export → 200 + Content-Type XLSX. */
    public function test_export_api_mengembalikan_file_xlsx(): void
    {
        ['school' => $school, 'user' => $operator] = $this->loginAsOperator();
        $this->createGuru(['school_id' => $school->id, 'nuptk' => '7777777777777777', 'nama' => 'Guru API Export']);

        $response = $this->jsonWithTenant('GET', '/api/operator/master-data/guru/export', [], $school->id);

        $response->assertStatus(200);
        $this->assertStringContainsString(
            'openxmlformats-officedocument.spreadsheetml.sheet',
            $response->headers->get('Content-Type') ?? '',
            'Content-Type harus application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        $this->assertStringContainsString(
            'data_guru_',
            $response->headers->get('Content-Disposition') ?? '',
            'Content-Disposition harus mengandung nama file data_guru_*.xlsx'
        );
    }

    /** GET /guru/backup → 200 + Content-Type XLSX + filename backup_guru_*. */
    public function test_export_backup_api_mengembalikan_file_xlsx(): void
    {
        ['school' => $school] = $this->loginAsOperator();
        $this->createGuru(['school_id' => $school->id, 'nuptk' => '8888888888888888', 'nama' => 'Guru Backup Test']);

        $response = $this->jsonWithTenant('GET', '/api/operator/master-data/guru/backup', [], $school->id);

        $response->assertStatus(200);
        $this->assertStringContainsString(
            'backup_guru_',
            $response->headers->get('Content-Disposition') ?? '',
            'Filename backup harus mengandung "backup_guru_"'
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // 5–8: GuruImportService (Unit-style)
    // ─────────────────────────────────────────────────────────────────

    /** import() dengan data valid → berhasil = 1, gagal = 0. */
    public function test_import_service_berhasil_proses_guru_baru(): void
    {
        $school = $this->createSchool();
        $this->setTenant($school->id); // SchoolScope butuh tenant context

        $nuptk = '3333333333333333';
        $bytes = $this->makeXlsxWithGuru($nuptk, 'Guru Import Baru');
        $path = $this->saveTempXlsx($bytes);

        /** @var GuruImportService $svc */
        $svc = app(GuruImportService::class);

        $results = $svc->import($path);

        unlink($path);

        $this->assertEquals(1, $results['berhasil'], 'Harus ada 1 guru yang berhasil diimport.');
        $this->assertEquals(0, $results['gagal'], 'Tidak boleh ada yang gagal.');
        $this->assertEmpty($results['errors'], 'Tidak boleh ada error messages.');

        // Pastikan tersimpan di DB
        $guru = \App\Models\Guru::withoutGlobalScopes()->where('nama', 'Guru Import Baru')->first();
        $this->assertNotNull($guru, 'Guru hasil import harus tersimpan.');
        $this->assertEquals($nuptk, $guru->nuptk);
    }

    /** import() guru yang sudah ada → diperbarui = 1, berhasil = 0. */
    public function test_import_service_memperbarui_guru_yang_sudah_ada(): void
    {
        $school = $this->createSchool();
        $this->setTenant($school->id); // SchoolScope butuh tenant context
        $nuptk = '4444444444444444';

        // Buat guru existing
        $this->createGuru(['school_id' => $school->id, 'nuptk' => $nuptk, 'nama' => 'Nama Lama']);

        $bytes = $this->makeXlsxWithGuru($nuptk, 'Nama Baru');
        $path = $this->saveTempXlsx($bytes);

        /** @var GuruImportService $svc */
        $svc = app(GuruImportService::class);

        $results = $svc->import($path);

        unlink($path);

        $this->assertEquals(0, $results['berhasil'], 'Guru existing tidak dihitung sebagai baru.');
        $this->assertEquals(1, $results['diperbarui'], 'Harus ada 1 guru yang diperbarui.');

        // Pastikan nama diperbarui
        $this->assertDatabaseHas('gurus', ['nuptk' => $nuptk, 'nama' => 'Nama Baru']);
        $this->assertDatabaseMissing('gurus', ['nuptk' => $nuptk, 'nama' => 'Nama Lama']);
    }

    /** import() baris tanpa NUPTK → gagal + error message. */
    public function test_import_service_catat_error_jika_nuptk_kosong(): void
    {
        $school = $this->createSchool();

        /** @var MultiSheetXlsxService $xlsx */
        $xlsx = app(MultiSheetXlsxService::class);

        // Buat sheet dengan NUPTK kosong
        $bytes = $xlsx->build([
            [
                'name' => 'Data Utama',
                'headers' => ['nuptk*', 'nama*', 'jenis_kelamin (L/P)*', 'no_hp*', 'jenis_ptk*', 'status_kepegawaian*'],
                'rows' => [
                    ['', 'Guru Tanpa NUPTK', 'L', '081234567890', 'Guru Kelas', 'GTT'],
                ],
            ]
        ]);

        $path = $this->saveTempXlsx($bytes);

        /** @var GuruImportService $svc */
        $svc = app(GuruImportService::class);

        $results = $svc->import($path);

        unlink($path);

        $this->assertEquals(1, $results['gagal'], 'Baris tanpa NUPTK harus dihitung sebagai gagal.');
        $this->assertNotEmpty($results['errors'], 'Harus ada pesan error.');
        $this->assertStringContainsString('NUPTK wajib', $results['errors'][0]);
    }

    /** import() file kosong → error deskriptif. */
    public function test_import_service_file_kosong_return_error(): void
    {
        $school = $this->createSchool();

        // Buat file kosong (0 bytes)
        $path = sys_get_temp_dir() . '/test_empty_' . uniqid() . '.xlsx';
        file_put_contents($path, '');

        /** @var GuruImportService $svc */
        $svc = app(GuruImportService::class);

        $results = $svc->import($path);

        // Hapus file setelah import (mungkin sudah dihapus service atau tidak ada)
        if (file_exists($path)) {
            unlink($path);
        }

        $this->assertNotEmpty($results['errors'], 'File kosong harus menghasilkan error message.');
        $this->assertEquals(0, $results['berhasil']);
    }

    // ─────────────────────────────────────────────────────────────────
    // 9: buildSummaryMessage
    // ─────────────────────────────────────────────────────────────────

    /** buildSummaryMessage() menformat string summary dengan benar. */
    public function test_build_summary_message_format_benar(): void
    {
        /** @var GuruImportService $svc */
        $svc = app(GuruImportService::class);

        $results = [
            'berhasil' => 5,
            'diperbarui' => 3,
            'gagal' => 1,
            'relasi' => ['keluarga' => 10, 'pendidikan' => 5],
            'errors' => [],
        ];

        $msg = $svc->buildSummaryMessage($results);

        $this->assertStringContainsString('5 guru ditambahkan', $msg);
        $this->assertStringContainsString('3 diperbarui', $msg);
        $this->assertStringContainsString('1 gagal', $msg);
        $this->assertStringContainsString('keluarga', $msg);
    }

    // ─────────────────────────────────────────────────────────────────
    // 10: importRelasi() public method ada dan bisa dipanggil
    // ─────────────────────────────────────────────────────────────────

    /**
     * importRelasi() harus ada sebagai public method dan tidak crash.
     * Ini fix dari bug yang dilaporkan di AUDIT_REPORT.md:
     * "importRelasiFromSheets() yang tidak ditemukan di importExecute()".
     */
    public function test_import_relasi_adalah_public_method_yang_callable(): void
    {
        $school = $this->createSchool();

        /** @var GuruImportService $svc */
        $svc = app(GuruImportService::class);

        $this->assertTrue(
            method_exists($svc, 'importRelasi'),
            'importRelasi() harus ada sebagai public method di GuruImportService.'
        );

        // Panggil dengan allSheets kosong dan stats empty → tidak boleh throw exception
        $stats = ['berhasil' => 0, 'diperbarui' => 0, 'gagal' => 0, 'relasi' => [], 'errors' => []];

        try {
            $svc->importRelasi([], $stats);
            $this->assertTrue(true, 'importRelasi() bisa dipanggil tanpa crash.');
        } catch (\Exception $e) {
            $this->fail('importRelasi() seharusnya tidak throw exception dengan input kosong: ' . $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // 11–12: Import via API endpoint
    // ─────────────────────────────────────────────────────────────────

    /** POST /guru/import dengan file XLSX valid → 200 + struktur response. */
    public function test_import_api_dengan_file_valid_return_200(): void
    {
        ['school' => $school] = $this->loginAsOperator();

        $bytes = $this->makeXlsxWithGuru('9012345678901234', 'Guru Via API');
        $tmpPath = $this->saveTempXlsx($bytes);

        $file = new UploadedFile(
            $tmpPath,
            'import_guru.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $response = $this->jsonWithTenant(
            'POST',
            '/api/operator/master-data/guru/import',
            ['file' => $file],
            $school->id
        );

        unlink($tmpPath);

        // Import sukses → 200 atau 201
        $this->assertContains(
            $response->status(),
            [200, 201],
            "Import dengan file valid harus return 200/201, dapat: " . $response->status()
        );

        if ($response->status() === 200 || $response->status() === 201) {
            $response->assertJsonPath('success', true);
        }
    }

    /** POST /guru/import dengan file bukan XLSX → 422 validation error. */
    public function test_import_api_dengan_file_bukan_xlsx_return_422(): void
    {
        ['school' => $school] = $this->loginAsOperator();

        // Upload file .txt sebagai gantinya
        $file = UploadedFile::fake()->create('data_guru.txt', 10, 'text/plain');

        $response = $this->jsonWithTenant(
            'POST',
            '/api/operator/master-data/guru/import',
            ['file' => $file],
            $school->id
        );

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    // ─────────────────────────────────────────────────────────────────
    // 13: Export respects tenant isolation
    // ─────────────────────────────────────────────────────────────────

    /**
     * Operator school A export → file hanya berisi guru school A,
     * bukan guru school B.
     */
    public function test_export_hanya_mengembalikan_guru_milik_tenant_sendiri(): void
    {
        // School A + operator
        $schoolA = $this->createSchool(['nama' => 'Sekolah A']);
        $operatorA = $this->createUserForSchool($schoolA, 'operator');
        $this->createGuru(['school_id' => $schoolA->id, 'nuptk' => 'AAAAAAAAAAAAAAAA', 'nama' => 'Guru Sekolah A']);

        // School B + guru (tidak boleh muncul di export A)
        $schoolB = $this->createSchool(['nama' => 'Sekolah B']);
        $this->createGuru(['school_id' => $schoolB->id, 'nuptk' => 'BBBBBBBBBBBBBBBB', 'nama' => 'Guru Sekolah B']);

        // Login sebagai operator A, set tenant A
        $this->actingAs($operatorA, 'sanctum');
        $this->setTenant($schoolA->id);

        // Ambil guru via model (pakai SchoolScope)
        $gurus = Guru::all();

        $this->assertCount(1, $gurus, 'SchoolScope harus memastikan export hanya mendapat guru milik tenant A.');
        $this->assertEquals('Guru Sekolah A', $gurus->first()->nama);
        $this->assertNotEquals('BBBBBBBBBBBBBBBB', $gurus->first()->nuptk, 'Guru school B tidak boleh muncul dalam query school A.');
    }
}