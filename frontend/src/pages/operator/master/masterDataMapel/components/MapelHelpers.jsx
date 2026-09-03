import { BookOpen, Search, X } from "lucide-react";
import {
  KELOMPOK_BADGE_CLASSES,
  KELOMPOK_OPTIONS,
  TINGKAT_OPTIONS,
} from "../../../../../constants/mapel";

/* ── Helper render tingkat ─────────────────────────────────── */
export function renderTingkat(tingkat) {
  const raw = tingkat ? String(tingkat).trim() : "";
  if (!raw || raw.toLowerCase() === "semua") {
    return (
      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
        Semua
      </span>
    );
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (
      <span
        key={t}
        className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold whitespace-nowrap"
      >
        Tk.{t}
      </span>
    ));
}

/* ── Helper render kurikulum ───────────────────────────────── */
export function renderKurikulum(kurikulum) {
  if (kurikulum === "Keduanya")
    return (
      <div className="flex flex-wrap gap-1">
        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
          K2013
        </span>
        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
          Merdeka
        </span>
      </div>
    );
  if (kurikulum === "Kurikulum 2013")
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
        K2013
      </span>
    );
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
      Merdeka
    </span>
  );
}

/* ── MapelStatsGrid ────────────────────────────────────────── */
export function MapelStatsGrid({ isLoading, stats }) {
  const cards = [
    {
      icon: <BookOpen size={20} className="text-emerald-700" />,
      label: "Mata Pelajaran",
      badge: "Total",
      value: isLoading ? "—" : (stats?.total ?? 0),
    },
    {
      icon: (
        <svg
          className="w-5 h-5 text-emerald-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: "Status Aktif",
      badge: "Aktif",
      value: isLoading ? "—" : (stats?.total_aktif ?? 0),
    },
    {
      icon: (
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: "Non-Aktif",
      badge: "Inaktif",
      value: isLoading ? "—" : (stats?.total_non_aktif ?? 0),
    },
    {
      icon: (
        <svg
          className="w-5 h-5 text-emerald-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
      label: "Kelompok Mapel",
      badge: "Grup",
      value: isLoading ? "—" : (stats?.total_kelompok ?? 0),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              {stat.icon}
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">
              {stat.badge}
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tighter">
            {stat.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

/* ── MapelToolbar ──────────────────────────────────────────── */
export function MapelToolbar({
  search,
  setSearch,
  filterKelompok,
  setFilterKelompok,
  filterTingkat,
  setFilterTingkat,
  filterStatus,
  setFilterStatus,
  onReset,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
      <div className="relative flex-1 w-full">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari mata pelajaran, kode, atau kategori..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-sm outline-none"
        />
      </div>

      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 text-gray-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none cursor-pointer min-w-[130px]"
        >
          <option value="">Status: Semua</option>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>

        <select
          value={filterKelompok}
          onChange={(e) => setFilterKelompok(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 text-gray-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none cursor-pointer min-w-[160px]"
        >
          <option value="">Kelompok: Semua</option>
          {KELOMPOK_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <select
          value={filterTingkat}
          onChange={(e) => setFilterTingkat(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 text-gray-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all outline-none cursor-pointer min-w-[140px]"
        >
          <option value="">Tingkat: Semua</option>
          {TINGKAT_OPTIONS.map((t) => (
            <option key={t} value={t}>
              Tingkat {t}
            </option>
          ))}
        </select>

        <div className="h-8 w-px bg-gray-200 hidden lg:block" />

        <button
          onClick={onReset}
          title="Reset Filter"
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all text-xs font-semibold bg-white whitespace-nowrap"
        >
          <X size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}
