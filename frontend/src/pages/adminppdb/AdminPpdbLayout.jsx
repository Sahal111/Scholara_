import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  UserPlus,
  FolderOpen,
  CreditCard,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/adminppdb", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/adminppdb/calon-siswa", label: "Calon Siswa", icon: UserPlus },
  { path: "/adminppdb/berkas", label: "Berkas Pendaftar", icon: FolderOpen },
  { path: "/adminppdb/pembayaran", label: "Pembayaran PPDB", icon: CreditCard },
  { path: "/adminppdb/profil", label: "Profil Admin PPDB", icon: UserCircle },
];

export default function AdminPpdbLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Admin PPDB"
          profilePath="/adminppdb/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Admin PPDB"
          searchPlaceholder="Cari calon siswa, berkas..."
        />
      )}
      footer={<AppFooter roleLabel="Admin PPDB" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/adminppdb" ? (
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
