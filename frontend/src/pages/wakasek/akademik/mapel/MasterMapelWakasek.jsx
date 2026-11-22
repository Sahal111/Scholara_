import { useState, useEffect } from "react";
import {
  useMapelList,
  useMapelStats,
  useToggleMapel,
  useDeleteMapel,
  exportMapel,
} from "../../../../hooks/api/useMapel";
// Reuse komponen UI dari operator — tidak duplikasi
import TambahEditMapel from "./TambahEditMapel";
import Confirm from "../../../../components/ui/Confirm";
import MapelTable from "./components/MapelTable";
import { MapelStatsGrid, MapelToolbar } from "./components/MapelHelpers";
import { BookOpen, Plus, Upload, Download } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../../contexts/AuthContext";
import ModalImportMapel from "./components/ModalImportMapel";



/* ─── MasterMapelWakasek ──────────────────────────────────────────────────── */
export default function MasterMapelWakasek() {
  /* ── Izin & state import/export ── */
  const { hasPermission } = useAuth();
  const canManage = hasPermission("master_data.mapel.manage");
  const [importOpen, setImportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportMapel();
    } catch {
      toast.error("Gagal mengekspor data.");
    } finally {
      setExportLoading(false);
    }
  };

  /* ── State modal ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── State filter & paginasi ── */
  const [search, setSearch] = useState("");
  const [filterKelompok, setFilterKelompok] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

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

  const { data: statsData, isLoading: statsLoading } = useMapelStats();
  const toggleActive = useToggleMapel();
  const hapus = useDeleteMapel();

  /* ── Derived data ── */
  const list = data?.data ?? [];
  const meta = data?.meta ?? {};
  const lastPage = meta?.last_page ?? 1;
  const hasActiveFilters = !!(
    filterKelompok ||
    filterTingkat ||
    filterStatus ||
    search
  );

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

  /* ── Render ── */
  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          {/* Badge — indigo sesuai tema wakasek */}
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
              <span className="text-[10px] text-[#7c3aed] tracking-widest uppercase font-black">
                Kebijakan Akademik
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl text-[#1e1b4b] font-extrabold leading-tight tracking-tighter mb-2 flex items-center gap-3">
            <BookOpen size={36} className="text-[#7c3aed]" />
            Mata Pelajaran
          </h1>
          <p className="text-[#4c1d95]/70 max-w-2xl leading-relaxed text-base">
            Kelola daftar mata pelajaran, kelompok, kurikulum, dan status
            pembelajaran secara terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="px-5 py-2.5 rounded-full border border-[#7c3aed]/30 text-[#7c3aed] font-bold text-sm
                  flex items-center gap-2 hover:bg-[#7c3aed]/5 transition-colors disabled:opacity-60"
              >
                <Download size={16} />
                {exportLoading ? "Mengekspor…" : "Ekspor"}
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="px-5 py-2.5 rounded-full border border-[#7c3aed]/30 text-[#7c3aed] font-bold text-sm
                  flex items-center gap-2 hover:bg-[#7c3aed]/5 transition-colors"
              >
                <Upload size={16} />
                Import
              </button>
            </>
          )}
          <button
            onClick={openTambah}
            className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2
              shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={18} />
            Tambah Mapel
          </button>
        </div>
      </div>

      {/* ── Stats Grid — reuse langsung ── */}
      <MapelStatsGrid isLoading={statsLoading} stats={statsData} />

      {/* ── Toolbar — reuse langsung ── */}
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

      {/* ── Table — reuse langsung ── */}
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
        onImport={canManage ? () => setImportOpen(true) : null}
        onPageChange={setPage}
      />

      {/* ── Modals — reuse langsung ── */}
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
