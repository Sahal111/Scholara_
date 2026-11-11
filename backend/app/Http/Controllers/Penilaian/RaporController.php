<?php

namespace App\Http\Controllers\Penilaian;

use App\Http\Controllers\Controller;
use App\Models\NilaiAkhir;
use App\Models\PlotGuruMapel;
use App\Models\Rapor;
use App\Models\Siswa;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller untuk manajemen Rapor siswa.
 *
 * Alur rapor:
 *   1. Wali kelas membuat rapor (status: draft) untuk seluruh siswa di kelasnya
 *   2. Nilai akhir per mapel ditarik dari tabel nilai_akhirs
 *   3. Wali kelas mengisi catatan wali + rekap absensi + sikap
 *   4. Kepsek / wali kelas memfinalisasi rapor (status: final → tidak bisa diedit lagi)
 *
 * Role yang boleh akses:
 *   - wali_kelas: CRUD rapor kelasnya sendiri, finalisasi
 *   - kepsek:     Lihat semua rapor, finalisasi
 *   - operator:   Lihat semua rapor (read-only)
 *   - ortu:       Lihat rapor anak sendiri (endpoint terpisah di routes/api/ortu.php)
 */
class RaporController extends Controller
{
    use ApiResponse;

    /**
     * Daftar rapor — bisa difilter per kelas, semester, siswa, atau status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Rapor::with([
            'siswa:id,nisn,nama',
            'kelas:id,nama,tingkat',
            'semester:id,nama',
            'waliKelas:id,nama',
        ])
            ->when($request->kelas_id, fn($q) => $q->where('kelas_id', $request->kelas_id))
            ->when($request->semester_id, fn($q) => $q->where('semester_id', $request->semester_id))
            ->when($request->tahun_ajaran_id, fn($q) => $q->where('tahun_ajaran_id', $request->tahun_ajaran_id))
            ->when($request->siswa_id, fn($q) => $q->where('siswa_id', $request->siswa_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when(
                $request->search,
                fn($q) => $q->whereHas(
                    'siswa',
                    fn($s) => $s->where('nama', 'like', "%{$request->search}%")
                              ->orWhere('nisn', 'like', "%{$request->search}%")
                )
            )
            ->latest('id');

        // Wali kelas hanya lihat kelasnya sendiri
        $user = auth()->user();
        if ($user->getRoleSlug() === 'wali_kelas') {
            $guru = $user->guru;
            if ($guru) {
                $kelasIds = \App\Models\Kelas::where('wali_kelas_id', $guru->id)->pluck('id');
                $query->whereIn('kelas_id', $kelasIds);
            }
        }

        return $this->success($query->paginate((int) $request->get('per_page', 20)));
    }

    /**
     * Detail satu rapor beserta nilai akhir per mapel.
     */
    public function show(int $id): JsonResponse
    {
        $rapor = Rapor::with([
            'siswa:id,nisn,nama,tempat_lahir,tanggal_lahir,jenis_kelamin',
            'kelas:id,nama,tingkat',
            'semester:id,nama,tahun_ajaran_id',
            'waliKelas:id,nama,nip',
        ])->findOrFail($id);

        $this->authorizeRapor($rapor);

        // Nilai akhir per mapel untuk siswa + semester ini
        $nilaiAkhirs = NilaiAkhir::with([
            'plot:id,mapel_id,guru_id',
            'plot.mapel:id,nama,kode',
            'plot.guru:id,nama',
        ])
            ->where('siswa_id', $rapor->siswa_id)
            ->where('semester_id', $rapor->semester_id)
            ->get();

        return $this->success([
            'rapor'       => $rapor,
            'nilai_akhirs'=> $nilaiAkhirs,
        ]);
    }

    /**
     * Buat rapor baru (status draft) untuk satu kelas + semester.
     * Jika rapor sudah ada untuk sebagian siswa, skip — jangan timpa.
     * Mengembalikan jumlah rapor yang berhasil dibuat.
     */
    public function buatPerKelas(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kelas_id'        => 'required|exists:kelas,id',
            'semester_id'     => 'required|exists:semesters,id',
            'tahun_ajaran_id' => 'required|exists:tahun_ajarans,id',
        ]);

        $kelas = \App\Models\Kelas::with('waliKelas:id')->findOrFail($data['kelas_id']);

        // Hanya wali kelas kelas ini atau kepsek/operator yang boleh
        $user = auth()->user();
        $this->authorizeKelas($kelas, $user);

        // Ambil semua siswa di kelas + semester ini
        $siswas = Siswa::whereHas(
            'riwayatKelas',
            fn($q) => $q->where('kelas_id', $data['kelas_id'])
                        ->where('semester_id', $data['semester_id'])
        )->pluck('id');

        if ($siswas->isEmpty()) {
            return $this->error('Tidak ada siswa di kelas ini untuk semester tersebut.', 422);
        }

        $schoolId     = auth()->user()->school_id;
        $waliKelasId  = $kelas->waliKelas?->id;
        $dibuat       = 0;

        DB::transaction(function () use ($siswas, $data, $kelas, $schoolId, $waliKelasId, &$dibuat) {
            foreach ($siswas as $siswaId) {
                // Skip jika rapor sudah ada
                $sudahAda = Rapor::where('siswa_id', $siswaId)
                    ->where('semester_id', $data['semester_id'])
                    ->exists();

                if ($sudahAda) continue;

                Rapor::create([
                    'school_id'       => $schoolId,
                    'siswa_id'        => $siswaId,
                    'kelas_id'        => $data['kelas_id'],
                    'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                    'semester_id'     => $data['semester_id'],
                    'wali_kelas_id'   => $waliKelasId,
                    'status'          => Rapor::STATUS_DRAFT,
                ]);

                $dibuat++;
            }
        });

        return $this->success(
            ['jumlah_dibuat' => $dibuat, 'total_siswa' => $siswas->count()],
            "Berhasil membuat {$dibuat} rapor baru. " .
            ($siswas->count() - $dibuat > 0 ? ($siswas->count() - $dibuat) . ' sudah ada sebelumnya.' : '')
        );
    }

    /**
     * Update catatan wali kelas, rekap absensi, dan deskripsi sikap pada rapor.
     * Hanya bisa dilakukan saat rapor masih berstatus 'draft'.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $rapor = Rapor::findOrFail($id);
        $this->authorizeRapor($rapor);

        if ($rapor->status === Rapor::STATUS_FINAL) {
            return $this->error('Rapor yang sudah difinalisasi tidak dapat diubah.', 422);
        }

        $data = $request->validate([
            'catatan_wali'               => 'nullable|string|max:3000',
            'deskripsi_sikap_spiritual'  => 'nullable|string|max:2000',
            'deskripsi_sikap_sosial'     => 'nullable|string|max:2000',
            'total_hadir'                => 'nullable|integer|min:0|max:365',
            'total_sakit'                => 'nullable|integer|min:0|max:365',
            'total_izin'                 => 'nullable|integer|min:0|max:365',
            'total_alpa'                 => 'nullable|integer|min:0|max:365',
            'status_kenaikan'            => 'nullable|in:Naik Kelas,Tinggal Kelas,Lulus,Tidak Lulus',
        ]);

        $rapor->update($data);

        return $this->success(
            $rapor->load(['siswa:id,nisn,nama', 'kelas:id,nama']),
            'Rapor berhasil diperbarui.'
        );
    }

    /**
     * Finalisasi rapor — ubah status dari draft ke final.
     * Setelah final, rapor dikunci dan tidak bisa diedit.
     * Hanya kepsek atau wali kelas kelas bersangkutan yang boleh.
     */
    public function finalisasi(Request $request, int $id): JsonResponse
    {
        $rapor = Rapor::findOrFail($id);
        $this->authorizeRapor($rapor);

        if ($rapor->status === Rapor::STATUS_FINAL) {
            return $this->error('Rapor ini sudah difinalisasi sebelumnya.', 422);
        }

        $rapor->update([
            'status'          => Rapor::STATUS_FINAL,
            'finalisasi_at'   => now(),
            'finalisasi_oleh' => auth()->id(),
        ]);

        return $this->success(
            $rapor->load(['siswa:id,nisn,nama', 'kelas:id,nama']),
            'Rapor berhasil difinalisasi.'
        );
    }

    /**
     * Finalisasi rapor massal untuk seluruh kelas dalam satu request.
     * Hanya untuk kepsek dan operator.
     */
    public function finalisasiMassal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kelas_id'    => 'required|exists:kelas,id',
            'semester_id' => 'required|exists:semesters,id',
        ]);

        $rapors = Rapor::where('kelas_id', $data['kelas_id'])
            ->where('semester_id', $data['semester_id'])
            ->where('status', Rapor::STATUS_DRAFT)
            ->get();

        if ($rapors->isEmpty()) {
            return $this->error('Tidak ada rapor draft yang bisa difinalisasi untuk kelas ini.', 422);
        }

        $userId = auth()->id();
        $now    = now();

        DB::transaction(function () use ($rapors, $userId, $now) {
            foreach ($rapors as $rapor) {
                $rapor->update([
                    'status'          => Rapor::STATUS_FINAL,
                    'finalisasi_at'   => $now,
                    'finalisasi_oleh' => $userId,
                ]);
            }
        });

        return $this->success(
            ['jumlah_difinalisasi' => $rapors->count()],
            "{$rapors->count()} rapor berhasil difinalisasi."
        );
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    /**
     * Validasi akses ke rapor: wali kelas hanya bisa akses rapor kelasnya,
     * kepsek dan operator bisa akses semua.
     */
    private function authorizeRapor(Rapor $rapor): void
    {
        $user = auth()->user();
        $role = $user->getRoleSlug();

        if (in_array($role, ['kepsek', 'operator', 'waka_kurikulum'], true)) {
            return;
        }

        if ($role === 'wali_kelas') {
            $guru    = $user->guru;
            $kelasId = \App\Models\Kelas::where('wali_kelas_id', $guru?->id)->value('id');
            if ($rapor->kelas_id !== $kelasId) {
                abort(403, 'Anda hanya bisa mengakses rapor kelas Anda sendiri.');
            }
            return;
        }

        // Siswa/ortu tidak boleh akses endpoint ini
        abort(403, 'Akses ditolak.');
    }

    /**
     * Validasi bahwa user boleh mengelola kelas tersebut.
     */
    private function authorizeKelas(\App\Models\Kelas $kelas, $user): void
    {
        $role = $user->getRoleSlug();

        if (in_array($role, ['kepsek', 'operator'], true)) {
            return;
        }

        if ($role === 'wali_kelas') {
            $guru = $user->guru;
            if ($kelas->wali_kelas_id !== $guru?->id) {
                abort(403, 'Anda hanya bisa membuat rapor untuk kelas yang Anda ampu.');
            }
            return;
        }

        abort(403, 'Akses ditolak.');
    }
}

