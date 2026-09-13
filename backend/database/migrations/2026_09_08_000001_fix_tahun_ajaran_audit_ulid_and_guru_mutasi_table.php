<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        // ── 1. ULID untuk tahun_ajarans ──────────────────────────────────────
        if (Schema::hasTable('tahun_ajarans') && !Schema::hasColumn('tahun_ajarans', 'ulid')) {
            Schema::table('tahun_ajarans', function (Blueprint $table) {
                $table->char('ulid', 26)->nullable()->unique('uq_tahun_ajarans_ulid')
                    ->after('id')
                    ->comment('Public identifier — pakai ini di URL, bukan integer id');
            });

            // Isi ulid untuk baris yang sudah ada
            \DB::table('tahun_ajarans')->whereNull('ulid')->orderBy('id')->each(function ($row) {
                \DB::table('tahun_ajarans')->where('id', $row->id)->update([
                    'ulid' => Str::ulid(),
                ]);
            });
        }

        // ── 2. Audit fields untuk tahun_ajarans ──────────────────────────────
        Schema::table('tahun_ajarans', function (Blueprint $table) {
            if (!Schema::hasColumn('tahun_ajarans', 'created_by')) {
                $table->foreignId('created_by')->nullable()
                    ->after('is_archived')
                    ->constrained('users')->nullOnDelete()
                    ->comment('User yang membuat record ini');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()
                    ->after('created_by')
                    ->constrained('users')->nullOnDelete()
                    ->comment('User yang terakhir mengubah record ini');
            }
            if (!Schema::hasColumn('tahun_ajarans', 'deleted_by')) {
                $table->foreignId('deleted_by')->nullable()
                    ->after('updated_by')
                    ->constrained('users')->nullOnDelete()
                    ->comment('User yang melakukan soft delete');
            }
        });

        // ── 3. Audit fields untuk semesters ──────────────────────────────────
        Schema::table('semesters', function (Blueprint $table) {
            if (!Schema::hasColumn('semesters', 'created_by')) {
                $table->foreignId('created_by')->nullable()
                    ->after('is_active')
                    ->constrained('users')->nullOnDelete()
                    ->comment('User yang membuat record ini');
            }
            if (!Schema::hasColumn('semesters', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()
                    ->after('created_by')
                    ->constrained('users')->nullOnDelete()
                    ->comment('User yang terakhir mengubah record ini');
            }
            if (!Schema::hasColumn('semesters', 'deleted_by')) {
                $table->foreignId('deleted_by')->nullable()
                    ->after('updated_by')
                    ->constrained('users')->nullOnDelete()
                    ->comment('User yang melakukan soft delete');
            }
        });

        // ── 4. Rename guru_mutasi → guru_mutasis (standar plural) ────────────
        if (Schema::hasTable('guru_mutasi') && !Schema::hasTable('guru_mutasis')) {
            Schema::rename('guru_mutasi', 'guru_mutasis');
        }
    }

    public function down(): void
    {
        // Rename balik guru_mutasis → guru_mutasi
        if (Schema::hasTable('guru_mutasis') && !Schema::hasTable('guru_mutasi')) {
            Schema::rename('guru_mutasis', 'guru_mutasi');
        }

        // Hapus audit fields semesters
        Schema::table('semesters', function (Blueprint $table) {
            $cols = ['deleted_by', 'updated_by', 'created_by'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('semesters', $col)) {
                    $table->dropForeign([$col]);
                    $table->dropColumn($col);
                }
            }
        });

        // Hapus audit fields tahun_ajarans
        Schema::table('tahun_ajarans', function (Blueprint $table) {
            $cols = ['deleted_by', 'updated_by', 'created_by'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('tahun_ajarans', $col)) {
                    $table->dropForeign([$col]);
                    $table->dropColumn($col);
                }
            }
        });

        // Hapus ulid dari tahun_ajarans
        if (Schema::hasColumn('tahun_ajarans', 'ulid')) {
            Schema::table('tahun_ajarans', function (Blueprint $table) {
                $table->dropUnique('uq_tahun_ajarans_ulid');
                $table->dropColumn('ulid');
            });
        }
    }
};