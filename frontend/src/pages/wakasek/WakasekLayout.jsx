import AppLayout from "../../components/layout/AppLayout";
import { WakasekSidebarContent } from "../../components/layout/WakasekSidebar";
import { Outlet } from "react-router-dom";

export default function WakasekLayout() {
  return (
    <AppLayout
      sidebar={<WakasekSidebarContent />}
      className="bg-[#f5f3ff] text-[#1e1b4b]"
      sidebarWidth={272}
      renderContent={(location) =>
        location.pathname === "/wakasek" ? (
          <Outlet />
        ) : (
          <div className="p-4 sm:p-5 md:p-7 w-full max-w-[1600px] mx-auto flex-1">
            <Outlet />
          </div>
        )
      }
    />
  );
}
