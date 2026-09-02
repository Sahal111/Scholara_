import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/program-pendidikan";

export const programKeys = {
  all: ["program-pendidikan"],
  lists: () => [...programKeys.all, "list"],
  list: (filters) => [...programKeys.lists(), filters],
  // trees() = prefix untuk invalidate SEMUA varian tree sekaligus
  trees: () => [...programKeys.all, "tree"],
  tree: (filters) => [...programKeys.trees(), filters],
  details: () => [...programKeys.all, "detail"],
  detail: (id) => [...programKeys.details(), id],
  // dropdowns() = prefix untuk invalidate semua varian dropdown
  dropdowns: () => [...programKeys.all, "dropdown"],
  dropdown: (params) => [...programKeys.dropdowns(), params],
  trash: () => [...programKeys.all, "trash"],
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
      const { data } = await api.get(`${BASE}/tree`, { params: params ?? {} });
      return data;
    },
    enabled: params !== null,
    staleTime: 60_000,
  });
}

export function useProgramDetail(ulid) {
  return useQuery({
    queryKey: programKeys.detail(ulid),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${ulid}`);
      return data;
    },
    enabled: Boolean(ulid),
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
      qc.invalidateQueries({ queryKey: programKeys.trees() });
      toast.success("Program pendidikan berhasil ditambahkan.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message ?? "Gagal menyimpan.");
    },
  });
}

// Pakai ulid bukan integer id
export function useUpdateProgram(ulid) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`${BASE}/${ulid}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.lists() });
      qc.invalidateQueries({ queryKey: programKeys.trees() });
      qc.invalidateQueries({ queryKey: programKeys.detail(ulid) });
      toast.success("Program pendidikan berhasil diperbarui.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message ?? "Gagal memperbarui.");
    },
  });
}

/**
 * Toggle status aktif/nonaktif program.
 * Pakai endpoint PATCH dedicated — tidak overwrite field lain.
 */
export function useToggleProgramStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/toggle-active`),
    onSuccess: (_, ulid) => {
      qc.invalidateQueries({ queryKey: programKeys.lists() });
      qc.invalidateQueries({ queryKey: programKeys.trees() });
      qc.invalidateQueries({ queryKey: programKeys.dropdowns() });
      qc.invalidateQueries({ queryKey: programKeys.detail(ulid) });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal mengubah status.");
    },
  });
}

// Pakai ulid bukan integer id
export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.delete(`${BASE}/${ulid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.lists() });
      qc.invalidateQueries({ queryKey: programKeys.trees() });
      qc.invalidateQueries({ queryKey: programKeys.trash() });
      toast.success("Program pendidikan berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus.");
    },
  });
}

// ── Recycle Bin ───────────────────────────────────────────────────────────────

export function useTrashProgram() {
  return useQuery({
    queryKey: programKeys.trash(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/trash`);
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useRestoreProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.trash() });
      qc.invalidateQueries({ queryKey: programKeys.lists() });
      qc.invalidateQueries({ queryKey: programKeys.trees() });
      qc.invalidateQueries({ queryKey: programKeys.dropdowns() });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal memulihkan program.");
    },
  });
}

export function useForceDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.delete(`${BASE}/${ulid}/force-delete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.trash() });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus permanen.");
    },
  });
}
