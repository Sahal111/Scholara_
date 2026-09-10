import AppLayout from "../../components/layout/AppLayout";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import { WakasekSidebarContent } from "../../components/layout/WakasekSidebar";
import { Outlet } from "react-router-dom";

export default function WakasekLayout() {
  return (
    <AppLayout
      sidebar={<WakasekSidebarContent />}
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Wakil Kepala Sekolah"
          searchPlaceholder="Cari kelas, mapel, jadwal, kurikulum..."
        />
      )}
      footer={<AppFooter roleLabel="Wakil Kepala Sekolah" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={272}
      renderContent={(location) =>
        location.pathname === "/wakasek" ? (
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
