<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('mapels', function (Blueprint $table) {
            // Soft delete wajib di semua master table (PROJECT_CONTEXT §9)
            // Ditambahkan setelah timestamps() — urutan kolom tidak mempengaruhi fungsi
            $table->softDeletes()->after('urutan_rapor');
        });
    }

    public function down(): void
    {
        Schema::table('mapels', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};