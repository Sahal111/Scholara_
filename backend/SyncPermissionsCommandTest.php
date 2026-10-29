<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Test: php artisan permissions:sync
 *
 * Menjaga agar command tidak crash dan tetap menerapkan pembagian peran:
 * operator mendapat permission administrasi baru, tetapi dicabut dari
 * permission kebijakan/workflow akademik.
 */
class SyncPermissionsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_berjalan_tanpa_error_dan_menerapkan_pembagian_operator(): void
    {
        $school = $this->createSchool(['nama' => 'MI Uji Sync']);
        $user = $this->createUserWithRole($school->id, 'operator');

        // Operator "terlanjur" memegang permission workflow (mis. dari data lama).
        // Jalur "cabut ulang blacklist operator" harus ikut berjalan dan mencabutnya.
        $this->grantPermissions($school->id, $user->roles()->first(), [
            'master_data.kurikulum.review',
        ]);

        $this->artisan('permissions:sync', ['--school' => $school->id])->assertExitCode(0);

        $slugOperator = DB::table('role_permissions as rp')
            ->join('roles as r', 'r.id', '=', 'rp.role_id')
            ->join('permissions as p', 'p.id', '=', 'rp.permission_id')
            ->where('r.school_id', $school->id)
            ->where('r.slug', 'operator')
            ->pluck('p.slug')
            ->all();

        // Permission administrasi baru ikut diberikan
        $this->assertContains('akun.view', $slugOperator);

        // Permission workflow kurikulum dicabut dari operator
        $this->assertNotContains('master_data.kurikulum.review', $slugOperator);
    }

    public function test_sync_kedua_kali_tidak_menggandakan_permission(): void
    {
        $school = $this->createSchool(['nama' => 'MI Uji Sync 2']);
        $this->createUserWithRole($school->id, 'operator');

        $this->artisan('permissions:sync', ['--school' => $school->id])->assertExitCode(0);
        $setelahPertama = DB::table('permissions')->where('school_id', $school->id)->count();

        $this->artisan('permissions:sync', ['--school' => $school->id])->assertExitCode(0);
        $setelahKedua = DB::table('permissions')->where('school_id', $school->id)->count();

        $this->assertSame($setelahPertama, $setelahKedua);
    }
}
