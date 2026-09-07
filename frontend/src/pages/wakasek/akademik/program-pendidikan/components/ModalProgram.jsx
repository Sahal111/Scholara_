import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useProgramDropdown,
  useCreateProgram,
  useUpdateProgram,
} from "../../../../../hooks/api/useProgramPendidikan";
import { JENIS_LABEL } from "../../../../../config/programConfig";

/* ─── Jenis context config (icon, colors, placeholder) ──────────────────────── */
const MODAL_CTX = {
  bidang_keahlian: {
    icon: "category",
    namePh: "cth: Teknologi Informasi dan Komunikasi",
    kodePh: "cth: TIK",
    kodeHint: "Digunakan sebagai prefix nama rombel.",
    desc: "Kelompok tertinggi — menaungi beberapa Program Keahlian.",
  },
  program_keahlian: {
    icon: "school",
    namePh: "cth: Teknik Komputer dan Informatika",
    kodePh: "cth: TKI",
    kodeHint: "Digunakan sebagai label dalam pemilihan rombel.",
    desc: "Berada di bawah Bidang Keahlian. Menaungi beberapa Konsentrasi.",
  },
  konsentrasi_keahlian: {
    icon: "account_tree",
    namePh: "cth: Rekayasa Perangkat Lunak",
    kodePh: "cth: RPL",
    kodeHint: "Dipakai sebagai label kelas, contoh: X RPL 1.",
    desc: "Level terdalam — langsung dikaitkan ke rombel dan mata pelajaran.",
  },
  peminatan: {
    icon: "psychology",
    namePh: "cth: MIPA / IPS / Bahasa dan Budaya",
    kodePh: "cth: IPA",
    kodeHint: "Dipakai sebagai label rombel, contoh: XI IPA 2.",
    desc: "Peminatan per rombel — berlaku untuk K13 SMA/MA.",
  },
  mata_pelajaran_pilihan: {
    icon: "menu_book",
    namePh: "cth: Kelompok MIPA",
    kodePh: "cth: MIPA",
    kodeHint: "Dipakai untuk pengelompokan mapel pilihan siswa.",
    desc: "Kurikulum Merdeka — siswa memilih mapel secara individual.",
  },
  keagamaan: {
    icon: "mosque",
    namePh: "cth: Tafsir-Ilmu Tafsir",
    kodePh: "cth: TAF",
    kodeHint: "Kode singkat program keagamaan.",
    desc: "Program keagamaan khas MA/MAN — Tafsir, Hadis, Fikih, Ilmu Kalam, Bahasa Arab.",
  },
  umum: {
    icon: "star",
    namePh: "Nama program pendidikan",
    kodePh: "cth: PRG",
    kodeHint: "Opsional. Digunakan sebagai label rombel.",
    desc: "Program fleksibel untuk jenjang atau kebutuhan khusus sekolah.",
  },
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

const parentJenisMap = {
  program_keahlian: "bidang_keahlian",
  konsentrasi_keahlian: "program_keahlian",
};

/* ─── Section Header ─────────────────────────────────────────────────────────── */
function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="px-3 py-1 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
        <span
          className="text-[9px] text-[#006e2a] tracking-[0.2em] uppercase font-black"
          style={{ fontFamily: "'Inter',sans-serif" }}
        >
          {label}
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
    </div>
  );
}

/* ─── Field Label ────────────────────────────────────────────────────────────── */
function FieldLabel({ htmlFor, required, optional, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-[#111827] mb-1.5"
      style={{ fontFamily: "'Inter',sans-serif" }}
    >
      {children}
      {required && <span className="text-[#ba1a1a] ml-0.5">*</span>}
      {optional && (
        <span className="text-[#707975] font-normal text-xs ml-1">
          (Opsional)
        </span>
      )}
    </label>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────────── */
const inputBase =
  "w-full bg-white text-[#191c1c] rounded-lg border border-[#bfc9c4]/50 focus:border-[#006e2a] focus:ring-4 focus:ring-[#006e2a]/10 focus:outline-none transition-all px-4 shadow-sm placeholder:text-[#707975]/50";

/* ─── ModalProgram ───────────────────────────────────────────────────────────── */
export default function ModalProgram({
  open,
  onClose,
  editData,
  defaultJenis,
  defaultParentId,
  defaultParentLabel,
  jenisOptions,
  schoolJenis,
}) {
  const isEdit = !!editData;
  const isJenisLocked = !isEdit && !!defaultJenis && defaultJenis !== "semua";
  const isParentLocked = !isEdit && !!defaultParentId;

  const resolveJenis = () =>
    defaultJenis && defaultJenis !== "semua"
      ? defaultJenis
      : (jenisOptions[0]?.value ?? "umum");

  const empty = {
    parent_id: defaultParentId ?? "",
    nama: "",
    kode: "",
    jenis: resolveJenis(),
    jenjang_sasaran: schoolJenis ?? "semua",
    deskripsi: "",
    is_active: true,
  };

  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ctx = MODAL_CTX[form.jenis] ?? MODAL_CTX.umum;

  const parentJenis = parentJenisMap[form.jenis];
  const { data: parentOpts } = useProgramDropdown(
    parentJenis ? { jenis: parentJenis } : {},
  );
  const parents = parentOpts?.data ?? [];

  useEffect(() => {
    if (!open) return;
    setForm(
      editData
        ? {
            parent_id: editData.parent_ulid ?? "",
            nama: editData.nama ?? "",
            kode: editData.kode ?? "",
            jenis: editData.jenis ?? resolveJenis(),
            jenjang_sasaran: editData.jenjang_sasaran ?? "semua",
            deskripsi: editData.deskripsi ?? "",
            is_active: editData.is_active ?? true,
          }
        : { ...empty, jenis: resolveJenis(), parent_id: defaultParentId ?? "" },
    );
  }, [open, editData, defaultJenis, defaultParentId]);

  const createMut = useCreateProgram();
  const updateMut = useUpdateProgram(editData?.ulid);
  const isPending = createMut.isPending || updateMut.isPending;

  const jenisLabel =
    jenisOptions.find((j) => j.value === form.jenis)?.label ??
    JENIS_LABEL[form.jenis] ??
    "Program";

  const handleSubmit = () => {
    if (!form.nama.trim()) {
      toast.error("Nama wajib diisi.");
      return;
    }
    const payload = {
      ...form,
      parent_id: form.parent_id || null,
      kode: form.kode.trim() || null,
    };
    (isEdit ? updateMut : createMut).mutate(payload, { onSuccess: onClose });
  };

  if (!open) return null;

  return createPortal(
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      {/* ── Modal Container ── */}
      <div
        className="bg-white w-full max-w-3xl rounded-3xl border border-white/20 flex flex-col overflow-hidden relative"
        style={{
          maxHeight: "90vh",
          boxShadow: "0 32px 64px -12px rgba(0, 52, 43, 0.30)",
          animation: "modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Atmospheric blob */}
        <div
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "rgba(0, 110, 42, 0.10)",
            filter: "blur(80px)",
          }}
        />

        {/* ── Header ── */}
        <div
          className="flex items-start justify-between border-b border-[#bfc9c4]/20 p-6 md:p-8 sticky top-0 z-10 rounded-t-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(to right, rgba(0,110,42,0.05), white, transparent)",
            backgroundColor: "#f2f4f3",
          }}
        >
          {/* Decorative corner */}
          <div
            className="absolute top-0 right-0 w-24 h-24 pointer-events-none -z-10"
            style={{
              background: "rgba(0, 110, 42, 0.20)",
              borderBottomLeftRadius: "80px",
            }}
          />

          <div className="flex flex-col gap-2">
            <h2
              className="text-3xl md:text-4xl font-extrabold text-[#00342b] tracking-tighter leading-none"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              {isEdit ? "Edit" : "Tambah"}{" "}
              <span
                className="text-[#006e2a] italic font-normal"
                style={{ fontFamily: "'EB Garamond',serif", fontSize: "1.1em" }}
              >
                Program Pendidikan
              </span>
            </h2>
            <p
              className="text-sm text-[#3f4945] leading-relaxed max-w-md"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              {isEdit
                ? `Ubah data ${jenisLabel.toLowerCase()} ini.`
                : "Tambahkan struktur kurikulum baru untuk jenjang pendidikan sekolah Anda."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#e1e3e2] text-[#3f4945] hover:bg-[#d8dada] hover:text-[#00342b] transition-all duration-300 shadow-sm active:scale-95 flex-shrink-0"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20 }}
            >
              close
            </span>
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div
          className="p-6 md:p-8 overflow-y-auto flex-1 relative z-10 space-y-10"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 transparent",
          }}
        >
          {/* Parent breadcrumb — only when locked parent exists */}
          {!isEdit && isParentLocked && parentJenis && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#006e2a]/20 bg-[#006e2a]/5">
              <span
                className="material-symbols-outlined text-[#006e2a]"
                style={{ fontSize: 16 }}
              >
                account_tree
              </span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-[#707975] uppercase tracking-wide whitespace-nowrap">
                  {JENIS_LABEL[parentJenis]}
                </span>
                <span
                  className="material-symbols-outlined text-[#bfc9c4]"
                  style={{ fontSize: 14 }}
                >
                  chevron_right
                </span>
                <span className="text-sm font-bold text-[#006e2a] truncate">
                  {defaultParentLabel ?? "Program terpilih"}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] whitespace-nowrap">
                Induk
              </span>
            </div>
          )}

          {/* ── Section 1: Hierarki & Relasi ── */}
          <section className="space-y-6">
            <SectionHeader label="Hierarki & Relasi" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Jenis Program */}
              <div>
                <FieldLabel htmlFor="jenis_program" required>
                  Jenis Program
                </FieldLabel>
                {isJenisLocked ? (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#bfc9c4]/50 bg-[#f2f4f3] text-sm font-semibold text-[#00342b]">
                    <span
                      className="material-symbols-outlined text-[#006e2a]"
                      style={{
                        fontSize: 18,
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      {ctx.icon}
                    </span>
                    {jenisLabel}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="jenis_program"
                      className={`${inputBase} py-2.5 text-sm appearance-none cursor-pointer pr-10`}
                      value={form.jenis}
                      onChange={(e) => set("jenis", e.target.value)}
                    >
                      {jenisOptions.map((j) => (
                        <option key={j.value} value={j.value}>
                          {j.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975]"
                      style={{ fontSize: 20 }}
                    >
                      expand_more
                    </span>
                  </div>
                )}
              </div>

              {/* Program Induk */}
              {parentJenis && !isParentLocked && (
                <div>
                  <FieldLabel htmlFor="program_induk" optional>
                    {JENIS_LABEL[parentJenis] ?? "Program Induk"}
                  </FieldLabel>
                  <div className="relative">
                    <select
                      id="program_induk"
                      className={`${inputBase} py-2.5 text-sm appearance-none cursor-pointer pr-10`}
                      value={form.parent_id}
                      onChange={(e) => set("parent_id", e.target.value)}
                    >
                      <option value="">— Pilih induk / isi nanti —</option>
                      {parents.map((p) => (
                        <option key={p.ulid} value={p.ulid}>
                          {p.kode ? `[${p.kode}] ` : ""}
                          {p.nama}
                        </option>
                      ))}
                    </select>
                    <span
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975]"
                      style={{ fontSize: 20 }}
                    >
                      expand_more
                    </span>
                  </div>
                </div>
              )}

              {isParentLocked && <input type="hidden" value={form.parent_id} />}
            </div>
          </section>

          {/* ── Section 2: Informasi Utama ── */}
          <section className="space-y-6">
            <SectionHeader label="Informasi Utama" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Program */}
              <div className="md:col-span-2">
                <FieldLabel htmlFor="nama_program" required>
                  Nama{" "}
                  <span className="font-normal text-[#3f4945]">
                    {jenisLabel}
                  </span>
                </FieldLabel>
                <input
                  id="nama_program"
                  type="text"
                  className={`${inputBase} py-3 text-base font-semibold`}
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                  placeholder={ctx.namePh}
                  value={form.nama}
                  onChange={(e) => set("nama", e.target.value)}
                />
              </div>

              {/* Kode */}
              <div>
                <FieldLabel htmlFor="kode_program" optional>
                  Kode Program
                </FieldLabel>
                <input
                  id="kode_program"
                  type="text"
                  maxLength={10}
                  className={`${inputBase} py-2.5 text-sm`}
                  placeholder={ctx.kodePh}
                  value={form.kode}
                  onChange={(e) => set("kode", e.target.value.toUpperCase())}
                />
                <p className="mt-1 text-[11px] text-[#707975]">
                  {ctx.kodeHint}
                </p>
              </div>

              {/* Jenjang Sasaran — read-only, sesuai jenis sekolah */}
              <div>
                <FieldLabel htmlFor="jenjang_sasaran">
                  Jenjang Sasaran
                </FieldLabel>
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#bfc9c4]/50 bg-[#f2f4f3]">
                  <span
                    className="material-symbols-outlined text-[#006e2a] flex-shrink-0"
                    style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
                  >
                    school
                  </span>
                  <span className="text-sm font-semibold text-[#00342b]">
                    {form.jenjang_sasaran === "semua"
                      ? "Semua Jenjang"
                      : form.jenjang_sasaran}
                  </span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] whitespace-nowrap">
                    Otomatis
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#707975]">
                  Disesuaikan otomatis berdasarkan jenis sekolah Anda.
                </p>
                <input type="hidden" value={form.jenjang_sasaran} />
              </div>
            </div>
          </section>

          {/* ── Section 3: Status & Keterangan ── */}
          <section className="space-y-6">
            <SectionHeader label="Status & Keterangan" />

            <div className="space-y-6">
              {/* Status toggle */}
              <div className="flex items-center justify-between gap-4 py-2 group/toggle">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#006e2a]/5 flex items-center justify-center flex-shrink-0 group-hover/toggle:bg-[#006e2a]/10 transition-colors">
                    <span
                      className="material-symbols-outlined text-[#006e2a]"
                      style={{ fontSize: 20 }}
                    >
                      auto_mode
                    </span>
                  </div>
                  <div>
                    <h4
                      className="text-base font-bold text-[#00342b]"
                      style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                    >
                      Status Program
                    </h4>
                    <p className="text-xs text-[#3f4945]/70 mt-0.5 leading-tight">
                      Program yang aktif dapat dipilih dalam penempatan siswa.
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                  />
                  <div
                    className="w-12 h-6 rounded-full shadow-inner transition-all duration-300 peer-focus:ring-4 peer-focus:ring-[#006e2a]/20
                      bg-[#e1e3e2]
                      peer-checked:bg-[#5cfd80]
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                      after:bg-white after:border after:border-gray-300 after:rounded-full
                      after:h-5 after:w-5 after:transition-all
                      peer-checked:after:translate-x-full peer-checked:after:border-white"
                  />
                </label>
              </div>

              {/* Deskripsi / Keterangan */}
              <div>
                <FieldLabel htmlFor="keterangan" optional>
                  Keterangan
                </FieldLabel>
                <textarea
                  id="keterangan"
                  rows={3}
                  className={`${inputBase} py-3 text-sm resize-none`}
                  placeholder={`Tambahkan deskripsi atau catatan tambahan mengenai program ini...`}
                  value={form.deskripsi}
                  onChange={(e) => set("deskripsi", e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 md:px-8 py-5 border-t border-[#bfc9c4]/20 flex items-center justify-end gap-4 sticky bottom-0 z-10"
          style={{
            backgroundColor: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center justify-end gap-4 w-full sm:w-auto">
            {/* Batal */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#eceeed] hover:text-[#00342b] transition-all duration-300"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              Batal
            </button>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 sm:flex-none px-10 py-3 rounded-xl bg-[#00342b] text-white font-bold text-[11px] tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60
                shadow-[0_8px_16px_rgba(0,52,43,0.20)]
                hover:bg-[#006e2a]
                hover:shadow-[0_15px_40px_rgba(0,110,42,0.40)]
                hover:-translate-y-0.5
                active:scale-95"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              {isPending ? (
                <>
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
                  Menyimpan...
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                  >
                    check_circle
                  </span>
                  {isEdit ? "Simpan Perubahan" : "Simpan Program"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe animation — injected inline once */}
      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .modal-scrollbar::-webkit-scrollbar { width: 6px; }
        .modal-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .modal-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>,
    document.body,
  );
}
