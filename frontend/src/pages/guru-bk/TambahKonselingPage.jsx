import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTambahKonseling } from "../../hooks/api/useBk";
import { useSiswaDropdown } from "../../hooks/api/useSiswa";
import { ArrowLeft, Save } from "lucide-react";

export default function TambahKonselingPage() {
  const navigate = useNavigate();
  const tambah = useTambahKonseling();

  const { data: siswaData } = useSiswaDropdown();
  const siswaList = siswaData?.data ?? [];

  const [form, setForm] = useState({
    siswa_id: "",
    jenis: "individual",
    kategori: "pribadi",
    tanggal: new Date().toISOString().slice(0, 10),
    jam_mulai: "",
    jam_selesai: "",
    keluhan: "",
    hasil_konseling: "",
    rencana_tindak_lanjut: "",
    status: "berlangsung",
    rahasia: false,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    tambah.mutate(form, {
      onSuccess: () => navigate("/guru-bk/konseling"),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">Catat Sesi Konseling</h1>
          <p className="text-sm text-gray-500">Isi data sesi konseling siswa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Siswa */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Siswa <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={form.siswa_id}
            onChange={(e) => set("siswa_id", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">— Pilih Siswa —</option>
            {siswaList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.nisn})
              </option>
            ))}
          </select>
        </div>

        {/* Jenis & Kategori */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Jenis <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.jenis}
              onChange={(e) => set("jenis", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="individual">Individual</option>
              <option value="kelompok">Kelompok</option>
              <option value="klasikal">Klasikal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.kategori}
              onChange={(e) => set("kategori", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="pribadi">Pribadi</option>
              <option value="sosial">Sosial</option>
              <option value="belajar">Belajar</option>
              <option value="karir">Karir</option>
              <option value="keluarga">Keluarga</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Tanggal & Jam */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.tanggal}
              onChange={(e) => set("tanggal", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jam Mulai</label>
            <input
              type="time"
              value={form.jam_mulai}
              onChange={(e) => set("jam_mulai", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jam Selesai</label>
            <input
              type="time"
              value={form.jam_selesai}
              onChange={(e) => set("jam_selesai", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* Keluhan */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Keluhan / Topik</label>
          <textarea
            rows={3}
            value={form.keluhan}
            onChange={(e) => set("keluhan", e.target.value)}
            placeholder="Deskripsikan keluhan atau topik yang dibicarakan..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
        </div>

        {/* Hasil Konseling */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hasil Konseling</label>
          <textarea
            rows={3}
            value={form.hasil_konseling}
            onChange={(e) => set("hasil_konseling", e.target.value)}
            placeholder="Kesimpulan dan hasil dari sesi konseling..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
        </div>

        {/* RTL */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rencana Tindak Lanjut</label>
          <textarea
            rows={2}
            value={form.rencana_tindak_lanjut}
            onChange={(e) => set("rencana_tindak_lanjut", e.target.value)}
            placeholder="Langkah lanjutan yang akan dilakukan..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
        </div>

        {/* Status & Rahasia */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="berlangsung">Berlangsung</option>
              <option value="selesai">Selesai</option>
              <option value="perlu_tindak_lanjut">Perlu Tindak Lanjut</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.rahasia}
                onChange={(e) => set("rahasia", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600 font-medium">Bersifat Rahasia</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={tambah.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            {tambah.isPending ? "Menyimpan..." : "Simpan Konseling"}
          </button>
        </div>
      </form>
    </div>
  );
}

