<?php

namespace Tests\Feature;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Feature test: workflow implementasi kurikulum
 *
 *   DRAFT → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED
 *   (UNDER_REVIEW → DRAFT lewat tolak)
 *
 * Pembagian peran:
 *   wakasek : review, complete
 *   kepsek  : approve, activate
 *   operator: tidak punya satu pun
 *
 * Endpoint: /api/operator/master-data/kurikulum/implementasi/{ulid}[/aksi]
 */
class KurikulumWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = '/api/operator/master-data/kurikulum/implementasi';

    private const P_VIEW = 'master_data.kurikulum.view';
    private const P_REVIEW = 'master_data.kurikulum.review';
    private const P_APPROVE = 'master_data.kurikulum.approve';
    private const P_ACTIVATE = 'master_data.kurikulum.activate';
    private const P_COMPLETE = 'master_data.kurikulum.complete';
    private const P_MANAGE = 'master_data.kurikulum.manage';

    private School $schoolA;
    private School $schoolB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = $this->createSchool(['nama' => 'MI A', 'npsn' => '11111111']);
        $this->schoolB = $this->createSchool(['nama' => 'MI B', 'npsn' => '22222222']);
    }

    // ── show / aksi_tersedia ──────────────────────────────────────────────────

    public function test_show_menampilkan_status_dan_aksi_tersedia_untuk_wakasek(): void
    {
        $impl = $this->implementasi('draft');
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW, self::P_COMPLETE]);

        $response = $this->getJson(self::BASE . "/{$impl['ulid']}");

        $response->assertOk();
        $this->assertSame('draft', $response->json('data.status'));
        $this->assertSame(['ajukan_review'], $response->json('data.aksi_tersedia'));
    }

    public function test_show_kepsek_pada_under_review_dapat_setujui_dan_tolak(): void
    {
        $impl = $this->implementasi('under_review');
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_APPROVE, self::P_ACTIVATE]);

        $response = $this->getJson(self::BASE . "/{$impl['ulid']}");

        $response->assertOk();
        $this->assertSame(['setujui', 'tolak'], $response->json('data.aksi_tersedia'));
    }

    public function test_show_implementasi_sekolah_lain_tidak_ditemukan(): void
    {
        $implB = $this->implementasi('draft', [7], $this->schoolB);
        $this->loginSebagai('wakasek', [self::P_VIEW]);

        $this->getJson(self::BASE . "/{$implB['ulid']}")->assertNotFound();
    }

    // ── ajukan review (wakasek) ───────────────────────────────────────────────

    public function test_wakasek_dapat_mengajukan_review_jika_struktur_lengkap(): void
    {
        $impl = $this->implementasi('draft', [7]);
        $this->tambahStruktur($impl, 7);
        $user = $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/ajukan-review");

        $response->assertOk();
        $this->assertSame('under_review', $response->json('data.status'));
        $this->assertDatabaseHas('kurikulum_tahun_ajarans', [
            'id' => $impl['id'],
            'status' => 'under_review',
            'reviewed_by' => $user->id,
        ]);
    }

    public function test_ajukan_review_gagal_jika_struktur_masih_kosong(): void
    {
        $impl = $this->implementasi('draft', [7]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/ajukan-review");

        $response->assertStatus(422)->assertJsonPath('code', 'DOMAIN_ERROR');
        $this->assertStringContainsString('masih kosong', (string) $response->json('message'));
        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id'], 'status' => 'draft']);
    }

    public function test_ajukan_review_gagal_jika_ada_tingkat_belum_terisi(): void
    {
        $impl = $this->implementasi('draft', [7, 8]);
        $this->tambahStruktur($impl, 7); // tingkat 8 belum ada
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/ajukan-review");

        $response->assertStatus(422)->assertJsonPath('code', 'DOMAIN_ERROR');
        $this->assertStringContainsString('Tingkat 8', (string) $response->json('message'));
    }

    public function test_ajukan_review_ditolak_untuk_user_tanpa_permission_review(): void
    {
        $impl = $this->implementasi('draft', [7]);
        $this->tambahStruktur($impl, 7);
        $this->loginSebagai('operator', [self::P_VIEW]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/ajukan-review")->assertForbidden();

        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id'], 'status' => 'draft']);
    }

    public function test_ajukan_review_dari_status_approved_ditolak(): void
    {
        $impl = $this->implementasi('approved', [7]);
        $this->tambahStruktur($impl, 7);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/ajukan-review")
            ->assertStatus(422)
            ->assertJsonPath('code', 'DOMAIN_ERROR');
    }

    // ── setujui / tolak (kepsek) ──────────────────────────────────────────────

    public function test_kepsek_dapat_menyetujui_struktur_yang_sedang_direview(): void
    {
        $impl = $this->implementasi('under_review');
        $user = $this->loginSebagai('kepsek', [self::P_VIEW, self::P_APPROVE]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/setujui", ['catatan' => 'Sesuai']);

        $response->assertOk();
        $this->assertSame('approved', $response->json('data.status'));
        $this->assertDatabaseHas('kurikulum_tahun_ajarans', [
            'id' => $impl['id'],
            'status' => 'approved',
            'approved_by' => $user->id,
            'catatan_review' => 'Sesuai',
        ]);
    }

    public function test_setujui_dari_status_draft_ditolak(): void
    {
        $impl = $this->implementasi('draft');
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_APPROVE]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/setujui")
            ->assertStatus(422)
            ->assertJsonPath('code', 'DOMAIN_ERROR');

        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id'], 'status' => 'draft']);
    }

    public function test_wakasek_tidak_boleh_menyetujui(): void
    {
        $impl = $this->implementasi('under_review');
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW, self::P_COMPLETE]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/setujui")->assertForbidden();

        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id'], 'status' => 'under_review']);
    }

    public function test_tolak_wajib_menyertakan_catatan(): void
    {
        $impl = $this->implementasi('under_review');
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_APPROVE]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/tolak", [])
            ->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR');

        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id'], 'status' => 'under_review']);
    }

    public function test_tolak_mengembalikan_ke_draft_dan_menyimpan_catatan(): void
    {
        $impl = $this->implementasi('under_review');
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_APPROVE]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/tolak", [
            'catatan' => 'Alokasi JP matematika kurang',
        ]);

        $response->assertOk();
        $this->assertSame('draft', $response->json('data.status'));
        $this->assertSame('Alokasi JP matematika kurang', $response->json('data.catatan_review'));
        $this->assertNull($response->json('data.reviewed_at'));
        $this->assertNull($response->json('data.approved_at'));
    }

    // ── aktifkan (kepsek) ─────────────────────────────────────────────────────

    public function test_kepsek_dapat_mengaktifkan_struktur_yang_disetujui(): void
    {
        $impl = $this->implementasi('approved', [7]);
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_ACTIVATE]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/aktifkan");

        $response->assertOk();
        $this->assertSame('active', $response->json('data.status'));
        $this->assertNotNull($response->json('data.activated_at'));
    }

    public function test_aktifkan_gagal_jika_kurikulum_lain_sudah_aktif_di_tingkat_sama(): void
    {
        $ta = $this->tahunAjaran($this->schoolA);
        $this->implementasi('active', [7], $this->schoolA, $ta, 'K13_LAIN');
        $impl = $this->implementasi('approved', [7], $this->schoolA, $ta, 'MERDEKA');
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_ACTIVATE]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/aktifkan");

        $response->assertStatus(422)->assertJsonPath('code', 'DOMAIN_ERROR');
        $this->assertStringContainsString('sudah aktif', (string) $response->json('message'));
        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id'], 'status' => 'approved']);
    }

    public function test_aktifkan_boleh_jika_kurikulum_aktif_lain_memakai_tingkat_berbeda(): void
    {
        $ta = $this->tahunAjaran($this->schoolA);
        $this->implementasi('active', [10], $this->schoolA, $ta, 'K13_LAIN');
        $impl = $this->implementasi('approved', [7], $this->schoolA, $ta, 'MERDEKA');
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_ACTIVATE]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/aktifkan")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
    }

    public function test_aktifkan_gagal_jika_tahun_ajaran_sudah_selesai(): void
    {
        $ta = $this->tahunAjaran($this->schoolA, '2024/2025', 'completed');
        $impl = $this->implementasi('approved', [7], $this->schoolA, $ta);
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_ACTIVATE]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/aktifkan")
            ->assertStatus(422)
            ->assertJsonPath('code', 'DOMAIN_ERROR');
    }

    // ── selesaikan (wakasek) ──────────────────────────────────────────────────

    public function test_wakasek_dapat_menyelesaikan_struktur_yang_aktif(): void
    {
        $impl = $this->implementasi('active', [7]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_COMPLETE]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/selesaikan");

        $response->assertOk();
        $this->assertSame('completed', $response->json('data.status'));
        $this->assertNotNull($response->json('data.completed_at'));
    }

    public function test_selesaikan_dari_status_approved_ditolak(): void
    {
        $impl = $this->implementasi('approved', [7]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_COMPLETE]);

        $this->patchJson(self::BASE . "/{$impl['ulid']}/selesaikan")
            ->assertStatus(422)
            ->assertJsonPath('code', 'DOMAIN_ERROR');
    }

    // ── guard umum ────────────────────────────────────────────────────────────

    public function test_implementasi_nonaktif_tidak_bisa_berpindah_status(): void
    {
        $impl = $this->implementasi('draft', [7], $this->schoolA, null, 'NONAKTIF', false);
        $this->tambahStruktur($impl, 7);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW]);

        $response = $this->patchJson(self::BASE . "/{$impl['ulid']}/ajukan-review");

        $response->assertStatus(422)->assertJsonPath('code', 'DOMAIN_ERROR');
        $this->assertStringContainsString('dinonaktifkan', (string) $response->json('message'));
    }

    public function test_aksi_pada_implementasi_sekolah_lain_mengembalikan_404(): void
    {
        $implB = $this->implementasi('under_review', [7], $this->schoolB);
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_APPROVE]);

        $this->patchJson(self::BASE . "/{$implB['ulid']}/setujui")->assertNotFound();

        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $implB['id'], 'status' => 'under_review']);
    }

    // ── ubah & hapus implementasi (hanya DRAFT) ──────────────────────────────

    public function test_wakasek_ubah_tingkat_dan_catatan_implementasi_draft(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $impl = $this->implementasi('draft', [7, 8, 9]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $this->putJson(self::BASE . "/{$impl['ulid']}", ['tingkat_kelas' => [7, 8], 'catatan' => 'Fase A'])
            ->assertOk();

        $row = DB::table('kurikulum_tahun_ajarans')->where('id', $impl['id'])->first();
        $this->assertSame([7, 8], json_decode($row->tingkat_kelas, true));
        $this->assertSame('Fase A', $row->catatan);
    }

    public function test_ubah_implementasi_ditolak_jika_bukan_draft(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $impl = $this->implementasi('under_review', [7]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $this->putJson(self::BASE . "/{$impl['ulid']}", ['tingkat_kelas' => [8]])->assertStatus(422);
    }

    public function test_ubah_gagal_jika_tingkat_yang_dibuang_sudah_punya_struktur(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $impl = $this->implementasi('draft', [7, 8]);
        $this->tambahStruktur($impl, 8);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $res = $this->putJson(self::BASE . "/{$impl['ulid']}", ['tingkat_kelas' => [7]]);

        $res->assertStatus(422);
        $this->assertStringContainsString('struktur', (string) $res->json('message'));
    }

    public function test_ubah_gagal_jika_tingkat_di_luar_jenjang(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $impl = $this->implementasi('draft', [7]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $res = $this->putJson(self::BASE . "/{$impl['ulid']}", ['tingkat_kelas' => [1]]);

        $res->assertStatus(422);
        $this->assertStringContainsString('jenjang', (string) $res->json('message'));
    }

    public function test_hapus_implementasi_draft_tanpa_struktur(): void
    {
        $impl = $this->implementasi('draft', [7]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $this->deleteJson(self::BASE . "/{$impl['ulid']}")->assertOk();

        $this->assertDatabaseMissing('kurikulum_tahun_ajarans', ['id' => $impl['id']]);
    }

    public function test_hapus_implementasi_ditolak_jika_masih_punya_struktur(): void
    {
        $impl = $this->implementasi('draft', [7]);
        $this->tambahStruktur($impl, 7);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $res = $this->deleteJson(self::BASE . "/{$impl['ulid']}");

        $res->assertStatus(422);
        $this->assertStringContainsString('struktur', (string) $res->json('message'));
        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id']]);
    }

    public function test_hapus_implementasi_aktif_ditolak(): void
    {
        $impl = $this->implementasi('active', [7]);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $this->deleteJson(self::BASE . "/{$impl['ulid']}")->assertStatus(422);

        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id']]);
    }

    public function test_hapus_implementasi_sekolah_lain_mengembalikan_404(): void
    {
        $implB = $this->implementasi('draft', [7], $this->schoolB);
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $this->deleteJson(self::BASE . "/{$implB['ulid']}")->assertNotFound();
    }

    // ── daftarkan: range tingkat & peringatan bentrok ────────────────────────

    private function daftarkan(int $kurikulumId, int $tahunAjaranId, array $tingkat = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/operator/master-data/kurikulum/tahun-ajaran/daftarkan', array_filter([
            'kurikulum_ulid' => DB::table('kurikulums')->where('id', $kurikulumId)->value('ulid'),
            'tahun_ajaran_ulid' => DB::table('tahun_ajarans')->where('id', $tahunAjaranId)->value('ulid'),
            'tingkat_kelas' => $tingkat ?: null,
        ]));
    }

    public function test_daftarkan_tanpa_tingkat_memakai_semua_tingkat_jenjang_sekolah(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $taId = $this->tahunAjaran($this->schoolA);
        $kId = $this->kurikulum($this->schoolA->id, 'KUR_SMP');
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $this->daftarkan($kId, $taId)->assertOk();

        $row = DB::table('kurikulum_tahun_ajarans')->where('kurikulum_id', $kId)->first();
        $this->assertSame([7, 8, 9], json_decode($row->tingkat_kelas, true));
    }

    public function test_daftarkan_ditolak_jika_tingkat_di_luar_jenjang(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $taId = $this->tahunAjaran($this->schoolA);
        $kId = $this->kurikulum($this->schoolA->id, 'KUR_SMP');
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $res = $this->daftarkan($kId, $taId, [1, 2]);

        $res->assertStatus(422);
        $this->assertStringContainsString('jenjang', (string) $res->json('message'));
        $this->assertDatabaseMissing('kurikulum_tahun_ajarans', ['kurikulum_id' => $kId]);
    }

    public function test_daftarkan_memberi_peringatan_jika_tingkat_beririsan_dengan_kurikulum_lain(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $taId = $this->tahunAjaran($this->schoolA);
        $this->implementasi('draft', [7, 8], $this->schoolA, $taId, 'KUR_LAMA');
        $kBaru = $this->kurikulum($this->schoolA->id, 'KUR_BARU');
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $res = $this->daftarkan($kBaru, $taId, [8, 9])->assertOk();

        $peringatan = $res->json('data.peringatan');
        $this->assertCount(1, $peringatan);
        $this->assertStringContainsString('Tingkat 8 juga terdaftar', $peringatan[0]);
        // peringatan tidak memblokir: pendaftaran tetap tersimpan
        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['kurikulum_id' => $kBaru]);
    }

    public function test_daftarkan_tanpa_peringatan_jika_tidak_beririsan_selesai_atau_beda_tahun_ajaran(): void
    {
        DB::table('schools')->where('id', $this->schoolA->id)->update(['jenjang' => 'menengah_pertama']);
        $taId = $this->tahunAjaran($this->schoolA);
        $taLain = $this->tahunAjaran($this->schoolA, '2026/2027');

        $this->implementasi('draft', [7], $this->schoolA, $taId, 'KUR_A');       // tingkat tidak beririsan
        $this->implementasi('completed', [8], $this->schoolA, $taId, 'KUR_B');   // beririsan tapi sudah selesai
        $this->implementasi('draft', [9], $this->schoolA, $taLain, 'KUR_C');     // beririsan tapi beda tahun ajaran

        $kBaru = $this->kurikulum($this->schoolA->id, 'KUR_BARU');
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_MANAGE]);

        $res = $this->daftarkan($kBaru, $taId, [8, 9])->assertOk();

        $this->assertSame([], $res->json('data.peringatan'));
    }

    // ── alur penuh ────────────────────────────────────────────────────────────

    public function test_alur_penuh_draft_sampai_completed(): void
    {
        $impl = $this->implementasi('draft', [7]);
        $this->tambahStruktur($impl, 7);
        $url = self::BASE . "/{$impl['ulid']}";

        // Wakasek mengajukan review
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW, self::P_COMPLETE]);
        $this->patchJson("{$url}/ajukan-review")->assertOk()->assertJsonPath('data.status', 'under_review');

        // Kepsek menyetujui lalu mengaktifkan
        $this->loginSebagai('kepsek', [self::P_VIEW, self::P_APPROVE, self::P_ACTIVATE]);
        $this->patchJson("{$url}/setujui")->assertOk()->assertJsonPath('data.status', 'approved');
        $this->patchJson("{$url}/aktifkan")->assertOk()->assertJsonPath('data.status', 'active');

        // Wakasek menyelesaikan
        $this->loginSebagai('wakasek', [self::P_VIEW, self::P_REVIEW, self::P_COMPLETE]);
        $this->patchJson("{$url}/selesaikan")->assertOk()->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('kurikulum_tahun_ajarans', ['id' => $impl['id'], 'status' => 'completed']);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /**
     * Buat user dengan role + permission tertentu, lalu autentikasi sebagai dia.
     * Dipanggil ulang di tengah tes untuk berganti peran.
     */
    private function loginSebagai(string $role, array $permissions, ?School $school = null)
    {
        $school ??= $this->schoolA;

        $user = $this->createUserWithRole($school->id, $role);
        $this->grantPermissions($school->id, $user->roles()->first(), $permissions);

        $this->actingAs($user, 'sanctum');
        $this->setTenant($school->id);

        return $user;
    }

    private function tahunAjaran(School $school, string $tahun = '2025/2026', ?string $status = null): int
    {
        $row = [
            'school_id' => $school->id,
            'ulid' => (string) Str::ulid(),
            'tahun' => $tahun,
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if ($status !== null) {
            $row['status'] = $status;
        }

        return DB::table('tahun_ajarans')->insertGetId($row);
    }

    private function kurikulum(?int $schoolId, string $kode): int
    {
        return DB::table('kurikulums')->insertGetId([
            'school_id' => $schoolId,
            'ulid' => (string) Str::ulid(),
            'nama' => "Kurikulum {$kode}",
            'kode' => $kode,
            'jenis' => 'nasional',
            'tahun_berlaku' => 2023,
            'is_platform_default' => $schoolId === null,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Buat implementasi kurikulum (baris kurikulum_tahun_ajarans).
     *
     * @return array{id:int, ulid:string, school_id:int, tahun_ajaran_id:int}
     */
    private function implementasi(
        string $status = 'draft',
        array $tingkat = [7],
        ?School $school = null,
        ?int $tahunAjaranId = null,
        ?string $kodeKurikulum = null,
        bool $isActive = true,
    ): array {
        $school ??= $this->schoolA;
        $tahunAjaranId ??= $this->tahunAjaran($school);
        $kurikulumId = $this->kurikulum($school->id, $kodeKurikulum ?? ('KUR_' . Str::random(6)));
        $ulid = (string) Str::ulid();

        $id = DB::table('kurikulum_tahun_ajarans')->insertGetId([
            'school_id' => $school->id,
            'kurikulum_id' => $kurikulumId,
            'tahun_ajaran_id' => $tahunAjaranId,
            'semester_id' => null,
            'tingkat_kelas' => json_encode($tingkat),
            'is_active' => $isActive,
            'status' => $status,
            'ulid' => $ulid,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'id' => $id,
            'ulid' => $ulid,
            'school_id' => $school->id,
            'tahun_ajaran_id' => $tahunAjaranId,
        ];
    }

    /**
     * Tambah satu mata pelajaran ke struktur implementasi pada tingkat tertentu.
     */
    private function tambahStruktur(array $impl, int $tingkat): void
    {
        $mapelId = DB::table('mapels')->insertGetId([
            'school_id' => $impl['school_id'],
            'ulid' => (string) Str::ulid(),
            'nama_mapel' => 'Matematika ' . Str::random(4),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('kurikulum_strukturs')->insert([
            'ulid' => (string) Str::ulid(),
            'school_id' => $impl['school_id'],
            'kurikulum_tahun_ajaran_id' => $impl['id'],
            'tingkat' => $tingkat,
            'program_pendidikan_id' => null,
            'mapel_id' => $mapelId,
            'alokasi_jp_minggu' => 4,
            'jenis_komponen' => 'intrakurikuler',
            'is_wajib' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}