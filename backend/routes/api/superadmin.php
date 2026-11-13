<?php

use App\Http\Controllers\MasterData\KurikulumStrukturController;
use App\Http\Controllers\MasterData\KurikulumWorkflowController;
use App\Http\Controllers\SuperAdmin\SekolahController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->prefix('superadmin')
    ->group(function () {

        Route::get('/sekolah', [SekolahController::class, 'index']);

        // Pantau kurikulum per sekolah — READ-ONLY, sengaja hanya GET.
        // Urutan middleware penting: role:super_admin (di atas) lalu school.from-route.
        Route::middleware('school.from-route')
            ->prefix('sekolah/{school}/kurikulum')
            ->group(function () {
            Route::get('/implementasi', [KurikulumWorkflowController::class, 'index']);
            Route::get('/implementasi/{ulid}', [KurikulumWorkflowController::class, 'show']);
            Route::get('/implementasi/{implementasiUlid}/struktur', [KurikulumStrukturController::class, 'index']);
        });
    });