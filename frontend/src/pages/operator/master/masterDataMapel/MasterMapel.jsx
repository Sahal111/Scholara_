import { useState, useEffect } from "react";
import { useMapelList, useToggleMapel, useDeleteMapel, exportMapel } from "../../../../hooks/api/useMapel";
import TambahEditMapel from "./TambahEditMapel";
import ModalImportMapel from "./components/ModalImportMapel";
import Confirm from "../../../../components/ui/Confirm";
import toast from "react-hot-toast";

/* ─── Konstanta ──────────────────────────────────────────────── */
const KELOMPOK_OPTIONS = [
  "A - Wajib",
  "B - Wajib",
  "C - Muatan Lokal",
  "Pengembangan Diri",
  "Ekstrakurikuler",
  "Lainnya",
];

// Mendukung semua jenjang: SD (1-6), SMP (7-9), SMA/SMK (10-12)
const TINGKAT_OPTIONS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

const KELOMPOK_BADGE = {
  "A - Wajib": "bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]",
  "B - Wajib": "bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]",
  "C - Muatan Lokal": "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]",
  "Pengembangan Diri": "bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe]",
  Ekstrakurikuler: "bg-[#fce7f3] text-[#9d174d] border border-[#fbcfe8]",
  Lainnya: "bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]",
};

/* ─── Helper render ──────────────────────────────────────────── */
function renderTingkat(tingkat) {
  const raw = tingkat ? String(tingkat).trim() : "";
  if (!raw || raw.toLowerCase() === "semua") {
    return (
      <span className="px-2.5 py-1 bg-[#dbeafe] text-[#1e40af] rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
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
        className="px-2 py-1 bg-[#006e2a]/10 text-[#006e2a] rounded-full text-[11px] font-bold whitespace-nowrap"
      >
        Tk.{t}
      </span>
    ));
}

function renderKurikulum(kurikulum) {
  if (kurikulum === "Keduanya")
    return (
      <div className="flex flex-wrap gap-1">
        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] whitespace-nowrap">
          K2013
        </span>
        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] whitespace-nowrap">
          Merdeka
        </span>
      </div>
    );
  if (kurikulum === "Kurikulum 2013")
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] whitespace-nowrap">
        K2013
      </span>
    );
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] whitespace-nowrap">
      Merdeka
    </span>
  );
}

function renderPages(page, lastPage) {
  const pages = [];
  const total = lastPage;
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++)
      pages.push(i);
    if (page < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
}

/* ─── Halaman Utama ──────────────────────────────────────────── */
export default function MasterMapel() {
  /* State modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  /* State filter & paginasi */
  const [search, setSearch] = useState("");
  const [filterKelompok, setFilterKelompok] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, filterKelompok, filterTingkat, filterStatus]);

  /* ── Hooks (React Query via useMapel.js) ── */
  const { data, isLoading } = useMapelList({
    search,
    kelompok: filterKelompok,
    tingkat: filterTingkat,
    is_active: filterStatus,
    page,
  });

  const toggleActive = useToggleMapel();
  const hapus = useDeleteMapel();

  /* ── Derived data ── */
  const list = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalData = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;
  const totalAktif = list.filter((m) => m.is_active).length;
  const hasActiveFilters = filterKelompok || filterTingkat || filterStatus || search;

  /* ── Handlers ── */
  const openTambah = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditData({ ...m });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditData(null);
  };

  const handleDelete = () => {
    hapus.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  };

  const resetFilters = () => {
    setSearch("");
    setFilterKelompok("");
    setFilterTingkat("");
    setFilterStatus("");
    setPage(1);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportMapel({
        kelompok: filterKelompok,
        tingkat: filterTingkat,
        is_active: filterStatus,
      });
      toast.success("Data berhasil diekspor.");
    } catch {
      toast.error("Gagal mengekspor data.");
    } finally {
      setExportLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="space-y-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1.5 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse" />
              <span className="text-[10px] text-[#006e2a] tracking-[0.2em] uppercase font-black">
                MASTER DATA
              </span>
            </div>
            <div className="h-px w-24 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-5xl text-[#00342b] font-extrabold leading-tight tracking-tighter mb-3">
            Mata{" "}
            <span className="font-['EB_Garamond'] italic text-[#006e2a] font-normal">
              Pelajaran
            </span>
          </h1>
          <p className="text-[#3f4945] max-w-2xl leading-relaxed opacity-80 text-base">
            Kelola daftar mata pelajaran, kelompok, kurikulum, dan status
            pembelajaran secara terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setImportOpen(true)}
            className="px-5 py-2.5 rounded-full border border-[#bfc9c4]/30 text-[#00342b] hover:bg-[#f2f4f3]/50 transition-all flex items-center gap-2 font-bold text-sm bg-white/50 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="px-5 py-2.5 rounded-full border border-[#bfc9c4]/30 text-[#00342b] hover:bg-[#f2f4f3]/50 transition-all flex items-center gap-2 font-bold text-sm bg-white/50 backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <div className="w-4 h-4 border-2 border-[#00342b] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">download</span>
            )}
            {exportLoading ? "Mengekspor..." : "Export"}
          </button>
          <button
            onClick={openTambah}
            className="bg-[#006e2a] text-white px-7 py-3.5 rounded-full font-black text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-[#006e2a]/30 hover:shadow-[#006e2a]/50 hover:-translate-y-0.5 hover:scale-[1.03] transition-all duration-300 group border border-white/20 uppercase"
          >
            <div className="bg-white/20 rounded-full p-1 group-hover:rotate-90 transition-transform duration-500">
              <span className="material-symbols-outlined text-[18px] block">add</span>
            </div>
            Tambah Mata Pelajaran
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {[
          {
            icon: "menu_book",
            label: "Mata Pelajaran",
            badge: "Total",
            value: isLoading ? "—" : totalData,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
          {
            icon: "check_circle",
            label: "Status Aktif",
            badge: "Aktif",
            value: isLoading ? "—" : totalAktif,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
          {
            icon: "cancel",
            label: "Non-Aktif",
            badge: "Inaktif",
            value: isLoading ? "—" : list.length - totalAktif,
            iconBg: "bg-[#bfc9c4]/20",
            iconColor: "text-[#707975]",
            hoverBg: "group-hover:bg-[#707975] group-hover:text-white",
          },
          {
            icon: "layers",
            label: "Halaman Ini",
            badge: "Tampil",
            value: isLoading ? "—" : list.length,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
          {
            icon: "category",
            label: "Kelompok Mapel",
            badge: "Grup",
            value: isLoading
              ? "—"
              : [...new Set(list.map((m) => m.kelompok))].length,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#bfc9c4]/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} ${stat.hoverBg} transition-colors duration-300`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {stat.icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-black tracking-widest uppercase opacity-50 ${stat.iconColor}`}
              >
                {stat.badge}
              </span>
            </div>
            <p className="text-[10px] font-black text-[#3f4945] uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <h2 className="text-3xl font-extrabold text-[#00342b] tracking-tighter">
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white border border-[#bfc9c4]/20 rounded-[2rem] p-4 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari mata pelajaran, kode, atau kategori..."
            className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-12 pr-4 text-[#191c1c] placeholder:text-[#3f4945]/50 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all font-medium text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
          {/* Status */}
          <div className="relative min-w-[150px] flex-1 lg:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-black text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
            >
              <option value="">Status: Semua</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
              expand_more
            </span>
          </div>

          {/* Kelompok */}
          <div className="relative min-w-[180px] flex-1 lg:flex-none">
            <select
              value={filterKelompok}
              onChange={(e) => setFilterKelompok(e.target.value)}
              className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-black text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
            >
              <option value="">Kelompok: Semua</option>
              {KELOMPOK_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
              expand_more
            </span>
          </div>

          {/* Tingkat — 1–12, support semua jenjang */}
          <div className="relative min-w-[160px] flex-1 lg:flex-none">
            <select
              value={filterTingkat}
              onChange={(e) => setFilterTingkat(e.target.value)}
              className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-black text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
            >
              <option value="">Tingkat: Semua</option>
              {TINGKAT_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  Tingkat {t}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
              expand_more
            </span>
          </div>

          <div className="h-10 w-px bg-[#bfc9c4]/20 hidden lg:block mx-1" />

          <button
            onClick={resetFilters}
            title="Reset Filter"
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-[#bfc9c4]/20 text-[#3f4945] hover:bg-[#ffdad6]/20 hover:text-[#ba1a1a] hover:border-[#ba1a1a]/30 transition-all font-black text-xs uppercase tracking-widest bg-white/50 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-[2rem] border border-[#bfc9c4]/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-[#006e2a] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-[#3f4945]">Memuat data...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-20 h-20 bg-[#006e2a]/5 rounded-full flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[36px] text-[#006e2a]">
                  auto_stories
                </span>
              </div>
              <p className="text-lg font-extrabold text-[#00342b] mb-2">
                {hasActiveFilters
                  ? "Tidak ada hasil ditemukan"
                  : "Belum ada mata pelajaran"}
              </p>
              <p className="text-sm text-[#3f4945]/70 mb-8 max-w-sm">
                {hasActiveFilters
                  ? "Coba ubah kata kunci atau filter pencarian"
                  : "Mulai tambahkan mata pelajaran baru atau import dari Excel"}
              </p>
              {!hasActiveFilters && (
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => setImportOpen(true)}
                    className="px-6 py-3 rounded-full border border-[#bfc9c4]/30 text-[#00342b] font-bold text-sm hover:bg-[#f2f4f3] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    Import Excel
                  </button>
                  <button
                    onClick={openTambah}
                    className="px-6 py-3 rounded-full bg-[#006e2a] text-white font-black text-sm hover:bg-[#065043] transition-colors flex items-center gap-2 shadow-lg shadow-[#006e2a]/20 uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tambah Manual
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f3]/50 border-b border-[#bfc9c4]/20 text-[10px] text-[#3f4945] uppercase tracking-[0.2em] font-black">
                  <th className="py-5 px-6">Kode</th>
                  <th className="py-5 px-6">Mata Pelajaran</th>
                  <th className="py-5 px-6">Kelompok</th>
                  <th className="py-5 px-6">Kurikulum</th>
                  <th className="py-5 px-6">Jenjang / Tingkat</th>
                  <th className="py-5 px-6 text-center">Jam/Minggu</th>
                  <th className="py-5 px-6">Status</th>
                  <th className="py-5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#191c1c] divide-y divide-[#bfc9c4]/10">
                {list.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-[#f2f4f3]/30 transition-all duration-300 group ${!m.is_active ? "opacity-60" : ""}`}
                  >
                    <td className="py-5 px-6 font-mono text-sm text-[#006e2a] font-bold">
                      {m.kode}
                    </td>

                    <td className="py-5 px-6 font-bold text-[#00342b]">
                      {m.nama_mapel}
                    </td>

                    <td className="py-5 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${KELOMPOK_BADGE[m.kelompok] ?? "bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]"}`}
                      >
                        {m.kelompok}
                      </span>
                    </td>

                    <td className="py-5 px-6">{renderKurikulum(m.kurikulum)}</td>

                    <td className="py-5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {renderTingkat(m.tingkat)}
                      </div>
                    </td>

                    <td className="py-5 px-6 text-center">
                      <span className="font-bold text-[#00342b]">
                        {m.jam_per_minggu}
                      </span>
                      <span className="text-[#707975] text-xs"> jam</span>
                    </td>

                    <td className="py-5 px-6">
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-black text-[11px] uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f3] text-[#707975] font-black text-[11px] uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#707975]" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => toggleActive.mutate(m.id)}
                          title={m.is_active ? "Non-aktifkan" : "Aktifkan"}
                          className={`p-2 rounded-lg transition-colors ${
                            m.is_active
                              ? "text-[#3f4945] hover:text-[#92400e] hover:bg-[#fef3c7]"
                              : "text-[#3f4945] hover:text-[#006e2a] hover:bg-[#d1fae5]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {m.is_active ? "toggle_on" : "toggle_off"}
                          </span>
                        </button>
                        <button
                          onClick={() => openEdit(m)}
                          className="p-2 text-[#3f4945] hover:text-[#00342b] hover:bg-[#afefdd]/30 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="p-2 text-[#3f4945] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!isLoading && list.length > 0 && (
          <div className="p-6 border-t border-[#bfc9c4]/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#f2f4f3]/30">
            <p className="text-sm font-medium text-[#3f4945]">
              Menampilkan{" "}
              <span className="text-[#00342b] font-bold">{meta?.from ?? 1}</span>{" "}
              sampai{" "}
              <span className="text-[#00342b] font-bold">{meta?.to ?? list.length}</span>{" "}
              dari <span className="text-[#00342b] font-bold">{totalData}</span>{" "}
              entri
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#bfc9c4]/30 text-[#707975] hover:bg-white hover:text-[#006e2a] hover:border-[#006e2a]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              <div className="flex items-center gap-1">
                {renderPages(page, lastPage).map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-1 text-[#bfc9c4]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                        page === p
                          ? "bg-[#006e2a] text-white shadow-sm shadow-[#006e2a]/20"
                          : "border border-transparent text-[#3f4945] hover:bg-white hover:border-[#bfc9c4]/30"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#bfc9c4]/30 text-[#00342b] bg-white hover:bg-[#006e2a] hover:text-white hover:border-[#006e2a] transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <TambahEditMapel
        isOpen={modalOpen}
        onClose={closeModal}
        editData={editData}
      />

      <ModalImportMapel
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <Confirm
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Mata Pelajaran?"
        message={
          deleteTarget
            ? `Mata pelajaran "${deleteTarget.nama_mapel}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel="Ya, Hapus"
        isLoading={hapus.isPending}
        variant="danger"
      />
    </div>
  );
}
