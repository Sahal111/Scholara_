<?php

use App\Enums\StatusImplementasiKurikulum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Workflow status untuk implementasi kurikulum (kurikulum_tahun_ajarans).
 *
 *   + status         VARCHAR(20) default 'draft'
 *   + reviewed_by/at   Wakasek yang mengajukan review
 *   + approved_by/at   Kepsek yang menyetujui
 *   + activated_at     waktu diaktifkan
 *   + completed_at     waktu diselesaikan
 *   + catatan_review   catatan Kepsek saat approve / reject
 *
 * Baris yang sudah ada ikut menjadi 'draft' (default kolom): belum ada struktur
 * yang pernah disetujui siapa pun, jadi 'draft' adalah status yang jujur.
 *
 * `is_active` TIDAK disentuh. Ia tetap berarti "dinonaktifkan manual" dan masih
 * dipakai alur lama (dropdown kelas, daftarkan). Status workflow saat ini hanya
 * mengatur penguncian STRUKTUR; belum memblokir pembuatan kelas.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('kurikulum_tahun_ajarans', function (Blueprint $table) {
            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'status')) {
                $table->string('status', 20)
                    ->default(StatusImplementasiKurikulum::DRAFT->value)
                    ->after('is_active')
                    ->comment('Workflow: draft|under_review|approved|active|completed');
                $table->index('status', 'idx_kur_ta_status');
            }

            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()->after('status')
                    ->constrained('users')->nullOnDelete()
                    ->comment('Wakasek yang mengajukan review');
            }

            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }

            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('reviewed_at')
                    ->constrained('users')->nullOnDelete()
                    ->comment('Kepsek yang menyetujui');
            }

            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }

            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'activated_at')) {
                $table->timestamp('activated_at')->nullable()->after('approved_at');
            }

            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('activated_at');
            }

            if (!Schema::hasColumn('kurikulum_tahun_ajarans', 'catatan_review')) {
                $table->text('catatan_review')->nullable()->after('completed_at')
                    ->comment('Catatan Kepsek saat approve / reject');
            }
        });
    }

    public function down(): void
    {
        Schema::table('kurikulum_tahun_ajarans', function (Blueprint $table) {
            foreach (['reviewed_by', 'approved_by'] as $col) {
                if (Schema::hasColumn('kurikulum_tahun_ajarans', $col)) {
                    $table->dropForeign([$col]);
                }
            }

            if (Schema::hasColumn('kurikulum_tahun_ajarans', 'status')) {
                $table->dropIndex('idx_kur_ta_status');
            }
        });

        Schema::table('kurikulum_tahun_ajarans', function (Blueprint $table) {
            $drop = array_values(array_filter([
                'catatan_review', 'completed_at', 'activated_at', 'approved_at',
                'approved_by', 'reviewed_at', 'reviewed_by', 'status',
            ], fn ($c) => Schema::hasColumn('kurikulum_tahun_ajarans', $c)));

            if ($drop) {
                $table->dropColumn($drop);
            }
        });
    }
};
