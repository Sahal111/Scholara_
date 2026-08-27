<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // uq_mapels_school_kode (school_id, kode) sudah ada di DB.
        // Migration ini hanya memastikan uq_mapels_kode (global) tidak ada.
        Schema::table('mapels', function (Blueprint $table) {
            $indexes = collect(\DB::select("SHOW INDEX FROM mapels"))
                ->pluck('Key_name')
                ->unique();

            if ($indexes->contains('uq_mapels_kode')) {
                $table->dropUnique('uq_mapels_kode');
            }

            if (!$indexes->contains('uq_mapels_school_kode')) {
                $table->unique(['school_id', 'kode'], 'uq_mapels_school_kode');
            }
        });
    }

    public function down(): void
    {
        Schema::table('mapels', function (Blueprint $table) {
            $indexes = collect(\DB::select("SHOW INDEX FROM mapels"))
                ->pluck('Key_name')
                ->unique();

            if ($indexes->contains('uq_mapels_school_kode')) {
                $table->dropUnique('uq_mapels_school_kode');
            }

            if (!$indexes->contains('uq_mapels_kode')) {
                $table->unique('kode', 'uq_mapels_kode');
            }
        });
    }
};