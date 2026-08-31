/* ─── FilterToolbar ───────────────────────────────────────────────────────────── */
export default function FilterToolbar({
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  onReset,
}) {
  const hasActiveFilter = search || filterStatus;

  return (
    <div className="bg-white border-b border-[#bfc9c4]/20 p-4 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
      {/* Search */}
      <div className="relative flex-1 w-full group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]">
          search
        </span>
        <input
          className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-12 pr-4 text-[#191c1c] placeholder:text-[#3f4945]/50 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all font-medium text-sm outline-none"
          placeholder="Cari nama program atau kode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 w-full lg:w-auto">
        {/* Filter Status */}
        <div className="relative min-w-[160px] flex-1 lg:flex-none">
          <select
            className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Status: Semua</option>
            <option value="1">Aktif</option>
            <option value="0">Tidak Aktif</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
            expand_more
          </span>
        </div>

        <div className="h-10 w-px bg-[#bfc9c4]/20 hidden lg:block mx-1" />

        {/* Reset */}
        <button
          onClick={onReset}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
            hasActiveFilter
              ? "bg-[#006e2a] text-white border-[#006e2a] hover:bg-[#00531e]"
              : "bg-white text-[#3f4945] border-[#bfc9c4]/30 hover:bg-[#f2f4f3] hover:text-[#006e2a]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            restart_alt
          </span>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
