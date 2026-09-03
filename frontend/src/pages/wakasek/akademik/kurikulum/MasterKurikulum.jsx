import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  BookOpen,
  Globe,
  School,
  ToggleLeft,
} from "lucide-react";
import {
  useKurikulumList,
  useDeleteKurikulum,
  useDeactivateKurikulum,
} from "../../../../../../hooks/api/useKurikulum";  
import ModalKurikulum from "./kurikulum/components/ModalKurikulum";

// ── Badge status ──────────────────────────────────────────────────────────────
function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
      Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      Nonaktif
    </span>
  );
}

// ── Badge platform vs custom ──────────────────────────────────────────────────
function SourceBadge({ isPlatform }) {
  return isPlatform ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
      <Globe size={10} /> Platform
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
      <School size={10} /> Custom
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// ── Confirm dialog kecil ──────────────────────────────────────────────────────
function ConfirmDialog({ open, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Ya, Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MasterKurikulum() {
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    type: null,
    target: null,
  });

  useEffect(() => {
    setPage(1);
  }, [search, filterJenis, filterStatus]);

  const { data, isLoading } = useKurikulumList({
    search,
    jenis: filterJenis,
    is_active: filterStatus,
    page,
  });

  const hapus = useDeleteKurikulum();
  const nonaktifkan = useDeactivateKurikulum();

  const list = data?.data?.data ?? [];
  const meta = data?.data ?? {};
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? 0;

  // Stat sederhana dari data yang ada di halaman
  const totalPlatform = list.filter((k) => k.is_platform).length;
  const totalCustom = list.filter((k) => !k.is_platform).length;
  const totalAktif = list.filter((k) => k.is_active).length;

  const openTambah = () => {
    setEditData(null);
    setModalOpen(true);
  };
  const openEdit = (k) => {
    setEditData(k);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (confirm.type === "hapus") {
      await hapus.mutateAsync(confirm.target.ulid);
    } else if (confirm.type === "nonaktif") {
      await nonaktifkan.mutateAsync(confirm.target.ulid);
    }
    setConfirm({ open: false, type: null, target: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen size={20} className="text-[#006e2a]" />
          Manajemen Kurikulum
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola kurikulum platform dan custom sekolah
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total"
          value={total}
          icon={BookOpen}
          color="bg-[#006e2a]/10 text-[#006e2a]"
        />
        <StatCard
          label="Platform"
          value={totalPlatform}
          icon={Globe}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Custom"
          value={totalCustom}
          icon={School}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Aktif"
          value={totalAktif}
          icon={ToggleLeft}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama atau kode kurikulum..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
            />
          </div>

          {/* Filter jenis */}
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
          >
            <option value="">Semua Jenis</option>
            <option value="nasional">Nasional</option>
            <option value="internasional">Internasional</option>
            <option value="lokal">Lokal / Mulok</option>
          </select>

          {/* Filter status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>

          <button
            onClick={openTambah}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#006e2a] text-white rounded-lg hover:bg-[#005a22] transition-colors whitespace-nowrap"
          >
            <Plus size={15} /> Tambah Kurikulum
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Memuat data...
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <BookOpen size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Tidak ada kurikulum ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Kurikulum</th>
                  <th className="text-left px-4 py-3">Kode</th>
                  <th className="text-left px-4 py-3">Jenis</th>
                  <th className="text-left px-4 py-3">Tahun</th>
                  <th className="text-left px-4 py-3">Sumber</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((k) => (
                  <tr
                    key={k.ulid}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {k.nama}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {k.kode}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {k.jenis_label ?? k.jenis}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {k.tahun_berlaku}
                      {k.tahun_berakhir ? `–${k.tahun_berakhir}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge isPlatform={k.is_platform} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={k.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit hanya untuk kurikulum custom */}
                        {!k.is_platform && (
                          <button
                            onClick={() => openEdit(k)}
                            className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {!k.is_platform && k.is_active && (
                          <button
                            onClick={() =>
                              setConfirm({
                                open: true,
                                type: "nonaktif",
                                target: k,
                              })
                            }
                            className="text-xs px-3 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            Nonaktifkan
                          </button>
                        )}
                        {!k.is_platform && (
                          <button
                            onClick={() =>
                              setConfirm({
                                open: true,
                                type: "hapus",
                                target: k,
                              })
                            }
                            className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Hapus
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
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Halaman {page} dari {lastPage}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Sebelumnya
              </button>
              <button
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <ModalKurikulum
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={editData}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        message={
          confirm.type === "hapus"
            ? `Hapus kurikulum "${confirm.target?.nama}"? Pastikan tidak ada kelas yang masih menggunakan kurikulum ini.`
            : `Nonaktifkan kurikulum "${confirm.target?.nama}"? Kurikulum tidak akan bisa dipilih untuk kelas baru.`
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ open: false, type: null, target: null })}
        loading={hapus.isPending || nonaktifkan.isPending}
      />
    </div>
  );
}
