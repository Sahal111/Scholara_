import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  HeartHandshake,
  NotebookPen,
  BarChart3,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/guru-bk", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/guru-bk/konseling", label: "Sesi Konseling", icon: HeartHandshake },
  { path: "/guru-bk/catatan", label: "Catatan BK", icon: NotebookPen },
  { path: "/guru-bk/laporan", label: "Laporan BK", icon: BarChart3 },
  { path: "/guru-bk/profil", label: "Profil", icon: UserCircle },
];

export default function GuruBkLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Guru BK"
          profilePath="/guru-bk/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Guru BK"
          searchPlaceholder="Cari siswa, catatan konseling..."
        />
      )}
      footer={<AppFooter roleLabel="Guru BK" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/guru-bk" ? (
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
