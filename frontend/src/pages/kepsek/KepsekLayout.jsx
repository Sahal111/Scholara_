import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  CalendarDays,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/kepsek", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    path: "/kepsek/monitoring-absensi",
    label: "Monitoring Absensi",
    icon: ClipboardCheck,
  },
  { path: "/kepsek/guru", label: "Data Guru", icon: Users },
  { path: "/kepsek/siswa", label: "Data Siswa", icon: GraduationCap },
  { path: "/kepsek/pengumuman", label: "Pengumuman", icon: Megaphone },
  { path: "/kepsek/kalender", label: "Kalender Akademik", icon: CalendarDays },
  { path: "/kepsek/profil", label: "Profil Saya", icon: UserCircle },
];

export default function KepsekLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Kepala Sekolah"
          profilePath="/kepsek/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Kepala Sekolah"
          searchPlaceholder="Cari guru, siswa, laporan..."
        />
      )}
      footer={<AppFooter roleLabel="Kepala Sekolah" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/kepsek" ? (
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
