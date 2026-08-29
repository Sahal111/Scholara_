import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useProgramList,
  useProgramDropdown,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
} from "../../../../hooks/api/useProgramPendidikan";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  getProgramConfig,
  getProgramJenisOptions,
  JENIS_LABEL,
} from "../../../../config/programConfig";

// ─── Design tokens (from template) ───────────────────────────────────────────
// primary              = #00342b
// secondary            = #006e2a
// surface-card         = #f0f5ec
// surface-container-low= #f2f4f3
// surface-container    = #eceeed
// outline-variant      = #bfc9c4
// outline              = #707975
// text-secondary       = #3f4945
// secondary-container  = #5cfd80
// on-secondary-container= #00732c
// error                = #ba1a1a
// gold-warm            = #ffdeac
// tertiary-container   = #5c3e00
// ─────────────────────────────────────────────────────────────────────────────

// JENJANG_LIST tetap statis — ini bukan filter per-sekolah tapi nilai field pada record
const JENJANG_LIST = [
  "semua",
  "SD",
  "MI",
  "SMP",
  "MTs",
  "SMA",
  "MA",
  "SMK",
  "MAK",
];

const inputCls =
  "w-full px-4 py-2.5 bg-[#f2f4f3] border border-[#bfc9c4]/40 rounded-xl text-sm " +
  "text-[#191c1c] focus:ring-2 focus:ring-[#006e2a]/30 focus:border-[#006e2a] " +
  "outline-none transition-all placeholder:text-[#707975]";
const labelCls =
  "block text-xs font-semibold text-[#3f4945] mb-1.5 uppercase tracking-wide";
const selectCls = inputCls + " appearance-none cursor-pointer";

// ── Modal Tambah / Edit ───────────────────────────────────────────────────────
function ModalProgram({ open, onClose, editData, defaultJenis, jenisOptions }) {
  const isEdit = !!editData;
  const qc = useQueryClient();

  // Jenis default: pakai tab aktif jika valid, fallback ke opsi pertama yang tersedia
  const resolveDefaultJenis = () => {
    if (defaultJenis && defaultJenis !== "semua") return defaultJenis;
    return jenisOptions[0]?.value ?? "umum";
  };

  const empty = {
    parent_id: "",
    nama: "",
    kode: "",
    jenis: resolveDefaultJenis(),
    jenjang_sasaran: "semua",
    deskripsi: "",
    is_active: true,
  };

  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Dropdown parent — filter berdasarkan jenis yang dipilih
  const parentJenisMap = {
    program_keahlian: "bidang_keahlian",
    konsentrasi_keahlian: "program_keahlian",
  };
  const parentJenis = parentJenisMap[form.jenis];
  const { data: parentOptions } = useProgramDropdown(
    parentJenis ? { jenis: parentJenis } : {},
  );
  const parents = parentOptions?.data ?? [];

  useEffect(() => {
    if (!open) return;
    setForm(
      editData
        ? {
            parent_id: editData.parent_id ?? "",
            nama: editData.nama ?? "",
            kode: editData.kode ?? "",
            jenis: editData.jenis ?? resolveDefaultJenis(),
            jenjang_sasaran: editData.jenjang_sasaran ?? "semua",
            deskripsi: editData.deskripsi ?? "",
            is_active: editData.is_active ?? true,
          }
        : { ...empty, jenis: resolveDefaultJenis() },
    );
  }, [open, editData, defaultJenis]);

  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram(editData?.id);

  const handleSubmit = () => {
    if (!form.nama.trim()) {
      toast.error("Nama program wajib diisi.");
      return;
    }
    const payload = {
      ...form,
      parent_id: form.parent_id !== "" ? Number(form.parent_id) : null,
      kode: form.kode.trim() || null,
    };
    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, { onSuccess: onClose });
  };

  if (!open) return null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border border-[#bfc9c4]/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
                {isEdit ? "Edit Program" : "Tambah Program Pendidikan"}
              </h3>
              <p className="text-xs text-[#707975]">
                Kelola program keahlian, peminatan, dan konsentrasi
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

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Jenis */}
          <div>
            <label className={labelCls}>Jenis Program</label>
            <div className="relative">
              <select
                className={selectCls}
                value={form.jenis}
                onChange={(e) => set("jenis", e.target.value)}
              >
                {jenisOptions.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Parent — hanya tampil jika jenis punya parent */}
          {parentJenis && (
            <div>
              <label className={labelCls}>
                {JENIS_LABEL[parentJenis]} (Induk)
              </label>
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.parent_id}
                  onChange={(e) => set("parent_id", e.target.value)}
                >
                  <option value="">— Tidak ada / Isi nanti —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode ? `[${p.kode}] ` : ""}
                      {p.nama}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          )}

          {/* Nama */}
          <div>
            <label className={labelCls}>
              Nama Program <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="cth: Rekayasa Perangkat Lunak"
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
            />
          </div>

          {/* Kode */}
          <div>
            <label className={labelCls}>Kode Program</label>
            <input
              className={inputCls + " uppercase"}
              placeholder="cth: RPL"
              value={form.kode}
              onChange={(e) => set("kode", e.target.value.toUpperCase())}
              maxLength={20}
            />
            <p className="text-[10px] text-[#707975] mt-1">
              Opsional. Digunakan sebagai label rombel (X RPL 1).
            </p>
          </div>

          {/* Jenjang Sasaran */}
          <div>
            <label className={labelCls}>Jenjang Sasaran</label>
            <div className="relative">
              <select
                className={selectCls}
                value={form.jenjang_sasaran}
                onChange={(e) => set("jenjang_sasaran", e.target.value)}
              >
                {JENJANG_LIST.map((j) => (
                  <option key={j} value={j}>
                    {j === "semua" ? "Semua Jenjang" : j}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className={labelCls}>Deskripsi</label>
            <textarea
              className={inputCls + " resize-none"}
              rows={3}
              placeholder="Deskripsi singkat program ini..."
              value={form.deskripsi}
              onChange={(e) => set("deskripsi", e.target.value)}
            />
          </div>

          {/* Status — hanya edit */}
          {isEdit && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f4f3] border border-[#bfc9c4]/30">
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${
                  form.is_active ? "bg-[#006e2a]" : "bg-[#bfc9c4]"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                    form.is_active ? "left-5" : "left-1"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[#3f4945]">
                {form.is_active ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#bfc9c4]/30 bg-[#f2f4f3]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-sm font-semibold text-[#3f4945] hover:bg-[#eceeed] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-[#006e2a] text-white text-sm font-bold hover:bg-[#00531e] disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {isPending && (
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
            {isEdit ? "Simpan Perubahan" : "Tambah Program"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Dropdown Aksi (more_vert) ─────────────────────────────────────────────────
function AksiDropdown({ item, onEdit, onDelete, onToggleStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[#3f4945] hover:text-[#006e2a] p-1.5 rounded-lg hover:bg-[#f2f4f3] transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#bfc9c4]/30 z-30 overflow-hidden py-1">
          <button
            onClick={() => {
              onEdit(item);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3f4945] hover:bg-[#f2f4f3] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006e2a]">
              edit
            </span>
            Edit
          </button>
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
          <div className="h-px bg-[#bfc9c4]/30 my-1" />
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
        </div>
      )}
    </div>
  );
}

// ── Konfirmasi Delete ─────────────────────────────────────────────────────────
function ModalHapus({ item, onClose, onConfirm, isPending }) {
  if (!item) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-[#bfc9c4]/30"
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
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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

// ── Skeleton Rows ─────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} className="border-b border-[#bfc9c4]/10 animate-pulse">
      <td className="py-4 px-6">
        <div className="h-5 w-12 rounded-full bg-[#eceeed]" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-48 rounded bg-[#eceeed]" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-36 rounded bg-[#eceeed]" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-16 rounded bg-[#eceeed] mx-auto" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-16 rounded bg-[#eceeed] mx-auto" />
      </td>
      <td className="py-4 px-6">
        <div className="h-5 w-16 rounded-full bg-[#eceeed] mx-auto" />
      </td>
      <td className="py-4 px-6">
        <div className="h-6 w-6 rounded bg-[#eceeed] ml-auto" />
      </td>
    </tr>
  ));
}

// ── Halaman Utama ─────────────────────────────────────────────────────────────
export default function MasterProgram() {
  const qc = useQueryClient();
  const { school } = useAuth();

  // Config dinamis berdasarkan jenis sekolah dari AuthContext
  const programConfig = getProgramConfig(school?.jenis);
  const jenisOptions = getProgramJenisOptions(school?.jenis);
  const JENIS_LIST = programConfig.tabs ?? [];

  // ── State filter & pagination
  const [activeTab, setActiveTab] = useState("semua");
  const [search, setSearch] = useState("");
  const [filterParent, setFilterParent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  // ── State modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  // Saat tab berubah, reset page dan filter parent
  const handleTabChange = (val) => {
    setActiveTab(val);
    setPage(1);
    setFilterParent("");
  };

  // ── Query params
  const queryParams = {
    page,
    per_page: 10,
    ...(search && { search }),
    ...(activeTab !== "semua" && { jenis: activeTab }),
    ...(filterParent && { parent_id: filterParent }),
    ...(filterStatus && { is_active: filterStatus }),
  };

  const { data, isLoading } = useProgramList(queryParams);
  const programs = data?.data?.data ?? [];
  const meta = data?.data ?? {};
  const totalPage = meta.last_page ?? 1;

  // Dropdown parent untuk filter toolbar — program_keahlian & bidang_keahlian
  const { data: parentDropdownData } = useProgramDropdown(
    activeTab === "konsentrasi_keahlian"
      ? { jenis: "program_keahlian" }
      : activeTab === "program_keahlian"
        ? { jenis: "bidang_keahlian" }
        : {},
  );
  const parentDropdown = parentDropdownData?.data ?? [];

  // ── Mutations
  const deleteMutation = useDeleteProgram();
  const updateMutation = useUpdateProgram(editData?.id);

  const handleEdit = (item) => {
    setEditData(item);
    setModalOpen(true);
  };

  const handleDelete = (item) => setDeleteItem(item);

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => setDeleteItem(null),
    });
  };

  const handleToggleStatus = (item) => {
    useUpdateProgram(item.id).mutate(
      { ...item, is_active: !item.is_active },
      {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: ["program-pendidikan"] }),
      },
    );
  };

  // Buka modal tambah
  const handleTambah = (defaultJenis) => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditData(null);
  };

  // Label header kolom dinamis berdasarkan tab
  const colNamaLabel =
    activeTab === "semua" ? "Nama Program" : (JENIS_LABEL[activeTab] ?? "Nama");

  const colParentLabel =
    {
      konsentrasi_keahlian: "Program Keahlian",
      program_keahlian: "Bidang Keahlian",
    }[activeTab] ?? "Program Induk";

  const showParentCol = [
    "konsentrasi_keahlian",
    "program_keahlian",
    "semua",
  ].includes(activeTab);

  const paginationRange = () => {
    const range = [];
    for (let i = 1; i <= totalPage; i++) range.push(i);
    return range;
  };

  return (
    <>
      {/* ── Modal Tambah/Edit ───────────────────────────────────────── */}
      <ModalProgram
        open={modalOpen}
        onClose={handleCloseModal}
        editData={editData}
        defaultJenis={activeTab}
        jenisOptions={jenisOptions}
      />
      {/* ── Modal Hapus ─────────────────────────────────────────────── */}
      <ModalHapus
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
      {/* ════════════════════════════════════════════════════════════════
          HEADER SECTION
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 relative gap-8">
        {/* Left — Title */}
        <div className="relative flex-1">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#006e2a]/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute -top-4 -left-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-6xl text-[#006e2a]">
              star_half
            </span>
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-4 py-1.5 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse" />
                <span
                  className="text-[10px] text-[#006e2a] tracking-[0.2em] uppercase font-black"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Master Data
                </span>
              </div>
              <div className="h-px w-32 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
            </div>
            <h1
              className="text-[36px] sm:text-[48px] font-extrabold text-[#004d40] leading-tight tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Program{" "}
              <span
                className="italic font-normal text-[#006e2a]"
                style={{ fontFamily: "'EB Garamond', serif" }}
              >
                Pendidikan
              </span>
            </h1>
            <p
              className="text-base text-[#3f4945] max-w-2xl leading-relaxed opacity-80"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Kelola program keahlian, konsentrasi keahlian, bidang keahlian,
              dan peminatan sekolah secara terpadu.
            </p>
          </div>
        </div>

        {/* Right — Buttons (dinamis dari programConfig) */}
        {programConfig.hasTabs && programConfig.addButtons?.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 relative z-10">
            {programConfig.addButtons.map((btn) =>
              btn.variant === "outline" ? (
                <button
                  key={btn.jenis}
                  onClick={() => handleTambah(btn.jenis)}
                  className="bg-white text-[#006e2a] border border-[#006e2a]/30 px-6 py-3.5 rounded-full
                    flex items-center gap-3 shadow-sm hover:shadow-[#006e2a]/20 hover:-translate-y-1
                    transition-all duration-500 group"
                >
                  <div className="bg-[#006e2a]/10 rounded-full p-1 group-hover:rotate-90 transition-transform duration-500">
                    <span className="material-symbols-outlined text-[20px] block">
                      add
                    </span>
                  </div>
                  <span
                    className="tracking-widest font-black uppercase text-[11px]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {btn.label}
                  </span>
                </button>
              ) : (
                <button
                  key={btn.jenis}
                  onClick={() => handleTambah(btn.jenis)}
                  className="bg-[#006e2a] text-white px-6 py-3.5 rounded-full
                    flex items-center gap-3
                    shadow-[0_8px_16px_rgba(0,110,42,0.15)]
                    hover:shadow-[0_15px_40px_rgba(0,200,83,0.5)]
                    hover:-translate-y-1 hover:scale-[1.03]
                    transition-all duration-500 group border border-white/20"
                >
                  <div className="bg-white/20 rounded-full p-1 group-hover:rotate-90 transition-transform duration-500">
                    <span className="material-symbols-outlined text-[20px] block">
                      add
                    </span>
                  </div>
                  <span
                    className="tracking-widest font-black uppercase text-[11px]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {btn.label}
                  </span>
                </button>
              ),
            )}
          </div>
        )}
      </div>
      {/* ════════════════════════════════════════════════════════════════
          MAIN CARD
      ════════════════════════════════════════════════════════════════ */}
      {/* Empty state — jenjang tanpa program pendidikan (SD/MI/SMP/MTs dll) */}
      {!programConfig.hasTabs ? (
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
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Tidak Ada Program Pendidikan
              </h3>
              <p className="text-sm text-[#707975] max-w-sm leading-relaxed">
                Jenjang{" "}
                <span className="font-semibold text-[#00342b]">
                  {school?.jenis ?? "ini"}
                </span>{" "}
                umumnya tidak menggunakan program keahlian atau peminatan. Kelas
                dapat dibuat langsung tanpa memilih program pendidikan.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="bg-white rounded-[2rem] shadow-sm border border-[#bfc9c4]/20 overflow-hidden
        transition-all duration-500 hover:shadow-[0_10px_25px_-5px_rgba(0,52,43,0.1)] hover:-translate-y-1"
        >
          {/* ── TABS ──────────────────────────────────────────────────── */}
          <div
            className="bg-white/70 backdrop-blur-md rounded-[2rem] p-4 border-b border-white/60
          relative overflow-hidden flex flex-col md:flex-row justify-center items-center z-10"
          >
            <div
              className="flex gap-2 w-full overflow-x-auto items-center justify-center
            pb-1 md:pb-0 scrollbar-hide"
            >
              {JENIS_LIST.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all duration-300 flex-shrink-0
                    ${
                      isActive
                        ? "bg-white border-[#006e2a]/30"
                        : "border-transparent hover:bg-white hover:border-[#006e2a]/20"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all duration-300
                    ${
                      isActive
                        ? "bg-[#006e2a] text-white shadow-[0_8px_20px_rgba(0,110,42,0.3)]"
                        : "bg-[#e6e9e8] text-[#3f4945]/60 group-hover:text-[#006e2a] group-hover:bg-[#006e2a]/10"
                    }`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={
                          isActive ? { fontVariationSettings: "'FILL' 1" } : {}
                        }
                      >
                        {tab.icon}
                      </span>
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span
                        className={`text-[11px] uppercase tracking-[0.15em] font-bold
                      ${isActive ? "text-[#00342b]" : "text-[#3f4945]/60"}`}
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <span className="text-[10px] text-[#006e2a] font-medium">
                          Aktif
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TOOLBAR ───────────────────────────────────────────────── */}
          <div
            className="bg-white border-b border-[#bfc9c4]/20 p-4
          flex flex-col lg:flex-row gap-3 items-stretch lg:items-center shadow-sm"
          >
            {/* Search */}
            <div className="relative flex-1 group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
              text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]"
              >
                search
              </span>
              <input
                className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl
                py-3 pl-12 pr-4 text-[#191c1c] placeholder:text-[#707975]/50
                focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a]
                transition-all font-medium text-sm outline-none"
                placeholder="Cari nama program atau kode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
              {/* Filter Parent — hanya tampil jika tab punya parent */}
              {parentDropdown.length > 0 && (
                <div className="relative min-w-[180px] flex-1 lg:flex-none">
                  <select
                    className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl
                    py-3 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider
                    focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a]
                    appearance-none cursor-pointer transition-all outline-none"
                    value={filterParent}
                    onChange={(e) => {
                      setFilterParent(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">{colParentLabel}: Semua</option>
                    {parentDropdown.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.kode ? `[${p.kode}] ` : ""}
                        {p.nama}
                      </option>
                    ))}
                  </select>
                  <span
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2
                  pointer-events-none text-[#707975] text-[20px]"
                  >
                    expand_more
                  </span>
                </div>
              )}

              {/* Filter Status */}
              <div className="relative min-w-[150px] flex-1 lg:flex-none">
                <select
                  className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl
                  py-3 pl-4 pr-10 text-[#191c1c] font-bold text-xs uppercase tracking-wider
                  focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a]
                  appearance-none cursor-pointer transition-all outline-none"
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
                <span
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2
                pointer-events-none text-[#707975] text-[20px]"
                >
                  expand_more
                </span>
              </div>

              <div className="hidden lg:block h-10 w-px bg-[#bfc9c4]/20 mx-1" />

              {/* Reset */}
              <button
                onClick={() => {
                  setSearch("");
                  setFilterParent("");
                  setFilterStatus("");
                  setPage(1);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#bfc9c4]/20
                text-[#3f4945] hover:bg-red-50 hover:text-[#ba1a1a] hover:border-red-200
                transition-all font-bold text-xs uppercase tracking-widest bg-white/50"
                title="Reset Filter"
              >
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* ── TABLE ─────────────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f3] border-b border-[#bfc9c4]/30 text-xs uppercase tracking-wider text-[#3f4945] font-semibold">
                  <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">
                    Kode
                  </th>
                  <th className="px-6 py-4 font-bold tracking-wider">
                    {colNamaLabel}
                  </th>
                  {activeTab === "semua" && (
                    <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">
                      Jenis
                    </th>
                  )}
                  {showParentCol && activeTab !== "semua" && (
                    <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">
                      {colParentLabel}
                    </th>
                  )}
                  <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">
                    Jenjang
                  </th>
                  <th className="px-6 py-4 font-bold tracking-wider text-center whitespace-nowrap">
                    Rombel
                  </th>
                  <th className="px-6 py-4 font-bold tracking-wider text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 font-bold tracking-wider text-right whitespace-nowrap">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <SkeletonRows />
                ) : programs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-20 text-center text-[#707975]"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-[#bfc9c4]">
                          account_tree
                        </span>
                        <span className="text-sm font-medium">
                          Belum ada data program pendidikan.
                        </span>
                        <button
                          onClick={() => handleTambah(activeTab)}
                          className="mt-1 px-5 py-2 rounded-full bg-[#006e2a] text-white text-xs font-bold
                          hover:bg-[#00531e] transition-colors"
                        >
                          + Tambah Program
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  programs.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-[#bfc9c4]/10 transition-colors hover:bg-[#006e2a]/[0.02]
                      ${idx === programs.length - 1 ? "border-b-0" : ""}`}
                    >
                      {/* Kode */}
                      <td className="py-4 px-6">
                        {item.kode ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#00342b]/5 text-[#00342b] font-bold text-[10px]">
                            {item.kode}
                          </span>
                        ) : (
                          <span className="text-[#bfc9c4] text-xs">—</span>
                        )}
                      </td>

                      {/* Nama */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-[#00342b] block">
                          {item.nama}
                        </span>
                        {item.deskripsi && (
                          <span className="text-[11px] text-[#707975] line-clamp-1 mt-0.5">
                            {item.deskripsi}
                          </span>
                        )}
                      </td>

                      {/* Jenis — hanya tab semua */}
                      {activeTab === "semua" && (
                        <td className="py-4 px-6">
                          <span className="text-xs text-[#3f4945] font-medium">
                            {JENIS_LABEL[item.jenis] ?? item.jenis}
                          </span>
                        </td>
                      )}

                      {/* Parent — tab spesifik */}
                      {showParentCol && activeTab !== "semua" && (
                        <td className="py-4 px-6 text-[#3f4945]">
                          {item.parent ? (
                            <span className="text-sm">
                              {item.parent.kode && (
                                <span className="text-[10px] font-bold text-[#006e2a] mr-1">
                                  [{item.parent.kode}]
                                </span>
                              )}
                              {item.parent.nama}
                            </span>
                          ) : (
                            <span className="text-[#bfc9c4] text-xs">—</span>
                          )}
                        </td>
                      )}

                      {/* Jenjang */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-medium text-[#3f4945]">
                          {item.jenjang_sasaran === "semua"
                            ? "Semua"
                            : item.jenjang_sasaran}
                        </span>
                      </td>

                      {/* Rombel count */}
                      <td className="py-4 px-6 text-center text-[#3f4945] font-medium">
                        {item.kelas_count ?? 0}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        {item.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#006e2a]/10 text-[#006e2a]">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#bfc9c4]/20 text-[#3f4945]">
                            Tidak Aktif
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-6 text-right">
                        <AksiDropdown
                          item={item}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleStatus={handleToggleStatus}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ────────────────────────────────────────────── */}
          {!isLoading && programs.length > 0 && (
            <div
              className="px-6 py-4 border-t border-[#bfc9c4]/10
            flex flex-col sm:flex-row items-center justify-between gap-3 bg-white"
            >
              <p className="text-sm text-[#3f4945]">
                Menampilkan{" "}
                <span className="font-medium text-[#00342b]">
                  {meta.from ?? 0}
                </span>{" "}
                sampai{" "}
                <span className="font-medium text-[#00342b]">
                  {meta.to ?? 0}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-[#00342b]">
                  {meta.total ?? 0}
                </span>{" "}
                data
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-[#3f4945] hover:bg-[#f2f4f3] disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>

                {paginationRange().map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg font-medium text-sm flex items-center justify-center transition-colors
                    ${
                      p === page
                        ? "bg-[#006e2a] text-white shadow-sm"
                        : "text-[#3f4945] hover:bg-[#f2f4f3]"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                  disabled={page === totalPage}
                  className="p-1.5 rounded-lg text-[#3f4945] hover:bg-[#f2f4f3] disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}{" "}
      {/* end hasTabs conditional */}
    </>
  );
}
