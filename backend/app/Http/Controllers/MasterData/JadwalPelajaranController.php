<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran; // tabel: jadwals
use Illuminate\Http\Request;

class JadwalPelajaranController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'kelas_id' => 'required|integer',
            'tahun_ajaran_id' => 'required|integer',
            'semester_id' => 'required|integer',
        ]);

        $jadwal = JadwalPelajaran::with(['mataPelajaran', 'guru'])
            ->where('kelas_id', $request->kelas_id)
            ->where('semester_id', $request->semester_id)
            ->orderBy('hari')
            ->orderBy('jam_mulai')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jadwal,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'plot_id' => 'required|integer|exists:plot_guru_mapels,id',
            'kelas_id' => 'required|integer|exists:kelas,id',
            'guru_id' => 'required|integer|exists:gurus,id',
            'mapel_id' => 'required|integer|exists:mapels,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_ke' => 'nullable|integer',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
        ]);

        if ($bentrok = $this->cekBentrok($request)) {
            return response()->json($bentrok, 422);
        }

        $jadwal = JadwalPelajaran::create(
            $request->only(['plot_id', 'kelas_id', 'guru_id', 'mapel_id', 'semester_id', 'hari', 'jam_ke', 'jam_mulai', 'jam_selesai'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pelajaran berhasil ditambahkan.',
            'data' => $jadwal->load(['mataPelajaran', 'guru']),
        ], 201);
    }
    public function update(Request $request, $id)
    {
        $jadwal = JadwalPelajaran::findOrFail($id);

        $request->validate([
            'plot_id' => 'required|integer|exists:plot_guru_mapels,id',
            'kelas_id' => 'required|integer|exists:kelas,id',
            'guru_id' => 'required|integer|exists:gurus,id',
            'mapel_id' => 'required|integer|exists:mapels,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_ke' => 'nullable|integer',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
        ]);

        if ($bentrok = $this->cekBentrok($request, $id)) {
            return response()->json($bentrok, 422);
        }

        $jadwal->update(
            $request->only(['plot_id', 'kelas_id', 'guru_id', 'mapel_id', 'semester_id', 'hari', 'jam_ke', 'jam_mulai', 'jam_selesai'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pelajaran berhasil diperbarui.',
            'data' => $jadwal->load(['mataPelajaran', 'guru']),
        ]);
    }

    public function destroy($id)
    {
        $jadwal = JadwalPelajaran::findOrFail($id);
        $jadwal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pelajaran berhasil dihapus.',
        ]);
    }

    private function cekBentrok(Request $request, $ignoreId = null)
    {
        // 1. Cek Bentrok Kelas (Tidak boleh ada jadwal lain di kelas ini pada waktu yg sama)
        $bentrokKelas = JadwalPelajaran::where('kelas_id', $request->kelas_id)
            ->where('hari', $request->hari)
            ->where('semester_id', $request->semester_id)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->where(function ($query) use ($request) {
                $query->where('jam_mulai', '<', $request->jam_selesai)
                    ->where('jam_selesai', '>', $request->jam_mulai);
            })->with('mataPelajaran')->first();

        if ($bentrokKelas) {
            $namaMapel = $bentrokKelas->mataPelajaran->nama_mapel ?? 'Mapel lain';
            return [
                'success' => false,
                'message' => "Jadwal bentrok dengan {$namaMapel} di kelas ini pada pukul " .
                    date('H:i', strtotime($bentrokKelas->jam_mulai)) . " - " .
                    date('H:i', strtotime($bentrokKelas->jam_selesai)) . ".",
            ];
        }

        // 2. Cek Bentrok Guru (Guru tidak boleh mengajar di kelas lain pada waktu yg sama)
        $bentrokGuru = JadwalPelajaran::where('guru_id', $request->guru_id)
            ->where('hari', $request->hari)
            ->where('semester_id', $request->semester_id)

            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->where(function ($query) use ($request) {
                $query->where('jam_mulai', '<', $request->jam_selesai)
                    ->where('jam_selesai', '>', $request->jam_mulai);
            })->with('kelas')->first();

        if ($bentrokGuru) {
            $namaKelas = $bentrokGuru->kelas->nama_kelas ?? 'Kelas lain';
            return [
                'success' => false,
                'message' => "Guru tersebut sudah memiliki jadwal mengajar di {$namaKelas} pada pukul " .
                    date('H:i', strtotime($bentrokGuru->jam_mulai)) . " - " .
                    date('H:i', strtotime($bentrokGuru->jam_selesai)) . ".",
            ];
        }

        return false;
    }
}