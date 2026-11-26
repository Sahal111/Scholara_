import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/kelas";

export const kelasKeys = {
  all: ["kelas"],
  lists: () => [...kelasKeys.all, "list"],
  list: (filters) => [...kelasKeys.lists(), filters],
  details: () => [...kelasKeys.all, "detail"],
  detail: (id) => [...kelasKeys.details(), id],
  dropdown: (params) => [...kelasKeys.all, "dropdown", params],
};

export function useKelasList(params = {}) {
  return useQuery({
    queryKey: kelasKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get(BASE, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useKelasDetail(id) {
  return useQuery({
    queryKey: kelasKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${id}`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

/**
 * Mapel yang berlaku untuk satu kelas (struktur kurikulum aktif, fallback katalog).
 * GET /kelas/{id}/mapel
 */
export function useMapelKelas(id) {
  return useQuery({
    queryKey: [...kelasKeys.detail(id), "mapel"],
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${id}/mapel`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/**
 * Dropdown kelas aktif (dipakai di form absensi, jadwal, dll)
 */
export function useKelasDropdown(params = {}) {
  return useQuery({
    queryKey: kelasKeys.dropdown(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/dropdown`, { params });
      return data;
    },
    staleTime: 120_000,
  });
}

export function useCreateKelas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kelasKeys.lists() });
      toast.success("Kelas berhasil ditambahkan.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menambahkan kelas.");
    },
  });
}

export function useUpdateKelas(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`${BASE}/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kelasKeys.detail(id) });
      qc.invalidateQueries({ queryKey: kelasKeys.lists() });
      toast.success("Data kelas berhasil diperbarui.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui kelas.");
    },
  });
}

export function useDeleteKelas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kelasKeys.lists() });
      toast.success("Kelas berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus kelas.");
    },
  });
}
