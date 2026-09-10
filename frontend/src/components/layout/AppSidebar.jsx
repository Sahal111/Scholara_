import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

/* ── Collapsible section (untuk role yang punya grouped menu) ── */
function SidebarSection({ label, items, icon, onClose }) {
  const location = useLocation();
  const isAnyChildActive = items.some((item) =>
    item.to ? location.pathname.startsWith(item.to) : false,
  );
  const [open, setOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) setOpen(true);
  }, [location.pathname, isAnyChildActive]);

  return (
    <details
      className="group"
      open={open || undefined}
      onToggle={(e) => setOpen(e.target.open)}
    >
      <summary className="rounded-xl px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-between text-sm font-medium cursor-pointer list-none">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200/70 text-slate-500 group-hover:text-slate-800 flex items-center justify-center shrink-0 transition-colors">
            {icon}
          </div>
          <span>{label}</span>
        </div>
        <svg
          className="w-3.5 h-3.5 text-slate-400 group-open:rotate-90 transition-transform shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 5l7 7-7 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </summary>
      <div className="border-l border-slate-200 ml-5 pl-3.5 my-1 space-y-1">
        {items.map((item) =>
          item.soon ? (
            <div
              key={item.to}
              className="text-xs py-1.5 px-2 rounded-lg flex items-center justify-between text-slate-300 cursor-not-allowed select-none"
            >
              <span>{item.label}</span>
              <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Soon
              </span>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `text-xs py-1.5 px-2 rounded-lg flex items-center justify-between transition ${
                  isActive
                    ? "text-blue-600 bg-blue-50/60 font-semibold"
                    : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ),
        )}
      </div>
    </details>
  );
}

/* ── Flat menu item (untuk role dengan menu sederhana) ── */
function SidebarMenuItem({ item, onClose }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) =>
        isActive
          ? "bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/25 font-medium px-3.5 py-2.5 flex items-center gap-3 group hover:bg-blue-700 transition"
          : "rounded-xl px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 text-sm font-medium"
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
              isActive
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium">{item.label}</span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ── AppSidebar utama ──────────────────────────────────────── */
/**
 * Props:
 *  menus        — array of { path, label, icon, end? } — flat menu (mode simple)
 *  sections     — array of { label, icon, items[] }    — grouped menu (mode advanced)
 *  roleLabel    — string: nama role, tampil di user card (e.g. "Guru", "Kepsek")
 *  profilePath  — string: path ke halaman profil (e.g. "/guru/profil")
 *  onClose      — function: dipanggil saat link diklik (untuk mobile drawer)
 */
export default function AppSidebar({
  menus,
  sections,
  roleLabel = "Pengguna",
  profilePath,
  onClose,
}) {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : roleLabel.slice(0, 2).toUpperCase();

  const schoolName = school?.nama ?? "Scholara";

  /* Pisahkan Dashboard dari menu lainnya (selalu item pertama) */
  const dashboardItem = menus ? menus[0] : null;
  const restMenus = menus ? menus.slice(1) : [];

  return (
    <div className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-full">
      {/* ── Scrollable top ── */}
      <div className="p-5 overflow-y-auto flex-1">
        {/* Logo & Branding */}
        <div className="flex items-center justify-between gap-3 mb-6 px-1">
          <div className="flex items-center gap-3">
            {/* Logo icon */}
            <div className="relative flex items-center justify-center shrink-0 group/logo cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 rounded-2xl blur-sm opacity-40 group-hover/logo:opacity-75 transition-opacity duration-300" />
              <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-2 ring-white/40 transition-all duration-300 group-hover/logo:scale-105">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 14l9-5-9-5-9 5 9 5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M12 14v7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-blue-600" />
              </div>
            </div>
            {/* Brand text */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[18px] leading-none tracking-tight text-slate-900">
                  Scholara
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-700 rounded-md ring-1 ring-blue-600/20">
                  SIMS
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-[11px] font-semibold text-slate-400 truncate tracking-wide">
                  {schoolName}
                </p>
              </div>
            </div>
          </div>
          {/* Close button mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Tutup Menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Navigasi Utama
          </div>

          {/* Dashboard — selalu flat & prominent */}
          {dashboardItem && (
            <SidebarMenuItem item={dashboardItem} onClose={onClose} />
          )}

          {/* Mode flat: sisa menu setelah Dashboard */}
          {restMenus.length > 0 &&
            restMenus.map((item) => (
              <SidebarMenuItem key={item.path} item={item} onClose={onClose} />
            ))}

          {/* Mode sections: grouped collapsible */}
          {sections &&
            sections.map((section) => (
              <SidebarSection
                key={section.label}
                label={section.label}
                icon={section.icon}
                items={section.items}
                onClose={onClose}
              />
            ))}
        </nav>
      </div>

      {/* ── Footer profile ── */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 flex flex-col gap-2 shrink-0">
        <div className="relative overflow-hidden rounded-2xl bg-white p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-[2px] shadow-sm group-hover:scale-105 transition-transform duration-200">
                {user?.foto ? (
                  <img
                    src={`${BASE_URL}/storage/${user.foto}`}
                    alt={user?.name}
                    className="w-full h-full rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-extrabold text-xs tracking-wider">
                    {initials}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center ring-1 ring-emerald-600/20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              </span>
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name ?? roleLabel}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20">
                  <span className="w-1 h-1 rounded-full bg-blue-600" />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-3 mt-3 border-t border-slate-100/90 relative z-10">
            {profilePath && (
              <NavLink
                to={profilePath}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-slate-50/80 hover:bg-blue-50/80 border border-slate-200/70 hover:border-blue-100 transition-all duration-200 shadow-sm group/btn active:scale-[0.99]"
              >
                <svg
                  className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>Profil</span>
              </NavLink>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/40 hover:bg-rose-50 border border-rose-100/70 hover:border-rose-200 transition-all duration-200 shadow-sm group/btn active:scale-[0.99] ${
                !profilePath ? "col-span-2" : ""
              }`}
            >
              <svg
                className="w-3.5 h-3.5 text-rose-500 group-hover/btn:translate-x-0.5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
