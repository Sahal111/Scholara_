<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\Siswa\StoreSiswaRequest;
use App\Http\Requests\Siswa\UpdateSiswaRequest;
use App\Models\OrangTua;
use App\Models\Siswa;
use App\Models\RiwayatKelas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterDataSiswaController extends Controller
{
    public function orangTuaOptions(Request $request)
    {
        $search = $request->query('search');
        $searchBy = $request->query('search_by', 'all'); // all, nik, no_kk, nama, no_hp, nisn

        $query = OrangTua::query()
            ->with('siswa:id,nisn,nama,no_kk')
            ->when($search, function ($query) use ($search, $searchBy) {
                $query->where(function ($q) use ($search, $searchBy) {
                    switch ($searchBy) {
                        case 'nik':
                            // NIK dienkripsi — tidak bisa LIKE. Hanya exact match (dekripsi di app layer).
                            // Untuk keperluan pencarian, gunakan nama atau no_hp sebagai proxy.
                            // TODO: Implementasikan hash index (SHA256 NIK) untuk exact-match search.
                            $q->where('nama', 'like', "%{$search}%");
                            break;

                        case 'no_kk':
                            // no_kk dienkripsi — fallback ke nama siswa
                            $q->whereHas('siswa', function ($siswaQuery) use ($search) {
                                $siswaQuery->where('nama', 'like', "%{$search}%");
                            });
                            break;

                        case 'nama':
                            $q->where('nama', 'like', "%{$search}%");
                            break;

                        case 'no_hp':
                            $q->where('no_hp', 'like', "%{$search}%");
                            break;

                        case 'nisn':
                            // NISN dienkripsi — cari via nama siswa saja
                            $q->whereHas('siswa', function ($siswaQuery) use ($search) {
                                $siswaQuery->where('nama', 'like', "%{$search}%");
                            });
                            break;

                        default:
                            // NIK dan NISN terenkripsi — tidak bisa di-LIKE
                            // Hanya search kolom plain-text
                            $q->where('nama', 'like', "%{$search}%")
                                ->orWhere('no_hp', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhereHas('siswa', function ($siswaQuery) use ($search) {
                                $siswaQuery->where('nama', 'like', "%{$search}%");
                            });
                    }
                });
            })
            ->orderBy('nama');

        $data = $request->boolean('paginate')
            ? $query->paginate(15)
            : $query->limit(10)->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dropdown ringan — hanya id, nama, nisn, dan kelas aktif.
     * Digunakan oleh form tambah peminjaman, konseling, dsb.
     */
    public function dropdown(Request $request)
    {
        $query = Siswa::query()
            ->select('id', 'nama', 'nisn')
            ->with(['kelasAktif:id,nama_kelas'])
            ->when($request->search, fn($q) => $q->where('nama', 'like', "%{$request->search}%")
                ->orWhere('nisn', 'like', "%{$request->search}%"))
            ->when($request->kelas_id, fn($q) => $q->whereHas('kelasAktif', fn($k) => $k->where('kelas_id', $request->kelas_id)))
            ->orderBy('nama')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $query]);
    }

    public function index(Request $request)
    {
        $query = Siswa::query()
            ->with('orangTua')
            ->when($request->search, function ($q) use ($request) {
                $q->where('nama', 'like', "%{$request->search}%")
                    ->orWhere('nisn', 'like', "%{$request->search}%")
                    ->orWhere('nis', 'like', "%{$request->search}%");
            })
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('nama')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $query]);
    }

    public function show($nisn)
    {
        $siswa = Siswa::with(['kelasAktif', 'orangTua'])->where('nisn', $nisn)->firstOrFail();
        return response()->json(['success' => true, 'data' => $siswa]);
    }

    public function regenerateKodeAnak($nisn)
    {
        $siswa = Siswa::where('nisn', $nisn)->firstOrFail();
        $siswa->kode_anak = Siswa::generateKodeAnak();
        $siswa->save();

        return response()->json([
            'success' => true,
            'message' => 'Kode anak berhasil dibuat ulang.',
            'data' => ['kode_anak' => $siswa->kode_anak],
        ]);
    }

    public function store(StoreSiswaRequest $request)
    {

        $siswa = DB::transaction(function () use ($request) {
            $siswa = Siswa::create($request->only($this->siswaFields()));
            $this->syncOrangTua(
                $siswa,
                $request->input('orang_tuas', []),
                $request->nama_ibu_kandung,
                $request->filled('orang_tua_id') ? (int) $request->input('orang_tua_id') : null,
                $request->boolean('unlink_orang_tua'),
            );

            return $siswa->load('orangTua');
        });

        return response()->json([
            'success' => true,
            'message' => 'Data siswa berhasil ditambahkan.',
            'data' => $siswa,
        ], 201);
    }

    public function update(Request $request, $nisn)
    {
        $siswa = Siswa::where('nisn', $nisn)->firstOrFail();

        $request->validate([
            'nik' => 'nullable|string|size:16|unique:siswas,nik,' . $siswa->id,
            'nis' => 'nullable|string|max:20|unique:siswas,nis,' . $siswa->id,
            'no_kk' => 'nullable|string|size:16',
            'nama' => 'required|string|max:150',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date|before:today',
            'agama' => 'required|in:Islam,Kristen Protestan,Kristen Katolik,Hindu,Buddha,Konghucu,Lainnya',
            'golongan_darah' => 'nullable|in:A,B,AB,O,-',
            'kewarganegaraan' => 'required|in:WNI,WNA',
            'nama_ibu_kandung' => 'required|string|max:150',
            'nama_kepala_keluarga' => 'nullable|string|max:150',
            'anak_ke' => 'nullable|integer|min:1',
            'jumlah_saudara' => 'nullable|integer|min:0',
            'status_dalam_keluarga' => 'required|in:Kandung,Tiri,Angkat',
            'pembiaya_sekolah' => 'nullable|in:Orang Tua,Sendiri,Pemerintah,Lembaga,Lainnya',
            'kebutuhan_khusus' => 'nullable|string|max:100',
            'riwayat_penyakit' => 'nullable|string',
            'imunisasi' => 'nullable|in:Lengkap,Tidak Lengkap,Tidak Diketahui',
            'alamat_jalan' => 'required|string|max:255',
            'rt' => 'nullable|string|max:4',
            'rw' => 'nullable|string|max:4',
            'desa_kelurahan' => 'nullable|string|max:100',
            'kecamatan' => 'nullable|string|max:100',
            'kota_kabupaten' => 'nullable|string|max:100',
            'provinsi' => 'nullable|string|max:100',
            'kode_pos' => 'nullable|string|max:10',
            'jarak_tempat_tinggal' => 'nullable|numeric|min:0',
            'waktu_tempuh' => 'nullable|integer|min:0',
            'moda_transportasi' => 'nullable|string|max:50',
            'asal_sekolah' => 'nullable|string|max:200',
            'tanggal_masuk' => 'required|date',
            'tingkat' => 'nullable|integer|min:1|max:6',
            'status' => 'required|in:aktif,nonaktif,mutasi_keluar,lulus,meninggal',
            'orang_tua_id' => 'nullable|integer|exists:orang_tuas,id',
            'unlink_orang_tua' => 'nullable|boolean',
            ...$this->orangTuaValidationRules(),
        ]);

        DB::transaction(function () use ($request, $siswa) {
            $siswa->update($request->only($this->siswaFields(false)));
            $this->syncOrangTua(
                $siswa,
                $request->input('orang_tuas', []),
                $request->nama_ibu_kandung,
                $request->filled('orang_tua_id') ? (int) $request->input('orang_tua_id') : null,
                $request->boolean('unlink_orang_tua'),
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Data siswa berhasil diperbarui.',
            'data' => $siswa->fresh('orangTua'),
        ]);
    }

    private function siswaFields(bool $includeNisn = true): array
    {
        $fields = [
            'nik',
            'nis',
            'no_kk',
            'nama_kepala_keluarga',
            'nama',
            'jenis_kelamin',
            'tempat_lahir',
            'tanggal_lahir',
            'agama',
            'golongan_darah',
            'kewarganegaraan',
            'nama_ibu_kandung',
            'anak_ke',
            'jumlah_saudara',
            'status_dalam_keluarga',
            'pembiaya_sekolah',
            'kebutuhan_khusus',
            'riwayat_penyakit',
            'imunisasi',
            'alamat_jalan',
            'rt',
            'rw',
            'desa_kelurahan',
            'kecamatan',
            'kota_kabupaten',
            'provinsi',
            'kode_pos',
            'jarak_tempat_tinggal',
            'waktu_tempuh',
            'moda_transportasi',
            'asal_sekolah',
            'tanggal_masuk',
            'tingkat',
            'status',
        ];

        return $includeNisn ? ['nisn', ...$fields] : $fields;
    }

    private function orangTuaValidationRules(): array
    {
        $penghasilan = 'Tidak Berpenghasilan,< 500rb,500rb - 1jt,1jt - 2jt,2jt - 3jt,3jt - 5jt,> 5jt';
        $pendidikan = 'Tidak Sekolah,SD,SMP,SMA,D1,D2,D3,S1,S2,S3';
        $yearRule = 'nullable|integer|min:1900|max:' . now()->year;

        return [
            'orang_tuas' => 'nullable|array',
            'orang_tua.nama_ayah' => 'nullable|string|max:100',
            'orang_tua.nik_ayah' => 'nullable|string|max:16',
            'orang_tua.tahun_lahir_ayah' => $yearRule,
            'orang_tua.pendidikan_ayah' => "nullable|in:{$pendidikan}",
            'orang_tua.pekerjaan_ayah' => 'nullable|string|max:100',
            'orang_tua.penghasilan_ayah' => "nullable|in:{$penghasilan}",
            'orang_tua.nama_ibu' => 'nullable|string|max:100',
            'orang_tua.nik_ibu' => 'nullable|string|max:16',
            'orang_tua.tahun_lahir_ibu' => $yearRule,
            'orang_tua.pendidikan_ibu' => "nullable|in:{$pendidikan}",
            'orang_tua.pekerjaan_ibu' => 'nullable|string|max:100',
            'orang_tua.penghasilan_ibu' => "nullable|in:{$penghasilan}",
            'orang_tua.nama_wali' => 'nullable|string|max:100',
            'orang_tua.nik_wali' => 'nullable|string|max:16',
            'orang_tua.hubungan_wali' => 'nullable|string|max:50',
            'orang_tua.pekerjaan_wali' => 'nullable|string|max:100',
            'orang_tua.penghasilan_wali' => "nullable|in:{$penghasilan}",
            'orang_tua.no_hp_ayah' => 'nullable|string|max:20',
            'orang_tua.no_hp_ibu' => 'nullable|string|max:20',
            'orang_tua.no_hp_wali' => 'nullable|string|max:20',
            'orang_tua.email' => 'nullable|email|max:100',
            'orang_tua.alamat' => 'nullable|string',
        ];
    }

    private function syncOrangTua(Siswa $siswa, array $input, ?string $namaIbuKandung, ?int $orangTuaId = null, bool $unlink = false): void
    {
        if ($unlink) {
            $siswa->orangTua()->sync([]);

            return;
        }

        // $incoming = [
        //     'nama_ayah' => $input['nama_ayah'] ?? null,
        //     'nik_ayah' => $input['nik_ayah'] ?? null,
        //     'tanggal_lahir_ayah' => $this->yearToDate($input['tahun_lahir_ayah'] ?? null),
        //     'pendidikan_ayah' => $input['pendidikan_ayah'] ?? null,
        //     'pekerjaan_ayah' => $input['pekerjaan_ayah'] ?? null,
        //     'penghasilan_ayah' => $input['penghasilan_ayah'] ?? null,
        //     'nama_ibu' => filled($input['nama_ibu'] ?? null) ? $input['nama_ibu'] : $namaIbuKandung,
        //     'nik_ibu' => $input['nik_ibu'] ?? null,
        //     'tanggal_lahir_ibu' => $this->yearToDate($input['tahun_lahir_ibu'] ?? null),
        //     'pendidikan_ibu' => $input['pendidikan_ibu'] ?? null,
        //     'pekerjaan_ibu' => $input['pekerjaan_ibu'] ?? null,
        //     'penghasilan_ibu' => $input['penghasilan_ibu'] ?? null,
        //     'nama_wali' => $input['nama_wali'] ?? null,
        //     'nik_wali' => $input['nik_wali'] ?? null,
        //     'hubungan_wali' => $input['hubungan_wali'] ?? null,
        //     'pekerjaan_wali' => $input['pekerjaan_wali'] ?? null,
        //     'penghasilan_wali' => $input['penghasilan_wali'] ?? null,
        //     'no_hp_ayah' => $input['no_hp_ayah'] ?? null,
        //     'no_hp_ibu' => $input['no_hp_ibu'] ?? null,
        //     'no_hp_wali' => $input['no_hp_wali'] ?? null,
        //     'email' => $input['email'] ?? null,
        //     'alamat' => $input['alamat'] ?? null,
        // ];

        // Hanya field yang BENAR-BENAR diisi di submission ini yang boleh menimpa.
        // Field kosong TIDAK BOLEH menghapus data yang sudah tersimpan, karena
        // satu orang_tua bisa dipakai bareng oleh beberapa siswa (kakak-adik).

        // $filledIncoming = array_filter($incoming, fn($value) => filled($value));

        // if (empty($filledIncoming) && !$orangTuaId) {
        //     return;
        // }

        // if (empty($filledIncoming) && $orangTuaId) {
        //     // Cuma menautkan ke ortu yang sudah ada, tanpa ubah data apa pun.
        //     $siswa->orangTua()->sync([$orangTuaId]);

        //     return;
        // }

        // $orangTua = $orangTuaId
        //     ? OrangTua::findOrFail($orangTuaId)
        //     : ($siswa->orangTua()->first() ?? $this->findMatchingOrangTua($incoming));

        // if (!$orangTua) {
        //     $orangTua = OrangTua::create($incoming);
        // } else {
        //     // Merge: field yang diisi menimpa, field yang kosong tetap pakai nilai lama
        //     // -> data anak ke-2, ke-3, dst tetap sinkron & selengkap anak pertama.
        //     $orangTua->update(array_merge(
        //         $orangTua->only(array_keys($incoming)),
        //         $filledIncoming,
        //     ));
        // }
        $syncIds = [];

        if (!empty($input['nama_ayah']) || !empty($input['nik_ayah'])) {
            // NIK terenkripsi — tidak bisa pakai firstOrNew(['nik'=>...]).
            // Cari existing ortu di sekolah yang sama berdasarkan nama+hubungan,
            // atau cek pivot siswa yang sudah terhubung dengan NIK yang sama (di-decrypt app layer).
            $ayah = $this->findOrNewOrangTua(
                siswa: $siswa,
                hubungan: 'Ayah',
                nik: $input['nik_ayah'] ?? null,
                nama: $input['nama_ayah'] ?? null,
            );

            $ayah->fill([
                'nama' => $input['nama_ayah'] ?? $ayah->nama,
                'hubungan' => 'Ayah',
                'status' => 'Kandung',
                'no_hp' => $input['no_hp_ayah'] ?? $ayah->no_hp,
                'pendidikan' => $input['pendidikan_ayah'] ?? $ayah->pendidikan,
                'pekerjaan' => $input['pekerjaan_ayah'] ?? $ayah->pekerjaan,
                'penghasilan' => $input['penghasilan_ayah'] ?? $ayah->penghasilan,
                'tahun_lahir' => $input['tahun_lahir_ayah'] ?? $ayah->tahun_lahir,
                'email' => $input['email'] ?? $ayah->email,
                'alamat' => $input['alamat'] ?? $ayah->alamat,
                'nik' => $input['nik_ayah'] ?? $ayah->nik,
            ]);

            $ayah->save();

            $syncIds[] = $ayah->id;
        }
        if (!empty($input['nama_ibu']) || !empty($input['nik_ibu'])) {
            $ibu = $this->findOrNewOrangTua(
                siswa: $siswa,
                hubungan: 'Ibu',
                nik: $input['nik_ibu'] ?? null,
                nama: filled($input['nama_ibu']) ? $input['nama_ibu'] : $namaIbuKandung,
            );

            $ibu->fill([
                'nama' => filled($input['nama_ibu']) ? $input['nama_ibu'] : $namaIbuKandung,
                'hubungan' => 'Ibu',
                'status' => 'Kandung',
                'no_hp' => $input['no_hp_ibu'] ?? $ibu->no_hp,
                'pendidikan' => $input['pendidikan_ibu'] ?? $ibu->pendidikan,
                'pekerjaan' => $input['pekerjaan_ibu'] ?? $ibu->pekerjaan,
                'penghasilan' => $input['penghasilan_ibu'] ?? $ibu->penghasilan,
                'tahun_lahir' => $input['tahun_lahir_ibu'] ?? $ibu->tahun_lahir,
                'email' => $input['email'] ?? $ibu->email,
                'alamat' => $input['alamat'] ?? $ibu->alamat,
                'nik' => $input['nik_ibu'] ?? $ibu->nik,
            ]);

            $ibu->save();

            $syncIds[] = $ibu->id;
        }
        if (!empty($input['nama_wali']) || !empty($input['nik_wali'])) {
            $wali = $this->findOrNewOrangTua(
                siswa: $siswa,
                hubungan: 'Wali',
                nik: $input['nik_wali'] ?? null,
                nama: $input['nama_wali'] ?? null,
            );

            $wali->fill([
                'nama' => $input['nama_wali'] ?? $wali->nama,
                'hubungan' => 'Wali',
                'status' => $input['hubungan_wali'] ?? 'Wali',
                'no_hp' => $input['no_hp_wali'] ?? $wali->no_hp,
                'pekerjaan' => $input['pekerjaan_wali'] ?? $wali->pekerjaan,
                'penghasilan' => $input['penghasilan_wali'] ?? $wali->penghasilan,
                'email' => $input['email'] ?? $wali->email,
                'alamat' => $input['alamat'] ?? $wali->alamat,
                'nik' => $input['nik_wali'] ?? $wali->nik,
            ]);

            $wali->save();

            $syncIds[] = $wali->id;
        }
        $siswa->orangTua()->sync($syncIds);
    }

    /**
     * Cari OrangTua existing dalam sekolah yang sama, atau buat instance baru.
     *
     * NIK tersimpan terenkripsi (EncryptedString cast), sehingga tidak bisa
     * dipakai di WHERE clause langsung. Strategi:
     * 1. Cek apakah siswa ini sudah punya ortu dengan hubungan yang sama (update).
     * 2. Cari by NIK: ambil semua ortu sekolah yang sama, dekripsi di app layer,
     *    bandingkan — hanya efisien jika jumlah ortu per sekolah masih kecil.
     * 3. Fallback: buat instance baru.
     *
     * @TODO: Implementasikan `nik_hash` (SHA256 dari NIK) sebagai kolom terindeks
     *        untuk exact-match lookup yang efisien di scale besar.
     */
    private function findOrNewOrangTua(Siswa $siswa, string $hubungan, ?string $nik, ?string $nama): OrangTua
    {
        // 1. Cek ortu yang sudah terhubung ke siswa ini dengan hubungan yang sama
        $existing = $siswa->orangTua()
            ->where('hubungan', $hubungan)
            ->first();

        if ($existing) {
            return $existing;
        }

        // 2. Jika ada NIK, cari di sekolah yang sama via app-layer decrypt
        // Hanya feasible untuk dataset kecil — skip jika NIK null
        if ($nik) {
            $match = OrangTua::where('hubungan', $hubungan)
                ->get()
                ->first(fn($ortu) => $ortu->nik === $nik); // cast decrypt otomatis

            if ($match) {
                return $match;
            }
        }

        // 3. Buat instance baru (school_id diisi otomatis oleh HasSchoolScope::creating)
        return new OrangTua();
    }

    private function findMatchingOrangTua(array $data): ?OrangTua
    {
        $fields = ['nik_ayah', 'nik_ibu', 'nik_wali', 'email'];
        $hasIdentifier = collect($fields)->contains(fn($field) => filled($data[$field] ?? null));

        if (!$hasIdentifier) {
            return null;
        }

        return OrangTua::where(function ($query) use ($fields, $data) {
            foreach ($fields as $field) {
                if (filled($data[$field] ?? null)) {
                    $query->orWhere($field, $data[$field]);
                }
            }
        })->first();
    }

    private function yearToDate($year): ?string
    {
        return filled($year) ? ((int) $year) . '-01-01' : null;
    }

    public function uploadFoto(Request $request, $nisn)
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $siswa = Siswa::where('nisn', $nisn)->firstOrFail();

        if ($siswa->foto && file_exists(storage_path('app/public/' . $siswa->foto))) {
            unlink(storage_path('app/public/' . $siswa->foto));
        }

        $path = $request->file('foto')->store('foto-siswa', 'public');
        $siswa->update(['foto' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Foto berhasil diupload.',
            'data' => ['foto_url' => asset('storage/' . $path)],
        ]);
    }

    public function destroy($nisn)
    {
        $siswa = Siswa::where('nisn', $nisn)->firstOrFail();

        if ($siswa->orangTua()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Siswa ini terhubung dengan akun orang tua. Hapus akun ortu terlebih dahulu.',
            ], 422);
        }

        DB::transaction(function () use ($siswa) {
            RiwayatKelas::where('siswa_id', $siswa->id)->delete();
            $siswa->orangTua()->detach(); // hapus semua pivot orang_tua_siswa
            $siswa->delete();
        });

        return response()->json(['success' => true, 'message' => 'Data siswa berhasil dihapus.']);
    }

    // Assign siswa ke kelas
    public function assignKelas(Request $request, $nisn)
    {
        $request->validate([
            'kelas_id' => 'required|string|exists:kelas,id',
            'no_absen' => 'required|integer',
            'tahun_ajaran_id' => 'required|integer|exists:tahun_ajarans,id',
            'semester' => 'required|in:1,2',
        ]);

        $siswa = Siswa::where('nisn', $nisn)->firstOrFail();

        // Cek apakah sudah ada di kelas yang sama
        $sudahAda = RiwayatKelas::where('siswa_id', $siswa->id)
            ->where('kelas_id', $request->kelas_id)
            ->whereNull('tanggal_keluar')
            ->exists();

        if ($sudahAda) {
            return response()->json([
                'success' => false,
                'message' => 'Siswa sudah terdaftar di kelas ini.',
            ], 422);
        }

        RiwayatKelas::create([
            'siswa_id' => $siswa->id,
            'kelas_id' => $request->kelas_id,
            'tahun_ajaran_id' => $request->tahun_ajaran_id,
            'no_absen' => $request->no_absen,
            'tanggal_masuk' => now()->toDateString(),
            'jenis_perubahan' => 'masuk_baru',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Siswa berhasil ditambahkan ke kelas.',
        ]);
    }
}