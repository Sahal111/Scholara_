<?php

namespace Tests\Feature;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Daftar implementasi (kepsek) + pantau lintas sekolah (superadmin, read-only).
 */
class KurikulumMonitoringTest extends TestCase
{
    use RefreshDatabase;

    private School $schoolA;
    private School $schoolB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = $this->createSchool(['nama' => 'MI A', 'npsn' => '11111111']);
        $this->schoolB = $this->createSchool(['nama' => 'MI B', 'npsn' => '22222222']);
    }

    public function test_kepsek_hanya_melihat_implementasi_sekolahnya(): void
    {
        $this->implementasi($this->schoolA, 'under_review');
        $this->implementasi($this->schoolB, 'draft');
        $this->loginSebagai('kepsek', $this->schoolA, ['master_data.kurikulum.view']);

        $res = $this->getJson('/api/operator/master-data/kurikulum/implementasi');

        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('under_review', $res->json('data.0.status'));
    }

    public function test_superadmin_melihat_implementasi_sekolah_lain(): void
    {
        $implB = $this->implementasi($this->schoolB, 'under_review');
        $this->loginSebagai('super_admin', $this->schoolA, []);

        $base = "/api/superadmin/sekolah/{$this->schoolB->ulid}/kurikulum/implementasi";

        $list = $this->getJson($base);
        $list->assertOk();
        $this->assertCount(1, $list->json('data'));

        $this->getJson("{$base}/{$implB['ulid']}")
            ->assertOk()
            ->assertJsonPath('data.status', 'under_review')
            ->assertJsonPath('data.aksi_tersedia', []);

        $this->getJson("{$base}/{$implB['ulid']}/struktur")->assertOk();
    }

    public function test_superadmin_tidak_bisa_mengubah_status(): void
    {
        $implB = $this->implementasi($this->schoolB, 'under_review');
        $this->loginSebagai('super_admin', $this->schoolA, []);

        $res = $this->patchJson(
            "/api/superadmin/sekolah/{$this->schoolB->ulid}/kurikulum/implementasi/{$implB['ulid']}/setujui"
        );

        $this->assertContains($res->getStatusCode(), [404, 405]);
        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $implB['id'], 'status' => 'under_review']);
    }

    public function test_role_selain_superadmin_ditolak(): void
    {
        $this->loginSebagai('kepsek', $this->schoolA, ['master_data.kurikulum.view']);

        $this->getJson("/api/superadmin/sekolah/{$this->schoolB->ulid}/kurikulum/implementasi")
            ->assertForbidden();
    }

    public function test_sekolah_tidak_dikenal_404(): void
    {
        $this->loginSebagai('super_admin', $this->schoolA, []);

        $this->getJson('/api/superadmin/sekolah/01HZZZZZZZZZZZZZZZZZZZZZZZ/kurikulum/implementasi')
            ->assertNotFound();
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private function loginSebagai(string $role, School $school, array $permissions): void
    {
        $user = $this->createUserWithRole($school->id, $role);
        $this->grantPermissions($school->id, $user->roles()->first(), $permissions);

        $this->actingAs($user, 'sanctum');
        $this->setTenant($school->id);
    }

    private function implementasi(School $school, string $status): array
    {
        $taId = DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $school->id,
            'ulid' => (string) Str::ulid(),
            'tahun' => '2025/2026',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $kurId = DB::table('kurikulums')->insertGetId([
            'school_id' => $school->id,
            'ulid' => (string) Str::ulid(),
            'nama' => 'Kurikulum Uji',
            'kode' => 'KUR_' . Str::random(6),
            'jenis' => 'nasional',
            'tahun_berlaku' => 2023,
            'is_platform_default' => false,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ulid = (string) Str::ulid();
        $id = DB::table('kurikulum_tahun_ajarans')->insertGetId([
            'school_id' => $school->id,
            'kurikulum_id' => $kurId,
            'tahun_ajaran_id' => $taId,
            'semester_id' => null,
            'tingkat_kelas' => json_encode([7]),
            'is_active' => true,
            'status' => $status,
            'ulid' => $ulid,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['id' => $id, 'ulid' => $ulid];
    }
}