import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

export default function OperatorTopBar({ onMenuClick }) {
  const { user } = useAuth();

  const { data: taData } = useQuery({
    queryKey: ["tahun-ajaran-aktif"],
    queryFn: () =>
      api
        .get("/operator/master-data/tahun-ajaran/aktif")
        .then((r) => r.data?.data),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OP";

  const taLabel = taData
    ? `TA ${taData.nama_tahun_ajaran} · ${taData.semester_aktif?.nama_semester ?? "Ganjil"}`
    : "TA 2024/2025 · Ganjil";

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm transition-all duration-200">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60 transition duration-200 shrink-0"
          aria-label="Buka menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 6h16M4 12h16M4 18h16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </span>
          <input
            className="w-full pl-10 pr-14 py-2 text-xs bg-slate-50/90 hover:bg-slate-100/60 border border-slate-200/70 rounded-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-slate-400 font-medium transition-all text-slate-800 outline-none"
            placeholder="Cari NISN, siswa, guru, rombel..."
            type="text"
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200/80 rounded-md shadow-sm">
              ⌘K
            </kbd>
          </span>
        </div>
      </div>

      {/* Right: Utilities */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Dapodik Connected — hidden on small */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 rounded-full text-xs font-semibold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Dapodik Terhubung</span>
        </div>

        {/* Tahun Ajaran — hidden on small */}
        <button
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50/80 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 transition duration-200 group"
          type="button"
        >
          <svg
            className="w-3.5 h-3.5 text-blue-600 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{taLabel}</span>
          <svg
            className="w-3.5 h-3.5 text-slate-400 ml-0.5 group-hover:text-slate-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 9l-7 7-7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {/* Notifikasi */}
        <button
          aria-label="Notifikasi"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60 transition duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.9"
            />
          </svg>
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
            4
          </span>
        </button>

        {/* Pesan */}
        <button
          aria-label="Pesan"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60 transition duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.9"
            />
          </svg>
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

        {/* Mini Profile */}
        <div className="flex items-center gap-2.5 cursor-pointer pl-1 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-[1.5px] shadow-sm group-hover:scale-105 transition-transform duration-200">
              {user?.foto ? (
                <img
                  src={`${BASE_URL}/storage/${user.foto}`}
                  alt={user?.name}
                  className="w-full h-full rounded-[10px] object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-bold text-xs tracking-tight">
                  {initials}
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate max-w-[120px]">
              {user?.name ?? "Operator"}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Operator SIMS
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
