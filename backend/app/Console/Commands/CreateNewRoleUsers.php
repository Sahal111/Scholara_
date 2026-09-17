<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class CreateNewRoleUsers extends Command
{
    protected $signature = 'scholara:create-role-users';
    protected $description = 'Buat user testing untuk 5 role baru';

    public function handle()
    {
        $now = Carbon::now();
        $schoolId = DB::table('schools')->value('id');

        if (!$schoolId) {
            $this->error('Tidak ada sekolah. Jalankan SchoolSeeder dulu.');
            return 1;
        }

        $this->info("School ID: {$schoolId}");

        $existingRoles = DB::table('roles')
            ->where('school_id', $schoolId)
            ->pluck('slug')->toArray();
        $this->info('Role di DB: ' . implode(', ', $existingRoles));

        $targets = [
            ['slug' => 'wakasek', 'name' => 'Wakil Kepala Sekolah Test', 'username' => 'wakasek'],
            ['slug' => 'guru_bk', 'name' => 'Guru BK Test', 'username' => 'guru-bk'],
            ['slug' => 'pustakawan', 'name' => 'Pustakawan Test', 'username' => 'pustakawan'],
            ['slug' => 'tata_usaha', 'name' => 'Tata Usaha Test', 'username' => 'tata-usaha'],
            ['slug' => 'admin_keuangan', 'name' => 'Admin Keuangan Test', 'username' => 'admin-keuangan'],
        ];

        foreach ($targets as $t) {
            $slug = $t['slug'];
            $username = $t['username'];
            $name = $t['name'];
            $password = $username . '123';

            $roleId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', $slug)
                ->value('id');

            if (!$roleId) {
                $roleId = DB::table('roles')->insertGetId([
                    'school_id' => $schoolId,
                    'slug' => $slug,
                    'nama' => ucwords(str_replace('_', ' ', $slug)),
                    'is_system' => 1,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $this->warn("  Role '{$slug}' dibuat baru (id: {$roleId})");
            }

            DB::table('users')
                ->where('school_id', $schoolId)
                ->where('username', $username)
                ->delete();

            $userId = DB::table('users')->insertGetId([
                'school_id' => $schoolId,
                'name' => $name,
                'username' => $username,
                'email' => $username . '@test.id',
                'password' => Hash::make($password),
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('user_roles')->insertOrIgnore([
                'user_id' => $userId,
                'role_id' => $roleId,
                'school_id' => $schoolId,
                'created_at' => $now,
            ]);

            $this->info("  ✓ {$username} / {$password}");
        }

        $this->newLine();
        $this->table(
            ['Username', 'Password', 'URL'],
            [
                ['wakasek', 'wakasek123', '/wakasek'],
                ['guru-bk', 'guru-bk123', '/guru-bk'],
                ['pustakawan', 'pustakawan123', '/pustakawan'],
                ['tata-usaha', 'tata-usaha123', '/tata-usaha'],
                ['admin-keuangan', 'admin-keuangan123', '/admin-keuangan'],
            ]
        );

        return 0;
    }
}