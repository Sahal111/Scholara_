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
use Carbon\Carbon;

/**
 * Seed multiple schools untuk keperluan dev & demo multi-tenant.
 * Mencakup semua jenjang: SD, SMP, SMA, SMK, MI, MTs, MA, MAK.
 *
 * ⚡ IDEMPOTENT — aman dijalankan berulang kali (skip jika NPSN sudah ada).
 *
 * Akun admin masing-masing sekolah: admin@{subdomain}.sch.id / password
 */
class MultiSchoolSeeder extends Seeder
{
    public function run(): void
    {
        $schools = $this->schoolDefinitions();

        foreach ($schools as $def) {
            $this->seedSchool($def);
        }

        $this->command->info('✅ MultiSchoolSeeder selesai — ' . count($schools) . ' sekolah di-seed.');
    }

    // ─────────────────────────────────────────────────────────────────────
    // Definisi sekolah-sekolah demo
    // ─────────────────────────────────────────────────────────────────────

    private function schoolDefinitions(): array
    {
        return [
            [
                'nama' => 'SD Negeri Budi Utama',
                'npsn' => '10000001',
                'jenis' => 'SD',
                'jenjang' => 'dasar',
                'subdomain' => 'sdbudiutama',
                'operator' => ['name' => 'Admin SD Budi Utama', 'username' => 'admin_sd'],
                'wakasek' => ['name' => 'Wakasek SD Budi Utama', 'username' => 'wakasek_sd'],
            ],
            [
                'nama' => 'SMP Negeri 1 Nusantara',
                'npsn' => '20000001',
                'jenis' => 'SMP',
                'jenjang' => 'menengah_pertama',
                'subdomain' => 'smpn1nusantara',
                'operator' => ['name' => 'Admin SMP N 1', 'username' => 'admin_smp'],
                'wakasek' => ['name' => 'Wakasek SMP N 1', 'username' => 'wakasek_smp'],
            ],
            [
                'nama' => 'SMA Negeri 1 Merdeka',
                'npsn' => '30000001',
                'jenis' => 'SMA',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'sman1merdeka',
                'operator' => ['name' => 'Admin SMA N 1', 'username' => 'admin_sma'],
                'wakasek' => ['name' => 'Wakasek SMA N 1', 'username' => 'wakasek_sma'],
            ],
            [
                'nama' => 'SMK Negeri 2 Teknologi',
                'npsn' => '30000002',
                'jenis' => 'SMK',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'smkn2teknologi',
                'operator' => ['name' => 'Admin SMK N 2', 'username' => 'admin_smk'],
                'wakasek' => ['name' => 'Wakasek SMK N 2', 'username' => 'wakasek_smk'],
            ],
            [
                'nama' => 'MI Al-Ikhlas',
                'npsn' => '60000001',
                'jenis' => 'MI',
                'jenjang' => 'dasar',
                'subdomain' => 'mialikhlasdev',
                'operator' => ['name' => 'Admin MI Al-Ikhlas', 'username' => 'admin_mi'],
                'wakasek' => ['name' => 'Wakasek MI Al-Ikhlas', 'username' => 'wakasek_mi'],
            ],
            [
                'nama' => 'MTs Darul Ulum',
                'npsn' => '70000001',
                'jenis' => 'MTs',
                'jenjang' => 'menengah_pertama',
                'subdomain' => 'mtsdarululum',
                'operator' => ['name' => 'Admin MTs Darul Ulum', 'username' => 'admin_mts'],
                'wakasek' => ['name' => 'Wakasek MTs Darul Ulum', 'username' => 'wakasek_mts'],
            ],
            [
                'nama' => 'MA Nurul Huda',
                'npsn' => '80000001',
                'jenis' => 'MA',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'manurulhuda',
                'operator' => ['name' => 'Admin MA Nurul Huda', 'username' => 'admin_ma'],
                'wakasek' => ['name' => 'Wakasek MA Nurul Huda', 'username' => 'wakasek_ma'],
            ],
            [
                'nama' => 'MAK Farmasi Al-Hikmah',
                'npsn' => '80000002',
                'jenis' => 'MAK',
                'jenjang' => 'menengah_atas',
                'subdomain' => 'makalhikmah',
                'operator' => ['name' => 'Admin MAK Al-Hikmah', 'username' => 'admin_mak'],
                'wakasek' => ['name' => 'Wakasek MAK Al-Hikmah', 'username' => 'wakasek_mak'],
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    // Core: seed satu sekolah
    // ─────────────────────────────────────────────────────────────────────

    private function seedSchool(array $def): void
    {
        // Cari sekolah yang sudah ada atau buat baru
        $existingSchool = School::withoutGlobalScopes()
            ->where('npsn', $def['npsn'])
            ->first();

        if ($existingSchool) {
            $this->command->warn("⏭️  Skip '{$def['nama']}' — NPSN {$def['npsn']} sudah ada.");
            // Tetap sync permissions untuk sekolah yang sudah ada
            $permissions = $this->createPermissions($existingSchool);
            $roles = $this->createRoles($existingSchool);
            $this->assignPermissionsToRoles($roles, $permissions);
            $this->command->info("   🔄 Permissions di-sync ulang untuk '{$def['nama']}'.");
            return;
        }

        DB::transaction(function () use ($def) {
            // 1. Buat sekolah
            $school = School::create([
                'nama' => $def['nama'],
                'npsn' => $def['npsn'],
                'jenis' => $def['jenis'],
                'jenjang' => $def['jenjang'],
                'status' => 'active',
            ]);

            // 2. Domain
            DB::table('school_domains')->insertOrIgnore([
                'school_id' => $school->id,
                'domain' => "{$def['subdomain']}.siakad.id",
                'is_primary' => true,
                'created_at' => now(),
            ]);

            // 3. Settings default
            $this->createSettings($school, $def['nama']);

            // 4. Permissions & Roles
            $permissions = $this->createPermissions($school);
            $roles = $this->createRoles($school);
            $this->assignPermissionsToRoles($roles, $permissions);

            // 5. User operator
            $this->createOperator($school, $roles['operator'], $def);

            // 6. User wakasek
            $this->createWakasek($school, $roles['wakasek'], $def);

            $this->command->info("✅ '{$def['nama']}' ({$def['jenis']}) berhasil di-seed.");
            $this->command->info("   👤 Operator : {$def['operator']['username']}@{$def['subdomain']}.sch.id / password");
            $this->command->info("   👤 Wakasek  : {$def['wakasek']['username']}@{$def['subdomain']}.sch.id / password");
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    private function createSettings(School $school, string $namaSekolah): void
    {
        $defaults = [
            ['key' => 'sekolah.nama_lengkap', 'value' => $namaSekolah, 'grup' => 'sekolah'],
            ['key' => 'sekolah.nama_singkat', 'value' => $namaSekolah, 'grup' => 'sekolah'],
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

        $rows = array_map(fn($s) => array_merge($s, [
            'school_id' => $school->id,
            'updated_at' => now(),
        ]), $defaults);

        DB::table('school_settings')->insertOrIgnore($rows);
    }

    private function createPermissions(School $school): array
    {
        $result = [];

        foreach ($this->permissionDefinitions() as $def) {
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
            ['slug' => 'operator', 'nama' => 'Operator'],
            ['slug' => 'kepsek', 'nama' => 'Kepala Sekolah'],
            ['slug' => 'guru', 'nama' => 'Guru'],
            ['slug' => 'wali_kelas', 'nama' => 'Wali Kelas'],
            ['slug' => 'bendahara', 'nama' => 'Bendahara'],
            ['slug' => 'ortu', 'nama' => 'Orang Tua'],
            ['slug' => 'siswa', 'nama' => 'Siswa'],
            ['slug' => 'admin_ppdb', 'nama' => 'Admin PPDB'],
            ['slug' => 'wakasek', 'nama' => 'Wakil Kepala Sekolah'],
            ['slug' => 'guru_bk', 'nama' => 'Guru Bimbingan Konseling'],
            ['slug' => 'pustakawan', 'nama' => 'Pustakawan'],
            ['slug' => 'tata_usaha', 'nama' => 'Tata Usaha'],
            ['slug' => 'admin_keuangan', 'nama' => 'Admin Keuangan'],
        ];

        $created = [];
        foreach ($roleDefs as $def) {
            $role = Role::withoutGlobalScopes()->firstOrCreate(
                ['school_id' => $school->id, 'slug' => $def['slug']],
                array_merge($def, ['school_id' => $school->id, 'is_system' => true, 'is_active' => true])
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

    private function createOperator(School $school, Role $role, array $def): void
    {
        $subdomain = $def['subdomain'];
        $username = $def['operator']['username'];
        $email = "{$username}@{$subdomain}.sch.id";

        $user = User::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('username', $username)
            ->first();

        if (!$user) {
            $user = User::withoutGlobalScopes()->create([
                'school_id' => $school->id,
                'name' => $def['operator']['name'],
                'email' => $email,
                'username' => $username,
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
        }

        DB::table('user_roles')->insertOrIgnore([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'school_id' => $school->id,
            'created_at' => now(),
        ]);
    }

    private function createWakasek(School $school, Role $role, array $def): void
    {
        $subdomain = $def['subdomain'];
        $username = $def['wakasek']['username'];
        $email = "{$username}@{$subdomain}.sch.id";

        $user = User::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('username', $username)
            ->first();

        if (!$user) {
            $user = User::withoutGlobalScopes()->create([
                'school_id' => $school->id,
                'name' => $def['wakasek']['name'],
                'email' => $email,
                'username' => $username,
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
        }

        DB::table('user_roles')->insertOrIgnore([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'school_id' => $school->id,
            'created_at' => now(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Permission definitions (sama dengan SchoolSeeder)
    // ─────────────────────────────────────────────────────────────────────

    private function permissionDefinitions(): array
    {
        return RbacCatalog::permissionDefinitions();
    }

    private function rolePermissionMatrix(): array
    {
        return RbacCatalog::rolePermissionMatrix();
    }
}