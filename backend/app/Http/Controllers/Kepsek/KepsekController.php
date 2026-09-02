<?php

namespace App\Http\Controllers\Kepsek;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kepsek\RangeAbsensiRequest;
use App\Http\Requests\Kepsek\SiswaAlpaRequest;
use App\Http\Requests\Kepsek\UpdateProfilKepsekRequest;
use App\Models\Kelas;
use App\Models\Absensi; // tabel: absensis
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\JadwalPelajaran; // tabel: jadwals
use App\Models\User;
use App\Models\RiwayatKelas;
use App\Models\MataPelajaran;
use App\Models\Pengumuman;
use App\Models\TahunAjaran; // tabel: tahun_ajarans
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
// use App\Models\UserKepsek; // tidak ada tabel terpisah di skema baru


class KepsekController extends Controller
{
    // -------------------------------------------------------
    // DASHBOARD SUMMARY
    // -------------------------------------------------------
    public function dashboard()
    {
        $today = now()->toDateString();

        $totalSiswa = Siswa::where('status_pd', 'Aktif')->count();
        $totalKelas = Kelas::where('is_active', 1)->count();
        $totalGuru = User::whereHas('roles', fn($q) => $q->where('slug', 'guru'))->where('is_active', 1)->count();
        $totalMapel = MataPelajaran::where('is_active', 1)->count();

        // Rekap absensi hari ini semua kelas
        $absensiHariIni = Absensi::where('tanggal', $today)->get();
        $kelasYangSudahAbsen = Absensi::where('tanggal', $today)
            ->distinct()
            ->pluck('kelas_id');

        // -------------------------------------------------------
        // GRAFIK KEHADIRAN 7 HARI TERAKHIR
        // -------------------------------------------------------
        $mulai = Carbon::today()->subDays(6);
        $absensi7Hari = Absensi::whereBetween('tanggal', [$mulai->toDateString(), $today])->get();

        $grafikKehadiran = [];
        for ($i = 0; $i < 7; $i++) {
            $tgl = $mulai->copy()->addDays($i)->toDateString();
            $dataHari = $absensi7Hari->filter(fn($a) => $a->tanggal->format('Y-m-d') === $tgl);

            $grafikKehadiran[] = [
                'tanggal' => $tgl,
                'label' => Carbon::parse($tgl)->translatedFormat('D, d M'),
                'hadir' => $dataHari->where('status', 'Hadir')->count(),
                'sakit' => $dataHari->where('status', 'Sakit')->count(),
                'izin' => $dataHari->where('status', 'Izin')->count(),
                'alpa' => $dataHari->where('status', 'Alpa')->count(),
            ];
        }

        // -------------------------------------------------------
        // PENGUMUMAN TERBARU (5 terakhir)
        // -------------------------------------------------------
        $pengumumanTerbaru = Pengumuman::with('penulis:id,name')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'judul' => $p->judul,
                'kategori' => $p->kategori,
                'ringkasan' => \Str::limit(strip_tags($p->konten), 100),
                'penulis' => $p->penulis?->nama_lengkap,
                'tanggal' => $p->created_at?->translatedFormat('d M Y'),
            ]);

        // -------------------------------------------------------
        // KALENDER AKADEMIK (dari tahun_ajaran aktif + pengumuman event)
        // -------------------------------------------------------
        $tahunAjaranAktif = TahunAjaran::where('is_active', 1)->first();

        $agendaDariPengumuman = Pengumuman::whereIn('kategori', ['Libur', 'Jadwal Ujian', 'Rapat'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'judul', 'kategori', 'created_at']);

        $kalenderAkademik = [
            'tahun_ajaran_aktif' => $tahunAjaranAktif ? [
                'nama' => $tahunAjaranAktif->nama,
                'mulai' => $tahunAjaranAktif->tanggal_mulai,
                'selesai' => $tahunAjaranAktif->tanggal_selesai,
            ] : null,
            'agenda' => $agendaDariPengumuman,
        ];

        // -------------------------------------------------------
        // NOTIFIKASI PENTING (di-generate otomatis)
        // -------------------------------------------------------
        $notifikasi = [];

        $kelasBelumAbsen = Kelas::where('is_active', 1)
            ->whereNotIn('id', $kelasYangSudahAbsen)
            ->pluck('nama_kelas');

        if ($kelasBelumAbsen->isNotEmpty()) {
            $notifikasi[] = [
                'tipe' => 'warning',
                'pesan' => 'Kelas belum mengisi absensi hari ini: ' . $kelasBelumAbsen->implode(', '),
            ];
        }

        $alpaMingguIni = Absensi::where('status', 'Alpa')
            ->whereBetween('tanggal', [$mulai->toDateString(), $today])
            ->select('siswa_id', \DB::raw('COUNT(*) as total'))
            ->groupBy('siswa_id')
            ->having('total', '>=', 3)
            ->with('siswa:id,nisn,nama')
            ->get();

        foreach ($alpaMingguIni as $item) {
            $notifikasi[] = [
                'tipe' => 'danger',
                'pesan' => ($item->siswa?->nama ?? $item->siswa?->nisn ?? '-') . " sudah alpa {$item->total}x dalam 7 hari terakhir.",
            ];
        }

        if (empty($notifikasi)) {
            $notifikasi[] = [
                'tipe' => 'info',
                'pesan' => 'Tidak ada hal mendesak yang perlu perhatian saat ini.',
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_siswa' => $totalSiswa,
                'total_kelas' => $totalKelas,
                'total_guru' => $totalGuru,
                'total_mapel' => $totalMapel,
                'hari_ini' => [
                    'tanggal' => $today,
                    'kelas_sudah_absen' => $kelasYangSudahAbsen->count(),
                    'kelas_belum_absen' => $totalKelas - $kelasYangSudahAbsen->count(),
                    'total_hadir' => $absensiHariIni->where('status', 'Hadir')->count(),
                    'total_sakit' => $absensiHariIni->where('status', 'Sakit')->count(),
                    'total_izin' => $absensiHariIni->where('status', 'Izin')->count(),
                    'total_alpa' => $absensiHariIni->where('status', 'Alpa')->count(),
                ],
                'grafik_kehadiran' => $grafikKehadiran,
                'pengumuman_terbaru' => $pengumumanTerbaru,
                'kalender_akademiks' => $kalenderAkademik,
                'notifikasi' => $notifikasi,
            ],
        ]);
    }

    // -------------------------------------------------------
    // REKAP SEMUA KELAS (untuk kepsek monitoring)
    // -------------------------------------------------------
    public function rekapSemuaKelas(RangeAbsensiRequest $request)
    {

        $kelasList = Kelas::where('is_active', 1)->get();

        $rekap = $kelasList->map(function ($kelas) use ($request) {
            $totalSiswa = \App\Models\RiwayatKelas::where('kelas_id', $kelas->id)
                ->whereNull('tanggal_keluar')
                ->count();

            $absensi = Absensi::where('kelas_id', $kelas->id)
                ->whereBetween('tanggal', [$request->dari, $request->sampai])
                ->get();

            $hariEfektif = $absensi->unique('tanggal')->count();

            return [
                'kelas_id' => $kelas->id,
                'nama_kelas' => $kelas->nama_kelas,
                'tingkat' => $kelas->tingkat,
                'total_siswa' => $totalSiswa,
                'hari_efektif' => $hariEfektif,
                'total_hadir' => $absensi->where('status', 'Hadir')->count(),
                'total_sakit' => $absensi->where('status', 'Sakit')->count(),
                'total_izin' => $absensi->where('status', 'Izin')->count(),
                'total_alpa' => $absensi->where('status', 'Alpa')->count(),
                'persentase_kehadiran' => $absensi->count() > 0
                    ? round($absensi->where('status', 'Hadir')->count() / $absensi->count() * 100, 1)
                    : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'periode' => [
                    'dari' => $request->dari,
                    'sampai' => $request->sampai,
                ],
                'rekap' => $rekap,
            ],
        ]);
    }

    // -------------------------------------------------------
    // SISWA DENGAN ALPA TERBANYAK (monitoring)
    // -------------------------------------------------------
    public function siswaAlpaTerbanyak(SiswaAlpaRequest $request)
    {

        $limit = $request->limit ?? 10;

        $data = Absensi::with('siswa:id,nisn,nama')
            ->where('status', 'Alpa')
            ->whereBetween('tanggal', [$request->dari, $request->sampai])
            ->select('siswa_id', \DB::raw('COUNT(*) as total_alpa'))
            ->groupBy('siswa_id')
            ->orderByDesc('total_alpa')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'nisn' => $item->siswa?->nisn,
                    'nama' => $item->siswa?->nama,
                    'total_alpa' => $item->total_alpa,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    // -------------------------------------------------------
    // DAFTAR GURU (read-only, khusus kepsek)
    // -------------------------------------------------------
    public function daftarGuru(Request $request)
    {
        $query = Guru::query()
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->where('nama', 'like', "%{$request->search}%")
                        ->orWhere('nuptk', 'like', "%{$request->search}%")
                        ->orWhere('nip', 'like', "%{$request->search}%");
                });
            })
            ->when($request->jenis_ptk, function ($q) use ($request) {
                $q->where('jenis_ptk', $request->jenis_ptk);
            })
            ->when($request->status_aktif !== null && $request->status_aktif !== '', function ($q) use ($request) {
                $q->where('is_active', $request->status_aktif);
            })
            ->orderBy('nama')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $query,
        ]);
    }

    // -------------------------------------------------------
    // DETAIL GURU (read-only, khusus kepsek) + mapel yang diampu
    // -------------------------------------------------------
    public function detailGuru($ulid)
    {
        // Cari guru by ulid (public identifier), fallback ke nuptk untuk backward compat
        $guru = Guru::where('ulid', $ulid)->firstOr(fn() => Guru::where('nuptk', $ulid)->firstOrFail());

        $mapelDiampu = JadwalPelajaran::with(['mataPelajaran', 'kelas'])
            ->where('guru_id', $guru->id)
            ->get()
            ->groupBy('mapel_id')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'mapel_id' => $first->mapel_id,
                    'nama_mapel' => $first->mataPelajaran?->nama_mapel,
                    'kode_mapel' => $first->mataPelajaran?->kode,   // kolom aktual: kode, bukan kode_mapel
                    'kelas_diampu' => $items->pluck('kelas.nama_kelas')->filter()->unique()->values(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'gurus' => $guru,
                'mata_pelajaran_diampu' => $mapelDiampu,
            ],
        ]);
    }

    // -------------------------------------------------------
    // DAFTAR SISWA (read-only, khusus kepsek)
    // -------------------------------------------------------
    public function daftarSiswa(Request $request)
    {
        $query = Siswa::query()
            ->when($request->search, function ($q) use ($request) {
                $q->where('nama', 'like', "%{$request->search}%")
                    ->orWhere('nisn', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            })
            ->when($request->kelas_id, function ($q) use ($request) {
                $q->whereHas('kelasAktif', function ($subQ) use ($request) {
                    $subQ->where('kelas.id', $request->kelas_id)
                        ->where('kelas.is_active', 1);
                });
            })
            ->when($request->status_pd, function ($q) use ($request) {
                $q->where('status', $request->status_pd);
            })
            ->when($request->jenis_kelamin, function ($q) use ($request) {
                $q->where('jenis_kelamin', $request->jenis_kelamin);
            })
            ->with(['kelasAktif'])
            ->orderBy('nama')
            ->paginate($request->per_page ?? 15);

        // Transform data untuk menambahkan informasi kelas aktif
        $query->getCollection()->transform(function ($siswa) {
            $kelasAktif = $siswa->kelasAktif->first();

            $siswa->kelas_aktif = $kelasAktif ? [
                'kelas_id' => $kelasAktif->id,
                'nama_kelas' => $kelasAktif->nama_kelas,
                'tingkat' => $kelasAktif->tingkat,
            ] : null;

            unset($siswa->kelasAktif);

            return $siswa;
        });

        return response()->json([
            'success' => true,
            'data' => $query,
        ]);
    }

    // -------------------------------------------------------
    // DETAIL SISWA (read-only, khusus kepsek)
    // -------------------------------------------------------
    public function detailSiswa($nisn)
    {
        $siswa = Siswa::with([
            'orangTua',
            'kelasAktif' => function ($q) {
                $q->with(['tahunAjaran', 'waliKelas.guru']);
            }
        ])->where('nisn', $nisn)->firstOrFail();

        // Ambil kelas aktif dari relasi
        $kelasAktif = $siswa->kelasAktif->first();

        $siswa->kelas_aktif = $kelasAktif ? [
            'kelas_id' => $kelasAktif->id,
            'nama_kelas' => $kelasAktif->nama_kelas,
            'tingkat' => $kelasAktif->tingkat,
            'semester' => $kelasAktif->semester_id,
            'no_absen' => $kelasAktif->pivot->no_absen,
            'tahun_ajarans' => $kelasAktif->tahunAjaran?->nama,
            'wali_kelas' => $kelasAktif->wali_kelas_id ? [
                'nuptk' => $kelasAktif->wali?->nuptk,
                // nama_lengkap adalah accessor di model Guru
                'nama' => $kelasAktif->wali?->nama_lengkap,
            ] : null,
        ] : null;

        // Riwayat kelas (termasuk yang sudah keluar)
        $riwayatKelas = RiwayatKelas::with(['kelas.tahunAjaran'])
            ->where('siswa_id', $siswa->id)
            ->orderBy('tanggal_masuk', 'desc')
            ->get()
            ->map(function ($sk) {
                return [
                    'kelas_id' => $sk->kelas_id,
                    'nama_kelas' => $sk->kelas?->nama_kelas,
                    'tingkat' => $sk->kelas?->tingkat,
                    'tahun_ajarans' => $sk->kelas?->tahunAjaran?->nama,
                    'no_absen' => $sk->no_absen,
                    'jenis_perubahan' => $sk->jenis_perubahan,
                    'tanggal_masuk' => $sk->tanggal_masuk,
                    'tanggal_keluar' => $sk->tanggal_keluar,
                ];
            });

        // Statistik absensi (periode aktif)
        $tanggalMasuk = $kelasAktif?->pivot->tanggal_masuk ?? now()->startOfYear();
        $absensiStats = Absensi::where('siswa_id', $siswa->id)
            ->where('tanggal', '>=', $tanggalMasuk)
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "Hadir" THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status = "Sakit" THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status = "Izin" THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status = "Alpa" THEN 1 ELSE 0 END) as alpa
            ')
            ->first();

        $persentaseKehadiran = $absensiStats && $absensiStats->total > 0
            ? round(($absensiStats->hadir / $absensiStats->total) * 100, 1)
            : 0;

        // Data orang tua — skema baru: satu baris per individu (ayah/ibu/wali)
        $dataOrangTua = $siswa->orangTua->map(function ($ortu) {
            return [
                'orang_tua_id' => $ortu->id,
                'nik' => $ortu->nik,
                'nama' => $ortu->nama,
                'hubungan' => $ortu->hubungan,
                'no_hp' => $ortu->no_hp,
                'pekerjaan' => $ortu->pekerjaan,
                'pendidikan' => $ortu->pendidikan,
                'penghasilan' => $ortu->penghasilan,
            ];
        });

        unset($siswa->orangTua);
        unset($siswa->kelasAktif);

        return response()->json([
            'success' => true,
            'data' => [
                'siswas' => $siswa,
                'orang_tuas' => $dataOrangTua,
                'riwayat_kelas' => $riwayatKelas,
                'statistik_absensi' => [
                    'total' => $absensiStats?->total ?? 0,
                    'hadir' => $absensiStats?->hadir ?? 0,
                    'sakit' => $absensiStats?->sakit ?? 0,
                    'izin' => $absensiStats?->izin ?? 0,
                    'alpa' => $absensiStats?->alpa ?? 0,
                    'persentase_kehadiran' => $persentaseKehadiran,
                ],
            ],
        ]);
    }

    // -------------------------------------------------------
    // DAFTAR KELAS (untuk filter)
    // -------------------------------------------------------
    public function daftarKelasFilter()
    {
        $kelas = Kelas::where('is_active', 1)
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'tingkat']);

        return response()->json([
            'success' => true,
            'data' => $kelas,
        ]);
    }

    // -------------------------------------------------------
    // PROFIL KEPSEK
    // -------------------------------------------------------
    public function profil(Request $request)
    {
        $user = $request->user()->load('kepsekProfile');

        $nuptk = $user->kepsekProfile?->nuptk;

        $masterGuru = null;
        if ($nuptk) {
            $masterGuru = Guru::where('nuptk', $nuptk)->first();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'nama' => $user->name,
                    'no_hp' => $user->guru?->no_hp,
                    'foto' => $user->foto,
                ],
                'kepsek' => [
                    'nuptk' => $user->kepsekProfile?->nuptk,
                    'no_sk' => $user->kepsekProfile?->no_sk,
                    'tmt_jabatan' => $user->kepsekProfile?->tmt_jabatan,
                ],
                'master' => $masterGuru,
            ],
        ]);
    }

    // -------------------------------------------------------
    // UPDATE PROFIL KEPSEK
    // -------------------------------------------------------
    public function updateProfil(UpdateProfilKepsekRequest $request)
    {
        $user = User::find($request->user()->id);

        if ($request->filled('password_baru')) {
            if (!$request->filled('password_lama')) {
                return response()->json(['success' => false, 'message' => 'Password lama wajib diisi.'], 400);
            }
            if (!\Illuminate\Support\Facades\Hash::check($request->password_lama, $user->password)) {
                return response()->json(['success' => false, 'message' => 'Password lama tidak cocok.'], 400);
            }
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password_baru);
        }

        if ($request->filled('email'))
            $user->email = $request->email;
        if ($request->filled('no_hp') && $user->guru) {
            $user->guru->no_hp = $request->no_hp;
            $user->guru->save();
        }

        if ($request->hasFile('foto')) {
            if ($user->foto && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->foto)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->foto);
            }
            $path = $request->file('foto')->store('foto-kepsek', 'public');
            $user->foto = $path;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user,
        ]);
    }
}