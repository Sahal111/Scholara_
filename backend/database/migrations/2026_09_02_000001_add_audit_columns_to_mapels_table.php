<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambahkan audit columns ke tabel mapels.
 *
 * Sesuai standar docs/03-database-standard.md:
 *   Semua tabel master wajib punya created_by, updated_by, deleted_by.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('mapels', function (Blueprint $table) {
            if (!Schema::hasColumn('mapels', 'created_by')) {
                $table->unsignedBigInteger('created_by')
                    ->nullable()
                    ->after('urutan_rapor')
                    ->comment('FK ke users.id — siapa yang membuat record ini');
            }

            if (!Schema::hasColumn('mapels', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')
                    ->nullable()
                    ->after('created_by')
                    ->comment('FK ke users.id — siapa yang terakhir mengubah');
            }

            if (!Schema::hasColumn('mapels', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')
                    ->nullable()
                    ->after('updated_by')
                    ->comment('FK ke users.id — siapa yang menghapus (soft delete)');
            }
        });
    }

    public function down(): void
    {
        Schema::table('mapels', function (Blueprint $table) {
            $cols = ['created_by', 'updated_by', 'deleted_by'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('mapels', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};