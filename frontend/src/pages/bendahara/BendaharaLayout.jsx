import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  ReceiptText,
  Banknote,
  BarChart3,
  UserCircle,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/bendahara", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    path: "/bendahara/keuangan/jenis-tagihan",
    label: "Jenis Tagihan",
    icon: ReceiptText,
  },
  {
    path: "/bendahara/keuangan/tagihan",
    label: "Tagihan Siswa",
    icon: ReceiptText,
  },
  {
    path: "/bendahara/keuangan/pembayaran",
    label: "Pembayaran",
    icon: Banknote,
  },
  { path: "/bendahara/laporan", label: "Laporan Keuangan", icon: BarChart3 },
  { path: "/bendahara/profil", label: "Profil Bendahara", icon: UserCircle },
];

export default function BendaharaLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar
          menus={menus}
          roleLabel="Bendahara"
          profilePath="/bendahara/profil"
        />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Bendahara"
          searchPlaceholder="Cari tagihan, pembayaran..."
        />
      )}
      footer={<AppFooter roleLabel="Bendahara" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/bendahara" ? (
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
