import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────
   WARNA UTAMA — sesuai template (sidebar color)
   #00342b = deep dark green (warna heading & tombol utama)
   #006e2a = secondary green (badge, progress bar, aktif)
   #15803d = primary-container (emerald medium)
───────────────────────────────────────── */
const DARK_GREEN = "#00342b";
const MED_GREEN = "#006e2a";

/* ─────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────── */
const statusPdOpts = [
  { value: "", label: "Status: Semua" },
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Non-Aktif" },
  { value: "mutasi_keluar", label: "Pindah" },
  { value: "lulus", label: "Lulus" },
  { value: "meninggal", label: "Meninggal" },
];

const tingkatOpts = [
  { value: "", label: "Semua Tingkat" },
  { value: "1", label: "Kelas 1" },
  { value: "2", label: "Kelas 2" },
  { value: "3", label: "Kelas 3" },
  { value: "4", label: "Kelas 4" },
  { value: "5", label: "Kelas 5" },
  { value: "6", label: "Kelas 6" },
  { value: "7", label: "Kelas 7" },
  { value: "8", label: "Kelas 8" },
  { value: "9", label: "Kelas 9" },
];

const statusConfig = {
  aktif: {
    bg: "bg-[#5cfd80]/20",
    text: "text-[#006e2a]",
    border: "border-[#5cfd80]/30",
    label: "Aktif",
  },
  nonaktif: {
    bg: "bg-surface-container",
    text: "text-text-secondary",
    border: "border-border-light",
    label: "Non-Aktif",
  },
  mutasi_keluar: {
    bg: "bg-surface-container",
    text: "text-text-secondary",
    border: "border-border-light",
    label: "Pindah",
  },
  lulus: {
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/20",
    label: "Lulus",
  },
  meninggal: {
    bg: "bg-surface-container",
    text: "text-text-secondary",
    border: "border-border-light",
    label: "Meninggal",
  },
};

const getStatusStyle = (s) =>
  statusConfig[s?.toLowerCase()] || {
    bg: "bg-surface-container",
    text: "text-text-secondary",
    border: "border-border-light",
    label: s ?? "—",
  };

/* ─────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/10">
      <td className="px-6 py-4 text-center">
        <div className="w-4 h-4 bg-surface-container-high rounded animate-pulse mx-auto" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse shrink-0" />
          <div className="space-y-1.5">
            <div className="w-32 h-3.5 bg-surface-container-high rounded-full animate-pulse" />
            <div className="w-20 h-2.5 bg-surface-container-high rounded-full animate-pulse" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="w-24 h-3.5 bg-surface-container-high rounded-full animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-6 h-3.5 bg-surface-container-high rounded-full animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-20 h-6 bg-surface-container-high rounded-md animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-6 bg-surface-container-high rounded-full animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-6 bg-surface-container-high rounded animate-pulse ml-auto" />
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  barPercent,
  barDualPercent,
  subText,
  subTextDanger,
  isLoading,
}) {
  return (
    <div className="bg-white border border-outline-variant/30 rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      {/* Ghost icon background */}
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none select-none">
        <span
          className="material-symbols-outlined text-[80px]"
          style={{ color: DARK_GREEN }}
        >
          {icon}
        </span>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-2">
          {label}
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3
            className="text-[2rem] font-extrabold leading-none font-display"
            style={{ color: DARK_GREEN }}
          >
            {isLoading ? (
              <span className="inline-block w-16 h-8 bg-surface-container-high rounded-lg animate-pulse align-middle" />
            ) : (
              value
            )}
          </h3>
          {trend && !isLoading && (
            <span
              className="text-sm flex items-center font-semibold"
              style={{ color: MED_GREEN }}
            >
              <span className="material-symbols-outlined text-[14px]">
                trending_up
              </span>
              {trend}
            </span>
          )}
          {trendLabel && !isLoading && (
            <span className="text-sm text-outline">{trendLabel}</span>
          )}
        </div>
        {subText && !isLoading && (
          <p className="text-xs text-text-secondary mt-1">{subText}</p>
        )}
        {subTextDanger && !isLoading && (
          <p className="text-xs text-danger mt-1 font-medium">
            {subTextDanger}
          </p>
        )}
        {/* Single progress bar */}
        {typeof barPercent === "number" &&
          typeof barDualPercent === "undefined" && (
            <div className="w-full bg-surface-variant h-1.5 rounded-full mt-3">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${barPercent}%`, backgroundColor: MED_GREEN }}
              />
            </div>
          )}
        {/* Dual progress bar (gender) */}
        {typeof barPercent === "number" &&
          typeof barDualPercent === "number" && (
            <div className="w-full flex h-1.5 rounded-full overflow-hidden mt-3">
              <div
                style={{ width: `${barPercent}%`, backgroundColor: MED_GREEN }}
              />
              <div
                style={{
                  width: `${barDualPercent}%`,
                  backgroundColor: "#F59E0B",
                }}
              />
            </div>
          )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function MasterSiswa() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["master-siswa", search, status, tingkat, page],
    queryFn: () =>
      api
        .get("/operator/master-data/siswa", {
          params: { search, status, tingkat, page, per_page: perPage },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const hapus = useMutation({
    mutationFn: (nisn) => api.delete(`/operator/master-data/siswa/${nisn}`),
    onSuccess: () => {
      toast.success("Data siswa dihapus.");
      queryClient.invalidateQueries(["master-siswa"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal menghapus."),
  });

  const siswaList = data?.data ?? [];
  const total = data?.total ?? siswaList.length;
  const totalAktif = siswaList.filter(
    (s) => (s.status_pd ?? s.status)?.toLowerCase() === "aktif",
  ).length;
  const totalL = siswaList.filter((s) => s.jenis_kelamin === "L").length;
  const totalP = siswaList.filter((s) => s.jenis_kelamin === "P").length;
  const totalBaru = siswaList.filter((s) => {
    const yr = s.tanggal_masuk ? new Date(s.tanggal_masuk).getFullYear() : null;
    return yr === new Date().getFullYear();
  }).length;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const currentTo = Math.min(page * perPage, total);
  const ratioL =
    siswaList.length > 0 ? Math.round((totalL / siswaList.length) * 100) : 0;
  const ratioP =
    siswaList.length > 0 ? Math.round((totalP / siswaList.length) * 100) : 0;
  const ratioAktif = total > 0 ? Math.round((totalAktif / total) * 100) : 0;

  /* Checkbox logic */
  const allChecked = siswaList.length > 0 && selected.size === siswaList.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(siswaList.map((s) => s.nisn)));
  const toggleOne = (nisn) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(nisn) ? n.delete(nisn) : n.add(nisn);
      return n;
    });
  const clearSel = () => setSelected(new Set());

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setTingkat("");
    setPage(1);
    clearSel();
  };

  /* Pagination buttons */
  const renderPageButtons = () => {
    const maxVisible = 3;
    let start = Math.max(1, page - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
      (i) => (
        <button
          key={i}
          onClick={() => setPage(i)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all"
          style={
            i === page
              ? { backgroundColor: MED_GREEN, color: "#fff" }
              : { color: "#6B7280" }
          }
          onMouseEnter={(e) => {
            if (i !== page) e.currentTarget.style.backgroundColor = "#e4eae1";
          }}
          onMouseLeave={(e) => {
            if (i !== page) e.currentTarget.style.backgroundColor = "";
          }}
        >
          {i}
        </button>
      ),
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center pt-2 relative z-10">
        <div className="space-y-2">
          {/* Badge pill */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: `${MED_GREEN}1a`,
              borderColor: `${MED_GREEN}33`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: MED_GREEN }}
            />
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: MED_GREEN }}
            >
              MASTER DATA
            </span>
          </div>

          <div>
            <h1
              className="font-display font-extrabold leading-tight tracking-tight"
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                color: DARK_GREEN,
              }}
            >
              Data Siswa{" "}
              <span className="font-serif italic" style={{ color: MED_GREEN }}>
                &amp; Rombongan Belajar
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1.5 max-w-xl opacity-80">
              Kelola informasi profil, status akademik, dan dokumen
              administratif seluruh siswa secara terpusat.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            className="px-5 py-2.5 rounded-xl border border-outline-variant/30 font-bold text-sm flex items-center gap-2 bg-white/70 shadow-sm transition-all hover:bg-surface-container/60"
            style={{ color: DARK_GREEN }}
          >
            <span className="material-symbols-outlined text-[18px]">
              upload
            </span>
            Import
          </button>
          <button
            className="px-5 py-2.5 rounded-xl border border-outline-variant/30 font-bold text-sm flex items-center gap-2 bg-white/70 shadow-sm transition-all hover:bg-surface-container/60"
            style={{ color: DARK_GREEN }}
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            Export
          </button>

          <button
            onClick={() => navigate("/operator/master/siswa/tambah")}
            className="px-6 py-3 rounded-xl text-white font-black text-[12px] tracking-widest uppercase flex items-center gap-2.5 shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 group"
            style={{ backgroundColor: DARK_GREEN }}
          >
            <div
              className="rounded-full p-0.5 group-hover:rotate-90 transition-transform duration-500"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <span className="material-symbols-outlined text-[18px] block">
                add
              </span>
            </div>
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* ── Bento Stats Grid ── */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
        <StatCard
          label="Total Siswa"
          icon="groups"
          value={total.toLocaleString("id-ID")}
          trend="+2.4%"
          isLoading={isLoading}
        />
        <StatCard
          label="Siswa Aktif"
          icon="person_check"
          value={totalAktif.toLocaleString("id-ID")}
          trendLabel={`/ ${total.toLocaleString("id-ID")}`}
          barPercent={ratioAktif}
          isLoading={isLoading}
        />
        <StatCard
          label="Siswa Baru"
          icon="school"
          value={totalBaru.toLocaleString("id-ID")}
          subText={`T.A ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}
          isLoading={isLoading}
        />
        <StatCard
          label="Rasio Gender"
          icon="wc"
          value={`${ratioL}%`}
          trendLabel={`L / ${ratioP}% P`}
          barPercent={ratioL}
          barDualPercent={ratioP}
          isLoading={isLoading}
        />
        <StatCard
          label="Kelengkapan"
          icon="verified"
          value="92%"
          subTextDanger="8% Kurang Dokumen"
          isLoading={isLoading}
        />
      </section>

      {/* ── Data Canvas ── */}
      <section className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden relative z-10">
        {/* ── Selection Toolbar ── */}
        {selected.size > 0 && (
          <div
            className="absolute top-0 inset-x-0 z-20 h-[68px] text-white flex items-center justify-between px-6 rounded-t-[2rem]"
            style={{ backgroundColor: DARK_GREEN }}
          >
            <div className="flex items-center gap-4 md:gap-6">
              <span className="text-sm font-bold">
                {selected.size} siswa dipilih
              </span>
              <div className="h-5 w-px bg-white/20 hidden sm:block" />
              <button className="hidden sm:flex items-center gap-2 text-sm font-bold hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  swap_horiz
                </span>
                Mutasi
              </button>
              <button className="hidden sm:flex items-center gap-2 text-sm font-bold hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  print
                </span>
                Print Kartu
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm(`Hapus ${selected.size} siswa yang dipilih?`)) {
                    selected.forEach((nisn) => hapus.mutate(nisn));
                    clearSel();
                  }
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
              >
                Hapus Terpilih
              </button>
              <button
                onClick={clearSel}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="bg-white border-b border-outline-variant/20 p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Search */}
          <div className="relative flex-1 group">
            <span
              className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]"
              style={{}}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
                clearSel();
              }}
              placeholder="Cari NISN, nama, atau kelas..."
              className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/60 font-medium text-sm outline-none transition-all"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = MED_GREEN;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${MED_GREEN}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
            {/* Tingkat */}
            <div className="relative min-w-[150px] flex-1 lg:flex-none">
              <select
                value={tingkat}
                onChange={(e) => {
                  setTingkat(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-10 font-bold text-xs uppercase tracking-wider appearance-none cursor-pointer transition-all outline-none"
                style={{ color: DARK_GREEN }}
              >
                {tingkatOpts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                expand_more
              </span>
            </div>

            {/* Status */}
            <div className="relative min-w-[150px] flex-1 lg:flex-none">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-10 font-bold text-xs uppercase tracking-wider appearance-none cursor-pointer transition-all outline-none"
                style={{ color: DARK_GREEN }}
              >
                {statusPdOpts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                expand_more
              </span>
            </div>

            <div className="h-9 w-px bg-outline-variant/20 hidden lg:block" />

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-outline-variant/20 text-text-secondary hover:bg-error-container/10 hover:text-danger hover:border-danger/30 transition-all font-bold text-xs uppercase tracking-widest bg-white/50 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30 text-[11px] uppercase tracking-wider text-text-secondary font-semibold">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="rounded border-outline-variant cursor-pointer"
                    style={{ accentColor: MED_GREEN }}
                  />
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors">
                    Siswa
                    <span className="material-symbols-outlined text-[14px]">
                      unfold_more
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">NISN</th>
                <th className="px-6 py-4 font-bold tracking-wider">L/P</th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors">
                    Kelas
                    <span className="material-symbols-outlined text-[14px]">
                      unfold_more
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="text-sm divide-y divide-outline-variant/10">
              {/* Loading */}
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {/* Empty */}
              {!isLoading && siswaList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-24">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-[40px] text-outline">
                          person_off
                        </span>
                      </div>
                      <div>
                        <p
                          className="text-base font-bold"
                          style={{ color: DARK_GREEN }}
                        >
                          Belum ada data siswa
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                          {search || status || tingkat
                            ? "Coba ubah kata kunci atau filter pencarian"
                            : "Klik 'Tambah Siswa' untuk mulai memasukkan data"}
                        </p>
                      </div>
                      {!search && !status && !tingkat && (
                        <button
                          onClick={() =>
                            navigate("/operator/master/siswa/tambah")
                          }
                          className="mt-2 px-6 py-2.5 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all"
                          style={{ backgroundColor: DARK_GREEN }}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            add
                          </span>
                          Tambah Siswa Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!isLoading &&
                siswaList.map((s) => {
                  const st = getStatusStyle(s.status_pd ?? s.status);
                  const isL = s.jenis_kelamin === "L";
                  const isAktif =
                    (s.status_pd ?? s.status)?.toLowerCase() === "aktif";
                  const kelasSiswa =
                    s.kelas_aktif?.nama_kelas ??
                    s.riwayat_kelas?.[0]?.kelas?.nama_kelas ??
                    null;
                  const isSel = selected.has(s.nisn);
                  const initials =
                    s.nama_lengkap?.slice(0, 2)?.toUpperCase() ?? "?";

                  return (
                    <tr
                      key={s.nisn}
                      className={`hover:bg-surface-bright transition-colors group ${isSel ? "bg-[#006e2a]/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleOne(s.nisn)}
                          className="rounded border-outline-variant cursor-pointer"
                          style={{ accentColor: MED_GREEN }}
                        />
                      </td>

                      {/* Siswa */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 border shadow-sm ${
                              isL
                                ? "bg-info/10 border-info/20"
                                : "bg-[#b64c62]/10 border-[#b64c62]/20"
                            } ${!isAktif ? "grayscale opacity-60" : ""}`}
                          >
                            {s.foto ? (
                              <img
                                src={`http://127.0.0.1:8001/storage/${s.foto}`}
                                alt={s.nama_lengkap}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span
                                className="font-bold text-sm"
                                style={{ color: isL ? "#2563EB" : "#b64c62" }}
                              >
                                {initials}
                              </span>
                            )}
                          </div>
                          <div>
                            <p
                              className="font-bold transition-colors"
                              style={{
                                color: isAktif ? DARK_GREEN : "#6B7280",
                              }}
                            >
                              {s.nama_lengkap}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {s.no_induk ? `NIS: ${s.no_induk}` : "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* NISN */}
                      <td className="px-6 py-4 font-mono text-[13px] text-text-secondary font-medium">
                        {s.nisn ?? "—"}
                      </td>

                      {/* L/P */}
                      <td className="px-6 py-4 text-text-secondary font-medium">
                        {isL ? "L" : "P"}
                      </td>

                      {/* Kelas */}
                      <td className="px-6 py-4">
                        {kelasSiswa ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
                            style={{
                              backgroundColor: `${DARK_GREEN}15`,
                              color: DARK_GREEN,
                            }}
                          >
                            {kelasSiswa}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-surface-container text-text-secondary">
                            Belum Ditentukan
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider border ${st.bg} ${st.text} ${st.border}`}
                        >
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              navigate(
                                `/operator/master/siswa/${s.nisn}/mutasi`,
                              )
                            }
                            title="Mutasi Siswa"
                            className="p-1.5 text-text-secondary hover:text-warning rounded-lg hover:bg-warning/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              swap_horiz
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/operator/master/siswa/${s.nisn}`)
                            }
                            title="Detail"
                            className="p-1.5 text-text-secondary rounded-lg transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = MED_GREEN;
                              e.currentTarget.style.backgroundColor = `${MED_GREEN}1a`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                              e.currentTarget.style.backgroundColor = "";
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/operator/master/siswa/edit/${s.nisn}`)
                            }
                            title="Edit"
                            className="p-1.5 text-text-secondary rounded-lg transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = MED_GREEN;
                              e.currentTarget.style.backgroundColor = `${MED_GREEN}1a`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                              e.currentTarget.style.backgroundColor = "";
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(`Hapus data siswa ${s.nama_lengkap}?`)
                              )
                                hapus.mutate(s.nisn);
                            }}
                            title="Hapus"
                            className="p-1.5 text-text-secondary hover:text-danger hover:bg-error-container/50 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!isLoading && total > 0 && (
          <div className="p-5 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-bright rounded-b-[2rem]">
            <p className="text-sm text-text-secondary">
              Menampilkan{" "}
              <span className="font-semibold text-on-surface">
                {currentFrom}-{currentTo}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-on-surface">
                {total.toLocaleString("id-ID")}
              </span>{" "}
              siswa
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/30 text-outline hover:bg-surface-container-high transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_left
                </span>
              </button>

              <div className="flex items-center gap-1">
                {renderPageButtons()}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/30 bg-white hover:bg-surface-container-high transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: DARK_GREEN }}
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
