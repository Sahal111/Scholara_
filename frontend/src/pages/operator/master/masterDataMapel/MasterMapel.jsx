import { useState, useEffect } from "react";
import {
  useMapelList,
  useMapelStats,
  useToggleMapel,
  useDeleteMapel,
  exportMapel,
} from "../../../../hooks/api/useMapel";
import TambahEditMapel from "./TambahEditMapel";
import ModalImportMapel from "./components/ModalImportMapel";
import Confirm from "../../../../components/ui/Confirm";
import MapelTable from "./components/MapelTable";
import { MapelStatsGrid, MapelToolbar } from "./components/MapelHelpers";
import toast from "react-hot-toast";
import {
  Upload,
  Download,
  Plus,
  BookOpen,
} from "lucide-react";

/* ─── Halaman Utama: Master Mata Pelajaran ───────────────────── */
export default function MasterMapel() {
  /* ── State modal ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  /* ── State filter & paginasi ── */
  const [search, setSearch] = useState("");
  const [filterKelompok, setFilterKelompok] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  // Reset ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setPage(1);
  }, [search, filterKelompok, filterTingkat, filterStatus]);

  /* ── React Query hooks ── */
  const { data, isLoading } = useMapelList({
    search,
    kelompok: filterKelompok,
    tingkat: filterTingkat,
    is_active: filterStatus,
    page,
  });

  // Stats dari backend — dihitung dari seluruh data, bukan per-halaman
  const { data: statsData, isLoading: statsLoading } = useMapelStats();

  const toggleActive = useToggleMapel();
  const hapus = useDeleteMapel();

  /* ── Derived data ── */
  const list = data?.data ?? [];
  const meta = data?.meta ?? {};
  const lastPage = meta?.last_page ?? 1;
  const hasActiveFilters = !!(filterKelompok || filterTingkat || filterStatus || search);

  /* ── Handlers ── */
  const openTambah = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditData({ ...m });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditData(null);
  };

  const handleDelete = () => {
    hapus.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  };

  const resetFilters = () => {
    setSearch("");
    setFilterKelompok("");
    setFilterTingkat("");
    setFilterStatus("");
    setPage(1);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportMapel({
        kelompok: filterKelompok,
        tingkat: filterTingkat,
        is_active: filterStatus,
      });
      toast.success("Data berhasil diekspor.");
    } catch {
      toast.error("Gagal mengekspor data.");
    } finally {
      setExportLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 rounded-full bg-emerald-700/10 border border-emerald-700/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
              <span className="text-[10px] text-emerald-700 tracking-widest uppercase font-black">
                Master Data
              </span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl text-emerald-900 font-extrabold leading-tight tracking-tighter mb-2 flex items-center gap-3">
            <BookOpen size={36} className="text-emerald-700" />
            Mata Pelajaran
          </h1>
          <p className="text-gray-600 max-w-2xl leading-relaxed text-base">
            Kelola daftar mata pelajaran, kelompok, kurikulum, dan status
            pembelajaran secara terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setImportOpen(true)}
            className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 font-semibold text-sm bg-white"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 font-semibold text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exportLoading ? "Mengekspor..." : "Export"}
          </button>
          <button
            onClick={openTambah}
            className="bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/25 hover:bg-emerald-800 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={18} />
            Tambah Mapel
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <MapelStatsGrid isLoading={statsLoading} stats={statsData} />

      {/* ── Toolbar ── */}
      <MapelToolbar
        search={search}
        setSearch={setSearch}
        filterKelompok={filterKelompok}
        setFilterKelompok={setFilterKelompok}
        filterTingkat={filterTingkat}
        setFilterTingkat={setFilterTingkat}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onReset={resetFilters}
      />

      {/* ── Table ── */}
      <MapelTable
        list={list}
        meta={meta}
        isLoading={isLoading}
        page={page}
        lastPage={lastPage}
        hasActiveFilters={hasActiveFilters}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onToggle={(id) => toggleActive.mutate(id)}
        onTambah={openTambah}
        onImport={() => setImportOpen(true)}
        onPageChange={setPage}
      />

      {/* ── Modals ── */}
      <TambahEditMapel
        isOpen={modalOpen}
        onClose={closeModal}
        editData={editData}
      />

      <ModalImportMapel
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <Confirm
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Mata Pelajaran?"
        message={
          deleteTarget
            ? `Mata pelajaran "${deleteTarget.nama_mapel}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel="Ya, Hapus"
        isLoading={hapus.isPending}
        variant="danger"
      />
    </div>
  );
}
