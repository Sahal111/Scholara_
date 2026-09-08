<?php

namespace App\Http\Controllers\Wakasek;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wakasek\UpdateProfilWakasekRequest;
use App\Models\Guru;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class WakasekController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // GET /wakasek/profil
    // ─────────────────────────────────────────────────────────────────────────
    // Data profil diambil dari relasi user->guru (via guru.user_id).
    // bidang_wakasek disimpan di pivot user_roles.bidang khusus role wakasek.
    // ─────────────────────────────────────────────────────────────────────────
    public function profil(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'guru',
            'roles' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class),
        ]);

        $guru = $user->guru;

        // Ambil bidang dari pivot user_roles untuk role wakasek
        $wakasekRole = $user->roles->firstWhere('slug', 'wakasek');
        $bidangWakasek = $wakasekRole?->pivot?->bidang ?? null;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'ulid' => $user->ulid,
                    'username' => $user->username,
                    'email' => $user->email,
                    'nama' => $user->name,
                    'no_hp' => $guru?->no_hp,
                    'foto' => $user->foto,
                    'bidang_wakasek' => $bidangWakasek,
                ],
                'guru' => $guru ? [
                    'nuptk' => $guru->nuptk,
                    'nip' => $guru->nip,
                    'nik' => $guru->nik,
                    'jenis_ptk' => $guru->jenis_ptk,
                    'status_kepegawaian' => $guru->status_kepegawaian,
                    'golongan' => $guru->golongan,
                    'tmt_golongan' => $guru->tmt_golongan,
                    'jenis_kelamin' => $guru->jenis_kelamin,
                    'agama' => $guru->agama,
                    'status_perkawinan' => $guru->status_perkawinan,
                    'tempat_lahir' => $guru->tempat_lahir,
                    'tanggal_lahir' => $guru->tanggal_lahir,
                    'alamat_jalan' => $guru->alamat_jalan,
                    'rt' => $guru->rt,
                    'rw' => $guru->rw,
                    'desa' => $guru->desa,
                    'kecamatan' => $guru->kecamatan,
                    'kabupaten' => $guru->kabupaten,
                    'provinsi' => $guru->provinsi,
                    'kode_pos' => $guru->kode_pos,
                    'is_active' => $guru->is_active,
                ] : null,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /wakasek/profil/update
    // ─────────────────────────────────────────────────────────────────────────
    public function updateProfil(UpdateProfilWakasekRequest $request): JsonResponse
    {
        $user = User::find($request->user()->id);

        // ── Ganti password ────────────────────────────────────────────────
        if ($request->filled('password_baru')) {
            if (!$request->filled('password_lama')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama wajib diisi.',
                ], 400);
            }
            if (!Hash::check($request->password_lama, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama tidak cocok.',
                ], 400);
            }
            $user->password = Hash::make($request->password_baru);
        }

        // ── Update email & no_hp ──────────────────────────────────────────
        if ($request->filled('email')) {
            $user->email = $request->email;
        }

        if ($request->filled('no_hp') && $user->guru) {
            $user->guru->no_hp = $request->no_hp;
            $user->guru->save();
        }

        // ── Update foto ───────────────────────────────────────────────────
        if ($request->hasFile('foto')) {
            if ($user->foto && Storage::disk('public')->exists($user->foto)) {
                Storage::disk('public')->delete($user->foto);
            }
            $path = $request->file('foto')->store('foto-wakasek', 'public');
            $user->foto = $path;
        }

        $user->save();

        // ── Update bidang_wakasek di pivot user_roles ─────────────────────
        if ($request->has('bidang_wakasek')) {
            $user->load([
                'roles' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class),
            ]);

            $wakasekRole = $user->roles->firstWhere('slug', 'wakasek');

            if ($wakasekRole) {
                // Update kolom bidang di pivot table user_roles
                \Illuminate\Support\Facades\DB::table('user_roles')
                    ->where('user_id', $user->id)
                    ->where('role_id', $wakasekRole->id)
                    ->update(['bidang' => $request->bidang_wakasek]);
            }
        }

        // Refresh user untuk response
        $user->refresh()->load([
            'guru',
            'roles' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class),
        ]);

        $wakasekRole = $user->roles->firstWhere('slug', 'wakasek');
        $bidangWakasek = $wakasekRole
            ? \Illuminate\Support\Facades\DB::table('user_roles')
                ->where('user_id', $user->id)
                ->where('role_id', $wakasekRole->id)
                ->value('bidang')
            : null;

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'ulid' => $user->ulid,
                'username' => $user->username,
                'email' => $user->email,
                'nama' => $user->name,
                'no_hp' => $user->guru?->no_hp,
                'foto' => $user->foto,
                'bidang_wakasek' => $bidangWakasek,
            ],
        ]);
    }
}