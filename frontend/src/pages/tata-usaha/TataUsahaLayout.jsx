import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  Mail,
  Archive,
  Stamp,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/tata-usaha", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/tata-usaha/surat-masuk", label: "Surat Masuk", icon: Mail },
  { path: "/tata-usaha/surat-keluar", label: "Surat Keluar", icon: Mail },
  { path: "/tata-usaha/arsip", label: "Arsip Surat", icon: Archive },
  { path: "/tata-usaha/legalisir", label: "Legalisir", icon: Stamp },
  { path: "/tata-usaha/profil", label: "Profil", icon: UserCircle },
];

export default function TataUsahaLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Tata Usaha"
          profilePath="/tata-usaha/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Tata Usaha"
          searchPlaceholder="Cari surat, arsip..."
        />
      )}
      footer={<AppFooter roleLabel="Tata Usaha" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/tata-usaha" ? (
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
