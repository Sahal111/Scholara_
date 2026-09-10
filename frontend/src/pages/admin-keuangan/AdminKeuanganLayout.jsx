import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  ReceiptText,
  Banknote,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  {
    path: "/admin-keuangan",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    path: "/admin-keuangan/tagihan",
    label: "Tagihan Siswa",
    icon: ReceiptText,
  },
  {
    path: "/admin-keuangan/pembayaran",
    label: "Input Pembayaran",
    icon: Banknote,
  },
  { path: "/admin-keuangan/profil", label: "Profil", icon: UserCircle },
];

export default function AdminKeuanganLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Admin Keuangan"
          profilePath="/admin-keuangan/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Admin Keuangan"
          searchPlaceholder="Cari tagihan, pembayaran, siswa..."
        />
      )}
      footer={<AppFooter roleLabel="Admin Keuangan" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/admin-keuangan" ? (
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
