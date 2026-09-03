<?php

namespace Tests\Feature;

use App\Models\Kurikulum;
use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature test: Modul Kurikulum
 *
 * Coverage:
 *   - index: platform defaults + custom sekolah muncul, custom sekolah lain tidak
 *   - store: sekolah tidak bisa set is_platform_default = true
 *   - destroy: gagal jika kelas masih pakai kurikulum
 *   - cross-tenant isolation: sekolah A tidak lihat custom sekolah B
 *   - bound check: tanpa tenant context → 400, bukan 500
 */
class KurikulumTest extends TestCase
{
    use RefreshDatabase;

    private School $schoolA;
    private School $schoolB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = $this->createSchool(['nama' => 'SDN A', 'npsn' => '11111111']);
        $this->schoolB = $this->createSchool(['nama' => 'SDN B', 'npsn' => '22222222']);
    }

    // ── index ─────────────────────────────────────────────────────────────────

    public function test_index_returns_platform_defaults_and_own_custom(): void
    {
        // Platform default (school_id NULL)
        $platform = Kurikulum::withoutGlobalScopes()->create($this->kurikulumData(null, 'K13_PLATFORM'));

        // Custom sekolah A
        $customA = Kurikulum::withoutGlobalScopes()->create($this->kurikulumData($this->schoolA->id, 'K13_A'));

        // Custom sekolah B — tidak boleh muncul untuk A
        Kurikulum::withoutGlobalScopes()->create($this->kurikulumData($this->schoolB->id, 'K13_B'));

        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->getJson('/api/v1/master-data/kurikulum');

        $response->assertOk();

        $kodes = collect($response->json('data.data'))->pluck('kode')->toArray();

        $this->assertContains('K13_PLATFORM', $kodes, 'Platform default harus muncul.');
        $this->assertContains('K13_A', $kodes, 'Custom sekolah sendiri harus muncul.');
        $this->assertNotContains('K13_B', $kodes, 'Custom sekolah lain tidak boleh muncul.');
    }

    // ── store ─────────────────────────────────────────────────────────────────

    public function test_store_cannot_set_is_platform_default_true(): void
    {
        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->postJson('/api/v1/master-data/kurikulum', [
            'nama' => 'Kurikulum Custom',
            'kode' => 'CUSTOM_01',
            'jenis' => 'nasional',
            'tahun_berlaku' => 2024,
            'is_platform_default' => true, // harus diabaikan service
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('kurikulums', [
            'kode' => 'CUSTOM_01',
            'school_id' => $this->schoolA->id,
            'is_platform_default' => false, // service paksa false
        ]);
    }

    // ── destroy ───────────────────────────────────────────────────────────────

    public function test_destroy_fails_if_kurikulum_used_by_kelas(): void
    {
        $kurikulum = Kurikulum::withoutGlobalScopes()->create(
            $this->kurikulumData($this->schoolA->id, 'K13_USED')
        );

        // Simulasi ada kelas yang pakai kurikulum ini
        \DB::table('kelas')->insert([
            'school_id' => $this->schoolA->id,
            'kurikulum_id' => $kurikulum->id,
            'nama' => '7A',
            'tingkat' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->deleteJson("/api/v1/master-data/kurikulum/{$kurikulum->ulid}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('kurikulums', ['id' => $kurikulum->id, 'deleted_at' => null]);
    }

    // ── cross-tenant isolation ────────────────────────────────────────────────

    public function test_school_a_cannot_update_school_b_custom_kurikulum(): void
    {
        $kurikulumB = Kurikulum::withoutGlobalScopes()->create(
            $this->kurikulumData($this->schoolB->id, 'K13_B_PRIVATE')
        );

        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->putJson("/api/v1/master-data/kurikulum/{$kurikulumB->ulid}", [
            'nama' => 'Hacked',
        ]);

        $response->assertNotFound();
    }

    // ── bound check (K-1 regression) ─────────────────────────────────────────

    public function test_index_returns_400_not_500_when_no_tenant(): void
    {
        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->actingAs($user, 'sanctum');
        $this->clearTenant(); // simulasi TenantMiddleware gagal

        $response = $this->getJson('/api/v1/master-data/kurikulum');

        // Harus 400, bukan 500 (BindingResolutionException)
        $response->assertStatus(400);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function kurikulumData(?int $schoolId, string $kode): array
    {
        return [
            'school_id' => $schoolId,
            'nama' => "Kurikulum {$kode}",
            'kode' => $kode,
            'jenis' => 'nasional',
            'tahun_berlaku' => 2023,
            'is_platform_default' => false,
            'is_active' => true,
        ];
    }
}