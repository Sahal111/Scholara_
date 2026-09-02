import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/mapel";

/* ── Query Keys ─────────────────────────────────────────────── */
export const mapelKeys = {
  all: ["mapel"],
  lists: () => [...mapelKeys.all, "list"],
  list: (filters) => [...mapelKeys.lists(), filters],
  details: () => [...mapelKeys.all, "detail"],
  detail: (ulid) => [...mapelKeys.details(), ulid],
  dropdown: () => [...mapelKeys.all, "dropdown"],
};

/* ── Queries ─────────────────────────────────────────────────── */

/**
 * Daftar mapel dengan filter & paginasi.
 * filters: { search, kelompok, tingkat, is_active, page }
 */
export function useMapelList(filters = {}) {
  return useQuery({
    queryKey: mapelKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get(BASE, {
        params: {
          search: filters.search || undefined,
          kelompok: filters.kelompok || undefined,
          tingkat: filters.tingkat || undefined,
          is_active: filters.is_active !== "" ? filters.is_active : undefined,
          page: filters.page || 1,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Detail satu mapel by ULID.
 */
export function useMapelDetail(ulid) {
  return useQuery({
    queryKey: mapelKeys.detail(ulid),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${ulid}`);
      return data?.data ?? data;
    },
    enabled: Boolean(ulid),
    staleTime: 60_000,
  });
}

/**
 * Dropdown mapel aktif (untuk select di form jadwal, LMS, absensi, dll).
 * params: { tingkat? } — opsional filter tingkat untuk dropdown
 */
export function useMapelDropdown(params = {}) {
  return useQuery({
    queryKey: mapelKeys.dropdown(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/dropdown`, { params });
      return data?.data ?? data;
    },
    staleTime: 300_000, // 5 menit — mapel jarang berubah
  });
}

/**
 * Statistik ringkasan mapel — total, aktif, non-aktif, kelompok.
 * Dihitung dari SELURUH data di backend (bukan per-halaman).
 */
export function useMapelStats() {
  return useQuery({
    queryKey: [...mapelKeys.all, "stats"],
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/stats`);
      return data?.data ?? data;
    },
    staleTime: 60_000,
  });
}

/* ── Mutations ───────────────────────────────────────────────── */

/**
 * Tambah mata pelajaran baru.
 */
export function useCreateMapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapelKeys.lists() });
      qc.invalidateQueries({ queryKey: mapelKeys.all }); // invalidate dropdown juga
      toast.success("Mata pelajaran berhasil ditambahkan.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((msgs) => toast.error(msgs[0]));
      } else {
        toast.error(
          err.response?.data?.message ?? "Gagal menambahkan mata pelajaran.",
        );
      }
    },
  });
}

/**
 * Edit mata pelajaran. Perlu ulid di payload: { id: ulid, ...fields }
 * 'id' di sini adalah ULID yang dikembalikan oleh MapelResource.
 */
export function useUpdateMapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`${BASE}/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: mapelKeys.detail(id) });
      qc.invalidateQueries({ queryKey: mapelKeys.lists() });
      qc.invalidateQueries({ queryKey: mapelKeys.all }); // invalidate dropdown juga
      toast.success("Mata pelajaran berhasil diperbarui.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((msgs) => toast.error(msgs[0]));
      } else {
        toast.error(
          err.response?.data?.message ?? "Gagal memperbarui mata pelajaran.",
        );
      }
    },
  });
}

/**
 * Toggle status aktif/non-aktif.
 * Param: ulid (string) — id yang dikembalikan API sudah ulid.
 */
export function useToggleMapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/toggle-active`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapelKeys.lists() });
      qc.invalidateQueries({ queryKey: mapelKeys.all });
      toast.success("Status mata pelajaran berhasil diubah.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal mengubah status.");
    },
  });
}

/**
 * Hapus (soft delete) mata pelajaran.
 * Param: ulid (string).
 */
export function useDeleteMapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.delete(`${BASE}/${ulid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapelKeys.lists() });
      qc.invalidateQueries({ queryKey: mapelKeys.all });
      toast.success("Mata pelajaran berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal menghapus mata pelajaran.",
      );
    },
  });
}

/**
 * Import via file Excel. Dispatch async job di backend.
 */
export function useImportMapel() {
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(`${BASE}/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success(
        "File berhasil dikirim. Data sedang diproses di latar belakang — " +
          "silakan refresh halaman beberapa saat lagi.",
        { duration: 5000 },
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal mengimpor file.");
    },
  });
}

/**
 * Export ke Excel. Trigger download langsung di browser.
 * filters: { kelompok?, tingkat?, is_active? }
 */
export async function exportMapel(filters = {}) {
  const res = await api.get(`${BASE}/export`, {
    params: {
      kelompok: filters.kelompok || undefined,
      tingkat: filters.tingkat || undefined,
      is_active: filters.is_active !== "" ? filters.is_active : undefined,
    },
    responseType: "blob",
  });

  const url = URL.createObjectURL(
    new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `master_mapel_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download template import Excel.
 */
export async function downloadTemplateMapel() {
  const res = await api.get(`${BASE}/template`, { responseType: "blob" });
  const url = URL.createObjectURL(
    new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "template_import_mapel.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
