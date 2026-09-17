<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * Seed akun testing untuk semua role.
 * Harus dijalankan SETELAH SchoolSeeder + TahunAjaranSeeder.
 *
 * Akun yang dibuat:
 *   operator   / operator123
 *   kepsek     / kepsek123
 *   guru       / guru123
 *   walikelas  / walikelas123
 *   bendahara  / bendahara123
 *   ortu       / ortu123
 *   siswa      / siswa123
 *   adminppdb  / adminppdb123
 */
class TestingUserSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $schoolId = DB::table('schools')->value('id');

        if (!$schoolId) {
            $this->command->warn('TestingUserSeeder: tidak ada school — jalankan SchoolSeeder dulu.');
            return;
        }

        $taId = DB::table('tahun_ajarans')
            ->where('school_id', $schoolId)
            ->where('tahun', '2026/2027')
            ->value('id');

        $smtId = DB::table('semesters')
            ->where('school_id', $schoolId)
            ->where('tahun_ajaran_id', $taId)
            ->where('nama', 'Ganjil')
            ->value('id');

        $kelasId = DB::table('kelas')
            ->where('school_id', $schoolId)
            ->where('tahun_ajaran_id', $taId)
            ->value('id');

        // Helper: buat user jika belum ada
        $makeUser = function (array $data) use ($now, $schoolId): int {
            $exists = DB::table('users')
                ->where('school_id', $schoolId)
                ->where('username', $data['username'])
                ->value('id');

            if ($exists) {
                return $exists;
            }

            return DB::table('users')->insertGetId(array_merge([
                'school_id' => $schoolId,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ], $data));
        };

        // Helper: assign role
        $assignRole = function (int $userId, string $roleSlug) use ($now, $schoolId): void {
            $roleId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', $roleSlug)
                ->value('id');

            if ($roleId) {
                DB::table('user_roles')->insertOrIgnore([
                    'user_id' => $userId,
                    'role_id' => $roleId,
                    'school_id' => $schoolId,
                    'created_at' => $now,
                ]);
            }
        };

        // Helper: buat guru record
        $makeGuru = function (int $userId, string $nuptk, string $nama, string $jk, string $ptk) use ($now, $schoolId): int {
            $exists = DB::table('gurus')->where('school_id', $schoolId)->where('nuptk', $nuptk)->value('id');
            if ($exists)
                return $exists;

            return DB::table('gurus')->insertGetId([
                'school_id' => $schoolId,
                'ulid' => Str::ulid()->toBase32(),
                'user_id' => $userId,
                'nuptk' => $nuptk,
                'nama' => $nama,
                'jenis_kelamin' => $jk,
                'jenis_ptk' => $ptk,
                'status_aktif' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        };

        // Ensure super_admin role exists in roles table
        $saRoleId = DB::table('roles')->where('school_id', $schoolId)->where('slug', 'super_admin')->value('id');
        if (!$saRoleId) {
            $saRoleId = DB::table('roles')->insertGetId([
                'school_id' => $schoolId,
                'slug' => 'super_admin',
                'nama' => 'Global Super Admin (Developer)',
                'is_system' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── SUPER ADMIN (DEVELOPER / PLATFORM OWNER) ─────────────────
        $userId = $makeUser(['name' => 'Global Super Admin (Developer)', 'username' => 'superadmin', 'email' => 'superadmin@platform.id', 'password' => Hash::make('superadmin123')]);
        $assignRole($userId, 'super_admin');

        // ── OPERATOR ────────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Operator Test', 'username' => 'operator', 'email' => 'operator@test.id', 'password' => Hash::make('operator123')]);
        $assignRole($userId, 'operator');

        // ── KEPSEK ──────────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Kepala Sekolah Test', 'username' => 'kepsek', 'email' => 'kepsek@test.id', 'password' => Hash::make('kepsek123')]);
        $assignRole($userId, 'kepsek');
        $makeGuru($userId, '1111111111111111', 'Kepala Sekolah Test', 'L', 'Kepala Sekolah');

        // ── GURU ─────────────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Guru Pengajar Test', 'username' => 'guru', 'email' => 'guru@test.id', 'password' => Hash::make('guru123')]);
        $assignRole($userId, 'guru');
        $makeGuru($userId, '2222222222222222', 'Guru Pengajar Test', 'P', 'Guru Kelas');

        // ── WALI KELAS ───────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Wali Kelas Test', 'username' => 'walikelas', 'email' => 'walikelas@test.id', 'password' => Hash::make('walikelas123')]);
        $assignRole($userId, 'wali_kelas');
        $guruId = $makeGuru($userId, '3333333333333333', 'Wali Kelas Test', 'L', 'Guru Kelas');

        if ($kelasId) {
            DB::table('wali_kelas')->insertOrIgnore([
                'school_id' => $schoolId,
                'guru_id' => $guruId,
                'kelas_id' => $kelasId,
                'tahun_ajaran_id' => $taId,
                'semester_id' => $smtId,
                'no_sk' => 'SK-WALIKELAS-01',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── BENDAHARA ────────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Bendahara Test', 'username' => 'bendahara', 'email' => 'bendahara@test.id', 'password' => Hash::make('bendahara123')]);
        $assignRole($userId, 'bendahara');
        $guruId = $makeGuru($userId, '4444444444444444', 'Bendahara Test', 'P', 'Guru Kelas');

        DB::table('bendaharas')->insertOrIgnore([
            'school_id' => $schoolId,
            'user_id' => $userId,
            'guru_id' => $guruId,
            'jenis_bendahara' => 'SPP',
            'no_sk' => 'SK-BENDAHARA-01',
            'is_active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── ORTU ─────────────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Orang Tua Test', 'username' => 'ortu', 'email' => 'ortu@test.id', 'password' => Hash::make('ortu123')]);
        $assignRole($userId, 'ortu');

        $ortuId = DB::table('orang_tuas')
            ->where('school_id', $schoolId)
            ->where('user_id', $userId)
            ->value('id');

        if (!$ortuId) {
            $ortuId = DB::table('orang_tuas')->insertGetId([
                'school_id' => $schoolId,
                'user_id' => $userId,
                'nama' => 'Orang Tua Test',
                'hubungan' => 'Ayah',
                'status' => 'Kandung',
                'no_hp' => '081234567890',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Buat siswa anak ortu
        $anakOrtuId = DB::table('siswas')
            ->where('school_id', $schoolId)
            ->where('nisn', '1234567890')
            ->value('id');

        if (!$anakOrtuId) {
            $anakOrtuId = DB::table('siswas')->insertGetId([
                'school_id' => $schoolId,
                'ulid' => Str::ulid()->toBase32(),
                'nisn' => '1234567890',
                'nama' => 'Siswa Anak Ortu Test',
                'jenis_kelamin' => 'L',
                'status' => 'aktif',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($kelasId) {
                DB::table('riwayat_kelas')->insertOrIgnore([
                    'school_id' => $schoolId,
                    'siswa_id' => $anakOrtuId,
                    'kelas_id' => $kelasId,
                    'jenis_perubahan' => 'masuk',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        DB::table('orang_tua_siswa')->insertOrIgnore([
            'orang_tua_id' => $ortuId,
            'siswa_id' => $anakOrtuId,
        ]);

        // ── SISWA ─────────────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Siswa Test', 'username' => 'siswa', 'email' => 'siswa@test.id', 'password' => Hash::make('siswa123')]);
        $assignRole($userId, 'siswa');

        $siswaId = DB::table('siswas')
            ->where('school_id', $schoolId)
            ->where('nisn', '9999999999')
            ->value('id');

        if (!$siswaId) {
            $siswaId = DB::table('siswas')->insertGetId([
                'school_id' => $schoolId,
                'ulid' => Str::ulid()->toBase32(),
                'user_id' => $userId,
                'nisn' => '9999999999',
                'nama' => 'Siswa Test',
                'jenis_kelamin' => 'L',
                'status' => 'aktif',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($kelasId) {
                DB::table('riwayat_kelas')->insertOrIgnore([
                    'school_id' => $schoolId,
                    'siswa_id' => $siswaId,
                    'kelas_id' => $kelasId,
                    'jenis_perubahan' => 'masuk',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // ── ADMIN PPDB ───────────────────────────────────────────────
        $userId = $makeUser(['name' => 'Admin PPDB Test', 'username' => 'adminppdb', 'email' => 'adminppdb@test.id', 'password' => Hash::make('adminppdb123')]);
        $assignRole($userId, 'admin_ppdb');

        $this->command->info('TestingUserSeeder selesai. Akun: operator/kepsek/guru/walikelas/bendahara/ortu/siswa/adminppdb (semua password: [role]123)');
    }
}