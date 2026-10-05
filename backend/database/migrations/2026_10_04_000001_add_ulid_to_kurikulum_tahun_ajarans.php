<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Tambah ULID ke kurikulum_tahun_ajarans (= "implementasi kurikulum").
 *
 * Konvensi Scholara: integer ID tidak boleh keluar lewat API. Struktur kurikulum
 * menempel ke implementasi ini, jadi implementasi butuh public identifier.
 *
 * Pola sama dengan semesters (2026_09_15_000001): kolom nullable + unique,
 * baris lama di-backfill. Insert baru wajib mengisi ulid (lihat KurikulumService).
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'ulid')) {
            Schema::table('kurikulum_tahun_ajarans', function (Blueprint $table) {
                $table->char('ulid', 26)->nullable()->unique('uq_kur_ta_ulid')
                    ->after('id')
                    ->comment('Public identifier — pakai ini di URL, bukan integer id');
            });
        }

        DB::table('kurikulum_tahun_ajarans')->whereNull('ulid')->orderBy('id')->each(function ($row) {
            DB::table('kurikulum_tahun_ajarans')->where('id', $row->id)->update([
                'ulid' => (string) Str::ulid(),
            ]);
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('kurikulum_tahun_ajarans', 'ulid')) {
            Schema::table('kurikulum_tahun_ajarans', function (Blueprint $table) {
                $table->dropUnique('uq_kur_ta_ulid');
                $table->dropColumn('ulid');
            });
        }
    }
};
