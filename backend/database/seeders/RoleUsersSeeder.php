<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Inject satu akun per role ke setiap sekolah yang sudah ada di DB.
 *
 * ⚡ IDEMPOTENT — aman dijalankan berulang kali.
 *    Skip user yang username-nya sudah ada di sekolah tersebut.
 *
 * Pola kredensial:
 *   email    : {prefix}_{jenis}@{subdomain}.sch.id
 *   password : password
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

    public function run(): void
    {
        $schools = School::withoutGlobalScopes()
            ->with(['domains' => fn($q) => $q->where('is_primary', true)])
            ->get();

        if ($schools->isEmpty()) {
            $this->command->warn('⚠️  Tidak ada sekolah ditemukan. Jalankan MultiSchoolSeeder dulu.');
            return;
        }

        foreach ($schools as $school) {
            $this->seedSchoolUsers($school);
        }

        $this->command->newLine();
        $this->command->info('✅ RoleUsersSeeder selesai.');
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

            // Cek apakah user sudah ada
            $exists = User::withoutGlobalScopes()
                ->where('school_id', $school->id)
                ->where('username', $username)
                ->exists();

            if ($exists) {
                $this->command->line("   ⏭️  [{$roleSlug}] sudah ada — skip.");
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