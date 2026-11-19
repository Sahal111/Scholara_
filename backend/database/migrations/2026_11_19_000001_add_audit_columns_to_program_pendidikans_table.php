<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambahkan audit columns ke program_pendidikans (GAP-16 / DB-02).
 * Mengikuti pola 2026_09_02_000001_add_audit_columns_to_mapels_table.
 * Kolom nullable, jadi baris lama aman (tidak perlu backfill).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('program_pendidikans', function (Blueprint $table) {
            if (!Schema::hasColumn('program_pendidikans', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('is_active')
                    ->comment('FK ke users.id — pembuat record');
            }
            if (!Schema::hasColumn('program_pendidikans', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable()->after('created_by')
                    ->comment('FK ke users.id — pengubah terakhir');
            }
            if (!Schema::hasColumn('program_pendidikans', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('updated_by')
                    ->comment('FK ke users.id — penghapus (soft delete)');
            }
        });
    }

    public function down(): void
    {
        Schema::table('program_pendidikans', function (Blueprint $table) {
            foreach (['created_by', 'updated_by', 'deleted_by'] as $col) {
                if (Schema::hasColumn('program_pendidikans', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};