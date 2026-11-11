import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookMarked, ArrowLeft, Save, Upload, X } from "lucide-react";
import { useTambahBuku } from "../../hooks/api/usePerpustakaan";

/** Label + input field reusable */
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

export default function TambahBukuPage() {
  const navigate = useNavigate();
  const tambahBuku = useTambahBuku();

  const [form, setForm] = useState({
    judul: "",
    pengarang: "",
    penerbit: "",
    isbn: "",
    kode_buku: "",
    tahun_terbit: "",
    kategori: "",
    stok_total: "",
    lokasi_rak: "",
    deskripsi: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, cover: "Ukuran file maksimal 2 MB" }));
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, cover: null }));
  }

  function validate() {
    const e = {};
    if (!form.judul.trim()) e.judul = "Judul buku wajib diisi";
    if (!form.pengarang.trim()) e.pengarang = "Pengarang wajib diisi";
    if (!form.stok_total || Number(form.stok_total) < 1) e.stok_total = "Stok minimal 1 eksemplar";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    // Gunakan FormData agar bisa kirim file cover
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
    if (coverFile) fd.append("cover", coverFile);

    tambahBuku.mutate(fd, {
      onSuccess: () => navigate("/pustakawan/buku"),
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-blue-600" />
            Tambah Buku
          </h1>
          <p className="text-sm text-gray-500">Tambahkan koleksi buku baru ke katalog perpustakaan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Buku */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Identitas Buku
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Judul Buku" required>
                <input
                  name="judul"
                  value={form.judul}
                  onChange={handleChange}
                  placeholder="Contoh: Laskar Pelangi"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.judul ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.judul && <p className="text-xs text-red-500 mt-1">{errors.judul}</p>}
              </Field>
            </div>
            <Field label="Pengarang" required>
              <input
                name="pengarang"
                value={form.pengarang}
                onChange={handleChange}
                placeholder="Nama pengarang"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pengarang ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.pengarang && <p className="text-xs text-red-500 mt-1">{errors.pengarang}</p>}
            </Field>
            <Field label="Penerbit">
              <input
                name="penerbit"
                value={form.penerbit}
                onChange={handleChange}
                placeholder="Nama penerbit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="ISBN">
              <input
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                placeholder="978-xxx-xxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Kode Buku" hint="Kode unik internal perpustakaan">
              <input
                name="kode_buku"
                value={form.kode_buku}
                onChange={handleChange}
                placeholder="Contoh: FIK-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Tahun Terbit">
              <input
                name="tahun_terbit"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={form.tahun_terbit}
                onChange={handleChange}
                placeholder="Contoh: 2020"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Kategori / Genre">
              <select
                name="kategori"
                value={form.kategori}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Pilih Kategori --</option>
                <option value="fiksi">Fiksi</option>
                <option value="non_fiksi">Non-Fiksi</option>
                <option value="pelajaran">Buku Pelajaran</option>
                <option value="referensi">Referensi / Kamus</option>
                <option value="agama">Agama</option>
                <option value="sains">Sains & Teknologi</option>
                <option value="sejarah">Sejarah & Sosial</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Stok & Lokasi */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Stok & Lokasi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Jumlah Eksemplar" required>
              <input
                name="stok_total"
                type="number"
                min="1"
                value={form.stok_total}
                onChange={handleChange}
                placeholder="Contoh: 5"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.stok_total ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.stok_total && <p className="text-xs text-red-500 mt-1">{errors.stok_total}</p>}
            </Field>
            <Field label="Lokasi Rak" hint="Contoh: Rak A-3, Lemari B">
              <input
                name="lokasi_rak"
                value={form.lokasi_rak}
                onChange={handleChange}
                placeholder="Contoh: Rak A-3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Deskripsi / Sinopsis">
                <textarea
                  name="deskripsi"
                  rows={3}
                  value={form.deskripsi}
                  onChange={handleChange}
                  placeholder="Ringkasan isi buku (opsional)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Cover Buku */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Cover Buku (Opsional)
          </h2>
          <div className="flex items-start gap-4">
            {/* Preview */}
            {coverPreview ? (
              <div className="relative">
                <img src={coverPreview} alt="Preview cover" className="w-24 h-32 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <BookMarked className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                Pilih Gambar Cover
                <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
              </label>
              {errors.cover && <p className="text-xs text-red-500">{errors.cover}</p>}
              <p className="text-xs text-gray-500">Format: JPG, PNG, WebP. Maks: 2 MB</p>
            </div>
          </div>
        </div>

        {/* Tombol Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button type="submit" disabled={tambahBuku.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />
            {tambahBuku.isPending ? "Menyimpan..." : "Simpan Buku"}
          </button>
        </div>
      </form>
    </div>
  );
}

