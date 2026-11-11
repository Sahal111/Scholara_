import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

// ── Komponen loading fallback ──────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-400">Memuat halaman...</p>
      </div>
    </div>
  );
}

// ── Auth & Landing — STATIS (selalu dibutuhkan pertama kali) ──────────────────
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterOrtuPage from "./pages/auth/RegisterOrtuPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// ── Public pages — STATIS (sering dikunjungi tanpa login) ────────────────────
import GalleryPage from "./pages/public/GalleryPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import ProgramPage from "./pages/public/ProgramPage";
import AkademikPage from "./pages/public/AkademikPage";
import PpdbPage from "./pages/public/PpdbPage";

// ── LAZY: Operator ────────────────────────────────────────────────────────────
const OperatorLayout        = lazy(() => import("./pages/operator/OperatorLayout"));
const DashboardOperator     = lazy(() => import("./pages/operator/DashboardOperator"));
const ManajemenAkun         = lazy(() => import("./pages/operator/ManajemenAkun"));
const MasterGuru            = lazy(() => import("./pages/operator/master/masterDataGuru/MasterGuru"));
const TambahEditGuru        = lazy(() => import("./pages/operator/master/masterDataGuru/TambahEditGuru"));
const DetailGuru            = lazy(() => import("./pages/operator/master/masterDataGuru/DetailGuru"));
const MasterSiswa           = lazy(() => import("./pages/operator/master/masterDataSiswa/MasterSiswa"));
const TambahEditSiswa       = lazy(() => import("./pages/operator/master/masterDataSiswa/TambahEditSiswa"));
const DetailSiswa           = lazy(() => import("./pages/operator/master/masterDataSiswa/DetailSiswa"));
const MutasiSiswa           = lazy(() => import("./pages/operator/master/masterDataSiswa/MutasiSiswa"));
const MasterKelas           = lazy(() => import("./pages/operator/master/masterDataKelas/MasterKelas"));
const DetailKelas           = lazy(() => import("./pages/operator/master/masterDataKelas/DetailKelas"));
const DetailKelasPeriodeAkademik = lazy(() => import("./pages/operator/master/masterDataKelas/DetailKelasPeriodeAkademik"));
const MasterOrtu            = lazy(() => import("./pages/operator/master/masterDataOrtu/MasterOrtu"));
const DetailOrtu            = lazy(() => import("./pages/operator/master/masterDataOrtu/DetailOrtu"));
const DetailDataOrtu        = lazy(() => import("./pages/operator/master/masterDataOrtu/DetailDataOrtu"));
const TahunAjaranSemesterOperator = lazy(() => import("./pages/operator/master/masterDataTahunAjaran/TahunAjaranSemester"));
const DetailTahunAjaranOperator   = lazy(() => import("./pages/operator/master/masterDataTahunAjaran/DetailTahunAjaran"));
const DetailSemesterOperator      = lazy(() => import("./pages/operator/master/masterDataTahunAjaran/DetailSemester"));
const RecycleBinTahunAjaranOperator = lazy(() => import("./pages/operator/master/masterDataTahunAjaran/components/RecycleBinTahunAjaran"));
const ArsipTahunAjaranOperator    = lazy(() => import("./pages/operator/master/masterDataTahunAjaran/components/ArsipTahunAjaran"));
const DetailArsipTahunAjaranOperator = lazy(() => import("./pages/operator/master/masterDataTahunAjaran/DetailArsipTahunAjaran"));
const ApprovalOrtu          = lazy(() => import("./pages/operator/ApprovalOrtu"));
const NaikKelas             = lazy(() => import("./pages/operator/master/NaikKelas"));
const MasterMapel           = lazy(() => import("./pages/wakasek/akademik/mapel/MasterMapel"));
const MasterJadwal          = lazy(() => import("./pages/wakasek/akademik/jadwal/MasterJadwal"));
const PengumumanOperator    = lazy(() => import("./pages/operator/master/PengumumanOperator"));
const GaleriOperator        = lazy(() => import("./pages/operator/master/GaleriOperator"));

// ── LAZY: Guru ────────────────────────────────────────────────────────────────
const GuruLayout            = lazy(() => import("./pages/guru/GuruLayout"));
const DashboardGuru         = lazy(() => import("./pages/guru/DashboardGuru"));
const DataSiswaGuru         = lazy(() => import("./pages/guru/DataSiswaGuru"));
const DetailSiswaGuru       = lazy(() => import("./pages/guru/DetailSiswaGuru"));
const InputAbsensi          = lazy(() => import("./pages/guru/InputAbsensi"));
const RiwayatAbsensiSiswaGuru = lazy(() => import("./pages/guru/RiwayatAbsensiSiswaGuru"));
const RekapAbsensiGuru      = lazy(() => import("./pages/guru/RekapAbsensiGuru"));
const JadwalMengajarGuru    = lazy(() => import("./pages/guru/JadwalMengajarGuru"));
const PengumumanGuru        = lazy(() => import("./pages/guru/PengumumanGuru"));
const ProfilGuru            = lazy(() => import("./pages/guru/ProfilGuru"));
const LmsMateri             = lazy(() => import("./pages/guru/lms/LmsMateri"));
const LmsTugas              = lazy(() => import("./pages/guru/lms/LmsTugas"));
const LmsUjian              = lazy(() => import("./pages/guru/lms/LmsUjian"));
const InputNilaiPage        = lazy(() => import("./pages/guru/InputNilaiPage"));

// ── LAZY: Kepsek ──────────────────────────────────────────────────────────────
const KepsekLayout          = lazy(() => import("./pages/kepsek/KepsekLayout"));
const DashboardKepsek       = lazy(() => import("./pages/kepsek/DashboardKepsek"));
const DataGuruKepsek        = lazy(() => import("./pages/kepsek/DataGuruKepsek"));
const DetailGuruKepsek      = lazy(() => import("./pages/kepsek/DetailGuruKepsek"));
const DataSiswaKepsek       = lazy(() => import("./pages/kepsek/DataSiswaKepsek"));
const DetailSiswaKepsek     = lazy(() => import("./pages/kepsek/DetailSiswaKepsek"));
const MonitoringAbsensi     = lazy(() => import("./pages/kepsek/MonitoringAbsensi"));
const PengumumanKepsek      = lazy(() => import("./pages/kepsek/PengumumanKepsek"));
const KalenderAkademik      = lazy(() => import("./pages/kepsek/KalenderAkademik"));
const ProfilKepsek          = lazy(() => import("./pages/kepsek/ProfilKepsek"));
const TahunAjaranKepsek     = lazy(() => import("./pages/kepsek/tahunAjaran/TahunAjaranKepsek"));
const DetailTahunAjaranKepsek = lazy(() => import("./pages/kepsek/tahunAjaran/DetailTahunAjaran"));
const DetailSemesterKepsek  = lazy(() => import("./pages/kepsek/tahunAjaran/DetailSemester"));

// ── LAZY: Ortu ────────────────────────────────────────────────────────────────
const OrtuLayout            = lazy(() => import("./pages/ortu/OrtuLayout"));
const AbsensiAnak           = lazy(() => import("./pages/ortu/AbsensiAnak"));
const RiwayatAbsensiAnak    = lazy(() => import("./pages/ortu/RiwayatAbsensiAnak"));
const PengumumanOrtu        = lazy(() => import("./pages/ortu/PengumumanOrtu"));
const ProfilOrtu            = lazy(() => import("./pages/ortu/ProfilOrtu"));
const DataAnak              = lazy(() => import("./pages/ortu/DataAnak"));
const TambahAnak            = lazy(() => import("./pages/ortu/TambahAnak"));

// ── LAZY: Wali Kelas ──────────────────────────────────────────────────────────
const WaliKelasLayout       = lazy(() => import("./pages/walikelas/WaliKelasLayout"));
const DashboardWaliKelas    = lazy(() => import("./pages/walikelas/DashboardWaliKelas"));
const RaporPage             = lazy(() => import("./pages/walikelas/RaporPage"));
const DetailRaporPage       = lazy(() => import("./pages/walikelas/DetailRaporPage"));

// ── LAZY: Bendahara ───────────────────────────────────────────────────────────
const BendaharaLayout       = lazy(() => import("./pages/bendahara/BendaharaLayout"));
const DashboardBendahara    = lazy(() => import("./pages/bendahara/DashboardBendahara"));

// ── LAZY: Admin PPDB ──────────────────────────────────────────────────────────
const AdminPpdbLayout       = lazy(() => import("./pages/adminppdb/AdminPpdbLayout"));
const DashboardAdminPpdb    = lazy(() => import("./pages/adminppdb/DashboardAdminPpdb"));

// ── LAZY: Super Admin ─────────────────────────────────────────────────────────
const SuperAdminLayout      = lazy(() => import("./pages/superadmin/SuperAdminLayout"));
const DashboardSuperAdmin   = lazy(() => import("./pages/superadmin/DashboardSuperAdmin"));

// ── LAZY: Wakasek ─────────────────────────────────────────────────────────────
const WakasekLayout         = lazy(() => import("./pages/wakasek/WakasekLayout"));
const DashboardWakasek      = lazy(() => import("./pages/wakasek/DashboardWakasek"));
const MasterKurikulum       = lazy(() => import("./pages/wakasek/akademik/kurikulum/MasterKurikulum"));
const DetailImplementasiKurikulum = lazy(() => import("./shared/kurikulum/DetailImplementasiKurikulum"));
const MasterProgramWakasek  = lazy(() => import("./pages/wakasek/akademik/program-pendidikan/MasterProgramWakasek"));
const RecycleBinProgramWakasek = lazy(() => import("./pages/wakasek/akademik/program-pendidikan/RecycleBinProgramWakasek"));
const MasterMapelWakasek    = lazy(() => import("./pages/wakasek/akademik/mapel/MasterMapelWakasek"));
const MasterKelasWakasek    = lazy(() => import("./pages/wakasek/akademik/kelas/MasterKelasWakasek"));
const DetailKelasWakasek    = lazy(() => import("./pages/wakasek/akademik/kelas/DetailKelasWakasek"));
const DetailKelasPeriodeAkademikWakasek = lazy(() => import("./pages/wakasek/akademik/kelas/DetailKelasPeriodeAkademikWakasek"));
const TahunAjaranSemesterWakasek = lazy(() => import("./shared/tahun-ajaran/TahunAjaranSemester"));
const DetailTahunAjaranWakasek   = lazy(() => import("./shared/tahun-ajaran/DetailTahunAjaran"));
const DetailSemesterWakasek      = lazy(() => import("./shared/tahun-ajaran/DetailSemester"));
const RecycleBinTahunAjaranWakasek = lazy(() => import("./shared/tahun-ajaran/components/RecycleBinTahunAjaran"));
const ArsipTahunAjaranWakasek    = lazy(() => import("./shared/tahun-ajaran/components/ArsipTahunAjaran"));
const DetailArsipTahunAjaranWakasek = lazy(() => import("./shared/tahun-ajaran/DetailArsipTahunAjaran"));
const DataGuruWakasek       = lazy(() => import("./pages/wakasek/DataGuruWakasek"));
const DetailGuruWakasek     = lazy(() => import("./pages/wakasek/DetailGuruWakasek"));
const DataSiswaWakasek      = lazy(() => import("./pages/wakasek/DataSiswaWakasek"));
const DetailSiswaWakasek    = lazy(() => import("./pages/wakasek/DetailSiswaWakasek"));
const MonitoringAbsensiWakasek = lazy(() => import("./pages/wakasek/MonitoringAbsensiWakasek"));
const PengumumanWakasek     = lazy(() => import("./pages/wakasek/PengumumanWakasek"));
const LaporanWakasek        = lazy(() => import("./pages/wakasek/LaporanWakasek"));
const ProfilWakasek         = lazy(() => import("./pages/wakasek/ProfilWakasek"));

// ── LAZY: Guru BK ─────────────────────────────────────────────────────────────
const GuruBkLayout          = lazy(() => import("./pages/guru-bk/GuruBkLayout"));
const DashboardGuruBk       = lazy(() => import("./pages/guru-bk/DashboardGuruBk"));
const KonselingPage         = lazy(() => import("./pages/guru-bk/KonselingPage"));
const TambahKonselingPage   = lazy(() => import("./pages/guru-bk/TambahKonselingPage"));
const CatatanBkPage         = lazy(() => import("./pages/guru-bk/CatatanBkPage"));
const TambahCatatanBkPage   = lazy(() => import("./pages/guru-bk/TambahCatatanBkPage"));

// ── LAZY: Pustakawan ──────────────────────────────────────────────────────────
const PustakawanLayout      = lazy(() => import("./pages/pustakawan/PustakawanLayout"));
const DashboardPustakawan   = lazy(() => import("./pages/pustakawan/DashboardPustakawan"));
const KatalogBukuPage       = lazy(() => import("./pages/pustakawan/KatalogBukuPage"));
const PeminjamanPage        = lazy(() => import("./pages/pustakawan/PeminjamanPage"));
const TambahBukuPage        = lazy(() => import("./pages/pustakawan/TambahBukuPage"));
const TambahPeminjamanPage  = lazy(() => import("./pages/pustakawan/TambahPeminjamanPage"));

// ── LAZY: Tata Usaha ──────────────────────────────────────────────────────────
const TataUsahaLayout       = lazy(() => import("./pages/tata-usaha/TataUsahaLayout"));
const DashboardTataUsaha    = lazy(() => import("./pages/tata-usaha/DashboardTataUsaha"));
const SuratPage             = lazy(() => import("./pages/tata-usaha/SuratPage"));
const LegalisirPage         = lazy(() => import("./pages/tata-usaha/LegalisirPage"));
const TambahSuratPage       = lazy(() => import("./pages/tata-usaha/TambahSuratPage"));

// ── LAZY: Admin Keuangan ──────────────────────────────────────────────────────
const AdminKeuanganLayout   = lazy(() => import("./pages/admin-keuangan/AdminKeuanganLayout"));
const DashboardAdminKeuangan = lazy(() => import("./pages/admin-keuangan/DashboardAdminKeuangan"));

// ── LAZY: Siswa ───────────────────────────────────────────────────────────────
const SiswaLayout           = lazy(() => import("./pages/siswa/SiswaLayout"));
const DashboardSiswa        = lazy(() => import("./pages/siswa/DashboardSiswa"));

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<AboutPage />} />
        <Route path="/program" element={<ProgramPage />} />
        <Route path="/akademik" element={<AkademikPage />} />
        <Route path="/ppdb" element={<PpdbPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-ortu" element={<RegisterOrtuPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Global Super Admin (Developer SaaS Owner) */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardSuperAdmin />} />
        </Route>

        {/* Siswa */}
        <Route
          path="/siswa"
          element={
            <ProtectedRoute roles={["siswa"]}>
              <SiswaLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardSiswa />} />
        </Route>

        {/* Operator */}
        <Route
          path="/operator"
          element={
            <ProtectedRoute roles={["operator"]}>
              <OperatorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManajemenAkun />} />
          <Route path="dashboard" element={<DashboardOperator />} />
          <Route path="master/guru" element={<MasterGuru />} />
          <Route path="master/guru/tambah" element={<TambahEditGuru />} />
          <Route path="master/guru/edit/:nuptk" element={<TambahEditGuru />} />
          <Route path="master/siswa" element={<MasterSiswa />} />
          <Route path="master/siswa/tambah" element={<TambahEditSiswa />} />
          <Route path="master/siswa/edit/:nisn" element={<TambahEditSiswa />} />
          <Route path="master/kelas" element={<MasterKelas />} />
          <Route path="master/ortu" element={<MasterOrtu />} />
          <Route
            path="master/tahun-ajaran"
            element={<TahunAjaranSemesterOperator />}
          />
          <Route path="ortu-pending" element={<ApprovalOrtu />} />
          <Route path="master/guru/:nuptk" element={<DetailGuru />} />
          <Route path="master/siswa/:nisn" element={<DetailSiswa />} />
          <Route path="master/siswa/:nisn/mutasi" element={<MutasiSiswa />} />
          <Route path="master/kelas/:id" element={<DetailKelas />} />
          <Route
            path="master/kelas/:kelasId/periode/:periodeId"
            element={<DetailKelasPeriodeAkademik />}
          />
          <Route path="master/ortu/:id" element={<DetailOrtu />} />
          <Route path="master/naik-kelas" element={<NaikKelas />} />
          <Route
            path="master/tahun-ajaran/recycle-bin"
            element={<RecycleBinTahunAjaranOperator />}
          />
          <Route
            path="master/tahun-ajaran/arsip"
            element={<ArsipTahunAjaranOperator />}
          />
          <Route
            path="master/tahun-ajaran/arsip/:id"
            element={<DetailArsipTahunAjaranOperator />}
          />
          {/* Semester detail — SEBELUM :id agar tidak tertangkap wildcard */}
          <Route
            path="master/tahun-ajaran/:taId/semester/:semesterNama"
            element={<DetailSemesterOperator />}
          />
          <Route
            path="master/tahun-ajaran/:id"
            element={<DetailTahunAjaranOperator />}
          />
          <Route path="master/mapel" element={<MasterMapel />} />
          <Route path="master/jadwal-pelajaran" element={<MasterJadwal />} />
          <Route path="master/pengumuman" element={<PengumumanOperator />} />
          <Route path="master/galeri" element={<GaleriOperator />} />
          <Route path="master/ortu/keluarga/:id" element={<DetailDataOrtu />} />
        </Route>

        {/* Guru */}
        <Route
          path="/guru"
          element={
            <ProtectedRoute roles={["guru"]}>
              <GuruLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardGuru />} />
          <Route path="siswa" element={<DataSiswaGuru />} />
          <Route path="siswa/:nisn" element={<DetailSiswaGuru />} />
          <Route
            path="siswa/:nisn/riwayat"
            element={<RiwayatAbsensiSiswaGuru />}
          />
          <Route path="absensi" element={<InputAbsensi />} />
          <Route path="rekap-absensi" element={<RekapAbsensiGuru />} />
          <Route path="jadwal" element={<JadwalMengajarGuru />} />
          <Route path="lms/materi" element={<LmsMateri />} />
          <Route path="lms/tugas" element={<LmsTugas />} />
          <Route path="lms/ujian" element={<LmsUjian />} />
          <Route path="nilai" element={<InputNilaiPage />} />
          <Route path="pengumuman" element={<PengumumanGuru />} />
          <Route path="profil" element={<ProfilGuru />} />
        </Route>

        {/* Kepsek */}
        <Route
          path="/kepsek"
          element={
            <ProtectedRoute roles={["kepsek"]}>
              <KepsekLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardKepsek />} />
          <Route
            path="kurikulum/implementasi/:ulid"
            element={<DetailImplementasiKurikulum />}
          />
          <Route path="monitoring-absensi" element={<MonitoringAbsensi />} />
          <Route path="tahun-ajaran" element={<TahunAjaranKepsek />} />
          {/* Semester detail — SEBELUM :id agar tidak tertangkap wildcard */}
          <Route
            path="tahun-ajaran/:taId/semester/:semesterNama"
            element={<DetailSemesterKepsek />}
          />
          <Route path="tahun-ajaran/:id" element={<DetailTahunAjaranKepsek />} />
          <Route path="guru" element={<DataGuruKepsek />} />
          <Route path="guru/:nuptk" element={<DetailGuruKepsek />} />
          <Route path="siswa" element={<DataSiswaKepsek />} />
          <Route path="siswa/:nisn" element={<DetailSiswaKepsek />} />
          <Route path="pengumuman" element={<PengumumanKepsek />} />
          <Route path="kalender" element={<KalenderAkademik />} />
          <Route path="profil" element={<ProfilKepsek />} />
        </Route>

        {/* Ortu */}
        <Route
          path="/ortu"
          element={
            <ProtectedRoute roles={["ortu"]}>
              <OrtuLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AbsensiAnak />} />
          <Route path="riwayat-absensi" element={<RiwayatAbsensiAnak />} />
          <Route path="pengumuman" element={<PengumumanOrtu />} />
          <Route path="data-anak" element={<DataAnak />} />
          <Route path="tambah-anak" element={<TambahAnak />} />
          <Route path="profil" element={<ProfilOrtu />} />
        </Route>

        {/* Wali Kelas */}
        <Route
          path="/walikelas"
          element={
            <ProtectedRoute roles={["wali_kelas"]}>
              <WaliKelasLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardWaliKelas />} />
          <Route path="rapor" element={<RaporPage />} />
          <Route path="rapor/:id" element={<DetailRaporPage />} />
        </Route>

        {/* Bendahara */}
        <Route
          path="/bendahara"
          element={
            <ProtectedRoute roles={["bendahara"]}>
              <BendaharaLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardBendahara />} />
        </Route>

        {/* Admin PPDB */}
        <Route
          path="/adminppdb"
          element={
            <ProtectedRoute roles={["admin_ppdb"]}>
              <AdminPpdbLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardAdminPpdb />} />
        </Route>

        {/* Wakasek */}
        <Route
          path="/wakasek"
          element={
            <ProtectedRoute roles={["wakasek"]}>
              <WakasekLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardWakasek />} />

          {/* Kebijakan Akademik */}
          <Route path="kurikulum" element={<MasterKurikulum />} />
          <Route
            path="kurikulum/implementasi/:ulid"
            element={<DetailImplementasiKurikulum />}
          />
          {/* Bug #4 fix: oper basePath agar navigasi detail/recycle-bin tidak lari ke /operator */}
          <Route
            path="tahun-ajaran"
            element={
              <TahunAjaranSemesterWakasek basePath="/wakasek/tahun-ajaran" />
            }
          />
          {/*
            BUG-01 fix: tambah route recycle-bin dan arsip yang sebelumnya tidak terdaftar
              → tombol "Recycle Bin" & "Arsip" di header TahunAjaranSemester.jsx akan 404 tanpa ini.
            BUG-02 fix: semua route STATIS (recycle-bin, arsip, arsip/:id) didaftarkan
              SEBELUM wildcard (:id) agar React Router v7 tidak menangkap "arsip" / "recycle-bin"
              sebagai nilai parameter :id di DetailTahunAjaran.
          */}
          <Route
            path="tahun-ajaran/recycle-bin"
            element={
              <RecycleBinTahunAjaranWakasek basePath="/wakasek/tahun-ajaran" />
            }
          />
          <Route
            path="tahun-ajaran/arsip"
            element={<ArsipTahunAjaranWakasek basePath="/wakasek/tahun-ajaran" />}
          />
          <Route
            path="tahun-ajaran/arsip/:id"
            element={
              <DetailArsipTahunAjaranWakasek
                basePath="/wakasek/tahun-ajaran"
                apiBase="/operator/master-data/tahun-ajaran"
              />
            }
          />
          {/* Bug #5a fix: param harus taId & semesterNama sesuai useParams() di DetailSemester.jsx */}
          <Route
            path="tahun-ajaran/:taId/semester/:semesterNama"
            element={
              <DetailSemesterWakasek
                basePath="/wakasek/tahun-ajaran"
                apiBase="/operator/master-data/tahun-ajaran"
              />
            }
          />
          <Route
            path="tahun-ajaran/:id"
            element={
              <DetailTahunAjaranWakasek basePath="/wakasek/tahun-ajaran" />
            }
          />
          <Route path="program-pendidikan" element={<MasterProgramWakasek />} />
          <Route
            path="program-pendidikan/recycle-bin"
            element={<RecycleBinProgramWakasek />}
          />
          <Route path="mapel" element={<MasterMapelWakasek />} />
          <Route path="kelas" element={<MasterKelasWakasek />} />
          {/* Fix #11: param nama harus kelasId agar sesuai useParams() di komponen */}
          <Route path="kelas/:kelasId" element={<DetailKelasWakasek />} />
          <Route
            path="kelas/:kelasId/periode/:periodeId"
            element={<DetailKelasPeriodeAkademikWakasek />}
          />

          {/* Pengawasan — Data Guru (view-only) */}
          <Route path="guru" element={<DataGuruWakasek />} />
          <Route path="guru/:nuptk" element={<DetailGuruWakasek />} />

          {/* Pengawasan — Data Siswa (view-only) */}
          <Route path="siswa" element={<DataSiswaWakasek />} />
          <Route path="siswa/:nisn" element={<DetailSiswaWakasek />} />

          {/* Pengawasan — Monitoring Absensi */}
          <Route path="absensi" element={<MonitoringAbsensiWakasek />} />

          {/* Kalender Akademik — Bug #5c fix: route belum terdaftar di wakasek block */}
          {/* Bug #9 fix: oper apiBase agar query ke /wakasek/kalender, bukan /kepsek/kalender */}
          <Route
            path="kalender"
            element={<KalenderAkademik apiBase="/wakasek/kalender" />}
          />

          {/* Informasi */}
          <Route path="pengumuman" element={<PengumumanWakasek />} />
          <Route path="laporan" element={<LaporanWakasek />} />

          {/* Profil */}
          <Route path="profil" element={<ProfilWakasek />} />
        </Route>

        {/* Guru BK */}
        <Route
          path="/guru-bk"
          element={
            <ProtectedRoute roles={["guru_bk"]}>
              <GuruBkLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardGuruBk />} />
          <Route path="konseling" element={<KonselingPage />} />
          <Route path="konseling/tambah" element={<TambahKonselingPage />} />
          <Route path="catatan" element={<CatatanBkPage />} />
          <Route path="catatan/tambah" element={<TambahCatatanBkPage />} />
        </Route>

        {/* Pustakawan */}
        <Route
          path="/pustakawan"
          element={
            <ProtectedRoute roles={["pustakawan"]}>
              <PustakawanLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPustakawan />} />
          <Route path="buku" element={<KatalogBukuPage />} />
          <Route path="buku/tambah" element={<TambahBukuPage />} />
          <Route path="peminjaman" element={<PeminjamanPage />} />
          <Route path="peminjaman/tambah" element={<TambahPeminjamanPage />} />
        </Route>

        {/* Tata Usaha */}
        <Route
          path="/tata-usaha"
          element={
            <ProtectedRoute roles={["tata_usaha"]}>
              <TataUsahaLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardTataUsaha />} />
          <Route path="surat" element={<SuratPage />} />
          <Route path="surat/tambah" element={<TambahSuratPage />} />
          <Route path="legalisir" element={<LegalisirPage />} />
        </Route>

        {/* Admin Keuangan */}
        <Route
          path="/admin-keuangan"
          element={
            <ProtectedRoute roles={["admin_keuangan"]}>
              <AdminKeuanganLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardAdminKeuangan />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
