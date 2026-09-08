<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom bidang ke tabel user_roles.
 *
 * Konteks:
 * - Role 'wakasek' di sistem ini bersifat generik (Wakil Kepala Sekolah).
 * - Di realita sekolah, wakasek punya 4 bidang: Kurikulum, Kesiswaan, Sarpras, Humas.
 * - Kolom ini disimpan di user_roles (bukan users), karena:
 *   → 1 guru bisa punya role berbeda di sekolah berbeda (multi-tenant SaaS).
 *   → Bidang adalah atribut dari assignment role, bukan dari user-nya sendiri.
 * - Role lain (guru, kepsek, dll.) biarkan NULL — kolom ini hanya relevan untuk wakasek.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            $table->string('bidang', 30)
                ->nullable()
                ->after('role_id')
                ->comment('Khusus role wakasek: Kurikulum|Kesiswaan|Sarpras|Humas. NULL untuk role lain.');
        });
    }

    public function down(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropColumn('bidang');
        });
    }
};