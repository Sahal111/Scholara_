import { useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Confirm from "@/components/ui/Confirm";
import {
  useKurikulumPlatformList,
  useBuatKurikulumPlatform,
  useUbahKurikulumPlatform,
  useAktifkanKurikulumPlatform,
  useNonaktifkanKurikulumPlatform,
  useHapusKurikulumPlatform,
} from "@/hooks/api/useKurikulumPlatform";

const JENIS = [
  { value: "nasional", label: "Nasional" },
  { value: "internasional", label: "Internasional" },
  { value: "khusus", label: "Kurikulum Khusus" },
  { value: "custom", label: "Kurikulum Mandiri" },
];

const KOSONG = {
  nama: "",
  kode: "",
  jenis: "nasional",
  tahun_berlaku: new Date().getFullYear(),
  tahun_berakhir: "",
  penerbit: "",
  deskripsi: "",
  is_platform_default: false,
};

const INPUT =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600/30";

function FormKurikulum({ awal, onClose }) {
  const [f, setF] = useState(
    awal
      ? {
          ...KOSONG,
          ...awal,
          tahun_berakhir: awal.tahun_berakhir ?? "",
          penerbit: awal.penerbit ?? "",
          deskripsi: awal.deskripsi ?? "",
        }
      : KOSONG,
  );
  const buat = useBuatKurikulumPlatform();
  const ubah = useUbahKurikulumPlatform();
  const proses = buat.isPending || ubah.isPending;
  const set = (k) => (e) =>
    setF((p) => ({
      ...p,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const kirim = (e) => {
    e.preventDefault();
    const payload = {
      nama: f.nama.trim(),
      kode: f.kode.trim(),
      jenis: f.jenis,
      tahun_berlaku: Number(f.tahun_berlaku),
      tahun_berakhir: f.tahun_berakhir === "" ? null : Number(f.tahun_berakhir),
      penerbit: f.penerbit.trim() || null,
      deskripsi: f.deskripsi.trim() || null,
      is_platform_default: !!f.is_platform_default,
    };
    const opsi = { onSuccess: onClose };
    if (awal) ubah.mutate({ ulid: awal.ulid, ...payload }, opsi);
    else buat.mutate(payload, opsi);
  };

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-sm">
          Nama
          <input
            required
            maxLength={100}
            value={f.nama}
            onChange={set("nama")}
            className={INPUT}
          />
        </label>
        <label className="text-sm">
          Kode
          <input
            required
            maxLength={30}
            value={f.kode}
            onChange={set("kode")}
            className={INPUT}
            placeholder="MERDEKA"
          />
        </label>
        <label className="text-sm">
          Jenis
          <select value={f.jenis} onChange={set("jenis")} className={INPUT}>
            {JENIS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Tahun berlaku
          <input
            required
            type="number"
            min={1900}
            max={2100}
            value={f.tahun_berlaku}
            onChange={set("tahun_berlaku")}
            className={INPUT}
          />
        </label>
        <label className="text-sm">
          Tahun berakhir (opsional)
          <input
            type="number"
            min={1900}
            max={2100}
            value={f.tahun_berakhir}
            onChange={set("tahun_berakhir")}
            className={INPUT}
          />
        </label>
        <label className="col-span-2 text-sm">
          Penerbit
          <input
            maxLength={100}
            value={f.penerbit}
            onChange={set("penerbit")}
            className={INPUT}
          />
        </label>
        <label className="col-span-2 text-sm">
          Deskripsi
          <textarea
            rows={3}
            maxLength={1000}
            value={f.deskripsi}
            onChange={set("deskripsi")}
            className={INPUT}
          />
        </label>
        <label className="col-span-2 text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!f.is_platform_default}
            onChange={set("is_platform_default")}
          />
          Jadikan default untuk jenis ini (default jenis lain otomatis dilepas)
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={proses}
          className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={proses}
          className="px-4 py-2 rounded-xl text-sm bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {proses ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

export default function KurikulumPlatform() {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null); // null | "baru" | objek kurikulum
  const [hapus, setHapus] = useState(null);

  const { data, isLoading } = useKurikulumPlatformList({ search });
  const aktifkan = useAktifkanKurikulumPlatform();
  const nonaktifkan = useNonaktifkanKurikulumPlatform();
  const hapusMut = useHapusKurikulumPlatform();

  const rows = data?.data ?? [];

  return (
    <div className="rounded-2xl bg-[#f8fafc] text-gray-800 p-6 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Kurikulum Platform
          </h1>
          <p className="text-sm text-gray-500">
            Kurikulum bawaan yang tersedia untuk semua sekolah.
          </p>
        </div>
        <button
          onClick={() => setForm("baru")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800"
        >
          <Plus size={16} /> Tambah Kurikulum
        </button>
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama atau kode..."
        className={`${INPUT} max-w-sm bg-white`}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b border-gray-100">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Kode</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Tahun</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-4 text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-gray-400">
                  Belum ada kurikulum platform.
                </td>
              </tr>
            )}
            {rows.map((k) => (
              <tr
                key={k.ulid}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="p-3 font-medium">
                  {k.nama}
                  {k.is_platform_default && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700">
                      Default
                    </span>
                  )}
                </td>
                <td className="p-3">{k.kode}</td>
                <td className="p-3">{k.jenis_label}</td>
                <td className="p-3">
                  {k.tahun_berlaku}
                  {k.tahun_berakhir ? `–${k.tahun_berakhir}` : ""}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${k.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {k.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button
                      title="Ubah"
                      onClick={() => setForm(k)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title={k.is_active ? "Nonaktifkan" : "Aktifkan"}
                      onClick={() =>
                        (k.is_active ? nonaktifkan : aktifkan).mutate(k.ulid)
                      }
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Power size={15} />
                    </button>
                    <button
                      title="Hapus"
                      onClick={() => setHapus(k)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={
          form === "baru"
            ? "Tambah Kurikulum Platform"
            : "Ubah Kurikulum Platform"
        }
        size="lg"
      >
        {form && (
          <FormKurikulum
            awal={form === "baru" ? null : form}
            onClose={() => setForm(null)}
          />
        )}
      </Modal>

      <Confirm
        isOpen={!!hapus}
        onClose={() => setHapus(null)}
        onConfirm={() =>
          hapusMut.mutate(hapus.ulid, { onSettled: () => setHapus(null) })
        }
        isLoading={hapusMut.isPending}
        title="Hapus kurikulum platform?"
        message={`"${hapus?.nama}" akan dihapus. Gagal kalau sudah dipakai sekolah mana pun.`}
        confirmLabel="Ya, Hapus"
      />
    </div>
  );
}
