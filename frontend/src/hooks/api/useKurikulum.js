import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/kurikulum";

// ── Query keys ────────────────────────────────────────────────────────────────
export const kurikulumKeys = {
  all: ["kurikulum"],
  lists: () => [...kurikulumKeys.all, "list"],
  list: (filters) => [...kurikulumKeys.lists(), filters],
  details: () => [...kurikulumKeys.all, "detail"],
  detail: (ulid) => [...kurikulumKeys.details(), ulid],
  dropdowns: () => [...kurikulumKeys.all, "dropdown"],
  dropdown: () => [...kurikulumKeys.dropdowns()],
  // BUG 4 FIX: tambah keys untuk trash dan tahun ajaran
  trashes: () => [...kurikulumKeys.all, "trash"],
  trash: (filters) => [...kurikulumKeys.trashes(), filters],
  tahunAjarans: () => [...kurikulumKeys.all, "tahun-ajaran"],
  tahunAjaran: (tahunAjaranId) => [
    ...kurikulumKeys.tahunAjarans(),
    tahunAjaranId,
  ],
};
// ── Permission helpers — RBAC Kurikulum ──────────────────────────────────────
/**
 * Status workflow Kurikulum (sinkron dengan backend jika ada).
 * Untuk sekarang kurikulum pakai is_active boolean,
 * bukan status enum seperti TahunAjaran.
 */
export const KURIKULUM_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
};

/**
 * Tentukan aksi yang boleh ditampilkan di UI kurikulum
 * berdasarkan role + kondisi kurikulum saat ini.
 *
 * RBAC Kurikulum:
 *   - Wakasek → full CRUD + activate/deactivate
 *   - Kepsek  → view only (approve jika ada workflow di masa depan)
 *   - Operator → view only (READ sesuai PROJECT_CONTEXT.md)
 *   - Guru    → view only
 *
 * @param {object} k       - objek Kurikulum dari API
 * @param {object} perms   - { canManageKurikulum, canViewKurikulum }
 */
export function getKurikulumActions(k, perms = {}) {
  const { canManageKurikulum = false } = perms;
  const isActive = !!k?.is_active;
  const isDeleted = !!k?.deleted_at;

  return {
    showDetail: true,
    showEdit: canManageKurikulum && !isDeleted,
    showActivate: canManageKurikulum && !isActive && !isDeleted,
    showDeactivate: canManageKurikulum && isActive && !isDeleted,
    showDelete: canManageKurikulum && !isDeleted,
    showRestore: canManageKurikulum && isDeleted,
  };
}

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

export function useKurikulumStats() {
  return useQuery({
    queryKey: [...kurikulumKeys.all, "stats"],
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/stats`);
      return data;
    },
    staleTime: 30_000,
  });
}

// BUG 4 FIX: query trash (recycle bin)
export function useKurikulumTrash(params = {}) {
  return useQuery({
    queryKey: kurikulumKeys.trash(params),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/trash`, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// BUG 4 FIX: kurikulum yang berlaku di tahun ajaran tertentu
export function useKurikulumUntukTahunAjaran(tahunAjaranId) {
  return useQuery({
    queryKey: kurikulumKeys.tahunAjaran(tahunAjaranId),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/tahun-ajaran/${tahunAjaranId}`);
      return data;
    },
    enabled: !!tahunAjaranId,
    staleTime: 30_000,
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

// BUG 4 FIX: activate kurikulum yang sebelumnya dinonaktifkan
export function useActivateKurikulum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.lists() });
      qc.invalidateQueries({ queryKey: kurikulumKeys.dropdowns() });
      toast.success("Kurikulum berhasil diaktifkan kembali.");
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ?? "Gagal mengaktifkan kurikulum.";
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

// BUG 4 FIX: restore dari recycle bin
export function useRestoreKurikulum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.lists() });
      qc.invalidateQueries({ queryKey: kurikulumKeys.trashes() });
      qc.invalidateQueries({ queryKey: kurikulumKeys.dropdowns() });
      toast.success("Kurikulum berhasil dipulihkan.");
    },
    onError: (err) => {
      const msg = err.response?.data?.message ?? "Gagal memulihkan kurikulum.";
      toast.error(msg);
    },
  });
}

// BUG 4 FIX: daftarkan kurikulum ke tahun ajaran
export function useDaftarkanKurikulumKeTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(`${BASE}/tahun-ajaran/daftarkan`, payload),
    onSuccess: (_, { tahun_ajaran_ulid }) => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.tahunAjarans() });
      // Invalidate detail tahun ajaran yang bersangkutan jika diketahui
      if (tahun_ajaran_ulid) {
        qc.invalidateQueries({
          queryKey: kurikulumKeys.tahunAjaran(tahun_ajaran_ulid),
        });
      }
      toast.success("Kurikulum berhasil didaftarkan ke tahun ajaran.");
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ??
        "Gagal mendaftarkan kurikulum ke tahun ajaran.";
      toast.error(msg);
    },
  });
}
