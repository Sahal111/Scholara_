import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import {
  useAturanProgram,
  useSimpanAturanProgram,
} from "@/hooks/api/useKurikulum";

export default function ModalAturanProgram({ kurikulum, onClose }) {
  const { data, isLoading } = useAturanProgram(kurikulum?.ulid);
  const simpan = useSimpanAturanProgram();
  const aturan = data?.data;
  const readOnly = !aturan?.bisa_diubah;

  const [dibatasi, setDibatasi] = useState(false);
  const [pilih, setPilih] = useState([]);

  useEffect(() => {
    if (!aturan) return;
    setDibatasi(aturan.dibatasi);
    setPilih(aturan.jenis.filter((j) => j.diizinkan).map((j) => j.value));
  }, [aturan]);

  const toggle = (v) =>
    setPilih((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const pilihBerlaku = (aturan?.jenis ?? [])
    .filter((j) => j.berlaku_di_sekolah && pilih.includes(j.value))
    .map((j) => j.value);

  const handleSimpan = () =>
    simpan.mutate(
      { ulid: kurikulum.ulid, jenis: dibatasi ? pilih : [] },
      { onSuccess: onClose },
    );

  return (
    <Modal
      isOpen={Boolean(kurikulum)}
      onClose={onClose}
      title={`Aturan Program — ${kurikulum?.nama ?? ""}`}
      size="md"
    >
      <div className="p-6 space-y-4">
        {isLoading || !aturan ? (
          <p className="text-sm text-gray-500">Memuat…</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Menentukan jenis program pendidikan yang boleh dipakai sekolah
              saat kurikulum ini berlaku.
              {readOnly &&
                " Kurikulum bawaan Scholara tidak bisa diubah sekolah."}
            </p>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={dibatasi}
                disabled={readOnly}
                onChange={(e) => setDibatasi(e.target.checked)}
              />
              Batasi jenis program
            </label>
            {!dibatasi && (
              <p className="text-xs text-gray-500">
                Tidak dibatasi: semua jenis program sesuai jenjang sekolah boleh
                dipakai.
              </p>
            )}

            <div className="grid grid-cols-1 gap-2">
              {aturan.jenis.map((j) => (
                <label
                  key={j.value}
                  className={`flex items-center gap-2 text-sm ${
                    dibatasi && j.berlaku_di_sekolah ? "" : "opacity-40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={pilih.includes(j.value)}
                    disabled={readOnly || !dibatasi || !j.berlaku_di_sekolah}
                    onChange={() => toggle(j.value)}
                  />
                  {j.label}
                  {!j.berlaku_di_sekolah && (
                    <span className="text-xs text-gray-400">
                      (tidak dipakai di jenjang sekolah ini)
                    </span>
                  )}
                </label>
              ))}
            </div>
            {dibatasi && pilihBerlaku.length === 0 && (
              <p className="text-xs text-red-500">Pilih minimal satu jenis.</p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          {readOnly ? "Tutup" : "Batal"}
        </button>
        {!readOnly && (
          <button
            type="button"
            onClick={handleSimpan}
            disabled={
              simpan.isPending || (dibatasi && pilihBerlaku.length === 0)
            }
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#006e2a] text-white hover:bg-[#005a22] disabled:opacity-50"
          >
            {simpan.isPending ? "Menyimpan…" : "Simpan"}
          </button>
        )}
      </div>
    </Modal>
  );
}
