import { useState } from "react";
import { BookOpen, Globe, School, ToggleLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useKurikulumList,
  useKurikulumDetail,
  useKurikulumStats,
  useDeleteKurikulum,
  useDeactivateKurikulum,
  useActivateKurikulum,
  useKurikulumTrash,
  useRestoreKurikulum,
} from "@/hooks/api/useKurikulum";
import DataTable from "@/components/ui/DataTable";
import Confirm from "@/components/ui/Confirm";
import ModalKurikulum from "@/pages/wakasek/akademik/kurikulum/components/ModalKurikulum";

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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MasterKurikulum() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("master_data.kurikulum.manage");

  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editUlid, setEditUlid] = useState(null);

  // BUG 1 FIX: ambil detail (termasuk komponen_nilais) dan teruskan ke modal
  const { data: detailResponse, isLoading: detailLoading } =
    useKurikulumDetail(editUlid);

  const [confirm, setConfirm] = useState({
    open: false,
    type: null,
    target: null,
  });

  const { data, isLoading } = useKurikulumList({
    search,
    jenis: filterJenis,
    is_active: filterStatus,
    page,
  });

  const [tab, setTab] = useState("aktif"); // "aktif" | "trash"

  const hapus = useDeleteKurikulum();
  const nonaktifkan = useDeactivateKurikulum();
  const aktifkan = useActivateKurikulum();
  const restore = useRestoreKurikulum();

  const { data: trashData, isLoading: trashLoading } = useKurikulumTrash();
  const trashList = trashData?.data ?? [];

  const list = data?.data ?? [];
  const meta = data?.meta ?? null;

  const { data: statsData } = useKurikulumStats();
  const total = statsData?.data?.total ?? meta?.total ?? 0;
  const totalPlatform = statsData?.data?.platform ?? 0;
  const totalCustom = statsData?.data?.custom ?? 0;
  const totalAktif = statsData?.data?.aktif ?? 0;
  const openTambah = () => {
    setEditUlid(null);
    setModalOpen(true);
  };

  const openEdit = (k) => {
    setEditUlid(k.ulid);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditUlid(null);
  };

  const handleConfirm = async () => {
    if (confirm.type === "hapus") {
      await hapus.mutateAsync(confirm.target.ulid);
    } else if (confirm.type === "nonaktif") {
      await nonaktifkan.mutateAsync(confirm.target.ulid);
    } else if (confirm.type === "aktif") {
      await aktifkan.mutateAsync(confirm.target.ulid);
    }
    setConfirm({ open: false, type: null, target: null });
  };

  // ── Kolom DataTable ───────────────────────────────────────────────────────
  const columns = [
    {
      accessorKey: "nama",
      header: "Kurikulum",
      cell: ({ row }) => (
        <span className="font-medium text-gray-800">{row.original.nama}</span>
      ),
    },
    {
      accessorKey: "kode",
      header: "Kode",
      cell: ({ row }) => (
        <span className="text-gray-500 font-mono text-xs">
          {row.original.kode}
        </span>
      ),
    },
    {
      accessorKey: "jenis",
      header: "Jenis",
      cell: ({ row }) => (
        <span className="text-gray-600 capitalize">
          {row.original.jenis_label ?? row.original.jenis}
        </span>
      ),
    },
    {
      accessorKey: "tahun_berlaku",
      header: "Tahun",
      cell: ({ row }) => (
        <span className="text-gray-600">
          {row.original.tahun_berlaku}
          {row.original.tahun_berakhir ? `–${row.original.tahun_berakhir}` : ""}
        </span>
      ),
    },
    {
      id: "sumber",
      header: "Sumber",
      cell: ({ row }) => <SourceBadge isPlatform={row.original.is_platform} />,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge active={row.original.is_active} />,
    },
    {
      id: "aksi",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const k = row.original;
        if (k.is_platform) {
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditUlid(k.ulid);
                  setModalOpen(true);
                }}
                className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Lihat Detail
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-2">
            {canManage && (
              <button
                onClick={() => openEdit(k)}
                className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            )}
            {canManage &&
              (k.is_active ? (
                <button
                  onClick={() =>
                    setConfirm({ open: true, type: "nonaktif", target: k })
                  }
                  className="text-xs px-3 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  Nonaktifkan
                </button>
              ) : (
                <button
                  onClick={() =>
                    setConfirm({ open: true, type: "aktif", target: k })
                  }
                  className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                >
                  Aktifkan
                </button>
              ))}
            <button
              onClick={() =>
                setConfirm({ open: true, type: "hapus", target: k })
              }
              className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Hapus
            </button>
          </div>
        );
      },
    },
  ];

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

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("aktif")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "aktif"
              ? "bg-[#006e2a] text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Daftar Kurikulum
        </button>
        {canManage && (
          <button
            onClick={() => setTab("trash")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              tab === "trash"
                ? "bg-red-500 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Trash2 size={14} />
            Recycle Bin
            {trashList.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {trashList.length}
              </span>
            )}
          </button>
        )}
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
            <input
              type="text"
              placeholder="Cari nama atau kode kurikulum..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-3 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
            />
          </div>

          {/* Filter jenis — BUG 2 FIX: opsi disesuaikan dengan enum backend */}
          <select
            value={filterJenis}
            onChange={(e) => {
              setFilterJenis(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
          >
            <option value="">Semua Jenis</option>
            <option value="nasional">Nasional</option>
            <option value="internasional">Internasional</option>
            <option value="khusus">Kurikulum Khusus</option>
            <option value="custom">Kurikulum Mandiri</option>
          </select>

          {/* Filter status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>

          {canManage && (
            <button
              onClick={openTambah}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#006e2a] text-white rounded-lg hover:bg-[#005a22] transition-colors whitespace-nowrap"
            >
              + Tambah Kurikulum
            </button>
          )}
        </div>
      </div>

      {/* BUG 6 FIX: DataTable menggantikan raw <table> */}
      {tab === "aktif" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={list}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            emptyMessage="Tidak ada kurikulum ditemukan."
          />
        </div>
      )}
      {tab === "trash" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {trashLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : trashList.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">
              Recycle bin kosong.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    Nama
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    Kode
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    Dihapus
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trashList.map((k) => (
                  <tr key={k.ulid} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {k.nama}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {k.kode}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {k.deleted_at
                        ? new Date(k.deleted_at).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => restore.mutateAsync(k.ulid)}
                        disabled={restore.isPending}
                        className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        Pulihkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* BUG 1 FIX: kirim detailResponse?.data (berisi komponen_nilais) ke modal */}
      <ModalKurikulum
        open={modalOpen}
        onClose={handleCloseModal}
        editData={editUlid ? (detailResponse?.data ?? null) : null}
        loadingDetail={detailLoading && !!editUlid}
      />

      {/* BUG 7 FIX: pakai shared <Confirm> bukan custom ConfirmDialog */}
      <Confirm
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, type: null, target: null })}
        onConfirm={handleConfirm}
        title={
          confirm.type === "hapus"
            ? "Hapus Kurikulum"
            : confirm.type === "nonaktif"
              ? "Nonaktifkan Kurikulum"
              : "Aktifkan Kurikulum"
        }
        message={
          confirm.type === "hapus"
            ? `Hapus kurikulum "${confirm.target?.nama}"? Pastikan tidak ada kelas yang masih menggunakannya.`
            : confirm.type === "nonaktif"
              ? `Nonaktifkan kurikulum "${confirm.target?.nama}"? Kurikulum tidak akan bisa dipilih untuk kelas baru.`
              : `Aktifkan kembali kurikulum "${confirm.target?.nama}"?`
        }
        variant={confirm.type === "hapus" ? "danger" : "warning"}
        confirmLabel={
          confirm.type === "hapus"
            ? "Ya, Hapus"
            : confirm.type === "nonaktif"
              ? "Ya, Nonaktifkan"
              : "Ya, Aktifkan"
        }
        isLoading={
          hapus.isPending || nonaktifkan.isPending || aktifkan.isPending
        }
      />
    </div>
  );
}
