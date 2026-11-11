import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookMarked,
  ArrowLeft,
  Lock,
  LockOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  BookOpen,
} from "lucide-react";
import { useRaporDetail, useUpdateRapor, useFinalisasiRapor } from "../../hooks/api/usePenilaian";

/** Badge predikat nilai */
function PredikatBadge({ predikat }) {
  const map = {
    A: "bg-green-100 text-green-800",
    B: "bg-blue-100 text-blue-800",
    C: "bg-yellow-100 text-yellow-800",
    D: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${map[predikat] ?? "bg-gray-100 text-gray-700"}`}>
      {predikat ?? "-"}
    </span>
  );
}

export default function DetailRaporPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useRaporDetail(Number(id));
  const updateRapor = useUpdateRapor(Number(id));
  const finalisasi = useFinalisasiRapor(Number(id));

  // Form catatan wali kelas
  const [form, setForm] = useState(null);

  // Inisialisasi form dari data server saat pertama kali load
  if (data && form === null) {
    const r = data?.data?.rapor ?? {};
    setForm({
      catatan_wali              : r.catatan_wali ?? "",
      deskripsi_sikap_spiritual : r.deskripsi_sikap_spiritual ?? "",
      deskripsi_sikap_sosial    : r.deskripsi_sikap_sosial ?? "",
      total_hadir               : r.total_hadir ?? "",
      total_sakit               : r.total_sakit ?? "",
      total_izin                : r.total_izin ?? "",
      total_alpa                : r.total_alpa ?? "",
      status_kenaikan           : r.status_kenaikan ?? "",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Memuat data rapor...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-red-500">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm">{error?.response?.data?.message ?? "Gagal memuat rapor"}</p>
        <button onClick={() => navigate(-1)} className="text-xs px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          Kembali
        </button>
      </div>
    );
  }

  const rapor       = data?.data?.rapor ?? {};
  const nilaiAkhirs = data?.data?.nilai_akhirs ?? [];
  const isFinal     = rapor.status === "final";

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSimpan(e) {
    e.preventDefault();
    updateRapor.mutate(form);
  }

  function handleFinalisasi() {
    if (!confirm(
      "Finalisasi rapor ini?\n\n" +
      "⚠️ Setelah difinalisasi, rapor tidak dapat diedit kembali.\n" +
      "Pastikan semua nilai sudah benar sebelum melanjutkan."
    )) return;
    finalisasi.mutate();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-indigo-600" />
              Rapor Siswa
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {rapor.semester?.nama} &mdash; {rapor.kelas?.nama}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFinal ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
              <Lock className="w-4 h-4" />
              Sudah Difinalisasi
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                <LockOpen className="w-4 h-4" />
                Draft
              </span>
              <button
                onClick={handleFinalisasi}
                disabled={finalisasi.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {finalisasi.isPending ? "Memproses..." : "Finalisasi Rapor"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Siswa */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            <div>
              <p className="text-xs text-gray-500">Nama Siswa</p>
              <p className="text-sm font-semibold text-gray-900">{rapor.siswa?.nama ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">NIS</p>
              <p className="text-sm font-medium text-gray-700">{rapor.siswa?.nisn ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Kelas</p>
              <p className="text-sm font-medium text-gray-700">{rapor.kelas?.nama ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Wali Kelas</p>
              <p className="text-sm font-medium text-gray-700">{rapor.wali_kelas?.nama ?? "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Nilai Akhir per Mapel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-700">Nilai Akhir per Mata Pelajaran</h2>
          <span className="ml-auto text-xs text-gray-500">{nilaiAkhirs.length} mapel</span>
        </div>
        {nilaiAkhirs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <BookOpen className="w-10 h-10" />
            <p className="text-sm">Nilai akhir belum dihitung</p>
            <p className="text-xs text-gray-500">Minta guru mapel untuk menghitung nilai akhir terlebih dahulu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nilai Akhir</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Predikat</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {nilaiAkhirs.map((na, idx) => (
                  <tr key={na.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-900">{na.plot?.mapel?.nama ?? "-"}</div>
                      {na.plot?.mapel?.kode && (
                        <div className="text-xs text-gray-500">{na.plot.mapel.kode}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{na.plot?.guru?.nama ?? "-"}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-bold text-gray-900">
                        {na.nilai_angka?.toFixed(1) ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <PredikatBadge predikat={na.predikat} />
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-xs">
                      <p className="line-clamp-2">{na.deskripsi ?? "-"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Catatan Wali Kelas */}
      {form !== null && (
        <form onSubmit={handleSimpan} className="space-y-6">
          {/* Rekap Absensi */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
              Rekap Kehadiran Semester Ini
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "total_hadir", label: "Hari Hadir", color: "text-green-700" },
                { name: "total_sakit", label: "Sakit", color: "text-yellow-700" },
                { name: "total_izin", label: "Izin", color: "text-blue-700" },
                { name: "total_alpa", label: "Alpa", color: "text-red-700" },
              ].map(({ name, label, color }) => (
                <div key={name}>
                  <label className={`block text-xs font-medium ${color} mb-1`}>{label}</label>
                  <input
                    type="number"
                    name={name}
                    min="0"
                    max="365"
                    value={form[name]}
                    onChange={handleChange}
                    disabled={isFinal}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Catatan Wali Kelas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b pb-2">
              Catatan Wali Kelas
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan untuk Orang Tua
                </label>
                <textarea
                  name="catatan_wali"
                  rows={3}
                  value={form.catatan_wali}
                  onChange={handleChange}
                  disabled={isFinal}
                  placeholder="Catatan umum wali kelas untuk orang tua/wali murid..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Sikap Spiritual (KI-1)
                </label>
                <textarea
                  name="deskripsi_sikap_spiritual"
                  rows={2}
                  value={form.deskripsi_sikap_spiritual}
                  onChange={handleChange}
                  disabled={isFinal}
                  placeholder="Deskripsi penilaian sikap spiritual siswa..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Sikap Sosial (KI-2)
                </label>
                <textarea
                  name="deskripsi_sikap_sosial"
                  rows={2}
                  value={form.deskripsi_sikap_sosial}
                  onChange={handleChange}
                  disabled={isFinal}
                  placeholder="Deskripsi penilaian sikap sosial siswa..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Kenaikan Kelas
                </label>
                <select
                  name="status_kenaikan"
                  value={form.status_kenaikan}
                  onChange={handleChange}
                  disabled={isFinal}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  <option value="Naik Kelas">Naik Kelas</option>
                  <option value="Tinggal Kelas">Tinggal Kelas</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Tidak Lulus">Tidak Lulus</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          {!isFinal && (
            <div className="flex items-center justify-end gap-3 pb-6">
              <button type="button" onClick={() => navigate(-1)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                Batal
              </button>
              <button
                type="submit"
                disabled={updateRapor.isPending}
                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateRapor.isPending ? "Menyimpan..." : "Simpan Catatan"}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

