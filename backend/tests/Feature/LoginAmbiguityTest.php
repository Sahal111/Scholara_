<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Test: login ketika username yang sama dipakai di beberapa sekolah.
 *
 * Kasus nyata: dua sekolah MI sama-sama punya `wakasek_mi` / `kepsek_mi`.
 * Tanpa konteks sekolah (localhost / mobile), sistem tidak boleh diam-diam
 * memilih "user pertama" — itu bisa memasukkan user ke sekolah yang salah.
 */
class LoginAmbiguityTest extends TestCase
{
    use RefreshDatabase;

    private const LOGIN_URL = '/api/auth/login';

    private School $schoolA;
    private School $schoolB;
    private User $userA;
    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = $this->createSchool(['nama' => 'MI A']);
        $this->schoolB = $this->createSchool(['nama' => 'MI B']);

        // Username SAMA di dua sekolah, password SAMA ("password")
        $this->userA = $this->createUserWithRole($this->schoolA->id, 'wakasek', [
            'username' => 'wakasek_mi',
            'email' => 'wakasek_mi@mia.sch.id',
        ]);
        $this->userB = $this->createUserWithRole($this->schoolB->id, 'wakasek', [
            'username' => 'wakasek_mi',
            'email' => 'wakasek_mi@mib.sch.id',
        ]);
    }

    public function test_username_kembar_dengan_password_sama_ditolak_dan_diminta_email(): void
    {
        $response = $this->postJson(self::LOGIN_URL, [
            'login' => 'wakasek_mi',
            'password' => 'password',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('lebih dari satu sekolah', $response->getContent());

        // Tidak boleh ada token yang diterbitkan untuk sekolah mana pun
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_dengan_email_tetap_berhasil_meski_username_kembar(): void
    {
        $this->postJson(self::LOGIN_URL, [
            'login' => 'wakasek_mi@mib.sch.id',
            'password' => 'password',
        ])->assertOk();

        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $this->userB->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $this->userA->id]);
    }

    public function test_username_kembar_dengan_password_berbeda_masuk_ke_akun_yang_cocok(): void
    {
        $this->userB->forceFill(['password' => Hash::make('rahasia-sekolah-b')])->save();

        $this->postJson(self::LOGIN_URL, [
            'login' => 'wakasek_mi',
            'password' => 'rahasia-sekolah-b',
        ])->assertOk();

        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $this->userB->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $this->userA->id]);
    }

    public function test_username_kembar_dengan_konteks_sekolah_tidak_ambigu(): void
    {
        // Konteks sekolah dikenali dari subdomain (lihat TenantMiddleware)
        DB::table('school_domains')->insert([
            'school_id' => $this->schoolA->id,
            'domain' => 'mia.scholara.test',
            'is_primary' => 1,
            'created_at' => now(),
        ]);

        // Host diberikan lewat URL penuh; HTTP_HOST manual akan ditimpa oleh host di URL
        $this->postJson('http://mia.scholara.test' . self::LOGIN_URL, [
            'login' => 'wakasek_mi',
            'password' => 'password',
        ])->assertOk();

        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $this->userA->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $this->userB->id]);
    }

    public function test_password_salah_pada_username_kembar_tidak_membocorkan_adanya_banyak_sekolah(): void
    {
        $response = $this->postJson(self::LOGIN_URL, [
            'login' => 'wakasek_mi',
            'password' => 'password-salah',
        ]);

        $response->assertStatus(422);
        $this->assertSame('Username/email atau password salah.', $response->json('errors.login.0'));
        $this->assertStringNotContainsString('lebih dari satu sekolah', $response->getContent());
    }
}
