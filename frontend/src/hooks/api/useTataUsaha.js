import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/tata-usaha";

export const tataUsahaKeys = {
  all: ["tata-usaha"],
  surat: {
    all: ["tata-usaha", "surat"],
    list: (filters) => ["tata-usaha", "surat", "list", filters],
    detail: (id) => ["tata-usaha", "surat", "detail", id],
    stats: () => ["tata-usaha", "surat", "stats"],
  },
  legalisir: {
    all: ["tata-usaha", "legalisir"],
    list: (filters) => ["tata-usaha", "legalisir", "list", filters],
    detail: (id) => ["tata-usaha", "legalisir", "detail", id],
    stats: () => ["tata-usaha", "legalisir", "stats"],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// SURAT
// ══════════════════════════════════════════════════════════════════════════════

export function useSuratList(params = {}) {
  return useQuery({
    queryKey: tataUsahaKeys.surat.list(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/surat`, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useSuratStats() {
  return useQuery({
    queryKey: tataUsahaKeys.surat.stats(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/surat/stats`);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useSuratDetail(id) {
  return useQuery({
    queryKey: tataUsahaKeys.surat.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/surat/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useTambahSurat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/surat`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tataUsahaKeys.surat.all });
      toast.success("Surat berhasil ditambahkan.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan surat."),
  });
}

export function useEditSurat(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`${BASE}/surat/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tataUsahaKeys.surat.all });
      toast.success("Surat berhasil diperbarui.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal memperbarui surat."),
  });
}

export function useHapusSurat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/surat/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tataUsahaKeys.surat.all });
      toast.success("Surat berhasil dihapus.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menghapus surat."),
  });
}

export function useArsipSurat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`${BASE}/surat/${id}/arsip`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tataUsahaKeys.surat.all });
      toast.success("Surat berhasil diarsipkan.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengarsipkan surat."),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// LEGALISIR
// ══════════════════════════════════════════════════════════════════════════════

export function useLegalisirList(params = {}) {
  return useQuery({
    queryKey: tataUsahaKeys.legalisir.list(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/legalisir`, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useLegalisirStats() {
  return useQuery({
    queryKey: tataUsahaKeys.legalisir.stats(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/legalisir/stats`);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useTambahLegalisir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/legalisir`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tataUsahaKeys.legalisir.all });
      toast.success("Permohonan legalisir berhasil dicatat.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mencatat legalisir."),
  });
}

export function useProsesLegalisir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.patch(`${BASE}/legalisir/${id}/proses`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tataUsahaKeys.legalisir.all });
      toast.success("Status legalisir berhasil diperbarui.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal memperbarui status."),
  });
}

