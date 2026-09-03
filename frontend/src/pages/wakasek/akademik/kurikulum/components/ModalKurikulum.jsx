import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  useCreateKurikulum,
  useUpdateKurikulum,
} from "@/hooks/api/useKurikulum";

const JENIS_OPTIONS = [
  { value: "nasional", label: "Nasional" },
  { value: "internasional", label: "Internasional" },
  { value: "lokal", label: "Lokal / Mulok" },
];

const KATEGORI_OPTIONS = [
  { value: "pengetahuan", label: "Pengetahuan / Kognitif" },
  { value: "keterampilan", label: "Keterampilan / Psikomotorik" },
  { value: "sikap", label: "Sikap / Afektif" },
  { value: "projek", label: "Projek (P5/P2RA)" },
  { value: "ekstrakurikuler", label: "Ekstrakurikuler" },
  { value: "lainnya", label: "Lainnya" },
];

const EMPTY_KOMPONEN = {
  nama: "",
  kode: "",
  kategori: "pengetahuan",
  bobot_persen: "",
  urutan: 1,
  is_wajib: true,
};

function KomponenRow({ komponen, index, onChange, onRemove, canRemove }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-3">
        <input
          type="text"
          placeholder="Nama komponen"
          value={komponen.nama}
          onChange={(e) => onChange(index, "nama", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
        />
      </div>
      <div className="col-span-2">
        <input
          type="text"
          placeholder="Kode"
          value={komponen.kode}
          onChange={(e) => onChange(index, "kode", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
        />
      </div>
      <div className="col-span-3">
        <select
          value={komponen.kategori}
          onChange={(e) => onChange(index, "kategori", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
        >
          {KATEGORI_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <input
          type="number"
          placeholder="Bobot %"
          min={0}
          max={100}
          value={komponen.bobot_persen}
          onChange={(e) => onChange(index, "bobot_persen", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
        />
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <input
          type="checkbox"
          checked={komponen.is_wajib}
          onChange={(e) => onChange(index, "is_wajib", e.target.checked)}
          title="Wajib"
          className="w-4 h-4 accent-[#006e2a]"
        />
      </div>
      <div className="col-span-1 flex items-center justify-center">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ModalKurikulum({ open, onClose, editData }) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    nama: "",
    kode: "",
    jenis: "nasional",
    tahun_berlaku: new Date().getFullYear(),
    tahun_berakhir: "",
    penerbit: "",
    deskripsi: "",
    is_active: true,
    komponen_nilais: [],
  });

  const create = useCreateKurikulum();
  const update = useUpdateKurikulum();
  const loading = create.isPending || update.isPending;

  useEffect(() => {
    if (editData) {
      setForm({
        nama: editData.nama ?? "",
        kode: editData.kode ?? "",
        jenis: editData.jenis ?? "nasional",
        tahun_berlaku: editData.tahun_berlaku ?? new Date().getFullYear(),
        tahun_berakhir: editData.tahun_berakhir ?? "",
        penerbit: editData.penerbit ?? "",
        deskripsi: editData.deskripsi ?? "",
        is_active: editData.is_active ?? true,
        komponen_nilais:
          editData.komponen_nilais?.filter((k) => !k.is_platform) ?? [],
      });
    } else {
      setForm({
        nama: "",
        kode: "",
        jenis: "nasional",
        tahun_berlaku: new Date().getFullYear(),
        tahun_berakhir: "",
        penerbit: "",
        deskripsi: "",
        is_active: true,
        komponen_nilais: [],
      });
    }
  }, [editData, open]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const addKomponen = () => {
    setForm((prev) => ({
      ...prev,
      komponen_nilais: [
        ...prev.komponen_nilais,
        { ...EMPTY_KOMPONEN, urutan: prev.komponen_nilais.length + 1 },
      ],
    }));
  };

  const changeKomponen = (index, key, val) => {
    setForm((prev) => ({
      ...prev,
      komponen_nilais: prev.komponen_nilais.map((k, i) =>
        i === index ? { ...k, [key]: val } : k,
      ),
    }));
  };

  const removeKomponen = (index) => {
    setForm((prev) => ({
      ...prev,
      komponen_nilais: prev.komponen_nilais.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      tahun_berakhir: form.tahun_berakhir || null,
      komponen_nilais: form.komponen_nilais.map((k, i) => ({
        ...k,
        urutan: i + 1,
        bobot_persen: k.bobot_persen !== "" ? Number(k.bobot_persen) : null,
      })),
    };

    const action = isEdit
      ? update.mutateAsync({ ulid: editData.ulid, ...payload })
      : create.mutateAsync(payload);

    action.then(() => onClose());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? "Edit Kurikulum" : "Tambah Kurikulum"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Nama + Kode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nama Kurikulum <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => set("nama", e.target.value)}
                placeholder="Contoh: Kurikulum Merdeka 2024"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Kode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.kode}
                onChange={(e) => set("kode", e.target.value.toUpperCase())}
                placeholder="Contoh: MERDEKA_2024"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
              />
            </div>
          </div>

          {/* Jenis + Tahun */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Jenis
              </label>
              <select
                value={form.jenis}
                onChange={(e) => set("jenis", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
              >
                {JENIS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tahun Berlaku <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={2000}
                max={2100}
                value={form.tahun_berlaku}
                onChange={(e) => set("tahun_berlaku", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tahun Berakhir
              </label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={form.tahun_berakhir}
                onChange={(e) => set("tahun_berakhir", e.target.value)}
                placeholder="Opsional"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
              />
            </div>
          </div>

          {/* Penerbit */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Penerbit / Instansi
            </label>
            <input
              type="text"
              value={form.penerbit}
              onChange={(e) => set("penerbit", e.target.value)}
              placeholder="Contoh: Kemendikbudristek"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Deskripsi
            </label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => set("deskripsi", e.target.value)}
              placeholder="Deskripsi singkat kurikulum..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/30 resize-none"
            />
          </div>

          {/* Status aktif */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="w-4 h-4 accent-[#006e2a]"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Aktif
            </label>
          </div>

          {/* Komponen Nilai */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Komponen Nilai Custom
              </span>
              <button
                type="button"
                onClick={addKomponen}
                className="flex items-center gap-1 text-xs text-[#006e2a] font-medium hover:underline"
              >
                <Plus size={13} /> Tambah
              </button>
            </div>

            {form.komponen_nilais.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Kosong — akan menggunakan komponen nilai platform default
                kurikulum ini.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-0">
                  <div className="col-span-3">Nama</div>
                  <div className="col-span-2">Kode</div>
                  <div className="col-span-3">Kategori</div>
                  <div className="col-span-2">Bobot %</div>
                  <div className="col-span-1 text-center">Wajib</div>
                  <div className="col-span-1" />
                </div>
                {form.komponen_nilais.map((k, i) => (
                  <KomponenRow
                    key={i}
                    komponen={k}
                    index={i}
                    onChange={changeKomponen}
                    onRemove={removeKomponen}
                    canRemove={form.komponen_nilais.length > 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-[#006e2a] text-white rounded-lg hover:bg-[#005a22] transition-colors disabled:opacity-60"
            >
              {loading
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Tambah Kurikulum"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
