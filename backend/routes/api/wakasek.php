<?php

use App\Http\Controllers\Kepsek\KepsekController;
use App\Http\Controllers\PengumumanController;
use App\Http\Controllers\MasterData\TahunAjaranController;
use Illuminate\Support\Facades\Route;

/**
 * Portal Wakasek Kurikulum
 *
 * Wakasek punya akses READ ke data guru, siswa, dan absensi (view-only),
 * plus FULL manage untuk kebijakan akademik (kurikulum, tahun ajaran, dll).
 *
 * Kebijakan akademik (kurikulum, tahun ajaran, mapel, kelas, program)
 * sudah di-handle oleh master-data.php yang sudah di-update untuk
 * include role wakasek.
 *
 * Route di sini: endpoint view-only yang sebelumnya hanya ada di /kepsek/*
 * tapi juga dibutuhkan oleh wakasek untuk fungsi pengawasan.
 */
Route::middleware(['auth:sanctum', 'role:wakasek'])
    ->prefix('wakasek')
    ->group(function () {

        // ── Data Guru — view only (sama dengan kepsek) ──────────────────
        Route::middleware('permission:master_data.guru.view')->group(function () {
            Route::get('/guru', [KepsekController::class, 'daftarGuru']);
            Route::get('/guru/{nuptk}', [KepsekController::class, 'detailGuru']);
        });

        // ── Data Siswa — view only (sama dengan kepsek) ─────────────────
        Route::middleware('permission:master_data.siswa.view')->group(function () {
            Route::get('/siswa', [KepsekController::class, 'daftarSiswa']);
            Route::get('/siswa/{nisn}', [KepsekController::class, 'detailSiswa']);
        });

        // ── Kelas filter — untuk dropdown di halaman absensi ────────────
        Route::middleware('permission:master_data.kelas.view')->group(function () {
            Route::get('/kelas-filter', [KepsekController::class, 'daftarKelasFilter']);
        });

        // ── Monitoring Absensi — rekap semua kelas ──────────────────────
        Route::middleware('permission:absensi.view_all,absensi.rekap')->group(function () {
            Route::get('/rekap', [KepsekController::class, 'rekapSemuaKelas']);
            Route::get('/siswa-alpa', [KepsekController::class, 'siswaAlpaTerbanyak']);
        });

        // ── Pengumuman — wakasek bisa CRUD pengumuman ───────────────────
        Route::middleware('permission:pengumuman.view')->group(function () {
            Route::get('/pengumuman', [PengumumanController::class, 'index']);
        });
        Route::middleware('permission:pengumuman.create')->group(function () {
            Route::post('/pengumuman', [PengumumanController::class, 'store']);
        });
        Route::middleware('permission:pengumuman.update')->group(function () {
            Route::put('/pengumuman/{id}', [PengumumanController::class, 'update']);
        });
        Route::middleware('permission:pengumuman.delete')->group(function () {
            Route::delete('/pengumuman/{id}', [PengumumanController::class, 'destroy']);
        });

        // ── Profil wakasek sendiri ───────────────────────────────────────
        Route::get('/profil', [KepsekController::class, 'profil']);
        Route::post('/profil/update', [KepsekController::class, 'updateProfil']);
    });