import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { kurikulumKeys } from "./useKurikulum";

const BASE = "/superadmin/kurikulum-platform";
const KEY = ["kurikulum-platform"];

export function useKurikulumPlatformList(params = {}) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: async () => (await api.get(BASE, { params })).data,
    placeholderData: (prev) => prev,
  });
}

/** Satu pabrik mutasi: semua aksi invalidasi daftar platform + dropdown sekolah. */
function useAksi(fn, pesanSukses, pesanGagal) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: kurikulumKeys.all });
      toast.success(pesanSukses);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? pesanGagal),
  });
}

export const useBuatKurikulumPlatform = () =>
  useAksi(
    (p) => api.post(BASE, p),
    "Kurikulum platform ditambahkan.",
    "Gagal menambahkan.",
  );

export const useUbahKurikulumPlatform = () =>
  useAksi(
    ({ ulid, ...p }) => api.put(`${BASE}/${ulid}`, p),
    "Kurikulum platform diperbarui.",
    "Gagal memperbarui.",
  );

export const useAktifkanKurikulumPlatform = () =>
  useAksi(
    (ulid) => api.patch(`${BASE}/${ulid}/activate`),
    "Diaktifkan.",
    "Gagal mengaktifkan.",
  );

export const useNonaktifkanKurikulumPlatform = () =>
  useAksi(
    (ulid) => api.patch(`${BASE}/${ulid}/deactivate`),
    "Dinonaktifkan.",
    "Gagal menonaktifkan.",
  );

export const useHapusKurikulumPlatform = () =>
  useAksi(
    (ulid) => api.delete(`${BASE}/${ulid}`),
    "Kurikulum platform dihapus.",
    "Gagal menghapus.",
  );
