<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Test: API struktur kurikulum (mapel + alokasi JP per tingkat).
 *
 *   GET    /kurikulum/implementasi/{ulid}/struktur   (view)
 *   POST   /kurikulum/implementasi/{ulid}/struktur   (manage)
 *   PUT    /kurikulum/struktur/{ulid}                (manage)
 *   DELETE /kurikulum/struktur/{ulid}                (manage)
 *
 * Struktur hanya bisa diubah saat implementasi berstatus DRAFT.
 */
class KurikulumStrukturApiTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = '/api/operator/master-data/kurikulum';

    private int $schoolId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->schoolId = $this->createSchool(['nama' => 'MI A'])->id;
    }

    public function test_wakasek_dapat_menambah_struktur_pada_implementasi_draft(): void
    {
        $impl = $this->implementasi('draft', [1]);
        $mapel = $this->mapel('Matematika');
        $this->loginSebagai('wakasek', ['master_data.kurikulum.view', 'master_data.kurikulum.manage']);

        $this->postJson(self::BASE . "/implementasi/{$impl}/struktur", [
            'mapel_ulid' => $mapel,
            'tingkat' => 1,
            'alokasi_jp_minggu' => 4,
        ])->assertStatus(201);

        $daftar = $this->getJson(self::BASE . "/implementasi/{$impl}/struktur")->assertOk();
        $this->assertCount(1, $daftar->json('data'));
        $this->assertSame('Matematika', $daftar->json('data.0.mapel.nama'));
        $this->assertSame(4, $daftar->json('data.0.alokasi_jp_minggu'));
    }

    public function test_mapel_yang_sama_pada_tingkat_sama_ditolak(): void
    {
        $impl = $this->implementasi('draft', [1]);
        $mapel = $this->mapel('IPA');
        $this->loginSebagai('wakasek', ['master_data.kurikulum.view', 'master_data.kurikulum.manage']);

        $payload = ['mapel_ulid' => $mapel, 'tingkat' => 1, 'alokasi_jp_minggu' => 3];

        $this->postJson(self::BASE . "/implementasi/{$impl}/struktur", $payload)->assertStatus(201);

        $dobel = $this->postJson(self::BASE . "/implementasi/{$impl}/struktur", $payload);
        $dobel->assertStatus(422);
        $this->assertStringContainsString('sudah ada di struktur', (string) $dobel->json('message'));
    }

    public function test_tingkat_di_luar_cakupan_implementasi_ditolak(): void
    {
        $impl = $this->implementasi('draft', [1]); // hanya kelas 1
        $mapel = $this->mapel('IPS');
        $this->loginSebagai('wakasek', ['master_data.kurikulum.view', 'master_data.kurikulum.manage']);

        $response = $this->postJson(self::BASE . "/implementasi/{$impl}/struktur", [
            'mapel_ulid' => $mapel,
            'tingkat' => 5,
            'alokasi_jp_minggu' => 2,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('tidak termasuk tingkat', (string) $response->json('message'));
    }

    public function test_struktur_terkunci_setelah_diajukan_review(): void
    {
        $impl = $this->implementasi('under_review', [1]);
        $mapel = $this->mapel('Bahasa Indonesia');
        $barisUlid = $this->barisStruktur($impl, $mapel, 1);
        $this->loginSebagai('wakasek', ['master_data.kurikulum.view', 'master_data.kurikulum.manage']);

        $tambah = $this->postJson(self::BASE . "/implementasi/{$impl}/struktur", [
            'mapel_ulid' => $this->mapel('Seni Budaya'),
            'tingkat' => 1,
            'alokasi_jp_minggu' => 2,
        ]);
        $tambah->assertStatus(422);
        $this->assertStringContainsString('terkunci', (string) $tambah->json('message'));

        $this->putJson(self::BASE . "/struktur/{$barisUlid}", ['alokasi_jp_minggu' => 9])->assertStatus(422);
        $this->deleteJson(self::BASE . "/struktur/{$barisUlid}")->assertStatus(422);
    }

    public function test_ubah_alokasi_jp_lalu_hapus_baris(): void
    {
        $impl = $this->implementasi('draft', [1]);
        $barisUlid = $this->barisStruktur($impl, $this->mapel('PJOK'), 1);
        $this->loginSebagai('wakasek', ['master_data.kurikulum.view', 'master_data.kurikulum.manage']);

        $ubah = $this->putJson(self::BASE . "/struktur/{$barisUlid}", ['alokasi_jp_minggu' => 6])->assertOk();
        $this->assertSame(6, $ubah->json('data.alokasi_jp_minggu'));

        $this->deleteJson(self::BASE . "/struktur/{$barisUlid}")->assertOk();

        $this->assertSame([], $this->getJson(self::BASE . "/implementasi/{$impl}/struktur")->json('data'));
    }

    public function test_user_hanya_view_boleh_melihat_tetapi_tidak_mengubah(): void
    {
        $impl = $this->implementasi('draft', [1]);
        $mapel = $this->mapel('Matematika');
        $barisUlid = $this->barisStruktur($impl, $mapel, 1);
        $this->loginSebagai('operator', ['master_data.kurikulum.view']);

        $this->getJson(self::BASE . "/implementasi/{$impl}/struktur")->assertOk();

        $this->postJson(self::BASE . "/implementasi/{$impl}/struktur", [
            'mapel_ulid' => $mapel,
            'tingkat' => 1,
            'alokasi_jp_minggu' => 4,
        ])->assertForbidden();
        $this->putJson(self::BASE . "/struktur/{$barisUlid}", ['alokasi_jp_minggu' => 9])->assertForbidden();
        $this->deleteJson(self::BASE . "/struktur/{$barisUlid}")->assertForbidden();
    }

    public function test_sekolah_lain_tidak_bisa_mengubah_struktur(): void
    {
        $impl = $this->implementasi('draft', [1]);
        $barisUlid = $this->barisStruktur($impl, $this->mapel('Matematika'), 1);

        $sekolahB = $this->createSchool(['nama' => 'MI B'])->id;
        $this->loginSebagai('wakasek', ['master_data.kurikulum.view', 'master_data.kurikulum.manage'], $sekolahB);

        $this->assertContains(
            $this->putJson(self::BASE . "/struktur/{$barisUlid}", ['alokasi_jp_minggu' => 9])->getStatusCode(),
            [403, 404]
        );
        $this->assertContains(
            $this->deleteJson(self::BASE . "/struktur/{$barisUlid}")->getStatusCode(),
            [403, 404]
        );

        $this->assertDatabaseHas('kurikulum_strukturs', ['ulid' => $barisUlid, 'alokasi_jp_minggu' => 4]);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function loginSebagai(string $role, array $permissions, ?int $schoolId = null): void
    {
        $schoolId ??= $this->schoolId;

        $user = $this->createUserWithRole($schoolId, $role);
        $this->grantPermissions($schoolId, $user->roles()->first(), $permissions);

        $this->actingAs($user, 'sanctum');
        $this->setTenant($schoolId);
    }

    /** @return string ULID implementasi */
    private function implementasi(string $status, array $tingkat): string
    {
        $taId = DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $this->schoolId,
            'ulid' => (string) Str::ulid(),
            'tahun' => '2025/2026',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $kurikulumId = DB::table('kurikulums')->insertGetId([
            'school_id' => $this->schoolId,
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

        DB::table('kurikulum_tahun_ajarans')->insert([
            'school_id' => $this->schoolId,
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

    /** @return string ULID mapel */
    private function mapel(string $nama): string
    {
        $ulid = (string) Str::ulid();

        DB::table('mapels')->insert([
            'school_id' => $this->schoolId,
            'ulid' => $ulid,
            'nama_mapel' => $nama,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $ulid;
    }

    /** Sisipkan baris struktur langsung ke DB. @return string ULID baris */
    private function barisStruktur(string $implUlid, string $mapelUlid, int $tingkat): string
    {
        $ulid = (string) Str::ulid();

        DB::table('kurikulum_strukturs')->insert([
            'ulid' => $ulid,
            'school_id' => $this->schoolId,
            'kurikulum_tahun_ajaran_id' => DB::table('kurikulum_tahun_ajarans')->where('ulid', $implUlid)->value('id'),
            'tingkat' => $tingkat,
            'program_pendidikan_id' => null,
            'mapel_id' => DB::table('mapels')->where('ulid', $mapelUlid)->value('id'),
            'alokasi_jp_minggu' => 4,
            'jenis_komponen' => 'intrakurikuler',
            'is_wajib' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $ulid;
    }
}
