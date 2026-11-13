import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDaftarkanKurikulumKeTahunAjaran,
  useKurikulumDropdown,
  useKurikulumUntukTahunAjaran,
} from "@/hooks/api/useKurikulum";
import ImplementasiStatusBadge from "./ImplementasiStatusBadge";

const TINGKAT_JENJANG = {
  dasar: [1, 2, 3, 4, 5, 6],
  menengah_pertama: [7, 8, 9],
  menengah_atas: [10, 11, 12],
};

const JENIS_LABEL = {
  nasional: "Nasional",
  internasional: "Internasional",
  custom: "Custom",
};

function labelTingkat(tingkat) {
  return Array.isArray(tingkat) && tingkat.length > 0
    ? `Kelas ${tingkat.join(", ")}`
    : "Semua tingkat";
}

/**
 * Isi modal "Daftarkan Kurikulum".
 * Dipisah menjadi komponen sendiri supaya data dropdown baru diambil saat modal dibuka.
 */
function FormDaftarkan({ tahunAjaranUlid, sudahTerdaftar, onClose }) {
  const { data: res, isLoading } = useKurikulumDropdown();
  const daftarkan = useDaftarkanKurikulumKeTahunAjaran();
  const { user } = useAuth();
  const TINGKAT = TINGKAT_JENJANG[user?.school?.jenjang] ?? [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ];

  const [kurikulumUlid, setKurikulumUlid] = useState("");
  const [tingkat, setTingkat] = useState([]);

  const pilihan = (res?.data ?? []).filter((k) => !sudahTerdaftar.has(k.ulid));

  const toggleTingkat = (t) =>
    setTingkat((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const kirim = () => {
    daftarkan.mutate(
      {
        kurikulum_ulid: kurikulumUlid,
        tahun_ajaran_ulid: tahunAjaranUlid,
        ...(tingkat.length > 0
          ? { tingkat_kelas: [...tingkat].sort((a, b) => a - b) }
          : {}),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Kurikulum</label>
        <select
          value={kurikulumUlid}
          onChange={(e) => setKurikulumUlid(e.target.value)}
          disabled={isLoading}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
        >
          <option value="">
            {isLoading ? "Memuat..." : "Pilih kurikulum"}
          </option>
          {pilihan.map((k) => (
            <option key={k.ulid} value={k.ulid}>
              {k.nama} ({k.kode})
            </option>
          ))}
        </select>
        {!isLoading && pilihan.length === 0 && (
          <p className="text-xs text-gray-400">
            Semua kurikulum yang tersedia sudah terdaftar di tahun ajaran ini.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Tingkat kelas <span className="text-gray-400">(opsional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TINGKAT.map((t) => {
            const aktif = tingkat.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTingkat(t)}
                className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                  aktif
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400">
          Kosongkan untuk memberlakukan ke semua tingkat.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={daftarkan.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={kirim}
          disabled={!kurikulumUlid || daftarkan.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {daftarkan.isPending ? "Mendaftarkan..." : "Daftarkan"}
        </button>
      </div>
    </div>
  );
}

/**
 * Bagian "Kurikulum" pada halaman detail Tahun Ajaran.
 * Menampilkan implementasi kurikulum beserta status workflow-nya, dan menjadi
 * pintu masuk ke halaman workflow (setujui / aktifkan / dst).
 *
 * Props:
 *   tahunAjaranUlid : ULID tahun ajaran
 *   detailPath      : prefix route halaman workflow, mis. "/wakasek/kurikulum/implementasi".
 *                     null = tanpa tombol "Buka" (role yang tidak punya halaman itu).
 */
export default function KurikulumTahunAjaranSection({
  tahunAjaranUlid,
  detailPath,
}) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("master_data.kurikulum.manage");

  const [modalBuka, setModalBuka] = useState(false);
  const { data: res, isLoading, isError } =
    useKurikulumUntukTahunAjaran(tahunAjaranUlid);

  const rows = res?.data ?? [];
  const sudahTerdaftar = new Set(rows.map((r) => r.ulid));

  return (
    <section className="mb-16 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/50 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-700" />
            Kurikulum
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Kurikulum yang berlaku pada tahun ajaran ini beserta status
            persetujuannya.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setModalBuka(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800"
          >
            + Daftarkan Kurikulum
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Memuat kurikulum...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Gagal memuat daftar kurikulum.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Belum ada kurikulum terdaftar untuk tahun ajaran ini.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((row) => (
            <li
              key={row.implementasi_ulid}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{row.nama}</p>
                <p className="text-sm text-gray-500">
                  {[row.kode, JENIS_LABEL[row.jenis] ?? row.jenis]
                    .filter(Boolean)
                    .join(" · ")}
                  {" · "}
                  {labelTingkat(row.tingkat_kelas)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ImplementasiStatusBadge status={row.status} />
                {detailPath && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`${detailPath}/${row.implementasi_ulid}`)
                    }
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Buka
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={modalBuka}
        onClose={() => setModalBuka(false)}
        title="Daftarkan Kurikulum"
        size="md"
      >
        <FormDaftarkan
          tahunAjaranUlid={tahunAjaranUlid}
          sudahTerdaftar={sudahTerdaftar}
          onClose={() => setModalBuka(false)}
        />
      </Modal>
    </section>
  );
}
