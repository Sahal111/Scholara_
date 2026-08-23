<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\TahunAjaran\AktifkanSemesterRequest as SetSemesterAktifRequest;
use App\Http\Requests\TahunAjaran\StoreTahunAjaranRequest;
use App\Http\Requests\TahunAjaran\UpdateTahunAjaranRequest;
use App\Models\TahunAjaran;
use App\Models\ActivityLog;
use App\Models\Kelas;
use App\Models\RiwayatKelas;
use App\Models\Semester;
use App\Models\PlotGuruMapel;
use App\Models\Absensi;
use App\Models\KalenderAkademik;
use App\Models\UserWaliKelas;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TahunAjaranController extends Controller
{
    public function index(): JsonResponse
    {
        $data = TahunAjaran::with('semesters')->orderByDesc('tahun')->get();

        return $this->success($data);
    }

    public function show($id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::with('semesters')->findOrFail($id);

        $ganjil = $tahunAjaran->semesters->firstWhere('nama', 'Ganjil');
        $genap = $tahunAjaran->semesters->firstWhere('nama', 'Genap');

        $tahunAjaran->nama = $tahunAjaran->tahun;
        $tahunAjaran->tanggal_mulai = $ganjil?->tgl_mulai;
        $tahunAjaran->tanggal_selesai = $genap?->tgl_selesai ?? $ganjil?->tgl_selesai;
        $tahunAjaran->semester_aktif = $tahunAjaran->semesters->firstWhere('is_active', true)?->nama ?? null;

        // ── Otoritas Tanda Tangan (1 query, bukan 2) ──
        $pengaturan = \App\Models\Pengaturan::whereIn('key', ['kepala_madrasah', 'nip_kepala_madrasah'])
            ->pluck('value', 'key');
        $kepsekNama = $pengaturan->get('kepala_madrasah', '');
        $kepsekNip = $pengaturan->get('nip_kepala_madrasah', '');

        // ── Hari Libur dari kalender_akademiks ──
        $totalHariLibur = \App\Models\KalenderAkademik::where('tahun_ajaran_id', $id)
            ->where('jenis', 'libur')
            ->get()
            ->sum(function ($k) {
                $mulai = \Carbon\Carbon::parse($k->tanggal_mulai);
                $selesai = $k->tanggal_selesai
                    ? \Carbon\Carbon::parse($k->tanggal_selesai)
                    : $mulai;
                return $mulai->diffInDays($selesai) + 1;
            });

        // ── Status Tutup Buku ──
        $sudahNaikKelas = \App\Models\RiwayatKelas::where('tahun_ajaran_id', $id)
            ->where('jenis_perubahan', 'naik_kelas')
            ->exists();

        // Ambil semua kelas pada tahun ajaran ini
        $kelasList = Kelas::with(['wali:id,nuptk,nama', 'semester:id,nama'])
            ->where('tahun_ajaran_id', $id)
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get()
            ->map(function ($k) {
                $totalSiswa = RiwayatKelas::where('kelas_id', $k->id)
                    ->whereNull('tanggal_keluar')
                    ->count();

                return [
                    'id' => $k->id,
                    'nama_kelas' => $k->nama_kelas,
                    'tingkat' => $k->tingkat,
                    'semester' => $k->semester?->nama ?? '-',
                    'kurikulum' => $k->kurikulum,
                    'kapasitas' => $k->kapasitas,
                    'ruangan' => $k->ruangan,
                    'is_active' => $k->is_active,
                    'nama_wali' => $k->wali?->nama ?? '-',
                    'total_siswa' => $totalSiswa,
                ];
            });

        // Hitung distribusi per tingkat
        $distribusiTingkat = $kelasList->groupBy('tingkat')->map(function ($group, $tingkat) {
            return [
                'tingkat' => $tingkat,
                'jumlah_kelas' => $group->count(),
                'jumlah_siswa' => $group->sum('total_siswa'),
            ];
        })->values();

        $semesterIds = $tahunAjaran->semesters->pluck('id');

        $totalGuruMengajar = \App\Models\PlotGuruMapel::where('tahun_ajaran_id', $id)
            ->where('is_active', true)
            ->distinct('guru_id')->count('guru_id');

        $totalMapel = \App\Models\PlotGuruMapel::where('tahun_ajaran_id', $id)
            ->where('is_active', true)
            ->distinct('mapel_id')->count('mapel_id');

        $totalWaliKelas = $kelasList->filter(fn($k) => $k['nama_wali'] !== '-')->count();
        $totalRuangan = $kelasList->filter(fn($k) => !empty($k['ruangan']))->pluck('ruangan')->unique()->count();
        $totalJadwal = \App\Models\JadwalPelajaran::whereIn('semester_id', $semesterIds)->where('is_active', true)->count();

        $tglMulai = $ganjil?->tgl_mulai;
        $tglSelesai = $genap?->tgl_selesai ?? $ganjil?->tgl_selesai;
        $hariTotal = ($tglMulai && $tglSelesai)
            ? (int) \Carbon\Carbon::parse($tglMulai)->diffInDays(\Carbon\Carbon::parse($tglSelesai))
            : null;
        $hariEfektif = $hariTotal !== null ? max(0, $hariTotal - $totalHariLibur) : null;

        $kalender = \App\Models\KalenderAkademik::where('tahun_ajaran_id', $id)
            ->orderBy('tanggal_mulai')
            ->get(['id', 'judul', 'jenis', 'tanggal_mulai', 'tanggal_selesai', 'is_nasional']);

        $aktivitas = \App\Models\ActivityLog::with('user:id,username')
            ->where('module', 'tahun_ajaran')
            ->where('subject_id', $id)
            ->latest()
            ->take(8)
            ->get(['id', 'user_id', 'action', 'keterangan', 'created_at']);

        $allTA = TahunAjaran::orderBy('tahun')->pluck('tahun', 'id');
        $taIds = $allTA->keys()->values();
        $currentIndex = $taIds->search($tahunAjaran->id);
        $taPrev = $currentIndex > 0
            ? TahunAjaran::find($taIds[$currentIndex - 1], ['id', 'tahun', 'is_active'])
            : null;
        $taNext = ($currentIndex !== false && $currentIndex < $taIds->count() - 1)
            ? TahunAjaran::find($taIds[$currentIndex + 1], ['id', 'tahun', 'is_active'])
            : null;

        $checklist = [
            'ta_dibuat' => true,
            'semester_dibuat' => $tahunAjaran->semesters->count() >= 2,
            'rombel_dibuat' => $kelasList->count() > 0,
            'guru_mengajar' => $totalGuruMengajar > 0,
            'mapel_lengkap' => $totalMapel > 0,
            'wali_kelas' => $totalWaliKelas > 0,
            'jadwal_selesai' => $totalJadwal > 0,
            'kalender' => $kalender->count() > 0,
            'siswa_terdistribusi' => $kelasList->sum('total_siswa') > 0,
            'kepsek_dikunci' => !empty($kepsekNama),
        ];

        $tahunAjaran->kepsek_nama = $kepsekNama;
        $tahunAjaran->kepsek_nip = $kepsekNip;
        $tahunAjaran->total_hari_libur = $totalHariLibur;
        $tahunAjaran->total_hari_efektif = $hariEfektif;
        $tahunAjaran->is_tutup_buku = $sudahNaikKelas;

        return $this->success([
            'data' => $tahunAjaran,
            'kelas' => $kelasList,
            'total_kelas' => $kelasList->count(),
            'total_siswa' => $kelasList->sum('total_siswa'),
            'total_guru' => $totalGuruMengajar,
            'total_mapel' => $totalMapel,
            'total_wali_kelas' => $totalWaliKelas,
            'total_ruangan' => $totalRuangan,
            'total_jadwal' => $totalJadwal,
            'distribusi_tingkat' => $distribusiTingkat,
            'kalender' => $kalender,
            'aktivitas' => $aktivitas,
            'ta_prev' => $taPrev,
            'ta_next' => $taNext,
            'checklist' => $checklist,
        ]);
    }

    public function store(StoreTahunAjaranRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            if ($request->is_active) {
                TahunAjaran::query()->update(['is_active' => false]);
            }

            $tahunAjaran = TahunAjaran::create([
                'tahun' => $request->tahun,
                'is_active' => $request->is_active ?? false,
            ]);

            if ($request->buat_semester) {
                if ($request->semester_aktif) {
                    Semester::query()->update(['is_active' => false]);
                }

                $schoolId = $tahunAjaran->school_id;

                Semester::create([
                    'school_id' => $schoolId,
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama' => 'Ganjil',
                    'tgl_mulai' => $request->semester_ganjil_mulai,
                    'tgl_selesai' => $request->semester_ganjil_selesai,
                    'is_active' => ($request->is_active && $request->semester_aktif === 'Ganjil'),
                ]);

                Semester::create([
                    'school_id' => $schoolId,
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama' => 'Genap',
                    'tgl_mulai' => $request->semester_genap_mulai,
                    'tgl_selesai' => $request->semester_genap_selesai,
                    'is_active' => ($request->is_active && $request->semester_aktif === 'Genap'),
                ]);
            }

            DB::commit();

            ActivityLog::log(
                'create',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Membuat tahun ajaran {$tahunAjaran->tahun}" . ($request->buat_semester ? ' beserta semester.' : '.'),
            );

            return $this->created(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil ditambahkan.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public function update(UpdateTahunAjaranRequest $request, $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        $this->authorize('manage', $tahunAjaran);

        DB::beginTransaction();
        try {
            if ($request->is_active && !$tahunAjaran->is_active) {
                TahunAjaran::query()->update(['is_active' => false]);
            }

            $tahunAjaran->update([
                'tahun' => $request->tahun,
                'is_active' => $request->is_active ?? $tahunAjaran->is_active,
            ]);

            if ($request->buat_semester) {
                $schoolId = $tahunAjaran->school_id;

                $semGanjilLama = Semester::where('school_id', $schoolId)
                    ->where('tahun_ajaran_id', $tahunAjaran->id)
                    ->where('nama', 'Ganjil')
                    ->withTrashed()
                    ->first();

                $semGenapLama = Semester::where('school_id', $schoolId)
                    ->where('tahun_ajaran_id', $tahunAjaran->id)
                    ->where('nama', 'Genap')
                    ->withTrashed()
                    ->first();

                if ($request->has('semester_aktif') && $request->semester_aktif && $request->is_active) {
                    Semester::query()->update(['is_active' => false]);
                }

                if ($request->has('semester_ganjil_mulai') || $request->has('semester_ganjil_selesai') || !$semGanjilLama) {
                    Semester::where('school_id', $schoolId)->updateOrCreate(
                        ['tahun_ajaran_id' => $tahunAjaran->id, 'nama' => 'Ganjil'],
                        [
                            'school_id' => $schoolId,
                            'tgl_mulai' => $request->has('semester_ganjil_mulai') ? $request->semester_ganjil_mulai : $semGanjilLama?->tgl_mulai,
                            'tgl_selesai' => $request->has('semester_ganjil_selesai') ? $request->semester_ganjil_selesai : $semGanjilLama?->tgl_selesai,
                            'is_active' => $request->has('semester_aktif') && $request->is_active ? ($request->semester_aktif === 'Ganjil') : ($semGanjilLama?->is_active ?? false),
                            'deleted_at' => null,
                        ]
                    );
                }

                if ($request->has('semester_genap_mulai') || $request->has('semester_genap_selesai') || !$semGenapLama) {
                    Semester::where('school_id', $schoolId)->updateOrCreate(
                        ['tahun_ajaran_id' => $tahunAjaran->id, 'nama' => 'Genap'],
                        [
                            'school_id' => $schoolId,
                            'tgl_mulai' => $request->has('semester_genap_mulai') ? $request->semester_genap_mulai : $semGenapLama?->tgl_mulai,
                            'tgl_selesai' => $request->has('semester_genap_selesai') ? $request->semester_genap_selesai : $semGenapLama?->tgl_selesai,
                            'is_active' => $request->has('semester_aktif') && $request->is_active ? ($request->semester_aktif === 'Genap') : ($semGenapLama?->is_active ?? false),
                            'deleted_at' => null,
                        ]
                    );
                }
            }

            DB::commit();

            ActivityLog::log(
                'update',
                'tahun_ajaran',
                $tahunAjaran->id,
                "Memperbarui tahun ajaran {$tahunAjaran->tahun}" . ($request->buat_semester ? ' dan semester.' : '.'),
            );

            return $this->success(
                $tahunAjaran->load('semesters'),
                'Tahun ajaran berhasil diperbarui.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public function setAktif($id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        $this->authorize('manage', $tahunAjaran);

        $taIds = TahunAjaran::pluck('id');
        TahunAjaran::whereIn('id', $taIds)->update(['is_active' => false]);
        Semester::whereIn('tahun_ajaran_id', $taIds)->update(['is_active' => false]);
        $tahunAjaran->update(['is_active' => true]);

        Semester::where('tahun_ajaran_id', $id)
            ->where('nama', 'Ganjil')
            ->update(['is_active' => true]);

        ActivityLog::log('set_aktif', 'tahun_ajaran', $id, "Mengaktifkan tahun ajaran {$tahunAjaran->tahun}.");

        return $this->success(
            $tahunAjaran->load('semesters'),
            'Tahun ajaran aktif berhasil diubah.'
        );
    }

    public function setSemesterAktif(SetSemesterAktifRequest $request, $id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        $this->authorize('manage', $tahunAjaran);

        if (!$tahunAjaran->is_active) {
            return $this->error(
                'Aktifkan tahun ajaran ini terlebih dahulu.',
                'VALIDATION_ERROR',
                422
            );
        }

        Semester::where('tahun_ajaran_id', $id)->update(['is_active' => false]);
        Semester::where('tahun_ajaran_id', $id)
            ->where('nama', $request->semester_nama)
            ->update(['is_active' => true]);

        ActivityLog::log(
            'set_semester_aktif',
            'tahun_ajaran',
            $id,
            "Mengaktifkan Semester {$request->semester_nama} pada tahun ajaran {$tahunAjaran->tahun}.",
        );

        return $this->success(
            $tahunAjaran->load('semesters'),
            "Semester {$request->semester_nama} berhasil diaktifkan."
        );
    }

    public function destroy($id): JsonResponse
    {
        $tahunAjaran = TahunAjaran::findOrFail($id);
        $this->authorize('manage', $tahunAjaran);

        $adaKelas = Kelas::where('tahun_ajaran_id', $id)->exists();
        $adaPlotGuru = PlotGuruMapel::where('tahun_ajaran_id', $id)->exists();
        $adaRiwayatKelas = RiwayatKelas::where('tahun_ajaran_id', $id)->exists();
        $adaAbsensi = Absensi::where('tahun_ajaran_id', $id)->exists();
        $adaKalender = KalenderAkademik::where('tahun_ajaran_id', $id)->exists();
        $adaWaliKelas = UserWaliKelas::where('tahun_ajaran_id', $id)->exists();

        if ($adaKelas || $adaPlotGuru || $adaRiwayatKelas || $adaAbsensi || $adaKalender || $adaWaliKelas) {
            return $this->error(
                'Tahun ajaran ini tidak dapat dihapus karena sudah memiliki data akademik (kelas, jadwal/plot guru, absensi, kalender, atau penugasan wali kelas).',
                'CONFLICT',
                422
            );
        }

        DB::beginTransaction();
        try {
            $tahunAjaran->semesters()->delete();
            $tahunAjaran->delete();

            DB::commit();

            return $this->success(null, 'Tahun ajaran berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Gagal menghapus tahun ajaran: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }
}