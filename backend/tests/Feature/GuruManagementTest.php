<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\School;
use App\Models\User;
use App\Services\GuruExportService;
use App\Services\GuruImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Test: Manajemen Guru — CRUD, Export Service, Import Service.
 *
 * Mencakup:
 * - Operator bisa list, tambah, edit, hapus guru
 * - Cross-tenant protection pada CRUD
 * - GuruExportService menghasilkan output valid
 * - GuruImportService menghasilkan stats yang benar
 */
class GuruManagementTest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private User $operator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = $this->createSchool();
        $this->operator = $this->createUserWithRole($this->school->id, 'operator');
    }

    // ── LIST ──────────────────────────────────────────────────────────────────

    public function test_operator_can_list_guru(): void
    {
        $this->createGuru('NUPTK001');
        $this->createGuru('NUPTK002');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->getJson('/api/operator/master-data/guru');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $data = $response->json('data.data') ?? $response->json('data') ?? [];
        $this->assertCount(2, $data);
    }

    public function test_guru_list_supports_search_filter(): void
    {
        $this->createGuru('NUPTK001', 'Budi Santoso');
        $this->createGuru('NUPTK002', 'Siti Rahayu');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->getJson('/api/operator/master-data/guru?search=Budi');

        $response->assertStatus(200);

        $data = $response->json('data.data') ?? $response->json('data') ?? [];
        $this->assertCount(1, $data);
        $this->assertEquals('Budi Santoso', $data[0]['nama']);
    }

    // ── SHOW ──────────────────────────────────────────────────────────────────

    public function test_operator_can_view_guru_detail(): void
    {
        $guru = $this->createGuru('NUPTK001', 'Budi Santoso');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->getJson("/api/operator/master-data/guru/{$guru->nuptk}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nuptk', 'NUPTK001');
    }

    public function test_show_guru_returns_404_for_nonexistent(): void
    {
        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->getJson('/api/operator/master-data/guru/NUPTK_TIDAK_ADA');

        $response->assertStatus(404);
    }

    // ── STORE ─────────────────────────────────────────────────────────────────

    public function test_operator_can_create_guru(): void
    {
        $payload = $this->validGuruPayload('NUPTK_BARU');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->postJson('/api/operator/master-data/guru', $payload);

        $response->assertStatus(201);

        $this->setTenant($this->school->id);
        $this->assertDatabaseHas('gurus', [
            'nuptk' => 'NUPTK_BARU',
            'school_id' => $this->school->id,
        ]);
    }

    public function test_create_guru_requires_nuptk(): void
    {
        $payload = $this->validGuruPayload('NUPTK_BARU');
        unset($payload['nuptk']);

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->postJson('/api/operator/master-data/guru', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nuptk']);
    }

    public function test_create_guru_nuptk_must_be_unique_within_school(): void
    {
        $this->createGuru('NUPTK_DUPLIKAT');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->postJson('/api/operator/master-data/guru', $this->validGuruPayload('NUPTK_DUPLIKAT'));

        $response->assertStatus(422);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public function test_operator_can_update_guru(): void
    {
        $guru = $this->createGuru('NUPTK001', 'Nama Lama');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->putJson("/api/operator/master-data/guru/{$guru->nuptk}", [
                'nama' => 'Nama Baru',
            ]);

        $response->assertStatus(200);

        $this->setTenant($this->school->id);
        $this->assertDatabaseHas('gurus', [
            'nuptk' => 'NUPTK001',
            'nama' => 'Nama Baru',
        ]);
    }

    // ── DELETE (Soft Delete) ──────────────────────────────────────────────────

    public function test_operator_can_soft_delete_guru(): void
    {
        $guru = $this->createGuru('NUPTK001');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->deleteJson("/api/operator/master-data/guru/{$guru->nuptk}");

        $response->assertStatus(200);

        // Soft deleted — tidak muncul di query biasa
        $this->setTenant($this->school->id);
        $this->assertSoftDeleted('gurus', ['nuptk' => 'NUPTK001']);
    }

    public function test_soft_deleted_guru_appears_in_trash(): void
    {
        $guru = $this->createGuru('NUPTK001');
        $guru->delete();

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->getJson('/api/operator/master-data/guru/trash');

        $response->assertStatus(200);

        $trashData = $response->json('data.data') ?? $response->json('data') ?? [];
        $nuptkList = collect($trashData)->pluck('nuptk')->toArray();
        $this->assertContains('NUPTK001', $nuptkList);
    }

    public function test_operator_can_restore_deleted_guru(): void
    {
        $guru = $this->createGuru('NUPTK001');
        $guru->delete();

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->patchJson("/api/operator/master-data/guru/NUPTK001/restore");

        $response->assertStatus(200);

        $this->setTenant($this->school->id);
        $this->assertDatabaseHas('gurus', [
            'nuptk' => 'NUPTK001',
            'deleted_at' => null,
        ]);
    }

    // ── Cross-Tenant Protection ───────────────────────────────────────────────

    public function test_operator_cannot_access_guru_from_other_school(): void
    {
        $schoolB = $this->createSchool(['nama' => 'SDN B', 'npsn' => '99999999']);
        $guruB = $this->createGuruForSchool($schoolB->id, 'NUPTK_B');

        $response = $this
            ->actingAs($this->operator)
            ->withHeaders($this->withTenantHeader($this->school->id))
            ->getJson("/api/operator/master-data/guru/{$guruB->nuptk}");

        // Harus 404 — guru schoolB tidak terlihat di scope schoolA
        $response->assertStatus(404);
    }

    // ── Export Service (Unit) ─────────────────────────────────────────────────

    public function test_guru_export_service_returns_xlsx_bytes(): void
    {
        $this->setTenant($this->school->id);
        $this->createGuru('NUPTK001', 'Guru Export Test');

        $gurus = Guru::with([
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

        $service = app(GuruExportService::class);
        $bytes = $service->build($gurus);

        // Output harus berupa string bytes (XLSX = ZIP format)
        $this->assertIsString($bytes);
        $this->assertNotEmpty($bytes);

        // XLSX file dimulai dengan signature ZIP PK
        $this->assertEquals('PK', substr($bytes, 0, 2));
    }

    public function test_guru_export_service_builds_correct_sheet_count(): void
    {
        $this->setTenant($this->school->id);
        $this->createGuru('NUPTK001');

        $gurus = Guru::with([
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

        $service = app(GuruExportService::class);
        $sheets = $service->buildSheets($gurus);

        // Harus ada 12 sheet (utama + 11 sheet relasi)
        $this->assertCount(12, $sheets);

        // Sheet pertama harus punya nama
        $this->assertArrayHasKey('name', $sheets[0]);
        $this->assertArrayHasKey('headers', $sheets[0]);
        $this->assertArrayHasKey('rows', $sheets[0]);
    }

    public function test_guru_export_service_empty_collection_still_returns_xlsx(): void
    {
        $service = app(GuruExportService::class);
        $bytes = $service->build(new \Illuminate\Database\Eloquent\Collection());

        $this->assertIsString($bytes);
        $this->assertNotEmpty($bytes);
        $this->assertEquals('PK', substr($bytes, 0, 2));
    }

    // ── Import Service (Unit) ─────────────────────────────────────────────────

    public function test_import_service_returns_empty_result_for_invalid_file(): void
    {
        $this->setTenant($this->school->id);

        $service = app(GuruImportService::class);

        // File kosong/tidak valid
        $tmpFile = tempnam(sys_get_temp_dir(), 'test_import_') . '.xlsx';
        file_put_contents($tmpFile, 'ini bukan xlsx');

        $result = $service->import($tmpFile);

        @unlink($tmpFile);

        $this->assertArrayHasKey('berhasil', $result);
        $this->assertArrayHasKey('errors', $result);
        $this->assertEquals(0, $result['berhasil']);
        $this->assertNotEmpty($result['errors']);
    }

    public function test_import_service_importrelasi_is_public(): void
    {
        // Memastikan bug yang sudah di-fix tidak regresi:
        // importRelasi() harus public (dulu private → runtime error)
        $service = app(GuruImportService::class);
        $this->assertTrue(
            method_exists($service, 'importRelasi'),
            'GuruImportService::importRelasi() harus ada sebagai public method.'
        );

        $ref = new \ReflectionMethod($service, 'importRelasi');
        $this->assertTrue($ref->isPublic(), 'importRelasi() harus public, bukan private/protected.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function createGuru(string $nuptk, string $nama = 'Guru Test'): Guru
    {
        return $this->createGuruForSchool($this->school->id, $nuptk, $nama);
    }

    private function createGuruForSchool(int $schoolId, string $nuptk, string $nama = 'Guru Test'): Guru
    {
        return Guru::withoutGlobalScopes()->create([
            'school_id' => $schoolId,
            'nuptk' => $nuptk,
            'nama' => $nama,
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '1990-01-01',
            'jenis_ptk' => 'Guru Tetap',
            'status_kepegawaian' => 'PNS',
        ]);
    }

    private function validGuruPayload(string $nuptk): array
    {
        return [
            'nuptk' => $nuptk,
            'nama' => 'Guru Baru',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '1990-05-15',
            'tempat_lahir' => 'Jakarta',
            'jenis_ptk' => 'Guru Tetap',
            'status_kepegawaian' => 'PNS',
        ];
    }
}