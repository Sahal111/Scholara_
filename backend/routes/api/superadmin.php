<?php

use App\Http\Controllers\MasterData\KurikulumStrukturController;
use App\Http\Controllers\MasterData\KurikulumWorkflowController;
use App\Http\Controllers\SuperAdmin\SekolahController;
use App\Http\Controllers\SuperAdmin\KurikulumPlatformController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->prefix('superadmin')
    ->group(function () {

        Route::get('/sekolah', [SekolahController::class, 'index']);

        // Kurikulum platform (school_id NULL) — CRUD penuh, tanpa konteks sekolah
        Route::get('/kurikulum-platform', [KurikulumPlatformController::class, 'index']);
        Route::post('/kurikulum-platform', [KurikulumPlatformController::class, 'store']);
        Route::put('/kurikulum-platform/{ulid}', [KurikulumPlatformController::class, 'update']);
        Route::patch('/kurikulum-platform/{ulid}/deactivate', [KurikulumPlatformController::class, 'deactivate']);
        Route::patch('/kurikulum-platform/{ulid}/activate', [KurikulumPlatformController::class, 'activate']);
        Route::delete('/kurikulum-platform/{ulid}', [KurikulumPlatformController::class, 'destroy']);
        
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