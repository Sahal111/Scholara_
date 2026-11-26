import { useMapelKelas } from "@/hooks/api/useKelas";

const ALASAN_FALLBACK = {
  KELAS_TANPA_KURIKULUM:
    "Kelas ini belum memiliki kurikulum, sehingga yang ditampilkan adalah semua mapel di katalog.",
  TIDAK_ADA_IMPLEMENTASI_AKTIF:
    "Belum ada implementasi kurikulum yang Berlaku untuk kelas ini (kurikulum, tahun ajaran, atau tingkat tidak cocok). Sementara ditampilkan semua mapel di katalog.",
};

const KOMPONEN_LABEL = {
  intrakurikuler: "Intrakurikuler",
  kokurikuler: "Kokurikuler",
  ekstrakurikuler: "Ekstrakurikuler",
  muatan_lokal: "Muatan Lokal",
  lainnya: "Lainnya",
};

const ASAL_LABEL = {
  umum: "Semua program",
  program: "Khusus program",
  katalog: "Katalog",
};

/**
 * Panel "Mapel Kelas": mapel yang berlaku untuk kelas ini menurut resolver
 * (struktur kurikulum Berlaku → fallback katalog mapel).
 */
export default function PanelMapelKelas({ kelasId }) {
  const { data: res, isLoading, isError } = useMapelKelas(kelasId);
  const hasil = res?.data;
  const dariStruktur = hasil?.sumber === "struktur";
  const mapel = hasil?.mapel ?? [];
  const totalJp = mapel.reduce((s, m) => s + (m.alokasi_jp_minggu ?? 0), 0);

  return (
    <div className="bg-surface-container-lowest rounded-[18px] border border-border-light shadow-sm flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border-light">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-section-title text-section-title text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                menu_book
              </span>
              Mapel Kelas
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Mata pelajaran yang berlaku untuk kelas ini.
            </p>
          </div>

          {hasil && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                dariStruktur
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-surface-variant text-on-surface-variant border-border-light"
              }`}
            >
              {dariStruktur ? "Dari struktur kurikulum" : "Dari katalog mapel"}
            </span>
          )}
        </div>

        {dariStruktur && hasil.implementasi && (
          <p className="text-xs text-text-secondary mt-3">
            {hasil.implementasi.kurikulum_nama} (
            {hasil.implementasi.kurikulum_kode}){" · "}
            {hasil.implementasi.tahun_ajaran}
          </p>
        )}

        {hasil && !dariStruktur && (
          <p className="text-xs text-text-secondary mt-3">
            {ALASAN_FALLBACK[hasil.alasan_fallback] ??
              "Menampilkan semua mapel di katalog."}
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="px-6 py-10 text-sm text-text-secondary">
          Memuat mapel...
        </p>
      ) : isError ? (
        <p className="px-6 py-10 text-sm text-danger">
          Gagal memuat mapel kelas.
        </p>
      ) : mapel.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-text-secondary">
          {dariStruktur
            ? "Struktur kurikulum untuk tingkat dan program kelas ini belum berisi mata pelajaran."
            : "Belum ada mata pelajaran di katalog."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead className="bg-surface-container-low/50 border-b border-border-light text-xs uppercase text-text-secondary font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Mata Pelajaran</th>
                <th className="px-6 py-4 whitespace-nowrap">Kelompok</th>
                <th className="px-6 py-4 whitespace-nowrap">JP/Minggu</th>
                <th className="px-6 py-4 whitespace-nowrap">Komponen</th>
                <th className="px-6 py-4 whitespace-nowrap">Wajib</th>
                <th className="px-6 py-4 whitespace-nowrap">Berlaku untuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-sm">
              {mapel.map((m) => (
                <tr
                  key={m.mapel_ulid}
                  className="hover:bg-surface-container-low/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {m.nama}
                    {m.kode && (
                      <span className="ml-2 text-xs text-text-secondary">
                        {m.kode}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    {m.kelompok ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    {m.alokasi_jp_minggu ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    {KOMPONEN_LABEL[m.jenis_komponen] ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    {m.is_wajib === null ? "-" : m.is_wajib ? "Ya" : "Tidak"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {ASAL_LABEL[m.asal_baris] ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border-light text-sm">
              <tr>
                <td
                  className="px-6 py-3 font-semibold text-text-primary"
                  colSpan={2}
                >
                  Total {mapel.length} mapel
                </td>
                <td
                  className="px-6 py-3 font-semibold text-text-primary"
                  colSpan={4}
                >
                  {totalJp} JP/minggu
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
