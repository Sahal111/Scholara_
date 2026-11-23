<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/** GET /kelas/{id}/mapel — resolver mapel kelas dari struktur kurikulum aktif. */
class MapelKelasResolverTest extends TestCase
{
    use RefreshDatabase;

    private int $schoolId;
    private int $taId;
    private int $kurikulumId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->schoolId = $this->createSchool(['nama' => 'SMA A'])->id;
        $this->taId = $this->tahunAjaran('2026/2027');
        $this->kurikulumId = $this->kurikulum('K_' . Str::random(5));
        $this->login();
    }

    public function test_struktur_aktif_dipakai_dengan_metadata(): void
    {
        $impl = $this->implementasi($this->kurikulumId, $this->taId, 'active', [10]);
        $mtk = $this->mapel('Matematika');
        $this->mapel('Seni Budaya'); // ada di katalog, TIDAK di struktur
        $this->baris($impl, $mtk, 10, null, 4, 'Wajib A');
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId);

        $r = $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")->assertOk();

        $this->assertSame('struktur', $r->json('data.sumber'));
        $this->assertCount(1, $r->json('data.mapel'));
        $this->assertSame('Matematika', $r->json('data.mapel.0.nama'));
        $this->assertSame(4, $r->json('data.mapel.0.alokasi_jp_minggu'));
        $this->assertSame('Wajib A', $r->json('data.mapel.0.kelompok'));
        $this->assertSame('umum', $r->json('data.mapel.0.asal_baris'));
    }

    public function test_struktur_khusus_program_mengungguli_umum_tanpa_duplikat(): void
    {
        $impl = $this->implementasi($this->kurikulumId, $this->taId, 'active', [10]);
        $ipa = $this->program('IPA');
        $mtk = $this->mapel('Matematika');
        $this->baris($impl, $mtk, 10, null, 4);
        $this->baris($impl, $mtk, 10, $ipa, 6);
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId, $ipa);

        $r = $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")->assertOk();

        $this->assertCount(1, $r->json('data.mapel'));
        $this->assertSame(6, $r->json('data.mapel.0.alokasi_jp_minggu'));
        $this->assertSame('program', $r->json('data.mapel.0.asal_baris'));
    }

    public function test_program_lain_dan_tingkat_lain_tidak_ikut(): void
    {
        $impl = $this->implementasi($this->kurikulumId, $this->taId, 'active', [10, 11]);
        $ipa = $this->program('IPA');
        $ips = $this->program('IPS');
        $this->baris($impl, $this->mapel('Fisika'), 10, $ipa, 4);
        $this->baris($impl, $this->mapel('Ekonomi'), 10, $ips, 4);
        $this->baris($impl, $this->mapel('Kimia'), 11, $ipa, 4);
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId, $ipa);

        $r = $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")->assertOk();

        $this->assertSame(['Fisika'], array_column($r->json('data.mapel'), 'nama'));
    }

    public function test_tahun_ajaran_lain_tidak_dipakai_fallback_katalog(): void
    {
        $taLain = $this->tahunAjaran('2027/2028');
        $impl = $this->implementasi($this->kurikulumId, $taLain, 'active', [10]);
        $this->baris($impl, $this->mapel('Matematika'), 10, null, 4);
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId); // kelas di 2026/2027

        $r = $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")->assertOk();

        $this->assertSame('katalog', $r->json('data.sumber'));
        $this->assertSame('TIDAK_ADA_IMPLEMENTASI_AKTIF', $r->json('data.alasan_fallback'));
    }

    public function test_implementasi_draft_tidak_dianggap_aktif(): void
    {
        $impl = $this->implementasi($this->kurikulumId, $this->taId, 'draft', [10]);
        $this->baris($impl, $this->mapel('Matematika'), 10, null, 4);
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId);

        $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")
            ->assertOk()
            ->assertJsonPath('data.sumber', 'katalog');
    }

    public function test_struktur_aktif_tapi_kosong_tidak_fallback_ke_katalog(): void
    {
        $this->implementasi($this->kurikulumId, $this->taId, 'active', [10]);
        $this->mapel('Matematika'); // ada di katalog
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId);

        $r = $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")->assertOk();

        $this->assertSame('struktur', $r->json('data.sumber'));
        $this->assertSame([], $r->json('data.mapel'));
    }

    public function test_tingkat_di_luar_cakupan_implementasi_fallback(): void
    {
        $impl = $this->implementasi($this->kurikulumId, $this->taId, 'active', [11]);
        $this->baris($impl, $this->mapel('Matematika'), 11, null, 4);
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId);

        $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")
            ->assertOk()
            ->assertJsonPath('data.sumber', 'katalog');
    }

    public function test_kurikulum_lain_tidak_dipakai(): void
    {
        $lain = $this->kurikulum('LAIN_' . Str::random(4));
        $impl = $this->implementasi($lain, $this->taId, 'active', [10]);
        $this->baris($impl, $this->mapel('Matematika'), 10, null, 4);
        $kelas = $this->kelas(10, $this->kurikulumId, $this->taId); // kelas pakai kurikulum berbeda

        $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")
            ->assertOk()
            ->assertJsonPath('data.sumber', 'katalog');
    }

    public function test_kelas_tanpa_kurikulum_fallback(): void
    {
        $this->mapel('Matematika');
        $kelas = $this->kelas(10, null, $this->taId);

        $this->getJson("/api/operator/master-data/kelas/{$kelas}/mapel")
            ->assertOk()
            ->assertJsonPath('data.alasan_fallback', 'KELAS_TANPA_KURIKULUM');
    }

    public function test_kelas_sekolah_lain_tidak_ditemukan(): void
    {
        $sekolahB = $this->createSchool(['nama' => 'SMA B'])->id;
        $taB = DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $sekolahB,
            'ulid' => (string) Str::ulid(),
            'tahun' => '2026/2027',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $kelasB = DB::table('kelas')->insertGetId([
            'school_id' => $sekolahB,
            'tahun_ajaran_id' => $taB,
            'nama_kelas' => 'X-B',
            'tingkat' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson("/api/operator/master-data/kelas/{$kelasB}/mapel")->assertNotFound();
    }

    public function test_id_kelas_bukan_angka_mengembalikan_404(): void
    {
        $this->getJson('/api/operator/master-data/kelas/ID_KELAS/mapel')->assertNotFound();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function login(): void
    {
        $user = $this->createUserWithRole($this->schoolId, 'wakasek');
        $this->grantPermissions($this->schoolId, $user->roles()->first(), ['master_data.kelas.view']);
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolId);
    }

    private function tahunAjaran(string $tahun): int
    {
        return DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $this->schoolId,
            'ulid' => (string) Str::ulid(),
            'tahun' => $tahun,
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function kurikulum(string $kode): int
    {
        return DB::table('kurikulums')->insertGetId([
            'school_id' => $this->schoolId,
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
    }

    private function implementasi(int $kurikulumId, int $taId, string $status, array $tingkat): int
    {
        return DB::table('kurikulum_tahun_ajarans')->insertGetId([
            'school_id' => $this->schoolId,
            'kurikulum_id' => $kurikulumId,
            'tahun_ajaran_id' => $taId,
            'semester_id' => null,
            'tingkat_kelas' => json_encode($tingkat),
            'is_active' => true,
            'status' => $status,
            'ulid' => (string) Str::ulid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function mapel(string $nama): int
    {
        return DB::table('mapels')->insertGetId([
            'school_id' => $this->schoolId,
            'ulid' => (string) Str::ulid(),
            'nama_mapel' => $nama,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function program(string $nama): int
    {
        return DB::table('program_pendidikans')->insertGetId([
            'school_id' => $this->schoolId,
            'ulid' => (string) Str::ulid(),
            'parent_id' => null,
            'nama' => $nama,
            'kode' => strtoupper($nama),
            'jenis' => 'umum',
            'jenjang_sasaran' => 'semua',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function baris(int $implId, int $mapelId, int $tingkat, ?int $programId, int $jp, ?string $kelompok = null): void
    {
        DB::table('kurikulum_strukturs')->insert([
            'ulid' => (string) Str::ulid(),
            'school_id' => $this->schoolId,
            'kurikulum_tahun_ajaran_id' => $implId,
            'tingkat' => $tingkat,
            'program_pendidikan_id' => $programId,
            'mapel_id' => $mapelId,
            'kelompok' => $kelompok,
            'alokasi_jp_minggu' => $jp,
            'jenis_komponen' => 'intrakurikuler',
            'is_wajib' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function kelas(int $tingkat, ?int $kurikulumId, int $taId, ?int $programId = null): int
    {
        return DB::table('kelas')->insertGetId([
            'school_id' => $this->schoolId,
            'tahun_ajaran_id' => $taId,
            'nama_kelas' => 'K-' . Str::random(4),
            'tingkat' => $tingkat,
            'kurikulum_id' => $kurikulumId,
            'program_pendidikan_id' => $programId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}