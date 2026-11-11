import { useState } from "react";
import { Link } from "react-router-dom";
import { useBukuList, useHapusBuku } from "../../hooks/api/usePerpustakaan";
import {
  Plus, Search, BookOpen, Trash2, Eye, Edit2, AlertCircle, RefreshCw,
} from "lucide-react";

export default function KatalogBukuPage() {
  const [params, setParams] = useState({ page: 1, per_page: 20 });
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");

  const { data, isLoading, isFetching, refetch } = useBukuList({
    ...params,
    search: search || undefined,
    kategori: filterKategori || undefined,
  });

  const hapus = useHapusBuku();
  const buku = data?.data?.data ?? [];
  const meta = data?.data;

  const handleHapus = (id, judul) => {
    if (!confirm(`Hapus buku "${judul}"?`)) return;
    hapus.mutate(id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Katalog Buku</h1>
          <p className="text-sm text-gray-500">Kelola koleksi buku perpustakaan sekolah</p>
        </div>
        <Link
          to="/pustakawan/buku/tambah"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Buku
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul, pengarang, kode buku, ISBN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <input
          type="text"
          placeholder="Filter kategori..."
          value={filterKategori}
          onChange={(e) => { setFilterKategori(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full sm:w-40"
        />
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
              <p className="text-sm text-gray-400">Memuat katalog...</p>
            </div>
          </div>
        ) : buku.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada buku</p>
            <p className="text-xs text-gray-400 mt-1">Klik "Tambah Buku" untuk memulai katalog</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Pengarang</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kode</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Stok</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Tersedia</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {buku.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 max-w-[200px] truncate">{item.judul}</p>
                      {item.isbn && <p className="text-xs text-gray-400">ISBN: {item.isbn}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{item.pengarang ?? "—"}</td>
                    <td className="px-4 py-3">
                      {item.kategori ? (
                        <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {item.kategori}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.kode_buku ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{item.stok_total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${item.stok_tersedia > 0 ? "text-green-600" : "text-red-500"}`}>
                        {item.stok_tersedia}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/pustakawan/buku/${item.id}`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/pustakawan/buku/${item.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleHapus(item.id, item.judul)}
                          disabled={hapus.isPending}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
            <span>{meta.from}–{meta.to} dari {meta.total} buku</span>
            <div className="flex gap-1">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >← Prev</button>
              <button
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

