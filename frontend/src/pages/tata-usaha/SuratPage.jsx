import { useState } from "react";
import { Link } from "react-router-dom";
import { useSuratList, useHapusSurat, useArsipSurat } from "../../hooks/api/useTataUsaha";
import {
  Plus, Search, FileText, Trash2, Eye, Archive, RefreshCw, AlertCircle,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const JENIS_CFG = {
  masuk: { label: "Masuk", cls: "bg-blue-100 text-blue-700" },
  keluar: { label: "Keluar", cls: "bg-green-100 text-green-700" },
  internal: { label: "Internal", cls: "bg-purple-100 text-purple-700" },
  legalisir: { label: "Legalisir", cls: "bg-amber-100 text-amber-700" },
};

const STATUS_CFG = {
  aktif: { label: "Aktif", cls: "bg-green-50 text-green-700" },
  diarsip: { label: "Diarsip", cls: "bg-gray-100 text-gray-500" },
};

export default function SuratPage() {
  const [params, setParams] = useState({ page: 1, per_page: 20 });
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data, isLoading, isFetching, refetch } = useSuratList({
    ...params,
    search: search || undefined,
    jenis: filterJenis || undefined,
    status: filterStatus || undefined,
  });

  const hapus = useHapusSurat();
  const arsip = useArsipSurat();
  const surat = data?.data?.data ?? [];
  const meta = data?.data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Manajemen Surat</h1>
          <p className="text-sm text-gray-500">Kelola surat masuk, keluar, dan internal sekolah</p>
        </div>
        <Link
          to="/tata-usaha/surat/tambah"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Surat
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari perihal, nomor surat, pengirim..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <select
          value={filterJenis}
          onChange={(e) => { setFilterJenis(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Semua Jenis</option>
          <option value="masuk">Masuk</option>
          <option value="keluar">Keluar</option>
          <option value="internal">Internal</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="diarsip">Diarsip</option>
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-400">Memuat data surat...</p>
            </div>
          </div>
        ) : surat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <FileText className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada surat</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">No. Surat</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Perihal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Jenis</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {surat.map((item) => {
                  const jenis = JENIS_CFG[item.jenis] ?? { label: item.jenis, cls: "bg-gray-100 text-gray-600" };
                  const status = STATUS_CFG[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.nomor_surat ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 max-w-[200px] truncate">{item.perihal}</p>
                        {item.pengirim && <p className="text-xs text-gray-400">Dari: {item.pengirim}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${jenis.cls}`}>
                          {jenis.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {dayjs(item.tanggal_surat).format("D MMM YYYY")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/tata-usaha/surat/${item.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Detail">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {item.status !== "diarsip" && (
                            <button
                              onClick={() => { if (confirm(`Arsipkan surat "${item.perihal}"?`)) arsip.mutate(item.id); }}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Arsipkan"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { if (confirm(`Hapus surat "${item.perihal}"?`)) hapus.mutate(item.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
            <span>{meta.from}–{meta.to} dari {meta.total} surat</span>
            <div className="flex gap-1">
              <button disabled={meta.current_page <= 1} onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))} className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))} className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

