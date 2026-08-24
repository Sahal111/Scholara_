import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
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
            className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#006e2a] hover:bg-[#004d40]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row Item ──────────────────────────────────────────────────────────────────
function TrashItem({ item, onRestore, onForceDelete }) {
  const deletedAt = item.deleted_at ? fmt(item.deleted_at) : "-";
  const semesterCount = item.semesters?.length ?? 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#bfc9c4]/30 hover:border-[#006e2a]/20 hover:shadow-sm transition-all">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-red-400 text-[20px]">
          delete
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-[#00342b]">{item.tahun}</h4>
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide border border-red-100">
            Dihapus
          </span>
          {semesterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#3f4945] text-[10px] font-bold">
              {semesterCount} semester
            </span>
          )}
        </div>
        <p className="text-xs text-[#3f4945]/60 mt-0.5">
          Dihapus pada {deletedAt}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onRestore(item)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#006e2a]/10 text-[#006e2a] text-xs font-bold hover:bg-[#006e2a]/20 transition-colors"
          title="Pulihkan"
        >
          <span className="material-symbols-outlined text-[15px]">restore</span>
          <span className="hidden sm:inline">Pulihkan</span>
        </button>
        <button
          onClick={() => onForceDelete(item)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
          title="Hapus Permanen"
        >
          <span className="material-symbols-outlined text-[15px]">
            delete_forever
          </span>
          <span className="hidden sm:inline">Hapus Permanen</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecycleBinTahunAjaran() {
  const queryClient = useQueryClient();
  const { data: trashData, isLoading, isError } = useTahunAjaranTrash();
  const restoreMut = useRestoreTahunAjaran(queryClient);
  const forceDeleteMut = useForceDeleteTahunAjaran(queryClient);

  const [confirmRestore, setConfirmRestore] = useState(null); // item
  const [confirmForceDelete, setConfirmForceDelete] = useState(null); // item
  const [forceDeleteRelations, setForceDeleteRelations] = useState(null);

  const items = trashData?.data ?? [];

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

  return (
    <div className="min-h-screen bg-[#f2f4f3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/operator/master/tahun-ajaran"
            className="w-9 h-9 rounded-xl bg-white border border-[#bfc9c4]/40 flex items-center justify-center text-[#3f4945] hover:bg-[#e6e9e8] transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#00342b] font-headline-card leading-tight">
              Recycle Bin
            </h1>
            <p className="text-xs text-[#3f4945]/60 mt-0.5">
              Tahun ajaran yang dihapus — dapat dipulihkan
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/60 rounded-2xl">
          <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">
            info
          </span>
          <div className="text-xs text-amber-800 leading-relaxed">
            <strong>Recycle Bin</strong> menyimpan data yang dihapus sementara.
            Data dapat dipulihkan kapan saja. Hapus permanen bersifat{" "}
            <strong>tidak dapat dibatalkan</strong> dan akan memeriksa relasi
            data terlebih dahulu.
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-white rounded-2xl border border-[#bfc9c4]/30 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-red-500">
            <span className="material-symbols-outlined text-5xl mb-3 block">
              error
            </span>
            <p className="text-sm font-medium">
              Gagal memuat data recycle bin.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#f2f4f3] border border-[#bfc9c4]/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[#bfc9c4] text-3xl">
                delete_sweep
              </span>
            </div>
            <h3 className="text-base font-bold text-[#3f4945] mb-1">
              Recycle Bin Kosong
            </h3>
            <p className="text-sm text-[#3f4945]/50">
              Tidak ada tahun ajaran yang dihapus.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#3f4945]/60 font-medium">
              {items.length} item dalam recycle bin
            </p>
            {items.map((item) => (
              <TrashItem
                key={item.id}
                item={item}
                onRestore={(i) => setConfirmRestore(i)}
                onForceDelete={(i) => setConfirmForceDelete(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm Restore */}
      <ConfirmDialog
        open={!!confirmRestore}
        title="Pulihkan Tahun Ajaran?"
        message={`Tahun ajaran "${confirmRestore?.tahun}" beserta semua semesternya akan dipulihkan ke daftar aktif.`}
        confirmLabel="Ya, Pulihkan"
        onConfirm={handleRestoreConfirm}
        onCancel={() => setConfirmRestore(null)}
      />

      {/* Confirm Force Delete */}
      <ConfirmDialog
        open={!!confirmForceDelete && !forceDeleteRelations}
        title="Hapus Permanen?"
        message={`Tindakan ini tidak dapat dibatalkan. Tahun ajaran "${confirmForceDelete?.tahun}" dan semua semesternya akan dihapus selamanya dari sistem.`}
        confirmLabel="Hapus Permanen"
        danger
        onConfirm={handleForceDeleteConfirm}
        onCancel={() => setConfirmForceDelete(null)}
      />

      {/* Blocked Force Delete (ada relasi) */}
      {forceDeleteRelations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
              {Object.entries(forceDeleteRelations).map(([key, exists]) =>
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
              onClick={() => {
                setConfirmForceDelete(null);
                setForceDeleteRelations(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#00342b] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#004d40] transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
