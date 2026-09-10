import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import AnakSelector from "../../components/ortu/AnakSelector";
import {
  CalendarCheck,
  BookUser,
  ClipboardList,
  Megaphone,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/ortu", label: "Dashboard", icon: CalendarCheck, end: true },
  {
    path: "/ortu/riwayat-absensi",
    label: "Riwayat Absensi",
    icon: ClipboardList,
  },
  { path: "/ortu/pengumuman", label: "Pengumuman", icon: Megaphone },
  { path: "/ortu/data-anak", label: "Data Anak", icon: BookUser },
  { path: "/ortu/tambah-anak", label: "Tambah Anak", icon: UserPlus },
  { path: "/ortu/profil", label: "Profil", icon: UserCircle },
];

export default function OrtuLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Orang Tua"
          profilePath="/ortu/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Orang Tua"
          searchPlaceholder="Cari data anak, pengumuman..."
        />
      )}
      footer={<AppFooter roleLabel="Orang Tua" />}
      header={<AnakSelector />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/ortu" ? (
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
