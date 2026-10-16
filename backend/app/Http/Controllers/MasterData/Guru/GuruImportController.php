<?php

namespace App\Http\Controllers\MasterData\Guru;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessGuruImport;
use App\Jobs\ProcessGuruZipImport;
use App\Models\ActivityLog;
use App\Models\Guru;
use App\Models\GuruImportLog;
use App\Services\Excel\MultiSheetXlsxService;
use App\Services\GuruImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GuruImportController extends Controller
{
    public function __construct(
        private MultiSheetXlsxService $xlsx,
        private GuruImportService $importService,
    ) {
        $this->middleware(function ($req, $next) {
            $this->authorize('import', Guru::class);
            return $next($req);
        });
    }

    public function downloadTemplate()
    {
        // NUPTK contoh — satu guru, semua sheet pakai NUPTK yang sama
        $nuptk = '1234567890123456';

        // ── Sheet 1: Data Utama ─────────────────────────────────────────
        $sheetUtamaHeaders = [
            'nuptk*',
            'nip',
            'nip_lama',
            'no_karpeg',
            'no_karis_karsu',
            'nik',
            'no_kk',
            'nama*',
            'gelar_depan',
            'gelar_belakang',
            'jenis_kelamin (L/P)*',
            'tempat_lahir*',
            'tanggal_lahir (YYYY-MM-DD)*',
            'agama',
            'golongan_darah',
            'kewarganegaraan',
            'status_hidup',
            'nama_ibu_kandung',
            'no_hp*',
            'no_wa',
            'email',
            'alamat_jalan',
            'rt',
            'rw',
            'dusun',
            'desa_kelurahan',
            'kecamatan',
            'kota_kabupaten',
            'provinsi',
            'kode_pos',
            'jenis_ptk*',
            'status_kepegawaian*',
            'status_keaktifan',
            'tanggal_bergabung (YYYY-MM-DD)',
            'tmt_pns (YYYY-MM-DD)',
            'tmt_gty (YYYY-MM-DD)',
            'masa_kerja_tahun',
            'no_sk_pengangkatan',
            'tgl_sk_pengangkatan (YYYY-MM-DD)',
            'instansi_pengangkat',
        ];
        $sheetUtamaExample = [
            [
                $nuptk,
                '199001012015011001',
                '',
                'G-123456',
                '',
                '3201010101900001',
                '3201010101900001',
                'Ahmad Fauzi',
                'Drs.',
                'M.Pd',
                'L',
                'Bogor',
                '1990-01-01',
                'Islam',
                'A',
                'WNI',
                'Aktif',
                'Siti Aminah',
                '08123456789',
                '08123456789',
                'ahmad.fauzi@email.com',
                'Jl. Raya Bogor No.10',
                '001',
                '002',
                'Bojong',
                'Cibuluh',
                'Bogor Utara',
                'Kota Bogor',
                'Jawa Barat',
                '16152',
                'Guru Kelas',
                'PNS',
                'Aktif',
                '2015-01-01',
                '2015-01-01',
                '',
                '9',
                'SK-001/2015',
                '2015-01-01',
                'Kemendikbud',
            ]
        ];

        // ── Sheet 2: Keluarga & Anak ────────────────────────────────────
        $sheetKeluargaHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'status_perkawinan',
            'nama_pasangan',
            'nik_pasangan',
            'pekerjaan_pasangan',
            'jumlah_anak',
            'nama_anak',
            'jenis_kelamin_anak (L/P)',
            'tanggal_lahir_anak (YYYY-MM-DD)',
            'urutan_anak',
        ];
        $sheetKeluargaExample = [
            // baris 1: data keluarga + anak pertama
            [$nuptk, 'Menikah', 'Dewi Rahayu', '3201019001010001', 'Karyawan Swasta', '2', 'Muhammad Rizki', 'L', '2015-03-10', '1'],
            // baris 2: anak kedua — kolom keluarga dikosongkan, NUPTK sama
            [$nuptk, '', '', '', '', '', 'Fatimah Azzahra', 'P', '2017-07-22', '2'],
        ];

        // ── Sheet 3: Rekening ───────────────────────────────────────────
        $sheetRekeningHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'nama_bank',
            'no_rekening',
            'atas_nama',
            'cabang',
            'npwp',
            'no_bpjs_kesehatan',
            'no_bpjs_ketenagakerjaan',
            'gaji_pokok',
            'tunjangan_fungsional',
            'tunjangan_profesi',
        ];
        $sheetRekeningExample = [
            [
                $nuptk,
                'BRI',
                '001234567890',
                'Ahmad Fauzi',
                'BRI Cabang Bogor Kota',
                '12.345.678.9-012.000',
                '0001234567890',
                '00087654321',
                '3500000',
                '500000',
                '1500000',
            ]
        ];

        // ── Sheet 4: Pendidikan ─────────────────────────────────────────
        $sheetPendidikanHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'jenjang (SD/SMP/SMA-SMK/D1/D2/D3/D4/S1/S2/S3)*',
            'nama_sekolah*',
            'jurusan',
            'prodi',
            'tahun_masuk',
            'tahun_lulus',
            'no_ijazah',
        ];
        $sheetPendidikanExample = [
            // S1 — pendidikan terakhir sebelum S2
            [$nuptk, 'S1', 'Universitas Pendidikan Indonesia', 'PGSD', 'Pendidikan Guru SD', '2008', '2012', 'IJZ-S1-2012-001'],
            // S2 — pendidikan tertinggi
            [$nuptk, 'S2', 'Universitas Negeri Jakarta', 'Manajemen Pendidikan', '', '2013', '2015', 'IJZ-S2-2015-001'],
        ];

        // ── Sheet 5: Sertifikasi ────────────────────────────────────────
        $sheetSertifikasiHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'jenis_sertifikasi*',
            'no_sertifikat',
            'nrg',
            'tahun_sertifikasi',
            'lptk',
            'bidang_studi',
            'tanggal_terbit (YYYY-MM-DD)',
            'expired_at (YYYY-MM-DD)',
        ];
        $sheetSertifikasiExample = [
            [
                $nuptk,
                'Guru Kelas SD',
                'SERT-2016-001',
                '12345678901234',
                '2016',
                'UPI Bandung',
                'Guru Kelas SD',
                '2016-12-01',
                '',
            ]
        ];

        // ── Sheet 6: Diklat ─────────────────────────────────────────────
        $sheetDiklatHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'nama_diklat*',
            'penyelenggara',
            'jenis (diklat/bimtek/workshop/seminar/pelatihan/kursus)',
            'tingkat (Kecamatan/Kabupaten-Kota/Provinsi/Nasional/Internasional)',
            'tanggal_mulai (YYYY-MM-DD)',
            'tanggal_selesai (YYYY-MM-DD)',
            'jumlah_jam',
            'peran (peserta/narasumber/panitia/moderator)',
            'no_sertifikat',
            'keterangan',
        ];
        $sheetDiklatExample = [
            [$nuptk, 'Pelatihan Kurikulum Merdeka', 'Kemendikbud', 'bimtek', 'Nasional', '2023-07-10', '2023-07-14', '32', 'peserta', 'BT-2023-001', 'Implementasi Kurikulum Merdeka'],
            [$nuptk, 'Workshop Penilaian Autentik', 'Dinas Pendidikan Kota Bogor', 'workshop', 'Kabupaten-Kota', '2022-11-05', '2022-11-06', '16', 'peserta', 'WS-2022-015', ''],
        ];

        // ── Sheet 7: Jabatan ────────────────────────────────────────────
        $sheetJabatanHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'jenis_jabatan (Struktural/Fungsional/Tambahan)*',
            'jabatan*',
            'unit_kerja',
            'instansi_pengangkat',
            'golongan',
            'pangkat',
            'jenis_pengangkatan',
            'status_kepegawaian_jabatan (CPNS/PNS/PPPK/GTY/GTT/Honorer/Kontrak)',
            'no_sk',
            'tanggal_sk (YYYY-MM-DD)',
            'pejabat_penandatangan',
            'tmt_jabatan (YYYY-MM-DD)',
            'tanggal_selesai (YYYY-MM-DD)',
            'status_jabatan (Aktif/Berakhir/Nonaktif/Mutasi/Pensiun)',
            'is_current (1/0)',
            'uraian_tugas',
        ];
        $sheetJabatanExample = [
            // jabatan lama — sudah berakhir
            [$nuptk, 'Fungsional', 'Guru Pertama', 'MI Nurul Huda 3', 'Kemendikbud', 'III/a', 'Penata Muda', 'Pengangkatan Baru', 'PNS', 'SK-2015-001', '2015-01-01', 'Kepala Dinas Kota Bogor', '2015-01-01', '2019-12-31', 'Berakhir', '0', ''],
            // jabatan aktif sekarang
            [$nuptk, 'Fungsional', 'Guru Madya', 'MI Nurul Huda 3', 'Kemendikbud', 'III/c', 'Penata', 'Kenaikan Jabatan', 'PNS', 'SK-2020-001', '2020-01-01', 'Kepala Dinas Kota Bogor', '2020-01-01', '', 'Aktif', '1', 'Mengajar kelas IV-VI'],
        ];

        // ── Sheet 8: Inpassing ──────────────────────────────────────────
        $sheetInpassingHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'no_sk*',
            'tanggal_sk (YYYY-MM-DD)*',
            'tmt_inpassing (YYYY-MM-DD)*',
            'golongan_sesudah',
            'jabatan_fungsional',
            'angka_kredit',
        ];
        $sheetInpassingExample = [
            [
                $nuptk,
                'SK-INP-2021-001',
                '2021-03-01',
                '2021-04-01',
                'III/c',
                'Guru Madya',
                '300.50',
            ]
        ];

        // ── Sheet 9: Mutasi ─────────────────────────────────────────────
        $sheetMutasiHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'jenis_mutasi (Masuk/Keluar/Internal)*',
            'sekolah_asal',
            'npsn_asal',
            'sekolah_tujuan',
            'npsn_tujuan',
            'tanggal_mutasi (YYYY-MM-DD)*',
            'no_sk',
            'tanggal_sk (YYYY-MM-DD)',
            'keterangan',
        ];
        $sheetMutasiExample = [
            [
                $nuptk,
                'Masuk',
                'SDN Budi Luhur 1 Bogor',
                '20217891',
                'MI Nurul Huda 3',
                '20123456',
                '2015-01-01',
                'SK-MUT-2015-001',
                '2014-12-15',
                'Mutasi atas permintaan sendiri',
            ]
        ];

        // ── Sheet 10: Kompetensi ────────────────────────────────────────
        $sheetKompetensiHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'jenis (bahasa/it/bidang_keahlian/lainnya)*',
            'nama*',
            'tingkat (Dasar/Menengah/Mahir/Ahli)',
            'keterangan',
        ];
        $sheetKompetensiExample = [
            [$nuptk, 'bahasa', 'Bahasa Inggris', 'Menengah', 'TOEFL 450'],
            [$nuptk, 'it', 'Microsoft Office', 'Mahir', 'Word, Excel, PowerPoint'],
            [$nuptk, 'bidang_keahlian', 'Pendidikan Dasar', 'Ahli', 'Spesialisasi kelas rendah'],
        ];

        // ── Sheet 11: Kontak Darurat ────────────────────────────────────
        $sheetKontakHeaders = [
            'nuptk* (harus ada di Sheet1)',
            'nama*',
            'hubungan*',
            'no_hp*',
            'alamat',
            'is_primary (1/0)',
        ];
        $sheetKontakExample = [
            // kontak utama
            [$nuptk, 'Dewi Rahayu', 'Istri', '081234567899', 'Jl. Raya Bogor No.10, Cibuluh, Bogor Utara', '1'],
            // kontak alternatif
            [$nuptk, 'Hasan Fauzi', 'Kakak', '081298765432', 'Jl. Sudirman No.5, Bogor Tengah', '0'],
        ];

        // ── Sheet Petunjuk ──────────────────────────────────────────────
        $sheetPetunjukHeaders = ['PETUNJUK PENGISIAN TEMPLATE IMPORT GURU'];
        $sheetPetunjukExample = [
            [''],
            ['CARA PENGGUNAAN:'],
            ['1. Sheet "Data Utama" WAJIB diisi terlebih dahulu. Satu baris = satu guru.'],
            ['2. Sheet lain bersifat opsional, diisi sesuai data yang tersedia.'],
            ['3. Kolom bertanda * (bintang) wajib diisi, kolom lain boleh dikosongkan.'],
            ['4. NUPTK di setiap sheet HARUS sama persis dengan NUPTK di sheet "Data Utama".'],
            ['5. Format tanggal: YYYY-MM-DD (contoh: 2025-07-31).'],
            ['6. Hapus baris contoh sebelum mengisi data asli, atau timpa langsung.'],
            [''],
            ['PENJELASAN TIAP SHEET:'],
            ['Sheet "Data Utama"   — Data identitas & kepegawaian guru (tabel: gurus)'],
            ['Sheet "Keluarga"     — Status perkawinan, pasangan, dan data anak (tabel: guru_keluargas + guru_anaks)'],
            ['                       Untuk anak ke-2 dst: baris baru dengan NUPTK sama, kolom keluarga dikosongkan.'],
            ['Sheet "Rekening"     — Rekening bank, NPWP, BPJS, dan tunjangan (tabel: guru_rekenings)'],
            ['Sheet "Pendidikan"   — Riwayat pendidikan formal (tabel: guru_pendidikans). Bisa lebih dari 1 baris.'],
            ['Sheet "Sertifikasi"  — Data sertifikat pendidik (tabel: guru_sertifikasis). Bisa lebih dari 1 baris.'],
            ['Sheet "Diklat"       — Riwayat pelatihan/diklat (tabel: guru_diklats). Bisa lebih dari 1 baris.'],
            ['Sheet "Jabatan"      — Riwayat jabatan struktural/fungsional (tabel: guru_jabatans). Bisa lebih dari 1 baris.'],
            ['                       Kolom "is_current": isi 1 untuk jabatan aktif sekarang, 0 untuk riwayat.'],
            ['Sheet "Inpassing"    — Data inpassing/penyetaraan jabatan (tabel: guru_inpassings).'],
            ['Sheet "Mutasi"       — Riwayat mutasi masuk/keluar (tabel: guru_mutasi).'],
            ['Sheet "Kompetensi"   — Kompetensi bahasa, IT, atau bidang keahlian (tabel: guru_kompetensi).'],
            ['Sheet "Kontak Darurat" — Kontak darurat guru (tabel: guru_kontak_darurat).'],
            ['                         Kolom "is_primary": isi 1 untuk kontak utama, 0 untuk alternatif.'],
            [''],
            ['NILAI YANG DIIZINKAN:'],
            ['jenis_kelamin       : L atau P'],
            ['agama               : Islam / Kristen / Katolik / Hindu / Buddha / Konghucu'],
            ['status_keaktifan    : Aktif / Nonaktif / Pensiun / Meninggal'],
            ['status_kepegawaian  : PNS / PPPK / GTY / GTT / Honorer / Kontrak'],
            ['jenis_ptk           : Guru Kelas / Guru Mapel / Guru BK / Kepala Sekolah / Tenaga Kependidikan'],
            ['jenjang pendidikan  : SD / SMP / SMA / SMK / D1 / D2 / D3 / D4 / S1 / S2 / S3'],
            ['jenis diklat        : diklat / bimtek / workshop / seminar / pelatihan / kursus'],
            ['tingkat diklat      : Kecamatan / Kabupaten-Kota / Provinsi / Nasional / Internasional'],
            ['peran diklat        : peserta / narasumber / panitia / moderator'],
            ['jenis jabatan       : Struktural / Fungsional / Tambahan'],
            ['status jabatan      : Aktif / Berakhir / Nonaktif / Mutasi / Pensiun'],
            ['status kepeg jabatan: CPNS / PNS / PPPK / GTY / GTT / Honorer / Kontrak'],
            ['jenis mutasi        : Masuk / Keluar / Internal'],
            ['jenis kompetensi    : bahasa / it / bidang_keahlian / lainnya'],
            ['tingkat kompetensi  : Dasar / Menengah / Mahir / Ahli'],
            [''],
            ['CATATAN:'],
            ['- File hasil import dapat dipakai untuk import ulang tanpa perlu modifikasi (NUPTK yang sudah ada di DB akan diperbarui).'],
            ['- File dokumen (ijazah, sertifikat, SK) tidak bisa diimport lewat Excel; upload manual via halaman detail guru.'],
            ['- Jika ada error saat import, cek kolom NUPTK dan format tanggal terlebih dahulu.'],
        ];

        $sheets = [
            ['name' => 'Petunjuk', 'headers' => $sheetPetunjukHeaders, 'rows' => $sheetPetunjukExample],
            ['name' => 'Data Utama', 'headers' => $sheetUtamaHeaders, 'rows' => $sheetUtamaExample],
            ['name' => 'Keluarga & Anak', 'headers' => $sheetKeluargaHeaders, 'rows' => $sheetKeluargaExample],
            ['name' => 'Rekening', 'headers' => $sheetRekeningHeaders, 'rows' => $sheetRekeningExample],
            ['name' => 'Pendidikan', 'headers' => $sheetPendidikanHeaders, 'rows' => $sheetPendidikanExample],
            ['name' => 'Sertifikasi', 'headers' => $sheetSertifikasiHeaders, 'rows' => $sheetSertifikasiExample],
            ['name' => 'Diklat', 'headers' => $sheetDiklatHeaders, 'rows' => $sheetDiklatExample],
            ['name' => 'Jabatan', 'headers' => $sheetJabatanHeaders, 'rows' => $sheetJabatanExample],
            ['name' => 'Inpassing', 'headers' => $sheetInpassingHeaders, 'rows' => $sheetInpassingExample],
            ['name' => 'Mutasi', 'headers' => $sheetMutasiHeaders, 'rows' => $sheetMutasiExample],
            ['name' => 'Kompetensi', 'headers' => $sheetKompetensiHeaders, 'rows' => $sheetKompetensiExample],
            ['name' => 'Kontak Darurat', 'headers' => $sheetKontakHeaders, 'rows' => $sheetKontakExample],
        ];

        $xlsx = $this->xlsx->build($sheets);
        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="template_import_guru.xlsx"',
            'Content-Length' => strlen($xlsx),
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * POST /guru/import — Multi-sheet import (simple, no preview flow)
     */
    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls|max:10240']);

        $results = $this->importService->import($request->file('file')->getRealPath());

        return $this->success($results, $this->importService->buildSummaryMessage($results));
    }


    /**
     * GET /guru/export — Multi-sheet export lengkap
     */
    public function importPreview(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:20480']);

        try {
            $filePath = $request->file('file')->getRealPath();
            $fileName = $request->file('file')->getClientOriginalName();
            $allSheets = $this->xlsx->parse($filePath);

            if (empty($allSheets)) {
                return $this->error('File tidak bisa dibaca.', 'VALIDATION_ERROR', 422);
            }

            // Simpan file sementara di storage
            $batchId = (string) Str::uuid();
            $storedPath = $request->file('file')->storeAs('imports', $batchId . '.xlsx');

            // Ambil header & 5 baris pertama dari Sheet1
            $sheetUtama = null;
            foreach ($allSheets as $s) {
                if (strtolower($s['name']) === 'data utama') {
                    $sheetUtama = $s;
                    break;
                }
            }
            $sheetUtama = $sheetUtama ?? $allSheets[0];

            $rows = $sheetUtama['rows'];
            $headers = !empty($rows) ? array_map('trim', array_shift($rows)) : [];
            $sample = array_slice($rows, 0, 5);

            // Auto-mapping: cari kecocokan header user dengan kolom DB
            $dbFields = [
                'nuptk',
                'nip',
                'nip_lama',
                'no_karpeg',
                'no_karis_karsu',
                'nik',
                'no_kk',
                'nama',
                'gelar_depan',
                'gelar_belakang',
                'jenis_kelamin',
                'tempat_lahir',
                'tanggal_lahir',
                'agama',
                'golongan_darah',
                'kewarganegaraan',
                'status_hidup',
                'nama_ibu_kandung',
                'no_hp',
                'no_wa',
                'email',
                'alamat_jalan',
                'rt',
                'rw',
                'dusun',
                'desa_kelurahan',
                'kecamatan',
                'kota_kabupaten',
                'provinsi',
                'kode_pos',
                'jenis_ptk',
                'status_kepegawaian',
                'status_keaktifan',
                'tanggal_bergabung',
                'tmt_pns',
                'tmt_gty',
                'masa_kerja_tahun',
                'no_sk_pengangkatan',
                'tgl_sk_pengangkatan',
                'instansi_pengangkat',
            ];

            $autoMapping = [];
            foreach ($headers as $userHeader) {
                $normalized = strtolower(preg_replace('/[^a-z0-9]/i', '', $userHeader));
                foreach ($dbFields as $dbField) {
                    $dbNorm = strtolower(str_replace('_', '', $dbField));
                    if ($normalized === $dbNorm || str_contains($normalized, $dbNorm)) {
                        $autoMapping[$userHeader] = $dbField;
                        break;
                    }
                }
            }

            // Statistik duplicate detection (5 baris sample)
            $dupStats = ['nuptk' => 0, 'nip' => 0, 'nik' => 0, 'email' => 0];
            foreach ($sample as $row) {
                $nuptkIdx = array_search($autoMapping['nuptk'] ?? 'nuptk', array_values($autoMapping));
                foreach (['nuptk', 'nip', 'nik', 'email'] as $field) {
                    $header = array_search($field, $autoMapping);
                    if ($header !== false) {
                        $idx = array_search($header, $headers);
                        if ($idx !== false && !empty($row[$idx])) {
                            if (Guru::where($field, trim($row[$idx]))->exists()) {
                                $dupStats[$field]++;
                            }
                        }
                    }
                }
            }

            // Buat log dengan status 'preview'
            GuruImportLog::create([
                'user_id' => auth()->id(),
                'batch_id' => $batchId,
                'tipe' => 'excel',
                'nama_file' => $fileName,
                'status' => 'preview',
                'column_mapping' => $autoMapping,
                'preview_data' => ['headers' => $headers, 'rows' => $sample],
                'total_baris' => count($rows) + count($sample),
                'ip_address' => $request->ip(),
            ]);

            return $this->success([
                'batch_id' => $batchId,
                'total_baris' => count($rows) + count($sample),
                'sheets' => array_map(fn($s) => $s['name'], $allSheets),
                'headers' => $headers,
                'sample_rows' => $sample,
                'auto_mapping' => $autoMapping,
                'db_fields' => $dbFields,
                'dup_stats' => $dupStats,
            ]);
        } catch (\Throwable $e) {
            return $this->error('Gagal memproses file: ' . $e->getMessage());
        }
    }

    /**
     * POST /guru/import-execute
     * Jalankan import via Queue berdasarkan batch_id dari preview.
     */
    public function importExecute(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|string|exists:guru_import_logs,batch_id',
            'column_mapping' => 'required|array',
            'mode_duplikat' => 'required|in:skip,replace,merge',
        ]);

        $log = GuruImportLog::where('batch_id', $request->batch_id)
            ->where('user_id', auth()->id())
            ->whereNotIn('status', ['done', 'processing'])  // boleh retry, tapi jangan double-execute
            ->firstOrFail();

        $log->update([
            'status' => 'processing',
            'column_mapping' => $request->column_mapping,
            'mode_duplikat' => $request->mode_duplikat,
            'started_at' => now(),
        ]);

        $startTime = microtime(true);
        $filePath = storage_path('app/imports/' . $log->batch_id . '.xlsx');

        // Cek file masih ada (bisa hilang kalau server restart atau storage clear)
        if (!file_exists($filePath)) {
            $log->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_detail' => [['pesan' => 'File upload sudah tidak ada. Silakan upload ulang.']]
            ]);
            return $this->error('File sudah tidak ada di server. Silakan upload ulang dari awal.', 'NOT_FOUND', 422);
        }

        $allSheets = $this->xlsx->parse($filePath);
        // ── Tentukan sheet utama ─────────────────────────────────────────
        $sheetUtama = null;
        foreach ($allSheets as $s) {
            if (strtolower($s['name']) === 'data utama') {
                $sheetUtama = $s;
                break;
            }
        }
        $sheetUtama = $sheetUtama ?? ($allSheets[0] ?? null);

        if (!$sheetUtama || empty($sheetUtama['rows'])) {
            $log->update(['status' => 'failed', 'error_detail' => [['pesan' => 'Sheet "Data Utama" tidak ditemukan atau kosong.']], 'finished_at' => now()]);
            return $this->error('Sheet "Data Utama" tidak ditemukan atau kosong.', 'VALIDATION_ERROR', 422);
        }

        $rows = $sheetUtama['rows'];
        $headerRow = array_map('trim', array_shift($rows));
        $mapping = $request->column_mapping;
        $modeDup = $request->mode_duplikat;
        $totalBaris = count($rows);

        $log->update(['total_baris' => $totalBaris, 'progress_persen' => 5]);

        $stats = ['insert' => 0, 'update' => 0, 'skip' => 0, 'gagal' => 0, 'errors' => [], 'relasi' => []];

        // Helper: ambil nilai cell berdasarkan mapping
        $getCell = function (array $row, string $dbField) use ($headerRow, $mapping): ?string {
            $userHeader = array_search($dbField, $mapping);
            if ($userHeader !== false) {
                $idx = array_search($userHeader, $headerRow);
                if ($idx !== false) {
                    $val = trim($row[$idx] ?? '');
                    return $val !== '' ? $val : null;
                }
            }
            // Fallback: cari header yang nama-nya cocok setelah normalisasi
            foreach ($headerRow as $i => $h) {
                $norm = strtolower(preg_replace('/[^a-z0-9]/i', '', $h));
                $target = strtolower(str_replace('_', '', $dbField));
                if ($norm === $target) {
                    $val = trim($row[$i] ?? '');
                    return $val !== '' ? $val : null;
                }
            }
            return null;
        };

        $parseDate = function (?string $val): ?string {
            if (!$val)
                return null;
            try {
                return \Carbon\Carbon::parse($val)->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        };

        // ── Proses per-chunk ──────────────────────────────────────────────
        $chunks = array_chunk($rows, 50);
        $processed = 0;

        foreach ($chunks as $chunk) {
            DB::transaction(function () use ($chunk, $headerRow, $mapping, $modeDup, $getCell, $parseDate, &$stats, &$processed, $totalBaris, $log) {
                foreach ($chunk as $rowIdx => $row) {
                    $baris = $processed + $rowIdx + 2;

                    // Skip baris kosong
                    if (empty(array_filter($row, fn($v) => trim($v) !== '')))
                        continue;

                    $nuptk = $getCell($row, 'nuptk');
                    $nip = $getCell($row, 'nip');
                    $nik = $getCell($row, 'nik');
                    $email = $getCell($row, 'email');
                    $nama = $getCell($row, 'nama');

                    if (!$nama) {
                        $stats['gagal']++;
                        $stats['errors'][] = "Baris {$baris}: Kolom 'nama' wajib diisi.";
                        continue;
                    }

                    // ── Duplicate detection: NUPTK → NIP → NIK → Email ──
                    $existing = null;
                    if ($nuptk)
                        $existing = Guru::where('nuptk', $nuptk)->first();
                    if (!$existing && $nip)
                        $existing = Guru::where('nip', $nip)->first();
                    if (!$existing && $nik)
                        $existing = Guru::where('nik', $nik)->first();
                    if (!$existing && $email)
                        $existing = Guru::where('email', $email)->first();

                    if ($existing && $modeDup === 'skip') {
                        $stats['skip']++;
                        continue;
                    }

                    $payload = array_filter([
                        'nuptk' => $nuptk,
                        'nip' => $nip,
                        'nip_lama' => $getCell($row, 'nip_lama'),
                        'no_karpeg' => $getCell($row, 'no_karpeg'),
                        'no_karis_karsu' => $getCell($row, 'no_karis_karsu'),
                        'nik' => $nik,
                        'no_kk' => $getCell($row, 'no_kk'),
                        'nama' => $nama,
                        'gelar_depan' => $getCell($row, 'gelar_depan'),
                        'gelar_belakang' => $getCell($row, 'gelar_belakang'),
                        'jenis_kelamin' => strtoupper($getCell($row, 'jenis_kelamin') ?? 'L'),
                        'tempat_lahir' => $getCell($row, 'tempat_lahir'),
                        'tanggal_lahir' => $parseDate($getCell($row, 'tanggal_lahir')),
                        'agama' => $getCell($row, 'agama') ?? 'Islam',
                        'golongan_darah' => $getCell($row, 'golongan_darah'),
                        'kewarganegaraan' => $getCell($row, 'kewarganegaraan') ?? 'WNI',
                        'status_hidup' => $getCell($row, 'status_hidup') ?? 'Aktif',
                        'nama_ibu_kandung' => $getCell($row, 'nama_ibu_kandung'),
                        'no_hp' => $getCell($row, 'no_hp') ?? '-',
                        'no_wa' => $getCell($row, 'no_wa'),
                        'email' => $email,
                        'alamat_jalan' => $getCell($row, 'alamat_jalan'),
                        'rt' => $getCell($row, 'rt'),
                        'rw' => $getCell($row, 'rw'),
                        'dusun' => $getCell($row, 'dusun'),
                        'desa_kelurahan' => $getCell($row, 'desa_kelurahan'),
                        'kecamatan' => $getCell($row, 'kecamatan'),
                        'kota_kabupaten' => $getCell($row, 'kota_kabupaten'),
                        'provinsi' => $getCell($row, 'provinsi'),
                        'kode_pos' => $getCell($row, 'kode_pos'),
                        'jenis_ptk' => $getCell($row, 'jenis_ptk') ?? 'Guru Kelas',
                        'status_kepegawaian' => $getCell($row, 'status_kepegawaian') ?? 'GTT',
                        'status_keaktifan' => $getCell($row, 'status_keaktifan') ?? 'Aktif',
                        'tanggal_bergabung' => $parseDate($getCell($row, 'tanggal_bergabung')),
                        'tmt_pns' => $parseDate($getCell($row, 'tmt_pns')),
                        'tmt_gty' => $parseDate($getCell($row, 'tmt_gty')),
                        'masa_kerja_tahun' => $getCell($row, 'masa_kerja_tahun'),
                        'no_sk_pengangkatan' => $getCell($row, 'no_sk_pengangkatan'),
                        'tgl_sk_pengangkatan' => $parseDate($getCell($row, 'tgl_sk_pengangkatan')),
                        'instansi_pengangkat' => $getCell($row, 'instansi_pengangkat'),
                    ], fn($v) => $v !== null);

                    try {
                        if ($existing) {
                            if ($modeDup === 'merge') {
                                $payload = array_filter($payload, fn($v) => $v !== null && $v !== '');
                            }
                            unset($payload['nuptk']);
                            $existing->update($payload);
                            $stats['update']++;
                        } else {
                            if (!$nuptk) {
                                $stats['gagal']++;
                                $stats['errors'][] = "Baris {$baris}: NUPTK wajib untuk data baru (nama: {$nama}).";
                                continue;
                            }
                            Guru::create($payload);
                            $stats['insert']++;
                        }
                    } catch (\Exception $e) {
                        $stats['gagal']++;
                        $stats['errors'][] = "Baris {$baris} ({$nama}): " . $e->getMessage();
                    }
                }

                $processed += count($chunk);
                $persen = $totalBaris > 0 ? (int) round($processed / $totalBaris * 85) + 5 : 90;
                $log->update(['progress_persen' => $persen]);
            });
        }

        // ── Proses sheet relasi (Keluarga, Pendidikan, dst) ──────────────
        $this->importService->importRelasi($allSheets, $stats);
        $log->update(['progress_persen' => 95]);

        // ── Selesai ───────────────────────────────────────────────────────
        $durasi = round(microtime(true) - $startTime, 2);
        $log->update([
            'status' => 'done',
            'jumlah_insert' => $stats['insert'],
            'jumlah_update' => $stats['update'],
            'jumlah_skip' => $stats['skip'],
            'jumlah_gagal' => $stats['gagal'],
            'error_detail' => $stats['errors'],
            'statistik_relasi' => $stats['relasi'],
            'progress_persen' => 100,
            'durasi_detik' => $durasi,
            'finished_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'import',
            'module' => 'guru',
            'keterangan' => json_encode([
                'batch_id' => $log->batch_id,
                'insert' => $stats['insert'],
                'update' => $stats['update'],
                'skip' => $stats['skip'],
                'gagal' => $stats['gagal'],
                'durasi' => $durasi . 's',
                'file' => $log->nama_file,
            ]),
            'ip_address' => $request->ip(),
        ]);

        // Bersihkan file temp
        Storage::delete('imports/' . $log->batch_id . '.xlsx');

        return $this->success([
            'batch_id' => $log->batch_id,
            'status' => 'done',
            'progress_persen' => 100,
            'total_baris' => $totalBaris,
            'jumlah_insert' => $stats['insert'],
            'jumlah_update' => $stats['update'],
            'jumlah_skip' => $stats['skip'],
            'jumlah_gagal' => $stats['gagal'],
            'statistik_relasi' => $stats['relasi'],
            'error_detail' => $stats['errors'],
            'durasi_detik' => $durasi,
        ]);
    }

    /**
     * POST /guru/import-zip
     * Upload ZIP berisi Excel + foto + dokumen → proses via Queue.
     */
    public function importZip(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:zip|max:102400',
            'mode_duplikat' => 'nullable|in:skip,replace,merge',
        ]);

        $batchId = (string) Str::uuid();
        $storedPath = $request->file('file')->storeAs('imports', $batchId . '.zip');
        $fileName = $request->file('file')->getClientOriginalName();

        GuruImportLog::create([
            'user_id' => auth()->id(),
            'batch_id' => $batchId,
            'tipe' => 'zip',
            'nama_file' => $fileName,
            'status' => 'pending',
            'mode_duplikat' => $request->mode_duplikat ?? 'replace',
            'ip_address' => $request->ip(),
        ]);

        ProcessGuruZipImport::dispatch(
            $batchId,
            'imports/' . $batchId . '.zip',
            $request->mode_duplikat ?? 'replace',
            auth()->id(),
            $request->ip(),
        );

        return $this->success(
            ['batch_id' => $batchId],
            'ZIP sedang diproses. Pantau via /guru/import-status/{batch_id}.'
        );
    }

    /**
     * GET /guru/import-status/{batchId}
     * Polling progress realtime (SSE-friendly, bisa dipoll setiap 2 detik).
     */
    public function importStatus(string $batchId)
    {
        $log = GuruImportLog::where('batch_id', $batchId)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        return $this->success([
            'batch_id' => $log->batch_id,
            'status' => $log->status,
            'progress_persen' => $log->progress_persen,
            'total_baris' => $log->total_baris,
            'jumlah_insert' => $log->jumlah_insert,
            'jumlah_update' => $log->jumlah_update,
            'jumlah_skip' => $log->jumlah_skip,
            'jumlah_gagal' => $log->jumlah_gagal,
            'statistik_relasi' => $log->statistik_relasi,
            'error_detail' => $log->error_detail,
            'durasi_detik' => $log->durasi_detik,
            'started_at' => $log->started_at,
            'finished_at' => $log->finished_at,
        ]);
    }

    /**
     * GET /guru/import-history
     * Riwayat semua import (10 terakhir).
     */
    public function importHistory()
    {
        $logs = GuruImportLog::with('user:id,name')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn($l) => [
                'batch_id' => $l->batch_id,
                'tipe' => $l->tipe,
                'nama_file' => $l->nama_file,
                'status' => $l->status,
                'mode_duplikat' => $l->mode_duplikat,
                'total_baris' => $l->total_baris,
                'jumlah_insert' => $l->jumlah_insert,
                'jumlah_update' => $l->jumlah_update,
                'jumlah_skip' => $l->jumlah_skip,
                'jumlah_gagal' => $l->jumlah_gagal,
                'durasi_detik' => $l->durasi_detik,
                'oleh' => $l->user?->name,
                'ip_address' => $l->ip_address,
                'created_at' => $l->created_at,
            ]);

        return $this->success($logs);
    }

    /**
     * GET /guru/import-error-report/{batchId}
     * Download laporan error sebagai Excel.
     */
    public function importErrorReport(string $batchId)
    {
        $log = GuruImportLog::where('batch_id', $batchId)->firstOrFail();

        if (empty($log->error_detail)) {
            return $this->notFound('Tidak ada error untuk batch ini.');
        }

        $headers = ['No', 'Keterangan Error'];
        $rows = array_map(fn($err, $i) => [$i + 1, is_array($err) ? ($err['pesan'] ?? json_encode($err)) : $err], $log->error_detail, array_keys($log->error_detail));

        $sheets = [['name' => 'Error Report', 'headers' => $headers, 'rows' => $rows]];
        $xlsx = $this->xlsx->build($sheets);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"error_import_{$batchId}.xlsx\"",
        ]);
    }

    /**
     * POST /guru/restore
     * Restore dari backup ZIP — membaca manifest.json di dalamnya.
     */
    public function restoreBackup(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:zip|max:204800']);

        $zip = new \ZipArchive();
        if ($zip->open($request->file('file')->getRealPath()) !== true) {
            return $this->error('ZIP tidak bisa dibuka.', 'VALIDATION_ERROR', 422);
        }

        $results = ['restored' => 0, 'skipped' => 0, 'missing_files' => [], 'errors' => []];

        // Cari Excel
        $excelContent = null;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $ext = strtolower(pathinfo($stat['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['xlsx', 'xls']) && !str_contains($stat['name'], '__MACOSX')) {
                $excelContent = $zip->getFromIndex($i);
                break;
            }
        }

        if (!$excelContent) {
            $zip->close();
            return $this->error('File Excel tidak ditemukan dalam ZIP.', 'VALIDATION_ERROR', 422);
        }

        // Simpan dan parse Excel
        $tmpPath = storage_path('app/imports/restore_' . time() . '.xlsx');
        file_put_contents($tmpPath, $excelContent);
        $allSheets = $this->xlsx->parse($tmpPath);

        // Proses Data Utama
        $sheetUtama = null;
        foreach ($allSheets as $s) {
            if (strtolower($s['name']) === 'data utama') {
                $sheetUtama = $s;
                break;
            }
        }
        if ($sheetUtama && !empty($sheetUtama['rows'])) {
            $rows = $sheetUtama['rows'];
            $headerRow = array_map('trim', array_shift($rows));
            $headerMap = array_flip($headerRow);
            $get = fn($row, $key) => (($i = $headerMap[$key] ?? null) !== null && trim($row[$i] ?? '') !== '') ? trim($row[$i]) : null;

            foreach ($rows as $row) {
                $nuptk = $get($row, 'NUPTK') ?? $get($row, 'nuptk*') ?? $get($row, 'nuptk');
                $nama = $get($row, 'Nama') ?? $get($row, 'nama*') ?? $get($row, 'nama');
                if (!$nuptk || !$nama)
                    continue;

                try {
                    $payload = array_filter([
                        'nuptk' => $nuptk,
                        'nama' => $nama,
                        'nip' => $get($row, 'NIP') ?? $get($row, 'nip'),
                        'nik' => $get($row, 'NIK') ?? $get($row, 'nik'),
                        'jenis_kelamin' => in_array($get($row, 'Jenis Kelamin'), ['Laki-laki', 'L']) ? 'L' : 'P',
                        'jenis_ptk' => $get($row, 'Jenis PTK') ?? $get($row, 'jenis_ptk') ?? 'Guru Kelas',
                        'status_kepegawaian' => $get($row, 'Status Kepegawaian') ?? $get($row, 'status_kepegawaian') ?? 'GTT',
                        'status_keaktifan' => $get($row, 'Status Keaktifan') ?? $get($row, 'status_keaktifan') ?? 'Aktif',
                        'no_hp' => $get($row, 'No. HP') ?? $get($row, 'no_hp') ?? '-',
                        'agama' => $get($row, 'Agama') ?? $get($row, 'agama') ?? 'Islam',
                        'tempat_lahir' => $get($row, 'Tempat Lahir') ?? $get($row, 'tempat_lahir'),
                        'tanggal_lahir' => $get($row, 'Tanggal Lahir') ?? $get($row, 'tanggal_lahir'),
                    ], fn($v) => $v !== null);

                    $existing = Guru::where('nuptk', $nuptk)->first();
                    if ($existing) {
                        unset($payload['nuptk']);
                        $existing->update($payload);
                    } else {
                        Guru::create($payload);
                        $results['restored']++;
                    }
                } catch (\Exception $e) {
                    $results['errors'][] = "NUPTK {$nuptk}: " . $e->getMessage();
                }
            }
        }

        // Restore file media dari ZIP
        $folderMap = [
            'foto-guru' => ['type' => 'foto'],
            'file-ijazah' => ['type' => 'ijazah'],
            'file-sertifikasi' => ['type' => 'sertifikasi'],
            'file-diklat' => ['type' => 'diklat'],
            'file-inpassing' => ['type' => 'inpassing'],
            'file-mutasi' => ['type' => 'mutasi'],
            'file-dokumen' => ['type' => 'dokumen'],
        ];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $zipName = $stat['name'];
            $filename = basename($zipName);
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            if (substr($zipName, -1) === '/' || str_contains($zipName, '__MACOSX'))
                continue;
            if (in_array($ext, ['xlsx', 'xls', 'txt', 'json']))
                continue;

            $parts = explode('/', $zipName);
            $folder = count($parts) > 1 ? strtolower($parts[0]) : '';
            if (!isset($folderMap[$folder]))
                continue;

            $content = $zip->getFromIndex($i);
            if ($content === false) {
                $results['missing_files'][] = $zipName;
                continue;
            }

            try {
                Storage::disk('public')->put($folder . '/' . $filename, $content);
                $results['restored']++;
            } catch (\Exception $e) {
                $results['errors'][] = "{$zipName}: " . $e->getMessage();
            }
        }

        $zip->close();
        if (file_exists($tmpPath))
            unlink($tmpPath);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'import',
            'module' => 'guru',
            'keterangan' => json_encode(['tipe' => 'restore', ...$results]),
            'ip_address' => $request->ip(),
        ]);

        return $this->success(
            $results,
            "Restore selesai: {$results['restored']} record/file dipulihkan, " . count($results['errors']) . " error."
        );
    }

    /**
     * POST /guru/import-foto
     */
    public function importFoto(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:zip|max:51200']);

        $zip = new \ZipArchive();
        if ($zip->open($request->file('file')->getRealPath()) !== true) {
            return $this->error('File ZIP tidak bisa dibuka.', 'VALIDATION_ERROR', 422);
        }

        $results = [
            'foto' => ['berhasil' => 0, 'gagal' => 0],
            'ijazah' => ['berhasil' => 0, 'gagal' => 0],
            'sertifikasi' => ['berhasil' => 0, 'gagal' => 0],
            'diklat' => ['berhasil' => 0, 'gagal' => 0],
            'inpassing' => ['berhasil' => 0, 'gagal' => 0],
            'mutasi' => ['berhasil' => 0, 'gagal' => 0],
            'dokumen' => ['berhasil' => 0, 'gagal' => 0],
            'dilewati' => 0,
            'errors' => [],
        ];

        $allowedImg = ['jpg', 'jpeg', 'png', 'webp'];
        $allowedDoc = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $zipPath = $stat['name'];
            $filename = basename($zipPath);
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            // Skip folder, macOS metadata
            if (
                substr($zipPath, -1) === '/'
                || str_contains($zipPath, '__MACOSX')
                || str_starts_with($filename, '._')
                || $filename === ''
            ) {
                $results['dilewati']++;
                continue;
            }

            // Tentukan kategori dari nama folder di dalam ZIP
            // Format: foto-guru/1234567890123456.jpg
            //         file-ijazah/1234567890123456_123.pdf
            //         file-sertifikasi/1234567890123456_456.pdf
            //         file-diklat/1234567890123456_789.pdf
            //         file-inpassing/1234567890123456_111.pdf
            //         file-mutasi/1234567890123456_222.pdf
            //         file-dokumen/1234567890123456_333.pdf
            // atau langsung di root ZIP: 1234567890123456.jpg (dianggap foto)

            $folder = '';
            if (str_contains($zipPath, '/')) {
                $parts = explode('/', $zipPath);
                $folder = strtolower($parts[0]);
            }

            // Ambil NUPTK dari nama file (sebelum _ jika ada suffix _id)
            $stem = pathinfo($filename, PATHINFO_FILENAME); // "1234567890123456" atau "1234567890123456_123"
            $nuptk = explode('_', $stem)[0];

            $guru = Guru::where('nuptk', $nuptk)->first();
            if (!$guru) {
                $results['errors'][] = "{$filename}: NUPTK {$nuptk} tidak ditemukan di database.";
                $results['dilewati']++;
                continue;
            }

            $content = $zip->getFromIndex($i);

            try {
                // ── FOTO PROFIL ─────────────────────────────────────────────
                if ($folder === 'foto-guru' || $folder === '') {
                    if (!in_array($ext, $allowedImg)) {
                        $results['dilewati']++;
                        continue;
                    }
                    if ($guru->foto)
                        Storage::disk('public')->delete($guru->foto);
                    $path = "foto-guru/{$nuptk}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $guru->update(['foto' => $path]);
                    $results['foto']['berhasil']++;

                    // ── FILE IJAZAH ─────────────────────────────────────────────
                } elseif ($folder === 'file-ijazah') {
                    if (!in_array($ext, $allowedDoc)) {
                        $results['dilewati']++;
                        continue;
                    }
                    // Cari record pendidikan by id (suffix setelah _) atau ambil yang terakhir
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $pendidikan = $recordId
                        ? $guru->pendidikans()->find($recordId)
                        : $guru->pendidikans()->latest()->first();
                    if (!$pendidikan) {
                        $results['errors'][] = "{$filename}: Data pendidikan untuk NUPTK {$nuptk} tidak ditemukan.";
                        $results['ijazah']['gagal']++;
                        continue;
                    }
                    if ($pendidikan->file_ijazah)
                        Storage::disk('public')->delete($pendidikan->file_ijazah);
                    $path = "file-ijazah/{$nuptk}_{$pendidikan->id}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $pendidikan->update(['file_ijazah' => $path]);
                    $results['ijazah']['berhasil']++;

                    // ── FILE SERTIFIKASI ────────────────────────────────────────
                } elseif ($folder === 'file-sertifikasi') {
                    if (!in_array($ext, $allowedDoc)) {
                        $results['dilewati']++;
                        continue;
                    }
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $sertifikasi = $recordId
                        ? $guru->sertifikasis()->find($recordId)
                        : $guru->sertifikasis()->latest()->first();
                    if (!$sertifikasi) {
                        $results['errors'][] = "{$filename}: Data sertifikasi untuk NUPTK {$nuptk} tidak ditemukan.";
                        $results['sertifikasi']['gagal']++;
                        continue;
                    }
                    if ($sertifikasi->file_sertifikat)
                        Storage::disk('public')->delete($sertifikasi->file_sertifikat);
                    $path = "file-sertifikasi/{$nuptk}_{$sertifikasi->id}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $sertifikasi->update(['file_sertifikat' => $path]);
                    $results['sertifikasi']['berhasil']++;

                    // ── FILE DIKLAT ─────────────────────────────────────────────
                } elseif ($folder === 'file-diklat') {
                    if (!in_array($ext, $allowedDoc)) {
                        $results['dilewati']++;
                        continue;
                    }
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $diklat = $recordId
                        ? $guru->diklats()->find($recordId)
                        : $guru->diklats()->latest()->first();
                    if (!$diklat) {
                        $results['errors'][] = "{$filename}: Data diklat untuk NUPTK {$nuptk} tidak ditemukan.";
                        $results['diklat']['gagal']++;
                        continue;
                    }
                    if ($diklat->file_sertifikat)
                        Storage::disk('public')->delete($diklat->file_sertifikat);
                    $path = "file-diklat/{$nuptk}_{$diklat->id}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $diklat->update(['file_sertifikat' => $path]);
                    $results['diklat']['berhasil']++;

                    // ── FILE SK INPASSING ───────────────────────────────────────
                } elseif ($folder === 'file-inpassing') {
                    if (!in_array($ext, $allowedDoc)) {
                        $results['dilewati']++;
                        continue;
                    }
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $inpassing = $recordId
                        ? $guru->inpassings()->find($recordId)
                        : $guru->inpassings()->latest()->first();
                    if (!$inpassing) {
                        $results['errors'][] = "{$filename}: Data inpassing untuk NUPTK {$nuptk} tidak ditemukan.";
                        $results['inpassing']['gagal']++;
                        continue;
                    }
                    if ($inpassing->file_sk)
                        Storage::disk('public')->delete($inpassing->file_sk);
                    $path = "file-inpassing/{$nuptk}_{$inpassing->id}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $inpassing->update(['file_sk' => $path]);
                    $results['inpassing']['berhasil']++;

                    // ── FILE SK MUTASI ──────────────────────────────────────────
                } elseif ($folder === 'file-mutasi') {
                    if (!in_array($ext, $allowedDoc)) {
                        $results['dilewati']++;
                        continue;
                    }
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $mutasi = $recordId
                        ? $guru->mutasi()->find($recordId)
                        : $guru->mutasi()->latest()->first();
                    if (!$mutasi) {
                        $results['errors'][] = "{$filename}: Data mutasi untuk NUPTK {$nuptk} tidak ditemukan.";
                        $results['mutasi']['gagal']++;
                        continue;
                    }
                    if ($mutasi->file_sk)
                        Storage::disk('public')->delete($mutasi->file_sk);
                    $path = "file-mutasi/{$nuptk}_{$mutasi->id}.{$ext}";
                    Storage::disk('public')->put($path, $content);
                    $mutasi->update(['file_sk' => $path]);
                    $results['mutasi']['berhasil']++;

                    // ── FILE DOKUMEN UMUM ───────────────────────────────────────
                } elseif ($folder === 'file-dokumen') {
                    if (!in_array($ext, $allowedDoc)) {
                        $results['dilewati']++;
                        continue;
                    }
                    $recordId = count(explode('_', $stem)) > 1 ? explode('_', $stem, 2)[1] : null;
                    $dokumen = $recordId
                        ? $guru->dokumens()->find($recordId)
                        : $guru->dokumens()->latest()->first();
                    if (!$dokumen) {
                        // Buat record dokumen baru
                        $path = "file-dokumen/{$nuptk}_" . time() . ".{$ext}";
                        Storage::disk('public')->put($path, $content);
                        $guru->dokumens()->create([
                            'nama_dokumen' => pathinfo($filename, PATHINFO_FILENAME),
                            'file_path' => $path,
                            'file_type' => $ext,
                            'file_size' => strlen($content),
                            'kategori' => 'Lainnya',
                        ]);
                    } else {
                        if ($dokumen->file_path)
                            Storage::disk('public')->delete($dokumen->file_path);
                        $path = "file-dokumen/{$nuptk}_{$dokumen->id}.{$ext}";
                        Storage::disk('public')->put($path, $content);
                        $dokumen->update(['file_path' => $path, 'file_type' => $ext, 'file_size' => strlen($content)]);
                    }
                    $results['dokumen']['berhasil']++;

                } else {
                    $results['dilewati']++;
                }
            } catch (\Exception $e) {
                $results['errors'][] = "{$filename}: " . $e->getMessage();
            }
        }

        $zip->close();

        $total = collect($results)
            ->only(['foto', 'ijazah', 'sertifikasi', 'diklat', 'inpassing', 'mutasi', 'dokumen'])
            ->sum('berhasil');

        $msg = "Import selesai: {$total} file berhasil diproses, {$results['dilewati']} dilewati.";

        return $this->success($results, $msg);
    }
}