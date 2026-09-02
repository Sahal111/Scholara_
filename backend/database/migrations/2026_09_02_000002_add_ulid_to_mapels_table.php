<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom ulid
        Schema::table('mapels', function (Blueprint $table) {
            $table->char('ulid', 26)->nullable()->after('id');
        });

        // 2. Generate ulid untuk semua data existing
        DB::table('mapels')->whereNull('ulid')->orderBy('id')->each(function ($row) {
            DB::table('mapels')->where('id', $row->id)->update([
                'ulid' => (string) Str::ulid(),
            ]);
        });

        // 3. Set NOT NULL + UNIQUE constraint
        Schema::table('mapels', function (Blueprint $table) {
            $table->char('ulid', 26)->nullable(false)->unique()->change();
        });
    }

    public function down(): void
    {
        Schema::table('mapels', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });
    }
};
