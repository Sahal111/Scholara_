/**
 * Shared constants for Mata Pelajaran (Mapel) domain.
 * Single source of truth — dipakai di MasterMapel, TambahEditMapel, dll.
 */

export const KELOMPOK_OPTIONS = [
  "A - Wajib",
  "B - Wajib",
  "C - Muatan Lokal",
  "Pengembangan Diri",
  "Ekstrakurikuler",
  "Lainnya",
];

export const KURIKULUM_OPTIONS = [
  "Kurikulum 2013",
  "Kurikulum Merdeka",
  "Keduanya",
];

// Mendukung semua jenjang: SD (1-6), SMP (7-9), SMA/SMK (10-12)
export const TINGKAT_OPTIONS = [
  "1", "2", "3", "4", "5", "6",
  "7", "8", "9",
  "10", "11", "12",
];

export const KELOMPOK_BADGE_CLASSES = {
  "A - Wajib": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "B - Wajib": "bg-blue-100 text-blue-800 border border-blue-200",
  "C - Muatan Lokal": "bg-amber-100 text-amber-800 border border-amber-200",
  "Pengembangan Diri": "bg-violet-100 text-violet-800 border border-violet-200",
  Ekstrakurikuler: "bg-pink-100 text-pink-800 border border-pink-200",
  Lainnya: "bg-gray-100 text-gray-700 border border-gray-200",
};

export function getTingkatByJenjang(jenjang) {
  if (jenjang === "dasar") return ["1", "2", "3", "4", "5", "6"];
  if (jenjang === "menengah_pertama") return ["7", "8", "9"];
  if (jenjang === "menengah_atas") return ["10", "11", "12"];
  return TINGKAT_OPTIONS;
}

export function getLabelTingkat(jenjang) {
  if (jenjang === "dasar") return "Kelas (SD/MI)";
  if (jenjang === "menengah_pertama") return "Kelas (SMP/MTs)";
  if (jenjang === "menengah_atas") return "Kelas (SMA/SMK/MA)";
  return "Kelas";
}
