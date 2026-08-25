<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tahun_ajarans', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)
                ->after('is_active')
                ->comment('1 = Diarsipkan (periode selesai, historical). Berbeda dengan soft delete.');
            $table->timestamp('archived_at')->nullable()
                ->after('is_archived')
                ->comment('Waktu data diarsipkan');

            $table->index('is_archived', 'idx_ta_is_archived');
        });
    }

    public function down(): void
    {
        Schema::table('tahun_ajarans', function (Blueprint $table) {
            $table->dropIndex('idx_ta_is_archived');
            $table->dropColumn(['is_archived', 'archived_at']);
        });
    }
};