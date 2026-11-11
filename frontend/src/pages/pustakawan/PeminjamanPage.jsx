import { useState } from "react";
import { Link } from "react-router-dom";
import { usePeminjamanList, useKembalikanBuku } from "../../hooks/api/usePerpustakaan";
import {
  Plus, Search, BookOpenCheck, AlertCircle, RefreshCw, RotateCcw,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const STATUS_CFG = {
  dipinjam: { label: "Dipinjam", cls: "bg-blue-100 text-blue-700" },
  dikembalikan: { label: "Dikembalikan", cls: "bg-green-100 text-green-700" },
  terlambat: { label: "Terlambat", cls: "bg-red-100 text-red-700" },
  hilang: { label: "Hilang", cls: "bg-gray-100 text-gray-600" },
};

export default function PeminjamanPage() {
  const [params, setParams] = useState({ page: 1, per_page: 20 });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data, isLoading, isFetching, refetch } = usePeminjamanList({
    ...params,
    search: search || undefined,
    status: filterStatus || undefined,
  });

  const kembalikan = useKembalikanBuku();
  const peminjaman = data?.data?.data ?? [];
  const meta = data?.data;

  const handleKembalikan = (id, judulBuku) => {
    if (!confirm(`Tandai buku "${judulBuku}" sudah dikembalikan?`)) return;
    kembalikan.mutate(id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Peminjaman Buku</h1>
          <p className="text-sm text-gray-500">Catat dan pantau peminjaman koleksi perpustakaan</p>
        </div>
        <Link
          to="/pustakawan/peminjaman/tambah"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Catat Peminjaman
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama peminjam atau judul buku..."
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
          <option value="dipinjam">Dipinjam</option>
          <option value="dikembalikan">Dikembalikan</option>
          <option value="terlambat">Terlambat</option>
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
              <p className="text-sm text-gray-400">Memuat data peminjaman...</p>
            </div>
          </div>
        ) : peminjaman.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <BookOpenCheck className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada data peminjaman</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Peminjam</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Buku</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tgl Pinjam</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tgl Kembali</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {peminjaman.map((item) => {
                  const st = STATUS_CFG[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-600" };
                  const isTerlambat = item.status === "dipinjam" &&
                    item.tanggal_kembali && dayjs().isAfter(dayjs(item.tanggal_kembali));
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${isTerlambat ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{item.peminjam?.name ?? "—"}</p>
                        <p className="text-xs text-gray-400">{item.peminjam?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700 max-w-[180px] truncate">{item.buku?.judul ?? "—"}</p>
                        <p className="text-xs text-gray-400">{item.buku?.kode_buku}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {dayjs(item.tanggal_pinjam).format("D MMM YYYY")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span className={isTerlambat ? "text-red-600 font-semibold" : "text-gray-600"}>
                          {item.tanggal_kembali ? dayjs(item.tanggal_kembali).format("D MMM YYYY") : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isTerlambat ? STATUS_CFG.terlambat.cls : st.cls}`}>
                          {isTerlambat ? "Terlambat" : st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === "dipinjam" && (
                            <button
                              onClick={() => handleKembalikan(item.id, item.buku?.judul)}
                              disabled={kembalikan.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold transition-colors disabled:opacity-40"
                              title="Tandai dikembalikan"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Kembali
                            </button>
                          )}
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
            <span>{meta.from}–{meta.to} dari {meta.total} peminjaman</span>
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

