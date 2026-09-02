<?php

use App\Http\Controllers\MasterData\Guru\GuruAdministrasiController;
use App\Http\Controllers\Guru\GuruProfileController as MasterGuruController;
use App\Http\Controllers\MasterData\Guru\GuruDokumenController as MasterGuruDokumenController;
use App\Http\Controllers\MasterData\Guru\GuruExportController;
use App\Http\Controllers\MasterData\Guru\GuruImportController;
use App\Http\Controllers\MasterData\Guru\GuruKeluargaController;
use App\Http\Controllers\MasterData\Guru\GuruKepegawaianController as MasterGuruKepegawaianController;
use App\Http\Controllers\MasterData\Guru\GuruKompetensiController;
use App\Http\Controllers\MasterData\Guru\GuruMutasiController;
use App\Http\Controllers\MasterData\GuruCutiController;
use App\Http\Controllers\MasterData\JadwalPelajaranController;
use App\Http\Controllers\MasterData\ProgramPendidikanController;
use App\Http\Controllers\MasterData\MasterDataKelasController;
use App\Http\Controllers\MasterData\MasterDataMapelController;
use App\Http\Controllers\MasterData\MasterDataOrtuController;
use App\Http\Controllers\MasterData\MasterDataSiswaController;
use App\Http\Controllers\MasterData\NaikKelasController;
use App\Http\Controllers\MasterData\TahunAjaranController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:operator,kepsek,super_admin'])
    ->prefix('operator/master-data')
    ->group(function () {

        // ── GURU ──────────────────────────────────────────────────────────────────
    
        // List, stats, utility — view permission
        Route::middleware('permission:master_data.guru.view')->group(function () {
            Route::get('/guru', [MasterGuruController::class, 'index']);
            Route::get('/guru/stats', [MasterGuruController::class, 'stats']);
            Route::get('/guru/dropdown', [MasterGuruController::class, 'dropdown']);
            Route::get('/guru/perhatian-detail', [MasterGuruController::class, 'perhatianDetail']);
            Route::get('/guru/tanpa-penugasan', [MasterGuruController::class, 'tanpaPenugasan']);
            Route::get('/guru/aktivitas-terkini', [MasterGuruController::class, 'aktivitasTerkini']);
            Route::get('/guru/trash', [MasterGuruController::class, 'trash']);
            Route::get('/guru/{nuptk}', [MasterGuruController::class, 'show']);

            // Sub-data guru (read-only)
            Route::get('/guru/{nuptk}/keluarga', [GuruKeluargaController::class, 'getKeluarga']);
            Route::get('/guru/{nuptk}/kontak-darurat', [GuruKeluargaController::class, 'getKontakDarurat']);
            Route::get('/guru/{nuptk}/pendidikan', [MasterGuruKepegawaianController::class, 'getPendidikan']);
            Route::get('/guru/{nuptk}/sertifikasi', [MasterGuruKepegawaianController::class, 'getSertifikasi']);
            Route::get('/guru/{nuptk}/inpassing', [MasterGuruKepegawaianController::class, 'getInpassing']);
            Route::get('/guru/{nuptk}/jabatan', [MasterGuruKepegawaianController::class, 'getJabatan']);
            Route::get('/guru/{nuptk}/kompetensi', [GuruKompetensiController::class, 'index']);
            Route::get('/guru/{nuptk}/diklat', [MasterGuruKepegawaianController::class, 'getDiklat']);
            Route::get('/guru/{nuptk}/cuti', [GuruCutiController::class, 'index']);
            Route::get('/guru/{nuptk}/mutasi', [GuruMutasiController::class, 'index']);
            Route::get('/guru/{nuptk}/mutasi/allowed-transitions', [GuruMutasiController::class, 'allowedTransitions']);
            Route::get('/guru/{nuptk}/pkg', [MasterGuruKepegawaianController::class, 'getPkg']);
            Route::get('/guru/{nuptk}/administrasi', [GuruAdministrasiController::class, 'getAdministrasi']);
            Route::get('/guru/{nuptk}/penugasan', [GuruAdministrasiController::class, 'getPenugasan']);
            Route::get('/guru/{nuptk}/akun', function (\Illuminate\Http\Request $req, $nuptk) {
                $guru = \App\Models\Guru::where('nuptk', $nuptk)->with('user.roles')->first();
                if (!$guru || !$guru->user) {
                    return response()->json(['success' => true, 'data' => null, 'message' => 'Guru belum memiliki akun.']);
                }
                $u = $guru->user;
                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $u->id,
                        'username' => $u->username ?? $u->email,
                        'email' => $u->email,
                        'role' => $u->roles->pluck('nama'),
                        'is_active' => $u->is_active,
                        'last_login_at' => $u->last_login_at,
                    ],
                ]);
            });
        });

        // Import
        Route::middleware('permission:master_data.guru.import')->group(function () {
            Route::get('/guru/template', [GuruImportController::class, 'downloadTemplate']);
            Route::post('/guru/import', [GuruImportController::class, 'import']);
            Route::post('/guru/import-preview', [GuruImportController::class, 'importPreview']);
            Route::post('/guru/import-execute', [GuruImportController::class, 'importExecute']);
            Route::post('/guru/import-zip', [GuruImportController::class, 'importZip']);
            Route::post('/guru/import-foto', [GuruImportController::class, 'importFoto']);
            Route::get('/guru/import-status/{batchId}', [GuruImportController::class, 'importStatus']);
            Route::get('/guru/import-history', [GuruImportController::class, 'importHistory']);
            Route::get('/guru/import-error-report/{batchId}', [GuruImportController::class, 'importErrorReport']);
            Route::post('/guru/restore', [GuruImportController::class, 'restoreBackup']);
        });

        // Export & Backup
        Route::middleware('permission:master_data.guru.export')->group(function () {
            Route::get('/guru/export', [GuruExportController::class, 'export']);
            Route::get('/guru/backup', [GuruExportController::class, 'exportBackup']);
        });

        // Create / Update / Delete guru
        Route::middleware('permission:master_data.guru.create')->group(function () {
            Route::post('/guru', [MasterGuruController::class, 'store']);
        });

        Route::middleware('permission:master_data.guru.update')->group(function () {
            Route::put('/guru/{nuptk}', [MasterGuruController::class, 'update']);
            Route::post('/guru/{nuptk}/foto', [MasterGuruController::class, 'uploadFoto']);
            Route::patch('/guru/{nuptk}/koreksi-nuptk', [MasterGuruController::class, 'koreksiNuptk']);
            Route::patch('/guru/{nuptk}/restore', [MasterGuruController::class, 'restore']);

            // Sub-data update
            Route::put('/guru/{nuptk}/keluarga', [GuruKeluargaController::class, 'updateKeluarga']);
            Route::post('/guru/{nuptk}/kontak-darurat', [GuruKeluargaController::class, 'storeKontakDarurat']);
            Route::put('/guru/{nuptk}/kontak-darurat/{id}', [GuruKeluargaController::class, 'updateKontakDarurat']);
            Route::delete('/guru/{nuptk}/kontak-darurat/{id}', [GuruKeluargaController::class, 'destroyKontakDarurat']);
            Route::post('/guru/{nuptk}/pendidikan', [MasterGuruKepegawaianController::class, 'storePendidikan']);
            Route::put('/guru/{nuptk}/pendidikan/{id}', [MasterGuruKepegawaianController::class, 'updatePendidikan']);
            Route::delete('/guru/{nuptk}/pendidikan/{id}', [MasterGuruKepegawaianController::class, 'destroyPendidikan']);
            Route::post('/guru/{nuptk}/sertifikasi', [MasterGuruKepegawaianController::class, 'storeSertifikasi']);
            Route::put('/guru/{nuptk}/sertifikasi/{id}', [MasterGuruKepegawaianController::class, 'updateSertifikasi']);
            Route::delete('/guru/{nuptk}/sertifikasi/{id}', [MasterGuruKepegawaianController::class, 'destroySertifikasi']);
            Route::post('/guru/{nuptk}/inpassing', [MasterGuruKepegawaianController::class, 'storeInpassing']);
            Route::put('/guru/{nuptk}/inpassing/{id}', [MasterGuruKepegawaianController::class, 'updateInpassing']);
            Route::delete('/guru/{nuptk}/inpassing/{id}', [MasterGuruKepegawaianController::class, 'destroyInpassing']);
            Route::post('/guru/{nuptk}/jabatan', [MasterGuruKepegawaianController::class, 'storeJabatan']);
            Route::put('/guru/{nuptk}/jabatan/{id}', [MasterGuruKepegawaianController::class, 'updateJabatan']);
            Route::delete('/guru/{nuptk}/jabatan/{id}', [MasterGuruKepegawaianController::class, 'destroyJabatan']);
            Route::post('/guru/{nuptk}/kompetensi', [GuruKompetensiController::class, 'store']);
            Route::put('/guru/{nuptk}/kompetensi/{id}', [GuruKompetensiController::class, 'update']);
            Route::delete('/guru/{nuptk}/kompetensi/{id}', [GuruKompetensiController::class, 'destroy']);
            Route::post('/guru/{nuptk}/diklat', [MasterGuruKepegawaianController::class, 'storeDiklat']);
            Route::put('/guru/{nuptk}/diklat/{id}', [MasterGuruKepegawaianController::class, 'updateDiklat']);
            Route::delete('/guru/{nuptk}/diklat/{id}', [MasterGuruKepegawaianController::class, 'destroyDiklat']);
            Route::post('/guru/{nuptk}/cuti', [GuruCutiController::class, 'store']);
            Route::put('/guru/{nuptk}/cuti/{id}', [GuruCutiController::class, 'update']);
            Route::post('/guru/{nuptk}/cuti/{id}', [GuruCutiController::class, 'update']); // fallback FormData
            Route::patch('/guru/{nuptk}/cuti/{id}/selesai', [GuruCutiController::class, 'selesai']);
            Route::delete('/guru/{nuptk}/cuti/{id}', [GuruCutiController::class, 'destroy']);
            Route::post('/guru/{nuptk}/mutasi/analyze', [GuruMutasiController::class, 'analyze']);
            Route::post('/guru/{nuptk}/mutasi', [GuruMutasiController::class, 'store']);
            Route::put('/guru/{nuptk}/mutasi/{id}', [GuruMutasiController::class, 'update']);
            Route::post('/guru/{nuptk}/mutasi/{id}', [GuruMutasiController::class, 'update']); // fallback FormData
            Route::delete('/guru/{nuptk}/mutasi/{id}', [GuruMutasiController::class, 'destroy']);
            Route::post('/guru/{nuptk}/pkg', [MasterGuruKepegawaianController::class, 'storePkg']);
            Route::put('/guru/{nuptk}/administrasi', [GuruAdministrasiController::class, 'updateAdministrasi']);
            Route::post('/guru/{nuptk}/penugasan', [GuruAdministrasiController::class, 'storePenugasan']);
            Route::delete('/guru/{nuptk}/penugasan/{id}', [GuruAdministrasiController::class, 'destroyPenugasan']);
        });

        Route::middleware('permission:master_data.guru.delete')->group(function () {
            Route::delete('/guru/{nuptk}', [MasterGuruController::class, 'destroy']);
            Route::delete('/guru/{nuptk}/force-delete', [MasterGuruController::class, 'forceDelete']);
        });

        // Verifikasi guru
        Route::middleware('permission:master_data.guru.verify')->group(function () {
            Route::patch('/guru/{nuptk}/verifikasi', [MasterGuruController::class, 'verifikasi']);
            Route::patch('/guru/{nuptk}/batal-verifikasi', [MasterGuruController::class, 'batalVerifikasi']);
        });

        // DMS Guru
        Route::middleware('permission:dms.view_all,dms.view_own')->group(function () {
            Route::get('/guru/{nuptk}/dokumen', [MasterGuruDokumenController::class, 'getDokumen']);
            Route::get('/guru/{nuptk}/dokumen/{id}/versions', [MasterGuruDokumenController::class, 'getDokumenVersions']);
            Route::get('/guru/{nuptk}/dokumen/{id}/logs', [MasterGuruDokumenController::class, 'getDokumenLogs']);
        });

        Route::middleware('permission:dms.upload')->group(function () {
            Route::post('/guru/{nuptk}/dokumen', [MasterGuruDokumenController::class, 'uploadDokumen']);
            Route::post('/guru/{nuptk}/dokumen/{id}', [MasterGuruDokumenController::class, 'updateDokumen']);
        });

        Route::middleware('permission:dms.approve')->group(function () {
            Route::patch('/guru/{nuptk}/dokumen/{id}/approve', [MasterGuruDokumenController::class, 'approveDokumen']);
            Route::patch('/guru/{nuptk}/dokumen/{id}/reject', [MasterGuruDokumenController::class, 'rejectDokumen']);
        });

        Route::middleware('permission:dms.download')->group(function () {
            Route::get('/guru/{nuptk}/dokumen/{id}/download', [MasterGuruDokumenController::class, 'downloadDokumen']);
            Route::get('/guru/{nuptk}/file-download', [MasterGuruDokumenController::class, 'downloadFile']);
        });

        Route::middleware('permission:dms.bulk_download')->group(function () {
            Route::get('/guru/{nuptk}/dokumen-bulk-download', [MasterGuruDokumenController::class, 'bulkDownload']);
        });

        Route::middleware('permission:dms.delete')->group(function () {
            Route::delete('/guru/{nuptk}/dokumen/{id}', [MasterGuruDokumenController::class, 'destroyDokumen']);
        });

        // ── SISWA ─────────────────────────────────────────────────────────────────
    
        Route::middleware('permission:master_data.siswa.view')->group(function () {
            Route::get('/siswa', [MasterDataSiswaController::class, 'index']);
            Route::get('/siswa/orang-tua-options', [MasterDataSiswaController::class, 'orangTuaOptions']);
            Route::get('/siswa/{nisn}', [MasterDataSiswaController::class, 'show']);
        });

        Route::middleware('permission:master_data.siswa.create')->group(function () {
            Route::post('/siswa', [MasterDataSiswaController::class, 'store']);
        });

        Route::middleware('permission:master_data.siswa.update')->group(function () {
            Route::put('/siswa/{nisn}', [MasterDataSiswaController::class, 'update']);
            Route::post('/siswa/{nisn}/assign-kelas', [MasterDataSiswaController::class, 'assignKelas']);
            Route::post('/siswa/{nisn}/foto', [MasterDataSiswaController::class, 'uploadFoto']);
            Route::post('/siswa/{nisn}/regenerate-kode-anak', [MasterDataSiswaController::class, 'regenerateKodeAnak']);
        });

        Route::middleware('permission:master_data.siswa.delete')->group(function () {
            Route::delete('/siswa/{nisn}', [MasterDataSiswaController::class, 'destroy']);
        });

        // ── ORANG TUA ─────────────────────────────────────────────────────────────
    
        Route::middleware('permission:master_data.orang_tua.view')->group(function () {
            Route::get('/orang-tua', [MasterDataOrtuController::class, 'index']);
            Route::get('/orang-tua/{id}', [MasterDataOrtuController::class, 'show']);
        });

        Route::middleware('permission:master_data.orang_tua.manage')->group(function () {
            Route::post('/orang-tua', [MasterDataOrtuController::class, 'store']);
            Route::put('/orang-tua/{id}', [MasterDataOrtuController::class, 'update']);
            Route::delete('/orang-tua/{id}', [MasterDataOrtuController::class, 'destroy']);
        });

        // ── KELAS ─────────────────────────────────────────────────────────────────
    
        Route::middleware('permission:master_data.kelas.view')->group(function () {
            Route::get('/kelas/dropdown', [MasterDataKelasController::class, 'dropdown']);
            Route::get('/kelas/tahun-ajaran', [MasterDataKelasController::class, 'tahunAjaranDropdown']);
            Route::get('/kelas', [MasterDataKelasController::class, 'index']);
            Route::get('/kelas/{id}', [MasterDataKelasController::class, 'show']);
            Route::get('/kelas/{id}/riwayat', [MasterDataKelasController::class, 'riwayatAkademik']);
            Route::get('/kelas/{kelasId}/periode/{tahunAjaranId}', [MasterDataKelasController::class, 'showPeriode']);
        });

        Route::middleware('permission:master_data.kelas.manage')->group(function () {
            Route::post('/kelas', [MasterDataKelasController::class, 'store']);
            Route::put('/kelas/{id}', [MasterDataKelasController::class, 'update']);
            Route::delete('/kelas/{id}', [MasterDataKelasController::class, 'destroy']);
            Route::post('/kelas/{id}/siswa', [MasterDataKelasController::class, 'tambahSiswa']);
            Route::patch('/kelas/{id}/siswa/{siswaKelasId}/keluar', [MasterDataKelasController::class, 'keluarkanSiswa']);
            Route::patch('/kelas/{id}/siswa/{siswaKelasId}/batalkan-keluar', [MasterDataKelasController::class, 'batalkanKeluar']);
        });

        // ── TAHUN AJARAN ──────────────────────────────────────────────────────────
    
        Route::middleware('permission:master_data.tahun_ajaran.view')->group(function () {
            Route::get('/tahun-ajaran', [TahunAjaranController::class, 'index']);
            // Static routes BEFORE /{id} wildcard
            Route::get('/tahun-ajaran/trash', [TahunAjaranController::class, 'trash']);
            Route::get('/tahun-ajaran/arsip', [TahunAjaranController::class, 'arsipList']);
            Route::get('/tahun-ajaran/{id}', [TahunAjaranController::class, 'show']);
        });

        Route::middleware('permission:master_data.tahun_ajaran.manage')->group(function () {
            Route::post('/tahun-ajaran', [TahunAjaranController::class, 'store']);
            Route::put('/tahun-ajaran/{id}', [TahunAjaranController::class, 'update']);
            Route::patch('/tahun-ajaran/{id}/aktif', [TahunAjaranController::class, 'setAktif']);
            Route::patch('/tahun-ajaran/{id}/semester-aktif', [TahunAjaranController::class, 'setSemesterAktif']);
            // Arsip — data historis (periode selesai), berbeda dengan recycle bin
            Route::patch('/tahun-ajaran/{id}/arsip', [TahunAjaranController::class, 'arsip']);
            Route::patch('/tahun-ajaran/{id}/unarsip', [TahunAjaranController::class, 'unarsip']);
            // Recycle bin
            Route::delete('/tahun-ajaran/{id}', [TahunAjaranController::class, 'destroy']);
            Route::patch('/tahun-ajaran/{id}/restore', [TahunAjaranController::class, 'restore']);
            Route::delete('/tahun-ajaran/{id}/force-delete', [TahunAjaranController::class, 'forceDelete']);
        });

        // Naik Kelas — butuh manage kelas + siswa
        Route::middleware('permission:master_data.kelas.manage')->group(function () {
            Route::get('/naik-kelas/preview', [NaikKelasController::class, 'preview']);
            Route::post('/naik-kelas/proses', [NaikKelasController::class, 'proses']);
        });

        // ── MATA PELAJARAN ────────────────────────────────────────────────────────
        // PENTING: static routes (dropdown, export, template) HARUS sebelum wildcard {ulid}
    
        Route::middleware('permission:master_data.mapel.view')->group(function () {
            Route::get('/mapel/dropdown', [MasterDataMapelController::class, 'dropdown'])
                ->name('master-data.mapel.dropdown');
            Route::get('/mapel/stats', [MasterDataMapelController::class, 'stats'])
                ->name('master-data.mapel.stats');
            Route::get('/mapel', [MasterDataMapelController::class, 'index'])
                ->name('master-data.mapel.index');
        });

        Route::middleware('permission:master_data.mapel.manage')->group(function () {
            Route::get('/mapel/export', [MasterDataMapelController::class, 'export'])
                ->name('master-data.mapel.export');
            Route::get('/mapel/template', [MasterDataMapelController::class, 'downloadTemplate'])
                ->name('master-data.mapel.template');
            Route::post('/mapel/import', [MasterDataMapelController::class, 'import'])
                ->name('master-data.mapel.import');
            Route::post('/mapel', [MasterDataMapelController::class, 'store'])
                ->name('master-data.mapel.store');
            Route::put('/mapel/{ulid}', [MasterDataMapelController::class, 'update'])
                ->name('master-data.mapel.update');
            Route::patch('/mapel/{ulid}/toggle-active', [MasterDataMapelController::class, 'toggleActive'])
                ->name('master-data.mapel.toggle-active');
            Route::delete('/mapel/{ulid}', [MasterDataMapelController::class, 'destroy'])
                ->name('master-data.mapel.destroy');
        });

        // Wildcard TERAKHIR — setelah semua static GET routes
        Route::middleware('permission:master_data.mapel.view')->group(function () {
            Route::get('/mapel/{ulid}', [MasterDataMapelController::class, 'show'])
                ->name('master-data.mapel.show');
        });

        // ── PROGRAM PENDIDIKAN ────────────────────────────────────────────────────
        // Menggantikan /jurusan — mendukung hierarki multi-jenjang
        // (Bidang Keahlian → Program Keahlian → Konsentrasi, atau Peminatan SMA/MA)
        // Static routes (dropdown, tree) SEBELUM wildcard {ulid}
    
        Route::middleware('permission:master_data.program.view')->group(function () {
            Route::get('/program-pendidikan/dropdown', [ProgramPendidikanController::class, 'dropdown'])
                ->name('master-data.program.dropdown');
            Route::get('/program-pendidikan/tree', [ProgramPendidikanController::class, 'tree'])
                ->name('master-data.program.tree');
            Route::get('/program-pendidikan/trash', [ProgramPendidikanController::class, 'trash'])
                ->name('master-data.program.trash');
            Route::get('/program-pendidikan', [ProgramPendidikanController::class, 'index'])
                ->name('master-data.program.index');
            Route::get('/program-pendidikan/{ulid}', [ProgramPendidikanController::class, 'show'])
                ->name('master-data.program.show');
        });

        Route::middleware('permission:master_data.program.manage')->group(function () {
            Route::post('/program-pendidikan', [ProgramPendidikanController::class, 'store'])
                ->name('master-data.program.store');
            Route::put('/program-pendidikan/{ulid}', [ProgramPendidikanController::class, 'update'])
                ->name('master-data.program.update');
            Route::patch('/program-pendidikan/{ulid}/toggle-active', [ProgramPendidikanController::class, 'toggleActive'])
                ->name('master-data.program.toggle-active');
            Route::delete('/program-pendidikan/{ulid}', [ProgramPendidikanController::class, 'destroy'])
                ->name('master-data.program.destroy');
            // Recycle bin — static routes SEBELUM {ulid} wildcard
            Route::patch('/program-pendidikan/{ulid}/restore', [ProgramPendidikanController::class, 'restore'])
                ->name('master-data.program.restore');
            Route::delete('/program-pendidikan/{ulid}/force-delete', [ProgramPendidikanController::class, 'forceDelete'])
                ->name('master-data.program.force-delete');
        });

        // ── JADWAL PELAJARAN ──────────────────────────────────────────────────────
    
        Route::middleware('permission:akademik.jadwal.manage')->group(function () {
            Route::get('/jadwal-pelajaran', [JadwalPelajaranController::class, 'index']);
            Route::post('/jadwal-pelajaran', [JadwalPelajaranController::class, 'store']);
            Route::put('/jadwal-pelajaran/{id}', [JadwalPelajaranController::class, 'update']);
            Route::delete('/jadwal-pelajaran/{id}', [JadwalPelajaranController::class, 'destroy']);
        });
    });