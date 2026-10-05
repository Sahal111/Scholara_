<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        \App\Providers\AppServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
        ]);

        // Middleware yang dijalankan di semua API request — urutan penting:
        // 1. CORS dulu supaya preflight request langsung dihandle
        // 2. TenantMiddleware set school_id sebelum auth dan query apapun
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\InjectTokenFromCookie::class,
            \App\Http\Middleware\TenantMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        // Pelanggaran aturan bisnis dari Service (mis. KurikulumService) → 422, bukan 500.
        // Pesan exception sengaja ditampilkan: ditulis untuk pengguna (Bahasa Indonesia).
        $exceptions->dontReport(\DomainException::class);
        $exceptions->render(function (\DomainException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code' => 'DOMAIN_ERROR',
                    'message' => $e->getMessage(),
                ], 422);
            }
        });

        // Validation error → 422
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Data yang dikirim tidak valid.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // Model not found → 404
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code' => 'NOT_FOUND',
                    'message' => 'Data tidak ditemukan.',
                ], 404);
            }
        });

        // Route not found → 404
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code' => 'NOT_FOUND',
                    'message' => 'Endpoint tidak ditemukan.',
                ], 404);
            }
        });

        // Unauthenticated → 401
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Sesi kamu sudah berakhir. Silakan login kembali.',
                ], 401);
            }
        });

        // Forbidden → 403
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code' => 'FORBIDDEN',
                    'message' => 'Kamu tidak memiliki izin untuk melakukan tindakan ini.',
                ], 403);
            }
        });

        // Rate limit → 429
        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code' => 'TOO_MANY_REQUESTS',
                    'message' => 'Terlalu banyak percobaan. Coba lagi dalam beberapa saat.',
                    'retry_after' => $e->getHeaders()['Retry-After'] ?? 60,
                ], 429);
            }
        });

    })->create();