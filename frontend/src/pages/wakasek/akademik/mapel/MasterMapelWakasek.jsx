import { useState, useEffect } from "react";
import {
  useMapelList,
  useMapelStats,
  useToggleMapel,
  useDeleteMapel,
} from "../../../../hooks/api/useMapel";
// Reuse komponen UI dari operator — tidak duplikasi
import TambahEditMapel from "../../operator/master/masterDataMapel/TambahEditMapel";
import Confirm from "../../../../components/ui/Confirm";
import MapelTable from "../../operator/master/masterDataMapel/components/MapelTable";
import {
  MapelStatsGrid,
  MapelToolbar,
} from "../../operator/master/masterDataMapel/components/MapelHelpers";
import { BookOpen, Plus } from "lucide-react";

/* ─── MasterMapelWakasek ──────────────────────────────────────────────────── */
export default function MasterMapelWakasek() {
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

        {/* CTA — hanya Tambah Mapel (import/export domain operator) */}
        <div className="flex flex-wrap items-center gap-3">
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
        onImport={null} // operator yang handle import
        onPageChange={setPage}
      />

      {/* ── Modals — reuse langsung ── */}
      <TambahEditMapel
        isOpen={modalOpen}
        onClose={closeModal}
        editData={editData}
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
