/**
 * programConfig.js
 *
 * Konfigurasi dinamis halaman Program Pendidikan berdasarkan
 * kombinasi jenis sekolah × kurikulum.
 *
 * Referensi arsitektur:
 *   SMK/MAK  → Bidang Keahlian → Program Keahlian → Konsentrasi Keahlian
 *               (kurikulum tidak mengubah struktur, hanya konten)
 *
 *   SMA/MA Kurikulum Merdeka → Mata Pelajaran Pilihan (dipilih per siswa)
 *                            + Keagamaan (khusus MA)
 *
 *   SMA/MA K13               → Peminatan: IPA / IPS / Bahasa
 *                            + Keagamaan (khusus MA)
 *
 *   SD / MI / SMP / MTs      → Tidak ada program pendidikan khusus
 *
 * Sumber: Permendikbud, nomenklatur Kemdikbud, Kemenag.
 * Konstanta backend: School::JENIS_*, School::KURIKULUM_*, ProgramPendidikan::JENIS
 */

// ─── Helper internal ──────────────────────────────────────────────────────────

const TAB_SEMUA = { value: "semua", label: "Semua", icon: "list" };
const TAB_BIDANG = {
  value: "bidang_keahlian",
  label: "Bidang Keahlian",
  icon: "category",
};
const TAB_PROGRAM = {
  value: "program_keahlian",
  label: "Program Keahlian",
  icon: "school",
};
const TAB_KONSEN = {
  value: "konsentrasi_keahlian",
  label: "Konsentrasi Keahlian",
  icon: "account_tree",
};
const TAB_MINAT = {
  value: "peminatan",
  label: "Peminatan",
  icon: "psychology",
};
const TAB_MAPIL = {
  value: "mata_pelajaran_pilihan",
  label: "Mata Pelajaran Pilihan",
  icon: "menu_book",
};
const TAB_AGAMA = { value: "keagamaan", label: "Keagamaan", icon: "mosque" };
const TAB_UMUM = { value: "umum", label: "Umum", icon: "star" };

// ─── Config per skenario ──────────────────────────────────────────────────────

/**
 * SMK & MAK — hierarki 3 level, kurikulum tidak mengubah struktur.
 */
const CONFIG_SMK = {
  hasTabs: true,
  tabs: [TAB_SEMUA, TAB_BIDANG, TAB_PROGRAM, TAB_KONSEN],
  addButtons: [
    {
      jenis: "konsentrasi_keahlian",
      label: "Tambah Konsentrasi",
      variant: "outline",
    },
    { jenis: "program_keahlian", label: "Tambah Program", variant: "solid" },
  ],
  defaultJenis: "konsentrasi_keahlian",
  description:
    "Kelola bidang keahlian, program keahlian, dan konsentrasi keahlian.",
};

/**
 * SMA — Kurikulum Merdeka.
 * Tidak ada "jurusan" per rombel. Kelompok mata pelajaran pilihan
 * merepresentasikan pengelompokan, bukan peminatan wajib.
 */
const CONFIG_SMA_MERDEKA = {
  hasTabs: true,
  tabs: [TAB_SEMUA, TAB_MAPIL],
  addButtons: [
    {
      jenis: "mata_pelajaran_pilihan",
      label: "Tambah Kelompok Mapel",
      variant: "solid",
    },
  ],
  defaultJenis: "mata_pelajaran_pilihan",
  description:
    "Kurikulum Merdeka: kelola kelompok mata pelajaran pilihan (MIPA, IPS, Bahasa, Vokasi). " +
    "Siswa memilih mapel secara individual, bukan per jurusan.",
};

/**
 * SMA — K13.
 * Peminatan melekat ke rombel: IPA, IPS, Bahasa.
 */
const CONFIG_SMA_K13 = {
  hasTabs: true,
  tabs: [TAB_SEMUA, TAB_MINAT],
  addButtons: [
    { jenis: "peminatan", label: "Tambah Peminatan", variant: "solid" },
  ],
  defaultJenis: "peminatan",
  description:
    "K13: kelola peminatan per rombel (IPA, IPS, Bahasa dan Budaya).",
};

/**
 * MA — Kurikulum Merdeka.
 * Sama seperti SMA Merdeka, DITAMBAH tab Keagamaan (khas Kemenag).
 */
const CONFIG_MA_MERDEKA = {
  hasTabs: true,
  tabs: [TAB_SEMUA, TAB_MAPIL, TAB_AGAMA],
  addButtons: [
    {
      jenis: "mata_pelajaran_pilihan",
      label: "Tambah Kelompok Mapel",
      variant: "outline",
    },
    { jenis: "keagamaan", label: "Tambah Program Keagamaan", variant: "solid" },
  ],
  defaultJenis: "mata_pelajaran_pilihan",
  description:
    "Kurikulum Merdeka: kelola kelompok mata pelajaran pilihan dan program keagamaan " +
    "(Tafsir, Hadis, Fikih, Ilmu Kalam, Bahasa Arab).",
};

/**
 * MA — K13.
 * Peminatan (IPA/IPS/Bahasa) DITAMBAH Keagamaan (khas Kemenag).
 */
const CONFIG_MA_K13 = {
  hasTabs: true,
  tabs: [TAB_SEMUA, TAB_MINAT, TAB_AGAMA],
  addButtons: [
    { jenis: "peminatan", label: "Tambah Peminatan", variant: "outline" },
    { jenis: "keagamaan", label: "Tambah Program Keagamaan", variant: "solid" },
  ],
  defaultJenis: "keagamaan",
  description:
    "K13: kelola peminatan (IPA, IPS, Bahasa) dan program keagamaan madrasah.",
};

/**
 * Jenjang tanpa program pendidikan.
 * SD, MI, SMP, MTs, dan varian LB.
 */
const CONFIG_TANPA_PROGRAM = { hasTabs: false };

/**
 * Fallback — jenis sekolah tidak dikenal atau belum dikonfigurasi.
 */
const CONFIG_FALLBACK = {
  hasTabs: true,
  tabs: [TAB_SEMUA, TAB_UMUM],
  addButtons: [{ jenis: "umum", label: "Tambah Program", variant: "solid" }],
  defaultJenis: "umum",
  description: "Kelola program pendidikan sekolah.",
};

/**
 * SuperAdmin / school null — tidak terikat pada jenis sekolah tertentu.
 * Tampilkan semua jenis yang mungkin agar bisa mengelola lintas jenjang.
 */
const CONFIG_SUPERADMIN = {
  hasTabs: true,
  tabs: [
    TAB_SEMUA,
    TAB_BIDANG,
    TAB_PROGRAM,
    TAB_KONSEN,
    TAB_MINAT,
    TAB_MAPIL,
    TAB_AGAMA,
    TAB_UMUM,
  ],
  addButtons: [
    {
      jenis: "bidang_keahlian",
      label: "Tambah Bidang",
      variant: "outline",
    },
    { jenis: "program_keahlian", label: "Tambah Program", variant: "solid" },
  ],
  defaultJenis: "bidang_keahlian",
  description:
    "Mode SuperAdmin: kelola semua jenis program pendidikan lintas sekolah.",
  isSuperAdmin: true,
};

// ─── Matrix jenis × kurikulum ─────────────────────────────────────────────────

/**
 * Lookup: CONFIG_MATRIX[jenis][kurikulum] → config object.
 *
 * Kurikulum yang tidak terdaftar di level-2 → fallback ke 'default'
 * (biasanya sama dengan Kurikulum Merdeka).
 */
const CONFIG_MATRIX = {
  SMK: {
    default: CONFIG_SMK,
    "Kurikulum Merdeka": CONFIG_SMK,
    K13: CONFIG_SMK,
    Lainnya: CONFIG_SMK,
  },
  MAK: {
    default: CONFIG_SMK, // MAK = SMK versi Kemenag, struktur sama
    "Kurikulum Merdeka": CONFIG_SMK,
    K13: CONFIG_SMK,
    Lainnya: CONFIG_SMK,
  },
  SMA: {
    default: CONFIG_SMA_MERDEKA,
    "Kurikulum Merdeka": CONFIG_SMA_MERDEKA,
    K13: CONFIG_SMA_K13,
    Lainnya: CONFIG_FALLBACK,
  },
  MA: {
    default: CONFIG_MA_MERDEKA,
    "Kurikulum Merdeka": CONFIG_MA_MERDEKA,
    K13: CONFIG_MA_K13,
    Lainnya: CONFIG_MA_MERDEKA, // MA Lainnya (Cambridge dll) → tetap tampilkan Keagamaan
  },
  SD: { default: CONFIG_TANPA_PROGRAM },
  MI: { default: CONFIG_TANPA_PROGRAM },
  SMP: { default: CONFIG_TANPA_PROGRAM },
  MTs: { default: CONFIG_TANPA_PROGRAM },
  SDLB: { default: CONFIG_TANPA_PROGRAM },
  SMPLB: { default: CONFIG_TANPA_PROGRAM },
  SMALB: { default: CONFIG_TANPA_PROGRAM },
  SLB: { default: CONFIG_TANPA_PROGRAM },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Ambil konfigurasi tab & tombol Program Pendidikan.
 *
 * @param {string|null|undefined} schoolJenis     - e.g. 'SMK', 'MA', 'MI'
 * @param {string|null|undefined} schoolKurikulum - e.g. 'Kurikulum Merdeka', 'K13'
 * @returns Config object
 */
export function getProgramConfig(schoolJenis, schoolKurikulum) {
  // SuperAdmin tidak terikat ke sekolah — tampilkan semua jenis
  if (!schoolJenis) return CONFIG_SUPERADMIN;

  const jenisMap = CONFIG_MATRIX[schoolJenis];
  if (!jenisMap) return CONFIG_FALLBACK;

  return jenisMap[schoolKurikulum] ?? jenisMap["default"] ?? CONFIG_FALLBACK;
}

/**
 * Kembalikan array jenis yang valid untuk dropdown modal Tambah/Edit.
 *
 * @param {string|null|undefined} schoolJenis
 * @param {string|null|undefined} schoolKurikulum
 * @returns {Array<{value:string, label:string}>}
 */
export function getProgramJenisOptions(schoolJenis, schoolKurikulum) {
  const config = getProgramConfig(schoolJenis, schoolKurikulum);
  if (!config.hasTabs) return [];

  return (config.tabs ?? [])
    .filter((t) => t.value !== "semua")
    .map((t) => ({ value: t.value, label: t.label }));
}

/**
 * Map value jenis → label untuk kolom tabel dan badge.
 * Sinkron dengan ProgramPendidikan::JENIS_LABEL di backend.
 */
export const JENIS_LABEL = {
  bidang_keahlian: "Bidang Keahlian",
  program_keahlian: "Program Keahlian",
  konsentrasi_keahlian: "Konsentrasi Keahlian",
  peminatan: "Peminatan",
  mata_pelajaran_pilihan: "Mata Pelajaran Pilihan",
  keagamaan: "Keagamaan",
  umum: "Umum",
};
