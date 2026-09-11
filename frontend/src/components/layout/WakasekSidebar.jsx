import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

const MENU_SECTIONS = [
  {
    key: "kebijakan",
    label: "Kebijakan Akademik",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/wakasek/tahun-ajaran", label: "Tahun Ajaran & Semester" },
      { to: "/wakasek/kurikulum", label: "Kurikulum" },
      { to: "/wakasek/program-pendidikan", label: "Program Pendidikan" },
      { to: "/wakasek/mapel", label: "Mata Pelajaran" },
    ],
  },
  {
    key: "operasional",
    label: "Operasional Kelas",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/wakasek/kelas", label: "Kelas & Rombel" },
      {
        to: "/wakasek/penempatan-siswa",
        label: "Penempatan Siswa",
        soon: true,
      },
      { to: "/wakasek/pengampu-mapel", label: "Pengampu Mapel", soon: true },
      { to: "/wakasek/jadwal", label: "Jadwal Pelajaran", soon: true },
      { to: "/wakasek/kalender", label: "Kalender Akademik" },
    ],
  },
  {
    key: "penilaian",
    label: "Penilaian & Rapor",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/wakasek/nilai", label: "Rekap Nilai Semua Kelas", soon: true },
      { to: "/wakasek/rapor", label: "Finalisasi Rapor", soon: true },
      { to: "/wakasek/naik-kelas", label: "Kenaikan Kelas", soon: true },
    ],
  },
  {
    key: "pengawasan",
    label: "Pengawasan",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/wakasek/absensi", label: "Rekap Absensi" },
      { to: "/wakasek/guru", label: "Data Guru" },
      { to: "/wakasek/siswa", label: "Data Siswa" },
    ],
  },
  {
    key: "informasi",
    label: "Informasi",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/wakasek/pengumuman", label: "Pengumuman" },
      { to: "/wakasek/laporan", label: "Laporan" },
    ],
  },
];

function SidebarSection({ section, onClose }) {
  const location = useLocation();
  const isAnyChildActive = section.items.some(
    (item) => item.to && location.pathname.startsWith(item.to),
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
            {section.icon}
          </div>
          <span>{section.label}</span>
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
        {section.items.map((item) =>
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
                `text-xs py-1.5 px-2 rounded-lg block transition flex items-center justify-between ${
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

export function WakasekSidebarContent({ onClose }) {
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
    : "WK";

  const schoolName = school?.nama ?? "Scholara";

  return (
    <div className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-full">
      {/* Scrollable nav area */}
      <div className="p-5 overflow-y-auto flex-1">
        {/* Logo & Branding */}
        <div className="flex items-center justify-between gap-3 mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 rounded-2xl blur-sm opacity-40" />
              <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-2 ring-white/40">
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
        <nav className="space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
              Navigasi Utama
            </div>

            {/* Dashboard */}
            <NavLink
              to="/wakasek"
              end
              onClick={onClose}
              className={({ isActive }) =>
                isActive
                  ? "bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/25 font-medium px-3.5 py-2.5 flex items-center justify-between group hover:bg-blue-700 transition"
                  : "rounded-xl px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-between text-sm font-medium"
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Dashboard</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </>
              )}
            </NavLink>

            {/* Collapsible sections */}
            {MENU_SECTIONS.map((section) => (
              <SidebarSection
                key={section.key}
                section={section}
                onClose={onClose}
              />
            ))}
          </div>
        </nav>
      </div>

      {/* Footer profile */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 flex flex-col gap-2 shrink-0">
        <div className="relative overflow-hidden rounded-2xl bg-white p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
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
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-600/20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name ?? "Wakasek"}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20">
                  <span className="w-1 h-1 rounded-full bg-blue-600" />
                  Wakasek
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-3 mt-3 border-t border-slate-100/90 relative z-10">
            <NavLink
              to="/wakasek/profil"
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
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/40 hover:bg-rose-50 border border-rose-100/70 hover:border-rose-200 transition-all duration-200 shadow-sm group/btn active:scale-[0.99]"
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
