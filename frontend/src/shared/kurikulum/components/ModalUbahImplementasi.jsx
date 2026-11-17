import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useUbahImplementasi } from "@/hooks/api/useKurikulum";
import { tingkatSekolah } from "../tingkatSekolah";

function FormUbah({ impl, onClose }) {
  const { school } = useAuth();
  const TINGKAT = tingkatSekolah(school?.jenjang);
  const ubah = useUbahImplementasi();
  const [tingkat, setTingkat] = useState(impl.tingkat_kelas ?? TINGKAT);
  const [catatan, setCatatan] = useState(impl.catatan ?? "");

  const toggle = (t) =>
    setTingkat((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const kirim = () =>
    ubah.mutate(
      {
        ulid: impl.ulid,
        tingkat_kelas: [...tingkat].sort((a, b) => a - b),
        catatan: catatan.trim() || null,
      },
      { onSuccess: onClose },
    );

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        <span className="font-medium">{impl.kurikulum?.nama}</span> ·{" "}
        {impl.tahun_ajaran?.tahun}
      </p>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Tingkat kelas
        </label>
        <div className="flex flex-wrap gap-2">
          {TINGKAT.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                tingkat.includes(t)
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {tingkat.length === 0 && (
          <p className="text-xs text-red-500">Pilih minimal satu tingkat.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Catatan</label>
        <textarea
          rows={3}
          maxLength={500}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={ubah.isPending}
          className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={kirim}
          disabled={ubah.isPending || tingkat.length === 0}
          className="px-4 py-2 rounded-xl text-sm bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {ubah.isPending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

export default function ModalUbahImplementasi({ impl, onClose }) {
  return (
    <Modal
      isOpen={!!impl}
      onClose={onClose}
      title="Ubah Implementasi"
      size="lg"
    >
      {impl && <FormUbah key={impl.ulid} impl={impl} onClose={onClose} />}
    </Modal>
  );
}
