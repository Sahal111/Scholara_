import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

/**
 * Query keys terpusat untuk modul Penilaian & Rapor.
 * Memudahkan invalidation yang granular.
 */
export const penilaianKeys = {
  all: ["penilaian"],
  komponen: (params = {}) => [...penilaianKeys.all, "komponen", params],
  plotSaya: (params = {}) => [...penilaianKeys.all, "plot-saya", params],
  byPlot: (plotId, params = {}) => [...penilaianKeys.all, "plot", plotId, params],
  rekap: (params = {}) => [...penilaianKeys.all, "rekap", params],
  rapors: ["rapor"],
  raporList: (params = {}) => [...penilaianKeys.rapors, "list", params],
  raporDetail: (id) => [...penilaianKeys.rapors, "detail", id],
};

// ── KOMPONEN PENILAIAN ────────────────────────────────────────────────────────

/**
 * Daftar komponen penilaian aktif (Formatif, Sumatif, PTS, PAS, dsb.)
 * @param {Object} params - { kurikulum, jenis } opsional
 */
export function useKomponenPenilaian(params = {}) {
  return useQuery({
    queryKey: penilaianKeys.komponen(params),
    queryFn: async () => {
      const { data } = await api.get("/penilaian/komponen", { params });
      return data;
    },
    staleTime: 300_000, // 5 menit cache karena komponen jarang berubah
  });
}

// ── PLOT / MAPEL ──────────────────────────────────────────────────────────────

/**
 * Daftar plot (mapel yang diampu) oleh guru yang sedang login.
 * Digunakan sebagai pilihan "kelas & mapel" di form input nilai.
 * @param {Object} params - Filter opsional (semester_id)
 */
export function usePlotSaya(params = {}) {
  return useQuery({
    queryKey: penilaianKeys.plotSaya(params),
    queryFn: async () => {
      const { data } = await api.get("/penilaian/plot-saya", { params });
      return data;
    },
    staleTime: 60_000,
  });
}

// ── NILAI ─────────────────────────────────────────────────────────────────────

/**
 * Nilai semua siswa untuk satu plot (mapel + kelas) dan satu komponen.
 * @param {number|null} plotId       - ID plot_guru_mapels
 * @param {Object}      params       - { komponen_id } opsional
 */
export function useNilaiByPlot(plotId, params = {}) {
  return useQuery({
    queryKey: penilaianKeys.byPlot(plotId, params),
    queryFn: async () => {
      const { data } = await api.get(`/penilaian/plot/${plotId}`, { params });
      return data;
    },
    enabled: !!plotId,
    staleTime: 30_000,
  });
}

/**
 * Rekap nilai akhir per kelas per semester.
 * Digunakan oleh wali kelas, kepsek, dan wakasek.
 * @param {Object} params - { kelas_id, semester_id } wajib
 */
export function useRekapNilai(params = {}) {
  return useQuery({
    queryKey: penilaianKeys.rekap(params),
    queryFn: async () => {
      const { data } = await api.get("/penilaian/rekap", { params });
      return data;
    },
    enabled: !!(params.kelas_id && params.semester_id),
    staleTime: 30_000,
  });
}

/**
 * Input nilai satu siswa untuk satu komponen.
 * Body: { plot_id, siswa_id, komponen_id, tahun_ajaran_id, semester_id, nilai, deskripsi }
 */
export function useUpsertNilai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/penilaian/upsert", payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: penilaianKeys.byPlot(variables.plot_id) });
      queryClient.invalidateQueries({ queryKey: penilaianKeys.rekap() });
      toast.success("Nilai berhasil disimpan.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Gagal menyimpan nilai.");
    },
  });
}

/**
 * Input nilai massal untuk seluruh siswa di satu kelas sekaligus.
 * Body: { plot_id, komponen_id, semester_id, tahun_ajaran_id, nilais: [{siswa_id, nilai, deskripsi}] }
 */
export function useUpsertNilaiBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/penilaian/upsert-bulk", payload);
      return data;
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: penilaianKeys.byPlot(variables.plot_id) });
      queryClient.invalidateQueries({ queryKey: penilaianKeys.rekap() });
      toast.success(res?.data?.message ?? "Nilai berhasil disimpan.");
    },
    onError: (err) => {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(err?.response?.data?.message ?? "Gagal menyimpan nilai.");
      }
    },
  });
}

/**
 * Hitung dan simpan nilai akhir dari semua komponen untuk satu plot + semester.
 * Body: { plot_id, semester_id, tahun_ajaran_id }
 */
export function useHitungNilaiAkhir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/penilaian/hitung-akhir", payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: penilaianKeys.rekap() });
      queryClient.invalidateQueries({ queryKey: penilaianKeys.raporList() });
      toast.success(res?.data?.message ?? "Nilai akhir berhasil dihitung.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Gagal menghitung nilai akhir.");
    },
  });
}

// ── RAPOR ─────────────────────────────────────────────────────────────────────

/**
 * Daftar rapor dengan filter.
 * @param {Object} params - { kelas_id, semester_id, tahun_ajaran_id, siswa_id, status, search, page, per_page }
 */
export function useRaporList(params = {}) {
  return useQuery({
    queryKey: penilaianKeys.raporList(params),
    queryFn: async () => {
      const { data } = await api.get("/rapor", { params });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Detail satu rapor beserta nilai akhir per mapel.
 * @param {number|null} id - ID rapor
 */
export function useRaporDetail(id) {
  return useQuery({
    queryKey: penilaianKeys.raporDetail(id),
    queryFn: async () => {
      const { data } = await api.get(`/rapor/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Buat rapor draft untuk seluruh siswa di satu kelas.
 * Body: { kelas_id, semester_id, tahun_ajaran_id }
 */
export function useBuatRaporPerKelas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/rapor/buat-per-kelas", payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: penilaianKeys.rapors });
      toast.success(res?.data?.message ?? "Rapor berhasil dibuat.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Gagal membuat rapor.");
    },
  });
}

/**
 * Update catatan wali kelas, rekap absensi, dan deskripsi sikap pada rapor.
 * @param {number} id - ID rapor
 */
export function useUpdateRapor(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put(`/rapor/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: penilaianKeys.raporDetail(id) });
      queryClient.invalidateQueries({ queryKey: penilaianKeys.raporList() });
      toast.success("Rapor berhasil diperbarui.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Gagal memperbarui rapor.");
    },
  });
}

/**
 * Finalisasi satu rapor (draft → final). Rapor dikunci setelah ini.
 * @param {number} id - ID rapor
 */
export function useFinalisasiRapor(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/rapor/${id}/finalisasi`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: penilaianKeys.raporDetail(id) });
      queryClient.invalidateQueries({ queryKey: penilaianKeys.raporList() });
      toast.success("Rapor berhasil difinalisasi.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Gagal memfinalisasi rapor.");
    },
  });
}

/**
 * Finalisasi massal seluruh rapor di satu kelas.
 * Body: { kelas_id, semester_id }
 */
export function useFinalisasiMassal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/rapor/finalisasi-massal", payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: penilaianKeys.rapors });
      toast.success(res?.data?.message ?? "Rapor berhasil difinalisasi.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Gagal memfinalisasi rapor.");
    },
  });
}

