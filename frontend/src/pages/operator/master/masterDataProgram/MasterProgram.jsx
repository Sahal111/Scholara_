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

// ─── Design tokens ────────────────────────────────────────────────────────────
// primary              = #00342b
// secondary            = #006e2a
// surface-card         = #f0f5ec
// surface-container-low= #f2f4f3
// surface-container    = #eceeed
// outline-variant      = #bfc9c4
// outline              = #707975
// text-secondary       = #3f4945
// error                = #ba1a1a
// ─────────────────────────────────────────────────────────────────────────────

// Jenis anak (konsentrasi / peminatan) yang muncul di tabel per program
const CHILD_JENIS = {
  bidang_keahlian: "program_keahlian",
  program_keahlian: "konsentrasi_keahlian",
  konsentrasi_keahlian: null, // leaf — tidak punya anak
  peminatan: null,
  umum: null,
};

const JENIS_LABEL = {
  bidang_keahlian: "Bidang Keahlian",
  program_keahlian: "Program Keahlian",
  konsentrasi_keahlian: "Konsentrasi Keahlian",
  peminatan: "Peminatan",
  umum: "Umum",
};

const JENIS_ICON = {
  bidang_keahlian: "category",
  program_keahlian: "school",
  konsentrasi_keahlian: "account_tree",
  peminatan: "psychology",
  umum: "star",
};

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

// ════════════════════════════════════════════════════════════════════════════
//  MODAL — Tambah / Edit Program (jenis: bidang_keahlian / peminatan / umum)
// ════════════════════════════════════════════════════════════════════════════
function ModalTambahProgram({ open, onClose, editData }) {
  const isEdit = !!editData;
  const qc = useQueryClient();

  const empty = {
    nama: "",
    kode: "",
    jenis: "bidang_keahlian",
    jenjang_sasaran: "semua",
    deskripsi: "",
    is_active: true,
    parent_id: null,
  };

  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setForm(
      editData
        ? {
            nama: editData.nama ?? "",
            kode: editData.kode ?? "",
            jenis: editData.jenis ?? "bidang_keahlian",
            jenjang_sasaran: editData.jenjang_sasaran ?? "semua",
            deskripsi: editData.deskripsi ?? "",
            is_active: editData.is_active ?? true,
            parent_id: editData.parent_id ?? null,
          }
        : { ...empty },
    );
  }, [open, editData]);

  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram(editData?.id);

  const handleSubmit = () => {
    if (!form.nama.trim()) {
      toast.error("Nama program wajib diisi.");
      return;
    }
    const payload = {
      ...form,
      kode: form.kode.trim() || null,
      parent_id: null,
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
                {isEdit ? "Edit Program" : "Tambah Program Baru"}
              </h3>
              <p className="text-xs text-[#707975]">
                Program akan muncul sebagai tab di halaman ini
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
            <div className="grid grid-cols-3 gap-2">
              {["bidang_keahlian", "peminatan", "umum"].map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => set("jenis", j)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center
                    ${
                      form.jenis === j
                        ? "border-[#006e2a] bg-[#006e2a]/5 text-[#006e2a]"
                        : "border-[#bfc9c4]/40 text-[#707975] hover:border-[#006e2a]/30"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {JENIS_ICON[j]}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide leading-tight">
                    {JENIS_LABEL[j]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nama */}
          <div>
            <label className={labelCls}>
              Nama Program <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="cth: Teknik Komputer dan Informatika"
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
            />
          </div>

          {/* Kode */}
          <div>
            <label className={labelCls}>Kode Program</label>
            <input
              className={inputCls + " uppercase"}
              placeholder="cth: TKI"
              value={form.kode}
              onChange={(e) => set("kode", e.target.value.toUpperCase())}
              maxLength={20}
            />
            <p className="text-[10px] text-[#707975] mt-1">
              Opsional. Digunakan sebagai label rombel (X TKI 1).
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
                className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${form.is_active ? "bg-[#006e2a]" : "bg-[#bfc9c4]"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.is_active ? "left-5" : "left-1"}`}
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

// ════════════════════════════════════════════════════════════════════════════
//  MODAL — Tambah / Edit Konsentrasi / Peminatan (child dari program aktif)
// ════════════════════════════════════════════════════════════════════════════
function ModalTambahKonsentrasi({ open, onClose, editData, parentProgram }) {
  const isEdit = !!editData;
  // Jenis child ditentukan dari jenis parent
  const childJenis = parentProgram
    ? (CHILD_JENIS[parentProgram.jenis] ?? "konsentrasi_keahlian")
    : "konsentrasi_keahlian";

  const empty = {
    parent_id: parentProgram?.id ?? null,
    nama: "",
    kode: "",
    jenis: childJenis,
    jenjang_sasaran: parentProgram?.jenjang_sasaran ?? "semua",
    deskripsi: "",
    is_active: true,
  };

  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setForm(
      editData
        ? {
            parent_id: editData.parent_id ?? parentProgram?.id ?? null,
            nama: editData.nama ?? "",
            kode: editData.kode ?? "",
            jenis: editData.jenis ?? childJenis,
            jenjang_sasaran: editData.jenjang_sasaran ?? "semua",
            deskripsi: editData.deskripsi ?? "",
            is_active: editData.is_active ?? true,
          }
        : { ...empty, parent_id: parentProgram?.id ?? null, jenis: childJenis },
    );
  }, [open, editData, parentProgram]);

  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram(editData?.id);

  const handleSubmit = () => {
    if (!form.nama.trim()) {
      toast.error("Nama wajib diisi.");
      return;
    }
    const payload = {
      ...form,
      kode: form.kode.trim() || null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
    };
    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(payload, { onSuccess: onClose });
  };

  if (!open) return null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const childLabel = JENIS_LABEL[childJenis] ?? "Konsentrasi";

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
                {isEdit ? "edit_note" : "account_tree"}
              </span>
            </div>
            <div>
              <h3
                className="text-base font-bold text-[#00342b]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {isEdit ? `Edit ${childLabel}` : `Tambah ${childLabel}`}
              </h3>
              {parentProgram && (
                <p className="text-xs text-[#707975]">
                  Untuk program:{" "}
                  <span className="font-semibold text-[#006e2a]">
                    {parentProgram.nama}
                  </span>
                </p>
              )}
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
          {/* Info jenis (read-only) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#006e2a]/5 border border-[#006e2a]/20 rounded-xl">
            <span className="material-symbols-outlined text-[18px] text-[#006e2a]">
              {JENIS_ICON[childJenis] ?? "account_tree"}
            </span>
            <span className="text-xs font-semibold text-[#006e2a]">
              {childLabel}
            </span>
          </div>

          {/* Nama */}
          <div>
            <label className={labelCls}>
              Nama {childLabel} <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              placeholder={`cth: Rekayasa Perangkat Lunak`}
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
            />
          </div>

          {/* Kode */}
          <div>
            <label className={labelCls}>Kode</label>
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
              placeholder="Deskripsi singkat..."
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
                className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${form.is_active ? "bg-[#006e2a]" : "bg-[#bfc9c4]"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.is_active ? "left-5" : "left-1"}`}
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
            {isEdit ? "Simpan Perubahan" : `Tambah ${childLabel}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MODAL — Konfirmasi Hapus
// ════════════════════════════════════════════════════════════════════════════
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
              Hapus {JENIS_LABEL[item.jenis] ?? "Data"}?
            </h3>
            <p className="text-sm text-[#707975]">
              <span className="font-semibold text-[#00342b]">{item.nama}</span>{" "}
              akan dihapus permanen.
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

// ════════════════════════════════════════════════════════════════════════════
//  AKSI DROPDOWN — per baris tabel
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
//  SKELETON ROWS
// ════════════════════════════════════════════════════════════════════════════
function SkeletonRows({ cols = 6 }) {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} className="border-b border-[#bfc9c4]/10 animate-pulse">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="py-4 px-6">
          <div
            className={`h-4 rounded bg-[#eceeed] ${j === 1 ? "w-48" : "w-16"}`}
          />
        </td>
      ))}
    </tr>
  ));
}

// ════════════════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ════════════════════════════════════════════════════════════════════════════
function EmptyState({ icon = "account_tree", message, actionLabel, onAction }) {
  return (
    <tr>
      <td colSpan={8} className="py-20 text-center text-[#707975]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-[#bfc9c4]">
            {icon}
          </span>
          <span className="text-sm font-medium">{message}</span>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-1 px-5 py-2 rounded-full bg-[#006e2a] text-white text-xs font-bold hover:bg-[#00531e] transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  HALAMAN UTAMA
// ════════════════════════════════════════════════════════════════════════════
export default function MasterProgram() {
  const qc = useQueryClient();

  // ── State: tab = program yang dipilih (id), null = belum ada program
  const [activeTabId, setActiveTabId] = useState(null);

  // ── State: filter & pagination untuk tabel konsentrasi
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  // ── State: modals
  const [modalProgram, setModalProgram] = useState(false);
  const [editProgram, setEditProgram] = useState(null); // edit program (tab)
  const [modalKonsentrasi, setModalKonsentrasi] = useState(false);
  const [editKonsentrasi, setEditKonsentrasi] = useState(null); // edit child
  const [deleteItem, setDeleteItem] = useState(null);

  // ────────────────────────────────────────────────────────────────────────
  //  Fetch semua "program induk" (bidang_keahlian, peminatan, umum) — untuk tabs
  //  Ambil semua tanpa paginasi (per_page tinggi)
  // ────────────────────────────────────────────────────────────────────────
  const { data: programsData, isLoading: programsLoading } = useProgramList({
    per_page: 100,
    jenis: "bidang_keahlian,peminatan,umum", // hanya level-1 program
  });

  // Fallback: kalau API belum support filter multi-jenis, ambil semua dan filter client-side
  const allPrograms = (
    programsData?.data?.data ??
    programsData?.data ??
    []
  ).filter(
    (p) =>
      !p.parent_id &&
      ["bidang_keahlian", "peminatan", "umum"].includes(p.jenis),
  );

  // Auto-select tab pertama saat data load
  useEffect(() => {
    if (!programsLoading && allPrograms.length > 0 && activeTabId === null) {
      setActiveTabId(allPrograms[0].id);
    }
  }, [programsLoading, allPrograms.length]);

  // Program yang aktif di tab
  const activeProgram = allPrograms.find((p) => p.id === activeTabId) ?? null;

  // Jenis child dari program aktif
  const childJenis = activeProgram ? CHILD_JENIS[activeProgram.jenis] : null;

  // ────────────────────────────────────────────────────────────────────────
  //  Fetch konsentrasi / peminatan milik program aktif
  // ────────────────────────────────────────────────────────────────────────
  const childQueryParams = {
    page,
    per_page: 10,
    parent_id: activeTabId,
    ...(childJenis && { jenis: childJenis }),
    ...(search && { search }),
    ...(filterStatus && { is_active: filterStatus }),
  };

  const { data: childData, isLoading: childLoading } = useProgramList(
    activeTabId ? childQueryParams : {},
  );

  const children = childData?.data?.data ?? [];
  const childMeta = childData?.data ?? {};
  const totalPage = childMeta.last_page ?? 1;

  // ────────────────────────────────────────────────────────────────────────
  //  Mutations
  // ────────────────────────────────────────────────────────────────────────
  const deleteMutation = useDeleteProgram();

  const handleToggleStatus = (item) => {
    useUpdateProgram(item.id).mutate(
      { ...item, is_active: !item.is_active },
      {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: ["program-pendidikan"] }),
      },
    );
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => setDeleteItem(null),
    });
  };

  // Tab change — reset child state
  const handleTabChange = (id) => {
    setActiveTabId(id);
    setPage(1);
    setSearch("");
    setFilterStatus("");
  };

  // ────────────────────────────────────────────────────────────────────────
  //  Pagination helper
  // ────────────────────────────────────────────────────────────────────────
  const paginationRange = () => {
    const range = [];
    for (let i = 1; i <= Math.min(totalPage, 7); i++) range.push(i);
    return range;
  };

  // ────────────────────────────────────────────────────────────────────────
  //  Label dinamis
  // ────────────────────────────────────────────────────────────────────────
  const childLabel = childJenis
    ? (JENIS_LABEL[childJenis] ?? "Konsentrasi")
    : "Konsentrasi";

  return (
    <>
      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ModalTambahProgram
        open={modalProgram}
        onClose={() => {
          setModalProgram(false);
          setEditProgram(null);
        }}
        editData={editProgram}
      />
      <ModalTambahKonsentrasi
        open={modalKonsentrasi}
        onClose={() => {
          setModalKonsentrasi(false);
          setEditKonsentrasi(null);
        }}
        editData={editKonsentrasi}
        parentProgram={activeProgram}
      />
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

        {/* Right — Buttons */}
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          {/* Tambah Konsentrasi/Peminatan — hanya tampil jika program aktif punya child */}
          {activeProgram && childJenis && (
            <button
              onClick={() => {
                setEditKonsentrasi(null);
                setModalKonsentrasi(true);
              }}
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
                Tambah {childLabel}
              </span>
            </button>
          )}

          {/* Tambah Program (induk baru) */}
          <button
            onClick={() => {
              setEditProgram(null);
              setModalProgram(true);
            }}
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
              Tambah Program
            </span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MAIN CARD
      ════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-[#bfc9c4]/20 overflow-hidden transition-all duration-500 hover:shadow-[0_10px_25px_-5px_rgba(0,52,43,0.1)]">
        {/* ── TABS (daftar program) ─────────────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-md rounded-t-[2rem] px-4 pt-4 pb-0 border-b border-[#bfc9c4]/20 relative overflow-hidden z-10">
          {/* Jika belum ada program */}
          {!programsLoading && allPrograms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#707975]">
              <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
                tab
              </span>
              <p className="text-sm font-medium">
                Belum ada program. Tambah program pertama Anda.
              </p>
            </div>
          )}

          {/* Skeleton tabs */}
          {programsLoading && (
            <div className="flex gap-2 pb-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-40 rounded-2xl bg-[#eceeed]" />
              ))}
            </div>
          )}

          {/* Tab list */}
          {!programsLoading && allPrograms.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0">
              {allPrograms.map((prog) => {
                const isActive = activeTabId === prog.id;
                return (
                  <div
                    key={prog.id}
                    className={`group relative flex items-center gap-2.5 px-5 py-3 rounded-t-2xl border-2 border-b-0
                      cursor-pointer flex-shrink-0 transition-all duration-200 select-none
                      ${
                        isActive
                          ? "bg-white border-[#006e2a]/30 border-b-white text-[#00342b] shadow-sm -mb-px z-10"
                          : "bg-[#f2f4f3] border-transparent text-[#707975] hover:bg-white/80 hover:text-[#3f4945]"
                      }`}
                    onClick={() => handleTabChange(prog.id)}
                  >
                    {/* Icon jenis */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                      ${isActive ? "bg-[#006e2a] text-white" : "bg-[#eceeed] text-[#707975] group-hover:bg-[#006e2a]/10 group-hover:text-[#006e2a]"}`}
                    >
                      <span
                        className="material-symbols-outlined text-[15px]"
                        style={
                          isActive ? { fontVariationSettings: "'FILL' 1" } : {}
                        }
                      >
                        {JENIS_ICON[prog.jenis] ?? "folder"}
                      </span>
                    </div>

                    {/* Nama */}
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-[12px] font-bold truncate max-w-[140px] ${isActive ? "text-[#00342b]" : "text-[#707975]"}`}
                      >
                        {prog.kode ? `[${prog.kode}] ` : ""}
                        {prog.nama}
                      </span>
                      <span
                        className={`text-[10px] ${isActive ? "text-[#006e2a]" : "text-[#bfc9c4]"}`}
                      >
                        {JENIS_LABEL[prog.jenis] ?? prog.jenis}
                      </span>
                    </div>

                    {/* Edit program (kecil, muncul saat hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditProgram(prog);
                        setModalProgram(true);
                      }}
                      className={`ml-1 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0
                        hover:bg-[#006e2a]/10 text-[#707975] hover:text-[#006e2a]`}
                      title="Edit program"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        edit
                      </span>
                    </button>
                  </div>
                );
              })}

              {/* Tombol tambah program di ujung tabs */}
              <button
                onClick={() => {
                  setEditProgram(null);
                  setModalProgram(true);
                }}
                className="flex items-center gap-1.5 px-4 py-3 rounded-t-2xl border-2 border-dashed border-[#bfc9c4]/40
                  text-[#707975] hover:text-[#006e2a] hover:border-[#006e2a]/40 hover:bg-[#006e2a]/5
                  flex-shrink-0 transition-all duration-200 self-stretch mb-0"
                title="Tambah program baru"
              >
                <span className="material-symbols-outlined text-[16px]">
                  add
                </span>
                <span className="text-[11px] font-bold">Baru</span>
              </button>
            </div>
          )}
        </div>

        {/* ── KONTEN: jika tidak ada program ───────────────────────── */}
        {!programsLoading && allPrograms.length === 0 && (
          <div className="py-24 flex flex-col items-center gap-4 text-[#707975]">
            <span className="material-symbols-outlined text-6xl text-[#bfc9c4]">
              school
            </span>
            <p className="text-sm font-medium text-center max-w-xs">
              Belum ada program pendidikan. Mulai dengan menambahkan program
              pertama.
            </p>
            <button
              onClick={() => {
                setEditProgram(null);
                setModalProgram(true);
              }}
              className="px-6 py-2.5 rounded-full bg-[#006e2a] text-white text-sm font-bold hover:bg-[#00531e] transition-colors"
            >
              + Tambah Program
            </button>
          </div>
        )}

        {/* ── KONTEN: program aktif dipilih ────────────────────────── */}
        {allPrograms.length > 0 && activeProgram && (
          <>
            {/* Info program aktif + note jika leaf node */}
            {!childJenis ? (
              // Leaf node — tidak punya anak, tampilkan info
              <div className="px-6 py-10 flex flex-col items-center gap-3 text-[#707975]">
                <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
                  info
                </span>
                <p className="text-sm font-medium text-center max-w-sm">
                  Program{" "}
                  <span className="font-bold text-[#00342b]">
                    {activeProgram.nama}
                  </span>{" "}
                  ({JENIS_LABEL[activeProgram.jenis]}) tidak memiliki
                  sub-program di bawahnya.
                </p>
              </div>
            ) : (
              <>
                {/* ── TOOLBAR ──────────────────────────────────────── */}
                <div className="bg-white border-b border-[#bfc9c4]/20 p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                  {/* Info program aktif */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#f2f4f3] rounded-xl border border-[#bfc9c4]/20 flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-[#006e2a]">
                      {JENIS_ICON[activeProgram.jenis]}
                    </span>
                    <span className="text-xs font-bold text-[#00342b] truncate max-w-[160px]">
                      {activeProgram.nama}
                    </span>
                    <span className="text-[10px] text-[#707975]">→</span>
                    <span className="text-[10px] font-semibold text-[#006e2a]">
                      {childLabel}
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative flex-1 group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]">
                      search
                    </span>
                    <input
                      className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3 pl-12 pr-4
                        text-[#191c1c] placeholder:text-[#707975]/50 focus:ring-2 focus:ring-[#006e2a]/20
                        focus:border-[#006e2a] transition-all font-medium text-sm outline-none"
                      placeholder={`Cari ${childLabel.toLowerCase()}...`}
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Filter Status */}
                    <div className="relative min-w-[150px]">
                      <select
                        className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3 pl-4 pr-10
                          text-[#191c1c] font-bold text-xs uppercase tracking-wider
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
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                        expand_more
                      </span>
                    </div>

                    <div className="hidden lg:block h-10 w-px bg-[#bfc9c4]/20" />

                    {/* Reset */}
                    <button
                      onClick={() => {
                        setSearch("");
                        setFilterStatus("");
                        setPage(1);
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#bfc9c4]/20
                        text-[#3f4945] hover:bg-red-50 hover:text-[#ba1a1a] hover:border-red-200
                        transition-all font-bold text-xs uppercase tracking-widest bg-white/50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        refresh
                      </span>
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* ── TABLE ────────────────────────────────────────── */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f2f4f3] border-b border-[#bfc9c4]/30 text-xs uppercase tracking-wider text-[#3f4945] font-semibold">
                        <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">
                          Kode
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wider">
                          Nama {childLabel}
                        </th>
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
                      {childLoading ? (
                        <SkeletonRows cols={6} />
                      ) : children.length === 0 ? (
                        <EmptyState
                          icon={JENIS_ICON[childJenis] ?? "account_tree"}
                          message={`Belum ada ${childLabel} untuk program ${activeProgram.nama}.`}
                          actionLabel={`+ Tambah ${childLabel}`}
                          onAction={() => {
                            setEditKonsentrasi(null);
                            setModalKonsentrasi(true);
                          }}
                        />
                      ) : (
                        children.map((item, idx) => (
                          <tr
                            key={item.id}
                            className={`border-b border-[#bfc9c4]/10 transition-colors hover:bg-[#006e2a]/[0.02] ${idx === children.length - 1 ? "border-b-0" : ""}`}
                          >
                            {/* Kode */}
                            <td className="py-4 px-6">
                              {item.kode ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#00342b]/5 text-[#00342b] font-bold text-[10px]">
                                  {item.kode}
                                </span>
                              ) : (
                                <span className="text-[#bfc9c4] text-xs">
                                  —
                                </span>
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
                                onEdit={(it) => {
                                  setEditKonsentrasi(it);
                                  setModalKonsentrasi(true);
                                }}
                                onDelete={setDeleteItem}
                                onToggleStatus={handleToggleStatus}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── PAGINATION ───────────────────────────────────── */}
                {!childLoading && children.length > 0 && (
                  <div className="px-6 py-4 border-t border-[#bfc9c4]/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                    <p className="text-sm text-[#3f4945]">
                      Menampilkan{" "}
                      <span className="font-medium text-[#00342b]">
                        {childMeta.from ?? 0}
                      </span>{" "}
                      sampai{" "}
                      <span className="font-medium text-[#00342b]">
                        {childMeta.to ?? 0}
                      </span>{" "}
                      dari{" "}
                      <span className="font-medium text-[#00342b]">
                        {childMeta.total ?? 0}
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
                            ${p === page ? "bg-[#006e2a] text-white shadow-sm" : "text-[#3f4945] hover:bg-[#f2f4f3]"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPage, p + 1))
                        }
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
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
