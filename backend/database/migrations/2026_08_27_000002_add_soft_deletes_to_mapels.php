<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('mapels', 'deleted_at')) {
            Schema::table('mapels', function (Blueprint $table) {
                $table->softDeletes()->after('urutan_rapor');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('mapels', 'deleted_at')) {
            Schema::table('mapels', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};