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
  arsip: () => [...tahunAjaranKeys.all, "arsip"],
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

// ── Mutations — CRUD Dasar ────────────────────────────────────────────────────

/** Buat tahun ajaran baru sebagai DRAFT (hanya operator) */
export function useCreateTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const { tgl_mulai_ta, tgl_selesai_ta, ...rest } = payload;
      return api.post(BASE, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Draft tahun ajaran berhasil dibuat.");
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((e) => toast.error(e[0]));
      } else {
        toast.error(
          err.response?.data?.message ?? "Gagal membuat tahun ajaran.",
        );
      }
    },
  });
}

/** Update tahun ajaran & semester-nya (hanya saat status DRAFT) */
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
      const msg = err.response?.data?.message ?? "";
      // Pesan error khusus kalau data sudah terkunci
      if (err.response?.status === 422 && msg.includes("terkunci")) {
        toast.error(
          "Data tidak dapat diedit — tahun ajaran sudah disetujui kepsek.",
        );
      } else {
        const errors = err.response?.data?.errors;
        if (errors) {
          Object.values(errors).forEach((e) => toast.error(e[0]));
        } else {
          toast.error(msg || "Gagal memperbarui tahun ajaran.");
        }
      }
    },
  });
}

// ── Mutations — Workflow Transitions ─────────────────────────────────────────

/**
 * WAKASEK: Submit TA dari DRAFT → UNDER_REVIEW
 * PATCH /tahun-ajaran/{ulid}/submit-review
 */
export function useSubmitReviewTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/submit-review`),
    onSuccess: (_, ulid) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(ulid) });
      toast.success(
        "Tahun ajaran berhasil disubmit. Menunggu review kepala sekolah.",
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal submit untuk review.");
    },
  });
}

/**
 * KEPSEK: Approve TA dari UNDER_REVIEW → APPROVED
 * PATCH /tahun-ajaran/{ulid}/approve
 */
export function useApproveTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ulid, catatan }) =>
      api.patch(`${BASE}/${ulid}/approve`, { catatan }),
    onSuccess: (_, { ulid }) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(ulid) });
      toast.success("Tahun ajaran berhasil disetujui.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal menyetujui tahun ajaran.",
      );
    },
  });
}

/**
 * KEPSEK: Reject TA dari UNDER_REVIEW → DRAFT
 * PATCH /tahun-ajaran/{ulid}/reject
 */
export function useRejectTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ulid, catatan }) =>
      api.patch(`${BASE}/${ulid}/reject`, { catatan }),
    onSuccess: (_, { ulid }) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(ulid) });
      toast.success("Tahun ajaran dikembalikan ke draft.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menolak tahun ajaran.");
    },
  });
}

/**
 * KEPSEK: Aktifkan TA dari APPROVED → ACTIVE
 * PATCH /tahun-ajaran/{ulid}/aktifkan
 */
export function useAktifkanTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/aktifkan`),
    onSuccess: (_, ulid) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(ulid) });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success(
        "Tahun ajaran berhasil diaktifkan. Semester Ganjil otomatis aktif.",
      );
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal mengaktifkan tahun ajaran.",
      );
    },
  });
}

/**
 * WAKASEK: Ganti semester aktif (Ganjil ↔ Genap) dalam TA yang ACTIVE
 * PATCH /tahun-ajaran/{ulid}/semester-aktif
 */
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
 * WAKASEK: Selesaikan / tutup buku TA dari ACTIVE → COMPLETED
 * PATCH /tahun-ajaran/{ulid}/selesaikan
 */
export function useSelesaikanTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/selesaikan`),
    onSuccess: (_, ulid) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(ulid) });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran berhasil diselesaikan (tutup buku).");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal menyelesaikan tahun ajaran.",
      );
    },
  });
}

// ── Mutations — Arsip ────────────────────────────────────────────────────────

/** Ambil semua tahun ajaran yang diarsipkan */
export function useArsipTahunAjaranList() {
  return useQuery({
    queryKey: tahunAjaranKeys.arsip(),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/arsip`);
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

/**
 * OPERATOR: Arsipkan TA dari COMPLETED → ARCHIVED
 * PATCH /tahun-ajaran/{ulid}/arsip
 */
export function useArsipkanTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, catatan }) =>
      api.patch(`${BASE}/${id}/arsip`, { catatan }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.arsip() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran berhasil diarsipkan.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal mengarsipkan tahun ajaran.",
      );
    },
  });
}

/** OPERATOR: Keluarkan TA dari arsip → COMPLETED */
export function useUnarsipTahunAjaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`${BASE}/${id}/unarsip`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.arsip() });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      toast.success("Tahun ajaran berhasil dikeluarkan dari arsip.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal mengeluarkan dari arsip.",
      );
    },
  });
}

// ── Mutations — Recycle Bin ──────────────────────────────────────────────────

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

/** OPERATOR: Soft-delete TA (hanya DRAFT) — pindah ke recycle bin */
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

/** OPERATOR: Pulihkan TA dari recycle bin */
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

/** OPERATOR: Hapus permanen dari recycle bin */
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

// ── Deprecated aliases — tetap ada agar tidak breaking komponen lama ─────────

/**
 * @deprecated Pakai useAktifkanTahunAjaran() — sekarang butuh approval kepsek dulu
 * Alias ini tetap ada untuk komponen lama yang belum dimigrasi.
 */
export const useSetTahunAjaranAktif = useAktifkanTahunAjaran;

/** Update tanggal semester melalui endpoint update TA */
export function useUpdateSemester(taId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tahunTA,
      ganjilMulai,
      ganjilSelesai,
      genapMulai,
      genapSelesai,
    }) => {
      if (!tahunTA)
        throw new Error("tahunTA diperlukan untuk update semester.");
      return api.put(`${BASE}/${taId}`, {
        tahun: tahunTA,
        buat_semester: true,
        semester_ganjil_mulai: ganjilMulai ?? null,
        semester_ganjil_selesai: ganjilSelesai ?? null,
        semester_genap_mulai: genapMulai ?? null,
        semester_genap_selesai: genapSelesai ?? null,
      });
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
