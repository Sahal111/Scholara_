import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/program-pendidikan";

export const programKeys = {
  all: ["program-pendidikan"],
  lists: () => [...programKeys.all, "list"],
  list: (filters) => [...programKeys.lists(), filters],
  tree: (filters) => [...programKeys.all, "tree", filters],
  details: () => [...programKeys.all, "detail"],
  detail: (id) => [...programKeys.details(), id],
  dropdown: (params) => [...programKeys.all, "dropdown", params],
};

export function useProgramList(params = {}) {
  return useQuery({
    queryKey: programKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get(BASE, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useProgramTree(params = {}) {
  return useQuery({
    queryKey: programKeys.tree(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/tree`, { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useProgramDetail(id) {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${id}`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useProgramDropdown(params = {}) {
  return useQuery({
    queryKey: programKeys.dropdown(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/dropdown`, { params });
      return data;
    },
    staleTime: 120_000,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.lists() });
      qc.invalidateQueries({ queryKey: programKeys.tree() });
      toast.success("Program pendidikan berhasil ditambahkan.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message ?? "Gagal menyimpan.");
    },
  });
}

export function useUpdateProgram(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`${BASE}/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.lists() });
      qc.invalidateQueries({ queryKey: programKeys.tree() });
      qc.invalidateQueries({ queryKey: programKeys.detail(id) });
      toast.success("Program pendidikan berhasil diperbarui.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message ?? "Gagal memperbarui.");
    },
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.lists() });
      qc.invalidateQueries({ queryKey: programKeys.tree() });
      toast.success("Program pendidikan berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus.");
    },
  });
}
