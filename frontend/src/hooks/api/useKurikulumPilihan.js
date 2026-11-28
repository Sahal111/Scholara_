import { useKurikulumList } from "./useKurikulum";

/**
 * Pilihan kurikulum untuk dropdown form Kelas & Mapel.
 * Kurikulum yang implementasinya "Berlaku" ditandai dan diurutkan paling atas.
 */
export function useKurikulumPilihan() {
  const { data, isLoading } = useKurikulumList({ is_active: 1, per_page: 100 });

  const rows = Array.isArray(data?.data?.data)
    ? data.data.data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  const options = rows
    .filter((k) => k.is_masih_berlaku !== false)
    .map((k) => {
      const berlaku = k.implementasi_status === "active";
      return {
        ulid: k.ulid,
        nama: k.nama,
        kode: k.kode,
        berlaku,
        label: `${k.nama} (${k.kode})${berlaku ? " — ✓ Berlaku" : ""}`,
      };
    })
    .sort((a, b) => Number(b.berlaku) - Number(a.berlaku));

  return { options, isLoading };
}
