import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck,
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useLegalisirList, useProsesLegalisir } from "../../hooks/api/useTataUsaha";

/**
 * Badge status legalisir dengan warna berbeda per status.
 */
function StatusBadge({ status }) {
  const map = {
    menunggu: {
      label: "Menunggu",
      cls: "bg-yellow-100 text-yellow-800",
      Icon: Clock,
    },
    diproses: {
      label: "Diproses",
      cls: "bg-blue-100 text-blue-800",
      Icon: RefreshCw,
    },
    selesai: {
      label: "Selesai",
      cls: "bg-green-100 text-green-800",
      Icon: CheckCircle,
    },
    ditolak: {
      label: "Ditolak",
      cls: "bg-red-100 text-red-800",
      Icon: XCircle,
    },
  };

  const cfg = map[status] || { label: status, cls: "bg-gray-100 text-gray-700", Icon: AlertCircle };
  const { label, cls, Icon } = cfg;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function LegalisirPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useLegalisirList({
    search,
    status: filterStatus,
    page,
    per_page: 15,
  });

  const prosesLegalisir = useProsesLegalisir();

  const legalisirs = data?.data ?? [];
  const meta = data?.meta ?? {};
  const lastPage = meta.last_page ?? 1;

  /** Proses permintaan legalisir (ubah status → diproses) */
  function handleProses(id) {
    if (!confirm("Proses permintaan legalisir ini?")) return;
    prosesLegalisir.mutate(id);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-blue-600" />
            Legalisir Dokumen
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola permintaan legalisir dokumen dari siswa dan alumni
          </p>
        </div>
        <Link
          to="/tata-usaha/legalisir/tambah"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Permintaan
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
              placeholder="Cari nama pemohon atau jenis dokumen..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>

          {/* Tombol refresh */}
          <button
            onClick={() => refetch()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh data"
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
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Memuat data legalisir...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm font-medium">Gagal memuat data</p>
            <p className="text-xs text-gray-500 max-w-xs text-center">
              {error?.response?.data?.message ?? "Periksa koneksi internet Anda"}
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : legalisirs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <FileCheck className="w-12 h-12" />
            <p className="text-sm font-medium text-gray-500">Belum ada permintaan legalisir</p>
            {(search || filterStatus) && (
              <p className="text-xs text-gray-400">Coba ubah filter pencarian</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pemohon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Dokumen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Pengajuan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {legalisirs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.pemohon_nama ?? item.pemohon ?? "-"}
                      </div>
                      {item.nis && (
                        <div className="text-xs text-gray-500">NIS: {item.nis}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.jenis_dokumen}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.jumlah ?? 1} lembar
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Detail */}
                        <Link
                          to={`/tata-usaha/legalisir/${item.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Link>

                        {/* Tombol Proses — hanya untuk status menunggu */}
                        {item.status === "menunggu" && (
                          <button
                            onClick={() => handleProses(item.id)}
                            disabled={prosesLegalisir.isPending}
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Proses
                          </button>
                        )}

                        {/* Tombol Selesai — hanya untuk status diproses */}
                        {item.status === "diproses" && (
                          <button
                            onClick={() => handleProses(item.id)}
                            disabled={prosesLegalisir.isPending}
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Selesai
                          </button>
                        )}
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
                <> &mdash; total <span className="font-medium">{meta.total}</span> data</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

