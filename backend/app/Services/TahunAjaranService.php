<?php

namespace App\Services;

use App\Models\Absensi;
use App\Models\Guru;
use App\Models\GuruMutasi;
use App\Models\JadwalPelajaran;
use App\Models\KalenderAkademik;
use App\Models\Kelas;
use App\Models\Pengaturan;
use App\Models\MataPelajaran;
use App\Models\PlotGuruMapel;
use App\Models\RiwayatKelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\ActivityLog;
use Carbon\Carbon;

class TahunAjaranService
{
    /**
     * Bangun payload lengkap untuk detail satu tahun ajaran.
     * Termasuk kelas, kalender, checklist, aktivitas, dan absensi rekap per semester.
     */
    public function buildDetail(TahunAjaran $tahunAjaran): array
    {
        $id = $tahunAjaran->id;
        $semesters = $tahunAjaran->semesters;

        $ganjil = $semesters->firstWhere('nama', 'Ganjil');
        $genap = $semesters->firstWhere('nama', 'Genap');

        // ── Pengaturan kepsek (1 query) ───────────────────────────────────────
        $pengaturan = Pengaturan::whereIn('key', ['kepala_madrasah', 'nip_kepala_madrasah'])
            ->pluck('value', 'key');
        $kepsekNama = $pengaturan->get('kepala_madrasah', '');
        $kepsekNip = $pengaturan->get('nip_kepala_madrasah', '');

        // ── Hari libur dari kalender_akademiks ────────────────────────────────
        $kalenderRows = KalenderAkademik::where('tahun_ajaran_id', $id)
            ->orderBy('tanggal_mulai')
            ->get(['id', 'judul', 'jenis', 'tanggal_mulai', 'tanggal_selesai', 'is_nasional']);

        $totalHariLibur = $kalenderRows
            ->where('jenis', 'libur')
            ->sum(function ($k) {
                $mulai = Carbon::parse($k->tanggal_mulai);
                $selesai = $k->tanggal_selesai
                    ? Carbon::parse($k->tanggal_selesai)
                    : $mulai;
                return $mulai->diffInDays($selesai) + 1;
            });

        // ── Status tutup buku ─────────────────────────────────────────────────
        $sudahNaikKelas = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->where('jenis_perubahan', 'naik_kelas')
            ->exists();

        // ── Daftar kelas + total siswa aktif ─────────────────────────────────
        // Ambil semua siswa count dalam 1 query (hindari N+1)
        $siswaPerKelas = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->aktif()
            ->selectRaw('kelas_id, COUNT(*) as jumlah')
            ->groupBy('kelas_id')
            ->pluck('jumlah', 'kelas_id');

        $kelasList = Kelas::with(['wali:id,nuptk,nama', 'semester:id,nama'])
            ->where('tahun_ajaran_id', $id)
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get()
            ->map(function ($k) use ($siswaPerKelas) {
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
                    'total_siswa' => $siswaPerKelas[$k->id] ?? 0,
                ];
            });

        // ── Distribusi per tingkat ────────────────────────────────────────────
        $distribusiTingkat = $kelasList
            ->groupBy('tingkat')
            ->map(fn($group, $tingkat) => [
                'tingkat' => $tingkat,
                'jumlah_kelas' => $group->count(),
                'jumlah_siswa' => $group->sum('total_siswa'),
            ])
            ->values();

        // ── Statistik pengajar & jadwal ───────────────────────────────────────
        $semesterIds = $semesters->pluck('id');

        $totalGuruMengajar = PlotGuruMapel::where('tahun_ajaran_id', $id)
            ->where('is_active', true)
            ->distinct('guru_id')
            ->count('guru_id');

        $totalMapel = PlotGuruMapel::where('tahun_ajaran_id', $id)
            ->where('is_active', true)
            ->distinct('mapel_id')
            ->count('mapel_id');

        // ── Mutasi siswa ──────────────────────────────────────────────────────
        $totalSiswaTransfer = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->where('jenis_perubahan', 'mutasi_keluar')
            ->count();

        $totalSiswaNonaktif = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->whereIn('jenis_perubahan', ['nonaktif', 'meninggal'])
            ->count();

        // ── Ringkasan Siswa: gender breakdown ─────────────────────────────────
        $siswaAktifIds = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->aktif()
            ->distinct('siswa_id')
            ->pluck('siswa_id');

        $genderCounts = Siswa::whereIn('id', $siswaAktifIds)
            ->selectRaw("jenis_kelamin, COUNT(*) as jumlah")
            ->groupBy('jenis_kelamin')
            ->pluck('jumlah', 'jenis_kelamin');

        $totalSiswaLaki = (int) ($genderCounts->get('L', 0) + $genderCounts->get('Laki-laki', 0));
        $totalSiswaPerempuan = (int) ($genderCounts->get('P', 0) + $genderCounts->get('Perempuan', 0));

        // ── Ringkasan Siswa: masuk / keluar / naik / tidak naik ───────────────
        $totalSiswaMasuk = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->whereIn('jenis_perubahan', ['masuk_baru', 'pindahan', 'awal'])
            ->distinct('siswa_id')
            ->count('siswa_id');

        $totalSiswaKeluar = $totalSiswaTransfer + $totalSiswaNonaktif;

        $totalSiswaNaik = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->where('jenis_perubahan', 'naik_kelas')
            ->count();

        $totalSiswaTidakNaik = RiwayatKelas::where('tahun_ajaran_id', $id)
            ->where('jenis_perubahan', 'tinggal_kelas')
            ->count();

        // ── Ringkasan Guru: tetap / honorer / tanpa tugas ─────────────────────
        $guruMengajarIds = PlotGuruMapel::where('tahun_ajaran_id', $id)
            ->where('is_active', true)
            ->distinct('guru_id')
            ->pluck('guru_id');

        $guruStatusCounts = Guru::whereIn('id', $guruMengajarIds)
            ->selectRaw("status_kepegawaian, COUNT(*) as jumlah")
            ->groupBy('status_kepegawaian')
            ->pluck('jumlah', 'status_kepegawaian');

        // PNS, PPPK = tetap; GTY, Honorer, Kontrak, dll = honorer
        $statusTetap = ['PNS', 'PPPK', 'ASN'];
        $totalGuruTetap = $guruStatusCounts->filter(
            fn($v, $k) => in_array($k, $statusTetap)
        )->sum();
        $totalGuruHonorer = $guruStatusCounts->filter(
            fn($v, $k) => !in_array($k, $statusTetap)
        )->sum();

        // Guru aktif (status_aktif = true) tapi tidak mengajar di TA ini
        $totalGuruTanpaTugas = Guru::where('status_aktif', true)
            ->whereNotIn('id', $guruMengajarIds)
            ->count();

        // ── Ringkasan Guru: mutasi masuk ──────────────────────────────────────
        $totalGuruMutasiMasuk = 0;
        $periodeStart = $ganjil?->tgl_mulai;
        $periodeEnd = $genap?->tgl_selesai ?? $ganjil?->tgl_selesai;
        if ($periodeStart && $periodeEnd) {
            $totalGuruMutasiMasuk = GuruMutasi::where('jenis_mutasi', 'masuk')
                ->whereBetween('tanggal_mutasi', [
                    Carbon::parse($periodeStart),
                    Carbon::parse($periodeEnd),
                ])
                ->count();
        }

        // ── Mata pelajaran: list + wajib/lokal ────────────────────────────────
        $mapelList = MataPelajaran::select(['id', 'kode', 'nama_mapel', 'kelompok', 'tingkat', 'kurikulum', 'jam_per_minggu'])
            ->where('is_active', true)
            ->orderBy('nama_mapel')
            ->take(8)
            ->get();

        $mapelKelompokCounts = MataPelajaran::where('is_active', true)
            ->selectRaw("kelompok, COUNT(*) as jumlah")
            ->groupBy('kelompok')
            ->pluck('jumlah', 'kelompok');

        // kelompok: A/B = wajib, C = muatan lokal (konvensi umum)
        $totalMapelWajib = (int) ($mapelKelompokCounts->filter(
            fn($v, $k) => in_array(strtoupper($k), ['A', 'B', 'WAJIB'])
        )->sum());
        $totalMapelLokal = (int) ($mapelKelompokCounts->filter(
            fn($v, $k) => in_array(strtoupper($k), ['C', 'LOKAL', 'MUATAN LOKAL'])
        )->sum());

        $totalWaliKelas = $kelasList->filter(fn($k) => $k['nama_wali'] !== '-')->count();
        $totalRuangan = $kelasList->filter(fn($k) => !empty($k['ruangan']))->pluck('ruangan')->unique()->count();
        $totalJadwal = JadwalPelajaran::whereIn('semester_id', $semesterIds)
            ->where('is_active', true)
            ->count();

        // ── Hari efektif ──────────────────────────────────────────────────────
        $tglMulai = $ganjil?->tgl_mulai;
        $tglSelesai = $genap?->tgl_selesai ?? $ganjil?->tgl_selesai;
        $hariTotal = ($tglMulai && $tglSelesai)
            ? (int) Carbon::parse($tglMulai)->diffInDays(Carbon::parse($tglSelesai))
            : null;
        $hariEfektif = $hariTotal !== null ? max(0, $hariTotal - $totalHariLibur) : null;

        // ── Aktivitas log ─────────────────────────────────────────────────────
        $aktivitas = ActivityLog::with('user:id,username')
            ->where('module', 'tahun_ajaran')
            ->where('subject_id', $id)
            ->latest()
            ->take(8)
            ->get(['id', 'user_id', 'action', 'keterangan', 'created_at']);

        // ── Navigasi prev/next TA ─────────────────────────────────────────────
        $allTA = TahunAjaran::orderBy('tahun')->pluck('tahun', 'id');
        $taIds = $allTA->keys()->values();
        $curIdx = $taIds->search($tahunAjaran->id);
        $taPrev = $curIdx > 0
            ? TahunAjaran::find($taIds[$curIdx - 1], ['id', 'tahun', 'is_active'])
            : null;
        $taNext = ($curIdx !== false && $curIdx < $taIds->count() - 1)
            ? TahunAjaran::find($taIds[$curIdx + 1], ['id', 'tahun', 'is_active'])
            : null;

        // ── Checklist kesiapan ────────────────────────────────────────────────
        $checklist = [
            'ta_dibuat' => true,
            'semester_dibuat' => $semesters->count() >= 2,
            'rombel_dibuat' => $kelasList->count() > 0,
            'guru_mengajar' => $totalGuruMengajar > 0,
            'mapel_lengkap' => $totalMapel > 0,
            'wali_kelas' => $totalWaliKelas > 0,
            'jadwal_selesai' => $totalJadwal > 0,
            'kalender' => $kalenderRows->count() > 0,
            'siswa_terdistribusi' => $kelasList->sum('total_siswa') > 0,
            'kepsek_dikunci' => !empty($kepsekNama),
        ];

        // ── Absensi rekap per semester ────────────────────────────────────────
        $absensiRekap = $this->buildAbsensiRekap($id, $semesterIds);

        // ── Mutasi model (data untuk response) ───────────────────────────────
        $tahunAjaran->nama = $tahunAjaran->tahun;
        $tahunAjaran->tanggal_mulai = $ganjil?->tgl_mulai;
        $tahunAjaran->tanggal_selesai = $tglSelesai;
        $tahunAjaran->semester_aktif = $semesters->firstWhere('is_active', true)?->nama;
        $tahunAjaran->kepsek_nama = $kepsekNama;
        $tahunAjaran->kepsek_nip = $kepsekNip;
        $tahunAjaran->total_hari_libur = $totalHariLibur;
        $tahunAjaran->total_hari_efektif = $hariEfektif;
        $tahunAjaran->is_tutup_buku = $sudahNaikKelas;

        return [
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
            'kalender' => $kalenderRows,
            'aktivitas' => $aktivitas,
            'ta_prev' => $taPrev,
            'ta_next' => $taNext,
            'checklist' => $checklist,
            'absensi_rekap' => $absensiRekap,
            'total_siswa_transfer' => $totalSiswaTransfer,
            'total_siswa_nonaktif' => $totalSiswaNonaktif,
            'mapel_list' => $mapelList,
            // ── Ringkasan Tahunan (BUG 3 fix) ─────────────────────────────
            'total_siswa_laki' => $totalSiswaLaki,
            'total_siswa_perempuan' => $totalSiswaPerempuan,
            'total_siswa_masuk' => $totalSiswaMasuk,
            'total_siswa_keluar' => $totalSiswaKeluar,
            'total_siswa_naik' => $totalSiswaNaik,
            'total_siswa_tidak_naik' => $totalSiswaTidakNaik,
            'total_guru_tetap' => $totalGuruTetap,
            'total_guru_honorer' => $totalGuruHonorer,
            'total_guru_tanpa_tugas' => $totalGuruTanpaTugas,
            'total_guru_mutasi_masuk' => $totalGuruMutasiMasuk,
            'total_mapel_wajib' => $totalMapelWajib,
            'total_mapel_lokal' => $totalMapelLokal,
            // Penilaian & Rapor belum diimplementasi (Phase 3) — null agar
            // frontend menampilkan empty state yang sudah tersedia.
            'penilaian_rekap' => null,
            'rapor_rekap' => null,
            'kenaikan_kelas' => null,
        ];
    }

    /**
     * Hitung rekap absensi untuk semua semester dalam satu tahun ajaran.
     * Mengembalikan null jika belum ada data absensi sama sekali.
     */
    private function buildAbsensiRekap(int $tahunAjaranId, \Illuminate\Support\Collection $semesterIds): ?array
    {
        if ($semesterIds->isEmpty()) {
            return null;
        }

        // Ambil semua absensi TA ini dalam 1 query
        $rows = Absensi::where('tahun_ajaran_id', $tahunAjaranId)
            ->whereIn('semester_id', $semesterIds)
            ->selectRaw('status, siswa_id, COUNT(*) as jumlah')
            ->groupBy('status', 'siswa_id')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $hadir = (int) $rows->where('status', 'Hadir')->sum('jumlah');
        $sakit = (int) $rows->where('status', 'Sakit')->sum('jumlah');
        $izin = (int) $rows->where('status', 'Izin')->sum('jumlah');
        $alpa = (int) $rows->where('status', 'Alpa')->sum('jumlah');

        // Siswa unik yang punya data absensi
        $siswaIds = $rows->pluck('siswa_id')->unique();
        $siswaAdaData = $siswaIds->count();

        // Siswa yang alpa-nya tinggi (>= 10% dari total pertemuan mereka)
        $siswaBermasalah = $rows
            ->groupBy('siswa_id')
            ->filter(function ($group) {
                $totalPertemuan = $group->sum('jumlah');
                $totalAlpa = $group->where('status', 'Alpa')->sum('jumlah');
                return $totalPertemuan > 0 && ($totalAlpa / $totalPertemuan) >= 0.1;
            })
            ->count();

        // total_siswa dari riwayat_kelas tidak diquery ulang di sini —
        // ditentukan dari kelasList di buildDetail(). Tapi kita butuh angka
        // untuk siswa_belum_data, jadi kita pakai count siswa yang ada di riwayat
        // dengan absensi pada TA ini vs total riwayat aktif TA ini.
        $totalSiswaTA = RiwayatKelas::where('tahun_ajaran_id', $tahunAjaranId)
            ->aktif()
            ->distinct('siswa_id')
            ->count('siswa_id');

        $siswaBelumData = max(0, $totalSiswaTA - $siswaAdaData);

        return [
            'hadir' => $hadir,
            'sakit' => $sakit,
            'izin' => $izin,
            'alpa' => $alpa,
            'total_siswa' => $totalSiswaTA,
            'siswa_ada_data' => $siswaAdaData,
            'siswa_belum_data' => $siswaBelumData,
            'siswa_bermasalah' => $siswaBermasalah,
        ];
    }
}