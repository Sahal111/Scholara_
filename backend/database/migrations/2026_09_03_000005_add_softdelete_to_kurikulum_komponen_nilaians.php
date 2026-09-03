<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah soft delete dan audit field ke tabel kurikulum_komponen_nilaians.
 *
 * Alasan: komponen nilai yang sudah pernah direferensikan di modul penilaian
 * (fase berikutnya) tidak boleh di-hard delete — histori nilai harus tetap valid.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('kurikulum_komponen_nilaians', function (Blueprint $table) {
            $table->foreignId('created_by')
                ->nullable()
                ->after('is_active')
                ->constrained('users')
                ->nullOnDelete();

            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('kurikulum_komponen_nilaians', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
            $table->dropSoftDeletes();
        });
    }
};