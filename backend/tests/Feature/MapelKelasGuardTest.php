<?php

namespace Tests\Feature;

use App\Models\Guru;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class MapelKelasGuardTest extends TestCase
{
    use RefreshDatabase;

    private const MAPEL = '/api/operator/master-data/mapel';
    private const KELAS = '/api/operator/master-data/kelas';

    private int $schoolId;
    private int $schoolBId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->schoolId = $this->createSchool(['nama' => 'SD A', 'npsn' => '41111111'])->id;
        $this->schoolBId = $this->createSchool(['nama' => 'SD B', 'npsn' => '42222222'])->id;

        $user = $this->createUserWithRole($this->schoolId, 'wakasek');
        $this->grantPermissions($this->schoolId, $user->roles()->first(), [
            'master_data.mapel.view',
            'master_data.mapel.manage',
            'master_data.kelas.view',
            'master_data.kelas.manage',
        ]);
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolId);
    }

    // ── MAPEL ────────────────────────────────────────────────────────────────

    public function test_mapel_yang_belum_dipakai_bisa_dihapus(): void
    {
        $ulid = $this->mapel('Bebas');

        $this->deleteJson(self::MAPEL . "/{$ulid}")->assertOk();
        $this->assertSoftDeleted('mapels', ['ulid' => $ulid]);
    }

    public function test_mapel_yang_sudah_dipakai_plot_ditolak(): void
    {
        $ulid = $this->mapel('Dipakai');
        $mapelId = DB::table('mapels')->where('ulid', $ulid)->value('id');
        $taId = $this->tahunAjaran('2026/2027', $this->schoolId);
        $smtId = $this->semester($taId, $this->schoolId);
        $kelasId = $this->kelas($taId, $this->schoolId);
        $this->plot($this->guru($this->schoolId), $mapelId, $kelasId, $taId, $smtId);

        $this->deleteJson(self::MAPEL . "/{$ulid}")
            ->assertStatus(422)
            ->assertJsonFragment(['code' => 'MAPEL_DIPAKAI']);

        $this->assertDatabaseHas('mapels', ['ulid' => $ulid, 'deleted_at' => null]);
    }

    // ── KELAS: guard hapus ───────────────────────────────────────────────────

    public function test_kelas_kosong_bisa_dihapus(): void
    {
        $taId = $this->tahunAjaran('2026/2027', $this->schoolId);
        $kelasId = $this->kelas($taId, $this->schoolId);

        $this->deleteJson(self::KELAS . "/{$kelasId}")->assertOk();
        $this->assertSoftDeleted('kelas', ['id' => $kelasId]);
    }

    public function test_kelas_yang_punya_penugasan_guru_ditolak(): void
    {
        $taId = $this->tahunAjaran('2026/2027', $this->schoolId);
        $smtId = $this->semester($taId, $this->schoolId);
        $kelasId = $this->kelas($taId, $this->schoolId);
        $mapelId = DB::table('mapels')->where('ulid', $this->mapel('M'))->value('id');
        $this->plot($this->guru($this->schoolId), $mapelId, $kelasId, $taId, $smtId);

        $this->deleteJson(self::KELAS . "/{$kelasId}")
            ->assertStatus(422)
            ->assertJsonFragment(['code' => 'KELAS_DIPAKAI']);

        $this->assertDatabaseHas('kelas', ['id' => $kelasId, 'deleted_at' => null]);
    }

    // ── KELAS: validasi tenant & semester ────────────────────────────────────

    public function test_store_kelas_menolak_tahun_ajaran_milik_sekolah_lain(): void
    {
        $taLain = $this->tahunAjaran('2026/2027', $this->schoolBId);

        $this->postJson(self::KELAS, $this->payload(['tahun_ajaran_id' => $taLain]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['tahun_ajaran_id']);
    }

    public function test_store_kelas_menolak_wali_kelas_milik_sekolah_lain(): void
    {
        $taId = $this->tahunAjaran('2026/2027', $this->schoolId);
        $guruLain = $this->guru($this->schoolBId);

        $this->postJson(self::KELAS, $this->payload([
            'tahun_ajaran_id' => $taId,
            'wali_kelas_id' => $guruLain,
        ]))->assertStatus(422)->assertJsonValidationErrors(['wali_kelas_id']);
    }

    public function test_store_kelas_menolak_semester_yang_bukan_milik_tahun_ajaran(): void
    {
        $ta1 = $this->tahunAjaran('2026/2027', $this->schoolId);
        $ta2 = $this->tahunAjaran('2027/2028', $this->schoolId);
        $smt2 = $this->semester($ta2, $this->schoolId);

        $this->postJson(self::KELAS, $this->payload([
            'tahun_ajaran_id' => $ta1,
            'semester_id' => $smt2,
        ]))->assertStatus(422)->assertJsonValidationErrors(['semester_id']);
    }

    public function test_store_kelas_valid_berhasil_dan_semester_cocok(): void
    {
        $ta = $this->tahunAjaran('2026/2027', $this->schoolId);
        $smt = $this->semester($ta, $this->schoolId);

        $this->postJson(self::KELAS, $this->payload([
            'tahun_ajaran_id' => $ta,
            'semester_id' => $smt,
        ]))->assertStatus(201);

        $this->assertDatabaseHas('kelas', [
            'school_id' => $this->schoolId,
            'tahun_ajaran_id' => $ta,
            'semester_id' => $smt,
        ]);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private function payload(array $o = []): array
    {
        return array_merge([
            'nama_kelas' => 'K-' . Str::random(4),
            'tingkat' => 1,
            'kurikulum' => 'Merdeka',
            'kapasitas' => 30,
        ], $o);
    }

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

    private function tahunAjaran(string $tahun, int $schoolId): int
    {
        return DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $schoolId,
            'ulid' => (string) Str::ulid(),
            'tahun' => $tahun,
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function semester(int $taId, int $schoolId): int
    {
        return DB::table('semesters')->insertGetId([
            'school_id' => $schoolId,
            'ulid' => (string) Str::ulid(),
            'tahun_ajaran_id' => $taId,
            'nama' => 'Ganjil',
            'tgl_mulai' => '2026-07-15',
            'tgl_selesai' => '2026-12-20',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function kelas(int $taId, int $schoolId): int
    {
        return DB::table('kelas')->insertGetId([
            'school_id' => $schoolId,
            'tahun_ajaran_id' => $taId,
            'nama_kelas' => 'K-' . Str::random(4),
            'tingkat' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function guru(int $schoolId): int
    {
        return Guru::withoutGlobalScopes()->create([
            'school_id' => $schoolId,
            'nuptk' => 'N' . Str::random(8),
            'nama' => 'Guru ' . Str::random(4),
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '1990-01-01',
            'jenis_ptk' => 'Guru Tetap',
            'status_kepegawaian' => 'PNS',
        ])->id;
    }

    private function plot(int $guruId, int $mapelId, int $kelasId, int $taId, int $smtId): void
    {
        DB::table('plot_guru_mapels')->insert([
            'school_id' => $this->schoolId,
            'guru_id' => $guruId,
            'mapel_id' => $mapelId,
            'kelas_id' => $kelasId,
            'tahun_ajaran_id' => $taId,
            'semester_id' => $smtId,
            'beban_jam' => 2,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}