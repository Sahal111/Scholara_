<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterOrtuRequest;
use App\Models\OrangTua;
use App\Models\Role;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        // Resolve school_id dari TenantMiddleware (sudah di-set dari subdomain)
        $currentSchoolId = app()->bound('current_school_id')
            ? app('current_school_id')
            : null;

        $query = User::withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)
            ->with(['roles' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)])
            ->where(function ($q) use ($request) {
                $q->where('username', $request->login)
                    ->orWhere('email', $request->login);
            });

        // Kalau ada school_id dari subdomain → filter ketat per sekolah
        // Kecuali super_admin yang boleh login dari mana saja (school_id = null)
        if ($currentSchoolId) {
            $query->where(function ($q) use ($currentSchoolId) {
                $q->where('school_id', $currentSchoolId)
                    ->orWhereNull('school_id'); // super_admin tidak punya school_id
            });
        }

        $user = $query->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Username/email atau password salah.'],
            ]);
        }

        // Validasi cross-tenant: user dari sekolah lain tidak boleh masuk
        // (error message sengaja sama — anti-enumeration)
        if ($currentSchoolId && $user->school_id && $user->school_id !== $currentSchoolId) {
            throw ValidationException::withMessages([
                'login' => ['Username/email atau password salah.'],
            ]);
        }

        // Kalau tidak ada subdomain, set current_school_id dari user (fallback mobile/localhost)
        if (!$currentSchoolId && $user->school_id) {
            app()->instance('current_school_id', $user->school_id);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun kamu belum aktif. Hubungi operator sekolah.',
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;
        $user->update(['last_login_at' => now()]);

        $profile = $this->getProfile($user);
        $school = $this->getSchoolData($user);

        $cookie = cookie(
            name: 'auth_token',
            value: $token,
            minutes: 60 * 24 * 7,
            path: '/',
            domain: null,
            secure: app()->isProduction(),
            httpOnly: true,
            raw: false,
            sameSite: 'Lax',
        );

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'nama' => $user->name,
                    'role' => $user->getRoleSlug(),
                    'foto' => $user->foto,
                    'profile' => $profile,
                ],
                'school' => $school,
            ],
        ])->withCookie($cookie);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        // TransientToken dipakai saat testing dengan actingAs() — tidak perlu/bisa di-delete
        if (method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ])->withoutCookie('auth_token');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['roles' => fn($q) => $q->withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)]);
        $profile = $this->getProfile($user);
        $school = $this->getSchoolData($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'nama' => $user->name,
                    'role' => $user->getRoleSlug(),
                    'foto' => $user->foto,
                    'last_login' => $user->last_login_at,
                    'profile' => $profile,
                ],
                'school' => $school,
            ],
        ]);
    }

    public function registerOrtu(RegisterOrtuRequest $request)
    {

        $pengaturan = \App\Models\Pengaturan::where('key', 'kode_registrasi_ortu')->first();
        $kodeValid = $pengaturan ? $pengaturan->value : config('school.kode_registrasi');
        if ($request->kode_sekolah !== $kodeValid) {
            return response()->json([
                'success' => false,
                'message' => 'Kode sekolah tidak valid.',
            ], 422);
        }

        // NISN tersimpan terenkripsi — WHERE nisn = ? tidak akan match ciphertext.
        // Sementara gunakan kode_anak (plain text, dibagikan ke calon ortu oleh operator).
        // @TODO: Implementasikan nisn_hash (SHA256 NISN) sebagai kolom terindeks
        //        untuk lookup yang aman dan efisien.
        $siswa = \App\Models\Siswa::where('kode_anak', $request->kode_anak)->first();
        if (!$siswa) {
            return response()->json([
                'success' => false,
                'message' => 'Kode anak tidak ditemukan.',
            ], 422);
        }

        // school_id wajib ada — sudah di-set oleh TenantMiddleware dari subdomain
        // atau dari Siswa yang ditemukan
        $schoolId = app()->bound('current_school_id')
            ? app('current_school_id')
            : $siswa->school_id;

        if (!$schoolId) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menentukan sekolah. Akses melalui subdomain sekolah Anda.',
            ], 422);
        }

        DB::transaction(function () use ($request, $siswa, $schoolId) {
            // Buat user dengan school_id agar ter-isolasi ke tenant yang benar
            $user = User::withoutGlobalScopes()->create([
                'school_id' => $schoolId,
                'name' => $request->nama_lengkap,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => 0,
            ]);

            // Assign role ortu via Eloquent — cari role di sekolah yang sama
            $role = Role::withoutGlobalScopes()
                ->where('slug', 'ortu')
                ->where('school_id', $schoolId)
                ->firstOrFail();
            $user->roles()->syncWithoutDetaching([$role->id]);

            // Buat record orang_tua dengan school_id
            $ortu = OrangTua::withoutGlobalScopes()->create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'nama' => $request->nama_lengkap,
                'hubungan' => $request->hubungan,
                'no_hp' => $request->no_hp,
            ]);

            // Link ortu ke siswa via Eloquent
            $ortu->siswa()->syncWithoutDetaching([$siswa->id]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil. Akun menunggu persetujuan operator sekolah.',
        ], 201);
    }

    private function getProfile(User $user): mixed
    {
        $slug = $user->getRoleSlug();
        return match ($slug) {
            'operator' => $user->operatorProfile,
            'guru',
            'kepsek',
            'wali_kelas' => $user->guru,
            'ortu' => $user->orangTua()->with('siswa')->get(),
            'bendahara' => $user->bendaharaProfile,
            default => null,
        };
    }

    /**
     * Ambil data profil sekolah yang relevan untuk dikirim ke frontend.
     *
     * Tujuan: frontend bisa melakukan adaptive UI berdasarkan jenis/jenjang
     * sekolah tanpa perlu request tambahan ke /api/sekolah/profil.
     *
     * Catatan: super_admin tidak punya school_id, return null.
     */
    private function getSchoolData(User $user): ?array
    {
        if (!$user->school_id) {
            return null;
        }

        $school = \App\Models\School::find($user->school_id);

        if (!$school) {
            return null;
        }

        return [
            'id' => $school->ulid,
            'nama' => $school->nama,
            'npsn' => $school->npsn,
            'jenis' => $school->jenis,         // 'MI' | 'MTs' | 'MA' | 'SMK' | 'SMA' dll
            'jenjang' => $school->jenjang,     // 'dasar' | 'menengah_pertama' | 'menengah_atas'
            'kurikulum' => $school->kurikulum, // 'Kurikulum Merdeka' | 'K13' | 'Lainnya'
            'subtipe' => $school->subtipe,     // null | 'man_ic' | 'man_pk' | 'man_plus_vokasi'
            'logo' => $school->logo,
        ];
    }
}