import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

const BASE = "/operator/master-data/semesters";

// ── Query Keys ───────────────────────────────────────────────────────────────

export const semesterKeys = {
  all: ["semester"],
  lists: () => [...semesterKeys.all, "list"],
  list: (filters) => [...semesterKeys.lists(), filters],
  details: () => [...semesterKeys.all, "detail"],
  detail: (ulid) => [...semesterKeys.details(), ulid],
  byTA: (taUlid) => [...semesterKeys.all, "by-ta", taUlid],
};

// ── READ ─────────────────────────────────────────────────────────────────────

/**
 * Daftar semester — bisa filter by tahun_ajaran_ulid.
 */
export function useSemesterList(taUlid = null) {
  return useQuery({
    queryKey: taUlid ? semesterKeys.byTA(taUlid) : semesterKeys.lists(),
    queryFn: async () => {
      const params = taUlid ? { tahun_ajaran_ulid: taUlid } : {};
      const { data } = await api.get(BASE, { params });
      return data.data ?? [];
    },
    staleTime: 2 * 60_000,
  });
}

/**
 * Detail satu semester by ULID.
 */
export function useSemesterDetail(ulid) {
  return useQuery({
    queryKey: semesterKeys.detail(ulid),
    queryFn: async () => {
      const { data } = await api.get(`${BASE}/${ulid}`);
      return data.data;
    },
    enabled: !!ulid,
    staleTime: 60_000,
  });
}

// ── MUTATIONS ────────────────────────────────────────────────────────────────

/**
 * Update tanggal / nama semester.
 * Wakasek bisa edit meski TA sudah ACTIVE — lock hanya di level status semester.
 */
export function useUpdateSemester(taUlid = null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ulid, payload }) => api.put(`${BASE}/${ulid}`, payload),
    onSuccess: (_, { ulid }) => {
      toast.success("Semester berhasil diperbarui.");
      qc.invalidateQueries({ queryKey: semesterKeys.detail(ulid) });
      if (taUlid) qc.invalidateQueries({ queryKey: semesterKeys.byTA(taUlid) });
      qc.invalidateQueries({ queryKey: semesterKeys.lists() });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui semester.");
    },
  });
}

/**
 * Aktifkan semester — menutup otomatis semester lain di TA yang sama.
 * Permission: master_data.semester.activate (Wakasek).
 */
export function useActivateSemester(taUlid = null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ulid, catatan }) =>
      api.patch(`${BASE}/${ulid}/activate`, { catatan }),
    onSuccess: (_, { ulid }) => {
      toast.success("Semester berhasil diaktifkan.");
      qc.invalidateQueries({ queryKey: semesterKeys.detail(ulid) });
      if (taUlid) qc.invalidateQueries({ queryKey: semesterKeys.byTA(taUlid) });
      qc.invalidateQueries({ queryKey: semesterKeys.lists() });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal mengaktifkan semester.",
      );
    },
  });
}

/**
 * Tutup semester (ACTIVE → CLOSED).
 * Permission: master_data.semester.activate (Wakasek).
 */
export function useCloseSemester(taUlid = null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/close`),
    onSuccess: (_, ulid) => {
      toast.success("Semester berhasil ditutup.");
      qc.invalidateQueries({ queryKey: semesterKeys.detail(ulid) });
      if (taUlid) qc.invalidateQueries({ queryKey: semesterKeys.byTA(taUlid) });
      qc.invalidateQueries({ queryKey: semesterKeys.lists() });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menutup semester.");
    },
  });
}

/**
 * Arsipkan semester (CLOSED → ARCHIVED).
 * Permission: master_data.semester.archive (Operator).
 */
export function useArchiveSemester(taUlid = null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ulid, catatan }) =>
      api.patch(`${BASE}/${ulid}/archive`, { catatan }),
    onSuccess: (_, { ulid }) => {
      toast.success("Semester berhasil diarsipkan.");
      qc.invalidateQueries({ queryKey: semesterKeys.detail(ulid) });
      if (taUlid) qc.invalidateQueries({ queryKey: semesterKeys.byTA(taUlid) });
      qc.invalidateQueries({ queryKey: semesterKeys.lists() });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ?? "Gagal mengarsipkan semester.",
      );
    },
  });
}

/**
 * Keluarkan dari arsip (ARCHIVED → CLOSED).
 * Permission: master_data.semester.archive (Operator).
 */
export function useUnarchiveSemester(taUlid = null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ulid) => api.patch(`${BASE}/${ulid}/unarchive`),
    onSuccess: (_, ulid) => {
      toast.success("Semester berhasil dikeluarkan dari arsip.");
      qc.invalidateQueries({ queryKey: semesterKeys.detail(ulid) });
      if (taUlid) qc.invalidateQueries({ queryKey: semesterKeys.byTA(taUlid) });
      qc.invalidateQueries({ queryKey: semesterKeys.lists() });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ??
          "Gagal mengeluarkan semester dari arsip.",
      );
    },
  });
}
