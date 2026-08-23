import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/tahun-ajaran";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const tahunAjaranKeys = {
  all: ["tahun-ajaran"],
  lists: () => [...tahunAjaranKeys.all, "list"],
  list: (filters) => [...tahunAjaranKeys.lists(), filters],
  details: () => [...tahunAjaranKeys.all, "detail"],
  detail: (id) => [...tahunAjaranKeys.details(), id],
  dropdown: () => [...tahunAjaranKeys.all, "dropdown"],
  trash: () => [...tahunAjaranKeys.all, "trash"],
};

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch daftar semua tahun ajaran beserta semester-nya */
export function useTahunAjaranList(params = {}) {
  return useQuery({
    queryKey: tahunAjaranKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get(BASE, { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/** Fetch detail satu tahun ajaran (include kelas, kalender, aktivitas, checklist) */
export function useTahunAjaranDetail(id) {
  return useQuery({
    queryKey: tahunAjaranKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${id}`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Buat tahun ajaran baru (sekaligus semester jika buat_semester = true) */
export function useCreateTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      // Strip field UI-only sebelum dikirim ke API
      const { tgl_mulai_ta, tgl_selesai_ta, ...rest } = payload;
      return api.post(BASE, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran berhasil ditambahkan.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((e) => toast.error(e[0]));
      } else {
        toast.error(
          err.response?.data?.message ?? "Gagal menambahkan tahun ajaran.",
        );
      }
    },
  });
}

/** Update tahun ajaran & semester-nya */
export function useUpdateTahunAjaran(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const { tgl_mulai_ta, tgl_selesai_ta, ...rest } = payload;
      return api.put(`${BASE}/${id}`, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran berhasil diperbarui.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((e) => toast.error(e[0]));
      } else {
        toast.error(
          err.response?.data?.message ?? "Gagal memperbarui tahun ajaran.",
        );
      }
    },
  });
}

/** Jadikan tahun ajaran aktif (otomatis nonaktifkan yang lain) */
export function useSetTahunAjaranAktif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`${BASE}/${id}/aktif`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran aktif berhasil diubah.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal mengaktifkan tahun ajaran.",
      );
    },
  });
}

/** Aktifkan salah satu semester (Ganjil/Genap) dalam tahun ajaran tertentu */
export function useSetSemesterAktif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taId, semesterNama }) =>
      api.patch(`${BASE}/${taId}/semester-aktif`, {
        semester_nama: semesterNama,
      }),
    onSuccess: (_, { taId, semesterNama }) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(taId) });
      toast.success(`Semester ${semesterNama} berhasil diaktifkan.`);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal mengaktifkan semester.",
      );
    },
  });
}

/**
 * Update tanggal semester tertentu melalui endpoint update TA.
 * Caller wajib menyertakan `tahunTA` (mis. "2025/2026") karena
 * UpdateTahunAjaranRequest mensyaratkan field `tahun`.
 *
 * @param {string|number} taId  — ID tahun ajaran
 */
export function useUpdateSemester(taId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tahunTA, semesterNama, tglMulai, tglSelesai }) => {
      if (!tahunTA) {
        throw new Error("tahunTA diperlukan untuk update semester.");
      }
      const payload = {
        tahun: tahunTA,
        buat_semester: true,
      };
      if (semesterNama === "Ganjil") {
        payload.semester_ganjil_mulai = tglMulai;
        payload.semester_ganjil_selesai = tglSelesai;
      } else {
        payload.semester_genap_mulai = tglMulai;
        payload.semester_genap_selesai = tglSelesai;
      }
      return api.put(`${BASE}/${taId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(taId) });
      toast.success("Tanggal semester berhasil diperbarui.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((e) => toast.error(e[0]));
      } else {
        toast.error(
          err.response?.data?.message ?? "Gagal memperbarui semester.",
        );
      }
    },
  });
}

/** Soft-delete tahun ajaran (pindah ke recycle bin) */
export function useDeleteTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.trash() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran dipindahkan ke recycle bin.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal menghapus tahun ajaran.",
      );
    },
  });
}

/** Ambil daftar tahun ajaran yang sudah dihapus (recycle bin) */
export function useTrashTahunAjaran() {
  return useQuery({
    queryKey: tahunAjaranKeys.trash(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/trash`);
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

/** Pulihkan tahun ajaran dari recycle bin */
export function useRestoreTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`${BASE}/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.trash() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran berhasil dipulihkan.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal memulihkan tahun ajaran.",
      );
    },
  });
}

/** Hapus permanen dari recycle bin */
export function useForceDeleteTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/force-delete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.trash() });
      toast.success("Tahun ajaran dihapus secara permanen.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus permanen.");
    },
  });
}
