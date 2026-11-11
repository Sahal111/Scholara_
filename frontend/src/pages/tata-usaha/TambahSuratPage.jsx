import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Save, Upload, X, ChevronDown } from "lucide-react";
import { useTambahSurat } from "../../hooks/api/useTataUsaha";

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

export default function TambahSuratPage() {
  const navigate = useNavigate();
  const tambahSurat = useTambahSurat();

  const [form, setForm] = useState({
    nomor_surat: "",
    jenis: "",
    perihal: "",
    pengirim: "",
    penerima: "",
    tanggal_surat: "",
    tanggal_terima: new Date().toISOString().slice(0, 10),
    keterangan: "",
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: "Ukuran file maksimal 5 MB" }));
      return;
    }
    setFile(f);
    setErrors((prev) => ({ ...prev, file: null }));
  }

  function validate() {
    const e = {};
    if (!form.nomor_surat.trim()) e.nomor_surat = "Nomor surat wajib diisi";
    if (!form.jenis) e.jenis = "Jenis surat wajib dipilih";
    if (!form.perihal.trim()) e.perihal = "Perihal wajib diisi";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
    if (file) fd.append("file_surat", file);

    tambahSurat.mutate(fd, {
      onSuccess: () => navigate("/tata-usaha/surat"),
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
            <Mail className="w-6 h-6 text-blue-600" />
            Tambah Surat
          </h1>
          <p className="text-sm text-gray-500">Catat surat masuk atau surat keluar baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Surat */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Identitas Surat
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nomor Surat" required>
              <input
                name="nomor_surat"
                value={form.nomor_surat}
                onChange={handleChange}
                placeholder="Contoh: 001/TU/XI/2026"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nomor_surat ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.nomor_surat && <p className="text-xs text-red-500 mt-1">{errors.nomor_surat}</p>}
            </Field>
            <Field label="Jenis Surat" required>
              <div className="relative">
                <select
                  name="jenis"
                  value={form.jenis}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8 ${errors.jenis ? "border-red-400" : "border-gray-300"}`}
                >
                  <option value="">-- Pilih Jenis --</option>
                  <option value="masuk">Surat Masuk</option>
                  <option value="keluar">Surat Keluar</option>
                  <option value="internal">Surat Internal</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.jenis && <p className="text-xs text-red-500 mt-1">{errors.jenis}</p>}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Perihal" required>
                <input
                  name="perihal"
                  value={form.perihal}
                  onChange={handleChange}
                  placeholder="Perihal / pokok surat"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.perihal ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.perihal && <p className="text-xs text-red-500 mt-1">{errors.perihal}</p>}
              </Field>
            </div>
            <Field label="Pengirim">
              <input
                name="pengirim"
                value={form.pengirim}
                onChange={handleChange}
                placeholder="Nama pengirim / instansi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Penerima">
              <input
                name="penerima"
                value={form.penerima}
                onChange={handleChange}
                placeholder="Nama penerima / instansi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Tanggal Surat">
              <input
                type="date"
                name="tanggal_surat"
                value={form.tanggal_surat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Tanggal Diterima">
              <input
                type="date"
                name="tanggal_terima"
                value={form.tanggal_terima}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Keterangan Tambahan">
                <textarea
                  name="keterangan"
                  rows={2}
                  value={form.keterangan}
                  onChange={handleChange}
                  placeholder="Catatan atau keterangan tambahan (opsional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* File Surat */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            File Surat (Opsional)
          </h2>
          <div className="space-y-2">
            {file ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-800 flex-1 truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-blue-600 hover:text-blue-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Klik untuk upload file surat</span>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileChange} className="hidden" />
              </label>
            )}
            {errors.file && <p className="text-xs text-red-500">{errors.file}</p>}
            <p className="text-xs text-gray-500">Format: PDF, DOC, DOCX, JPG, PNG. Maks: 5 MB</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={tambahSurat.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {tambahSurat.isPending ? "Menyimpan..." : "Simpan Surat"}
          </button>
        </div>
      </form>
    </div>
  );
}

