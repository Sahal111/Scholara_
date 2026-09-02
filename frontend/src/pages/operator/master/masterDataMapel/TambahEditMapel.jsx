import { useState, useEffect } from "react";
import { BookOpen, Hash, Clock, Layers } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import { useCreateMapel, useUpdateMapel } from "../../../../hooks/api/useMapel";
import { useAuth } from "../../../../contexts/AuthContext";

/* ── Konstanta ──────────────────────────────────────────────── */
const KELOMPOK_OPTIONS = [
  "A - Wajib",
  "B - Wajib",
  "C - Muatan Lokal",
  "Pengembangan Diri",
  "Ekstrakurikuler",
  "Lainnya",
];
const KURIKULUM_OPTIONS = ["Kurikulum 2013", "Kurikulum Merdeka", "Keduanya"];

function getTingkatByJenjang(jenjang) {
  if (jenjang === "dasar") return ["1", "2", "3", "4", "5", "6"];
  if (jenjang === "menengah_pertama") return ["7", "8", "9"];
  if (jenjang === "menengah_atas") return ["10", "11", "12"];
  return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
}

function getLabelTingkat(jenjang) {
  if (jenjang === "dasar") return "Kelas (SD/MI)";
  if (jenjang === "menengah_pertama") return "Kelas (SMP/MTs)";
  if (jenjang === "menengah_atas") return "Kelas (SMA/SMK/MA)";
  return "Kelas";
}

const emptyForm = {
  kode: "",
  nama_mapel: "",
  kelompok: "A - Wajib",
  tingkat: [],
  jam_per_minggu: "2",
  kurikulum: "Keduanya",
  is_active: true,
};

function parseTingkatFromRaw(raw) {
  if (!raw || String(raw).toLowerCase() === "semua") return [];
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/* ── Komponen ───────────────────────────────────────────────── */
export default function TambahEditMapel({ isOpen, onClose, editData }) {
  const isEdit = Boolean(editData);
  const { school } = useAuth();
  const jenjang = school?.jenjang ?? null;
  const tingkatOpts = getTingkatByJenjang(jenjang);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const toggleTingkat = (t) =>
    setForm((f) => {
      const cur = f.tingkat ?? [];
      return {
        ...f,
        tingkat: cur.includes(t)
          ? cur.filter((x) => x !== t)
          : [...cur, t].sort((a, b) => Number(a) - Number(b)),
      };
    });

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setForm(
      editData
        ? {
            kode: editData.kode ?? "",
            nama_mapel: editData.nama_mapel ?? "",
            kelompok: editData.kelompok ?? "A - Wajib",
            tingkat: parseTingkatFromRaw(editData.tingkat),
            jam_per_minggu: String(editData.jam_per_minggu ?? "2"),
            kurikulum: editData.kurikulum ?? "Keduanya",
            is_active: editData.is_active ?? true,
          }
        : emptyForm,
    );
  }, [isOpen, editData]);

  const createMapel = useCreateMapel();
  const updateMapel = useUpdateMapel();
  const isPending = createMapel.isPending || updateMapel.isPending;

  const handleSubmit = () => {
    const errs = {};
    if (!form.kode.trim()) errs.kode = "Kode wajib diisi.";
    if (!form.nama_mapel.trim()) errs.nama_mapel = "Nama wajib diisi.";
    if (!form.jam_per_minggu || Number(form.jam_per_minggu) < 1)
      errs.jam_per_minggu = "Jam per minggu minimal 1.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {
      kode: form.kode.trim().toUpperCase(),
      nama_mapel: form.nama_mapel.trim(),
      kelompok: form.kelompok,
      tingkat: form.tingkat,
      jam_per_minggu: Number(form.jam_per_minggu),
      kurikulum: form.kurikulum,
      is_active: form.is_active,
    };

    const mutate = isEdit
      ? updateMapel.mutateAsync({ id: editData.id, ...payload })
      : createMapel.mutateAsync(payload);

    mutate.then(onClose).catch((err) => {
      const serverErrors = err.response?.data?.errors ?? {};
      if (Object.keys(serverErrors).length) setErrors(serverErrors);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
      size="xl"
    >
      <div className="overflow-y-auto p-6 space-y-5 max-h-[70vh]">
        {/* Kode + Nama */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Kode <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
              />
              <input
                type="text"
                value={form.kode}
                onChange={(e) => set("kode", e.target.value)}
                placeholder="MTK, PAI…"
                maxLength={20}
                className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border bg-surface-container-lowest
                  focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700 transition-all
                  ${errors.kode ? "border-red-400" : "border-surface-container"}`}
              />
            </div>
            {errors.kode && (
              <p className="text-xs text-red-500 mt-1">{errors.kode}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Nama Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <BookOpen
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
              />
              <input
                type="text"
                value={form.nama_mapel}
                onChange={(e) => set("nama_mapel", e.target.value)}
                placeholder="Matematika, Bahasa Indonesia…"
                maxLength={150}
                className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border bg-surface-container-lowest
                  focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700 transition-all
                  ${errors.nama_mapel ? "border-red-400" : "border-surface-container"}`}
              />
            </div>
            {errors.nama_mapel && (
              <p className="text-xs text-red-500 mt-1">{errors.nama_mapel}</p>
            )}
          </div>
        </div>

        {/* Kelompok */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Kelompok <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {KELOMPOK_OPTIONS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => set("kelompok", k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${
                    form.kelompok === k
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-surface-container text-on-surface border-surface-container hover:border-emerald-700/50"
                  }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Tingkat — dinamis sesuai jenjang sekolah */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">
            <Layers size={12} className="inline mr-1" />
            {getLabelTingkat(jenjang)}
            <span className="ml-1 font-normal normal-case text-text-secondary">
              (kosong = berlaku semua tingkat)
            </span>
          </label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {tingkatOpts.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTingkat(t)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-all
                  ${
                    form.tingkat.includes(t)
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-surface-container text-on-surface border-surface-container hover:border-emerald-700/50"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
          {form.tingkat.length === 0 && (
            <p className="text-xs text-text-secondary mt-1.5">
              Tidak ada tingkat dipilih — mata pelajaran berlaku untuk semua
              tingkat.
            </p>
          )}
        </div>

        {/* Jam + Kurikulum */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Jam per Minggu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
              />
              <input
                type="number"
                min={1}
                max={40}
                value={form.jam_per_minggu}
                onChange={(e) => set("jam_per_minggu", e.target.value)}
                className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border bg-surface-container-lowest
                  focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700 transition-all
                  ${errors.jam_per_minggu ? "border-red-400" : "border-surface-container"}`}
              />
            </div>
            {errors.jam_per_minggu && (
              <p className="text-xs text-red-500 mt-1">
                {errors.jam_per_minggu}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Kurikulum <span className="text-red-500">*</span>
            </label>
            <select
              value={form.kurikulum}
              onChange={(e) => set("kurikulum", e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-container
                bg-surface-container-lowest focus:outline-none focus:ring-2
                focus:ring-emerald-600/30 focus:border-emerald-700 transition-all"
            >
              {KURIKULUM_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle Status — hanya saat edit */}
        {isEdit && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => set("is_active", !form.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                ${form.is_active ? "bg-emerald-700" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${form.is_active ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span className="text-sm text-on-surface">
              Status: <strong>{form.is_active ? "Aktif" : "Non-aktif"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-container shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-surface-container
            text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-800
            text-white transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isPending
            ? "Menyimpan…"
            : isEdit
              ? "Simpan Perubahan"
              : "Tambah Mapel"}
        </button>
      </div>
    </Modal>
  );
}
