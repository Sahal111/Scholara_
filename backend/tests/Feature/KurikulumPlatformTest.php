<?php

namespace Tests\Feature;

use App\Models\Kurikulum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KurikulumPlatformTest extends TestCase
{
    use RefreshDatabase;

    /** Superadmin = user ber-role super_admin yang menempel di satu sekolah jangkar (sama seperti seeder). */
    private function superAdmin(): \App\Models\User
    {
        return $this->createUserWithRole($this->createSchool()->id, 'super_admin');
    }
    
    private function payload(array $o = []): array
    {
        return array_merge([
            'nama' => 'Kurikulum Uji',
            'kode' => 'UJI-1',
            'tahun_berlaku' => 2025,
            'jenis' => 'nasional',
        ], $o);
    }

    public function test_superadmin_buat_kurikulum_platform_dengan_school_id_null(): void
    {
        $this->actingAs($this->superAdmin(), 'sanctum');   // salin dari KurikulumMonitoringTest

        $this->postJson('/api/superadmin/kurikulum-platform', $this->payload())->assertCreated();

        $this->assertNull(Kurikulum::where('kode', 'UJI-1')->value('school_id'));
    }

    public function test_kepsek_tidak_bisa_akses_route_platform(): void
    {
        $school = $this->createSchool();
        $this->actingAs($this->createUserWithRole($school->id, 'kepsek'), 'sanctum');

        $this->postJson('/api/superadmin/kurikulum-platform', $this->payload())->assertForbidden();
    }

    public function test_hanya_satu_default_per_jenis(): void
    {
        $this->actingAs($this->superAdmin(), 'sanctum');

        $this->postJson('/api/superadmin/kurikulum-platform', $this->payload(['is_platform_default' => true]))->assertCreated();
        $this->postJson('/api/superadmin/kurikulum-platform', $this->payload(['kode' => 'UJI-2', 'is_platform_default' => true]))->assertCreated();

        $this->assertSame(1, Kurikulum::platformDefaults()->where('jenis', 'nasional')->where('is_platform_default', true)->count());
    }

    public function test_kode_custom_tidak_boleh_sama_dengan_kode_platform(): void
    {
        \App\Models\Kurikulum::create([
            'school_id' => null,
            'nama' => 'Platform Uji',
            'kode' => 'PLAT-1',
            'tahun_berlaku' => 2025,
            'jenis' => 'nasional',
            'is_active' => true,
        ]);

        $school = $this->createSchool();
        $user = $this->createUserWithRole($school->id, 'wakasek');
        $role = \App\Models\Role::withoutGlobalScopes()
            ->where('school_id', $school->id)->where('slug', 'wakasek')->first();
        $this->grantPermissions($school->id, $role, ['master_data.kurikulum.view', 'master_data.kurikulum.manage']);

        $this->actingAs($user, 'sanctum');
        $this->setTenant($school->id);

        $this->jsonWithTenant('POST', '/api/operator/master-data/kurikulum', [
            'nama' => 'Custom',
            'kode' => 'PLAT-1',
            'tahun_berlaku' => 2025,
            'jenis' => 'custom',
        ], $school->id)->assertStatus(422)->assertJsonValidationErrors('kode');
    }
}