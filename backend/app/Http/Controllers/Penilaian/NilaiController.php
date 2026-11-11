<?php

namespace App\Http\Controllers\Penilaian;

use App\Http\Controllers\Controller;
use App\Models\KomponenPenilaian;
use App\Models\Nilai;
use App\Models\NilaiAkhir;
use App\Models\PlotGuruMapel;
use App\Models\Siswa;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller untuk input dan manajemen nilai siswa.
 *
 * Dipakai oleh guru untuk menginput nilai per komponen,
 * dan oleh wali kelas/admin untuk melihat rekap nilai per kelas.
 *
 * Alur penilaian:
 *   1. Guru memilih kelas & mapel (plot_id) yang ia ampu
 *   2. Guru memilih komponen nilai (Formatif, Sumatif, PTS, dsb.)
 *   3. Guru menginput nilai per siswa di kelas tersebut
 *   4. Sistem menghitung nilai akhir otomatis saat semua komponen sudah diisi
 */
class NilaiController extends Controller
{
    use ApiResponse;

    /**
     * Daftar komponen penilaian aktif untuk sekolah yang sedang login.
     * Dapat difilter berdasarkan kurikulum (K13, Merdeka, Semua) atau jenis.
     */
    public function komponen(Request $request): JsonResponse
    {
        $komponen = KomponenPenilaian::query()
            ->where('is_active', true)
            ->when($request->kurikulum, function ($q, $kurikulum) {
                $q->where(function ($sub) use ($kurikulum) {
                    $sub->where('kurikulum', $kurikulum)
                        ->orWhere('kurikulum', 'Semua');
                });
            })
            ->when($request->jenis, fn($q, $jenis) => $q->where('jenis', $jenis))
            ->orderBy('id')
            ->get();

        return $this->success($komponen);
    }

    /**
     * Daftar plot (mapel yang diampu) oleh guru yang sedang login.
     * Digunakan sebagai pilihan "kelas & mapel" di form input nilai.
     */
    public function plotSaya(Request $request): JsonResponse
    {
        $guru = auth()->user()->guru;

        if (! $guru) {
            return $this->error('Data guru tidak ditemukan untuk akun ini.', 404);
        }

        $plots = PlotGuruMapel::with([
            'mapel:id,nama,kode',
            'kelas:id,nama,tingkat',
            'semester:id,nama,tahun_ajaran_id',
        ])
            ->where('guru_id', $guru->id)
            ->when($request->semester_id, fn($q) => $q->where('semester_id', $request->semester_id))
            ->where('is_active', true)
            ->get();

        return $this->success($plots);
    }

    /**
     * Ambil daftar nilai untuk satu plot (mapel + kelas) dan satu komponen.
     * Mengembalikan semua siswa di kelas tersebut beserta nilai masing-masing.
     *
     * @param int $plotId  ID plot_guru_mapels
     */
    public function byPlot(Request $request, int $plotId): JsonResponse
    {
        $plot = PlotGuruMapel::with(['mapel:id,nama,kode', 'kelas:id,nama,tingkat', 'semester:id,nama'])
            ->findOrFail($plotId);

        // Pastikan guru ini memang mengampu plot tersebut
        $this->authorizeGuruPlot($plot);

        // Ambil semua siswa di kelas plot ini
        $siswas = Siswa::whereHas(
            'riwayatKelas',
            fn($q) => $q->where('kelas_id', $plot->kelas_id)
                        ->where('semester_id', $plot->semester_id)
        )
            ->select('id', 'nisn', 'nama')
            ->orderBy('nama')
            ->get();

        // Ambil nilai yang sudah ada untuk kombinasi plot + komponen + semester
        $nilais = Nilai::where('plot_id', $plotId)
            ->where('semester_id', $plot->semester_id)
            ->when($request->komponen_id, fn($q) => $q->where('komponen_id', $request->komponen_id))
            ->pluck('nilai', 'siswa_id');   // map: siswa_id → nilai

        // Gabungkan: setiap siswa → nilainya (atau null jika belum diisi)
        $result = $siswas->map(fn($siswa) => [
            'siswa_id'   => $siswa->id,
            'nisn'       => $siswa->nisn,
            'nama'       => $siswa->nama,
            'nilai'      => $nilais[$siswa->id] ?? null,
        ]);

        return $this->success([
            'plot'    => $plot,
            'siswas'  => $result,
        ]);
    }

    /**
     * Input atau update nilai satu siswa untuk satu komponen.
     */
    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plot_id'         => 'required|exists:plot_guru_mapels,id',
            'siswa_id'        => 'required|exists:siswas,id',
            'komponen_id'     => 'nullable|exists:komponen_penilaians,id',
            'tahun_ajaran_id' => 'required|exists:tahun_ajarans,id',
            'semester_id'     => 'required|exists:semesters,id',
            'nilai'           => 'nullable|numeric|min:0|max:100',
            'deskripsi'       => 'nullable|string|max:1000',
        ]);

        $plot = PlotGuruMapel::findOrFail($data['plot_id']);
        $this->authorizeGuruPlot($plot);

        $data['school_id']   = auth()->user()->school_id;
        $data['created_by']  = auth()->id();
        $data['updated_by']  = auth()->id();

        // Hitung nilai_huruf otomatis
        if (isset($data['nilai']) && $data['nilai'] !== null) {
            $data['nilai_huruf'] = $this->nilaiKeHuruf((float) $data['nilai']);
        }

        $nilai = Nilai::updateOrCreate(
            [
                'siswa_id'    => $data['siswa_id'],
                'plot_id'     => $data['plot_id'],
                'komponen_id' => $data['komponen_id'] ?? null,
                'semester_id' => $data['semester_id'],
            ],
            $data
        );

        return $this->success($nilai, 'Nilai berhasil disimpan.');
    }

    /**
     * Input nilai massal untuk seluruh siswa di satu kelas sekaligus.
     * Body: { plot_id, komponen_id, semester_id, tahun_ajaran_id, nilais: [{siswa_id, nilai, deskripsi}] }
     */
    public function upsertBulk(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plot_id'            => 'required|exists:plot_guru_mapels,id',
            'komponen_id'        => 'nullable|exists:komponen_penilaians,id',
            'tahun_ajaran_id'    => 'required|exists:tahun_ajarans,id',
            'semester_id'        => 'required|exists:semesters,id',
            'nilais'             => 'required|array|min:1',
            'nilais.*.siswa_id'  => 'required|exists:siswas,id',
            'nilais.*.nilai'     => 'nullable|numeric|min:0|max:100',
            'nilais.*.deskripsi' => 'nullable|string|max:1000',
        ]);

        $plot = PlotGuruMapel::findOrFail($data['plot_id']);
        $this->authorizeGuruPlot($plot);

        $schoolId   = auth()->user()->school_id;
        $userId     = auth()->id();
        $jumlahDisimpan = 0;

        DB::transaction(function () use ($data, $plot, $schoolId, $userId, &$jumlahDisimpan) {
            foreach ($data['nilais'] as $item) {
                if ($item['nilai'] === null && empty($item['deskripsi'])) {
                    continue; // skip baris kosong
                }

                Nilai::updateOrCreate(
                    [
                        'siswa_id'    => $item['siswa_id'],
                        'plot_id'     => $data['plot_id'],
                        'komponen_id' => $data['komponen_id'] ?? null,
                        'semester_id' => $data['semester_id'],
                    ],
                    [
                        'school_id'       => $schoolId,
                        'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                        'nilai'           => $item['nilai'] ?? null,
                        'nilai_huruf'     => isset($item['nilai'])
                            ? $this->nilaiKeHuruf((float) $item['nilai'])
                            : null,
                        'deskripsi'       => $item['deskripsi'] ?? null,
                        'created_by'      => $userId,
                        'updated_by'      => $userId,
                    ]
                );

                $jumlahDisimpan++;
            }
        });

        return $this->success(
            ['jumlah_disimpan' => $jumlahDisimpan],
            "Berhasil menyimpan {$jumlahDisimpan} nilai."
        );
    }

    /**
     * Rekap nilai siswa per kelas per semester.
     * Dipakai wali kelas dan kepsek untuk melihat semua nilai di kelasnya.
     */
    public function rekap(Request $request): JsonResponse
    {
        $request->validate([
            'kelas_id'   => 'required|exists:kelas,id',
            'semester_id'=> 'required|exists:semesters,id',
        ]);

        // Ambil semua plot aktif di kelas ini
        $plots = PlotGuruMapel::with(['mapel:id,nama,kode', 'guru:id,nama'])
            ->where('kelas_id', $request->kelas_id)
            ->where('semester_id', $request->semester_id)
            ->where('is_active', true)
            ->get();

        // Ambil semua siswa di kelas ini
        $siswas = Siswa::whereHas(
            'riwayatKelas',
            fn($q) => $q->where('kelas_id', $request->kelas_id)
                        ->where('semester_id', $request->semester_id)
        )
            ->select('id', 'nisn', 'nama')
            ->orderBy('nama')
            ->get();

        // Ambil nilai akhir
        $nilaiAkhirs = NilaiAkhir::where('semester_id', $request->semester_id)
            ->whereIn('plot_id', $plots->pluck('id'))
            ->whereIn('siswa_id', $siswas->pluck('id'))
            ->get()
            ->groupBy('siswa_id');

        return $this->success([
            'plots'       => $plots,
            'siswas'      => $siswas,
            'nilai_akhirs'=> $nilaiAkhirs,
        ]);
    }

    /**
     * Hitung dan simpan nilai akhir untuk semua siswa di satu plot + semester.
     * Nilai akhir = rata-rata tertimbang dari semua komponen sesuai bobot.
     */
    public function hitungNilaiAkhir(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plot_id'         => 'required|exists:plot_guru_mapels,id',
            'semester_id'     => 'required|exists:semesters,id',
            'tahun_ajaran_id' => 'required|exists:tahun_ajarans,id',
        ]);

        $plot = PlotGuruMapel::findOrFail($data['plot_id']);
        $this->authorizeGuruPlot($plot);

        // Ambil semua nilai yang ada untuk plot + semester ini
        $semuaNilai = Nilai::with('komponen')
            ->where('plot_id', $data['plot_id'])
            ->where('semester_id', $data['semester_id'])
            ->get()
            ->groupBy('siswa_id');

        // Ambil komponen yang digunakan beserta bobotnya
        $komponen = KomponenPenilaian::where('is_active', true)->get()->keyBy('id');

        $disimpan = 0;
        $schoolId = auth()->user()->school_id;

        DB::transaction(function () use ($semuaNilai, $komponen, $data, $plot, $schoolId, &$disimpan) {
            foreach ($semuaNilai as $siswaId => $nilaiSiswa) {

                // Hitung rata-rata tertimbang
                $totalBobot = 0;
                $totalNilai = 0;
                $adaBobot   = false;

                foreach ($nilaiSiswa as $nilaiRow) {
                    if ($nilaiRow->nilai === null) continue;

                    $komp  = $komponen[$nilaiRow->komponen_id] ?? null;
                    $bobot = $komp?->bobot_persentase ?? null;

                    if ($bobot && $bobot > 0) {
                        $totalNilai += $nilaiRow->nilai * ($bobot / 100);
                        $totalBobot += $bobot;
                        $adaBobot    = true;
                    } else {
                        // Komponen tanpa bobot → rata-rata sederhana sebagai fallback
                        $totalNilai += $nilaiRow->nilai;
                        $totalBobot += 1;
                    }
                }

                if ($totalBobot == 0) continue;

                $nilaiAkhir = $adaBobot
                    ? round($totalNilai, 2)                     // sudah tertimbang
                    : round($totalNilai / $totalBobot, 2);      // rata-rata biasa

                $predikat = NilaiAkhir::hitungPredikat($nilaiAkhir);

                NilaiAkhir::updateOrCreate(
                    [
                        'siswa_id'    => $siswaId,
                        'plot_id'     => $data['plot_id'],
                        'semester_id' => $data['semester_id'],
                    ],
                    [
                        'school_id'       => $schoolId,
                        'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                        'nilai_angka'     => $nilaiAkhir,
                        'nilai_huruf'     => $predikat,
                        'predikat'        => $predikat,
                    ]
                );

                $disimpan++;
            }
        });

        return $this->success(
            ['jumlah_siswa' => $disimpan],
            "Nilai akhir berhasil dihitung untuk {$disimpan} siswa."
        );
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    /**
     * Konversi nilai angka ke huruf menggunakan KKM standar nasional.
     * A=90-100, B=80-89, C=70-79, D=<70
     */
    private function nilaiKeHuruf(float $nilai): string
    {
        return match (true) {
            $nilai >= 90 => 'A',
            $nilai >= 80 => 'B',
            $nilai >= 70 => 'C',
            default      => 'D',
        };
    }

    /**
     * Validasi bahwa guru yang login memang pemilik plot ini.
     * Abort 403 jika bukan miliknya (kecuali wali kelas / kepsek).
     */
    private function authorizeGuruPlot(PlotGuruMapel $plot): void
    {
        $user  = auth()->user();
        $roles = ['kepsek', 'waka_kurikulum', 'operator', 'wali_kelas'];

        if (in_array($user->getRoleSlug(), $roles, true)) {
            return; // Role ini boleh lihat semua plot
        }

        $guru = $user->guru;
        if (! $guru || $plot->guru_id !== $guru->id) {
            abort(403, 'Anda tidak berhak mengakses data penilaian kelas ini.');
        }
    }
}

