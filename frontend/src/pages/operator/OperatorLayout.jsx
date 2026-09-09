import AppLayout from "../../components/layout/AppLayout";
import { SidebarContent } from "../../components/layout/OperatorSidebar";
import OperatorTopBar from "../../components/layout/OperatorTopBar";
import OperatorFooter from "../../components/layout/OperatorFooter";
import { Outlet } from "react-router-dom";

export default function OperatorLayout() {
  return (
    <AppLayout
      sidebar={<SidebarContent />}
      topBar={(onMenuClick) => <OperatorTopBar onMenuClick={onMenuClick} />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/operator/dashboard" ? (
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
