import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/siswa";

export const siswaKeys = {
  all: ["siswa"],
  lists: () => [...siswaKeys.all, "list"],
  list: (filters) => [...siswaKeys.lists(), filters],
  details: () => [...siswaKeys.all, "detail"],
  detail: (id) => [...siswaKeys.details(), id],
  stats: () => [...siswaKeys.all, "stats"],
  dropdown: (filters) => [...siswaKeys.all, "dropdown", filters],
};

/**
 * Hook untuk mengambil daftar siswa dalam format dropdown (id + nama saja).
 * Berguna untuk select/combobox di form konseling, peminjaman, dsb.
 * @param {Object} params - Filter opsional (kelas_id, angkatan, dsb.)
 */
export function useSiswaDropdown(params = {}) {
  return useQuery({
    queryKey: siswaKeys.dropdown(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/dropdown`, { params });
      return data;
    },
    staleTime: 60_000, // dropdown jarang berubah, cache 1 menit
    placeholderData: (prev) => prev,
  });
}

export function useSiswaList(params = {}) {
  return useQuery({
    queryKey: siswaKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get(BASE, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useSiswaDetail(id) {
  return useQuery({
    queryKey: siswaKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${id}`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useSiswaStats() {
  return useQuery({
    queryKey: siswaKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/stats`);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCreateSiswa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post(BASE, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siswaKeys.lists() });
      toast.success("Data siswa berhasil ditambahkan.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menambahkan siswa.");
    },
  });
}

export function useUpdateSiswa(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.put(`${BASE}/${id}`, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siswaKeys.detail(id) });
      qc.invalidateQueries({ queryKey: siswaKeys.lists() });
      toast.success("Data siswa berhasil diperbarui.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui siswa.");
    },
  });
}

export function useDeleteSiswa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siswaKeys.lists() });
      toast.success("Data siswa berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus siswa.");
    },
  });
}
