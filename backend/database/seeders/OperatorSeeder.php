<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class OperatorSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $schoolId = DB::table('schools')->value('id');

        if (!$schoolId) {
            $this->command->warn('OperatorSeeder: tidak ada school — jalankan SchoolSeeder dulu.');
            return;
        }

        $sudahAda = DB::table('users')
            ->where('school_id', $schoolId)
            ->where('username', 'operator')
            ->exists();

        if ($sudahAda) {
            $this->command->info('Operator sudah ada, skip.');
            return;
        }

        // Buat user operator
        $userId = DB::table('users')->insertGetId([
            'school_id' => $schoolId,
            'name' => 'Operator Admin',
            'username' => 'operator',
            'email' => 'operator@minurulhuda3.sch.id',
            'password' => Hash::make('operator123'),
            'is_active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Assign role operator (slug = 'operator')
        $roleId = DB::table('roles')
            ->where('school_id', $schoolId)
            ->where('slug', 'operator')
            ->value('id');

        DB::table('user_roles')->insertOrIgnore([
            ['user_id' => $userId, 'role_id' => $roleId, 'school_id' => $schoolId, 'created_at' => $now],
        ]);

        // Buat profil operator
        DB::table('operator_profiles')->insertOrIgnore([
            ['user_id' => $userId, 'jabatan' => 'Operator Sekolah', 'akses_modul' => json_encode(['all']), 'created_at' => $now, 'updated_at' => $now],
        ]);

        $this->command->info('OperatorSeeder selesai. Login: operator / operator123');
    }
}