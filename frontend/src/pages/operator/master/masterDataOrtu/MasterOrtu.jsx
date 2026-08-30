import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const parentDisplayName = (o) =>
  o?.nama_ayah ||
  o?.nama_ibu ||
  o?.nama_wali ||
  o?.email ||
  `Orang tua #${o?.id}`;

const getHubungan = (o) => {
  if (o?.nama_ayah) return "Ayah";
  if (o?.nama_ibu) return "Ibu";
  if (o?.nama_wali) return "Wali";
  return "-";
};

const getKontak = (o) => o?.no_hp_ayah || o?.no_hp_ibu || o?.no_hp_wali || "-";
const getStudents = (o) => (Array.isArray(o?.siswa) ? o.siswa : []);
const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const hubunganBadge = {
  Ayah: "bg-surface-container text-on-surface-variant border-outline-variant/30",
  Ibu: "bg-surface-container text-on-surface-variant border-outline-variant/30",
  Wali: "bg-surface-container text-on-surface-variant border-outline-variant/30",
  "-": "bg-surface-container text-on-surface-variant border-outline-variant/30",
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/10 animate-pulse">
      <td className="px-6 py-4 w-12">
        <div className="w-4 h-4 bg-surface-container-high rounded mx-auto" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-surface-container-high rounded" />
            <div className="h-2.5 w-40 bg-surface-container-high/60 rounded" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="h-6 w-14 bg-surface-container-high rounded-md" />
      </td>
      <td className="px-6 py-4 hidden lg:table-cell">
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 bg-surface-container-high rounded" />
          <div className="h-2.5 w-16 bg-surface-container-high/60 rounded" />
        </div>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="h-3 w-32 bg-surface-container-high rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-14 bg-surface-container-high rounded-full" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-container-high" />
          <div className="w-7 h-7 rounded-lg bg-surface-container-high" />
        </div>
      </td>
    </tr>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  iconColor,
  label,
  value,
  sub,
  progressBar,
  progressVal,
  progressColor,
  children,
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      {/* ghost icon */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity pointer-events-none">
        <span className={`material-symbols-outlined text-[80px] ${iconColor}`}>
          {icon}
        </span>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-2">
          {label}
        </p>
        {children ?? (
          <>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[36px] font-extrabold text-on-background leading-none">
                {value ?? "—"}
              </h3>
              {sub && !progressBar && (
                <span className="text-sm text-outline">{sub}</span>
              )}
            </div>
            {progressBar && (
              <div className="w-full bg-surface-variant h-1.5 rounded-full mt-3">
                <div
                  className={`${progressColor} h-1.5 rounded-full`}
                  style={{ width: `${progressVal ?? 0}%` }}
                />
              </div>
            )}
            {sub && !progressBar && (
              <p className="text-xs text-on-surface-variant mt-1">{sub}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MasterOrtu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [hubFilter, setHubFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const emptyForm = {
    nama_ayah: "",
    nama_ibu: "",
    nama_wali: "",
    no_hp_ayah: "",
    no_hp_ibu: "",
    no_hp_wali: "",
    email: "",
    alamat: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["master-ortu", search, page],
    queryFn: () =>
      api
        .get("/operator/master-data/orang-tua", {
          params: { search, page, paginate: 1 },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const ortuList = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.last_page ?? 1;
  const perPage = 10;

  // derived stats
  const statsAktif = ortuList.filter((o) =>
    getStudents(o).some((s) => s.user_ortu?.length > 0),
  ).length;
  const statsMulti = ortuList.filter((o) => getStudents(o).length > 1).length;
  const aktifPct =
    ortuList.length > 0 ? Math.round((statsAktif / ortuList.length) * 100) : 0;

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (d) => api.post("/operator/master-data/orang-tua", d),
    onSuccess: () => {
      toast.success("Data orang tua berhasil ditambahkan.");
      queryClient.invalidateQueries(["master-ortu"]);
      setShowAddModal(false);
      setFormData(emptyForm);
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message || "Gagal menambahkan data");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/operator/master-data/orang-tua/${id}`),
    onSuccess: () => {
      toast.success("Data orang tua berhasil dihapus.");
      queryClient.invalidateQueries(["master-ortu"]);
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal menghapus data");
      setDeleteTarget(null);
    },
  });

  // ── Selection helpers ────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === ortuList.length) setSelected(new Set());
    else setSelected(new Set(ortuList.map((o) => o.id)));
  };

  const resetFilter = () => {
    setSearch("");
    setHubFilter("");
    setStatusFilter("");
    setPage(1);
  };
  const hasFilter = search || hubFilter || statusFilter;
  const startNum = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endNum = Math.min(page * perPage, total);

  // smart page numbers
  const pageNums = (() => {
    const pages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(lastPage, page + 2); i++)
      pages.push(i);
    return pages;
  })();

  // ── Filtered list (client-side hub filter since API may not support it) ──────
  const filtered = ortuList.filter((o) => {
    if (hubFilter && getHubungan(o) !== hubFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 sm:p-6 lg:p-8 pb-24 flex-1 space-y-8 lg:space-y-12">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
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
              Data Orang Tua{" "}
              <span
                className="font-normal italic text-on-primary-fixed-variant"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                &amp; Wali Murid
              </span>
            </h1>
            <p className="text-on-surface-variant/80 max-w-2xl text-sm sm:text-base">
              Kelola informasi profil, kontak, dan hubungan wali murid secara
              terpadu.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Import / Export pill */}
            <div className="flex items-center bg-surface-container-low/70 p-1.5 rounded-2xl border border-outline-variant/30">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-background text-sm font-semibold hover:bg-surface-variant transition-all">
                <span className="material-symbols-outlined text-[20px]">
                  upload
                </span>
                <span className="hidden sm:inline">Import</span>
              </button>
              <div className="w-px h-6 bg-outline-variant/30 mx-1" />
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-background text-sm font-semibold hover:bg-surface-variant transition-all">
                <span className="material-symbols-outlined text-[20px]">
                  download
                </span>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
            {/* Tambah Orang Tua */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-xl active:scale-95 transition-all shadow-lg"
              style={{ backgroundColor: "#00342b" }}
            >
              <span className="material-symbols-outlined text-[20px]">
                person_add
              </span>
              <span>Tambah Orang Tua</span>
            </button>
          </div>
        </div>

        {/* ── Stats Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Wali */}
          <StatCard
            icon="group"
            iconColor="text-on-background"
            label="Total Wali"
            value={isLoading ? "—" : total}
          />

          {/* Wali Aktif */}
          <StatCard
            icon="verified_user"
            iconColor="text-success"
            label="Wali Aktif"
            value={isLoading ? "—" : statsAktif}
            sub={`/ ${total}`}
            progressBar
            progressVal={aktifPct}
            progressColor="bg-success"
          />

          {/* Wali Baru */}
          <StatCard
            icon="person_add"
            iconColor="text-accent-gold"
            label="Wali Baru"
            value={isLoading ? "—" : statsMulti}
            sub="Lebih dari 1 anak"
          />

          {/* Rasio Hubungan */}
          <StatCard
            icon="supervisor_account"
            iconColor="text-on-primary-fixed-variant"
            label="Rasio Hubungan"
          >
            <div className="space-y-2 mt-1">
              {[
                { label: "Ayah", pct: 48 },
                { label: "Ibu", pct: 52 },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span>{label}</span>
                    <span className="text-on-primary-fixed-variant">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-variant h-1.5 rounded-full">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: "#00342b" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </StatCard>

          {/* Verifikasi Dokumen */}
          <StatCard
            icon="fact_check"
            iconColor="text-success"
            label="Verifikasi Dok"
            value="94%"
          >
            <div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-[36px] font-extrabold text-on-background leading-none">
                  94%
                </h3>
              </div>
              <p className="text-xs text-success font-medium mt-1">
                Dokumen Terverifikasi
              </p>
            </div>
          </StatCard>
        </div>

        {/* ── Data Table ──────────────────────────────────────────────────── */}
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
                placeholder="Cari nama, NIK, atau nama siswa..."
                type="text"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
              {/* Hubungan */}
              <div className="relative flex-1 min-w-[150px] lg:flex-none lg:w-44">
                <select
                  value={hubFilter}
                  onChange={(e) => {
                    setHubFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-10 text-on-surface font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-success/20 focus:border-success appearance-none cursor-pointer transition-all outline-none"
                >
                  <option value="">Hubungan: Semua</option>
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Wali">Wali</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                  expand_more
                </span>
              </div>

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
                  <option value="">Status: Semua</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Tidak Aktif</option>
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
                {selected.size} data dipilih
              </span>
              <button
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
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        ortuList.length > 0 && selected.size === ortuList.length
                      }
                      onChange={toggleAll}
                      className="rounded border-outline-variant text-success focus:ring-success"
                    />
                  </th>
                  <th className="px-6 py-4">Wali</th>
                  <th className="px-6 py-4 hidden md:table-cell">Hubungan</th>
                  <th className="px-6 py-4 hidden lg:table-cell">
                    Siswa Terkait
                  </th>
                  <th className="px-6 py-4 hidden md:table-cell">Kontak</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="text-sm divide-y divide-outline-variant/10">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
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
                            ? "Tidak ada data yang cocok."
                            : "Belum ada data orang tua."}
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
                            onClick={() => setShowAddModal(true)}
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
                  filtered.map((ortu) => {
                    const students = getStudents(ortu);
                    const hasAccount = students.some(
                      (s) => (s.user_ortu?.length ?? 0) > 0,
                    );
                    const hubungan = getHubungan(ortu);
                    const kontak = getKontak(ortu);
                    const displayName = parentDisplayName(ortu);
                    const initials = getInitials(displayName);
                    const firstChild = students[0];

                    return (
                      <tr
                        key={ortu.id}
                        className="hover:bg-surface-bright transition-colors group"
                      >
                        {/* Checkbox */}
                        <td
                          className="px-6 py-4 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(ortu.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(ortu.id)}
                            readOnly
                            className="rounded border-outline-variant text-success focus:ring-success"
                          />
                        </td>

                        {/* Wali */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm"
                              style={{
                                backgroundColor: "#e8f5e9",
                                color: "#00342b",
                              }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-on-background truncate">
                                {displayName}
                              </p>
                              <p className="text-xs text-on-surface-variant truncate">
                                {ortu.nik
                                  ? `NIK: ${ortu.nik}`
                                  : ortu.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Hubungan */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${hubunganBadge[hubungan] ?? hubunganBadge["-"]}`}
                          >
                            {hubungan}
                          </span>
                        </td>

                        {/* Siswa Terkait */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {firstChild ? (
                            <>
                              <p className="font-bold text-on-background truncate">
                                {firstChild.nama_lengkap ?? "—"}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                {firstChild.kelas?.nama_kelas ?? "Tanpa Kelas"}
                                {students.length > 1 && (
                                  <span className="ml-1 text-success font-medium">
                                    +{students.length - 1} lainnya
                                  </span>
                                )}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-outline">
                              Belum tertaut
                            </span>
                          )}
                        </td>

                        {/* Kontak */}
                        <td className="px-6 py-4 text-on-surface-variant hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">
                              call
                            </span>
                            <span className="font-medium text-sm">
                              {kontak}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {hasAccount ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider border bg-secondary-container/30 text-on-secondary-fixed-variant border-secondary-container/40">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider border bg-surface-variant text-on-surface-variant border-outline-variant/30">
                              Belum Aktif
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/operator/master/orang-tua/${ortu.id}`}
                              title="Detail"
                              className="p-1.5 text-on-surface-variant hover:text-success rounded-lg hover:bg-success/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                visibility
                              </span>
                            </Link>
                            <button
                              onClick={() =>
                                navigate(
                                  `/operator/master/orang-tua/edit/${ortu.id}`,
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
                              onClick={() => setDeleteTarget(ortu)}
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
                  data
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/30 text-outline hover:bg-surface-container-high transition-all disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_left
                </span>
              </button>

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

      {/* ── Modal Tambah Orang Tua ───────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
              <div>
                <h3 className="text-lg font-bold text-on-background">
                  Tambah Orang Tua
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Isi minimal satu dari: Ayah, Ibu, atau Wali
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(emptyForm);
                }}
                className="p-2 rounded-xl hover:bg-surface-container-low text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Ayah */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  Data Ayah
                </p>
                <div className="space-y-3">
                  {[
                    { key: "nama_ayah", ph: "Nama Ayah" },
                    { key: "no_hp_ayah", ph: "No. HP Ayah" },
                  ].map(({ key, ph }) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={ph}
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
              <div className="h-px bg-outline-variant/20" />

              {/* Ibu */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  Data Ibu
                </p>
                <div className="space-y-3">
                  {[
                    { key: "nama_ibu", ph: "Nama Ibu" },
                    { key: "no_hp_ibu", ph: "No. HP Ibu" },
                  ].map(({ key, ph }) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={ph}
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
              <div className="h-px bg-outline-variant/20" />

              {/* Wali */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  Data Wali{" "}
                  <span className="normal-case font-normal opacity-60">
                    (Opsional)
                  </span>
                </p>
                <div className="space-y-3">
                  {[
                    { key: "nama_wali", ph: "Nama Wali" },
                    { key: "no_hp_wali", ph: "No. HP Wali" },
                  ].map(({ key, ph }) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={ph}
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
              <div className="h-px bg-outline-variant/20" />

              {/* Kontak & Alamat */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  Kontak &amp; Alamat
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all"
                  />
                  <textarea
                    placeholder="Alamat"
                    value={formData.alamat}
                    rows={2}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, alamat: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(emptyForm);
                }}
                className="flex-1 py-3 border border-outline-variant/30 rounded-2xl text-on-surface font-semibold hover:bg-surface-container-low transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
                className="flex-1 py-3 rounded-2xl text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-all"
                style={{ backgroundColor: "#00342b" }}
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>{" "}
                    Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px] text-error">
                delete_forever
              </span>
            </div>
            <h3 className="text-lg font-bold text-on-background mb-2">
              Hapus Data Orang Tua?
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Data{" "}
              <span className="font-semibold text-on-background">
                {parentDisplayName(deleteTarget)}
              </span>{" "}
              akan dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 border border-outline-variant/30 rounded-2xl text-on-surface font-semibold hover:bg-surface-container-low transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 bg-error text-white rounded-2xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Menghapus...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>{" "}
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
