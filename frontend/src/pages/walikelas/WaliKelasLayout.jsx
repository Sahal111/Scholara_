import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  FileText,
  BookOpen,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/walikelas", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/walikelas/siswa", label: "Data Siswa", icon: Users },
  { path: "/walikelas/jadwal", label: "Jadwal Pelajaran", icon: CalendarDays },
  { path: "/walikelas/absensi", label: "Rekap Absensi", icon: ClipboardList },
  { path: "/walikelas/laporan", label: "Laporan", icon: FileText },
  { path: "/walikelas/pengumuman", label: "Pengumuman", icon: BookOpen },
  { path: "/walikelas/profil", label: "Profil", icon: UserCircle },
];

export default function WaliKelasLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Wali Kelas"
          profilePath="/walikelas/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Wali Kelas"
          searchPlaceholder="Cari siswa, jadwal..."
        />
      )}
      footer={<AppFooter roleLabel="Wali Kelas" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/walikelas" ? (
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
