import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";

/* ─── config maps ─────────────────────────────────────────────────────────────── */
export const JENIS_ICON = {
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

/* ─── TreeNode — 3 depth levels ───────────────────────────────────────────────── */
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

/* ─── Paginasi ────────────────────────────────────────────────────────────────── */
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

/* ─── ProgramTable ────────────────────────────────────────────────────────────── */
export default function ProgramTable({
  isLoading,
  pagedRoots,
  canManage,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddChild,
  expandedSet,
  onToggleExpand,
  onTambah,
  page,
  setPage,
  totalPages,
  from,
  to,
  totalRoots,
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-[#bfc9c4]/20 overflow-hidden shadow-sm">
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
              <EmptyState onTambah={onTambah} canManage={canManage} />
            ) : (
              pagedRoots.map((node) => (
                <TreeNode
                  key={node.ulid}
                  node={node}
                  depth={0}
                  canManage={canManage}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  onAddChild={onAddChild}
                  expandedSet={expandedSet}
                  onToggleExpand={onToggleExpand}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

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
  );
}
