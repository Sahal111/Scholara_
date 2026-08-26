import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useTrashTahunAjaran,
  useRestoreTahunAjaran,
  useForceDeleteTahunAjaran,
} from "../../../../../hooks/api/useTahunAjaran";
import { fmt } from "../utils/tahunAjaranHelpers";

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Ya, Lanjutkan",
  danger = false,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-100" : "bg-amber-100"}`}
        >
          <span
            className={`material-symbols-outlined text-[26px] ${danger ? "text-red-600" : "text-amber-600"}`}
          >
            {danger ? "delete_forever" : "warning"}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-[#00342b] text-center mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#3f4945]/70 text-center mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-xs uppercase tracking-wider hover:bg-[#f2f4f3] transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#006e2a] hover:bg-[#004d40]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Blocked Relations Dialog ──────────────────────────────────────────────────
function BlockedDialog({ relations, onClose }) {
  if (!relations) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-red-600 text-[26px]">
            block
          </span>
        </div>
        <h3 className="text-base font-extrabold text-[#00342b] text-center mb-2">
          Tidak Dapat Dihapus
        </h3>
        <p className="text-sm text-[#3f4945]/70 text-center mb-4 leading-relaxed">
          Tahun ajaran ini masih memiliki relasi data aktif:
        </p>
        <div className="space-y-2 mb-6">
          {Object.entries(relations).map(([key, exists]) =>
            exists ? (
              <div
                key={key}
                className="flex items-center gap-2 text-sm text-red-700"
              >
                <span className="material-symbols-outlined text-[16px]">
                  circle
                </span>
                <span className="capitalize">{key.replace(/_/g, " ")}</span>
              </div>
            ) : null,
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#00342b] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#004d40] transition"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}

// ── Table Row ─────────────────────────────────────────────────────────────────
function TrashRow({ item, index, onRestore, onForceDelete }) {
  const semesters = item.semesters ?? [];

  if (semesters.length === 0) {
    return (
      <tr className="hover:bg-[#006e2a]/5 transition-all duration-300 group">
        <td className="py-8 px-6 text-[#3f4945] font-medium text-sm">
          {index + 1}
        </td>
        <td className="py-8 px-6">
          <div className="font-bold text-[18px] text-[#00342b] leading-tight">
            {item.tahun}
          </div>
        </td>
        <td className="py-8 px-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6e9e8] text-[#3f4945] text-[10px] font-black tracking-widest uppercase border border-[#bfc9c4]/30">
            —
          </span>
        </td>
        <td className="py-8 px-6 text-[#3f4945] text-sm font-medium">
          {fmt(item.deleted_at)}
        </td>
        <td className="py-8 px-6 text-[#3f4945] italic text-sm">-</td>
        <td className="py-8 px-6 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onRestore(item)}
              title="Pulihkan"
              className="text-[#bfc9c4] hover:text-[#006e2a] transition-all p-2 rounded-full hover:bg-[#006e2a]/10"
            >
              <span className="material-symbols-outlined text-[20px]">
                restore
              </span>
            </button>
            <button
              onClick={() => onForceDelete(item)}
              title="Hapus Permanen"
              className="text-[#bfc9c4] hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete_forever
              </span>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return semesters.map((sem, si) => (
    <tr
      key={sem.id ?? si}
      className="hover:bg-[#006e2a]/5 transition-all duration-300 group"
    >
      {si === 0 && (
        <>
          <td
            className="py-8 px-6 text-[#3f4945] font-medium text-sm align-top"
            rowSpan={semesters.length}
          >
            {index + 1}
          </td>
          <td className="py-8 px-6 align-top" rowSpan={semesters.length}>
            <div className="font-bold text-[18px] text-[#00342b] leading-tight">
              {item.tahun}
            </div>
          </td>
        </>
      )}
      <td className="py-8 px-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6e9e8] text-[#3f4945] text-[10px] font-black tracking-widest uppercase border border-[#bfc9c4]/30">
          {sem.nama?.toUpperCase() ?? "-"}
        </span>
      </td>
      <td className="py-8 px-6 text-[#3f4945] text-sm font-medium">
        {fmt(item.deleted_at)}
      </td>
      <td className="py-8 px-6 text-[#3f4945] italic text-sm">-</td>
      {si === 0 && (
        <td
          className="py-8 px-6 text-right align-middle"
          rowSpan={semesters.length}
        >
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onRestore(item)}
              title="Pulihkan"
              className="text-[#bfc9c4] hover:text-[#006e2a] transition-all p-2 rounded-full hover:bg-[#006e2a]/10"
            >
              <span className="material-symbols-outlined text-[20px]">
                restore
              </span>
            </button>
            <button
              onClick={() => onForceDelete(item)}
              title="Hapus Permanen"
              className="text-[#bfc9c4] hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete_forever
              </span>
            </button>
          </div>
        </td>
      )}
    </tr>
  ));
}

// ── Mobile Card ───────────────────────────────────────────────────────────────
function TrashCard({ item, onRestore, onForceDelete }) {
  const semesters = item.semesters ?? [];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="font-bold text-[18px] text-[#00342b] leading-tight">
            {item.tahun}
          </div>
          <div className="text-xs text-[#3f4945]/60 mt-0.5">
            {fmt(item.deleted_at)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onRestore(item)}
            title="Pulihkan"
            className="text-[#3f4945]/40 hover:text-[#006e2a] transition-all p-2 rounded-full hover:bg-[#006e2a]/10"
          >
            <span className="material-symbols-outlined text-[20px]">
              restore
            </span>
          </button>
          <button
            onClick={() => onForceDelete(item)}
            title="Hapus Permanen"
            className="text-[#3f4945]/40 hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              delete_forever
            </span>
          </button>
        </div>
      </div>
      {semesters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {semesters.map((sem, si) => (
            <span
              key={sem.id ?? si}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6e9e8] text-[#3f4945] text-[10px] font-black tracking-widest uppercase border border-[#bfc9c4]/30"
            >
              {sem.nama?.toUpperCase() ?? "-"}
            </span>
          ))}
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6e9e8] text-[#3f4945] text-[10px] font-black tracking-widest uppercase border border-[#bfc9c4]/30">
          —
        </span>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecycleBinTahunAjaran() {
  const { data: trashData, isLoading, isError } = useTrashTahunAjaran();
  const restoreMut = useRestoreTahunAjaran();
  const forceDeleteMut = useForceDeleteTahunAjaran();

  const [search, setSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmForceDelete, setConfirmForceDelete] = useState(null);
  const [forceDeleteRelations, setForceDeleteRelations] = useState(null);

  const rawItems = trashData ?? [];

  const items = useMemo(() => {
    return rawItems.filter((item) => {
      const matchSearch =
        search === "" ||
        item.tahun?.toLowerCase().includes(search.toLowerCase());
      const matchSemester =
        filterSemester === "" ||
        (item.semesters ?? []).some(
          (s) => s.nama?.toLowerCase() === filterSemester.toLowerCase(),
        );
      return matchSearch && matchSemester;
    });
  }, [rawItems, search, filterSemester]);

  const handleReset = () => {
    setSearch("");
    setFilterSemester("");
  };

  const handleRestoreConfirm = () => {
    if (!confirmRestore) return;
    restoreMut.mutate(confirmRestore.id, {
      onSuccess: () => {
        toast.success(
          `Tahun ajaran ${confirmRestore.tahun} berhasil dipulihkan.`,
        );
        setConfirmRestore(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message ?? "Gagal memulihkan.");
        setConfirmRestore(null);
      },
    });
  };

  const handleForceDeleteConfirm = () => {
    if (!confirmForceDelete) return;
    forceDeleteMut.mutate(confirmForceDelete.id, {
      onSuccess: () => {
        toast.success(
          `Tahun ajaran ${confirmForceDelete.tahun} dihapus permanen.`,
        );
        setConfirmForceDelete(null);
        setForceDeleteRelations(null);
      },
      onError: (err) => {
        const relations = err.response?.data?.relations;
        if (relations) {
          setForceDeleteRelations(relations);
        } else {
          toast.error(
            err.response?.data?.message ?? "Gagal menghapus permanen.",
          );
          setConfirmForceDelete(null);
        }
      },
    });
  };

  // ── Total row count (including semester expansions) ──
  const totalRows = items.reduce((acc, item) => {
    const sems = item.semesters?.length ?? 0;
    return acc + (sems > 0 ? sems : 1);
  }, 0);

  return (
    <div className="min-h-screen bg-[#f8faf9] relative overflow-x-hidden">
      {/* Atmospheric blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[#006e2a] opacity-[0.04] blur-[100px] top-[-150px] left-[-150px]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ffdeac] opacity-[0.05] blur-[100px] bottom-[-80px] right-[-80px]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20">
        {/* ── Header Section ── */}
        <section className="pt-6 pb-4 flex flex-col gap-4 mb-4">
          {/* Top row: back + breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              to="/operator/master/tahun-ajaran"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md hover:bg-[#e6e9e8] text-[#00342b] rounded-2xl transition-all border border-[#bfc9c4]/30 shadow-sm group w-fit"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-sm font-bold tracking-wide">Kembali</span>
            </Link>

            <nav className="flex items-center gap-2 bg-[#f2f4f3]/80 px-4 py-2 rounded-2xl border border-[#bfc9c4]/20 w-fit flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#707975] uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">
                  database
                </span>
                Master Data
              </span>
              <span className="material-symbols-outlined text-[#bfc9c4] text-sm">
                chevron_right
              </span>
              <span className="text-xs font-bold text-[#707975] uppercase tracking-wider">
                Tahun Ajaran &amp; Semester
              </span>
              <span className="material-symbols-outlined text-[#bfc9c4] text-sm">
                chevron_right
              </span>
              <span className="text-xs font-black text-[#00342b] bg-[#006e2a]/10 px-3 py-1 rounded-lg uppercase tracking-widest">
                Tempat Sampah
              </span>
            </nav>
          </div>

          {/* Hero title */}
          <div className="mt-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-red-500 tracking-[0.2em] uppercase font-black">
                  RECYCLE BIN
                </span>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-red-200 to-transparent" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#00342b] leading-tight tracking-tight mb-2">
              Tempat{" "}
              <span className="italic font-serif text-[#006e2a]">Sampah</span>
            </h1>
            <p className="text-base text-[#3f4945]/80 max-w-2xl leading-relaxed">
              Pulihkan atau hapus permanen data Tahun Ajaran yang telah dihapus.
            </p>
          </div>
        </section>

        {/* ── Search & Filter Bar ── */}
        <div className="bg-[#f8faf9] border border-[#bfc9c4]/20 rounded-t-3xl p-5 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-md group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari Tahun Ajaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f2f4f3]/60 border border-[#bfc9c4]/20 rounded-xl py-3.5 pl-12 pr-4 text-[#191c1c] placeholder:text-[#3f4945]/50 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all font-medium text-sm outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Semester filter */}
            <div className="relative min-w-[160px] flex-1 sm:flex-none">
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full bg-[#f2f4f3]/60 border border-[#bfc9c4]/20 rounded-xl py-3.5 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
              >
                <option value="">Status: Semua</option>
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                expand_more
              </span>
            </div>

            <div className="h-10 w-px bg-[#bfc9c4]/20 hidden lg:block mx-1" />

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-[#bfc9c4]/20 text-[#3f4945] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all font-bold text-xs uppercase tracking-widest bg-white/50"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* ── Content Area ── */}
        <section className="flex flex-col gap-4">
          {/* Section label */}
          <div className="flex items-center gap-2 mt-2 px-1">
            <div className="w-2 h-2 rounded-full bg-[#3ce36a] animate-pulse" />
            <span className="text-xs font-black text-[#707975] tracking-widest uppercase">
              Riwayat Penghapusan
            </span>
          </div>

          {/* Main container */}
          <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[2rem] shadow-lg overflow-hidden">
            {/* ── Loading ── */}
            {isLoading && (
              <div className="p-8 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-[#f2f4f3] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* ── Error ── */}
            {!isLoading && isError && (
              <div className="text-center py-20 px-6">
                <span className="material-symbols-outlined text-red-400 text-5xl mb-4 block">
                  error
                </span>
                <p className="text-sm font-bold text-red-500">
                  Gagal memuat data recycle bin.
                </p>
                <p className="text-xs text-[#3f4945]/50 mt-1">
                  Coba refresh halaman.
                </p>
              </div>
            )}

            {/* ── Empty ── */}
            {!isLoading && !isError && rawItems.length === 0 && (
              <div className="text-center py-24 px-6">
                <div className="w-20 h-20 rounded-full bg-[#f2f4f3] border border-[#bfc9c4]/30 flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-[#bfc9c4] text-4xl">
                    delete_sweep
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#3f4945] mb-1">
                  Recycle Bin Kosong
                </h3>
                <p className="text-sm text-[#3f4945]/50">
                  Tidak ada tahun ajaran yang dihapus.
                </p>
              </div>
            )}

            {/* ── No results (filter) ── */}
            {!isLoading &&
              !isError &&
              rawItems.length > 0 &&
              items.length === 0 && (
                <div className="text-center py-20 px-6">
                  <span className="material-symbols-outlined text-[#bfc9c4] text-5xl mb-4 block">
                    search_off
                  </span>
                  <p className="text-sm font-bold text-[#3f4945]">
                    Tidak ditemukan data yang cocok.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-3 text-xs text-[#006e2a] font-bold underline hover:no-underline"
                  >
                    Reset filter
                  </button>
                </div>
              )}

            {/* ── TABLE (md+) ── */}
            {!isLoading && !isError && items.length > 0 && (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#bfc9c4]/20 bg-[#f2f4f3]/30">
                        <th className="py-5 px-6 text-[13px] text-[#00342b] uppercase tracking-widest font-bold w-16">
                          No
                        </th>
                        <th className="py-5 px-6 text-[13px] text-[#00342b] uppercase tracking-widest font-bold">
                          Tahun Ajaran
                        </th>
                        <th className="py-5 px-6 text-[13px] text-[#00342b] uppercase tracking-widest font-bold">
                          Semester
                        </th>
                        <th className="py-5 px-6 text-[13px] text-[#00342b] uppercase tracking-widest font-bold">
                          Tanggal Dihapus
                        </th>
                        <th className="py-5 px-6 text-[13px] text-[#00342b] uppercase tracking-widest font-bold">
                          Alasan
                        </th>
                        <th className="py-5 px-6 text-[13px] text-[#00342b] uppercase tracking-widest font-bold text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#bfc9c4]/10">
                      {items.map((item, idx) => (
                        <TrashRow
                          key={item.id}
                          item={item}
                          index={idx}
                          onRestore={setConfirmRestore}
                          onForceDelete={setConfirmForceDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── CARDS (mobile) ── */}
                <div className="md:hidden p-4 space-y-3">
                  {items.map((item) => (
                    <TrashCard
                      key={item.id}
                      item={item}
                      onRestore={setConfirmRestore}
                      onForceDelete={setConfirmForceDelete}
                    />
                  ))}
                </div>

                {/* ── Pagination footer ── */}
                <div className="border-t border-[#bfc9c4]/10 px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[#3f4945]">
                  <span className="font-medium opacity-70 text-center sm:text-left">
                    Menampilkan {totalRows} baris dari {items.length} data
                    terhapus
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled
                      className="p-2 rounded-xl border border-[#bfc9c4]/30 text-[#3f4945] opacity-40 cursor-not-allowed bg-white/50"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                    </button>
                    <button className="w-8 h-8 rounded-xl bg-[#00342b] text-white font-bold flex items-center justify-center shadow-sm text-sm">
                      1
                    </button>
                    <button className="p-2 rounded-xl border border-[#bfc9c4]/30 text-[#191c1c] hover:bg-[#e6e9e8] transition-colors bg-white/50">
                      <span className="material-symbols-outlined text-sm">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={!!confirmRestore}
        title="Pulihkan Tahun Ajaran?"
        message={`Tahun ajaran "${confirmRestore?.tahun}" beserta semua semesternya akan dipulihkan ke daftar aktif.`}
        confirmLabel="Ya, Pulihkan"
        onConfirm={handleRestoreConfirm}
        onCancel={() => setConfirmRestore(null)}
      />

      <ConfirmDialog
        open={!!confirmForceDelete && !forceDeleteRelations}
        title="Hapus Permanen?"
        message={`Tindakan ini tidak dapat dibatalkan. Tahun ajaran "${confirmForceDelete?.tahun}" dan semua semesternya akan dihapus selamanya dari sistem.`}
        confirmLabel="Hapus Permanen"
        danger
        onConfirm={handleForceDeleteConfirm}
        onCancel={() => setConfirmForceDelete(null)}
      />

      <BlockedDialog
        relations={forceDeleteRelations}
        onClose={() => {
          setConfirmForceDelete(null);
          setForceDeleteRelations(null);
        }}
      />
    </div>
  );
}
