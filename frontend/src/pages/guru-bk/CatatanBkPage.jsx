import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Star,
  ScanEye,
  MessageSquare,
} from "lucide-react";
import { useCatatanList, useHapusCatatan } from "../../hooks/api/useBk";

/** Badge tipe catatan (pelanggaran, prestasi, observasi, rekomendasi) */
function TipeBadge({ tipe }) {
  const map = {
    pelanggaran: { label: "Pelanggaran", cls: "bg-red-100 text-red-800", Icon: ShieldAlert },
    prestasi: { label: "Prestasi", cls: "bg-green-100 text-green-800", Icon: Star },
    observasi: { label: "Observasi", cls: "bg-blue-100 text-blue-800", Icon: ScanEye },
    rekomendasi: { label: "Rekomendasi", cls: "bg-purple-100 text-purple-800", Icon: MessageSquare },
  };

  const cfg = map[tipe] ?? { label: tipe, cls: "bg-gray-100 text-gray-700", Icon: BookOpen };
  const { label, cls, Icon } = cfg;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

/** Badge tingkat catatan (rendah, sedang, tinggi) */
function TingkatBadge({ tingkat }) {
  const map = {
    rendah: "bg-gray-100 text-gray-600",
    sedang: "bg-orange-100 text-orange-700",
    tinggi: "bg-red-100 text-red-700",
  };

  if (!tingkat) return null;

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[tingkat] ?? "bg-gray-100 text-gray-600"}`}>
      {tingkat.charAt(0).toUpperCase() + tingkat.slice(1)}
    </span>
  );
}

export default function CatatanBkPage() {
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useCatatanList({
    search,
    tipe: filterTipe,
    tingkat: filterTingkat,
    page,
    per_page: 15,
  });

  const hapusCatatan = useHapusCatatan();

  const catatan = data?.data ?? [];
  const meta = data?.meta ?? {};
  const lastPage = meta.last_page ?? 1;

  /** Konfirmasi dan hapus catatan */
  function handleHapus(id, nama) {
    if (!confirm(`Hapus catatan untuk ${nama ?? "siswa ini"}? Tindakan ini tidak dapat dibatalkan.`)) return;
    hapusCatatan.mutate(id);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Catatan BK
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Riwayat catatan bimbingan dan konseling siswa
          </p>
        </div>
        <Link
          to="/guru-bk/catatan/tambah"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Catatan
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau isi catatan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tipe */}
          <select
            value={filterTipe}
            onChange={(e) => { setFilterTipe(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Semua Tipe</option>
            <option value="pelanggaran">Pelanggaran</option>
            <option value="prestasi">Prestasi</option>
            <option value="observasi">Observasi</option>
            <option value="rekomendasi">Rekomendasi</option>
          </select>

          {/* Filter Tingkat */}
          <select
            value={filterTingkat}
            onChange={(e) => { setFilterTingkat(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Semua Tingkat</option>
            <option value="rendah">Rendah</option>
            <option value="sedang">Sedang</option>
            <option value="tinggi">Tinggi</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Memuat catatan BK...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm font-medium">Gagal memuat data</p>
            <p className="text-xs text-gray-500">
              {error?.response?.data?.message ?? "Periksa koneksi internet Anda"}
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              Coba Lagi
            </button>
          </div>
        ) : catatan.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <BookOpen className="w-12 h-12" />
            <p className="text-sm font-medium text-gray-500">Belum ada catatan BK</p>
            {(search || filterTipe || filterTingkat) && (
              <p className="text-xs text-gray-400">Coba ubah filter pencarian</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe / Tingkat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {catatan.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Siswa */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.siswa?.nama ?? item.siswa_nama ?? "-"}
                      </div>
                      {item.siswa?.nis && (
                        <div className="text-xs text-gray-500">NIS: {item.siswa.nis}</div>
                      )}
                      {item.kelas_nama && (
                        <div className="text-xs text-gray-500">Kelas: {item.kelas_nama}</div>
                      )}
                    </td>

                    {/* Tipe + Tingkat */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <TipeBadge tipe={item.tipe} />
                        <TingkatBadge tingkat={item.tingkat} />
                      </div>
                    </td>

                    {/* Deskripsi */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs line-clamp-2">
                        {item.deskripsi ?? item.catatan ?? "-"}
                      </p>
                    </td>

                    {/* Tanggal */}
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {item.tanggal
                        ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : item.created_at
                        ? new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/guru-bk/catatan/${item.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Link>
                        <button
                          onClick={() => handleHapus(item.id, item.siswa?.nama ?? item.siswa_nama)}
                          disabled={hapusCatatan.isPending}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
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
        {!isLoading && !isError && lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Halaman <span className="font-medium">{page}</span> dari{" "}
              <span className="font-medium">{lastPage}</span>
              {meta.total && (
                <> &mdash; total <span className="font-medium">{meta.total}</span> catatan</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

