import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

import {
  jenisPtkOptions,
  initials,
  fotoUrl,
  statusBadge,
  SkeletonRow,
} from "./guruConstants";

import ModalImportGuru from "./ModalImportGuru";
import ModalExportGuru from "./ModalExportGuru";
import ModalPerhatianData from "./ModalPerhatianData";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  subIcon,
  iconBg,
  iconColor,
  hoverBg,
  hoverColor,
  progressBar,
  progressVal,
}) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="font-medium text-sm text-on-surface-variant mb-1">
            {label}
          </p>
          <h3 className="text-4xl font-bold text-on-background tracking-tight">
            {value}
          </h3>
          {progressBar ? (
            <div className="mt-3 w-24 bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-accent-gold h-full rounded-full transition-all"
                style={{ width: `${progressVal ?? 0}%` }}
              />
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-on-surface-variant/60">
              {subIcon && (
                <span
                  className="material-symbols-outlined text-xs text-success"
                  style={{ fontSize: "14px" }}
                >
                  {subIcon}
                </span>
              )}
              <span>{sub}</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} transition-all shrink-0`}
          style={{ transition: "background 0.2s, color 0.2s" }}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Stat Card ────────────────────────────────────────────────────────
function SkeletonStatCard() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2.5">
          <div className="h-3 w-20 bg-outline-variant/30 rounded-full" />
          <div className="h-10 w-16 bg-outline-variant/30 rounded-xl" />
          <div className="h-3 w-24 bg-outline-variant/20 rounded-full" />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-outline-variant/20" />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MasterGuru() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [jenis, setJenis] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [perhatianOpen, setPerhatianOpen] = useState(false);
  const [perhatianFilter, setPerhatianFilter] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["master-guru", search, jenis, statusFilter, page],
    queryFn: () =>
      api
        .get("/operator/master-data/guru", {
          params: {
            search,
            jenis_ptk: jenis,
            status_keaktifan: statusFilter,
            per_page: 10,
            page,
          },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["master-guru-stats"],
    queryFn: () =>
      api.get("/operator/master-data/guru/stats").then((r) => r.data.data),
    staleTime: 30_000,
  });

  const hapus = useMutation({
    mutationFn: (nuptk) => api.delete(`/operator/master-data/guru/${nuptk}`),
    onSuccess: () => {
      toast.success("Data guru berhasil dihapus.");
      queryClient.invalidateQueries(["master-guru"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal menghapus."),
  });

  const gurus = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.last_page ?? 1;
  const perPage = 10;

  const guruAktif = stats?.aktif ?? 0;
  const guruBersert = stats?.bersertifikasi ?? 0;
  const perhatianItems = stats?.perhatian ?? [];
  const sertPersen = total > 0 ? Math.round((guruBersert / total) * 100) : 0;
  const perhatianTotal = perhatianItems.reduce((a, b) => a + b.count, 0);

  const toggleSelect = (nuptk) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(nuptk) ? next.delete(nuptk) : next.add(nuptk);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === gurus.length) setSelected(new Set());
    else setSelected(new Set(gurus.map((g) => g.nuptk)));
  };
  const resetFilter = () => {
    setSearch("");
    setJenis("");
    setStatusFilter("");
    setPage(1);
  };

  const hasFilter = search || jenis || statusFilter;
  const startNum = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endNum = Math.min(page * perPage, total);

  // Smart page numbers
  const pageNums = (() => {
    const pages = [];
    const r = 2;
    for (let i = Math.max(1, page - r); i <= Math.min(lastPage, page + r); i++)
      pages.push(i);
    return pages;
  })();

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 sm:p-6 lg:p-8 pb-24 flex-1 space-y-8 lg:space-y-12">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8">
          <div className="space-y-2">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-success">
                Master Data
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-on-background leading-tight tracking-tight">
              Data Guru{" "}
              <span
                className="font-normal italic text-on-primary-fixed-variant"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                &amp; Tenaga Kependidikan
              </span>
            </h1>

            <p className="text-on-surface-variant/80 max-w-2xl text-sm sm:text-base">
              Kelola informasi, status, dan penugasan staf pengajar secara
              terpadu.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Import / Export pill */}
            <div className="flex items-center bg-surface-container-low/70 p-1.5 rounded-2xl border border-outline-variant/30">
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-background text-sm font-semibold hover:bg-surface-variant transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">
                  upload
                </span>
                <span className="hidden sm:inline">Import</span>
              </button>
              <div className="w-px h-6 bg-outline-variant/30 mx-1" />
              <button
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-background text-sm font-semibold hover:bg-surface-variant transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">
                  download
                </span>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>

            {/* Tambah Guru — hijau gelap sesuai template */}
            <button
              onClick={() => navigate("/operator/master/guru/tambah")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-xl active:scale-95 transition-all shadow-lg"
              style={{ backgroundColor: "#00342b" }}
            >
              <span className="material-symbols-outlined text-[20px]">
                person_add
              </span>
              <span>Tambah Guru</span>
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statsLoading ? (
            [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard
                icon="group"
                label="Total Guru"
                value={isLoading ? "—" : total}
                sub="+2% bulan ini"
                subIcon="trending_up"
                iconBg="bg-on-background/5"
                iconColor="text-on-background"
              />
              <StatCard
                icon="check_circle"
                label="Guru Aktif"
                value={statsLoading ? "—" : guruAktif}
                sub={
                  total > 0
                    ? `${Math.round((guruAktif / total) * 100)}% dari total`
                    : "—"
                }
                iconBg="bg-success/5"
                iconColor="text-success"
              />
              <StatCard
                icon="workspace_premium"
                label="Sertifikasi"
                value={statsLoading ? "—" : `${sertPersen}%`}
                progressBar
                progressVal={sertPersen}
                iconBg="bg-accent-gold/10"
                iconColor="text-accent-gold"
              />
              <StatCard
                icon="person_add"
                label="Perlu Perhatian"
                value={statsLoading ? "—" : perhatianTotal}
                sub="Data belum lengkap"
                iconBg="bg-on-surface-variant/5"
                iconColor="text-on-surface-variant"
              />
            </>
          )}
        </div>

        {/* ── Data Table ── */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-surface-container-lowest border-b border-outline-variant/20 p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center shadow-sm">
            {/* Search */}
            <div className="relative flex-1 group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-success transition-colors text-[20px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-success/20 focus:border-success transition-all text-sm outline-none"
                placeholder="Cari NIP, nama, atau jabatan..."
                type="text"
              />
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
              {/* Status */}
              <div className="relative flex-1 min-w-[150px] lg:flex-none lg:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-10 text-on-surface font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-success/20 focus:border-success appearance-none cursor-pointer transition-all outline-none"
                >
                  <option value="">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Pensiun">Pensiun</option>
                  <option value="Mutasi">Mutasi</option>
                  <option value="Keluar">Keluar</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                  expand_more
                </span>
              </div>

              {/* Jenis PTK */}
              <div className="relative flex-1 min-w-[150px] lg:flex-none lg:w-44">
                <select
                  value={jenis}
                  onChange={(e) => {
                    setJenis(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-10 text-on-surface font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-success/20 focus:border-success appearance-none cursor-pointer transition-all outline-none"
                >
                  <option value="">Semua Jabatan</option>
                  {jenisPtkOptions.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                  expand_more
                </span>
              </div>

              <div className="hidden lg:block h-10 w-px bg-outline-variant/20" />

              {/* Reset */}
              <button
                onClick={resetFilter}
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-outline-variant/20 text-on-surface-variant hover:bg-error-container/10 hover:text-error hover:border-error/30 transition-all font-bold text-xs uppercase tracking-widest bg-white/50 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="px-6 py-3 bg-success/5 border-b border-success/10 flex items-center gap-3">
              <span className="text-sm font-semibold text-success">
                {selected.size} guru dipilih
              </span>
              <button
                onClick={() => setExportOpen(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors"
                style={{ backgroundColor: "#00342b" }}
              >
                Export Dipilih
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-on-surface-variant hover:text-error transition-colors ml-auto"
              >
                Batal Pilih
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        gurus.length > 0 && selected.size === gurus.length
                      }
                      onChange={toggleAll}
                      className="rounded border-outline-variant text-success focus:ring-success"
                    />
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">Guru</th>
                  <th className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    L/P
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    Jabatan
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    Wali Kelas
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm divide-y divide-outline-variant/10">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : gurus.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-20 text-on-surface-variant"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-[56px] text-outline-variant">
                          supervisor_account
                        </span>
                        <p className="font-semibold text-on-surface">
                          {hasFilter
                            ? "Tidak ada guru yang cocok."
                            : "Belum ada data guru."}
                        </p>
                        {hasFilter ? (
                          <button
                            onClick={resetFilter}
                            className="text-sm font-medium hover:underline text-success"
                          >
                            Reset filter
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              navigate("/operator/master/guru/tambah")
                            }
                            className="text-sm font-medium hover:underline flex items-center gap-1 text-success"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              add
                            </span>
                            Tambah sekarang
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  gurus.map((g) => {
                    const foto = fotoUrl(g.foto);
                    const wali =
                      g.wali_kelas?.find((w) => w.is_active)?.kelas
                        ?.nama_kelas ?? null;
                    const statusAktif = g.status_keaktifan ?? "Aktif";
                    const badge = statusBadge(statusAktif);

                    return (
                      <tr
                        key={g.nuptk}
                        className="hover:bg-surface-bright transition-colors group"
                      >
                        {/* Checkbox */}
                        <td
                          className="px-6 py-4 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(g.nuptk);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(g.nuptk)}
                            readOnly
                            className="rounded border-outline-variant text-success focus:ring-success"
                          />
                        </td>

                        {/* Guru */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center shrink-0 shadow-sm">
                              {foto ? (
                                <img
                                  src={foto}
                                  alt={g.nama_lengkap}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold text-on-primary-fixed-variant">
                                  {initials(g.nama_lengkap)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-on-background truncate">
                                {g.nama_lengkap}
                              </p>
                              <p className="text-xs text-on-surface-variant truncate">
                                {g.nip
                                  ? `NIP: ${g.nip}`
                                  : g.nuptk
                                    ? `NUPTK: ${g.nuptk}`
                                    : "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* L/P */}
                        <td className="px-6 py-4 text-on-surface-variant font-medium hidden md:table-cell">
                          {g.jenis_kelamin ?? "—"}
                        </td>

                        {/* Jabatan */}
                        <td className="px-6 py-4 text-on-surface-variant hidden md:table-cell">
                          {g.jenis_ptk ?? "—"}
                        </td>

                        {/* Wali Kelas */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {wali ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-success/10 text-success border border-success/20">
                              {wali}
                            </span>
                          ) : (
                            <span className="text-xs text-outline">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider border ${badge}`}
                          >
                            {statusAktif}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                navigate(`/operator/master/guru/${g.nuptk}`)
                              }
                              title="Lihat Detail"
                              className="p-1.5 text-on-surface-variant hover:text-success rounded-lg hover:bg-success/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                visibility
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                navigate(
                                  `/operator/master/guru/edit/${g.nuptk}`,
                                )
                              }
                              title="Edit"
                              className="p-1.5 text-on-surface-variant hover:text-success rounded-lg hover:bg-success/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                edit
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(`Hapus data guru ${g.nama_lengkap}?`)
                                )
                                  hapus.mutate(g.nuptk);
                              }}
                              title="Hapus"
                              className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 sm:p-6 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-bright">
            <p className="text-sm text-on-surface-variant">
              {total === 0 ? (
                "Tidak ada data"
              ) : (
                <>
                  Menampilkan{" "}
                  <span className="font-medium text-on-surface">
                    {startNum}–{endNum}
                  </span>{" "}
                  dari{" "}
                  <span className="font-medium text-on-surface">{total}</span>{" "}
                  guru
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/30 text-outline hover:bg-surface-container-high transition-all disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_left
                </span>
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {pageNums[0] > 1 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent text-on-surface-variant hover:bg-surface-container-high text-sm transition-all"
                    >
                      1
                    </button>
                    {pageNums[0] > 2 && (
                      <span className="w-9 h-9 flex items-center justify-center text-on-surface-variant text-sm">
                        …
                      </span>
                    )}
                  </>
                )}
                {pageNums.map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                      page === pg
                        ? "text-white shadow-sm"
                        : "border border-transparent text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                    style={page === pg ? { backgroundColor: "#00342b" } : {}}
                  >
                    {pg}
                  </button>
                ))}
                {pageNums[pageNums.length - 1] < lastPage && (
                  <>
                    {pageNums[pageNums.length - 1] < lastPage - 1 && (
                      <span className="w-9 h-9 flex items-center justify-center text-on-surface-variant text-sm">
                        …
                      </span>
                    )}
                    <button
                      onClick={() => setPage(lastPage)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent text-on-surface-variant hover:bg-surface-container-high text-sm transition-all"
                    >
                      {lastPage}
                    </button>
                  </>
                )}
              </div>

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-background bg-white hover:bg-surface-container-high transition-all shadow-sm disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <ModalImportGuru
        open={importOpen}
        onClose={() => setImportOpen(false)}
        queryClient={queryClient}
      />
      <ModalExportGuru
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filters={{ search, jenis_ptk: jenis, status_keaktifan: statusFilter }}
        selected={selected}
      />
      <ModalPerhatianData
        open={perhatianOpen}
        onClose={() => setPerhatianOpen(false)}
        filterField={perhatianFilter}
        perhatianItems={perhatianItems}
        navigate={navigate}
      />
    </div>
  );
}
