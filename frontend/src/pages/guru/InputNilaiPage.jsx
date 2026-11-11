import { useState } from "react";
import { ClipboardList, ChevronDown, Save, Calculator, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePlotSaya, useNilaiByPlot, useUpsertNilaiBulk, useHitungNilaiAkhir, useKomponenPenilaian } from "../../hooks/api/usePenilaian";

/**
 * Halaman input nilai siswa untuk guru.
 *
 * Alur penggunaan:
 *   1. Guru memilih Semester → Mapel/Kelas (plot) → Komponen nilai
 *   2. Muncul tabel seluruh siswa dengan kolom input nilai
 *   3. Guru mengisi nilai dan menekan "Simpan Semua"
 *   4. Opsional: "Hitung Nilai Akhir" untuk menghitung rata-rata tertimbang
 */
export default function InputNilaiPage() {
  const [semesterId, setSemesterId] = useState("");
  const [plotId, setPlotId] = useState("");
  const [komponenId, setKomponenId] = useState("");

  // Map: siswa_id → nilai yang sedang diedit di form
  const [nilaiForm, setNilaiForm] = useState({});
  const [tahunAjaranId, setTahunAjaranId] = useState("");

  // Daftar plot yang diampu guru ini
  const { data: plotData, isLoading: loadingPlot } = usePlotSaya(
    semesterId ? { semester_id: semesterId } : {}
  );

  // Nilai siswa di plot yang dipilih
  const { data: nilaiData, isLoading: loadingNilai } = useNilaiByPlot(
    plotId || null,
    komponenId ? { komponen_id: komponenId } : {}
  );

  // Daftar komponen penilaian dari server (Formatif, Sumatif, PTS, PAS)
  const { data: komponenData } = useKomponenPenilaian();
  const listKomponen = komponenData?.data ?? [];

  const upsertBulk     = useUpsertNilaiBulk();
  const hitungAkhir    = useHitungNilaiAkhir();

  const plots  = plotData?.data ?? [];
  const siswas = nilaiData?.data?.siswas ?? [];
  const plot   = nilaiData?.data?.plot ?? null;

  // Set nilai form dari data server saat berhasil load
  function handleNilaiLoad(data) {
    const initial = {};
    (data?.data?.siswas ?? []).forEach((s) => {
      initial[s.siswa_id] = s.nilai ?? "";
    });
    setNilaiForm(initial);
  }

  // Sinkron nilai form saat plotId berubah
  function handlePlotChange(val) {
    setPlotId(val);
    setNilaiForm({});
    // Ambil tahun ajaran dari plot yang dipilih
    const selectedPlot = plots.find((p) => String(p.id) === val);
    if (selectedPlot?.semester?.tahun_ajaran_id) {
      setTahunAjaranId(selectedPlot.semester.tahun_ajaran_id);
    }
    if (selectedPlot?.semester_id) {
      setSemesterIdFromPlot(selectedPlot.semester_id);
    }
  }

  // Update nilai satu siswa di state form (belum simpan ke server)
  function handleNilaiChange(siswaId, val) {
    const num = val === "" ? "" : Math.min(100, Math.max(0, Number(val)));
    setNilaiForm((prev) => ({ ...prev, [siswaId]: num }));
  }

  // Simpan semua nilai ke server sekaligus
  function handleSimpan() {
    if (!plotId || !semesterId) {
      alert("Pilih mapel/kelas dan semester terlebih dahulu.");
      return;
    }

    const nilaisPayload = siswas.map((s) => ({
      siswa_id  : s.siswa_id,
      nilai     : nilaiForm[s.siswa_id] !== "" ? Number(nilaiForm[s.siswa_id]) : null,
    }));

    upsertBulk.mutate({
      plot_id        : Number(plotId),
      komponen_id    : komponenId ? Number(komponenId) : null,
      semester_id    : Number(semesterId),
      tahun_ajaran_id: Number(tahunAjaranId),
      nilais         : nilaisPayload,
    });
  }

  // Hitung nilai akhir (rata-rata tertimbang semua komponen)
  function handleHitungAkhir() {
    if (!plotId || !semesterId) {
      alert("Pilih mapel/kelas dan semester terlebih dahulu.");
      return;
    }
    if (!confirm("Hitung nilai akhir dari semua komponen untuk kelas ini? Proses ini akan menimpa nilai akhir yang sebelumnya ada.")) return;

    hitungAkhir.mutate({
      plot_id        : Number(plotId),
      semester_id    : Number(semesterId),
      tahun_ajaran_id: Number(tahunAjaranId),
    });
  }

  // Helper: warna predikat
  function warnaNilai(nilai) {
    if (nilai === "" || nilai === null || nilai === undefined) return "text-gray-400";
    const n = Number(nilai);
    if (n >= 90) return "text-green-700 font-semibold";
    if (n >= 80) return "text-blue-700 font-semibold";
    if (n >= 70) return "text-yellow-700 font-semibold";
    return "text-red-600 font-semibold";
  }

  function predikat(nilai) {
    if (nilai === "" || nilai === null || nilai === undefined) return "-";
    const n = Number(nilai);
    if (n >= 90) return "A";
    if (n >= 80) return "B";
    if (n >= 70) return "C";
    return "D";
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          Input Nilai Siswa
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pilih mapel dan komponen, lalu isikan nilai siswa di bawah
        </p>
      </div>

      {/* Panel Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Pilih Kelas & Komponen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Mapel / Kelas */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mapel / Kelas <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={plotId}
                onChange={(e) => handlePlotChange(e.target.value)}
                disabled={loadingPlot}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8"
              >
                <option value="">-- Pilih Mapel & Kelas --</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.mapel?.nama} — {p.kelas?.nama} ({p.semester?.nama})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Komponen Nilai (opsional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Komponen Nilai
            </label>
            <div className="relative">
              <select
                value={komponenId}
                onChange={(e) => setKomponenId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8"
              >
                <option value="">-- Semua / Tanpa Komponen --</option>
                {listKomponen.length > 0 ? (
                  listKomponen.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_komponen} {k.bobot_persentase ? `(${k.bobot_persentase}%)` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Nilai Formatif</option>
                    <option value="2">Nilai Sumatif</option>
                    <option value="3">PTS (Penilaian Tengah Semester)</option>
                    <option value="4">PAS (Penilaian Akhir Semester)</option>
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Info plot yang dipilih */}
        {plot && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">{plot.mapel?.nama}</span>
              {" · "}
              <span>{plot.kelas?.nama}</span>
              {" · Semester "}
              <span>{plot.semester?.nama}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabel Input Nilai */}
      {plotId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">
              {loadingNilai
                ? "Memuat data siswa..."
                : `${siswas.length} Siswa`}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleHitungAkhir}
                disabled={hitungAkhir.isPending || !siswas.length}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                {hitungAkhir.isPending ? "Menghitung..." : "Hitung Nilai Akhir"}
              </button>
              <button
                onClick={handleSimpan}
                disabled={upsertBulk.isPending || !siswas.length}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {upsertBulk.isPending ? "Menyimpan..." : "Simpan Semua"}
              </button>
            </div>
          </div>

          {loadingNilai ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : siswas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm">Tidak ada siswa di kelas ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      NIS / Nama Siswa
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-36">
                      Nilai (0–100)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
                      Predikat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {siswas.map((siswa, idx) => {
                    const val = nilaiForm[siswa.siswa_id] ?? (siswa.nilai ?? "");
                    return (
                      <tr key={siswa.siswa_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{siswa.nama}</div>
                          <div className="text-xs text-gray-500">NIS: {siswa.nisn ?? "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={val}
                            onChange={(e) => handleNilaiChange(siswa.siswa_id, e.target.value)}
                            placeholder="—"
                            className="w-full text-center px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${warnaNilai(val)}`}>
                            {predikat(val)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Panduan */}
      {!plotId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-2">
          <ClipboardList className="w-10 h-10 text-blue-400 mx-auto" />
          <p className="text-sm font-medium text-blue-800">Pilih Mapel & Kelas di atas untuk memulai</p>
          <p className="text-xs text-blue-600">
            Hanya mapel yang Anda ampu yang akan muncul dalam daftar
          </p>
        </div>
      )}
    </div>
  );
}

