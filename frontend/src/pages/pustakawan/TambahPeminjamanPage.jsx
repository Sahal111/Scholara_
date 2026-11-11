import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenCheck, ArrowLeft, Save, ChevronDown } from "lucide-react";
import { useTambahPeminjaman } from "../../hooks/api/usePerpustakaan";
import { useSiswaDropdown } from "../../hooks/api/useSiswa";
import { useBukuDropdown } from "../../hooks/api/usePerpustakaan";

/** Label + input wrapper */
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

export default function TambahPeminjamanPage() {
  const navigate = useNavigate();
  const tambahPeminjaman = useTambahPeminjaman();

  const { data: bukuData } = useBukuDropdown();
  const { data: siswaData } = useSiswaDropdown();

  const bukus = bukuData?.data ?? [];
  const siswas = siswaData?.data ?? [];

  const [form, setForm] = useState({
    buku_id: "",
    peminjam_id: "",   // siswa_id
    jenis_peminjam: "siswa",
    tanggal_pinjam: new Date().toISOString().slice(0, 10),
    tanggal_kembali: "",
    catatan: "",
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  /** Hitung tanggal kembali default: 7 hari dari tanggal pinjam */
  function handleTanggalPinjamChange(e) {
    const tgl = e.target.value;
    const kembali = new Date(tgl);
    kembali.setDate(kembali.getDate() + 7);
    setForm((prev) => ({
      ...prev,
      tanggal_pinjam: tgl,
      tanggal_kembali: kembali.toISOString().slice(0, 10),
    }));
  }

  function validate() {
    const e = {};
    if (!form.buku_id) e.buku_id = "Pilih buku terlebih dahulu";
    if (!form.peminjam_id) e.peminjam_id = "Pilih peminjam";
    if (!form.tanggal_pinjam) e.tanggal_pinjam = "Tanggal pinjam wajib diisi";
    if (!form.tanggal_kembali) e.tanggal_kembali = "Tanggal kembali wajib diisi";
    if (form.tanggal_kembali && form.tanggal_kembali <= form.tanggal_pinjam) {
      e.tanggal_kembali = "Tanggal kembali harus setelah tanggal pinjam";
    }
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    tambahPeminjaman.mutate(form, {
      onSuccess: () => navigate("/pustakawan/peminjaman"),
    });
  }

  const selectedBuku = bukus.find((b) => String(b.id) === String(form.buku_id));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-blue-600" />
            Tambah Peminjaman
          </h1>
          <p className="text-sm text-gray-500">Catat peminjaman buku baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pilih Buku */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Data Buku
          </h2>
          <Field label="Buku yang Dipinjam" required>
            <div className="relative">
              <select
                name="buku_id"
                value={form.buku_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8 ${errors.buku_id ? "border-red-400" : "border-gray-300"}`}
              >
                <option value="">-- Pilih Buku --</option>
                {bukus.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.stok_tersedia === 0}>
                    {b.judul} — {b.pengarang}
                    {b.stok_tersedia === 0 ? " (Habis)" : ` (${b.stok_tersedia} tersedia)`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.buku_id && <p className="text-xs text-red-500 mt-1">{errors.buku_id}</p>}
          </Field>

          {/* Info buku terpilih */}
          {selectedBuku && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 space-y-1">
              <p><span className="font-medium">Kode:</span> {selectedBuku.kode_buku ?? "-"}</p>
              <p><span className="font-medium">Kategori:</span> {selectedBuku.kategori ?? "-"}</p>
              <p><span className="font-medium">Stok Tersedia:</span> {selectedBuku.stok_tersedia ?? "-"} eksemplar</p>
            </div>
          )}
        </div>

        {/* Peminjam */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Data Peminjam
          </h2>
          <Field label="Peminjam (Siswa)" required>
            <div className="relative">
              <select
                name="peminjam_id"
                value={form.peminjam_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8 ${errors.peminjam_id ? "border-red-400" : "border-gray-300"}`}
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
            {errors.peminjam_id && <p className="text-xs text-red-500 mt-1">{errors.peminjam_id}</p>}
          </Field>
        </div>

        {/* Tanggal */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
            Periode Peminjaman
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal Pinjam" required>
              <input
                type="date"
                name="tanggal_pinjam"
                value={form.tanggal_pinjam}
                onChange={handleTanggalPinjamChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal_pinjam ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.tanggal_pinjam && <p className="text-xs text-red-500 mt-1">{errors.tanggal_pinjam}</p>}
            </Field>
            <Field label="Batas Pengembalian" required hint="Default: 7 hari dari tanggal pinjam">
              <input
                type="date"
                name="tanggal_kembali"
                value={form.tanggal_kembali}
                onChange={handleChange}
                min={form.tanggal_pinjam}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal_kembali ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.tanggal_kembali && <p className="text-xs text-red-500 mt-1">{errors.tanggal_kembali}</p>}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Catatan (Opsional)">
                <textarea
                  name="catatan"
                  rows={2}
                  value={form.catatan}
                  onChange={handleChange}
                  placeholder="Catatan kondisi buku, dsb."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={tambahPeminjaman.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {tambahPeminjaman.isPending ? "Menyimpan..." : "Catat Peminjaman"}
          </button>
        </div>
      </form>
    </div>
  );
}

