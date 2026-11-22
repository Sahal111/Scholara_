<?php

namespace Tests\Feature;

use App\Models\ProgramPendidikan;
use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Feature test: Modul Program Pendidikan
 *
 * Coverage:
 *   - RBAC: wakasek (manage) boleh, operator (tanpa permission) 403
 *   - audit trail: create/update/toggle/delete/restore/force_delete tercatat
 *   - guard destroy: ditolak jika masih punya sub-program / mapel
 *   - guard restore: ditolak jika parent masih di recycle bin
 *   - tenant isolation: sekolah A tidak bisa mengubah program sekolah B
 *
 * Endpoint: /api/operator/master-data/program-pendidikan
 */
class ProgramPendidikanTest extends TestCase
{
    use RefreshDatabase;

    private const BASE_URL = '/api/operator/master-data/program-pendidikan';

    private School $schoolA;
    private School $schoolB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = $this->createSchool(['nama' => 'SMK A', 'npsn' => '31111111', 'jenis' => 'SMK']);
        $this->schoolB = $this->createSchool(['nama' => 'SMK B', 'npsn' => '32222222', 'jenis' => 'SMK']);
    }

    // ── RBAC ──────────────────────────────────────────────────────────────────

    public function test_store_wakasek_creates_program(): void
    {
        $this->loginAsWakasek();

        $this->postJson(self::BASE_URL, $this->payload(['kode' => 'rpl']))
            ->assertCreated();

        $this->assertDatabaseHas('program_pendidikans', [
            'school_id' => $this->schoolA->id,
            'nama' => 'Program Uji',
            'kode' => 'RPL', // controller meng-uppercase
        ]);
    }

    public function test_store_operator_is_forbidden(): void
    {
        $user = $this->createUserWithRole($this->schoolA->id, 'operator');
        $this->grantPermissions($this->schoolA->id, $user->roles()->first(), [
            'master_data.program.view',
        ]);
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $this->postJson(self::BASE_URL, $this->payload())->assertForbidden();
    }

    public function test_store_rejects_jenis_not_available_for_school_jenjang(): void
    {
        $this->loginAsWakasek();

        // Sekolah SMK tidak mengenal peminatan.
        $this->postJson(self::BASE_URL, $this->payload(['kode' => 'PMN', 'jenis' => 'peminatan']))
            ->assertStatus(422);

        $this->assertDatabaseMissing('program_pendidikans', ['kode' => 'PMN']);
    }

    public function test_index_kepsek_view_only_can_read_but_not_write(): void
    {
        $user = $this->createUserWithRole($this->schoolA->id, 'kepsek');
        $this->grantPermissions($this->schoolA->id, $user->roles()->first(), [
            'master_data.program.view',
        ]);
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        $this->getJson(self::BASE_URL)->assertOk();
        $this->postJson(self::BASE_URL, $this->payload())->assertForbidden();
    }

    // ── Audit trail ───────────────────────────────────────────────────────────

    public function test_full_lifecycle_writes_audit_log(): void
    {
        $user = $this->loginAsWakasek();

        $this->postJson(self::BASE_URL, $this->payload(['kode' => 'AUD']))->assertCreated();
        $program = ProgramPendidikan::where('kode', 'AUD')->firstOrFail();

        $this->putJson(self::BASE_URL . "/{$program->ulid}", $this->payload([
            'nama' => 'Program Uji Diubah',
            'kode' => 'AUD',
        ]))->assertOk();

        $this->patchJson(self::BASE_URL . "/{$program->ulid}/toggle-active")->assertOk();
        $this->deleteJson(self::BASE_URL . "/{$program->ulid}")->assertOk();
        $this->patchJson(self::BASE_URL . "/{$program->ulid}/restore")->assertOk();
        $this->deleteJson(self::BASE_URL . "/{$program->ulid}")->assertOk();
        $this->deleteJson(self::BASE_URL . "/{$program->ulid}/force-delete")->assertOk();

        foreach (['create', 'update', 'toggle_active', 'delete', 'restore', 'force_delete'] as $action) {
            $this->assertDatabaseHas('activity_logs', [
                'school_id' => $this->schoolA->id,
                'user_id' => $user->id,
                'module' => 'program_pendidikan',
                'action' => $action,
                'subject_id' => $program->id,
            ]);
        }
    }

    public function test_audit_columns_are_filled_automatically(): void
    {
        $user = $this->loginAsWakasek();

        $this->postJson(self::BASE_URL, $this->payload(['kode' => 'ADT']))->assertCreated();
        $program = ProgramPendidikan::where('kode', 'ADT')->firstOrFail();

        $this->assertSame($user->id, (int) $program->created_by);
        $this->assertSame($user->id, (int) $program->updated_by);
        $this->assertNull($program->deleted_by);

        $this->deleteJson(self::BASE_URL . "/{$program->ulid}")->assertOk();
        $this->assertDatabaseHas('program_pendidikans', [
            'id' => $program->id,
            'deleted_by' => $user->id,
        ]);

        $this->patchJson(self::BASE_URL . "/{$program->ulid}/restore")->assertOk();
        $this->assertDatabaseHas('program_pendidikans', [
            'id' => $program->id,
            'deleted_by' => null,
        ]);
    }

    public function test_audit_columns_cannot_be_set_from_request(): void
    {
        $this->loginAsWakasek();

        $this->postJson(self::BASE_URL, $this->payload([
            'kode' => 'SPF',
            'created_by' => 999999,
        ]))->assertCreated();

        $this->assertDatabaseMissing('program_pendidikans', ['kode' => 'SPF', 'created_by' => 999999]);
    }

    // ── Guard destroy ─────────────────────────────────────────────────────────

    public function test_destroy_blocked_when_program_has_children(): void
    {
        $this->loginAsWakasek();
        $parent = $this->createProgram($this->schoolA->id, 'Induk', 'IND');
        $this->createProgram($this->schoolA->id, 'Anak', 'ANK', $parent->id);

        $this->deleteJson(self::BASE_URL . "/{$parent->ulid}")->assertStatus(422);

        $this->assertNotSoftDeleted('program_pendidikans', ['id' => $parent->id]);
    }

    public function test_destroy_blocked_when_program_used_by_mapel(): void
    {
        $this->loginAsWakasek();
        $program = $this->createProgram($this->schoolA->id, 'Dipakai Mapel', 'DPM');

        \DB::table('mapels')->insert([
            'school_id' => $this->schoolA->id,
            'ulid' => (string) Str::ulid(),
            'nama_mapel' => 'Mapel Uji Guard',
            'program_pendidikan_id' => $program->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->deleteJson(self::BASE_URL . "/{$program->ulid}")->assertStatus(422);

        $this->assertNotSoftDeleted('program_pendidikans', ['id' => $program->id]);
    }

    public function test_destroy_succeeds_when_program_is_unused(): void
    {
        $this->loginAsWakasek();
        $program = $this->createProgram($this->schoolA->id, 'Kosong', 'KSG');

        $this->deleteJson(self::BASE_URL . "/{$program->ulid}")->assertOk();

        $this->assertSoftDeleted('program_pendidikans', ['id' => $program->id]);
    }

    // ── Guard restore ─────────────────────────────────────────────────────────

    public function test_restore_blocked_when_parent_still_in_trash(): void
    {
        $this->loginAsWakasek();
        $parent = $this->createProgram($this->schoolA->id, 'Induk Terhapus', 'IDT');
        $child = $this->createProgram($this->schoolA->id, 'Anak Terhapus', 'ATH', $parent->id);

        \DB::table('program_pendidikans')
            ->whereIn('id', [$parent->id, $child->id])
            ->update(['deleted_at' => now()]);

        $this->patchJson(self::BASE_URL . "/{$child->ulid}/restore")->assertStatus(422);

        $this->assertSoftDeleted('program_pendidikans', ['id' => $child->id]);
    }

    // ── Guard circular reference ─────────────────────────────────────────────

    public function test_update_blocked_when_parent_is_own_descendant(): void
    {
        $this->loginAsWakasek();
        $induk = $this->createProgram($this->schoolA->id, 'Induk', 'IND');
        $anak = $this->createProgram($this->schoolA->id, 'Anak', 'ANK', $induk->id);

        $this->putJson(self::BASE_URL . "/{$induk->ulid}", $this->payload([
            'nama' => 'Induk',
            'kode' => 'IND',
            'parent_id' => $anak->ulid,
        ]))->assertStatus(422);

        $this->assertDatabaseHas('program_pendidikans', ['id' => $induk->id, 'parent_id' => null]);
    }

    public function test_update_blocked_when_jenis_is_changed(): void
    {
        $this->loginAsWakasek();
        $program = $this->createProgram($this->schoolA->id, 'Jenis Tetap', 'JTP'); // jenis 'umum'

        $this->putJson(self::BASE_URL . "/{$program->ulid}", $this->payload([
            'nama' => 'Jenis Tetap',
            'kode' => 'JTP',
            'jenis' => 'peminatan',
        ]))->assertStatus(422);

        $this->assertDatabaseHas('program_pendidikans', ['id' => $program->id, 'jenis' => 'umum']);
    }

    public function test_update_blocked_when_program_is_its_own_parent(): void
    {
        $this->loginAsWakasek();
        $program = $this->createProgram($this->schoolA->id, 'Sendiri', 'SND');

        $this->putJson(self::BASE_URL . "/{$program->ulid}", $this->payload([
            'nama' => 'Sendiri',
            'kode' => 'SND',
            'parent_id' => $program->ulid,
        ]))->assertStatus(422);
    }

    // ── Tenant isolation ──────────────────────────────────────────────────────

    public function test_wakasek_cannot_modify_program_of_other_school(): void
    {
        $this->loginAsWakasek();
        $foreign = $this->createProgram($this->schoolB->id, 'Milik B', 'MLB');

        $this->putJson(self::BASE_URL . "/{$foreign->ulid}", $this->payload(['kode' => 'MLB']))
            ->assertNotFound();
        $this->deleteJson(self::BASE_URL . "/{$foreign->ulid}")->assertNotFound();

        $this->assertNotSoftDeleted('program_pendidikans', ['id' => $foreign->id]);
    }

    public function test_index_does_not_leak_programs_of_other_school(): void
    {
        $this->loginAsWakasek();
        $this->createProgram($this->schoolA->id, 'Milik A', 'MLA');
        $this->createProgram($this->schoolB->id, 'Milik B', 'MLB');

        $response = $this->getJson(self::BASE_URL)->assertOk();

        $kodes = collect($response->json('data'))->pluck('kode')->all();
        $this->assertContains('MLA', $kodes);
        $this->assertNotContains('MLB', $kodes);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function loginAsWakasek()
    {
        $user = $this->createUserWithRole($this->schoolA->id, 'wakasek');
        $this->grantPermissions($this->schoolA->id, $user->roles()->first(), [
            'master_data.program.view',
            'master_data.program.manage',
        ]);
        $this->actingAs($user, 'sanctum');
        $this->setTenant($this->schoolA->id);

        return $user;
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'nama' => 'Program Uji',
            'kode' => null,
            'jenis' => 'bidang_keahlian',
            'jenjang_sasaran' => 'SMK',
        ], $overrides);
    }

    private function createProgram(int $schoolId, string $nama, string $kode, ?int $parentId = null): ProgramPendidikan
    {
        $ulid = (string) Str::ulid();

        \DB::table('program_pendidikans')->insert([
            'school_id' => $schoolId,
            'ulid' => $ulid,
            'parent_id' => $parentId,
            'nama' => $nama,
            'kode' => $kode,
            'jenis' => 'umum',
            'jenjang_sasaran' => 'semua',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ProgramPendidikan::withoutGlobalScopes()->withTrashed()->where('ulid', $ulid)->firstOrFail();
    }

    public function test_trash_is_paginated_filtered_and_tenant_scoped(): void
    {
        $this->loginAsWakasek();

        foreach ([1, 2, 3] as $i) {
            $p = $this->createProgram($this->schoolA->id, "Sampah {$i}", "SMP{$i}");
            \DB::table('program_pendidikans')->where('id', $p->id)->update(['deleted_at' => now()]);
        }
        $foreign = $this->createProgram($this->schoolB->id, 'Sampah B', 'SMPB');
        \DB::table('program_pendidikans')->where('id', $foreign->id)->update(['deleted_at' => now()]);

        $page1 = $this->getJson(self::BASE_URL . '/trash?per_page=2')->assertOk();
        $this->assertCount(2, $page1->json('data'));
        $this->assertSame(3, $page1->json('meta.total'));   // milik sekolah B tidak ikut
        $this->assertSame(2, $page1->json('meta.last_page'));

        $found = $this->getJson(self::BASE_URL . '/trash?search=Sampah 2')->assertOk();
        $this->assertSame(1, $found->json('meta.total'));
    }

    public function test_index_search_does_not_bypass_other_filters(): void
    {
        $this->loginAsWakasek();
        $this->createProgram($this->schoolA->id, 'Alpha Umum', 'ALU');
        $pem = $this->createProgram($this->schoolA->id, 'Alpha Peminatan', 'ALP');
        \DB::table('program_pendidikans')->where('id', $pem->id)->update(['jenis' => 'peminatan']);

        $res = $this->getJson(self::BASE_URL . '?search=Alpha&jenis=peminatan')->assertOk();

        $this->assertSame(['ALP'], collect($res->json('data'))->pluck('kode')->all());
    }
}