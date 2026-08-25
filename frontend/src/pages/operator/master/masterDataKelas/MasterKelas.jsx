import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Template exact colors ───────────────────────────────────────────────────
// primary   = #00342b  (deep dark green)
// secondary = #006e2a  (medium green)  ← used for active nav, badges, buttons
// surface-container-lowest = #ffffff
// surface-container-low    = #f2f4f3
// surface-container        = #eceeed
// surface-card             = #f0f5ec
// outline-variant          = #bfc9c4
// outline                  = #707975
// on-surface-variant / text-secondary = #3f4945
// secondary-container      = #5cfd80
// on-secondary-container   = #00732c
// error                    = #ba1a1a
// surface-variant          = #e1e3e2
// ────────────────────────────────────────────────────────────────────────────

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// ── Modal Tambah / Edit ───────────────────────────────────────────────────────
function ModalKelas({ open, onClose, editData, queryClient }) {
  const isEdit = !!editData;
  const empty = {
    nama_kelas: "",
    tingkat: "1",
    kurikulum: "Merdeka",
    ruangan: "",
    kapasitas: "30",
    is_active: true,
  };
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open)
      setForm(
        editData
          ? {
              nama_kelas: editData.nama_kelas ?? "",
              tingkat: editData.tingkat ?? "1",
              kurikulum: editData.kurikulum ?? "Merdeka",
              ruangan: editData.ruangan ?? "",
              kapasitas: editData.kapasitas ?? "30",
              is_active: editData.is_active ?? true,
            }
          : empty,
      );
  }, [open, editData]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.put(`/operator/master-data/kelas/${editData.id}`, data)
        : api.post("/operator/master-data/kelas", data),
    onSuccess: () => {
      toast.success(
        `Data kelas berhasil ${isEdit ? "diperbarui" : "ditambahkan"}.`,
      );
      queryClient.invalidateQueries(["master-kelas"]);
      onClose();
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message ?? "Gagal menyimpan.");
    },
  });

  if (!open) return null;

  const inputCls =
    "w-full px-4 py-2.5 bg-[#f2f4f3] border border-[#bfc9c4]/40 rounded-xl text-sm text-[#191c1c] focus:ring-2 focus:ring-[#006e2a]/30 focus:border-[#006e2a] outline-none transition-all placeholder:text-[#707975]";
  const labelCls =
    "block text-xs font-semibold text-[#3f4945] mb-1.5 uppercase tracking-wide";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-[#bfc9c4]/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#bfc9c4]/30 bg-[#f2f4f3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006e2a]/10 flex items-center justify-center border border-[#006e2a]/20">
              <span className="material-symbols-outlined text-[22px] text-[#006e2a]">
                {isEdit ? "edit_note" : "add_circle"}
              </span>
            </div>
            <div>
              <h3
                className="text-base font-bold text-[#00342b]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {isEdit ? "Edit Kelas" : "Tambah Kelas Baru"}
              </h3>
              <p className="text-xs text-[#707975]">
                Kelola data kelas dan ruangan belajar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#707975] hover:bg-[#eceeed] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className={labelCls}>
              Nama Kelas{" "}
              <span className="text-[#ba1a1a] lowercase normal-case">*</span>
            </label>
            <input
              value={form.nama_kelas}
              onChange={(e) => set("nama_kelas", e.target.value)}
              className={inputCls}
              placeholder="Contoh: 1A / Abu Bakar"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Tingkat{" "}
                <span className="text-[#ba1a1a] lowercase normal-case">*</span>
              </label>
              <select
                value={form.tingkat}
                onChange={(e) => set("tingkat", e.target.value)}
                className={inputCls}
              >
                {[1, 2, 3, 4, 5, 6].map((t) => (
                  <option key={t} value={t}>
                    Kelas {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Kurikulum{" "}
                <span className="text-[#ba1a1a] lowercase normal-case">*</span>
              </label>
              <select
                value={form.kurikulum}
                onChange={(e) => set("kurikulum", e.target.value)}
                className={inputCls}
              >
                <option value="Merdeka">Kurikulum Merdeka</option>
                <option value="K13">Kurikulum 2013</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Ruangan</label>
            <input
              value={form.ruangan}
              onChange={(e) => set("ruangan", e.target.value)}
              className={inputCls}
              placeholder="Contoh: R-101"
            />
          </div>
          <div>
            <label className={labelCls}>Kapasitas Siswa</label>
            <input
              type="number"
              value={form.kapasitas}
              onChange={(e) => set("kapasitas", e.target.value)}
              className={inputCls}
              placeholder="30"
            />
          </div>
          {isEdit && (
            <div className="flex items-center justify-between p-3.5 bg-[#f2f4f3] rounded-xl border border-[#bfc9c4]/30">
              <div>
                <p className="text-sm font-semibold text-[#191c1c]">
                  Kelas Aktif
                </p>
                <p className="text-xs text-[#707975] mt-0.5">
                  Kelas nonaktif tidak muncul di filter default
                </p>
              </div>
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? "bg-[#006e2a]" : "bg-[#e1e3e2]"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-[#bfc9c4]/30 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] hover:bg-[#f2f4f3] text-sm font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() =>
              mutation.mutate({
                nama_kelas: form.nama_kelas,
                tingkat: form.tingkat,
                kurikulum: form.kurikulum,
                ruangan: form.ruangan || null,
                kapasitas: form.kapasitas,
                ...(isEdit && { is_active: form.is_active }),
              })
            }
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
            style={{ background: "#006e2a" }}
          >
            {mutation.isPending ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                Menyimpan...
              </>
            ) : isEdit ? (
              "Perbarui Data"
            ) : (
              "Simpan Data"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#bfc9c4]/10">
      {[4, 14, 18, 14, 22, 16, 14, 10].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="h-3 bg-[#eceeed] rounded-full animate-pulse"
            style={{ width: `${w * 5}px` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MasterKelas() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [semester, setSemester] = useState("");
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const { data, isLoading } = useQuery({
    queryKey: [
      "master-kelas",
      search,
      tingkat,
      semester,
      tahunAjaranFilter,
      page,
    ],
    queryFn: () =>
      api
        .get("/operator/master-data/kelas", {
          params: {
            search,
            tingkat,
            semester,
            tahun_ajaran_id: tahunAjaranFilter || undefined,
            page,
            per_page: 10,
          },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const { data: tahunAjaranList } = useQuery({
    queryKey: ["tahun-ajaran-dropdown"],
    queryFn: () =>
      api.get("/operator/master-data/tahun-ajaran").then((r) => r.data.data),
  });

  const hapus = useMutation({
    mutationFn: (id) => api.delete(`/operator/master-data/kelas/${id}`),
    onSuccess: () => {
      toast.success("Data kelas dihapus.");
      queryClient.invalidateQueries(["master-kelas"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal menghapus."),
  });

  const kelasList = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.last_page ?? 1;

  const totalSiswa = kelasList.reduce((s, k) => s + (k.total_siswa ?? 0), 0);
  const totalWali = kelasList.filter((k) => k.wali?.nama || k.nama_wali).length;
  const totalKap = kelasList.reduce((s, k) => s + (k.kapasitas ?? 0), 0);
  const rataSiswa =
    kelasList.length > 0 ? Math.round(totalSiswa / kelasList.length) : 0;
  const waliPct =
    kelasList.length > 0 ? Math.round((totalWali / kelasList.length) * 100) : 0;

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === kelasList.length) setSelected(new Set());
    else setSelected(new Set(kelasList.map((k) => k.id)));
  };

  const hasFilter = search || tingkat || semester || tahunAjaranFilter;

  // Shared select style — matches template rounded-2xl dropdowns
  const selectCls =
    "w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none";

  return (
    <div className="w-full space-y-10 pb-12">
      {/* ── Decorative blobs (subtle, behind content) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute w-96 h-96 rounded-full blur-[100px] opacity-[0.04] top-0 left-0"
          style={{ background: "#006e2a" }}
        />
        <div
          className="absolute w-[30rem] h-[30rem] rounded-full blur-[100px] opacity-[0.04] bottom-0 right-0"
          style={{ background: "#ffba3b" }}
        />
      </div>

      {/* ── Header Section — exact match to template ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
        {/* Left */}
        <div className="relative flex-1">
          {/* LIVE DATA badge + line */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border"
              style={{
                background: "rgba(0,110,42,0.1)",
                borderColor: "rgba(0,110,42,0.2)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#006e2a" }}
              ></span>
              <span
                className="text-[10px] tracking-[0.2em] uppercase font-black"
                style={{ color: "#006e2a", fontFamily: "'Inter', sans-serif" }}
              >
                LIVE DATA
              </span>
            </div>
            <div
              className="h-px w-32 hidden sm:block"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,110,42,0.2), transparent)",
              }}
            ></div>
          </div>

          {/* Heading — same as template: text-headline-section = 48px */}
          <h1
            className="leading-tight tracking-tighter mb-3"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "48px",
              fontWeight: 800,
              color: "#00342b",
              lineHeight: 1.2,
            }}
          >
            Data Kelas{" "}
            <span
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#006e2a",
                fontSize: "1em",
              }}
            >
              &amp; Rombongan Belajar
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="max-w-2xl leading-relaxed opacity-80"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "18px",
              lineHeight: 1.6,
              color: "#3f4945",
            }}
          >
            Kelola data kelas, kapasitas, dan penempatan wali kelas tahun ajaran
            aktif dengan sistem manajemen terpadu.
          </p>
        </div>

        {/* Right — buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              className="px-5 py-2.5 rounded-full border flex items-center gap-2 font-bold text-sm transition-all"
              style={{
                borderColor: "rgba(191,201,196,0.3)",
                color: "#00342b",
                background: "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(225,227,226,0.5)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.5)")
              }
            >
              <span className="material-symbols-outlined text-[18px]">
                upload
              </span>
              Import
            </button>
            <button
              className="px-5 py-2.5 rounded-full border flex items-center gap-2 font-bold text-sm transition-all"
              style={{
                borderColor: "rgba(191,201,196,0.3)",
                color: "#00342b",
                background: "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(225,227,226,0.5)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.5)")
              }
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              Export
            </button>
          </div>

          {/* Tambah Kelas — exact template: bg-secondary=006e2a, rounded-full, shadow */}
          <button
            onClick={() => {
              setEditData(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-3 rounded-full border border-white/20 transition-all duration-500 group"
            style={{
              background: "#006e2a",
              color: "#ffffff",
              padding: "16px 32px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing: "0.2em",
              boxShadow: "0 8px 16px rgba(0,110,42,0.15)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 16px 24px rgba(0,110,42,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "0 8px 16px rgba(0,110,42,0.15)";
            }}
          >
            <div
              className="rounded-full p-1 group-hover:rotate-90 transition-transform duration-500"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <span className="material-symbols-outlined text-[20px] block">
                add
              </span>
            </div>
            <span className="tracking-[0.2em] font-black uppercase">
              Tambah Kelas
            </span>
          </button>
        </div>
      </div>

      {/* ── Stats Bento — 5 cols, exact template ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Stat 1 — Total Kelas */}
        <div
          className="border rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          style={{
            background: "#ffffff",
            borderColor: "rgba(191,201,196,0.3)",
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <span
              className="material-symbols-outlined text-[#00342b]"
              style={{ fontSize: "80px" }}
            >
              meeting_room
            </span>
          </div>
          <div className="relative z-10">
            <p
              className="mb-2 uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: "#3f4945",
              }}
            >
              Total Kelas
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "36px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: "#00342b",
                }}
              >
                {isLoading ? "—" : total}
              </h3>
              <span
                className="text-sm font-medium flex items-center"
                style={{ color: "#006e2a" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px" }}
                >
                  trending_up
                </span>{" "}
                +2
              </span>
            </div>
          </div>
        </div>

        {/* Stat 2 — Tingkat MI */}
        <div
          className="border rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          style={{
            background: "#ffffff",
            borderColor: "rgba(191,201,196,0.3)",
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "80px", color: "#ffba3b" }}
            >
              layers
            </span>
          </div>
          <div className="relative z-10">
            <p
              className="mb-2 uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: "#3f4945",
              }}
            >
              Tingkat MI
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "36px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: "#00342b",
                }}
              >
                6
              </h3>
            </div>
            <p className="text-xs mt-1" style={{ color: "#3f4945" }}>
              Kelas 1 - 6
            </p>
          </div>
        </div>

        {/* Stat 3 — Wali Kelas Terplot */}
        <div
          className="border rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          style={{
            background: "#ffffff",
            borderColor: "rgba(191,201,196,0.3)",
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "80px", color: "#006e2a" }}
            >
              person_check
            </span>
          </div>
          <div className="relative z-10">
            <p
              className="mb-2 uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: "#3f4945",
              }}
            >
              Wali Kelas Terplot
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "36px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: "#00342b",
                }}
              >
                {isLoading ? "—" : totalWali}
              </h3>
              <span className="text-sm" style={{ color: "#707975" }}>
                / {kelasList.length}
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full mt-3"
              style={{ background: "#e1e3e2" }}
            >
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${waliPct}%`, background: "#006e2a" }}
              />
            </div>
          </div>
        </div>

        {/* Stat 4 — Rata-rata Siswa */}
        <div
          className="border rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          style={{
            background: "#ffffff",
            borderColor: "rgba(191,201,196,0.3)",
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "80px", color: "#00342b" }}
            >
              groups
            </span>
          </div>
          <div className="relative z-10">
            <p
              className="mb-2 uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: "#3f4945",
              }}
            >
              Rata-rata Siswa
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "36px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: "#00342b",
                }}
              >
                {isLoading ? "—" : rataSiswa}
              </h3>
              <span className="text-sm" style={{ color: "#3f4945" }}>
                / kelas
              </span>
            </div>
          </div>
        </div>

        {/* Stat 5 — Total Kapasitas */}
        <div
          className="border rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          style={{
            background: "#ffffff",
            borderColor: "rgba(191,201,196,0.3)",
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "80px", color: "#006e2a" }}
            >
              inventory_2
            </span>
          </div>
          <div className="relative z-10">
            <p
              className="mb-2 uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: "#3f4945",
              }}
            >
              Total Kapasitas
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "36px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: "#00342b",
                }}
              >
                {isLoading ? "—" : totalKap}
              </h3>
            </div>
            <p className="text-xs mt-1" style={{ color: "#3f4945" }}>
              Tersedia: {Math.max(0, totalKap - totalSiswa)} slot
            </p>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div
        className="rounded-[2rem] overflow-hidden border"
        style={{
          background: "#ffffff",
          borderColor: "rgba(191,201,196,0.2)",
          boxShadow: "0 8px 30px rgba(0,52,43,0.04)",
        }}
      >
        {/* Toolbar */}
        <div
          className="border-b p-4 flex flex-col lg:flex-row gap-4 items-center shadow-sm"
          style={{
            background: "#ffffff",
            borderColor: "rgba(191,201,196,0.2)",
          }}
        >
          {/* Search */}
          <div className="relative flex-1 w-full group">
            <span
              className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-[20px] pointer-events-none"
              style={{ color: "#707975" }}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl py-3.5 pl-12 pr-4 font-medium text-sm outline-none transition-all"
              style={{
                background: "rgba(242,244,243,0.5)",
                border: "1px solid rgba(191,201,196,0.2)",
                color: "#191c1c",
              }}
              placeholder="Cari nama kelas, kode, atau wali kelas..."
              onFocus={(e) => {
                e.target.style.borderColor = "#006e2a";
                e.target.style.boxShadow = "0 0 0 2px rgba(0,110,42,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(191,201,196,0.2)";
                e.target.style.boxShadow = "";
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
            {/* Tingkat */}
            <div className="relative min-w-[160px] flex-1 lg:flex-none">
              <select
                value={tingkat}
                onChange={(e) => {
                  setTingkat(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
              >
                <option value="">Tingkat: Semua</option>
                {[1, 2, 3, 4, 5, 6].map((t) => (
                  <option key={t} value={t}>
                    Tingkat {t}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]"
                style={{ color: "#707975" }}
              >
                expand_more
              </span>
            </div>

            {/* Status */}
            <div className="relative min-w-[160px] flex-1 lg:flex-none">
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
              >
                <option value="">Status: Semua</option>
                <option value="Ganjil">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]"
                style={{ color: "#707975" }}
              >
                expand_more
              </span>
            </div>

            {/* Divider */}
            <div
              className="h-10 w-px hidden lg:block mx-1"
              style={{ background: "rgba(191,201,196,0.2)" }}
            ></div>

            {/* Reset */}
            <button
              onClick={() => {
                setSearch("");
                setTingkat("");
                setSemester("");
                setTahunAjaranFilter("");
                setPage(1);
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all"
              style={{
                background: "rgba(255,255,255,0.5)",
                borderColor: "rgba(191,201,196,0.2)",
                color: "#3f4945",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,218,214,0.1)";
                e.currentTarget.style.color = "#ba1a1a";
                e.currentTarget.style.borderColor = "rgba(186,26,26,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                e.currentTarget.style.color = "#3f4945";
                e.currentTarget.style.borderColor = "rgba(191,201,196,0.2)";
              }}
              title="Reset Filter"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm"
            style={{ fontFamily: "'Inter', sans-serif", color: "#3f4945" }}
          >
            <thead
              className="border-b text-xs uppercase tracking-wider font-semibold"
              style={{
                background: "#f2f4f3",
                borderColor: "rgba(191,201,196,0.3)",
                color: "#3f4945",
              }}
            >
              <tr>
                <th className="p-4 w-4" scope="col">
                  <input
                    type="checkbox"
                    checked={
                      kelasList.length > 0 && selected.size === kelasList.length
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#006e2a" }}
                  />
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Kode
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Nama Kelas
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Tingkat
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Wali Kelas
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Kapasitas
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Status
                </th>
                <th
                  className="px-6 py-4 font-bold tracking-wider text-right"
                  scope="col"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "rgba(191,201,196,0.1)" }}
            >
              {isLoading ? (
                [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              ) : kelasList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "52px", color: "#bfc9c4" }}
                      >
                        meeting_room
                      </span>
                      <p className="font-semibold" style={{ color: "#191c1c" }}>
                        Belum ada data kelas
                      </p>
                      <p
                        className="text-xs opacity-70"
                        style={{ color: "#3f4945" }}
                      >
                        {hasFilter
                          ? "Coba ubah filter pencarian"
                          : "Mulai dengan menambahkan kelas pertama"}
                      </p>
                      {!hasFilter && (
                        <button
                          onClick={() => {
                            setEditData(null);
                            setModalOpen(true);
                          }}
                          className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold transition-all"
                          style={{ background: "#006e2a" }}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            add
                          </span>
                          Tambah Kelas Sekarang
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                kelasList.map((k) => {
                  const s = k.total_siswa ?? 0;
                  const kap = k.kapasitas ?? 0;
                  const waliName = k.wali?.nama ?? k.nama_wali;
                  const isSelected = selected.has(k.id);

                  return (
                    <tr
                      key={k.id}
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        background: isSelected
                          ? "rgba(0,110,42,0.03)"
                          : "#ffffff",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f0f5ec";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0,52,43,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSelected
                          ? "rgba(0,110,42,0.03)"
                          : "#ffffff";
                        e.currentTarget.style.transform = "";
                        e.currentTarget.style.boxShadow = "";
                      }}
                    >
                      {/* Checkbox */}
                      <td
                        className="p-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(k.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "#006e2a" }}
                        />
                      </td>

                      {/* Kode — font-mono, color secondary=#006e2a */}
                      <td
                        className="px-6 py-4 font-mono font-bold"
                        style={{ color: "#006e2a" }}
                      >
                        {k.id}
                      </td>

                      {/* Nama Kelas */}
                      <td
                        className="px-6 py-4 font-semibold"
                        style={{
                          color: "#00342b",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {k.nama_kelas}
                      </td>

                      {/* Tingkat */}
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-1 rounded-md text-xs font-medium"
                          style={{ background: "#eceeed", color: "#3f4945" }}
                        >
                          Tingkat {k.tingkat}
                        </span>
                      </td>

                      {/* Wali Kelas */}
                      <td className="px-6 py-4">
                        {waliName ? (
                          <div className="flex items-center gap-3">
                            {/* Avatar with initials, circular */}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border"
                              style={{
                                background: "#eceeed",
                                color: "#3f4945",
                                borderColor: "#bfc9c4",
                              }}
                            >
                              {initials(waliName)}
                            </div>
                            <div
                              className="font-medium"
                              style={{ color: "#3f4945" }}
                            >
                              {waliName}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {/* "?" avatar with dashed border */}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-dashed shrink-0"
                              style={{
                                background: "#e1e3e2",
                                color: "#707975",
                                borderColor: "#bfc9c4",
                              }}
                            >
                              ?
                            </div>
                            <div
                              className="font-medium italic text-xs"
                              style={{ color: "#707975" }}
                            >
                              Belum diplot
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Kapasitas */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium"
                            style={{ color: "#00342b" }}
                          >
                            {s}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "#707975" }}
                          >
                            / {kap || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status badge — same as template: bg-secondary-container/20 */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider border"
                            style={{
                              background: "rgba(92,253,128,0.2)",
                              color: "#00732c",
                              borderColor: "rgba(92,253,128,0.3)",
                            }}
                          >
                            Aktif
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditData(k);
                            setModalOpen(true);
                          }}
                          title="Edit"
                          className="p-1 transition-colors"
                          style={{ color: "#707975" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#00342b")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#707975")
                          }
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus kelas ${k.nama_kelas}?`))
                              hapus.mutate(k.id);
                          }}
                          title="Hapus"
                          className="p-1 ml-2 transition-colors"
                          style={{ color: "#707975" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#ba1a1a")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#707975")
                          }
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="p-6 border-t flex flex-col md:flex-row items-center justify-between gap-4"
          style={{
            borderColor: "rgba(191,201,196,0.2)",
            background: "rgba(242,244,243,0.3)",
          }}
        >
          {/* Left: count + rows per page */}
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium" style={{ color: "#3f4945" }}>
              Menampilkan{" "}
              <span className="font-bold" style={{ color: "#00342b" }}>
                {total === 0 ? 0 : (page - 1) * 10 + 1}
              </span>{" "}
              sampai{" "}
              <span className="font-bold" style={{ color: "#00342b" }}>
                {Math.min(page * 10, total)}
              </span>{" "}
              dari{" "}
              <span className="font-bold" style={{ color: "#00342b" }}>
                {total}
              </span>{" "}
              entri
            </p>
            <div
              className="h-4 w-px hidden md:block"
              style={{ background: "rgba(191,201,196,0.3)" }}
            ></div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: "#3f4945" }}
              >
                Baris per halaman:
              </span>
              <div className="relative">
                <select
                  className="appearance-none bg-white rounded-lg py-1 pl-3 pr-8 text-xs font-bold cursor-pointer transition-all outline-none border"
                  style={{
                    color: "#00342b",
                    borderColor: "rgba(191,201,196,0.3)",
                  }}
                >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span
                  className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[16px]"
                  style={{ color: "#707975" }}
                >
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Right: page buttons */}
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border transition-all disabled:opacity-30"
              style={{
                borderColor: "rgba(191,201,196,0.3)",
                color: "#707975",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                if (page > 1) {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#006e2a";
                  e.currentTarget.style.borderColor = "rgba(0,110,42,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#707975";
                e.currentTarget.style.borderColor = "rgba(191,201,196,0.3)";
              }}
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {[...Array(Math.min(lastPage, 5))].map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg font-medium text-sm transition-all border"
                    style={
                      page === pg
                        ? {
                            background: "#006e2a",
                            color: "#ffffff",
                            borderColor: "transparent",
                            fontWeight: 700,
                            boxShadow: "0 2px 4px rgba(0,110,42,0.2)",
                          }
                        : {
                            background: "transparent",
                            color: "#3f4945",
                            borderColor: "transparent",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (page !== pg) {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.borderColor =
                          "rgba(191,201,196,0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== pg) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }
                    }}
                  >
                    {pg}
                  </button>
                );
              })}
              {lastPage > 5 && (
                <span className="text-xs px-1" style={{ color: "#3f4945" }}>
                  …{lastPage}
                </span>
              )}
            </div>

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="w-9 h-9 flex items-center justify-center rounded-lg border transition-all shadow-sm disabled:opacity-30"
              style={{
                borderColor: "rgba(191,201,196,0.3)",
                color: "#00342b",
                background: "#ffffff",
              }}
              onMouseEnter={(e) => {
                if (page < lastPage) {
                  e.currentTarget.style.background = "#006e2a";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = "#006e2a";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.color = "#00342b";
                e.currentTarget.style.borderColor = "rgba(191,201,196,0.3)";
              }}
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <ModalKelas
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
        queryClient={queryClient}
      />
    </div>
  );
}
