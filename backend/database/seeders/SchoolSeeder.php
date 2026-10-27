<?php

namespace Database\Seeders;

use Database\Seeders\Support\RbacCatalog;
use App\Models\Permission;
use App\Models\Role;
use App\Models\School;
use App\Models\SchoolDomain;
use App\Models\SchoolSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seed satu sekolah dengan seluruh data default-nya:
 * - School record
 * - Domain
 * - School settings
 * - Role default (system roles)
 * - Permission default (semua modul)
 * - Mapping role → permission
 * - User operator pertama
 *
 * Seeder ini juga dipakai oleh SchoolProvisioningService saat sekolah baru
 * didaftarkan dari production (bukan hanya untuk dev).
 *
 * ⚡ IDEMPOTENT — aman dijalankan berulang kali (tidak crash jika data sudah ada).
 */
class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $school = $this->createSchool();
        $this->createDomain($school);
        $this->createSettings($school);

        $permissions = $this->createPermissions($school);
        $roles = $this->createRoles($school);
        $this->assignPermissionsToRoles($roles, $permissions);

        $this->createSuperOperator($school, $roles['operator']);

        $this->command->info("✅ Sekolah '{$school->nama}' berhasil di-seed.");
        $this->command->info("   👤 Login: admin@minurulhuda3.sch.id / password: password");
    }

    // ────────────────────────────────────────────────────────

    private function createSchool(): School
    {
        // Gunakan firstOrCreate agar aman dijalankan berulang (idempotent)
        $school = School::withoutGlobalScopes()
            ->where('npsn', '60717525')
            ->first();

        if ($school) {
            $this->command->warn("⚠️  Sekolah dengan NPSN 60717525 sudah ada (id: {$school->id}). Melewati pembuatan sekolah.");
            return $school;
        }

        return School::create([
            'nama' => 'MI Nurul Huda 3',
            'npsn' => '60717525',
            'jenis' => 'MI',
            'jenjang' => 'dasar',
            'kurikulum' => School::KURIKULUM_MERDEKA,
            'status' => 'active',
        ]);
    }

    private function createDomain(School $school): void
    {
        // insertOrIgnore agar tidak crash jika domain sudah ada
        DB::table('school_domains')->insertOrIgnore([
            'school_id' => $school->id,
            'domain' => 'minurulhuda3.siakad.id',
            'is_primary' => true,
            'created_at' => now(),
        ]);
    }

    private function createSettings(School $school): void
    {
        $defaults = [
            ['key' => 'sekolah.nama_lengkap', 'value' => 'MI Nurul Huda 3', 'grup' => 'sekolah'],
            ['key' => 'sekolah.nama_singkat', 'value' => 'MIN Huda 3', 'grup' => 'sekolah'],
            ['key' => 'sekolah.alamat', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.kota', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.provinsi', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.no_telp', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'sekolah.email', 'value' => '', 'grup' => 'sekolah'],
            ['key' => 'akademik.kkm_default', 'value' => '70', 'grup' => 'akademik'],
            ['key' => 'akademik.kurikulum', 'value' => 'Merdeka', 'grup' => 'akademik'],
            ['key' => 'tampilan.primary_color', 'value' => '#15803D', 'grup' => 'tampilan'],
            ['key' => 'tampilan.theme', 'value' => 'default', 'grup' => 'tampilan'],
        ];

        foreach ($defaults as $setting) {
            // Hanya insert jika key belum ada untuk sekolah ini
            $exists = DB::table('school_settings')
                ->where('school_id', $school->id)
                ->where('key', $setting['key'])
                ->exists();

            if (!$exists) {
                SchoolSetting::create(array_merge($setting, ['school_id' => $school->id]));
            }
        }
    }

    private function createPermissions(School $school): array
    {
        $definitions = $this->permissionDefinitions();
        $result = [];

        foreach ($definitions as $def) {
            // firstOrCreate agar tidak crash jika permission sudah ada
            $permission = Permission::withoutGlobalScopes()->firstOrCreate(
                ['school_id' => $school->id, 'slug' => $def['slug']],
                ['nama' => $def['nama'], 'modul' => $def['modul']]
            );

            $result[$def['slug']] = $permission;
        }

        return $result;
    }

    private function createRoles(School $school): array
    {
        $roleDefs = [
            ['slug' => 'operator', 'nama' => 'Operator', 'is_system' => true],
            ['slug' => 'kepsek', 'nama' => 'Kepala Sekolah', 'is_system' => true],
            ['slug' => 'guru', 'nama' => 'Guru', 'is_system' => true],
            ['slug' => 'wali_kelas', 'nama' => 'Wali Kelas', 'is_system' => true],
            ['slug' => 'bendahara', 'nama' => 'Bendahara', 'is_system' => true],
            ['slug' => 'ortu', 'nama' => 'Orang Tua', 'is_system' => true],
            ['slug' => 'siswa', 'nama' => 'Siswa', 'is_system' => true],
            ['slug' => 'admin_ppdb', 'nama' => 'Admin PPDB', 'is_system' => true],
            ['slug' => 'wakasek', 'nama' => 'Wakil Kepala Sekolah', 'is_system' => true],
            ['slug' => 'guru_bk', 'nama' => 'Guru Bimbingan Konseling', 'is_system' => true],
            ['slug' => 'pustakawan', 'nama' => 'Pustakawan', 'is_system' => true],
            ['slug' => 'tata_usaha', 'nama' => 'Tata Usaha', 'is_system' => true],
            ['slug' => 'admin_keuangan', 'nama' => 'Admin Keuangan', 'is_system' => true],
        ];

        $created = [];
        foreach ($roleDefs as $def) {
            // firstOrCreate agar tidak crash jika role sudah ada
            $role = Role::withoutGlobalScopes()->firstOrCreate(
                ['school_id' => $school->id, 'slug' => $def['slug']],
                array_merge($def, ['school_id' => $school->id, 'is_active' => true])
            );
            $created[$def['slug']] = $role;
        }

        return $created;
    }

    private function assignPermissionsToRoles(array $roles, array $permissions): void
    {
        $matrix = $this->rolePermissionMatrix();

        foreach ($matrix as $roleSlug => $permSlugs) {
            if (!isset($roles[$roleSlug])) {
                continue;
            }

            $role = $roles[$roleSlug];
            $permIds = collect($permSlugs)
                ->filter(fn($slug) => isset($permissions[$slug]))
                ->map(fn($slug) => $permissions[$slug]->id)
                ->toArray();

            $pivotData = collect($permIds)
                ->mapWithKeys(fn($id) => [$id => ['school_id' => $role->school_id]])
                ->toArray();

            $role->permissions()->sync($pivotData);
        }
    }

    private function createSuperOperator(School $school, Role $role): void
    {
        // Cek apakah user sudah ada sebelum insert
        $user = User::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('username', 'admin')
            ->first();

        if (!$user) {
            $user = User::withoutGlobalScopes()->create([
                'school_id' => $school->id,
                'name' => 'Admin Sekolah',
                'email' => 'admin@minurulhuda3.sch.id',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
        }

        // insertOrIgnore agar tidak crash jika role sudah di-assign
        DB::table('user_roles')->insertOrIgnore([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'school_id' => $school->id,
            'created_at' => now(),
        ]);
    }

    // ────────────────────────────────────────────────────────
    // Permission definitions
    // ────────────────────────────────────────────────────────

    private function permissionDefinitions(): array
    {
        return RbacCatalog::permissionDefinitions();
    }

    // ────────────────────────────────────────────────────────
    // Role → Permission matrix
    // ────────────────────────────────────────────────────────

    private function rolePermissionMatrix(): array
    {
        return RbacCatalog::rolePermissionMatrix();
    }
}