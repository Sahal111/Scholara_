<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
                // 1. SaaS Global master data & subscriptions
            GlobalSaaSSeeder::class,

                // 2. Buat sekolah pertama (MI) + role + permission + super_operator
                //    Harus jalan paling pertama karena semua tabel lain FK ke schools
            SchoolSeeder::class,

                // 3. Data akademik dev untuk sekolah pertama (MI)
            TahunAjaranSeeder::class,

                // 4. Data master (menggantikan ENUM): status kepegawaian, jenis cuti,
                //    akun kas default, kategori buku, agama, jenjang pendidikan, dll
            MasterDataSeeder::class,

                // 5. Akun testing semua role (hanya untuk development)
            TestingUserSeeder::class,

                // 6. Seed semua jenjang sekolah lainnya (SD, SMP, SMA, SMK, SDLB,
                //    SMPLB, SMALB, SLB, MI, MTs, MA, MAK) — untuk dev & demo multi-tenant
            MultiSchoolSeeder::class,
        ]);
    }
}