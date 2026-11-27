<?php

namespace Tests\Feature;

use App\Models\Galeri;
use App\Models\Pengaturan;
use App\Models\Role;
use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GaleriPengaturanTenantTest extends TestCase
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

    private function galeri(School $school): Galeri
    {
        $uploader = $this->createUserWithRole($school->id, 'operator');

        return Galeri::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'judul' => 'Foto ' . $school->nama,
            'kategori' => 'kegiatan',
            'foto' => 'galeris/dummy.jpg',
            'uploaded_by' => $uploader->id,
        ]);
    }

    private function kode(School $school, string $value): Pengaturan
    {
        return Pengaturan::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'key' => 'kode_registrasi_ortu',
            'value' => $value,
        ]);
    }

    private function operatorWith(School $school, array $perms)
    {
        $user = $this->createUserWithRole($school->id, 'operator');
        $role = Role::withoutGlobalScopes()
            ->where('school_id', $school->id)->where('slug', 'operator')->first();
        $this->grantPermissions($school->id, $role, $perms);

        return $user;
    }

    // ── Model level ──────────────────────────────────────────────────────

    public function test_galeri_hanya_menampilkan_data_tenant_aktif(): void
    {
        $this->galeri($this->schoolA);
        $this->galeri($this->schoolB);

        $this->setTenant($this->schoolA->id);

        $this->assertCount(1, Galeri::all());
        $this->assertEquals('Foto MI A', Galeri::first()->judul);
    }

    public function test_galeri_baru_otomatis_dapat_school_id_dari_tenant(): void
    {
        $uploader = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->setTenant($this->schoolA->id);

        $g = Galeri::create([
            'judul' => 'Baru',
            'kategori' => 'prestasi',
            'foto' => 'galeris/x.jpg',
            'uploaded_by' => $uploader->id,
        ]);

        $this->assertEquals($this->schoolA->id, $g->fresh()->school_id);
    }

    public function test_pengaturan_terisolasi_per_sekolah(): void
    {
        $this->kode($this->schoolA, 'KODE-A');
        $this->kode($this->schoolB, 'KODE-B');

        $this->setTenant($this->schoolB->id);

        $this->assertEquals(
            'KODE-B',
            Pengaturan::where('key', 'kode_registrasi_ortu')->value('value')
        );
    }

    public function test_update_or_create_tidak_menimpa_sekolah_lain(): void
    {
        $this->kode($this->schoolA, 'KODE-A');
        $this->kode($this->schoolB, 'KODE-B');

        $this->setTenant($this->schoolA->id);
        Pengaturan::updateOrCreate(['key' => 'kode_registrasi_ortu'], ['value' => 'BARU-A']);

        $semua = Pengaturan::withoutGlobalScopes()->pluck('value', 'school_id');
        $this->assertEquals('BARU-A', $semua[$this->schoolA->id]);
        $this->assertEquals('KODE-B', $semua[$this->schoolB->id]);
    }

    // ── API ──────────────────────────────────────────────────────────────

    public function test_operator_tidak_bisa_hapus_galeri_sekolah_lain(): void
    {
        $galeriB = $this->galeri($this->schoolB);
        $operator = $this->operatorWith($this->schoolA, ['pengumuman.delete']);

        $this->actingAs($operator)
            ->deleteJson("/api/operator/galeri/{$galeriB->id}")
            ->assertStatus(404);

        $this->assertNull(
            Galeri::withoutGlobalScopes()->withTrashed()->find($galeriB->id)->deleted_at
        );
    }

    public function test_get_kode_registrasi_hanya_milik_sekolah_sendiri(): void
    {
        $this->kode($this->schoolA, 'KODE-A');
        $this->kode($this->schoolB, 'KODE-B');
        $operator = $this->operatorWith($this->schoolA, ['pengaturan.view']);

        $this->actingAs($operator)
            ->getJson('/api/operator/pengaturan/kode-registrasi')
            ->assertOk()
            ->assertJsonPath('data.kode_registrasi', 'KODE-A');
    }

    public function test_post_kode_registrasi_hanya_mengubah_sekolah_sendiri(): void
    {
        $this->kode($this->schoolA, 'KODE-A');
        $this->kode($this->schoolB, 'KODE-B');
        $operator = $this->operatorWith($this->schoolA, ['pengaturan.view']);

        $this->actingAs($operator)
            ->postJson('/api/operator/pengaturan/kode-registrasi', ['kode_registrasi' => 'BARU-A'])
            ->assertOk();

        $semua = Pengaturan::withoutGlobalScopes()->pluck('value', 'school_id');
        $this->assertEquals('BARU-A', $semua[$this->schoolA->id]);
        $this->assertEquals('KODE-B', $semua[$this->schoolB->id]);
    }
}