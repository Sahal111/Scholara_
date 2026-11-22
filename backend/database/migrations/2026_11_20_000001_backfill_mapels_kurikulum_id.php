<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Sinkronkan mapels.kurikulum_id dengan kolom legacy mapels.kurikulum
 * untuk mapel yang dibuat/diubah setelah migrasi 2026_09_03_000002
 * (saat itu MapelService belum mengisi kurikulum_id).
 * 'Keduanya' sengaja dibiarkan NULL (= berlaku semua kurikulum).
 */
return new class extends Migration {
    public function up(): void
    {
        $platform = fn(string $kode) => DB::table('kurikulums')
            ->whereNull('school_id')
            ->whereNull('deleted_at')
            ->where('kode', $kode)
            ->value('id');

        $k13Id = $platform('K13');
        $merdekaId = $platform('MERDEKA');

        if ($k13Id) {
            DB::table('mapels')->whereNull('kurikulum_id')
                ->whereIn('kurikulum', ['K13', 'Kurikulum 2013'])
                ->update(['kurikulum_id' => $k13Id]);
        }

        if ($merdekaId) {
            DB::table('mapels')->whereNull('kurikulum_id')
                ->whereIn('kurikulum', ['Merdeka', 'Kurikulum Merdeka'])
                ->update(['kurikulum_id' => $merdekaId]);
        }
    }

    public function down(): void
    {
        // Tidak ada rollback: hasil sinkronisasi tak bisa dibedakan dari data asli.
    }
};