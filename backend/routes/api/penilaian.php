<?php

use App\Http\Controllers\Penilaian\NilaiController;
use App\Http\Controllers\Penilaian\RaporController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Penilaian Routes — Guru, Wali Kelas, Kepsek, Operator
|--------------------------------------------------------------------------
|
| Semua route membutuhkan auth:sanctum.
|
| Hierarki akses:
|   - guru, wali_kelas : input nilai & lihat nilai kelas sendiri
|   - kepsek, operator  : lihat & kelola semua nilai dan rapor
|   - waka_kurikulum   : lihat nilai dan rapor (read-only)
|
*/

// ── NILAI ─────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:guru,wali_kelas,kepsek,operator,waka_kurikulum'])
    ->prefix('penilaian')
    ->group(function () {

        // Komponen penilaian aktif (Formatif, Sumatif, PTS, PAS, dsb.)
        Route::get('/komponen', [NilaiController::class, 'komponen']);

        // Plot yang diampu guru yang sedang login (untuk dropdown pilih mapel)
        Route::get('/plot-saya', [NilaiController::class, 'plotSaya']);

        // Nilai per plot (semua siswa di kelas itu untuk satu komponen)
        Route::get('/plot/{plotId}', [NilaiController::class, 'byPlot']);

        // Input nilai satu siswa
        Route::post('/upsert', [NilaiController::class, 'upsert']);

        // Input nilai massal seluruh siswa dalam satu kelas
        Route::post('/upsert-bulk', [NilaiController::class, 'upsertBulk']);

        // Rekap nilai per kelas per semester (untuk wali kelas & kepsek)
        Route::get('/rekap', [NilaiController::class, 'rekap']);

        // Hitung & simpan nilai akhir dari semua komponen
        Route::post('/hitung-akhir', [NilaiController::class, 'hitungNilaiAkhir']);
    });

// ── RAPOR ─────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:wali_kelas,kepsek,operator,waka_kurikulum'])
    ->prefix('rapor')
    ->group(function () {

        // Daftar rapor (dengan filter kelas, semester, siswa, status)
        Route::get('/', [RaporController::class, 'index']);

        // Buat rapor draft untuk seluruh siswa di satu kelas
        Route::post('/buat-per-kelas', [RaporController::class, 'buatPerKelas']);

        // Finalisasi massal seluruh kelas
        Route::post('/finalisasi-massal', [RaporController::class, 'finalisasiMassal']);

        // Detail, update catatan, finalisasi per siswa
        Route::get('/{id}', [RaporController::class, 'show']);
        Route::put('/{id}', [RaporController::class, 'update']);
        Route::post('/{id}/finalisasi', [RaporController::class, 'finalisasi']);
    });

