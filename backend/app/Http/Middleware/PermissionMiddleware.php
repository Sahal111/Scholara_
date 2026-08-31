<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cek apakah user punya permission yang dibutuhkan route.
 *
 * Pemakaian di routes:
 *
 *   // User harus punya SALAH SATU dari permission ini
 *   ->middleware('permission:master_data.guru.view')
 *   ->middleware('permission:dms.view_own,dms.view_all')
 *
 * Ini menggantikan RoleMiddleware secara bertahap.
 * RoleMiddleware tetap ada untuk route lama yang belum dimigrasikan.
 */
class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'code' => 'UNAUTHENTICATED',
                'message' => 'Kamu belum login. Silakan login terlebih dahulu.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'code' => 'ACCOUNT_INACTIVE',
                'message' => 'Akun kamu belum aktif. Hubungi operator sekolah.',
            ], 403);
        }

        // User harus punya SALAH SATU dari permission yang disebutkan.
        // super_admin bypass semua permission check — akses penuh ke semua tenant route.
        if (!$user->relationLoaded('roles') || !$user->roles->first()?->relationLoaded('permissions')) {
            $user->load([
                'roles' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class),
                'roles.permissions' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class),
            ]);
        }

        if ($user->hasRole('super_admin')) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'code' => 'FORBIDDEN',
            'message' => 'Kamu tidak memiliki izin untuk melakukan tindakan ini.',
        ], 403);
    }
}