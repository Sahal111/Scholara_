import { Outlet } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Award,
  Bell,
  User,
} from "lucide-react";

const menus = [
  { path: "/siswa", label: "Dashboard Siswa", icon: GraduationCap, end: true },
  { path: "/siswa/jadwal", label: "Jadwal Pelajaran", icon: Calendar },
  { path: "/siswa/absensi", label: "Kehadiran / Absensi", icon: CheckCircle2 },
  { path: "/siswa/nilai", label: "Nilai & Rapor Digital", icon: Award },
  { path: "/siswa/pengumuman", label: "Pengumuman Sekolah", icon: Bell },
  { path: "/siswa/profil", label: "Profil Saya", icon: User },
];

export default function SiswaLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Siswa"
          profilePath="/siswa/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Siswa"
          searchPlaceholder="Cari jadwal, nilai, pengumuman..."
        />
      )}
      footer={<AppFooter roleLabel="Siswa" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/siswa" ? (
          <Outlet />
        ) : (
          <div className="p-3 sm:p-4 md:p-6 w-full max-w-[1600px] mx-auto flex-1">
            <Outlet />
          </div>
        )
      }
    />
  );
}
