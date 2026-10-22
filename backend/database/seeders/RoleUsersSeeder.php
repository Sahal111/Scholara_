<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Inject satu akun per role ke setiap sekolah yang sudah ada di DB.
 *
 * ⚡ IDEMPOTENT — aman dijalankan berulang kali.
 *    Akun yang sudah ada TIDAK dibuat ulang, tapi kredensialnya tetap
 *    ditampilkan supaya daftar login selalu lengkap.
 *
 * Pola kredensial:
 *   email    : {prefix}_{jenis}@{subdomain}.sch.id
 *   password : password
 *
 * Super admin platform (1 akun):
 *   email    : superadmin@platform.id
 *   password : password
 *
 * ⚠️  LOGIN PAKAI EMAIL, bukan username. Username bisa kembar antar sekolah
 *    sejenis (mis. dua sekolah MI sama-sama punya `wakasek_mi`).
 */
class RoleUsersSeeder extends Seeder
{
    /**
     * Mapping role slug → prefix username.
     */
    private const ROLES = [
        'operator' => 'admin',
        'wakasek' => 'wakasek',
        'kepsek' => 'kepsek',
        'guru' => 'guru',
        'wali_kelas' => 'walikelas',
        'bendahara' => 'bendahara',
        'guru_bk' => 'gurubk',
        'tata_usaha' => 'tatausaha',
        'pustakawan' => 'pustakawan',
        'admin_ppdb' => 'adminppdb',
        'admin_keuangan' => 'adminkeu',
        'ortu' => 'ortu',
        'siswa' => 'siswa',
    ];

    /** Email & username super admin platform. */
    private const SUPERADMIN_EMAIL = 'superadmin@platform.id';
    private const SUPERADMIN_USERNAME = 'superadmin';

    public function run(): void
    {
        $schools = School::withoutGlobalScopes()
            ->with(['domains' => fn($q) => $q->where('is_primary', true)])
            ->get();

        if ($schools->isEmpty()) {
            $this->command->warn('⚠️  Tidak ada sekolah ditemukan. Jalankan MultiSchoolSeeder dulu.');
            return;
        }

        $this->seedSuperAdmin();

        foreach ($schools as $school) {
            $this->seedSchoolUsers($school);
        }

        $this->command->newLine();
        $this->command->info('✅ RoleUsersSeeder selesai.');
        $this->command->newLine();
        $this->command->line('ℹ️  Cara membaca daftar di atas:');
        $this->command->line('   ✅ = akun baru dibuat      🔁 = akun sudah ada sebelumnya');
        $this->command->line('   • Login pakai EMAIL (username bisa kembar antar sekolah sejenis).');
        $this->command->line('   • Password bawaan seeder: password');
        $this->command->line('   • Untuk akun 🔁, password hanya ditampilkan jika cocok dengan bawaan seeder.');
    }

    /**
     * Pastikan ada satu akun super admin platform.
     * Mengikuti konvensi TestingUserSeeder: dikaitkan ke sekolah pertama,
     * dengan role `super_admin` (platform role) di sekolah tersebut.
     */
    private function seedSuperAdmin(): void
    {
        $anchor = School::withoutGlobalScopes()->orderBy('id')->first();

        $this->command->newLine();
        $this->command->line('🛡️  <fg=cyan>PLATFORM</> (Super Admin)');

        $existing = User::withoutGlobalScopes()
            ->where(function ($q) use ($anchor) {
                $q->where('email', self::SUPERADMIN_EMAIL)
                    ->orWhere(function ($q2) use ($anchor) {
                        $q2->where('school_id', $anchor->id)
                            ->where('username', self::SUPERADMIN_USERNAME);
                    });
            })
            ->first();

        if ($existing) {
            $pw = $this->infoPassword($existing->password, ['password', 'superadmin123']);
            $this->command->line("   🔁 [super_admin] → <fg=yellow>{$existing->email}</> / {$pw}");
            return;
        }

        DB::transaction(function () use ($anchor) {
            $roleId = DB::table('roles')
                ->where('school_id', $anchor->id)
                ->where('slug', 'super_admin')
                ->value('id');

            if (!$roleId) {
                $role = [
                    'school_id' => $anchor->id,
                    'slug' => 'super_admin',
                    'nama' => 'Global Super Admin (Developer)',
                    'is_system' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (Schema::hasColumn('roles', 'is_platform_role')) {
                    $role['is_platform_role'] = 1;
                }

                $roleId = DB::table('roles')->insertGetId($role);
            }

            $user = User::withoutGlobalScopes()->create([
                'school_id' => $anchor->id,
                'name' => 'Super Admin Platform',
                'email' => self::SUPERADMIN_EMAIL,
                'username' => self::SUPERADMIN_USERNAME,
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);

            DB::table('user_roles')->insertOrIgnore([
                'user_id' => $user->id,
                'role_id' => $roleId,
                'school_id' => $anchor->id,
                'created_at' => now(),
            ]);
        });

        $this->command->line('   ✅ [super_admin] → <fg=green>' . self::SUPERADMIN_EMAIL . '</> / password');
    }

    /**
     * Tampilkan password bawaan yang cocok dengan hash akun, atau tandai kustom.
     *
     * @param  string[]  $kandidat
     */
    private function infoPassword(?string $hash, array $kandidat = ['password']): string
    {
        if (!$hash) {
            return '(tidak diketahui)';
        }

        foreach ($kandidat as $pw) {
            if (Hash::check($pw, $hash)) {
                return $pw;
            }
        }

        return '(password kustom — tidak diubah)';
    }

    private function seedSchoolUsers(School $school): void
    {
        $subdomain = $school->domains->first()?->domain
            ? explode('.', $school->domains->first()->domain)[0]
            : strtolower(str_replace(' ', '', $school->nama));

        $jenis = strtolower($school->jenis); // sd, smp, sma, dst.

        $this->command->newLine();
        $this->command->line("🏫 <fg=cyan>{$school->nama}</> ({$school->jenis})");

        foreach (self::ROLES as $roleSlug => $prefix) {
            $role = Role::withoutGlobalScopes()
                ->where('school_id', $school->id)
                ->where('slug', $roleSlug)
                ->first();

            if (!$role) {
                $this->command->warn("   ⚠️  Role [{$roleSlug}] tidak ditemukan — skip.");
                continue;
            }

            $username = "{$prefix}_{$jenis}";
            $email = "{$username}@{$subdomain}.sch.id";

            // Akun sudah ada → tidak dibuat ulang, tapi kredensialnya tetap ditampilkan
            $existing = User::withoutGlobalScopes()
                ->where('school_id', $school->id)
                ->where('username', $username)
                ->first();

            if ($existing) {
                $pw = $this->infoPassword($existing->password);
                $this->command->line("   🔁 [{$roleSlug}] → <fg=yellow>{$existing->email}</> / {$pw}");
                continue;
            }

            DB::transaction(function () use ($school, $role, $username, $email, $roleSlug, $prefix, $jenis) {
                $user = User::withoutGlobalScopes()->create([
                    'school_id' => $school->id,
                    'name' => ucfirst($prefix) . ' ' . $school->nama,
                    'email' => $email,
                    'username' => $username,
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]);

                DB::table('user_roles')->insertOrIgnore([
                    'user_id' => $user->id,
                    'role_id' => $role->id,
                    'school_id' => $school->id,
                    'created_at' => now(),
                ]);

                // Buat data profil domain jika role membutuhkan
                if ($roleSlug === 'ortu') {
                    $ortuId = DB::table('orang_tuas')->insertGetId([
                        'school_id' => $school->id,
                        'user_id' => $user->id,
                        'nama' => $user->name,
                        'hubungan' => 'Ayah',
                        'status' => 'Kandung',
                        'no_hp' => '08100000000',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Buat siswa dummy sebagai anak
                    $siswaId = DB::table('siswas')->insertGetId([
                        'school_id' => $school->id,
                        'ulid' => Str::ulid()->toBase32(),
                        'nisn' => '0' . str_pad($school->id, 9, '0', STR_PAD_LEFT),
                        'nama' => 'Anak Test ' . strtoupper($jenis),
                        'jenis_kelamin' => 'L',
                        'status' => 'aktif',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('orang_tua_siswa')->insertOrIgnore([
                        'orang_tua_id' => $ortuId,
                        'siswa_id' => $siswaId,
                    ]);
                }

                if ($roleSlug === 'siswa') {
                    $nisn = '9' . str_pad($school->id, 9, '0', STR_PAD_LEFT);

                    // Cek dulu agar idempotent
                    $siswaExists = DB::table('siswas')
                        ->where('school_id', $school->id)
                        ->where('user_id', $user->id)
                        ->exists();

                    if (!$siswaExists) {
                        DB::table('siswas')->insertGetId([
                            'school_id' => $school->id,
                            'ulid' => Str::ulid()->toBase32(),
                            'user_id' => $user->id,
                            'nisn' => $nisn,
                            'nama' => $user->name,
                            'jenis_kelamin' => 'L',
                            'status' => 'aktif',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            });

            $this->command->line("   ✅ [{$roleSlug}] → <fg=green>{$email}</> / password");
        }
    }
}