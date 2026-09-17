<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\AttachAnakOrtuRequest;
use App\Http\Requests\Operator\CreateBendaharaUserRequest;
use App\Http\Requests\Operator\CreateGuruUserRequest;
use App\Http\Requests\Operator\CreateOrtuUserRequest;
use App\Http\Requests\Operator\CreateUserRequest;
use App\Http\Requests\Operator\CreateWaliKelasUserRequest;
use App\Http\Requests\Operator\ResetPasswordRequest;
use App\Http\Requests\Operator\UpdateKodeRegistrasiRequest;
use App\Http\Requests\Operator\UpdateOrtuRequest;
use App\Models\Role;
use App\Models\User;
use App\Models\UserBendahara;
use App\Models\UserWaliKelas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class OperatorController extends Controller
{
    // Helper: assign role ke user — insert ke pivot user_roles dengan school_id
    private function assignRole(int $userId, string $slug): void
    {
        $user = User::findOrFail($userId);
        $role = Role::where('school_id', $user->school_id)->where('slug', $slug)->firstOrFail();

        DB::table('user_roles')->insertOrIgnore([
            'user_id' => $userId,
            'role_id' => $role->id,
            'school_id' => $user->school_id,
            'created_at' => now(),
        ]);
    }

    // -------------------------------------------------------
    // PENGATURAN KODE REGISTRASI ORTU
    // -------------------------------------------------------
    public function getKodeRegistrasi()
    {
        $pengaturan = \App\Models\Pengaturan::where('key', 'kode_registrasi_ortu')->first();
        return response()->json([
            'success' => true,
            'data' => ['kode_registrasi' => $pengaturan?->value ?? ''],
        ]);
    }

    public function updateKodeRegistrasi(UpdateKodeRegistrasiRequest $request)
    {
        \App\Models\Pengaturan::updateOrCreate(
            ['key' => 'kode_registrasi_ortu'],
            ['value' => $request->kode_registrasi]
        );

        return response()->json([
            'success' => true,
            'message' => 'Kode registrasi berhasil diperbarui.',
        ]);
    }

    // -------------------------------------------------------
    // LIST SEMUA USER
    // -------------------------------------------------------
    public function index(Request $request)
    {
        $query = User::with('roles')
            ->when($request->role, function ($q) use ($request) {
                $q->whereHas('roles', fn($r) => $r->where('slug', $request->role));
            })
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('username', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            })
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $query]);
    }

    // -------------------------------------------------------
    // BUAT AKUN OPERATOR
    // -------------------------------------------------------
    public function createOperator(CreateUserRequest $request)
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->nama,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => 1,
            ]);
            $this->assignRole($user->id, 'operator');
            \App\Models\OperatorProfile::create(['user_id' => $user->id]);
            return $user->load('roles', 'operatorProfile');
        });

        return response()->json(['success' => true, 'message' => 'Akun operator berhasil dibuat.', 'data' => $user], 201);
    }

    // -------------------------------------------------------
    // BUAT AKUN GURU
    // -------------------------------------------------------
    public function createGuru(CreateGuruUserRequest $request)
    {
        $sudahAda = \App\Models\Guru::where('nuptk', $request->nuptk)->whereNotNull('user_id')->exists();
        if ($sudahAda) {
            return response()->json(['success' => false, 'message' => 'NUPTK ini sudah terdaftar akun guru.'], 422);
        }

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->nama,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => 1,
            ]);
            $this->assignRole($user->id, 'guru');
            \App\Models\Guru::where('nuptk', $request->nuptk)->update(['user_id' => $user->id]);
            return $user->load('roles', 'guru');
        });

        return response()->json(['success' => true, 'message' => 'Akun guru berhasil dibuat.', 'data' => $user], 201);
    }

    // -------------------------------------------------------
    // BUAT AKUN KEPSEK
    // -------------------------------------------------------
    public function createKepsek(CreateGuruUserRequest $request)
    {
        $sudahAda = \App\Models\Guru::where('nuptk', $request->nuptk)->whereNotNull('user_id')->exists();
        if ($sudahAda) {
            return response()->json(['success' => false, 'message' => 'NUPTK ini sudah terdaftar akun kepsek.'], 422);
        }

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->nama,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => 1,
            ]);
            $this->assignRole($user->id, 'kepsek');
            \App\Models\Guru::where('nuptk', $request->nuptk)->update(['user_id' => $user->id]);
            return $user->load('roles', 'guru');
        });

        return response()->json(['success' => true, 'message' => 'Akun kepala sekolah berhasil dibuat.', 'data' => $user], 201);
    }

    // -------------------------------------------------------
    // BUAT AKUN ORTU
    // -------------------------------------------------------
    public function createOrtu(CreateOrtuUserRequest $request)
    {
        $siswa = \App\Models\Siswa::where('nisn', $request->nisn)->firstOrFail();

        $user = DB::transaction(function () use ($request, $siswa) {
            $user = User::create([
                'name' => $request->nama,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => 1,
            ]);
            $this->assignRole($user->id, 'ortu');

            $ortu = \App\Models\OrangTua::create([
                'user_id' => $user->id,
                'nama' => $request->nama,
                'hubungan' => $request->hubungan,
                'no_hp' => $request->no_hp,
            ]);

            $ortu->siswa()->syncWithoutDetaching([$siswa->id]);

            return $user->load('roles', 'orangTua.siswa');
        });

        return response()->json(['success' => true, 'message' => 'Akun orang tua berhasil dibuat.', 'data' => $user], 201);
    }

    // -------------------------------------------------------
    // BUAT AKUN BENDAHARA
    // -------------------------------------------------------
    public function createBendahara(CreateBendaharaUserRequest $request)
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->nama,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => 1,
            ]);
            $this->assignRole($user->id, 'bendahara');

            UserBendahara::create([
                'user_id' => $user->id,
                'jabatan' => $request->jabatan ?? 'Bendahara Sekolah',
                'no_sk' => $request->no_sk,
                'tmt_jabatan' => $request->tmt_jabatan,
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Akun bendahara berhasil dibuat.'], 201);
    }

    // -------------------------------------------------------
    // BUAT AKUN WALI KELAS
    // -------------------------------------------------------
    public function createWaliKelas(CreateWaliKelasUserRequest $request)
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->nama,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => 1,
            ]);
            $this->assignRole($user->id, 'wali_kelas');
            \App\Models\Guru::where('nuptk', $request->nuptk)->update(['user_id' => $user->id]);
        });

        return response()->json(['success' => true, 'message' => 'Akun wali kelas berhasil dibuat.'], 201);
    }

    // -------------------------------------------------------
    // TOGGLE AKTIF USER
    // -------------------------------------------------------
    public function toggleActive(Request $request, $id)
    {
        $user = User::findOrFail($id);
        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Tidak bisa menonaktifkan akun sendiri.'], 422);
        }
        $user->update(['is_active' => !$user->is_active]);
        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.',
            'data' => ['is_active' => $user->is_active],
        ]);
    }

    // -------------------------------------------------------
    // APPROVE ORTU
    // -------------------------------------------------------
    public function approveOrtu(Request $request, $id)
    {
        $user = User::whereHas('roles', fn($q) => $q->where('slug', 'ortu'))->findOrFail($id);

        if ($user->is_active) {
            return response()->json(['success' => false, 'message' => 'Akun ortu ini sudah aktif.'], 422);
        }
        $user->update(['is_active' => 1]);
        return response()->json(['success' => true, 'message' => 'Akun orang tua berhasil disetujui.']);
    }

    // -------------------------------------------------------
    // LIST ORTU PENDING
    // -------------------------------------------------------
    public function pendingOrtu()
    {
        $pending = User::with('orangTua.siswa')
            ->whereHas('roles', fn($q) => $q->where('slug', 'ortu'))
            ->where('is_active', 0)
            ->orderBy('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $pending]);
    }

    // -------------------------------------------------------
    // LIST SEMUA ORTU
    // -------------------------------------------------------
    public function listOrtu(Request $request)
    {
        $query = User::with('orangTua.siswa')
            ->whereHas('roles', fn($q) => $q->where('slug', 'ortu'))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('username', 'like', "%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('is_active', $request->status === 'aktif' ? 1 : 0))
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $query]);
    }

    // -------------------------------------------------------
    // DETAIL ORTU
    // -------------------------------------------------------
    public function detailOrtu($id)
    {
        $user = User::with('orangTua.siswa')
            ->whereHas('roles', fn($q) => $q->where('slug', 'ortu'))
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // -------------------------------------------------------
    // UPDATE ORTU
    // -------------------------------------------------------
    public function updateOrtu(UpdateOrtuRequest $request, $id)
    {
        $user = User::whereHas('roles', fn($q) => $q->where('slug', 'ortu'))->findOrFail($id);

        DB::transaction(function () use ($request, $user) {
            $user->update(array_filter([
                'name' => $request->nama,
                'email' => $request->email,
            ]));
            if ($request->filled('hubungan')) {
                $user->orangTua()->update(['hubungan' => $request->hubungan]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Data orang tua berhasil diperbarui.', 'data' => $user->load('orangTua.siswa')]);
    }

    // -------------------------------------------------------
    // TAUTKAN ANAK KE AKUN ORTU
    // -------------------------------------------------------
    public function attachAnakOrtu(AttachAnakOrtuRequest $request, $id)
    {
        $user = User::whereHas('roles', fn($q) => $q->where('slug', 'ortu'))->findOrFail($id);
        $siswa = \App\Models\Siswa::where('nisn', $request->nisn)->firstOrFail();

        $exists = \App\Models\OrangTua::where('user_id', $user->id)
            ->whereHas('siswa', fn($q) => $q->where('siswas.id', $siswa->id))
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Anak ini sudah tertaut ke akun orang tua.'], 422);
        }

        DB::transaction(function () use ($user, $siswa, $request) {
            $ortu = \App\Models\OrangTua::firstOrCreate(
                ['user_id' => $user->id, 'hubungan' => $request->hubungan],
                ['nama' => $user->name]
            );
            $ortu->siswa()->syncWithoutDetaching([$siswa->id]);
        });

        return response()->json(['success' => true, 'message' => 'Anak berhasil ditautkan.', 'data' => $user->load('orangTua.siswa')], 201);
    }

    // -------------------------------------------------------
    // RESET PASSWORD
    // -------------------------------------------------------
    public function resetPassword(ResetPasswordRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete();
        return response()->json(['success' => true, 'message' => 'Password berhasil direset.']);
    }

    // -------------------------------------------------------
    // HAPUS USER
    // -------------------------------------------------------
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }
        DB::transaction(function () use ($user) {
            $user->operatorProfile?->delete();
            $user->bendaharaProfile?->delete();
            $user->orangTua()->delete();
            $user->roles()->detach();
            $user->tokens()->delete();
            $user->delete();
        });
        return response()->json(['success' => true, 'message' => 'Akun berhasil dihapus.']);
    }
}