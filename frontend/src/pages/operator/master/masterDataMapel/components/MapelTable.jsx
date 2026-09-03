import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { KELOMPOK_BADGE_CLASSES } from "../../../../../constants/mapel";
import { renderTingkat, renderKurikulum } from "./MapelHelpers";

/* ── TableSkeleton ─────────────────────────────────────────── */
function TableSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded flex-1" />
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-5 bg-gray-200 rounded w-12" />
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

/* ── EmptyState ────────────────────────────────────────────── */
function EmptyState({ hasActiveFilters, onTambah, onImport }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <p className="text-lg font-bold text-gray-900 mb-2">
        {hasActiveFilters ? "Tidak ada hasil ditemukan" : "Belum ada mata pelajaran"}
      </p>
      <p className="text-sm text-gray-500 mb-8 max-w-sm">
        {hasActiveFilters
          ? "Coba ubah kata kunci atau filter pencarian"
          : "Mulai tambahkan mata pelajaran baru atau import dari Excel"}
      </p>
      {!hasActiveFilters && (
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={onImport}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Import Excel
          </button>
          <button
            onClick={onTambah}
            className="px-6 py-2.5 rounded-lg bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            Tambah Manual
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Pagination ────────────────────────────────────────────── */
function Pagination({ page, lastPage, meta, onPageChange }) {
  const totalData = meta?.total ?? 0;

  const pages = [];
  if (lastPage <= 5) {
    for (let i = 1; i <= lastPage; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++)
      pages.push(i);
    if (page < lastPage - 2) pages.push("...");
    pages.push(lastPage);
  }

  return (
    <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
      <p className="text-sm text-gray-600">
        Menampilkan{" "}
        <span className="text-gray-900 font-semibold">{meta?.from ?? 1}</span>
        {" "}sampai{" "}
        <span className="text-gray-900 font-semibold">{meta?.to ?? 0}</span>
        {" "}dari{" "}
        <span className="text-gray-900 font-semibold">{totalData}</span> entri
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-emerald-700 hover:border-emerald-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm transition-all ${
                page === p
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(Math.min(lastPage, page + 1))}
          disabled={page === lastPage}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-emerald-700 hover:border-emerald-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
        >
          ›
        </button>
      </div>
    </div>
  );
}

/* ── MapelTable (main export) ──────────────────────────────── */
export default function MapelTable({
  list,
  meta,
  isLoading,
  page,
  lastPage,
  hasActiveFilters,
  onEdit,
  onDelete,
  onToggle,
  onTambah,
  onImport,
  onPageChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        {isLoading ? (
          <TableSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onTambah={onTambah}
            onImport={onImport}
          />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-4 px-5">Kode</th>
                <th className="py-4 px-5">Mata Pelajaran</th>
                <th className="py-4 px-5">Kelompok</th>
                <th className="py-4 px-5">Kurikulum</th>
                <th className="py-4 px-5">Jenjang / Tingkat</th>
                <th className="py-4 px-5 text-center">Jam/Minggu</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-900 divide-y divide-gray-100">
              {list.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-gray-50/60 transition-colors duration-150 group ${
                    !m.is_active ? "opacity-60" : ""
                  }`}
                >
                  <td className="py-4 px-5 font-mono text-sm text-emerald-700 font-bold">
                    {m.kode}
                  </td>

                  <td className="py-4 px-5 font-semibold text-gray-900">
                    {m.nama_mapel}
                  </td>

                  <td className="py-4 px-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                        KELOMPOK_BADGE_CLASSES[m.kelompok] ??
                        "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {m.kelompok}
                    </span>
                  </td>

                  <td className="py-4 px-5">{renderKurikulum(m.kurikulum)}</td>

                  <td className="py-4 px-5">
                    <div className="flex flex-wrap gap-1">
                      {renderTingkat(m.tingkat_label ?? m.tingkat)}
                    </div>
                  </td>

                  <td className="py-4 px-5 text-center">
                    <span className="font-semibold text-gray-900">{m.jam_per_minggu}</span>
                    <span className="text-gray-400 text-xs"> jam</span>
                  </td>

                  <td className="py-4 px-5">
                    {m.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-[11px] uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Nonaktif
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onToggle(m.id)}
                        title={m.is_active ? "Non-aktifkan" : "Aktifkan"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          m.is_active
                            ? "text-gray-500 hover:text-amber-700 hover:bg-amber-50"
                            : "text-gray-500 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {m.is_active ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => onEdit(m)}
                        title="Edit"
                        className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(m)}
                        title="Hapus"
                        className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && list.length > 0 && (
        <Pagination
          page={page}
          lastPage={lastPage}
          meta={meta}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
