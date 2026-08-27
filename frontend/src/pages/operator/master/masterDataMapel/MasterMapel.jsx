import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

/* ─── Konstanta ──────────────────────────────────────────────── */
const KELOMPOK_OPTIONS = [
  "A - Wajib",
  "B - Wajib",
  "C - Muatan Lokal",
  "Pengembangan Diri",
  "Ekstrakurikuler",
  "Lainnya",
];
const TINGKAT_OPTIONS = ["1", "2", "3", "4", "5", "6"];
const KURIKULUM_OPTIONS = ["Kurikulum 2013", "Kurikulum Merdeka", "Keduanya"];

const KELOMPOK_BADGE = {
  "A - Wajib": "bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]",
  "B - Wajib": "bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]",
  "C - Muatan Lokal": "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]",
  "Pengembangan Diri": "bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe]",
  Ekstrakurikuler: "bg-[#fce7f3] text-[#9d174d] border border-[#fbcfe8]",
  Lainnya: "bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]",
};

/* ─── Modal Tambah/Edit ───────────────────────────────────────── */
function ModalMapel({ open, onClose, editData, queryClient }) {
  const isEdit = !!editData;

  const parseTingkat = (raw) => {
    if (!raw || raw === "Semua") return [];
    return String(raw)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  };

  const emptyForm = {
    kode: "",
    nama_mapel: "",
    kelompok: "A - Wajib",
    tingkat: [],
    jam_per_minggu: "2",
    kurikulum: "Keduanya",
    is_active: true,
  };

  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTingkat = (t) => {
    setForm((f) => {
      const cur = f.tingkat ?? [];
      return {
        ...f,
        tingkat: cur.includes(t)
          ? cur.filter((x) => x !== t)
          : [...cur, t].sort(),
      };
    });
  };

  useEffect(() => {
    if (open) {
      setForm(
        editData
          ? {
              ...editData,
              kode: editData.kode ?? "",
              jam_per_minggu: String(editData.jam_per_minggu),
              tingkat: parseTingkat(editData.tingkat),
            }
          : emptyForm,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.put(`/operator/master-data/mapel/${editData.id}`, data)
        : api.post("/operator/master-data/mapel", data),
    onSuccess: () => {
      toast.success(
        `Mata pelajaran berhasil ${isEdit ? "diperbarui" : "ditambahkan"}.`,
      );
      queryClient.invalidateQueries(["master-mapel"]);
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
    "w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 px-4 text-[#191c1c] placeholder:text-[#3f4945]/50 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all font-medium text-sm outline-none";
  const labelCls =
    "block text-xs font-black text-[#3f4945] uppercase tracking-widest mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-[#bfc9c4]/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#bfc9c4]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006e2a]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-[#006e2a]">
                {isEdit ? "edit_note" : "add_circle"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-[#00342b] text-lg">
                {isEdit ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
              </h3>
              <p className="text-xs text-[#3f4945]/70 mt-0.5">
                {isEdit
                  ? "Perbarui data mata pelajaran"
                  : "Isi data mata pelajaran baru"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#3f4945] hover:bg-[#f2f4f3] hover:text-[#191c1c] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[68vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Kode Mapel <span className="text-red-500">*</span>
              </label>
              <input
                value={form.kode}
                onChange={(e) => set("kode", e.target.value.toUpperCase())}
                placeholder="MTK, IPA, ..."
                maxLength={20}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Jam / Minggu <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={form.jam_per_minggu}
                onChange={(e) => set("jam_per_minggu", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Nama Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <input
              value={form.nama_mapel}
              onChange={(e) => set("nama_mapel", e.target.value)}
              placeholder="Contoh: Matematika"
              maxLength={100}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Kelompok <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.kelompok}
                onChange={(e) => set("kelompok", e.target.value)}
                className={inputCls + " appearance-none pr-10 cursor-pointer"}
              >
                {KELOMPOK_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Tingkat <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => set("tingkat", [])}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border transition-colors ${
                  (form.tingkat ?? []).length === 0
                    ? "bg-[#006e2a] text-white border-[#006e2a]"
                    : "bg-[#f2f4f3]/50 text-[#3f4945] border-[#bfc9c4]/20 hover:border-[#006e2a]/50"
                }`}
              >
                Semua
              </button>
              {TINGKAT_OPTIONS.map((t) => {
                const selected = (form.tingkat ?? []).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTingkat(t)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border transition-colors ${
                      selected
                        ? "bg-[#006e2a]/10 text-[#006e2a] border-[#006e2a]/30"
                        : "bg-[#f2f4f3]/50 text-[#3f4945] border-[#bfc9c4]/20 hover:border-[#006e2a]/50"
                    }`}
                  >
                    Tk. {t}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#3f4945]/70 mt-2">
              {(form.tingkat ?? []).length === 0
                ? "Berlaku untuk semua tingkat (1–6)"
                : `Dipilih: Tingkat ${(form.tingkat ?? []).join(", ")}`}
            </p>
          </div>

          <div>
            <label className={labelCls}>
              Kurikulum <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.kurikulum}
                onChange={(e) => set("kurikulum", e.target.value)}
                className={inputCls + " appearance-none pr-10 cursor-pointer"}
              >
                {KURIKULUM_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between bg-[#f2f4f3]/50 rounded-2xl px-5 py-4 border border-[#bfc9c4]/20">
              <div>
                <p className="text-sm font-bold text-[#191c1c]">Status Aktif</p>
                <p className="text-xs text-[#3f4945]/70 mt-0.5">
                  {form.is_active
                    ? "Mapel ini aktif dan dapat digunakan"
                    : "Mapel ini tidak aktif"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.is_active ? "bg-[#006e2a]" : "bg-[#bfc9c4]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-[#bfc9c4]/20">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[#bfc9c4]/30 rounded-2xl text-[#191c1c] font-bold text-sm hover:bg-[#f2f4f3] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="flex-1 py-3 bg-[#006e2a] text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#065043] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#006e2a]/20"
          >
            {mutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  save
                </span>
                {isEdit ? "Perbarui" : "Simpan"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Import ───────────────────────────────────────────── */
function ModalImport({ open, onClose, queryClient }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setResult(null);
    }
  }, [open]);

  const importMutation = useMutation({
    mutationFn: (formData) =>
      api.post("/operator/master-data/mapel/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (res) => {
      setResult(res.data);
      queryClient.invalidateQueries(["master-mapel"]);
      if (res.data.imported > 0)
        toast.success(`${res.data.imported} data berhasil diimpor!`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal mengimpor file.");
    },
  });

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Hanya file Excel (.xlsx / .xls) yang diizinkan.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    importMutation.mutate(fd);
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get("/operator/master-data/mapel/template", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_import_mapel.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal mengunduh template.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-[#bfc9c4]/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#bfc9c4]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3f2900]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-[#3f2900]">
                upload_file
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-[#00342b] text-lg">
                Import Mata Pelajaran
              </h3>
              <p className="text-xs text-[#3f4945]/70 mt-0.5">
                Upload file Excel (.xlsx) untuk import massal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#3f4945] hover:bg-[#f2f4f3] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Format info */}
          <div className="bg-[#ffdead]/20 border border-[#ffdead]/40 rounded-2xl p-4">
            <p className="text-xs font-black text-[#3f2900] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
              <span className="material-symbols-outlined text-[16px]">
                info
              </span>
              Format Excel yang Diperlukan
            </p>
            <p className="text-xs text-[#3f2900]/80 font-mono bg-white/70 rounded-xl px-3 py-2 border border-[#ffdead]/30">
              kode | nama_mapel | kelompok | tingkat | jam_per_minggu |
              kurikulum
            </p>
            <ul className="text-xs text-[#3f4945] mt-2 space-y-1 list-disc list-inside">
              <li>
                <span className="font-bold">kelompok</span>: A - Wajib / B -
                Wajib / C - Muatan Lokal / ...
              </li>
              <li>
                <span className="font-bold">tingkat</span>: Semua / angka
                dipisah koma (1,2,3)
              </li>
              <li>
                <span className="font-bold">kurikulum</span>: Kurikulum 2013 /
                Kurikulum Merdeka / Keduanya
              </li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-3 flex items-center gap-1.5 text-xs font-black text-[#3f2900] hover:underline uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[14px]">
                download
              </span>
              Unduh Template Excel (.xlsx)
            </button>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-[#006e2a] bg-[#006e2a]/5"
                  : file
                    ? "border-[#006e2a] bg-[#d1fae5]/30"
                    : "border-[#bfc9c4]/40 hover:border-[#006e2a]/50 hover:bg-[#f2f4f3]/50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <span className="material-symbols-outlined text-[36px] text-[#006e2a] mb-2">
                    check_circle
                  </span>
                  <p className="text-sm font-bold text-[#191c1c]">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#3f4945]/70 mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Klik untuk ganti file
                  </p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[36px] text-[#707975] mb-2">
                    cloud_upload
                  </span>
                  <p className="text-sm font-bold text-[#191c1c]">
                    Drag & drop file Excel di sini
                  </p>
                  <p className="text-xs text-[#3f4945]/70 mt-1">
                    atau klik untuk memilih file (.xlsx / .xls)
                  </p>
                </>
              )}
            </div>
          )}

          {/* Hasil import */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#d1fae5] border border-[#006e2a]/20 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-[#006e2a]">
                    {result.imported}
                  </p>
                  <p className="text-xs text-[#3f4945] mt-1 font-medium">
                    Data Diimpor
                  </p>
                </div>
                <div
                  className={`border rounded-2xl p-4 text-center ${result.skipped > 0 ? "bg-[#fef3c7] border-[#fde68a]" : "bg-[#f2f4f3] border-[#bfc9c4]/20"}`}
                >
                  <p
                    className={`text-2xl font-extrabold ${result.skipped > 0 ? "text-[#92400e]" : "text-[#707975]"}`}
                  >
                    {result.skipped}
                  </p>
                  <p className="text-xs text-[#3f4945] mt-1 font-medium">
                    Baris Dilewati
                  </p>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-2xl p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-black text-[#ba1a1a] mb-1.5 flex items-center gap-1 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[14px]">
                      warning
                    </span>
                    Detail Baris Bermasalah
                  </p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-[#ba1a1a]/80 font-mono">
                      • {e}
                    </p>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="w-full py-2.5 border border-[#bfc9c4]/30 rounded-2xl text-sm font-bold text-[#3f4945] hover:bg-[#f2f4f3] transition-colors"
              >
                Import File Lain
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result ? (
          <div className="flex gap-3 px-6 py-5 border-t border-[#bfc9c4]/20">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-[#bfc9c4]/30 rounded-2xl text-[#191c1c] font-bold text-sm hover:bg-[#f2f4f3] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || importMutation.isPending}
              className="flex-1 py-3 bg-[#006e2a] text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#065043] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#006e2a]/20"
            >
              {importMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    upload
                  </span>
                  Proses Import
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 border-t border-[#bfc9c4]/20">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#006e2a] text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#065043] transition-colors shadow-lg shadow-[#006e2a]/20"
            >
              Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Modal Hapus ────────────────────────────────────────────── */
function ModalHapus({ target, onClose, onConfirm, isPending }) {
  if (!target) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 text-center border border-[#bfc9c4]/20">
        <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-[28px] text-[#ba1a1a]">
            delete_forever
          </span>
        </div>
        <h3 className="text-xl font-extrabold text-[#00342b] mb-2">
          Hapus Mata Pelajaran?
        </h3>
        <p className="text-sm text-[#3f4945] mb-8 leading-relaxed">
          Mata pelajaran{" "}
          <span className="font-bold text-[#191c1c]">{target.nama_mapel}</span>{" "}
          akan dihapus secara permanen dan tidak dapat dikembalikan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[#bfc9c4]/30 rounded-2xl text-[#191c1c] font-bold text-sm hover:bg-[#f2f4f3] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  delete
                </span>
                Ya, Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Halaman Utama ──────────────────────────────────────────── */
export default function MasterMapel() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKelompok, setFilterKelompok] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, filterKelompok, filterTingkat, filterStatus]);

  /* ── Query ── */
  const { data, isLoading } = useQuery({
    queryKey: [
      "master-mapel",
      search,
      filterKelompok,
      filterTingkat,
      filterStatus,
      page,
    ],
    queryFn: () =>
      api
        .get("/operator/master-data/mapel", {
          params: {
            search: search || undefined,
            kelompok: filterKelompok || undefined,
            tingkat: filterTingkat || undefined,
            is_active: filterStatus !== "" ? filterStatus : undefined,
            page,
          },
        })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  /* ── Mutations ── */
  const toggleActive = useMutation({
    mutationFn: (id) =>
      api.patch(`/operator/master-data/mapel/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries(["master-mapel"]),
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal."),
  });

  const hapus = useMutation({
    mutationFn: (id) => api.delete(`/operator/master-data/mapel/${id}`),
    onSuccess: () => {
      toast.success("Mata pelajaran dihapus.");
      queryClient.invalidateQueries(["master-mapel"]);
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus.");
      setDeleteTarget(null);
    },
  });

  /* ── Export ── */
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await api.get("/operator/master-data/mapel/export", {
        params: {
          kelompok: filterKelompok || undefined,
          tingkat: filterTingkat || undefined,
          is_active: filterStatus !== "" ? filterStatus : undefined,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `master_mapel_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data berhasil diekspor.");
    } catch {
      toast.error("Gagal mengekspor data.");
    } finally {
      setExportLoading(false);
    }
  };

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalData = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;
  const totalAktif = list.filter((m) => m.is_active).length;

  const hasActiveFilters =
    filterKelompok || filterTingkat || filterStatus || search;

  const resetFilters = () => {
    setSearch("");
    setFilterKelompok("");
    setFilterTingkat("");
    setFilterStatus("");
    setPage(1);
  };

  /* ── Helpers ── */
  const renderTingkat = (tingkat) => {
    const raw = tingkat ? String(tingkat).trim() : "";
    if (!raw || raw.toLowerCase() === "semua") {
      return (
        <span className="px-2.5 py-1 bg-[#dbeafe] text-[#1e40af] rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
          Semua
        </span>
      );
    }
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (
        <span
          key={t}
          className="px-2 py-1 bg-[#006e2a]/10 text-[#006e2a] rounded-full text-[11px] font-bold whitespace-nowrap"
        >
          Tk.{t}
        </span>
      ));
  };

  const renderKurikulum = (kurikulum) => {
    if (kurikulum === "Keduanya")
      return (
        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] whitespace-nowrap">
            K2013
          </span>
          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] whitespace-nowrap">
            Merdeka
          </span>
        </div>
      );
    if (kurikulum === "Kurikulum 2013")
      return (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] whitespace-nowrap">
          K2013
        </span>
      );
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] whitespace-nowrap">
        Merdeka
      </span>
    );
  };

  /* ── Render Pagination Pages ── */
  const renderPages = () => {
    const pages = [];
    const total = lastPage;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(total - 1, page + 1);
        i++
      )
        pages.push(i);
      if (page < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="space-y-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex-1">
          {/* Breadcrumb badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1.5 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse" />
              <span className="text-[10px] text-[#006e2a] tracking-[0.2em] uppercase font-black">
                MASTER DATA
              </span>
            </div>
            <div className="h-px w-24 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-5xl text-[#00342b] font-extrabold leading-tight tracking-tighter mb-3">
            Mata{" "}
            <span className="font-['EB_Garamond'] italic text-[#006e2a] font-normal">
              Pelajaran
            </span>
          </h1>
          <p className="text-[#3f4945] max-w-2xl leading-relaxed opacity-80 text-base">
            Kelola daftar mata pelajaran, kelompok, kurikulum, dan status
            pembelajaran secara terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setImportOpen(true)}
            className="px-5 py-2.5 rounded-full border border-[#bfc9c4]/30 text-[#00342b] hover:bg-[#f2f4f3]/50 transition-all flex items-center gap-2 font-bold text-sm bg-white/50 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              upload
            </span>
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="px-5 py-2.5 rounded-full border border-[#bfc9c4]/30 text-[#00342b] hover:bg-[#f2f4f3]/50 transition-all flex items-center gap-2 font-bold text-sm bg-white/50 backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <div className="w-4 h-4 border-2 border-[#00342b] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
            )}
            {exportLoading ? "Mengekspor..." : "Export"}
          </button>
          <button
            onClick={() => {
              setEditData(null);
              setModalOpen(true);
            }}
            className="bg-[#006e2a] text-white px-7 py-3.5 rounded-full font-black text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-[#006e2a]/30 hover:shadow-[#006e2a]/50 hover:-translate-y-0.5 hover:scale-[1.03] transition-all duration-300 group border border-white/20 uppercase"
          >
            <div className="bg-white/20 rounded-full p-1 group-hover:rotate-90 transition-transform duration-500">
              <span className="material-symbols-outlined text-[18px] block">
                add
              </span>
            </div>
            Tambah Mata Pelajaran
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {[
          {
            icon: "menu_book",
            label: "Mata Pelajaran",
            badge: "Total",
            value: isLoading ? "—" : totalData,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
          {
            icon: "check_circle",
            label: "Status Aktif",
            badge: "Aktif",
            value: isLoading ? "—" : totalAktif,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
          {
            icon: "cancel",
            label: "Non-Aktif",
            badge: "Inaktif",
            value: isLoading ? "—" : list.length - totalAktif,
            iconBg: "bg-[#bfc9c4]/20",
            iconColor: "text-[#707975]",
            hoverBg: "group-hover:bg-[#707975] group-hover:text-white",
          },
          {
            icon: "layers",
            label: "Halaman Ini",
            badge: "Tampil",
            value: isLoading ? "—" : list.length,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
          {
            icon: "category",
            label: "Kelompok Mapel",
            badge: "Grup",
            value: isLoading
              ? "—"
              : [...new Set(list.map((m) => m.kelompok))].length,
            iconBg: "bg-[#006e2a]/10",
            iconColor: "text-[#006e2a]",
            hoverBg: "group-hover:bg-[#006e2a] group-hover:text-white",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#bfc9c4]/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} ${stat.hoverBg} transition-colors duration-300`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {stat.icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-black tracking-widest uppercase opacity-50 ${stat.iconColor}`}
              >
                {stat.badge}
              </span>
            </div>
            <p className="text-[10px] font-black text-[#3f4945] uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <h2 className="text-3xl font-extrabold text-[#00342b] tracking-tighter">
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white border border-[#bfc9c4]/20 rounded-[2rem] p-4 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707975] group-focus-within:text-[#006e2a] transition-colors text-[20px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari mata pelajaran, kode, atau kategori..."
            className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-12 pr-4 text-[#191c1c] placeholder:text-[#3f4945]/50 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all font-medium text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
          {/* Status */}
          <div className="relative min-w-[150px] flex-1 lg:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-black text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
            >
              <option value="">Status: Semua</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
              expand_more
            </span>
          </div>

          {/* Kelompok */}
          <div className="relative min-w-[180px] flex-1 lg:flex-none">
            <select
              value={filterKelompok}
              onChange={(e) => setFilterKelompok(e.target.value)}
              className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-black text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
            >
              <option value="">Kelompok: Semua</option>
              {KELOMPOK_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
              expand_more
            </span>
          </div>

          {/* Tingkat */}
          <div className="relative min-w-[160px] flex-1 lg:flex-none">
            <select
              value={filterTingkat}
              onChange={(e) => setFilterTingkat(e.target.value)}
              className="w-full bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-2xl py-3.5 pl-4 pr-10 text-[#191c1c] font-black text-xs uppercase tracking-wider focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] appearance-none cursor-pointer transition-all outline-none"
            >
              <option value="">Tingkat: Semua</option>
              {TINGKAT_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  Tingkat {t}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707975] text-[20px]">
              expand_more
            </span>
          </div>

          <div className="h-10 w-px bg-[#bfc9c4]/20 hidden lg:block mx-1" />

          <button
            onClick={resetFilters}
            title="Reset Filter"
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-[#bfc9c4]/20 text-[#3f4945] hover:bg-[#ffdad6]/20 hover:text-[#ba1a1a] hover:border-[#ba1a1a]/30 transition-all font-black text-xs uppercase tracking-widest bg-white/50 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">
              filter_alt_off
            </span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-[2rem] border border-[#bfc9c4]/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-[#006e2a] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-[#3f4945]">
                Memuat data...
              </p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-20 h-20 bg-[#006e2a]/5 rounded-full flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[36px] text-[#006e2a]">
                  auto_stories
                </span>
              </div>
              <p className="text-lg font-extrabold text-[#00342b] mb-2">
                {hasActiveFilters
                  ? "Tidak ada hasil ditemukan"
                  : "Belum ada mata pelajaran"}
              </p>
              <p className="text-sm text-[#3f4945]/70 mb-8 max-w-sm">
                {hasActiveFilters
                  ? "Coba ubah kata kunci atau filter pencarian"
                  : "Mulai tambahkan mata pelajaran baru atau import dari Excel"}
              </p>
              {!hasActiveFilters && (
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => setImportOpen(true)}
                    className="px-6 py-3 rounded-full border border-[#bfc9c4]/30 text-[#00342b] font-bold text-sm hover:bg-[#f2f4f3] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      upload_file
                    </span>
                    Import Excel
                  </button>
                  <button
                    onClick={() => {
                      setEditData(null);
                      setModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-full bg-[#006e2a] text-white font-black text-sm hover:bg-[#065043] transition-colors flex items-center gap-2 shadow-lg shadow-[#006e2a]/20 uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add
                    </span>
                    Tambah Manual
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f3]/50 border-b border-[#bfc9c4]/20 text-[10px] text-[#3f4945] uppercase tracking-[0.2em] font-black">
                  <th className="py-5 px-6">Kode</th>
                  <th className="py-5 px-6">Mata Pelajaran</th>
                  <th className="py-5 px-6">Kelompok</th>
                  <th className="py-5 px-6">Kurikulum</th>
                  <th className="py-5 px-6">Jenjang / Tingkat</th>
                  <th className="py-5 px-6 text-center">Jam/Minggu</th>
                  <th className="py-5 px-6">Status</th>
                  <th className="py-5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#191c1c] divide-y divide-[#bfc9c4]/10">
                {list.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-[#f2f4f3]/30 transition-all duration-300 group ${!m.is_active ? "opacity-60" : ""}`}
                  >
                    <td className="py-5 px-6 font-mono text-sm text-[#006e2a] font-bold">
                      {m.kode}
                    </td>

                    <td className="py-5 px-6 font-bold text-[#00342b]">
                      {m.nama_mapel}
                    </td>

                    <td className="py-5 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${KELOMPOK_BADGE[m.kelompok] ?? "bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]"}`}
                      >
                        {m.kelompok}
                      </span>
                    </td>

                    <td className="py-5 px-6">
                      {renderKurikulum(m.kurikulum)}
                    </td>

                    <td className="py-5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {renderTingkat(m.tingkat)}
                      </div>
                    </td>

                    <td className="py-5 px-6 text-center">
                      <span className="font-bold text-[#00342b]">
                        {m.jam_per_minggu}
                      </span>
                      <span className="text-[#707975] text-xs"> jam</span>
                    </td>

                    <td className="py-5 px-6">
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-black text-[11px] uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f3] text-[#707975] font-black text-[11px] uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#707975]" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => toggleActive.mutate(m.id)}
                          title={m.is_active ? "Non-aktifkan" : "Aktifkan"}
                          className={`p-2 rounded-lg transition-colors ${
                            m.is_active
                              ? "text-[#3f4945] hover:text-[#92400e] hover:bg-[#fef3c7]"
                              : "text-[#3f4945] hover:text-[#006e2a] hover:bg-[#d1fae5]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {m.is_active ? "toggle_on" : "toggle_off"}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setEditData({ ...m });
                            setModalOpen(true);
                          }}
                          className="p-2 text-[#3f4945] hover:text-[#00342b] hover:bg-[#afefdd]/30 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="p-2 text-[#3f4945] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!isLoading && list.length > 0 && (
          <div className="p-6 border-t border-[#bfc9c4]/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#f2f4f3]/30">
            <p className="text-sm font-medium text-[#3f4945]">
              Menampilkan{" "}
              <span className="text-[#00342b] font-bold">
                {meta?.from ?? 1}
              </span>{" "}
              sampai{" "}
              <span className="text-[#00342b] font-bold">
                {meta?.to ?? list.length}
              </span>{" "}
              dari <span className="text-[#00342b] font-bold">{totalData}</span>{" "}
              entri
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#bfc9c4]/30 text-[#707975] hover:bg-white hover:text-[#006e2a] hover:border-[#006e2a]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_left
                </span>
              </button>

              <div className="flex items-center gap-1">
                {renderPages().map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-1 text-[#bfc9c4]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                        page === p
                          ? "bg-[#006e2a] text-white shadow-sm shadow-[#006e2a]/20"
                          : "border border-transparent text-[#3f4945] hover:bg-white hover:border-[#bfc9c4]/30"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#bfc9c4]/30 text-[#00342b] bg-white hover:bg-[#006e2a] hover:text-white hover:border-[#006e2a] transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ModalMapel
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
        queryClient={queryClient}
      />
      <ModalHapus
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => hapus.mutate(deleteTarget.id)}
        isPending={hapus.isPending}
      />
      <ModalImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        queryClient={queryClient}
      />
    </div>
  );
}
