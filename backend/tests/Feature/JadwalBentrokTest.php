<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\Role;
use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class JadwalBentrokTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/api/operator/master-data/jadwal-pelajaran';

    private School $school;
    private $wakasek;
    private int $taId;
    private int $semesterId;
    private int $mapelId;
    private int $kelas1;
    private int $kelas2;
    private int $guru1;
    private int $guru2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = $this->createSchool(['nama' => 'MI Jadwal', 'npsn' => '33333333']);
        $this->wakasek = $this->createUserWithRole($this->school->id, 'wakasek');
        $role = Role::withoutGlobalScopes()
            ->where('school_id', $this->school->id)->where('slug', 'wakasek')->first();
        $this->grantPermissions($this->school->id, $role, ['akademik.jadwal.manage']);

        $this->taId = DB::table('tahun_ajarans')->insertGetId([
            'school_id' => $this->school->id,
            'ulid' => (string) Str::ulid(),
            'tahun' => '2026/2027',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->semesterId = DB::table('semesters')->insertGetId([
            'school_id' => $this->school->id,
            'ulid' => (string) Str::ulid(),
            'tahun_ajaran_id' => $this->taId,
            'nama' => 'Ganjil',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->mapelId = DB::table('mapels')->insertGetId([
            'school_id' => $this->school->id,
            'ulid' => (string) Str::ulid(),
            'nama_mapel' => 'Matematika',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->kelas1 = $this->kelas('Kelas 1A');
        $this->kelas2 = $this->kelas('Kelas 1B');
        $this->guru1 = $this->guru('NUPTK_J1');
        $this->guru2 = $this->guru('NUPTK_J2');
    }

    // ── Helper ───────────────────────────────────────────────────────────

    private function kelas(string $nama): int
    {
        return DB::table('kelas')->insertGetId([
            'school_id' => $this->school->id,
            'tahun_ajaran_id' => $this->taId,
            'nama_kelas' => $nama,
            'tingkat' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function guru(string $nuptk): int
    {
        return Guru::withoutGlobalScopes()->create([
            'school_id' => $this->school->id,
            'nuptk' => $nuptk,
            'nama' => 'Guru ' . $nuptk,
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '1990-01-01',
            'jenis_ptk' => 'Guru Tetap',
            'status_kepegawaian' => 'PNS',
        ])->id;
    }

    private function plot(int $guruId, int $kelasId): int
    {
        $ada = DB::table('plot_guru_mapels')
            ->where('guru_id', $guruId)
            ->where('kelas_id', $kelasId)
            ->where('mapel_id', $this->mapelId)
            ->where('semester_id', $this->semesterId)
            ->value('id');

        if ($ada) {
            return $ada;
        }

        return DB::table('plot_guru_mapels')->insertGetId([
            'school_id' => $this->school->id,
            'guru_id' => $guruId,
            'mapel_id' => $this->mapelId,
            'kelas_id' => $kelasId,
            'tahun_ajaran_id' => $this->taId,
            'semester_id' => $this->semesterId,
            'beban_jam' => 2,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** Jadwal yang sudah ada di DB (bukan lewat API). */
    private function jadwalAda(int $guruId, int $kelasId, string $mulai, string $selesai, string $hari = 'Senin'): void
    {
        DB::table('jadwals')->insert([
            'school_id' => $this->school->id,
            'plot_id' => $this->plot($guruId, $kelasId),
            'kelas_id' => $kelasId,
            'guru_id' => $guruId,
            'mapel_id' => $this->mapelId,
            'semester_id' => $this->semesterId,
            'hari' => $hari,
            'jam_ke' => 1,
            'jam_mulai' => $mulai,
            'jam_selesai' => $selesai,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** Kirim POST tambah jadwal. Plot baru dibuat untuk kombinasi guru+kelas ini. */
    private function kirim(int $guruId, int $kelasId, string $mulai, string $selesai, string $hari = 'Senin')
    {
        return $this->actingAs($this->wakasek)->postJson(self::URL, [
            'plot_id' => $this->plot($guruId, $kelasId),
            'kelas_id' => $kelasId,
            'guru_id' => $guruId,
            'mapel_id' => $this->mapelId,
            'semester_id' => $this->semesterId,
            'hari' => $hari,
            'jam_ke' => 1,
            'jam_mulai' => $mulai,
            'jam_selesai' => $selesai,
        ]);
    }

    private function jumlahJadwal(): int
    {
        return JadwalPelajaran::withoutGlobalScopes()->count();
    }

    // ── Test ─────────────────────────────────────────────────────────────

    public function test_tambah_jadwal_tanpa_bentrok_berhasil(): void
    {
        $this->kirim($this->guru1, $this->kelas1, '07:00', '08:00')->assertStatus(201);
        $this->assertEquals(1, $this->jumlahJadwal());
    }

    public function test_tambah_jadwal_bentrok_kelas_ditolak(): void
    {
        $this->jadwalAda($this->guru1, $this->kelas1, '07:00', '08:00');

        // Guru lain, kelas yang sama, waktu beririsan
        $res = $this->kirim($this->guru2, $this->kelas1, '07:30', '08:30');

        $res->assertStatus(422)->assertJsonPath('success', false);
        $this->assertStringContainsString('bentrok', $res->json('message'));
        $this->assertEquals(1, $this->jumlahJadwal());
    }

    public function test_tambah_jadwal_bentrok_guru_ditolak(): void
    {
        $this->jadwalAda($this->guru1, $this->kelas1, '07:00', '08:00');

        // Guru yang sama, kelas lain, waktu beririsan
        $res = $this->kirim($this->guru1, $this->kelas2, '07:30', '08:30');

        $res->assertStatus(422)->assertJsonPath('success', false);
        $this->assertStringContainsString('sudah memiliki jadwal', $res->json('message'));
        $this->assertEquals(1, $this->jumlahJadwal());
    }

    public function test_jam_yang_bersinggungan_tidak_dianggap_bentrok(): void
    {
        $this->jadwalAda($this->guru1, $this->kelas1, '07:00', '08:00');

        // Mulai tepat saat jadwal sebelumnya selesai
        $this->kirim($this->guru1, $this->kelas1, '08:00', '09:00')->assertStatus(201);
        $this->assertEquals(2, $this->jumlahJadwal());
    }

    public function test_hari_berbeda_tidak_bentrok(): void
    {
        $this->jadwalAda($this->guru1, $this->kelas1, '07:00', '08:00', 'Senin');

        $this->kirim($this->guru1, $this->kelas1, '07:00', '08:00', 'Selasa')->assertStatus(201);
        $this->assertEquals(2, $this->jumlahJadwal());
    }
}