<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Test: GET /kurikulum/tahun-ajaran/{tahunAjaranUlid}
 *
 * Daftar implementasi kurikulum per tahun ajaran harus memuat `status` workflow
 * (dipakai UI untuk badge) dan tidak boleh membocorkan data sekolah lain.
 */
class KurikulumTahunAjaranListTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/api/operator/master-data/kurikulum/tahun-ajaran';

    public function test_daftar_memuat_status_workflow_dan_ulid_implementasi(): void
    {
        $school = $this->createSchool(['nama' => 'MI A']);
        [$taUlid, $taId] = $this->tahunAjaran($school->id);
        $implUlid = $this->implementasi($school->id, $taId, 'K_A', 'under_review', [1, 2]);

        $this->loginDenganView($school->id);

        $response = $this->getJson(self::URL . "/{$taUlid}");

        $response->assertOk();
        $row = $response->json('data.0');

        $this->assertSame($implUlid, $row['implementasi_ulid']);
        $this->assertSame('under_review', $row['status']);
        $this->assertSame([1, 2], $row['tingkat_kelas']);
    }

    public function test_implementasi_sekolah_lain_tidak_ikut_tampil(): void
    {
        $schoolA = $this->createSchool(['nama' => 'MI A']);
        $schoolB = $this->createSchool(['nama' => 'MI B']);

        [$taUlidB, $taIdB] = $this->tahunAjaran($schoolB->id);
        $this->implementasi($schoolB->id, $taIdB, 'K_B', 'draft');

        $this->loginDenganView($schoolA->id);

        $response = $this->getJson(self::URL . "/{$taUlidB}");

        // Boleh 404 atau daftar kosong — yang tidak boleh: data milik sekolah B.
        $this->assertContains($response->getStatusCode(), [200, 404]);
        if ($response->getStatusCode() === 200) {
            $this->assertSame([], $response->json('data'));
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function loginDenganView(int $schoolId): void
    {
        $user = $this->createUserWithRole($schoolId, 'wakasek');
        $this->grantPermissions($schoolId, $user->roles()->first(), ['master_data.kurikulum.view']);

        $this->actingAs($user, 'sanctum');
        $this->setTenant($schoolId);
    }

    /** @return array{0:string,1:int} [ulid, id] */
    private function tahunAjaran(int $schoolId): array
    {
        $ulid = (string) Str::ulid();

        $id = DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $schoolId,
            'ulid' => $ulid,
            'tahun' => '2025/2026',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$ulid, $id];
    }

    private function implementasi(int $schoolId, int $taId, string $kode, string $status, array $tingkat = [1]): string
    {
        $kurikulumId = DB::table('kurikulums')->insertGetId([
            'school_id' => $schoolId,
            'ulid' => (string) Str::ulid(),
            'nama' => "Kurikulum {$kode}",
            'kode' => $kode,
            'jenis' => 'nasional',
            'tahun_berlaku' => 2023,
            'is_platform_default' => false,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ulid = (string) Str::ulid();

        DB::table('kurikulum_tahun_ajarans')->insert([
            'school_id' => $schoolId,
            'kurikulum_id' => $kurikulumId,
            'tahun_ajaran_id' => $taId,
            'semester_id' => null,
            'tingkat_kelas' => json_encode($tingkat),
            'is_active' => true,
            'status' => $status,
            'ulid' => $ulid,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $ulid;
    }
}
