import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookMarked,
  Search,
  Plus,
  Eye,
  Lock,
  LockOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useRaporList, useBuatRaporPerKelas, useFinalisasiMassal } from "../../hooks/api/usePenilaian";

/** Badge status rapor */
function StatusBadge({ status }) {
  if (status === "final") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Lock className="w-3 h-3" />
        Final
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <LockOpen className="w-3 h-3" />
      Draft
    </span>
  );
}

export default function RaporPage() {
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage]               = useState(1);

  // Form buat rapor per kelas
  const [showForm, setShowForm]       = useState(false);
  const [kelasId, setKelasId]         = useState("");
  const [semesterId, setSemesterId]   = useState("");
  const [tahunAjaranId, setTahunAjaranId] = useState("");

  const { data, isLoading, isError, error, refetch } = useRaporList({
    search,
    status: filterStatus,
    page,
    per_page: 20,
  });

  const buatRapor        = useBuatRaporPerKelas();
  const finalisasiMassal = useFinalisasiMassal();

  const rapors   = data?.data ?? [];
  const meta     = data?.meta ?? {};
  const lastPage = meta.last_page ?? 1;

  function handleBuatRapor(e) {
    e.preventDefault();
    if (!kelasId || !semesterId || !tahunAjaranId) {
      alert("Lengkapi semua field terlebih dahulu.");
      return;
    }
    buatRapor.mutate(
      { kelas_id: Number(kelasId), semester_id: Number(semesterId), tahun_ajaran_id: Number(tahunAjaranId) },
      { onSuccess: () => { setShowForm(false); refetch(); } }
    );
  }

  function handleFinalisasiMassal() {
    if (!kelasId || !semesterId) {
      alert("Pilih kelas dan semester terlebih dahulu.");
      return;
    }
    if (!confirm("Finalisasi semua rapor draft di kelas ini? Rapor yang sudah difinalisasi tidak bisa diedit.")) return;
    finalisasiMassal.mutate({ kelas_id: Number(kelasId), semester_id: Number(semesterId) });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="w-7 h-7 text-indigo-600" />
            Rapor Siswa
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan finalisasi rapor per semester
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Rapor Kelas
        </button>
      </div>

      {/* Form Buat Rapor */}
      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-indigo-800 mb-4">
            Buat Rapor Baru untuk Satu Kelas
          </h3>
          <form onSubmit={handleBuatRapor} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-indigo-700 mb-1">ID Kelas</label>
              <input
                type="number"
                placeholder="Contoh: 1"
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-700 mb-1">ID Semester</label>
              <input
                type="number"
                placeholder="Contoh: 2"
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-700 mb-1">ID Tahun Ajaran</label>
              <input
                type="number"
                placeholder="Contoh: 1"
                value={tahunAjaranId}
                onChange={(e) => setTahunAjaranId(e.target.value)}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={buatRapor.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {buatRapor.isPending ? "Membuat..." : "Buat Rapor"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 border border-indigo-300 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100"
              >
                Batal
              </button>
            </div>
          </form>
          <p className="text-xs text-indigo-600 mt-2">
            Rapor akan dibuat dengan status <strong>draft</strong> untuk semua siswa aktif di kelas tersebut.
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="final">Final</option>
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Tabel Rapor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Memuat data rapor...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm">{error?.response?.data?.message ?? "Gagal memuat data"}</p>
            <button onClick={() => refetch()} className="text-xs px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              Coba Lagi
            </button>
          </div>
        ) : rapors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <BookMarked className="w-12 h-12" />
            <p className="text-sm font-medium text-gray-500">Belum ada rapor</p>
            <p className="text-xs text-gray-400">Klik "Buat Rapor Kelas" untuk memulai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Siswa</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali Kelas</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rapors.map((rapor) => (
                  <tr key={rapor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-900">{rapor.siswa?.nama ?? "-"}</div>
                      <div className="text-xs text-gray-500">NIS: {rapor.siswa?.nisn ?? "-"}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {rapor.kelas?.nama ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {rapor.semester?.nama ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {rapor.wali_kelas?.nama ?? "-"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={rapor.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/walikelas/rapor/${rapor.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Halaman <span className="font-medium">{page}</span> dari <span className="font-medium">{lastPage}</span>
              {meta.total && <> &mdash; {meta.total} rapor</>}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

