import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft, Save, ChevronDown } from "lucide-react";
import { useTambahCatatan } from "../../hooks/api/useBk";
import { useSiswaDropdown } from "../../hooks/api/useSiswa";

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function TambahCatatanBkPage() {
  const navigate = useNavigate();
  const tambahCatatan = useTambahCatatan();
  const { data: siswaData } = useSiswaDropdown();
  const siswas = siswaData?.data ?? [];

  const [form, setForm] = useState({
    siswa_id: "",
    tipe: "",
    tingkat: "",
    tanggal: new Date().toISOString().slice(0, 10),
    deskripsi: "",
    tindak_lanjut: "",
    rahasia: false,
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const e = {};
    if (!form.siswa_id) e.siswa_id = "Pilih siswa terlebih dahulu";
    if (!form.tipe) e.tipe = "Tipe catatan wajib dipilih";
    if (!form.deskripsi.trim()) e.deskripsi = "Deskripsi wajib diisi";
    if (!form.tanggal) e.tanggal = "Tanggal catatan wajib diisi";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    tambahCatatan.mutate(form, {
      onSuccess: () => navigate("/guru-bk/catatan"),
    });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Tambah Catatan BK
          </h1>
          <p className="text-sm text-gray-500">Buat catatan bimbingan dan konseling untuk siswa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Siswa */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Siswa
          </h2>
          <Field label="Pilih Siswa" required>
            <div className="relative">
              <select
                name="siswa_id"
                value={form.siswa_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none pr-8 ${errors.siswa_id ? "border-red-400" : "border-gray-300"}`}
              >
                <option value="">-- Pilih Siswa --</option>
                {siswas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} {s.nisn ? `(NIS: ${s.nisn})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.siswa_id && <p className="text-xs text-red-500 mt-1">{errors.siswa_id}</p>}
          </Field>
        </div>

        {/* Tipe & Tingkat */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Klasifikasi Catatan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tipe Catatan" required>
              <div className="relative">
                <select
                  name="tipe"
                  value={form.tipe}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none pr-8 ${errors.tipe ? "border-red-400" : "border-gray-300"}`}
                >
                  <option value="">-- Pilih Tipe --</option>
                  <option value="pelanggaran">Pelanggaran</option>
                  <option value="prestasi">Prestasi</option>
                  <option value="observasi">Observasi</option>
                  <option value="rekomendasi">Rekomendasi</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.tipe && <p className="text-xs text-red-500 mt-1">{errors.tipe}</p>}
            </Field>
            <Field label="Tingkat Keparahan">
              <div className="relative">
                <select
                  name="tingkat"
                  value={form.tingkat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none pr-8"
                >
                  <option value="">-- Pilih Tingkat --</option>
                  <option value="rendah">Rendah</option>
                  <option value="sedang">Sedang</option>
                  <option value="tinggi">Tinggi</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Tanggal" required>
              <input
                type="date"
                name="tanggal"
                value={form.tanggal}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.tanggal ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.tanggal && <p className="text-xs text-red-500 mt-1">{errors.tanggal}</p>}
            </Field>
          </div>
        </div>

        {/* Isi Catatan */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Isi Catatan
          </h2>
          <Field label="Deskripsi / Kronologi" required>
            <textarea
              name="deskripsi"
              rows={4}
              value={form.deskripsi}
              onChange={handleChange}
              placeholder="Tuliskan deskripsi lengkap kejadian, observasi, atau prestasi..."
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${errors.deskripsi ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.deskripsi && <p className="text-xs text-red-500 mt-1">{errors.deskripsi}</p>}
          </Field>
          <Field label="Rencana Tindak Lanjut">
            <textarea
              name="tindak_lanjut"
              rows={2}
              value={form.tindak_lanjut}
              onChange={handleChange}
              placeholder="Langkah tindak lanjut yang direncanakan (opsional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </Field>
          {/* Toggle rahasia */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="rahasia"
              checked={form.rahasia}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Catatan Rahasia</span>
              <p className="text-xs text-gray-500">Hanya dapat dilihat oleh Guru BK dan Kepala Sekolah</p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={tambahCatatan.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {tambahCatatan.isPending ? "Menyimpan..." : "Simpan Catatan"}
          </button>
        </div>
      </form>
    </div>
  );
}

