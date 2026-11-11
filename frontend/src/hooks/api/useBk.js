import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/bk";

// ── Query Keys ────────────────────────────────────────────────────────────────
export const bkKeys = {
  all: ["bk"],
  konseling: {
    all: ["bk", "konseling"],
    list: (filters) => ["bk", "konseling", "list", filters],
    detail: (id) => ["bk", "konseling", "detail", id],
    stats: () => ["bk", "konseling", "stats"],
  },
  catatan: {
    all: ["bk", "catatan"],
    list: (filters) => ["bk", "catatan", "list", filters],
    detail: (id) => ["bk", "catatan", "detail", id],
    bySiswa: (siswaId) => ["bk", "catatan", "siswa", siswaId],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// KONSELING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Ambil daftar sesi konseling (paginasi + filter)
 * @param {Object} params - { search, siswa_id, guru_bk_id, kategori, status, tanggal_dari, tanggal_sampai, page, per_page }
 */
export function useKonselingList(params = {}) {
  return useQuery({
    queryKey: bkKeys.konseling.list(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/konseling`, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Ambil detail satu sesi konseling (beserta catatan terkait)
 */
export function useKonselingDetail(id) {
  return useQuery({
    queryKey: bkKeys.konseling.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/konseling/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

/**
 * Ambil statistik konseling (total, bulan ini, per-kategori, sering konseling)
 */
export function useKonselingStats() {
  return useQuery({
    queryKey: bkKeys.konseling.stats(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/konseling/stats`);
      return data;
    },
    staleTime: 60_000,
  });
}

/** Tambah sesi konseling baru */
export function useTambahKonseling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/konseling`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bkKeys.konseling.all });
      toast.success("Sesi konseling berhasil dicatat.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal mencatat konseling.");
    },
  });
}

/** Edit sesi konseling */
export function useEditKonseling(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`${BASE}/konseling/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bkKeys.konseling.all });
      toast.success("Sesi konseling berhasil diperbarui.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui konseling.");
    },
  });
}

/** Hapus sesi konseling */
export function useHapusKonseling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/konseling/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bkKeys.konseling.all });
      toast.success("Sesi konseling berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus konseling.");
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// CATATAN BK
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Ambil daftar catatan BK (paginasi + filter)
 * @param {Object} params - { siswa_id, tipe, tingkat, konseling_id, page, per_page }
 */
export function useCatatanList(params = {}) {
  return useQuery({
    queryKey: bkKeys.catatan.list(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/catatan`, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Ambil semua catatan BK milik satu siswa beserta summary
 */
export function useCatatanSiswa(siswaId) {
  return useQuery({
    queryKey: bkKeys.catatan.bySiswa(siswaId),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/catatan/siswa/${siswaId}`);
      return data;
    },
    enabled: Boolean(siswaId),
  });
}

/** Tambah catatan BK */
export function useTambahCatatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/catatan`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bkKeys.catatan.all });
      toast.success("Catatan BK berhasil ditambahkan.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menambahkan catatan.");
    },
  });
}

/** Edit catatan BK */
export function useEditCatatan(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`${BASE}/catatan/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bkKeys.catatan.all });
      toast.success("Catatan BK berhasil diperbarui.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui catatan.");
    },
  });
}

/** Hapus catatan BK */
export function useHapusCatatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/catatan/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bkKeys.catatan.all });
      toast.success("Catatan BK berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus catatan.");
    },
  });
}

