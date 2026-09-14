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
 *   - store: wakasek bisa buat kurikulum, is_platform_default dipaksa false oleh service
 *   - store: operator (view-only) ditolak 403
 *   - destroy: gagal jika kelas masih pakai kurikulum
 *   - cross-tenant isolation: sekolah A tidak bisa update custom sekolah B
 *   - bound check: tanpa tenant context → 400, bukan 500
 *
 * CATATAN URL: Semua endpoint kurikulum berada di /api/operator/master-data/kurikulum
 * (bukan /api/v1/master-data/kurikulum) sesuai routing aktif di master-data.php.
 *
 * CATATAN RBAC: master_data.kurikulum.manage hanya dimiliki wakasek (bukan operator)
 * setelah RBAC split September 2026 (2026_09_04_000001_fix_rbac_wakasek_operator_academic_split).
 */
class KurikulumTest extends TestCase
{
    use RefreshDatabase;

    private const BASE_URL = '/api/operator/master-data/kurikulum';

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
        // Platform default (school_id NULL) — Observer skip log untuk ini
        $this->createKurikulum(null, 'K13_PLATFORM');

        // Custom sekolah A — Observer log hanya jika school_id non-null
        $this->createKurikulum($this->schoolA->id, 'K13_A');

        // Custom sekolah B — tidak boleh muncul untuk A
        $this->createKurikulum($this->schoolB->id, 'K13_B');

        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->getJson(self::BASE_URL);

        $response->assertOk();

        $kodes = collect($response->json('data.data'))->pluck('kode')->toArray();

        $this->assertContains('K13_PLATFORM', $kodes, 'Platform default harus muncul.');
        $this->assertContains('K13_A', $kodes, 'Custom sekolah sendiri harus muncul.');
        $this->assertNotContains('K13_B', $kodes, 'Custom sekolah lain tidak boleh muncul.');
    }

    // ── store ─────────────────────────────────────────────────────────────────

    /**
     * Wakasek (pemilik kebijakan akademik) bisa membuat kurikulum.
     * is_platform_default = true harus diabaikan service — selalu false untuk tenant.
     */
    public function test_store_wakasek_cannot_set_is_platform_default_true(): void
    {
        $user = $this->createUserWithRole($this->schoolA->id, 'wakasek');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->postJson(self::BASE_URL, [
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
            'is_platform_default' => false,
        ]);
    }

    /**
     * Operator pasca-RBAC-split tidak lagi punya master_data.kurikulum.manage.
     * Harus ditolak 403 Forbidden.
     */
    public function test_store_operator_is_forbidden(): void
    {
        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->postJson(self::BASE_URL, [
            'nama' => 'Kurikulum Coba',
            'kode' => 'COBA_01',
            'jenis' => 'nasional',
            'tahun_berlaku' => 2024,
        ]);

        $response->assertForbidden();
    }

    // ── destroy ───────────────────────────────────────────────────────────────

    public function test_destroy_fails_if_kurikulum_used_by_kelas(): void
    {
        $kurikulum = $this->createKurikulum($this->schoolA->id, 'K13_USED');

        // Simulasi ada kelas yang pakai kurikulum ini
        \DB::table('kelas')->insert([
            'school_id' => $this->schoolA->id,
            'kurikulum_id' => $kurikulum->id,
            'nama' => '7A',
            'tingkat' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = $this->createUserWithRole($this->schoolA->id, 'wakasek');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->deleteJson(self::BASE_URL . "/{$kurikulum->ulid}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('kurikulums', ['id' => $kurikulum->id, 'deleted_at' => null]);
    }

    // ── cross-tenant isolation ────────────────────────────────────────────────

    public function test_school_a_cannot_update_school_b_custom_kurikulum(): void
    {
        $kurikulumB = $this->createKurikulum($this->schoolB->id, 'K13_B_PRIVATE');

        $user = $this->createUserWithRole($this->schoolA->id, 'wakasek');
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $response = $this->putJson(self::BASE_URL . "/{$kurikulumB->ulid}", [
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

        $response = $this->getJson(self::BASE_URL);

        // Harus 400, bukan 500 (BindingResolutionException)
        $response->assertStatus(400);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /**
     * Buat kurikulum langsung via DB::table untuk bypass Observer
     * (Observer crash jika school_id non-null tapi current_school_id belum di-bind).
     * Lalu load model dari DB untuk mendapat ULID.
     */
    private function createKurikulum(?int $schoolId, string $kode): Kurikulum
    {
        $now = now();
        $ulid = \Illuminate\Support\Str::ulid()->toString();

        \DB::table('kurikulums')->insert([
            'school_id' => $schoolId,
            'ulid' => $ulid,
            'nama' => "Kurikulum {$kode}",
            'kode' => $kode,
            'jenis' => 'nasional',
            'tahun_berlaku' => 2023,
            'is_platform_default' => $schoolId === null,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return Kurikulum::withoutGlobalScopes()->where('ulid', $ulid)->firstOrFail();
    }
}