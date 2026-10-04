<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill data kurikulum untuk kelas yang SUDAH ADA.
 *
 * Latar belakang: StoreKelasRequest/MasterDataKelasController hanya menulis kolom
 * legacy `kelas.kurikulum`, sehingga `kelas.kurikulum_id` NULL untuk kelas yang
 * dibuat setelah migration 2026_09_03_000002. Tabel kurikulum_tahun_ajarans juga kosong.
 *
 * Langkah:
 *   1. kelas.kurikulum_id ← mapping dari enum legacy
 *        K13                → kurikulum platform K13
 *        Merdeka / Keduanya → kurikulum platform default (Merdeka)
 *   2. Auto-registrasi ke kurikulum_tahun_ajarans untuk setiap kombinasi
 *      (sekolah, kurikulum, tahun ajaran) yang dipakai kelas aktif (tidak soft-deleted).
 *        - Hanya SATU kurikulum dipakai di TA tsb → tingkat_kelas = NULL (semua tingkat)
 *        - Lebih dari satu (masa transisi)         → tingkat_kelas = daftar tingkat yang dipakai
 *      Registrasi yang sudah ada TIDAK diubah (idempotent).
 *
 * down(): hanya menghapus baris registrasi hasil auto-backfill (ditandai catatan).
 *         kelas.kurikulum_id TIDAK dikembalikan ke NULL (tidak berbahaya).
 */
return new class extends Migration {
    private const CATATAN = 'Auto-registrasi dari data kelas yang sudah ada (backfill 2026-10-03)';

    public function up(): void
    {
        $platform = DB::table('kurikulums')
            ->whereNull('school_id')
            ->whereNull('deleted_at')
            ->get(['id', 'kode', 'is_platform_default']);

        $k13 = $platform->firstWhere('kode', 'K13')?->id;
        $default = $platform->firstWhere('kode', 'MERDEKA')?->id
            ?? $platform->firstWhere('is_platform_default', 1)?->id;

        if (!$default) {
            return; // kurikulum platform belum ter-seed → tidak ada yang bisa di-backfill
        }

        DB::transaction(function () use ($k13, $default) {
            // ── 1. kelas.kurikulum_id ───────────────────────────────────────
            if ($k13) {
                DB::table('kelas')
                    ->whereNull('kurikulum_id')
                    ->where('kurikulum', 'K13')
                    ->update(['kurikulum_id' => $k13]);
            }

            DB::table('kelas')
                ->whereNull('kurikulum_id')
                ->update(['kurikulum_id' => $default]);

            // ── 2. Auto-registrasi implementasi ─────────────────────────────
            $rows = DB::table('kelas')
                ->whereNull('deleted_at')
                ->whereNotNull('school_id')
                ->whereNotNull('kurikulum_id')
                ->whereNotNull('tahun_ajaran_id')
                ->select('school_id', 'kurikulum_id', 'tahun_ajaran_id', 'tingkat')
                ->distinct()
                ->get();

            // Kelompokkan per (sekolah, tahun ajaran) → kurikulum → daftar tingkat
            $perTa = [];
            foreach ($rows as $r) {
                $perTa["{$r->school_id}|{$r->tahun_ajaran_id}"][$r->kurikulum_id][] = (int) $r->tingkat;
            }

            $now = now();

            foreach ($perTa as $key => $perKurikulum) {
                [$schoolId, $tahunAjaranId] = array_map('intval', explode('|', $key));
                $transisi = count($perKurikulum) > 1;

                foreach ($perKurikulum as $kurikulumId => $tingkatList) {
                    $sudahAda = DB::table('kurikulum_tahun_ajarans')
                        ->where('school_id', $schoolId)
                        ->where('kurikulum_id', $kurikulumId)
                        ->where('tahun_ajaran_id', $tahunAjaranId)
                        ->exists();

                    if ($sudahAda) {
                        continue;
                    }

                    $tingkat = array_values(array_unique($tingkatList));
                    sort($tingkat);

                    DB::table('kurikulum_tahun_ajarans')->insert([
                        'school_id' => $schoolId,
                        'kurikulum_id' => (int) $kurikulumId,
                        'tahun_ajaran_id' => $tahunAjaranId,
                        'semester_id' => null,
                        'tingkat_kelas' => $transisi ? json_encode($tingkat) : null,
                        'is_active' => true,
                        'catatan' => self::CATATAN,
                        'created_by' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        });
    }

    public function down(): void
    {
        DB::table('kurikulum_tahun_ajarans')
            ->where('catatan', self::CATATAN)
            ->delete();
    }
};
