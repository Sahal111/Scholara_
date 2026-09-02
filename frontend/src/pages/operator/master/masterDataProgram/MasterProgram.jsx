import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useProgramTree,
  useDeleteProgram,
  useToggleProgramStatus,
} from "../../../../hooks/api/useProgramPendidikan";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  getProgramConfig,
  getProgramJenisOptions,
} from "../../../../config/programConfig";
import ModalProgram from "./components/ModalProgram";
import ModalHapus from "./components/ModalHapus";
import FilterToolbar from "./components/FilterToolbar";
import ProgramTable from "./components/ProgramTable";

/* ─── helpers ────────────────────────────────────────────────────────────────── */
function flattenTree(nodes, depth = 0, rows = []) {
  if (!nodes) return rows;
  for (const node of nodes) {
    rows.push({ ...node, _depth: depth });
    if (node.descendantsTree?.length)
      flattenTree(node.descendantsTree, depth + 1, rows);
  }
  return rows;
}

function collectAllUlids(nodes, result = new Set()) {
  if (!nodes) return result;
  for (const node of nodes) {
    result.add(node.ulid);
    if (node.descendantsTree?.length)
      collectAllUlids(node.descendantsTree, result);
  }
  return result;
}

/* ─── StatCard ────────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, unit }) {
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-[#bfc9c4]/20 shadow-sm group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(0,52,43,0.1)]">
      {/* decorative blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#006e2a]/5 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a] group-hover:text-white transition-all duration-300 flex-shrink-0">
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-[#006e2a] uppercase tracking-[0.2em] mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3
              className="text-4xl font-extrabold text-[#00342b] tracking-tighter"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              {value}
            </h3>
            <span className="text-sm font-medium text-[#3f4945]/60">
              {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── JenjangEmptyState ───────────────────────────────────────────────────────── */
function JenjangEmptyState({ school }) {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-[#bfc9c4]/20 overflow-hidden">
      <div className="flex flex-col items-center justify-center text-center gap-5 py-24 px-8">
        <div className="w-20 h-20 rounded-full bg-[#f0f5ec] border border-[#bfc9c4]/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-[#bfc9c4]">
            school
          </span>
        </div>
        <div>
          <h3
            className="text-lg font-bold text-[#00342b] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Tidak Ada Program Pendidikan
          </h3>
          <p className="text-sm text-[#707975] max-w-sm leading-relaxed">
            Jenjang{" "}
            <span className="font-semibold text-[#00342b]">
              {school?.jenis ?? "ini"}
            </span>{" "}
            umumnya tidak menggunakan program keahlian atau peminatan.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── MasterProgram ───────────────────────────────────────────────────────────── */
export default function MasterProgram() {
  const { school, hasPermission } = useAuth();
  const canManage = hasPermission("master_data.program.manage");

  const programConfig = getProgramConfig(
    school?.jenis,
    school?.kurikulum,
    school?.subtipe,
  );
  const jenisOptions = getProgramJenisOptions(
    school?.jenis,
    school?.kurikulum,
    school?.subtipe,
  );

  /* filter state */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  /* pagination */
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);

  /* expand state */
  const [expandedSet, setExpandedSet] = useState(new Set());
  const handleToggleExpand = (ulid) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(ulid)) next.delete(ulid);
      else next.add(ulid);
      return next;
    });
  };

  /* modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [modalDefaultJenis, setModalDefaultJenis] = useState(null);
  const [modalDefaultParentId, setModalDefaultParentId] = useState(null);
  const [modalDefaultParentLabel, setModalDefaultParentLabel] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  /* data — filtered (untuk tabel) + unfiltered (untuk stat card) */
  const { data: treeData, isLoading } = useProgramTree(
    filterStatus !== "" ? { is_active: filterStatus } : {},
  );
  const treeNodes = treeData?.data ?? [];

  const { data: treeDataAll } = useProgramTree({});
  const treeNodesAll = treeDataAll?.data ?? treeNodes;

  useEffect(() => {
    if (treeNodes.length > 0 && expandedSet.size === 0) {
      setExpandedSet(new Set(treeNodes.map((n) => n.ulid)));
    }
  }, [treeNodes.length]);

  useEffect(() => {
    if (search.trim()) setExpandedSet(collectAllUlids(treeNodes));
  }, [search]);

  /* filtered & paged data */
  const filteredNodes = search.trim()
    ? treeNodes.filter((root) => {
        const q = search.toLowerCase();
        const matchRoot =
          root.nama?.toLowerCase().includes(q) ||
          root.kode?.toLowerCase().includes(q);
        const matchChild = (root.descendantsTree ?? []).some(
          (c) =>
            c.nama?.toLowerCase().includes(q) ||
            c.kode?.toLowerCase().includes(q) ||
            (c.descendantsTree ?? []).some(
              (cc) =>
                cc.nama?.toLowerCase().includes(q) ||
                cc.kode?.toLowerCase().includes(q),
            ),
        );
        return matchRoot || matchChild;
      })
    : treeNodes;

  const totalRoots = filteredNodes.length;
  const totalPages = Math.ceil(totalRoots / PAGE_SIZE);
  const pagedRoots = filteredNodes.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  /* stat cards — derive dari programConfig tabs, tidak hardcode SMK */
  const allRows = flattenTree(treeNodesAll);
  const activeJenisTabs = (programConfig.tabs ?? []).filter(
    (t) => t.value !== "semua",
  );
  // Tiga slot: ambil tab pertama, kedua, ketiga dari config aktif sekolah
  const statSlots = activeJenisTabs.slice(0, 3).map((tab) => ({
    icon: tab.icon,
    label: tab.label,
    unit: tab.unit ?? "Program",
    count: allRows.filter((r) => r.jenis === tab.value).length,
  }));

  const from = totalRoots === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRoots);

  /* mutations */
  const deleteMut = useDeleteProgram();
  const toggleMut = useToggleProgramStatus();

  /* handlers */
  const handleEdit = (item) => {
    setEditData(item);
    setModalDefaultJenis(item.jenis);
    setModalOpen(true);
  };
  const handleDelete = (item) => setDeleteItem(item);
  const handleConfirmDelete = () =>
    deleteMut.mutate(deleteItem.ulid, { onSuccess: () => setDeleteItem(null) });
  const handleToggleStatus = (item) =>
    toggleMut.mutate(item.ulid, {
      onSuccess: () =>
        toast.success(
          `Program berhasil ${item.is_active ? "dinonaktifkan" : "diaktifkan"}.`,
        ),
    });

  const handleTambah = () => {
    setEditData(null);
    setModalDefaultJenis(null);
    setModalDefaultParentId(null);
    setModalDefaultParentLabel(null);
    setModalOpen(true);
  };
  const handleTambahChild = (parentItem) => {
    const map = {
      bidang_keahlian: "program_keahlian",
      program_keahlian: "konsentrasi_keahlian",
    };
    const childJenis = map[parentItem.jenis];
    if (!childJenis) return;
    setEditData(null);
    setModalDefaultJenis(childJenis);
    setModalDefaultParentId(parentItem.ulid);
    setModalDefaultParentLabel(
      parentItem.kode
        ? `[${parentItem.kode}] ${parentItem.nama}`
        : parentItem.nama,
    );
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditData(null);
    setModalDefaultJenis(null);
    setModalDefaultParentId(null);
    setModalDefaultParentLabel(null);
  };
  const handleReset = () => {
    setSearch("");
    setFilterStatus("");
    setPage(1);
  };

  return (
    <>
      <ModalProgram
        open={modalOpen}
        onClose={handleCloseModal}
        editData={editData}
        defaultJenis={modalDefaultJenis}
        defaultParentId={modalDefaultParentId}
        defaultParentLabel={modalDefaultParentLabel}
        jenisOptions={jenisOptions}
        schoolJenis={school?.jenis ?? null}
      />
      <ModalHapus
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        isPending={deleteMut.isPending}
      />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative">
        <div className="relative flex-1">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1.5 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse" />
              <span
                className="text-[10px] text-[#006e2a] tracking-[0.2em] uppercase font-black"
                style={{ fontFamily: "'Inter',sans-serif" }}
              >
                MASTER DATA
              </span>
            </div>
            <div className="h-px w-32 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
          </div>
          {/* Title */}
          <h1
            className="text-[48px] font-extrabold text-[#00342b] leading-tight tracking-tighter mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Program{" "}
            <span
              className="italic font-normal text-[#006e2a]"
              style={{ fontFamily: "'EB Garamond',serif" }}
            >
              &amp; Pendidikan
            </span>
          </h1>
          <p
            className="text-lg text-[#3f4945] max-w-2xl leading-relaxed opacity-80"
            style={{ fontFamily: "'Inter',sans-serif" }}
          >
            {programConfig.description ??
              "Kelola program pendidikan sekolah secara terpadu."}
          </p>
        </div>

        {/* CTA button — shown only when school type supports programs */}
        {canManage && programConfig.hasTabs && (
          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={handleTambah}
              className="w-full md:w-auto bg-[#006e2a] text-white px-8 py-4 rounded-full flex items-center justify-center gap-3
                shadow-[0_8px_16px_rgba(0,110,42,0.15)] hover:shadow-[0_15px_40px_rgba(0,200,83,0.5)]
                hover:-translate-y-1 hover:scale-[1.05] transition-all duration-500 group border border-white/20"
            >
              <div className="bg-white/20 rounded-full p-1 group-hover:rotate-90 transition-transform duration-500">
                <span className="material-symbols-outlined text-[20px] block">
                  add
                </span>
              </div>
              <span
                className="tracking-widest font-black uppercase text-[11px]"
                style={{ fontFamily: "'Inter',sans-serif" }}
              >
                Tambah Program
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      {statSlots.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-8 mb-12 ${
            statSlots.length === 1
              ? "md:grid-cols-1 max-w-sm"
              : statSlots.length === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-3"
          }`}
        >
          {statSlots.map((slot) => (
            <StatCard
              key={slot.label}
              icon={slot.icon}
              label={slot.label}
              value={isLoading ? "—" : slot.count}
              unit={slot.unit}
            />
          ))}
        </div>
      )}

      {/* ── Main Content ── */}
      {!programConfig.hasTabs ? (
        <JenjangEmptyState school={school} />
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-[#bfc9c4]/20 overflow-hidden">
          <FilterToolbar
            search={search}
            setSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            filterStatus={filterStatus}
            setFilterStatus={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            onReset={handleReset}
          />

          <div className="space-y-8 p-6">
            <ProgramTable
              isLoading={isLoading}
              pagedRoots={pagedRoots}
              canManage={canManage}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onAddChild={handleTambahChild}
              expandedSet={expandedSet}
              onToggleExpand={handleToggleExpand}
              onTambah={handleTambah}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              from={from}
              to={to}
              totalRoots={totalRoots}
            />
          </div>
        </div>
      )}
    </>
  );
}
