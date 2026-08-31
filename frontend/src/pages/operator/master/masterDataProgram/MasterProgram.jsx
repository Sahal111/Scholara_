import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
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
  JENIS_LABEL,
} from "../../../../config/programConfig";
import ModalProgram from "./components/ModalProgram";

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

/* ─── config maps ─────────────────────────────────────────────────────────────── */
const JENIS_ICON = {
  bidang_keahlian: "category",
  program_keahlian: "school",
  konsentrasi_keahlian: "account_tree",
  peminatan: "psychology",
  mata_pelajaran_pilihan: "menu_book",
  keagamaan: "mosque",
  umum: "star",
};

const CHILD_LABEL = {
  bidang_keahlian: "Program Keahlian",
  program_keahlian: "Konsentrasi",
};

/* ─── AksiDropdown ────────────────────────────────────────────────────────────── */
function AksiDropdown({ item, onEdit, onDelete, onToggleStatus, onAddChild }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0, flipUp: false });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const childLabel = CHILD_LABEL[item.jenis];

  /* Render menu dulu tanpa posisi, lalu ukur dan posisikan dengan benar */
  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Simpan posisi tombol, flip akan dihitung setelah menu ter-render
      setPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
        btnRect: rect,
        flipUp: false,
      });
    }
    setOpen((v) => !v);
  };

  /* Setelah menu ter-render, cek apakah perlu flip ke atas */
  useEffect(() => {
    if (!open || !menuRef.current || !pos.btnRect) return;
    const menuH = menuRef.current.offsetHeight;
    const rect = pos.btnRect;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < menuH + 8 && rect.top > menuH + 8) {
      // Tidak muat di bawah & ada ruang di atas — flip
      setPos((p) => ({
        ...p,
        top: rect.top + window.scrollY - menuH - 4,
        flipUp: true,
      }));
    }
  }, [open]);

  /* Tutup saat klik di luar */
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  /* Tutup saat scroll */
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: pos.top,
            right: pos.right,
            zIndex: 9999,
            minWidth: "13rem",
          }}
          className="bg-white rounded-xl shadow-xl border border-[#bfc9c4]/30 overflow-hidden py-1"
        >
          {childLabel && onAddChild && (
            <>
              <button
                onClick={() => {
                  onAddChild(item);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#006e2a] hover:bg-[#006e2a]/5 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add_circle
                </span>
                Tambah {childLabel}
              </button>
              <div className="h-px bg-[#bfc9c4]/20 my-1" />
            </>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit(item);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3f4945] hover:bg-[#f2f4f3] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              Edit
            </button>
          )}
          {onToggleStatus && (
            <button
              onClick={() => {
                onToggleStatus(item);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3f4945] hover:bg-[#f2f4f3] transition-colors"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${item.is_active ? "text-amber-500" : "text-[#006e2a]"}`}
              >
                {item.is_active ? "pause_circle" : "play_circle"}
              </span>
              {item.is_active ? "Nonaktifkan" : "Aktifkan"}
            </button>
          )}
          {onDelete && (
            <>
              <div className="h-px bg-[#bfc9c4]/20 my-1" />
              <button
                onClick={() => {
                  onDelete(item);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  delete
                </span>
                Hapus
              </button>
            </>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="text-[#3f4945] hover:text-[#006e2a] p-1.5 rounded-lg hover:bg-[#006e2a]/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">
          more_horiz
        </span>
      </button>
      {menu}
    </div>
  );
}

/* ─── ModalHapus ──────────────────────────────────────────────────────────────── */
function ModalHapus({ item, onClose, onConfirm, isPending }) {
  if (!item) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-sm border border-[#bfc9c4]/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-[#ba1a1a]">
              delete_forever
            </span>
          </div>
          <div>
            <h3
              className="font-bold text-[#00342b] text-base mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              Hapus Program?
            </h3>
            <p className="text-sm text-[#707975]">
              <span className="font-semibold text-[#00342b]">{item.nama}</span>{" "}
              akan dihapus. Kelas yang terhubung tidak akan ikut terhapus.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-sm font-semibold text-[#3f4945] hover:bg-[#f2f4f3] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── SkeletonRows ────────────────────────────────────────────────────────────── */
function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i} className="border-b border-[#bfc9c4]/10 animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eceeed]" />
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-[#eceeed]" />
            <div className="h-3 w-24 rounded bg-[#eceeed]" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-5 w-10 rounded bg-[#eceeed] mx-auto" />
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-4 w-6 rounded bg-[#eceeed] mx-auto" />
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-4 w-8 rounded bg-[#eceeed] mx-auto" />
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-6 w-16 rounded-full bg-[#eceeed] mx-auto" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-6 rounded bg-[#eceeed] ml-auto" />
      </td>
    </tr>
  ));
}

/* ─── StatCard — matches template exactly ────────────────────────────────────── */
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

/* ─── StatusBadge ─────────────────────────────────────────────────────────────── */
function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-[#006e2a]/5 text-[#006e2a] border border-[#006e2a]/10 uppercase tracking-wider">
      Aktif
    </span>
  ) : (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-[#e6e9e8] text-[#3f4945] border border-[#bfc9c4]/30 uppercase tracking-wider">
      Tidak Aktif
    </span>
  );
}

/* ─── TreeNode — 3 depth levels, pixel-perfect to template ───────────────────── */
function TreeNode({
  node,
  depth,
  canManage,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddChild,
  expandedSet,
  onToggleExpand,
}) {
  const children = node.descendantsTree ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedSet.has(node.ulid);
  const { jenis, nama, kode, kelas_count, siswa_count, is_active } = node;
  const icon = JENIS_ICON[jenis] ?? "circle";

  const childRows = isExpanded
    ? children.map((child) => (
        <TreeNode
          key={child.ulid}
          node={child}
          depth={depth + 1}
          canManage={canManage}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          onAddChild={onAddChild}
          expandedSet={expandedSet}
          onToggleExpand={onToggleExpand}
        />
      ))
    : null;

  const aksi = canManage ? (
    <AksiDropdown
      item={node}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleStatus={onToggleStatus}
      onAddChild={onAddChild}
    />
  ) : null;

  /* ── Depth 0: Bidang Keahlian ── */
  if (depth === 0) {
    return (
      <>
        <tr
          className="bg-[#006e2a]/[0.03] border-b border-[#bfc9c4]/10 group/row cursor-pointer select-none"
          onClick={() => hasChildren && onToggleExpand(node.ulid)}
        >
          <td className="px-6 py-4">
            <div className="flex items-center gap-4">
              <span
                className={`material-symbols-outlined text-[#006e2a]/40 text-[20px] transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-90" : "rotate-0"} ${!hasChildren ? "invisible" : ""}`}
              >
                chevron_right
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] flex-shrink-0 group-hover/row:bg-[#006e2a]/20 transition-colors duration-200">
                <span className="material-symbols-outlined text-[22px]">
                  {icon}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#00342b] text-lg tracking-tight leading-tight">
                  {nama}
                </span>
                <span className="text-[10px] font-bold text-[#006e2a]/60 uppercase tracking-widest">
                  Bidang Keahlian
                </span>
              </div>
            </div>
          </td>
          <td className="text-center font-bold text-[#00342b] px-6 py-4">
            {kode ?? ""}
          </td>
          {/* Rombel / Siswa / Status — intentionally empty at root, matching template */}
          <td colSpan={3} />
          <td className="pr-6 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">{aksi}</div>
          </td>
        </tr>
        {childRows}
      </>
    );
  }

  /* ── Depth 1: Program Keahlian ── */
  if (depth === 1) {
    return (
      <>
        <tr
          className={`border-b border-[#bfc9c4]/10 bg-white select-none ${hasChildren ? "cursor-pointer" : ""}`}
          onClick={() => hasChildren && onToggleExpand(node.ulid)}
        >
          {/* pl-16 matches template pl-16 */}
          <td className="px-6 py-4 pl-16">
            <div className="flex items-center gap-3 relative">
              <div className="absolute left-[-1.5rem] top-0 bottom-0 w-px bg-[#bfc9c4]/20" />
              <span className="material-symbols-outlined text-[#707975]/40 text-[18px] flex-shrink-0">
                subdirectory_arrow_right
              </span>
              <span className="font-semibold text-[#00342b]">{nama}</span>
              <span className="px-2 py-0.5 rounded bg-[#e6e9e8] text-[9px] font-bold text-[#707975] uppercase tracking-tighter ml-1 flex-shrink-0">
                Program Keahlian
              </span>
            </div>
          </td>
          <td
            className="text-center font-medium text-[#3f4945] px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {kode ?? <span className="text-[#bfc9c4]">—</span>}
          </td>
          <td className="text-center font-medium text-[#3f4945]">
            {kelas_count ?? 0}
          </td>
          <td className="text-center font-medium text-[#3f4945]">
            {siswa_count != null ? (
              siswa_count
            ) : (
              <span className="text-[#bfc9c4]">—</span>
            )}
          </td>
          <td className="text-center">
            <StatusBadge active={is_active} />
          </td>
          <td className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
            {aksi}
          </td>
        </tr>
        {childRows}
      </>
    );
  }

  /* ── Depth 2+: Konsentrasi / Peminatan / dll ── */
  return (
    <>
      <tr className="border-b border-[#bfc9c4]/10 hover:bg-[#006e2a]/[0.02] transition-colors">
        {/* pl-28 matches template pl-28 */}
        <td className="px-6 py-3 pl-28">
          <div className="flex items-center gap-3 relative">
            <div className="absolute left-[-4.5rem] top-0 bottom-0 w-px bg-[#bfc9c4]/20" />
            <div className="absolute left-[-4.5rem] top-1/2 w-6 h-px bg-[#bfc9c4]/20" />
            <span className="text-[#3f4945] font-medium">{nama}</span>
          </div>
        </td>
        <td className="text-center">
          {kode ? (
            <span className="px-2 py-0.5 rounded bg-[#00342b]/5 text-[#00342b] font-black text-[10px] border border-[#00342b]/10">
              {kode}
            </span>
          ) : (
            <span className="text-[#bfc9c4] text-xs">—</span>
          )}
        </td>
        <td className="text-center text-[#3f4945] font-medium">
          {kelas_count ?? 0}
        </td>
        <td className="text-center text-[#3f4945] font-medium">
          {siswa_count != null ? (
            siswa_count
          ) : (
            <span className="text-[#bfc9c4]">—</span>
          )}
        </td>
        <td className="text-center">
          <StatusBadge active={is_active} />
        </td>
        <td className="text-right pr-6">{aksi}</td>
      </tr>
      {childRows}
    </>
  );
}

/* ─── Pagination — matches template exactly ──────────────────────────────────── */
function Paginasi({ page, setPage, totalPages, from, to, total }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    return start + i;
  }).filter((p) => p <= totalPages);

  return (
    <div className="px-6 py-5 border-t border-[#bfc9c4]/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-b-[2rem]">
      <p className="text-sm text-[#3f4945] order-2 sm:order-1">
        Menampilkan <span className="font-semibold text-[#00342b]">{from}</span>{" "}
        sampai <span className="font-semibold text-[#00342b]">{to}</span> dari{" "}
        <span className="font-semibold text-[#00342b]">{total}</span> data
      </p>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="p-1.5 rounded-lg border border-[#bfc9c4]/30 text-[#3f4945] hover:bg-[#e6e9e8] disabled:opacity-40 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            chevron_left
          </span>
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${
              p === page
                ? "bg-[#006e2a] text-white shadow-sm"
                : "border border-[#bfc9c4]/30 text-[#3f4945] hover:border-[#006e2a] hover:text-[#006e2a]"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="p-1.5 rounded-lg border border-[#bfc9c4]/30 text-[#3f4945] hover:border-[#006e2a] hover:text-[#006e2a] disabled:opacity-40 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}

/* ─── EmptyState ──────────────────────────────────────────────────────────────── */
function EmptyState({ onTambah, canManage }) {
  return (
    <tr>
      <td colSpan={6} className="py-20 text-center text-[#707975]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-[#bfc9c4]">
            account_tree
          </span>
          <span className="text-sm font-medium">
            Belum ada data program pendidikan.
          </span>
          {canManage && (
            <button
              onClick={onTambah}
              className="mt-1 px-5 py-2 rounded-full bg-[#006e2a] text-white text-xs font-bold hover:bg-[#00531e] transition-colors"
            >
              + Tambah Program
            </button>
          )}
        </div>
      </td>
    </tr>
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

  /* data */
  const { data: treeData, isLoading } = useProgramTree(
    filterStatus !== "" ? { is_active: filterStatus } : {},
  );
  const treeNodes = treeData?.data ?? [];

  useEffect(() => {
    if (treeNodes.length > 0 && expandedSet.size === 0) {
      setExpandedSet(new Set(treeNodes.map((n) => n.ulid)));
    }
  }, [treeNodes.length]);

  useEffect(() => {
    if (search.trim()) setExpandedSet(collectAllUlids(treeNodes));
  }, [search]);

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

  const allRows = flattenTree(treeNodes);
  const statBidang = allRows.filter(
    (r) => r.jenis === "bidang_keahlian",
  ).length;
  const statProgram = allRows.filter(
    (r) => r.jenis === "program_keahlian" && r.is_active,
  ).length;
  const statKonsen = allRows.filter(
    (r) => r.jenis === "konsentrasi_keahlian",
  ).length;

  const from = totalRoots === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRoots);

  const deleteMut = useDeleteProgram();
  const toggleMut = useToggleProgramStatus();

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
            Kelola program keahlian, konsentrasi keahlian, bidang keahlian, dan
            peminatan sekolah secara terpadu.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard
          icon="category"
          label="Bidang Keahlian"
          value={isLoading ? "—" : statBidang}
          unit="Kategori"
        />
        <StatCard
          icon="school"
          label="Program Aktif"
          value={isLoading ? "—" : statProgram}
          unit="Jurusan"
        />
        <StatCard
          icon="account_tree"
          label="Konsentrasi"
          value={isLoading ? "—" : statKonsen}
          unit="Spesialisasi"
        />
      </div>

      {/* ── Main Content ── */}
      {!programConfig.hasTabs ? (
        <JenjangEmptyState school={school} />
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-[#bfc9c4]/20 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-[#bfc9c4]/20 p-4 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
            {/* Search */}
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]">
                search
              </span>
              <input
                className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-12 pr-4 text-[#191c1c] placeholder:text-[#3f4945]/50 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all font-medium text-sm outline-none"
                placeholder="Cari nama program atau kode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
              {/* Filter Program Keahlian — placeholder, wired to future feature */}
              <div className="relative min-w-[160px] flex-1 lg:flex-none">
                <select
                  className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
                  defaultValue=""
                >
                  <option value="">Program Keahlian</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                  expand_more
                </span>
              </div>

              {/* Filter Status */}
              <div className="relative min-w-[160px] flex-1 lg:flex-none">
                <select
                  className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Status: Semua</option>
                  <option value="1">Aktif</option>
                  <option value="0">Tidak Aktif</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                  expand_more
                </span>
              </div>

              <div className="h-10 w-px bg-[#bfc9c4]/20 hidden lg:block mx-1" />

              {/* Reset */}
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("");
                  setPage(1);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#bfc9c4]/30 text-[#3f4945] hover:bg-[#f2f4f3] hover:text-[#006e2a] transition-all font-bold text-xs uppercase tracking-widest bg-white"
              >
                <span className="material-symbols-outlined text-[18px]">
                  restart_alt
                </span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-8 p-6">
            <div className="bg-white rounded-2xl border border-[#bfc9c4]/20 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f3]/30 border-b border-[#bfc9c4]/10">
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.15em] text-[#3f4945]">
                        Struktur Pendidikan
                      </th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.15em] text-[#3f4945] text-center">
                        Kode
                      </th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.15em] text-[#3f4945] text-center">
                        Rombel
                      </th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.15em] text-[#3f4945] text-center">
                        Siswa
                      </th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.15em] text-[#3f4945] text-center">
                        Status
                      </th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.15em] text-[#3f4945] text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {isLoading ? (
                      <SkeletonRows />
                    ) : pagedRoots.length === 0 ? (
                      <EmptyState
                        onTambah={handleTambah}
                        canManage={canManage}
                      />
                    ) : (
                      pagedRoots.map((node) => (
                        <TreeNode
                          key={node.ulid}
                          node={node}
                          depth={0}
                          canManage={canManage}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleStatus={handleToggleStatus}
                          onAddChild={handleTambahChild}
                          expandedSet={expandedSet}
                          onToggleExpand={handleToggleExpand}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {!isLoading && totalRoots > 0 && (
            <Paginasi
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              from={from}
              to={to}
              total={totalRoots}
            />
          )}
        </div>
      )}
    </>
  );
}
