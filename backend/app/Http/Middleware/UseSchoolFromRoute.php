<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Untuk route /superadmin/sekolah/{school}/...
 * Set tenant ke sekolah di URL supaya controller tenant bisa dipakai ulang.
 * WAJIB dipasang SETELAH role:super_admin.
 */
class UseSchoolFromRoute
{
    public function handle(Request $request, Closure $next): Response
    {
        $school = School::withoutGlobalScopes()
            ->where('ulid', $request->route('school'))
            ->first();

        if (!$school) {
            return response()->json([
                'success' => false,
                'code' => 'SCHOOL_NOT_FOUND',
                'message' => 'Sekolah tidak ditemukan.',
            ], 404);
        }

        app()->instance('current_school_id', $school->id);

        // Buang param {school} supaya argumen controller ($ulid) tidak bergeser.
        $request->route()->forgetParameter('school');

        return $next($request);
    }
}