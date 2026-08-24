import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../../../../lib/axios";
import { tahunAjaranKeys } from "../../../../../hooks/api/useTahunAjaran";
import {
  fmt,
  getStatusTahunAjaran,
  getTglMulai,
  getTglSelesai,
} from "../utils/tahunAjaranHelpers";

// ── Query & Mutations ─────────────────────────────────────────────────────────

function useArsipList() {
  return useQuery({
    queryKey: [...tahunAjaranKeys.all, "arsip"],
    queryFn: () =>
      api.get("/operator/master-data/tahun-ajaran/arsip").then((r) => r.data),
    // Jika endpoint belum ada, fallback ke list aktif filter is_archived=true
    retry: false,
  });
}

function useUnarshipTahunAjaran(queryClient) {
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/operator/master-data/tahun-ajaran/${id}/unarsip`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...tahunAjaranKeys.all, "arsip"],
      });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
    },
  });
}

function useArsipkanTahunAjaran(queryClient) {
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/operator/master-data/tahun-ajaran/${id}/arsip`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...tahunAjaranKeys.all, "arsip"],
      });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
    },
  });
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Ya, Lanjutkan",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-amber-600 text-[26px]">
            inventory_2
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
            className="flex-1 py-2.5 rounded-xl bg-[#006e2a] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#004d40] transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Arsip Item ────────────────────────────────────────────────────────────────
function ArsipItem({ item, onUnarsip }) {
  const tglMulai = getTglMulai(item);
  const tglSelesai = getTglSelesai(item);
  const semesterCount = item.semesters?.length ?? 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#bfc9c4]/30 hover:border-amber-200 hover:shadow-sm transition-all">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-amber-500 text-[20px]">
          inventory_2
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-[#00342b]">{item.tahun}</h4>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wide border border-amber-100">
            Arsip
          </span>
          {semesterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#3f4945] text-[10px] font-bold">
              {semesterCount} semester
            </span>
          )}
        </div>
        <p className="text-xs text-[#3f4945]/60 mt-0.5">
          {fmt(tglMulai)} – {fmt(tglSelesai)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={`/operator/master/tahun-ajaran/${item.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f2f4f3] text-[#3f4945] text-xs font-bold hover:bg-[#e6e9e8] transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">
            visibility
          </span>
          <span className="hidden sm:inline">Lihat</span>
        </Link>
        <button
          onClick={() => onUnarsip(item)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#006e2a]/10 text-[#006e2a] text-xs font-bold hover:bg-[#006e2a]/20 transition-colors"
          title="Keluarkan dari Arsip"
        >
          <span className="material-symbols-outlined text-[15px]">
            unarchive
          </span>
          <span className="hidden sm:inline">Unarsip</span>
        </button>
      </div>
    </div>
  );
}

// ── Backend Not Ready Fallback ────────────────────────────────────────────────
function BackendPendingNotice() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
      <span className="material-symbols-outlined text-amber-400 text-4xl mb-3 block">
        engineering
      </span>
      <h3 className="text-sm font-bold text-amber-800 mb-2">
        Endpoint Arsip Belum Tersedia
      </h3>
      <p className="text-xs text-amber-700/80 leading-relaxed max-w-sm mx-auto">
        Fitur arsip membutuhkan field{" "}
        <code className="bg-amber-100 px-1 rounded">is_archived</code> pada
        tabel <code className="bg-amber-100 px-1 rounded">tahun_ajarans</code>{" "}
        dan endpoint{" "}
        <code className="bg-amber-100 px-1 rounded">
          PATCH /tahun-ajaran/:id/arsip
        </code>
        . Hubungi developer backend untuk mengaktifkan fitur ini.
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ArsipTahunAjaran() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useArsipList();
  const unarsipMut = useUnarshipTahunAjaran(queryClient);

  const [confirmUnarsip, setConfirmUnarsip] = useState(null);

  const is404 =
    error?.response?.status === 404 || error?.response?.status === 405;
  const items = data?.data ?? [];

  const handleUnarsipConfirm = () => {
    if (!confirmUnarsip) return;
    unarsipMut.mutate(confirmUnarsip.id, {
      onSuccess: () => {
        toast.success(
          `Tahun ajaran "${confirmUnarsip.tahun}" dikeluarkan dari arsip.`,
        );
        setConfirmUnarsip(null);
      },
      onError: (err) => {
        toast.error(
          err.response?.data?.message ?? "Gagal mengeluarkan dari arsip.",
        );
        setConfirmUnarsip(null);
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
              Arsip Tahun Ajaran
            </h1>
            <p className="text-xs text-[#3f4945]/60 mt-0.5">
              Data historis tahun ajaran yang telah selesai
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-[#006e2a]/5 border border-[#006e2a]/20 rounded-2xl">
          <span className="material-symbols-outlined text-[#006e2a] text-[20px] shrink-0 mt-0.5">
            info
          </span>
          <div className="text-xs text-[#00342b]/80 leading-relaxed">
            <strong>Arsip</strong> menyimpan data tahun ajaran yang telah
            selesai secara historis. Data dapat dilihat selengkapnya dan
            dikeluarkan dari arsip (unarsip) jika dibutuhkan kembali.
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
        ) : is404 ? (
          <BackendPendingNotice />
        ) : isError ? (
          <div className="text-center py-16 text-red-500">
            <span className="material-symbols-outlined text-5xl mb-3 block">
              error
            </span>
            <p className="text-sm font-medium">Gagal memuat data arsip.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#f2f4f3] border border-[#bfc9c4]/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[#bfc9c4] text-3xl">
                inventory_2
              </span>
            </div>
            <h3 className="text-base font-bold text-[#3f4945] mb-1">
              Arsip Kosong
            </h3>
            <p className="text-sm text-[#3f4945]/50">
              Belum ada tahun ajaran yang diarsipkan. Tahun ajaran yang sudah
              selesai dapat diarsipkan dari daftar utama.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#3f4945]/60 font-medium">
              {items.length} tahun ajaran dalam arsip
            </p>
            {items.map((item) => (
              <ArsipItem
                key={item.id}
                item={item}
                onUnarsip={(i) => setConfirmUnarsip(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm Unarsip */}
      <ConfirmDialog
        open={!!confirmUnarsip}
        title="Keluarkan dari Arsip?"
        message={`Tahun ajaran "${confirmUnarsip?.tahun}" akan dipindahkan kembali ke daftar aktif.`}
        confirmLabel="Ya, Unarsip"
        onConfirm={handleUnarsipConfirm}
        onCancel={() => setConfirmUnarsip(null)}
      />
    </div>
  );
}
