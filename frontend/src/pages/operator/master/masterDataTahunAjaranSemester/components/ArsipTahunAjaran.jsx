import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../../../../lib/axios";
import { tahunAjaranKeys } from "../../../../../hooks/api/useTahunAjaran";
import {
  fmt,
  fmtShortMonthYear,
  getTglMulai,
  getTglSelesai,
} from "../utils/tahunAjaranHelpers";

// ── Query & Mutations ─────────────────────────────────────────────────────────

function useArsipList() {
  return useQuery({
    queryKey: [...tahunAjaranKeys.all, "arsip"],
    queryFn: () =>
      api.get("/operator/master-data/tahun-ajaran/arsip").then((r) => r.data),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSemesterLabel(item) {
  const semesters = item.semesters ?? [];
  if (semesters.length === 0) return "—";
  if (semesters.length === 1) return semesters[0].nama;
  return "Tahun Penuh";
}

function getKurikulum(item) {
  // Field kurikulum pada model — fallback ke "-" jika tidak ada
  return item.kurikulum ?? item.semesters?.[0]?.kurikulum ?? "—";
}

function getTotalSiswa(item) {
  if (item.total_siswa != null) return `${item.total_siswa} Siswa`;
  return "—";
}

function getPeriodeLabel(item) {
  const mulai = getTglMulai(item);
  const selesai = getTglSelesai(item);
  if (!mulai && !selesai) return "—";
  return `${fmtShortMonthYear(mulai)} – ${fmtShortMonthYear(selesai)}`;
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
      <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-xl bg-[#5cfd80]/20 border border-[#006e2a]/20 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[#006e2a] text-[26px]">
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
            className="flex-1 py-2.5 rounded-xl bg-[#006e2a] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#00342b] transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="py-8 px-4">
          <div
            className="h-4 bg-[#eceeed] rounded-full animate-pulse"
            style={{ width: i === 6 ? "60px" : "80%" }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ isPermanent }) {
  if (isPermanent) {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6e9e8] text-[#3f4945] font-bold text-[10px] tracking-widest border border-[#bfc9c4]/40 uppercase">
        <span
          className="material-symbols-outlined text-[14px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          archive
        </span>
        PERMANEN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6e9e8] text-[#3f4945] font-bold text-[10px] tracking-widest border border-[#bfc9c4]/40 uppercase">
      <span
        className="material-symbols-outlined text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        inventory_2
      </span>
      DIARSIPKAN
    </span>
  );
}

// ── Table Row ─────────────────────────────────────────────────────────────────

function ArsipRow({ item, onUnarsip }) {
  const isPermanent = item.is_permanent_archive ?? false;

  return (
    <tr className="hover:bg-[#006e2a]/5 transition-all duration-300 group">
      {/* Tahun Ajaran */}
      <td className="py-8 px-4">
        <div className="font-bold text-[18px] text-[#00342b] leading-tight">
          {item.tahun}
        </div>
      </td>

      {/* Semester */}
      <td className="py-8 px-4">
        <div className="text-sm text-[#191c1c] font-medium">
          {getSemesterLabel(item)}
        </div>
      </td>

      {/* Periode */}
      <td className="py-8 px-4">
        <div className="text-sm text-[#3f4945]/70">{getPeriodeLabel(item)}</div>
      </td>

      {/* Kurikulum */}
      <td className="py-8 px-4">
        <div className="text-sm text-[#191c1c] font-semibold">
          {getKurikulum(item)}
        </div>
      </td>

      {/* Total Siswa */}
      <td className="py-8 px-4">
        <div className="text-sm text-[#191c1c]">{getTotalSiswa(item)}</div>
      </td>

      {/* Status */}
      <td className="py-8 px-4">
        <StatusBadge isPermanent={isPermanent} />
      </td>

      {/* Aksi */}
      <td className="py-8 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/operator/master/tahun-ajaran/${item.id}`}
            className="text-[#707975]/40 hover:text-[#00342b] transition-all p-2 rounded-full hover:bg-[#eceeed]"
            title="Lihat Detail"
          >
            <span className="material-symbols-outlined text-[20px]">
              visibility
            </span>
          </Link>

          {isPermanent ? (
            <button
              disabled
              className="text-[#707975]/20 cursor-not-allowed p-2 rounded-full"
              title="Arsip permanen tidak dapat dipulihkan"
            >
              <span className="material-symbols-outlined text-[20px]">
                lock
              </span>
            </button>
          ) : (
            <button
              onClick={() => onUnarsip(item)}
              className="text-[#707975]/40 hover:text-[#006e2a] transition-all p-2 rounded-full hover:bg-[#006e2a]/10"
              title="Keluarkan dari Arsip"
            >
              <span className="material-symbols-outlined text-[20px]">
                restore
              </span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Mobile Card (responsive < lg) ────────────────────────────────────────────

function ArsipCard({ item, onUnarsip }) {
  const isPermanent = item.is_permanent_archive ?? false;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-bold text-[18px] text-[#00342b] leading-tight">
            {item.tahun}
          </div>
          <div className="text-xs text-[#3f4945]/60 mt-0.5">
            {getSemesterLabel(item)} · {getPeriodeLabel(item)}
          </div>
        </div>
        <StatusBadge isPermanent={isPermanent} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div>
          <span className="text-[#707975] uppercase tracking-wider font-bold text-[10px]">
            Kurikulum
          </span>
          <div className="text-[#191c1c] font-semibold mt-0.5">
            {getKurikulum(item)}
          </div>
        </div>
        <div>
          <span className="text-[#707975] uppercase tracking-wider font-bold text-[10px]">
            Total Siswa
          </span>
          <div className="text-[#191c1c] mt-0.5">{getTotalSiswa(item)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[#eceeed] pt-3">
        <Link
          to={`/operator/master/tahun-ajaran/${item.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#f2f4f3] text-[#3f4945] text-xs font-bold hover:bg-[#e6e9e8] transition"
        >
          <span className="material-symbols-outlined text-[15px]">
            visibility
          </span>
          Lihat Detail
        </Link>

        {isPermanent ? (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#f2f4f3] text-[#707975]/40 text-xs font-bold cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[15px]">lock</span>
            Terkunci
          </button>
        ) : (
          <button
            onClick={() => onUnarsip(item)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#006e2a]/10 text-[#006e2a] text-xs font-bold hover:bg-[#006e2a]/20 transition"
          >
            <span className="material-symbols-outlined text-[15px]">
              restore
            </span>
            Pulihkan
          </button>
        )}
      </div>
    </div>
  );
}

// ── Backend Not Ready Notice ──────────────────────────────────────────────────

function BackendPendingNotice() {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[2.5rem] shadow-lg p-12 text-center">
      <span className="material-symbols-outlined text-[56px] text-[#bfc9c4] mb-4 block">
        engineering
      </span>
      <h3 className="text-base font-extrabold text-[#00342b] mb-2">
        Endpoint Arsip Belum Tersedia
      </h3>
      <p className="text-sm text-[#3f4945]/70 leading-relaxed max-w-sm mx-auto">
        Fitur arsip membutuhkan field{" "}
        <code className="bg-[#f2f4f3] px-1.5 py-0.5 rounded font-mono text-xs">
          is_archived
        </code>{" "}
        pada tabel{" "}
        <code className="bg-[#f2f4f3] px-1.5 py-0.5 rounded font-mono text-xs">
          tahun_ajarans
        </code>{" "}
        dan endpoint{" "}
        <code className="bg-[#f2f4f3] px-1.5 py-0.5 rounded font-mono text-xs">
          PATCH /tahun-ajaran/:id/arsip
        </code>
        .
      </p>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-md border border-white/40 rounded-[2.5rem] shadow-lg text-center">
      <span
        className="material-symbols-outlined text-[100px] text-[#bfc9c4] mb-6"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        inventory_2
      </span>
      <h3 className="text-xl font-bold text-[#00342b] mb-2">Belum Ada Arsip</h3>
      <p className="text-sm text-[#3f4945]/70 max-w-md mx-auto leading-relaxed">
        Saat ini tidak ada tahun ajaran atau semester yang diarsipkan. Data
        akademik yang dinonaktifkan akan muncul di halaman ini.
      </p>
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────────

function ErrorState() {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[2.5rem] shadow-lg p-12 text-center">
      <span className="material-symbols-outlined text-[56px] text-red-400 mb-4 block">
        error
      </span>
      <h3 className="text-base font-bold text-red-700 mb-1">
        Gagal Memuat Data
      </h3>
      <p className="text-sm text-[#3f4945]/70">
        Terjadi kesalahan saat mengambil data arsip. Coba muat ulang halaman.
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ArsipTahunAjaran() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useArsipList();
  const unarsipMut = useUnarshipTahunAjaran(queryClient);

  const [confirmUnarsip, setConfirmUnarsip] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterKurikulum, setFilterKurikulum] = useState("semua");

  const is404 =
    error?.response?.status === 404 || error?.response?.status === 405;
  const rawItems = data?.data ?? [];

  // ── Client-side filter ────────────────────────────────────────────────────
  const items = useMemo(() => {
    return rawItems.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.tahun?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        filterStatus === "semua" ||
        (filterStatus === "permanen" && item.is_permanent_archive) ||
        (filterStatus === "sementara" && !item.is_permanent_archive);

      const matchKurikulum =
        filterKurikulum === "semua" ||
        getKurikulum(item).toLowerCase() === filterKurikulum.toLowerCase();

      return matchSearch && matchStatus && matchKurikulum;
    });
  }, [rawItems, search, filterStatus, filterKurikulum]);

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

  const handleReset = () => {
    setSearch("");
    setFilterStatus("semua");
    setFilterKurikulum("semua");
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] relative overflow-x-hidden">
      {/* Atmospheric blobs */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: "#006e2a",
          opacity: 0.05,
          filter: "blur(100px)",
          borderRadius: "50%",
          top: 0,
          left: "10%",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: "#ffdeac",
          opacity: 0.05,
          filter: "blur(100px)",
          borderRadius: "50%",
          top: "40%",
          right: "5%",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* ── 1. Header ── */}
        <section className="flex flex-col gap-2">
          {/* Breadcrumb row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <Link
              to="/operator/master/tahun-ajaran"
              className="flex items-center gap-2 px-4 py-2 bg-[#f2f4f3] hover:bg-[#e6e9e8] text-[#00342b] rounded-full transition-all border border-[#bfc9c4]/20 group shrink-0"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-sm font-semibold">Kembali</span>
            </Link>

            <nav className="flex items-center gap-1.5 px-4 py-2 bg-[#f2f4f3]/50 rounded-full border border-[#bfc9c4]/10 sm:ml-auto flex-wrap">
              <span className="text-xs font-medium text-[#707975]">
                Master Data
              </span>
              <span className="material-symbols-outlined text-xs text-[#707975]/50">
                chevron_right
              </span>
              <span className="text-xs font-medium text-[#707975]">
                Tahun Ajaran &amp; Semester
              </span>
              <span className="material-symbols-outlined text-xs text-[#707975]/50">
                chevron_right
              </span>
              <span className="text-xs font-bold text-[#00342b]">Arsip</span>
            </nav>
          </div>

          {/* Title block */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm w-fit">
                <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse" />
                <span className="text-[10px] text-[#006e2a] tracking-[0.2em] uppercase font-black">
                  ARSIP DATA
                </span>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#00342b] leading-tight tracking-tight">
              Arsip{" "}
              <span
                className="italic font-normal text-[#006e2a]"
                style={{ fontFamily: "EB Garamond, serif" }}
              >
                Tahun Ajaran
              </span>{" "}
              &amp; Semester
            </h1>
            <p className="text-base sm:text-lg text-[#3f4945]/80 max-w-2xl leading-relaxed">
              Melihat data historis dan riwayat periode akademik yang telah
              berlalu atau dinonaktifkan secara terpusat.
            </p>
          </div>
        </section>

        {/* ── 2. Filter Bar ── */}
        <div className="bg-white border border-[#bfc9c4]/20 p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center shadow-sm rounded-2xl">
          {/* Search */}
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-12 pr-4 text-[#191c1c] placeholder:text-[#3f4945]/50 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all font-medium text-sm outline-none"
              placeholder="Cari tahun ajaran (mis. 2022)..."
              type="text"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:w-auto">
            {/* Filter Status */}
            <div className="relative min-w-[160px]">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
              >
                <option value="semua">Status: Semua</option>
                <option value="sementara">Diarsipkan Sementara</option>
                <option value="permanen">Arsip Permanen</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                expand_more
              </span>
            </div>

            {/* Filter Kurikulum */}
            <div className="relative min-w-[160px]">
              <select
                value={filterKurikulum}
                onChange={(e) => setFilterKurikulum(e.target.value)}
                className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
              >
                <option value="semua">Kurikulum: Semua</option>
                <option value="Merdeka">Merdeka</option>
                <option value="K-13">K-13</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                expand_more
              </span>
            </div>

            <div className="hidden lg:block h-10 w-px bg-[#bfc9c4]/20 mx-1" />

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-[#bfc9c4]/20 text-[#3f4945] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold text-xs uppercase tracking-widest bg-white/50"
              title="Reset Filter"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ── 3. Content ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3ce36a] animate-pulse" />
            <span className="text-xs font-bold text-[#707975] tracking-widest uppercase">
              Data Historis
            </span>
          </div>

          {isLoading ? (
            /* ── Skeleton ── */
            <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[2.5rem] shadow-lg p-8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#bfc9c4]/20">
                      {[
                        "Tahun Ajaran",
                        "Semester",
                        "Periode",
                        "Kurikulum",
                        "Total Siswa",
                        "Status",
                        "Aksi",
                      ].map((h) => (
                        <th
                          key={h}
                          className="py-5 px-4 text-[14px] text-[#00342b] uppercase tracking-widest font-bold"
                          style={{ fontFamily: "EB Garamond, serif" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#bfc9c4]/10">
                    {[...Array(4)].map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : is404 ? (
            <BackendPendingNotice />
          ) : isError ? (
            <ErrorState />
          ) : rawItems.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* ── Desktop Table ── */}
              <div className="hidden lg:block bg-white/80 backdrop-blur-md border border-white/40 rounded-[2.5rem] shadow-lg p-8 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#bfc9c4]/20">
                        {[
                          "Tahun Ajaran",
                          "Semester",
                          "Periode",
                          "Kurikulum",
                          "Total Siswa",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="py-5 px-4 text-[14px] text-[#00342b] uppercase tracking-widest font-bold"
                            style={{ fontFamily: "EB Garamond, serif" }}
                          >
                            {h}
                          </th>
                        ))}
                        <th
                          className="py-5 px-4 text-[14px] text-[#00342b] uppercase tracking-widest font-bold text-right"
                          style={{ fontFamily: "EB Garamond, serif" }}
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#bfc9c4]/10">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <span className="material-symbols-outlined text-5xl text-[#bfc9c4]">
                                search_off
                              </span>
                              <p className="text-sm text-[#3f4945]/60 font-medium">
                                Tidak ada hasil untuk filter ini
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <ArsipRow
                            key={item.id}
                            item={item}
                            onUnarsip={setConfirmUnarsip}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Row count */}
                {items.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-[#bfc9c4]/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#006e2a]/40" />
                    <span className="text-xs text-[#707975] font-medium">
                      Menampilkan {items.length} dari {rawItems.length} arsip
                    </span>
                  </div>
                )}
              </div>

              {/* ── Mobile Cards ── */}
              <div className="lg:hidden flex flex-col gap-3">
                {items.length === 0 ? (
                  <div className="text-center py-12 bg-white/80 rounded-2xl border border-white/40 shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-[#bfc9c4] block mb-2">
                      search_off
                    </span>
                    <p className="text-sm text-[#3f4945]/60 font-medium">
                      Tidak ada hasil untuk filter ini
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#707975] font-medium px-1">
                      Menampilkan {items.length} dari {rawItems.length} arsip
                    </p>
                    {items.map((item) => (
                      <ArsipCard
                        key={item.id}
                        item={item}
                        onUnarsip={setConfirmUnarsip}
                      />
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={!!confirmUnarsip}
        title="Keluarkan dari Arsip?"
        message={`Tahun ajaran "${confirmUnarsip?.tahun}" akan dipindahkan kembali ke daftar aktif.`}
        confirmLabel="Ya, Pulihkan"
        onConfirm={handleUnarsipConfirm}
        onCancel={() => setConfirmUnarsip(null)}
      />
    </div>
  );
}
