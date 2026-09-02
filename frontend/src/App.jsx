import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

// Pages (akan kita buat satu per satu)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterOrtuPage from "./pages/auth/RegisterOrtuPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// Public pages
import GalleryPage from "./pages/public/GalleryPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import ProgramPage from "./pages/public/ProgramPage";
import AkademikPage from "./pages/public/AkademikPage";
import PpdbPage from "./pages/public/PpdbPage";

// Operator
import OperatorLayout from "./pages/operator/OperatorLayout";
import DashboardOperator from "./pages/operator/DashboardOperator";
import ManajemenAkun from "./pages/operator/ManajemenAkun";
import MasterGuru from "./pages/operator/master/masterDataGuru/MasterGuru";
import TambahEditGuru from "./pages/operator/master/masterDataGuru/TambahEditGuru";
import MasterSiswa from "./pages/operator/master/masterDataSiswa/MasterSiswa";
import TambahEditSiswa from "./pages/operator/master/masterDataSiswa/TambahEditSiswa";
import MasterKelas from "./pages/operator/master/masterDataKelas/MasterKelas";
import MasterOrtu from "./pages/operator/master/masterDataOrtu/MasterOrtu";
import TahunAjaran from "./pages/operator/master/masterDataTahunAjaranSemester/TahunAjaranSemester";
import ApprovalOrtu from "./pages/operator/ApprovalOrtu";
import DetailGuru from "./pages/operator/master/masterDataGuru/DetailGuru";
import DetailSiswa from "./pages/operator/master/masterDataSiswa/DetailSiswa";
import MutasiSiswa from "./pages/operator/master/masterDataSiswa/MutasiSiswa";
import DetailKelas from "./pages/operator/master/masterDataKelas/DetailKelas";
import DetailKelasPeriodeAkademik from "./pages/operator/master/masterDataKelas/DetailKelasPeriodeAkademik";
import DetailOrtu from "./pages/operator/master/masterDataOrtu/DetailOrtu";
import NaikKelas from "./pages/operator/master/NaikKelas";
import DetailTahunAjaran from "./pages/operator/master/masterDataTahunAjaranSemester/DetailTahunAjaran";
import DetailSemester from "./pages/operator/master/masterDataTahunAjaranSemester/DetailSemester";
import RecycleBinTahunAjaran from "./pages/operator/master/masterDataTahunAjaranSemester/components/RecycleBinTahunAjaran";
import RecycleBinProgram from "./pages/operator/master/masterDataProgram/RecycleBinProgram";
import ArsipTahunAjaran from "./pages/operator/master/masterDataTahunAjaranSemester/components/ArsipTahunAjaran";
import DetailArsipTahunAjaran from "./pages/operator/master/masterDataTahunAjaranSemester/DetailArsipTahunAjaran";
import MasterMapel from "./pages/operator/master/masterDataMapel/MasterMapel";
import MasterProgram from "./pages/operator/master/masterDataProgram/MasterProgram";
import MasterJadwal from "./pages/operator/master/MasterJadwal";
import PengumumanOperator from "./pages/operator/master/PengumumanOperator";
import GaleriOperator from "./pages/operator/master/GaleriOperator";
import DetailDataOrtu from "./pages/operator/master/masterDataOrtu/DetailDataOrtu";

// Guru
import GuruLayout from "./pages/guru/GuruLayout";
import DashboardGuru from "./pages/guru/DashboardGuru";
import DataSiswaGuru from "./pages/guru/DataSiswaGuru";
import DetailSiswaGuru from "./pages/guru/DetailSiswaGuru";
import InputAbsensi from "./pages/guru/InputAbsensi";
import RiwayatAbsensiSiswaGuru from "./pages/guru/RiwayatAbsensiSiswaGuru";
import RekapAbsensiGuru from "./pages/guru/RekapAbsensiGuru";
import JadwalMengajarGuru from "./pages/guru/JadwalMengajarGuru";
import PengumumanGuru from "./pages/guru/PengumumanGuru";
import ProfilGuru from "./pages/guru/ProfilGuru";
import LmsMateri from "./pages/guru/lms/LmsMateri";
import LmsTugas from "./pages/guru/lms/LmsTugas";
import LmsUjian from "./pages/guru/lms/LmsUjian";

// Kepsek
import KepsekLayout from "./pages/kepsek/KepsekLayout";
import DashboardKepsek from "./pages/kepsek/DashboardKepsek";
import DataGuruKepsek from "./pages/kepsek/DataGuruKepsek";
import DetailGuruKepsek from "./pages/kepsek/DetailGuruKepsek";
import DataSiswaKepsek from "./pages/kepsek/DataSiswaKepsek";
import DetailSiswaKepsek from "./pages/kepsek/DetailSiswaKepsek";
import MonitoringAbsensi from "./pages/kepsek/MonitoringAbsensi";
import PengumumanKepsek from "./pages/kepsek/PengumumanKepsek";
import KalenderAkademik from "./pages/kepsek/KalenderAkademik";
import ProfilKepsek from "./pages/kepsek/ProfilKepsek";

// Ortu
import OrtuLayout from "./pages/ortu/OrtuLayout";
import AbsensiAnak from "./pages/ortu/AbsensiAnak";
import RiwayatAbsensiAnak from "./pages/ortu/RiwayatAbsensiAnak";
import PengumumanOrtu from "./pages/ortu/PengumumanOrtu";
import ProfilOrtu from "./pages/ortu/ProfilOrtu";
import DataAnak from "./pages/ortu/DataAnak";
import TambahAnak from "./pages/ortu/TambahAnak";

// Wali Kelas
import WaliKelasLayout from "./pages/walikelas/WaliKelasLayout";
import DashboardWaliKelas from "./pages/walikelas/DashboardWaliKelas";

// Bendahara
import BendaharaLayout from "./pages/bendahara/BendaharaLayout";
import DashboardBendahara from "./pages/bendahara/DashboardBendahara";

// Admin PPDB
import AdminPpdbLayout from "./pages/adminppdb/AdminPpdbLayout";
import DashboardAdminPpdb from "./pages/adminppdb/DashboardAdminPpdb";

// Global Super Admin (Developer SaaS Platform Owner)
import SuperAdminLayout from "./pages/superadmin/SuperAdminLayout";
import DashboardSuperAdmin from "./pages/superadmin/DashboardSuperAdmin";

// Wakasek
import WakasekLayout from "./pages/wakasek/WakasekLayout";
import DashboardWakasek from "./pages/wakasek/DashboardWakasek";

// Guru BK
import GuruBkLayout from "./pages/guru-bk/GuruBkLayout";
import DashboardGuruBk from "./pages/guru-bk/DashboardGuruBk";

// Pustakawan
import PustakawanLayout from "./pages/pustakawan/PustakawanLayout";
import DashboardPustakawan from "./pages/pustakawan/DashboardPustakawan";

// Tata Usaha
import TataUsahaLayout from "./pages/tata-usaha/TataUsahaLayout";
import DashboardTataUsaha from "./pages/tata-usaha/DashboardTataUsaha";

// Admin Keuangan
import AdminKeuanganLayout from "./pages/admin-keuangan/AdminKeuanganLayout";
import DashboardAdminKeuangan from "./pages/admin-keuangan/DashboardAdminKeuangan";

// Siswa
import SiswaLayout from "./pages/siswa/SiswaLayout";
import DashboardSiswa from "./pages/siswa/DashboardSiswa";

export default function App() {
  return (
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
        <Route path="master/tahun-ajaran" element={<TahunAjaran />} />
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
          element={<RecycleBinTahunAjaran />}
        />
        <Route
          path="master/tahun-ajaran/arsip"
          element={<ArsipTahunAjaran />}
        />
        <Route
          path="master/tahun-ajaran/arsip/:id"
          element={<DetailArsipTahunAjaran />}
        />
        <Route path="master/tahun-ajaran/:id" element={<DetailTahunAjaran />} />
        <Route
          path="master/tahun-ajaran/:taId/semester/:semesterNama"
          element={<DetailSemester />}
        />
        <Route path="master/mapel" element={<MasterMapel />} />
        <Route
          path="master/program-pendidikan/recycle-bin"
          element={<RecycleBinProgram />}
        />
        <Route path="master/program-pendidikan" element={<MasterProgram />} />
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
        <Route path="monitoring-absensi" element={<MonitoringAbsensi />} />
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
  );
}
