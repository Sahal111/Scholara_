/**
 * programConfig.js
 *
 * Konfigurasi dinamis halaman Program Pendidikan berdasarkan jenis sekolah.
 *
 * Latar belakang:
 * - SMK/MAK  : punya hierarki 3 level (Bidang → Program → Konsentrasi)
 * - SMA/MA   : hanya Peminatan
 * - SD/MI/SMP/MTs : tidak ada program pendidikan khusus
 *
 * Sumber referensi: Permendikbud, nomenklatur Kemdikbud, dan
 * konstanta School::JENIS_* di backend (app/Models/School.php).
 */

// ─── Definisi tab per jenis sekolah ──────────────────────────────────────────

const CONFIG_MAP = {
  // ── SMK & MAK: hierarki 3 level ──────────────────────────────────────────
  SMK: {
    hasTabs: true,
    tabs: [
      { value: "semua", label: "Semua", icon: "list" },
      { value: "bidang_keahlian", label: "Bidang Keahlian", icon: "category" },
      { value: "program_keahlian", label: "Program Keahlian", icon: "school" },
      {
        value: "konsentrasi_keahlian",
        label: "Konsentrasi Keahlian",
        icon: "account_tree",
      },
    ],
    // Tombol aksi di header — urutan: paling spesifik (outline) → paling umum (solid)
    addButtons: [
      {
        jenis: "konsentrasi_keahlian",
        label: "Tambah Konsentrasi",
        variant: "outline",
      },
      {
        jenis: "program_keahlian",
        label: "Tambah Program",
        variant: "solid",
      },
    ],
    // Jenis default saat buka modal tanpa konteks tab
    defaultJenis: "konsentrasi_keahlian",
    // Deskripsi subtitle header halaman
    description:
      "Kelola bidang keahlian, program keahlian, dan konsentrasi keahlian SMK.",
  },

  // ── SMA & MA: peminatan ───────────────────────────────────────────────────
  SMA: {
    hasTabs: true,
    tabs: [
      { value: "semua", label: "Semua", icon: "list" },
      { value: "peminatan", label: "Peminatan", icon: "psychology" },
    ],
    addButtons: [
      {
        jenis: "peminatan",
        label: "Tambah Peminatan",
        variant: "solid",
      },
    ],
    defaultJenis: "peminatan",
    description:
      "Kelola peminatan dan struktur pembelajaran sesuai kurikulum yang diterapkan.",
  },

  // ── SD, MI, SMP, MTs, dan varian LB: tidak ada program khusus ────────────
  SD: { hasTabs: false },
  MI: { hasTabs: false },
  SMP: { hasTabs: false },
  MTs: { hasTabs: false },
  SDLB: { hasTabs: false },
  SMPLB: { hasTabs: false },
  SMALB: { hasTabs: false },
  SLB: { hasTabs: false },
};

// Alias — MA mengikuti config SMA
CONFIG_MAP.MA = CONFIG_MAP.SMA;
CONFIG_MAP.MAK = CONFIG_MAP.SMK;

// ─── Fallback jika jenis sekolah tidak dikenal / belum dikonfigurasi ─────────
const FALLBACK_CONFIG = {
  hasTabs: true,
  tabs: [
    { value: "semua", label: "Semua", icon: "list" },
    { value: "umum", label: "Umum", icon: "star" },
  ],
  addButtons: [{ jenis: "umum", label: "Tambah Program", variant: "solid" }],
  defaultJenis: "umum",
  description: "Kelola program pendidikan sekolah.",
};

// ─── Getter utama ─────────────────────────────────────────────────────────────

/**
 * Ambil konfigurasi tab & tombol Program Pendidikan berdasarkan jenis sekolah.
 *
 * @param {string|null|undefined} schoolJenis  - Nilai dari school.jenis (e.g. 'SMK', 'MI')
 * @returns {{
 *   hasTabs: boolean,
 *   tabs?: Array<{value:string, label:string, icon:string}>,
 *   addButtons?: Array<{jenis:string, label:string, variant:'solid'|'outline'}>,
 *   defaultJenis?: string,
 *   description?: string,
 * }}
 */
export function getProgramConfig(schoolJenis) {
  if (!schoolJenis) return FALLBACK_CONFIG;
  return CONFIG_MAP[schoolJenis] ?? FALLBACK_CONFIG;
}

/**
 * Kembalikan array jenis yang valid untuk dropdown modal Tambah/Edit,
 * disaring berdasarkan tab yang tersedia untuk jenis sekolah ini.
 *
 * @param {string|null|undefined} schoolJenis
 * @returns {Array<{value:string, label:string}>}
 */
export function getProgramJenisOptions(schoolJenis) {
  const config = getProgramConfig(schoolJenis);
  if (!config.hasTabs) return [];

  return config.tabs
    .filter((t) => t.value !== "semua")
    .map((t) => ({ value: t.value, label: t.label }));
}

/**
 * Map value jenis → label yang lebih pendek untuk kolom tabel.
 * Bisa dipakai langsung: JENIS_LABEL[item.jenis] ?? item.jenis
 */
export const JENIS_LABEL = {
  bidang_keahlian: "Bidang Keahlian",
  program_keahlian: "Program Keahlian",
  konsentrasi_keahlian: "Konsentrasi Keahlian",
  peminatan: "Peminatan",
  umum: "Umum",
};
