<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class KurikulumPilihanTest extends TestCase
{
    use RefreshDatabase;

    private const MAPEL = '/api/operator/master-data/mapel';
    private const KELAS = '/api/operator/master-data/kelas';

    private int $schoolId;
    private int $schoolBId;
    private int $taId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->schoolId = $this->createSchool(['nama' => 'SD A', 'npsn' => '51111111'])->id;
        $this->schoolBId = $this->createSchool(['nama' => 'SD B', 'npsn' => '52222222'])->id;

        $user = $this->createUserWithRole($this->schoolId, 'wakasek');
        $this->grantPermissions($this->schoolId, $user->roles()->first(), [
            'master_data.mapel.view',
            'master_data.mapel.manage',
            'master_data.kelas.view',
            'master_data.kelas.manage',
        ]);
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolId);

        $this->taId = DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $this->schoolId,
            'ulid' => (string) Str::ulid(),
            'tahun' => '2026/2027',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ── MAPEL ────────────────────────────────────────────────────────────────

    public function test_mapel_store_dengan_kurikulum_ulid_platform(): void
    {
        [$id, $ulid] = $this->kurikulumPlatform('MERDEKA');

        $this->postJson(self::MAPEL, $this->mapelPayload('M01', ['kurikulum_ulid' => $ulid]))
            ->assertCreated();

        $this->assertDatabaseHas('mapels', [
            'school_id' => $this->schoolId,
            'kode' => 'M01',
            'kurikulum_id' => $id,
            'kurikulum' => 'Kurikulum Merdeka',
        ]);
    }

    public function test_mapel_store_kurikulum_null_berarti_semua_kurikulum(): void
    {
        $this->postJson(self::MAPEL, $this->mapelPayload('M02', ['kurikulum_ulid' => null]))
            ->assertCreated();

        $this->assertDatabaseHas('mapels', [
            'kode' => 'M02',
            'kurikulum_id' => null,
            'kurikulum' => 'Keduanya',
        ]);
    }

    public function test_mapel_store_menolak_kurikulum_sekolah_lain(): void
    {
        [, $ulidLain] = $this->kurikulumSekolah($this->schoolBId);

        $this->postJson(self::MAPEL, $this->mapelPayload('M03', ['kurikulum_ulid' => $ulidLain]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['kurikulum_ulid']);

        $this->assertDatabaseMissing('mapels', ['kode' => 'M03']);
    }

    public function test_mapel_store_menolak_kurikulum_nonaktif(): void
    {
        [, $ulid] = $this->kurikulumSekolah($this->schoolId, false);

        $this->postJson(self::MAPEL, $this->mapelPayload('M04', ['kurikulum_ulid' => $ulid]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['kurikulum_ulid']);
    }

    public function test_mapel_store_jalur_lama_string_masih_jalan(): void
    {
        $this->postJson(self::MAPEL, $this->mapelPayload('M05', ['kurikulum' => 'Kurikulum Merdeka']))
            ->assertCreated();

        $this->assertDatabaseHas('mapels', ['kode' => 'M05', 'kurikulum' => 'Kurikulum Merdeka']);
    }

    public function test_mapel_store_tanpa_kurikulum_sama_sekali_ditolak(): void
    {
        $this->postJson(self::MAPEL, $this->mapelPayload('M06'))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['kurikulum_ulid']);
    }

    // ── KELAS ────────────────────────────────────────────────────────────────

    public function test_kelas_store_dengan_kurikulum_sekolah_sendiri(): void
    {
        [$id, $ulid] = $this->kurikulumSekolah($this->schoolId);

        $res = $this->postJson(self::KELAS, $this->kelasPayload(['kurikulum_ulid' => $ulid]))
            ->assertStatus(201);

        $this->assertDatabaseHas('kelas', [
            'id' => $res->json('data.id'),
            'kurikulum_id' => $id,
            'kurikulum' => 'Merdeka',
        ]);
    }

    public function test_kelas_store_menolak_kurikulum_sekolah_lain(): void
    {
        [, $ulidLain] = $this->kurikulumSekolah($this->schoolBId);

        $this->postJson(self::KELAS, $this->kelasPayload(['kurikulum_ulid' => $ulidLain]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['kurikulum_ulid']);
    }

    public function test_kelas_store_tanpa_kurikulum_ditolak(): void
    {
        $payload = $this->kelasPayload();
        unset($payload['kurikulum']);

        $this->postJson(self::KELAS, $payload)->assertStatus(422);
    }

    public function test_kelas_update_ganti_kurikulum_lewat_ulid(): void
    {
        $res = $this->postJson(self::KELAS, $this->kelasPayload())->assertStatus(201);
        $kelasId = $res->json('data.id');

        [$id, $ulid] = $this->kurikulumSekolah($this->schoolId);

        $this->putJson(self::KELAS . "/{$kelasId}", $this->kelasPayload([
            'nama_kelas' => 'UBAH-1',
            'kurikulum_ulid' => $ulid,
        ]))->assertOk();

        $this->assertDatabaseHas('kelas', ['id' => $kelasId, 'kurikulum_id' => $id]);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private function mapelPayload(string $kode, array $o = []): array
    {
        return array_merge([
            'kode' => $kode,
            'nama_mapel' => 'Mapel ' . $kode,
            'kelompok' => 'A - Wajib',
            'jam_per_minggu' => 2,
        ], $o);
    }

    private function kelasPayload(array $o = []): array
    {
        return array_merge([
            'nama_kelas' => 'K-' . Str::random(4),
            'tingkat' => 10,
            'kurikulum' => 'Merdeka',
            'kapasitas' => 30,
            'tahun_ajaran_id' => $this->taId,
        ], $o);
    }

    /** @return array{0:int,1:string} [id, ulid] — pakai baris platform yang sudah ada bila ada. */
    private function kurikulumPlatform(string $kode): array
    {
        $row = DB::table('kurikulums')->whereNull('school_id')->where('kode', $kode)->first();
        if ($row) {
            return [(int) $row->id, $row->ulid];
        }

        return $this->insertKurikulum(null, $kode, true);
    }

    /** @return array{0:int,1:string} */
    private function kurikulumSekolah(int $schoolId, bool $aktif = true): array
    {
        return $this->insertKurikulum($schoolId, 'T_' . Str::upper(Str::random(5)), $aktif);
    }

    private function insertKurikulum(?int $schoolId, string $kode, bool $aktif): array
    {
        $ulid = (string) Str::ulid();
        $id = DB::table('kurikulums')->insertGetId([
            'school_id' => $schoolId,
            'ulid' => $ulid,
            'nama' => "Kurikulum {$kode}",
            'kode' => $kode,
            'jenis' => 'nasional',
            'tahun_berlaku' => 2023,
            'is_platform_default' => false,
            'is_active' => $aktif,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [(int) $id, $ulid];
    }
}