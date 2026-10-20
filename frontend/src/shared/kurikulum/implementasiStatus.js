/**
 * Status workflow implementasi kurikulum.
 * Sinkron dengan backend: App\Enums\StatusImplementasiKurikulum
 *
 *   DRAFT → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED
 *   (tolak: UNDER_REVIEW → DRAFT)
 */
export const IMPLEMENTASI_STATUS = {
  draft: {
    label: "Draft",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  under_review: {
    label: "Menunggu Review",
    cls: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Disetujui",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  active: {
    label: "Aktif",
    cls: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  completed: {
    label: "Selesai",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

/** Urutan langkah untuk stepper. */
export const IMPLEMENTASI_LANGKAH = [
  "draft",
  "under_review",
  "approved",
  "active",
  "completed",
];

/** Penjelasan singkat posisi workflow, ditampilkan di panel. */
export const PETUNJUK_STATUS = {
  draft:
    "Struktur masih bisa diedit. Wakasek mengajukan review setelah struktur lengkap.",
  under_review: "Menunggu keputusan kepala sekolah.",
  approved: "Sudah disetujui. Menunggu kepala sekolah mengaktifkan.",
  active:
    "Kurikulum ini sedang berlaku. Wakasek dapat menyelesaikannya di akhir periode.",
  completed: "Siklus selesai. Struktur ini hanya bisa dilihat.",
};

export function getImplementasiStatus(status) {
  return IMPLEMENTASI_STATUS[status] ?? IMPLEMENTASI_STATUS.draft;
}
