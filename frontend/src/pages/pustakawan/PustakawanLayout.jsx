import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  BookMarked,
  BookOpenCheck,
  BarChart3,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/pustakawan", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/pustakawan/buku", label: "Katalog Buku", icon: BookMarked },
  { path: "/pustakawan/peminjaman", label: "Peminjaman", icon: BookOpenCheck },
  { path: "/pustakawan/laporan", label: "Laporan", icon: BarChart3 },
  { path: "/pustakawan/profil", label: "Profil", icon: UserCircle },
];

export default function PustakawanLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Pustakawan"
          profilePath="/pustakawan/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Pustakawan"
          searchPlaceholder="Cari buku, peminjaman..."
        />
      )}
      footer={<AppFooter roleLabel="Pustakawan" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/pustakawan" ? (
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
