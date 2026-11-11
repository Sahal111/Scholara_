import { useState } from "react";
import { Link } from "react-router-dom";
import { useKonselingList, useHapusKonseling } from "../../hooks/api/useBk";
import {
  Plus,
  Search,
  HeartHandshake,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const KATEGORI_LABELS = {
  pribadi: "Pribadi",
  sosial: "Sosial",
  belajar: "Belajar",
  karir: "Karir",
  keluarga: "Keluarga",
  lainnya: "Lainnya",
};

const STATUS_LABELS = {
  berlangsung: { label: "Berlangsung", cls: "bg-blue-100 text-blue-700" },
  selesai: { label: "Selesai", cls: "bg-green-100 text-green-700" },
  perlu_tindak_lanjut: { label: "Perlu Tindak Lanjut", cls: "bg-amber-100 text-amber-700" },
};

export default function KonselingPage() {
  const [params, setParams] = useState({ page: 1, per_page: 15 });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data, isLoading, isFetching, refetch } = useKonselingList({
    ...params,
    search: search || undefined,
    status: filterStatus || undefined,
  });

  const hapus = useHapusKonseling();

  const konseling = data?.data?.data ?? [];
  const meta = data?.data;

  const handleHapus = (id, nama) => {
    if (!confirm(`Hapus sesi konseling siswa ${nama}?`)) return;
    hapus.mutate(id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Sesi Konseling</h1>
          <p className="text-sm text-gray-500">Kelola dan catat sesi bimbingan konseling siswa</p>
        </div>
        <Link
          to="/guru-bk/konseling/tambah"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Catat Konseling
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama / NISN siswa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Semua Status</option>
          <option value="berlangsung">Berlangsung</option>
          <option value="selesai">Selesai</option>
          <option value="perlu_tindak_lanjut">Perlu Tindak Lanjut</option>
        </select>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-400">Memuat data...</p>
            </div>
          </div>
        ) : konseling.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <AlertCircle className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada sesi konseling</p>
            <p className="text-xs text-gray-400 mt-1">Klik "Catat Konseling" untuk memulai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Siswa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Jenis</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {konseling.map((item) => {
                  const st = STATUS_LABELS[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{item.siswa?.nama ?? "—"}</p>
                        <p className="text-xs text-gray-400">{item.siswa?.nisn}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{item.jenis}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-600 capitalize">
                          {KATEGORI_LABELS[item.kategori] ?? item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/guru-bk/konseling/${item.id}`}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Lihat detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleHapus(item.id, item.siswa?.nama)}
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

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {meta.from}–{meta.to} dari {meta.total} sesi
            </span>
            <div className="flex gap-1">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

