<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\JsonResponse;

class SekolahController extends Controller
{
    /** GET /api/superadmin/sekolah — daftar sekolah (tanpa ID integer). */
    public function index(): JsonResponse
    {
        $sekolah = School::withoutGlobalScopes()
            ->orderBy('nama')
            ->get(['ulid', 'nama', 'npsn', 'jenjang', 'status']);

        return $this->success($sekolah->toArray());
    }
}