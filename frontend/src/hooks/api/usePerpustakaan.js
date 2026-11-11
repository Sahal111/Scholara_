import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/perpustakaan";

export const perpustakaanKeys = {
  all: ["perpustakaan"],
  buku: {
    all: ["perpustakaan", "buku"],
    list: (filters) => ["perpustakaan", "buku", "list", filters],
    detail: (id) => ["perpustakaan", "buku", "detail", id],
    stats: () => ["perpustakaan", "buku", "stats"],
    dropdown: () => ["perpustakaan", "buku", "dropdown"],
  },
  peminjaman: {
    all: ["perpustakaan", "peminjaman"],
    list: (filters) => ["perpustakaan", "peminjaman", "list", filters],
    detail: (id) => ["perpustakaan", "peminjaman", "detail", id],
    laporan: (filters) => ["perpustakaan", "peminjaman", "laporan", filters],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// BUKU
// ══════════════════════════════════════════════════════════════════════════════

export function useBukuList(params = {}) {
  return useQuery({
    queryKey: perpustakaanKeys.buku.list(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/buku`, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

export function useBukuStats() {
  return useQuery({
    queryKey: perpustakaanKeys.buku.stats(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/buku/stats`);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useBukuDropdown() {
  return useQuery({
    queryKey: perpustakaanKeys.buku.dropdown(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/buku/dropdown`);
      return data;
    },
    staleTime: 120_000,
  });
}

export function useBukuDetail(id) {
  return useQuery({
    queryKey: perpustakaanKeys.buku.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/buku/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useTambahBuku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/buku`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: perpustakaanKeys.buku.all });
      toast.success("Buku berhasil ditambahkan.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menambahkan buku."),
  });
}

export function useEditBuku(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`${BASE}/buku/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: perpustakaanKeys.buku.all });
      toast.success("Data buku berhasil diperbarui.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal memperbarui buku."),
  });
}

export function useHapusBuku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/buku/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: perpustakaanKeys.buku.all });
      toast.success("Buku berhasil dihapus.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menghapus buku."),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// PEMINJAMAN
// ══════════════════════════════════════════════════════════════════════════════

export function usePeminjamanList(params = {}) {
  return useQuery({
    queryKey: perpustakaanKeys.peminjaman.list(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/peminjaman`, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function usePeminjamanDetail(id) {
  return useQuery({
    queryKey: perpustakaanKeys.peminjaman.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/peminjaman/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useLaporanPeminjaman(params = {}) {
  return useQuery({
    queryKey: perpustakaanKeys.peminjaman.laporan(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/peminjaman/laporan`, { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useTambahPeminjaman() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/peminjaman`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: perpustakaanKeys.peminjaman.all });
      qc.invalidateQueries({ queryKey: perpustakaanKeys.buku.all });
      toast.success("Peminjaman berhasil dicatat.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mencatat peminjaman."),
  });
}

export function useKembalikanBuku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`${BASE}/peminjaman/${id}/kembalikan`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: perpustakaanKeys.peminjaman.all });
      qc.invalidateQueries({ queryKey: perpustakaanKeys.buku.all });
      toast.success("Buku berhasil dikembalikan.");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mencatat pengembalian."),
  });
}

