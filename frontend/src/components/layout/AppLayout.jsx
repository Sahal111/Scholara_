import { useState, useEffect, cloneElement, isValidElement } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

/**
 * AppLayout — unified layout untuk semua role.
 *
 * Mode 1 (Simple — non-operator roles):
 *   <AppLayout menus={menus} />
 *
 * Mode 2 (Custom — operator/complex roles):
 *   <AppLayout
 *     sidebar={<SidebarContent />}
 *     topBar={(onMenuClick) => <OperatorTopBar onMenuClick={onMenuClick} />}
 *     footer={<OperatorFooter />}
 *     className="bg-[#f8faf9]"
 *     contentClassName="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto"
 *     sidebarWidth={280}
 *   />
 *
 * Props:
 *   menus            — array of { path, label, icon, end? } (for generic Sidebar)
 *   header           — optional ReactNode, rendered di atas <Outlet />
 *   sidebar          — custom sidebar ReactNode (overrides generic Sidebar)
 *   topBar           — function(onMenuClick) => ReactNode, or ReactNode
 *   footer           — optional footer ReactNode
 *   className        — override container className
 *   contentClassName — override main content className
 *   sidebarWidth     — sidebar width in px (default 256)
 *   renderContent    — optional function(location) => ReactNode
 */
export default function AppLayout({
  menus,
  header,
  sidebar,
  topBar,
  footer,
  className,
  contentClassName,
  sidebarWidth = 256,
  renderContent,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile drawer saat navigasi
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll saat drawer terbuka di mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Clone sidebar element to inject onClose for mobile drawer
  const renderSidebar = (withOnClose) => {
    if (sidebar) {
      // Custom sidebar — inject onClose prop if needed
      if (withOnClose && isValidElement(sidebar)) {
        return cloneElement(sidebar, { onClose: () => setSidebarOpen(false) });
      }
      return sidebar;
    }
    // Generic Sidebar
    return (
      <Sidebar
        menus={menus}
        onClose={withOnClose ? () => setSidebarOpen(false) : undefined}
      />
    );
  };

  return (
    <div
      className={`flex h-screen overflow-hidden ${className || "bg-gray-50"}`}
    >
      {/* Desktop Sidebar — fixed */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen z-40 flex-shrink-0 overflow-hidden"
        style={{ width: sidebarWidth }}
      >
        {renderSidebar(false)}
      </aside>

      {/* Mobile Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebar(true)}
      </div>

      {/* Main Content Area — offset by sidebar width on desktop */}
      <div
        className="flex flex-col flex-1 min-w-0 h-screen relative z-10 md:transition-[margin] md:duration-200"
        style={{ marginLeft: 0 }}
      >
        {/* Use CSS to apply margin only on md+ screens */}
        <style>{`@media(min-width:768px){[data-app-main]{margin-left:${sidebarWidth}px!important}}`}</style>

        <div data-app-main="" className="flex flex-col flex-1 min-w-0 h-screen">
          {/* TopBar: custom render function, or default mobile hamburger */}
          {topBar ? (
            typeof topBar === "function" ? (
              topBar(() => setSidebarOpen((v) => !v))
            ) : (
              topBar
            )
          ) : (
            /* Default Mobile TopBar */
            <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Buka menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-700">Menu</span>
            </header>
          )}

          {/* Optional header slot (e.g. child selector) */}
          {header && <div className="flex-shrink-0 px-6 pt-4">{header}</div>}

          {/* Scrollable content */}
          <main
            className={`flex-1 overflow-y-auto ${contentClassName !== undefined ? contentClassName : "p-6 md:p-8"}`}
          >
            {renderContent ? renderContent(location) : <Outlet />}
          </main>

          {/* Optional footer */}
          {footer}
        </div>
      </div>
    </div>
  );
}
