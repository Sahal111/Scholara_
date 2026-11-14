const RENTANG = {
  dasar: [1, 2, 3, 4, 5, 6],
  menengah_pertama: [7, 8, 9],
  menengah_atas: [10, 11, 12],
};

/** Tingkat yang ada di sekolah; jenjang tak dikenal (mis. superadmin) → 1–12. */
export function tingkatSekolah(jenjang) {
  return RENTANG[jenjang] ?? Array.from({ length: 12 }, (_, i) => i + 1);
}
