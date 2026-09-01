<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kelas\AddSiswaKelasRequest;
use App\Http\Requests\Kelas\RemoveSiswaKelasRequest;
use App\Http\Requests\Kelas\StoreKelasRequest;
use App\Http\Requests\Kelas\UpdateKelasRequest;
use App\Models\Kelas;
use App\Models\RiwayatKelas;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterDataKelasController extends Controller
{
    public function index(Request $request)
    {
        $tahunAjaranAktif = \App\Models\TahunAjaran::where('is_active', true)->value('id');
        $filterTaId = $request->tahun_ajaran_id ?? $tahunAjaranAktif;
        $perPage = (int) ($request->per_page ?? 10);

        $kelas = Kelas::with(['wali:id,nama,nuptk', 'tahunAjaran:id,tahun', 'semester:id,nama', 'programPendidikan:id,ulid,nama,kode'])
            ->when($filterTaId, fn($q) => $q->where('tahun_ajaran_id', $filterTaId))
            ->when($request->tingkat, fn($q) => $q->where('tingkat', $request->tingkat))
            ->when($request->semester, fn($q) => $q->whereHas('semester', fn($s) => $s->where('nama', $request->semester)))
            ->when($request->search, fn($q) => $q->where(function ($s) use ($request) {
                $s->where('nama_kelas', 'like', "%{$request->search}%");
            }))
            ->orderBy('tingkat')->orderBy('nama_kelas')
            ->paginate($perPage);

        $kelas->getCollection()->transform(function ($k) {
            $k->total_siswa = RiwayatKelas::where('kelas_id', $k->id)->aktif()->count();
            return $k;
        });

        return $this->success($kelas);
    }

    public function show($id)
    {
        $kelas = Kelas::with(['wali:id,nama,nuptk', 'tahunAjaran:id,tahun', 'semester:id,nama', 'programPendidikan:id,ulid,nama,kode'])->findOrFail($id);

        $siswaAktif = RiwayatKelas::with('siswa')->where('kelas_id', $id)->aktif()->orderBy('no_absen')->get();
        $siswaKeluar = RiwayatKelas::with('siswa')->where('kelas_id', $id)->whereNotNull('tanggal_keluar')->orderByDesc('tanggal_keluar')->get();

        return $this->success(array_merge($kelas->toArray(), [
            'total_siswa' => $siswaAktif->count(),
            'siswas' => $siswaAktif,
            'siswa_keluar' => $siswaKeluar,
        ]));
    }

    public function store(StoreKelasRequest $request)
    {
        $tahunAjaranAktif = \App\Models\TahunAjaran::where('is_active', true)->first();
        $semesterAktif = \App\Models\Semester::where('is_active', true)->first();

        if (!$request->tahun_ajaran_id && !$tahunAjaranAktif) {
            return $this->error('Belum ada Tahun Ajaran aktif. Silakan aktifkan Tahun Ajaran terlebih dahulu.', 'NO_ACTIVE_TAHUN_AJARAN', 422);
        }

        $kelas = Kelas::create([
            'tahun_ajaran_id' => $request->tahun_ajaran_id ?? $tahunAjaranAktif->id,
            'semester_id' => $request->semester_id ?? $semesterAktif?->id,
            'nama_kelas' => $request->nama_kelas,
            'tingkat' => $request->tingkat,
            'program_pendidikan_id' => $request->program_pendidikan_id,
            'kurikulum' => $request->kurikulum,
            'wali_kelas_id' => $request->wali_kelas_id,
            'kapasitas' => $request->kapasitas,
            'ruangan' => $request->ruangan,
            'is_active' => 1,
        ]);

        return $this->created($kelas, 'Kelas berhasil ditambahkan.');
    }

    public function update(UpdateKelasRequest $request, $id)
    {
        $kelas = Kelas::findOrFail($id);

        $kelas->update([
            'tahun_ajaran_id' => $request->tahun_ajaran_id ?? $kelas->tahun_ajaran_id,
            'semester_id' => $request->semester_id ?? $kelas->semester_id,
            'nama_kelas' => $request->nama_kelas,
            'tingkat' => $request->tingkat,
            // program_pendidikan_id boleh di-null-kan (sekolah ubah jenjang kelas)
            'program_pendidikan_id' => $request->has('program_pendidikan_id') ? $request->program_pendidikan_id : $kelas->program_pendidikan_id,
            'kurikulum' => $request->kurikulum,
            'wali_kelas_id' => $request->has('wali_kelas_id') ? $request->wali_kelas_id : $kelas->wali_kelas_id,
            'kapasitas' => $request->kapasitas ?? $kelas->kapasitas,
            'ruangan' => $request->ruangan ?? $kelas->ruangan,
            'is_active' => $request->has('is_active') ? $request->is_active : $kelas->is_active,
        ]);

        return $this->success(
            $kelas->fresh(['wali:id,nama,nuptk', 'tahunAjaran:id,tahun', 'semester:id,nama', 'programPendidikan:id,ulid,nama,kode']),
            'Kelas berhasil diperbarui.'
        );
    }

    public function destroy($id)
    {
        $kelas = Kelas::findOrFail($id);
        $adaSiswa = RiwayatKelas::where('kelas_id', $id)->aktif()->exists();

        if ($adaSiswa) {
            return $this->error('Kelas masih memiliki siswa aktif.', 'KELAS_HAS_SISWA', 422);
        }

        $kelas->delete();
        return $this->success(null, 'Kelas berhasil dihapus.');
    }

    public function dropdown()
    {
        $kelas = Kelas::where('is_active', 1)->orderBy('tingkat')->orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tingkat']);
        return $this->success($kelas);
    }

    public function tahunAjaranDropdown()
    {
        $data = TahunAjaran::orderByDesc('is_active')->orderByDesc('id')->get(['id', 'tahun', 'is_active']);
        return $this->success($data);
    }

    public function riwayatAkademik($id)
    {
        $kelas = Kelas::with(['wali:id,nama,nuptk,foto', 'tahunAjaran:id,tahun,is_active', 'semester:id,nama'])->findOrFail($id);

        $tahunAjaranIds = RiwayatKelas::where('kelas_id', $id)->whereNotNull('tahun_ajaran_id')->distinct()->pluck('tahun_ajaran_id');
        if ($kelas->tahun_ajaran_id && !$tahunAjaranIds->contains($kelas->tahun_ajaran_id)) {
            $tahunAjaranIds->push($kelas->tahun_ajaran_id);
        }

        $tahunAjarans = \App\Models\TahunAjaran::with('semesters')->whereIn('id', $tahunAjaranIds)->orderByDesc('id')->get();

        $riwayat = $tahunAjarans->map(function ($ta) use ($id, $kelas) {
            $wali = \App\Models\UserWaliKelas::with('guru:id,nama,nuptk,foto')->where('kelas_id', $id)->where('tahun_ajaran_id', $ta->id)->first();
            $waliNama = $wali?->guru?->nama ?? ($ta->is_active ? $kelas->wali?->nama : null);
            $jumlahSiswa = RiwayatKelas::where('kelas_id', $id)->where('tahun_ajaran_id', $ta->id)->whereNull('tanggal_keluar')->whereNotIn('jenis_perubahan', ['mutasi_keluar', 'lulus', 'nonaktif', 'meninggal'])->count();

            return [
                'tahun_ajaran_id' => $ta->id,
                'tahun_ajaran' => $ta->tahun,
                'is_active' => (bool) $ta->is_active,
                'wali_nama' => $waliNama,
                'wali_foto' => $wali?->guru?->foto,
                'jumlah_siswa' => $jumlahSiswa,
            ];
        });

        $riwayatWali = \App\Models\UserWaliKelas::with(['guru:id,nama,nuptk,foto', 'tahunAjaran:id,tahun,is_active'])->where('kelas_id', $id)->orderByDesc('tahun_ajaran_id')->get()->map(function ($w) {
            return ['guru_nama' => $w->guru?->nama, 'guru_foto' => $w->guru?->foto, 'tahun_ajaran' => $w->tahunAjaran?->tahun, 'is_active' => (bool) $w->tahunAjaran?->is_active];
        });

        return $this->success([
            'kelas' => $kelas,
            'riwayat_akademik' => $riwayat->values(),
            'riwayat_wali' => $riwayatWali->values(),
            'stats' => [
                'total_tahun' => $tahunAjaranIds->count(),
                'total_siswa_unik' => RiwayatKelas::where('kelas_id', $id)->distinct('siswa_id')->count('siswa_id'),
                'total_wali' => \App\Models\UserWaliKelas::where('kelas_id', $id)->count(),
            ],
        ]);
    }

    public function showPeriode($kelasId, $tahunAjaranId)
    {
        $kelas = Kelas::with(['wali:id,nama,nuptk', 'tahunAjaran:id,tahun', 'semester:id,nama'])->findOrFail($kelasId);
        $waliPeriode = \App\Models\UserWaliKelas::with('guru:id,nama,nuptk,foto')->where('kelas_id', $kelasId)->where('tahun_ajaran_id', $tahunAjaranId)->first();
        $tahunAjaran = \App\Models\TahunAjaran::with('semesters')->findOrFail($tahunAjaranId);
        $siswaList = RiwayatKelas::with(['siswa:id,nama_lengkap,nisn,jenis_kelamin,foto', 'semester:id,nama'])->where('kelas_id', $kelasId)->where('tahun_ajaran_id', $tahunAjaranId)->orderBy('no_absen')->get();

        $siswaAktif = $siswaList->whereNull('tanggal_keluar')->values();
        $siswaKeluar = $siswaList->whereNotNull('tanggal_keluar')->values();

        return $this->success([
            'kelas' => $kelas,
            'tahun_ajaran' => $tahunAjaran,
            'wali_periode' => $waliPeriode,
            'siswa_aktif' => $siswaAktif,
            'siswa_keluar' => $siswaKeluar,
            'total_siswa' => $siswaAktif->count(),
            'total_laki' => $siswaAktif->filter(fn($r) => $r->siswa?->jenis_kelamin === 'L')->count(),
            'total_perempuan' => $siswaAktif->filter(fn($r) => $r->siswa?->jenis_kelamin === 'P')->count(),
        ]);
    }

    public function tambahSiswa(AddSiswaKelasRequest $request, $id)
    {
        Kelas::findOrFail($id);

        $sudahAda = RiwayatKelas::where('kelas_id', $id)->where('siswa_id', $request->siswa_id)->aktif()->exists();
        if ($sudahAda) {
            return $this->error('Siswa sudah terdaftar di kelas ini.', 'SISWA_ALREADY_IN_KELAS', 422);
        }

        $noAbsen = (RiwayatKelas::where('kelas_id', $id)->aktif()->max('no_absen') ?? 0) + 1;
        $kelas = Kelas::find($id);

        RiwayatKelas::create([
            'siswa_id' => $request->siswa_id,
            'kelas_id' => $id,
            'nama_kelas_snapshot' => $kelas->nama_kelas,
            'tahun_ajaran_id' => $kelas->tahun_ajaran_id,
            'semester_id' => $kelas->semester_id,
            'no_absen' => $noAbsen,
            'tanggal_masuk' => now()->toDateString(),
            'jenis_perubahan' => $request->jenis_perubahan,
        ]);

        return $this->created(null, 'Siswa berhasil ditambahkan ke kelas.');
    }

    public function keluarkanSiswa(RemoveSiswaKelasRequest $request, $id, $riwayatId)
    {
        $riwayat = RiwayatKelas::where('id', $riwayatId)->where('kelas_id', $id)->firstOrFail();
        $riwayat->update([
            'tanggal_keluar' => now()->toDateString(),
            'jenis_perubahan' => $request->jenis_perubahan,
            'catatan' => $request->catatan,
        ]);

        return $this->success(null, 'Siswa berhasil dikeluarkan dari kelas.');
    }

    public function batalkanKeluar($id, $riwayatId)
    {
        $riwayat = RiwayatKelas::where('id', $riwayatId)->where('kelas_id', $id)->firstOrFail();
        $riwayat->update(['tanggal_keluar' => null, 'jenis_perubahan' => 'masuk_kembali', 'catatan' => null]);

        return $this->success(null, 'Status siswa dikembalikan ke aktif.');
    }
}