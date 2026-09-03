import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/v1/master-data/kurikulum";

// ── Query keys ────────────────────────────────────────────────────────────────
export const kurikulumKeys = {
  all: ["kurikulum"],
  lists: () => [...kurikulumKeys.all, "list"],
  list: (filters) => [...kurikulumKeys.lists(), filters],
  details: () => [...kurikulumKeys.all, "detail"],
  detail: (ulid) => [...kurikulumKeys.details(), ulid],
  dropdowns: () => [...kurikulumKeys.all, "dropdown"],
  dropdown: () => [...kurikulumKeys.dropdowns()],
};

// ── Queries ───────────────────────────────────────────────────────────────────
export function useKurikulumList(params = {}) {
  return useQuery({
    queryKey: kurikulumKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get(BASE, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useKurikulumDetail(ulid) {
  return useQuery({
    queryKey: kurikulumKeys.detail(ulid),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${ulid}`);
      return data;
    },
    enabled: !!ulid,
  });
}

export function useKurikulumDropdown() {
  return useQuery({
    queryKey: kurikulumKeys.dropdown(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/dropdown`);
      return data;
    },
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useCreateKurikulum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.lists() });
      qc.invalidateQueries({ queryKey: kurikulumKeys.dropdowns() });
      toast.success("Kurikulum berhasil ditambahkan.");
    },
    onError: (err) => {
      const msg = err.response?.data?.message ?? "Gagal menambahkan kurikulum.";
      toast.error(msg);
    },
  });
}

export function useUpdateKurikulum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ulid, ...payload }) => api.put(`${BASE}/${ulid}`, payload),
    onSuccess: (_, { ulid }) => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.lists() });
      qc.invalidateQueries({ queryKey: kurikulumKeys.detail(ulid) });
      qc.invalidateQueries({ queryKey: kurikulumKeys.dropdowns() });
      toast.success("Kurikulum berhasil diperbarui.");
    },
    onError: (err) => {
      const msg = err.response?.data?.message ?? "Gagal memperbarui kurikulum.";
      toast.error(msg);
    },
  });
}

export function useDeactivateKurikulum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.lists() });
      qc.invalidateQueries({ queryKey: kurikulumKeys.dropdowns() });
      toast.success("Kurikulum berhasil dinonaktifkan.");
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ?? "Gagal menonaktifkan kurikulum.";
      toast.error(msg);
    },
  });
}

export function useDeleteKurikulum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.delete(`${BASE}/${ulid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.lists() });
      qc.invalidateQueries({ queryKey: kurikulumKeys.dropdowns() });
      toast.success("Kurikulum berhasil dihapus.");
    },
    onError: (err) => {
      const msg = err.response?.data?.message ?? "Gagal menghapus kurikulum.";
      toast.error(msg);
    },
  });
}
