import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Confirm from "@/components/ui/Confirm";
import { useAuth } from "@/contexts/AuthContext";
import { useMapelDropdown } from "@/hooks/api/useMapel";
import {
  useHapusStruktur,
  useStrukturKurikulum,
  useTambahStruktur,
  useUbahStruktur,
} from "@/hooks/api/useKurikulum";

const JENIS_KOMPONEN = [
  { value: "intrakurikuler", label: "Intrakurikuler" },
  { value: "kokurikuler", label: "Kokurikuler" },
  { value: "ekstrakurikuler", label: "Ekstrakurikuler" },
  { value: "muatan_lokal", label: "Muatan Lokal" },
  { value: "lainnya", label: "Lainnya" },
];

const labelKomponen = (v) =>
  JENIS_KOMPONEN.find((j) => j.value === v)?.label ?? v ?? "-";

const INPUT =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30";

/**
 * Form tambah / ubah satu baris struktur.
 *   baris = null  → mode tambah (pilih tingkat + mapel)
 *   baris = {...} → mode ubah (mapel & tingkat tidak bisa diganti)
 */
function FormStruktur({ implementasiUlid, tingkatPilihan, rows, baris, onClose }) {
  const ubah = !!baris;

  const tambah = useTambahStruktur();
  const simpanUbah = useUbahStruktur();
  const mutasi = ubah ? simpanUbah : tambah;

  const { data: mapelList = [], isLoading: memuatMapel } = useMapelDropdown();

  const [tingkat, setTingkat] = useState(
    baris?.tingkat ?? tingkatPilihan[0] ?? 1,
  );
  const [mapelUlid, setMapelUlid] = useState(baris?.mapel?.ulid ?? "");
  const [jpMinggu, setJpMinggu] = useState(baris?.alokasi_jp_minggu ?? "");
  const [jpTahun, setJpTahun] = useState(baris?.alokasi_jp_tahun ?? "");
  const [kelompok, setKelompok] = useState(baris?.kelompok ?? "");
  const [komponen, setKomponen] = useState(
    baris?.jenis_komponen ?? "intrakurikuler",
  );
  const [wajib, setWajib] = useState(baris?.is_wajib ?? true);
  const [urutan, setUrutan] = useState(baris?.urutan_rapor ?? "");

  // Mapel yang cocok dengan tingkat terpilih & belum ada di struktur tingkat itu
  const pilihanMapel = useMemo(() => {
    const dipakai = new Set(
      rows
        .filter((r) => Number(r.tingkat) === Number(tingkat) && !r.program)
        .map((r) => r.mapel?.ulid),
    );
    return mapelList.filter((m) => {
      const tk = Array.isArray(m.tingkat) ? m.tingkat.map(Number) : [];
      const cocokTingkat = tk.length === 0 || tk.includes(Number(tingkat));
      return cocokTingkat && !dipakai.has(m.id);
    });
  }, [mapelList, rows, tingkat]);

  const pilihMapel = (id) => {
    setMapelUlid(id);
    // Isi kelompok dari data mapel bila belum diisi
    const m = mapelList.find((x) => x.id === id);
    if (m?.kelompok && !kelompok) setKelompok(String(m.kelompok));
  };

  // Kosong dikirim sebagai null supaya nilai lama bisa dikosongkan saat ubah
  const angka = (v) => (v === "" || v === null ? null : Number(v));

  const bisaSimpan =
    Number(jpMinggu) >= 1 && (ubah || (mapelUlid && tingkat)) && !mutasi.isPending;

  const simpan = () => {
    const isi = {
      alokasi_jp_minggu: Number(jpMinggu),
      alokasi_jp_tahun: angka(jpTahun),
      kelompok: kelompok.trim() === "" ? null : kelompok.trim(),
      jenis_komponen: komponen,
      is_wajib: wajib,
      urutan_rapor: angka(urutan),
    };

    if (ubah) {
      mutasi.mutate(
        { ulid: baris.ulid, implementasiUlid, ...isi },
        { onSuccess: onClose },
      );
    } else {
      mutasi.mutate(
        {
          implementasiUlid,
          mapel_ulid: mapelUlid,
          tingkat: Number(tingkat),
          ...isi,
        },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <div className="space-y-4">
      {ubah ? (
        <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            {baris.mapel?.nama}
          </span>{" "}
          · Kelas {baris.tingkat}
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tingkat</label>
            <select
              value={tingkat}
              onChange={(e) => {
                setTingkat(Number(e.target.value));
                setMapelUlid("");
              }}
              className={INPUT}
            >
              {tingkatPilihan.map((t) => (
                <option key={t} value={t}>
                  Kelas {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Mata pelajaran
            </label>
            <select
              value={mapelUlid}
              onChange={(e) => pilihMapel(e.target.value)}
              disabled={memuatMapel}
              className={INPUT}
            >
              <option value="">
                {memuatMapel ? "Memuat..." : "Pilih mata pelajaran"}
              </option>
              {pilihanMapel.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama_mapel} {m.kode ? `(${m.kode})` : ""}
                </option>
              ))}
            </select>
            {!memuatMapel && pilihanMapel.length === 0 && (
              <p className="text-xs text-gray-400">
                Tidak ada mata pelajaran yang tersedia untuk tingkat ini.
              </p>
            )}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            JP per minggu
          </label>
          <input
            type="number"
            min={1}
            max={40}
            value={jpMinggu}
            onChange={(e) => setJpMinggu(e.target.value)}
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            JP per tahun <span className="text-gray-400">(opsional)</span>
          </label>
          <input
            type="number"
            min={1}
            max={2000}
            value={jpTahun}
            onChange={(e) => setJpTahun(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Komponen</label>
          <select
            value={komponen}
            onChange={(e) => setKomponen(e.target.value)}
            className={INPUT}
          >
            {JENIS_KOMPONEN.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Kelompok <span className="text-gray-400">(opsional)</span>
          </label>
          <input
            type="text"
            maxLength={50}
            value={kelompok}
            onChange={(e) => setKelompok(e.target.value)}
            placeholder="mis. Umum"
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Urutan di rapor <span className="text-gray-400">(opsional)</span>
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={urutan}
            onChange={(e) => setUrutan(e.target.value)}
            className={INPUT}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={wajib}
            onChange={(e) => setWajib(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
          />
          Mata pelajaran wajib
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={mutasi.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={simpan}
          disabled={!bisaSimpan}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {mutasi.isPending ? "Menyimpan..." : ubah ? "Simpan" : "Tambahkan"}
        </button>
      </div>
    </div>
  );
}

/**
 * Struktur kurikulum: mata pelajaran + alokasi JP per tingkat.
 *
 * Props:
 *   impl: objek dari GET /kurikulum/implementasi/{ulid}
 *         (memakai: ulid, is_editable, tingkat_kelas, status)
 *
 * Tombol tambah/ubah/hapus tampil hanya jika struktur masih bisa diedit
 * (impl.is_editable, yaitu status Draft) DAN user punya permission manage.
 */
export default function StrukturKurikulumSection({ impl }) {
  const { hasPermission } = useAuth();
  const bisaKelola = hasPermission("master_data.kurikulum.manage");
  const bisaEdit = bisaKelola && !!impl.is_editable;

  const { data: res, isLoading, isError } = useStrukturKurikulum(impl.ulid);
  const hapus = useHapusStruktur();

  const [formBuka, setFormBuka] = useState(false);
  const [barisUbah, setBarisUbah] = useState(null);
  const [barisHapus, setBarisHapus] = useState(null);

  const rows = useMemo(() => res?.data ?? [], [res]);

  const tingkatTersedia = useMemo(() => {
    const izin = Array.isArray(impl.tingkat_kelas) ? impl.tingkat_kelas : [];
    return izin.length > 0 ? izin : Array.from({ length: 12 }, (_, i) => i + 1);
  }, [impl.tingkat_kelas]);

  // Kelompokkan per tingkat
  const perTingkat = useMemo(() => {
    const peta = new Map();
    rows.forEach((r) => {
      if (!peta.has(r.tingkat)) peta.set(r.tingkat, []);
      peta.get(r.tingkat).push(r);
    });
    return [...peta.entries()].sort((a, b) => a[0] - b[0]);
  }, [rows]);

  // Tingkat yang diwajibkan tapi masih kosong (menghalangi "Ajukan Review")
  const tingkatKosong = (
    Array.isArray(impl.tingkat_kelas) ? impl.tingkat_kelas : []
  ).filter((t) => !rows.some((r) => Number(r.tingkat) === Number(t)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {rows.length} baris · mata pelajaran dan alokasi jam pelajaran (JP)
          per tingkat.
        </p>
        {bisaEdit && (
          <button
            type="button"
            onClick={() => setFormBuka(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800"
          >
            + Tambah Mata Pelajaran
          </button>
        )}
      </div>

      {bisaKelola && !impl.is_editable && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
          Struktur dikunci karena sudah tidak berstatus Draft. Untuk mengubah,
          minta kepala sekolah menolak (mengembalikan ke Draft) terlebih dulu.
        </div>
      )}

      {tingkatKosong.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
          Belum ada mata pelajaran untuk:{" "}
          {tingkatKosong.map((t) => `Kelas ${t}`).join(", ")}. Semua tingkat
          harus terisi sebelum struktur bisa diajukan review.
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Memuat struktur...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Gagal memuat struktur kurikulum.</p>
      ) : perTingkat.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Struktur masih kosong.
          {bisaEdit && " Klik \"Tambah Mata Pelajaran\" untuk mulai."}
        </p>
      ) : (
        perTingkat.map(([tingkat, baris]) => {
          const totalJp = baris.reduce(
            (n, r) => n + (Number(r.alokasi_jp_minggu) || 0),
            0,
          );
          return (
            <div key={tingkat} className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
                <span className="text-sm font-semibold text-gray-800">
                  Kelas {tingkat}
                </span>
                <span className="text-xs text-gray-500">
                  {baris.length} mapel · {totalJp} JP/minggu
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400">
                      <th className="px-4 py-2 font-medium">Mata pelajaran</th>
                      <th className="px-4 py-2 font-medium">Komponen</th>
                      <th className="px-4 py-2 font-medium text-right">
                        JP/minggu
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        JP/tahun
                      </th>
                      <th className="px-4 py-2 font-medium">Wajib</th>
                      {bisaEdit && <th className="px-4 py-2" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {baris.map((r) => (
                      <tr key={r.ulid}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900">
                            {r.mapel?.nama ?? "-"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {[r.mapel?.kode, r.kelompok]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {labelKomponen(r.jenis_komponen)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {r.alokasi_jp_minggu}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">
                          {r.alokasi_jp_tahun ?? "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {r.is_wajib ? "Ya" : "Tidak"}
                        </td>
                        {bisaEdit && (
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setBarisUbah(r)}
                              className="text-xs font-medium text-emerald-700 hover:underline mr-3"
                            >
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => setBarisHapus(r)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Hapus
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      <Modal
        isOpen={formBuka}
        onClose={() => setFormBuka(false)}
        title="Tambah Mata Pelajaran"
        size="lg"
      >
        <FormStruktur
          implementasiUlid={impl.ulid}
          tingkatPilihan={tingkatTersedia}
          rows={rows}
          baris={null}
          onClose={() => setFormBuka(false)}
        />
      </Modal>

      <Modal
        isOpen={!!barisUbah}
        onClose={() => setBarisUbah(null)}
        title="Ubah Struktur"
        size="lg"
      >
        {barisUbah && (
          <FormStruktur
            implementasiUlid={impl.ulid}
            tingkatPilihan={tingkatTersedia}
            rows={rows}
            baris={barisUbah}
            onClose={() => setBarisUbah(null)}
          />
        )}
      </Modal>

      <Confirm
        isOpen={!!barisHapus}
        onClose={() => setBarisHapus(null)}
        onConfirm={() =>
          hapus.mutate(
            { ulid: barisHapus.ulid, implementasiUlid: impl.ulid },
            { onSuccess: () => setBarisHapus(null) },
          )
        }
        isLoading={hapus.isPending}
        title="Hapus dari struktur?"
        message={`${barisHapus?.mapel?.nama ?? "Mata pelajaran"} akan dihapus dari struktur Kelas ${barisHapus?.tingkat ?? ""}.`}
        confirmLabel="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
