import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, Pencil, Trash2 } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import Confirm from "@/components/ui/Confirm";
import {
  useDaftarImplementasi,
  useHapusImplementasi,
} from "@/hooks/api/useKurikulum";
import ModalUbahImplementasi from "./components/ModalUbahImplementasi";
import ImplementasiStatusBadge from "./components/ImplementasiStatusBadge";
import {
  IMPLEMENTASI_LANGKAH,
  IMPLEMENTASI_STATUS,
} from "./implementasiStatus";

/**
 * Daftar implementasi kurikulum satu sekolah (lintas tahun ajaran).
 * Dipakai kepsek (antrian review) dan superadmin (pantau, read-only).
 * Sumber data mengikuti KurikulumBaseProvider.
 *
 * Props:
 *   detailPath: awalan route detail, mis. "/kepsek/kurikulum/implementasi"
 */
export default function DaftarImplementasiKurikulum({
  detailPath,
  judul = "Kurikulum",
  deskripsi,
  kelola = false, // true hanya untuk wakasek: tampilkan Ubah/Hapus pada baris Draft
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [ubah, setUbah] = useState(null);
  const [hapus, setHapus] = useState(null);
  const hapusMut = useHapusImplementasi();
  const { data: res, isLoading, isError, error } = useDaftarImplementasi();

  const rows = useMemo(() => res?.data ?? [], [res]);
  const jumlah = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      m[r.status] = (m[r.status] ?? 0) + 1;
    });
    return m;
  }, [rows]);
  const tampil = filter ? rows.filter((r) => r.status === filter) : rows;

  const tab = [
    ["", "Semua", rows.length],
    ...IMPLEMENTASI_LANGKAH.map((s) => [
      s,
      IMPLEMENTASI_STATUS[s].label,
      jumlah[s] ?? 0,
    ]),
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen size={20} className="text-emerald-700" />
          {judul}
        </h1>
        {deskripsi && <p className="text-sm text-gray-500 mt-1">{deskripsi}</p>}
      </header>

      <div className="flex flex-wrap gap-2">
        {tab.map(([nilai, label, n]) => (
          <button
            key={nilai || "semua"}
            type="button"
            onClick={() => setFilter(nilai)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === nilai
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label} ({n})
          </button>
        ))}
      </div>

      <SectionCard title="Implementasi Kurikulum">
        {isLoading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : isError ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>
              {error?.response?.data?.message ??
                "Gagal memuat daftar kurikulum."}
            </span>
          </div>
        ) : tampil.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Belum ada implementasi kurikulum.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Kurikulum</th>
                  <th className="py-2 pr-4 font-medium">Tahun Ajaran</th>
                  <th className="py-2 pr-4 font-medium">Tingkat</th>
                  <th className="py-2 pr-4 font-medium">Struktur</th>
                  <th className="py-2 font-medium">Status</th>
                  {kelola && <th className="py-2 w-24" />}
                </tr>
              </thead>
              <tbody>
                {tampil.map((r) => (
                  <tr
                    key={r.ulid}
                    onClick={() => navigate(`${detailPath}/${r.ulid}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-800">
                        {r.kurikulum?.nama}
                      </p>
                      <p className="text-xs text-gray-400">
                        {r.kurikulum?.kode}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {r.tahun_ajaran?.tahun}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {Array.isArray(r.tingkat_kelas) && r.tingkat_kelas.length
                        ? r.tingkat_kelas.join(", ")
                        : "Semua"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {r.jumlah_struktur} baris
                    </td>
                    <td className="py-3">
                      <ImplementasiStatusBadge status={r.status} />
                    </td>
                    {kelola && (
                      <td className="py-3 pl-4">
                        {r.status === "draft" && (
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="Ubah"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUbah(r);
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title={
                                r.jumlah_struktur > 0
                                  ? "Hapus struktur mapel dulu"
                                  : "Hapus"
                              }
                              disabled={r.jumlah_struktur > 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setHapus(r);
                              }}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <ModalUbahImplementasi impl={ubah} onClose={() => setUbah(null)} />

      <Confirm
        isOpen={!!hapus}
        onClose={() => setHapus(null)}
        onConfirm={() =>
          hapusMut.mutate(hapus.ulid, { onSettled: () => setHapus(null) })
        }
        isLoading={hapusMut.isPending}
        title="Hapus Implementasi"
        message={`Hapus "${hapus?.kurikulum?.nama}" dari tahun ajaran ${hapus?.tahun_ajaran?.tahun}?`}
        variant="danger"
        confirmLabel="Ya, Hapus"
      />
    </div>
  );
}
