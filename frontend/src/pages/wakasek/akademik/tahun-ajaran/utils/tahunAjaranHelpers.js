// ── Date Formatting ──────────────────────────────────────────────────────────

export function fmt(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtLong(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtShort(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function fmtShortMonthYear(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

// ── Date Math ────────────────────────────────────────────────────────────────

export function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

export function daysRemaining(end) {
  if (!end) return null;
  return Math.round((new Date(end) - new Date()) / 86400000);
}

export function calcProgress(start, end) {
  if (!start || !end) return 0;
  const total = daysBetween(start, end);
  if (!total || total <= 0) return 0;
  const rem = Math.max(0, daysRemaining(end) ?? 0);
  return Math.max(0, Math.min(100, Math.round(((total - rem) / total) * 100)));
}

export function weeksBetween(a, b) {
  const d = daysBetween(a, b);
  return d != null ? Math.floor(d / 7) : null;
}

// ── Tahun Ajaran Domain Helpers ──────────────────────────────────────────────

export function getTglMulai(t) {
  if (!t?.semesters) return null;
  const ganjil = t.semesters.find((s) => s.nama === "Ganjil");
  return ganjil ? ganjil.tgl_mulai : null;
}

export function getTglSelesai(t) {
  if (!t?.semesters) return null;
  const genap = t.semesters.find((s) => s.nama === "Genap");
  const ganjil = t.semesters.find((s) => s.nama === "Ganjil");
  return genap ? genap.tgl_selesai : ganjil ? ganjil.tgl_selesai : null;
}

// ── Status Workflow ──────────────────────────────────────────────────────────

/**
 * Status values yang datang dari backend (StatusTahunAjaran enum).
 * Selalu pakai konstanta ini — jangan hardcode string di komponen.
 */
export const TA_STATUS = {
  DRAFT: "draft",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};

/**
 * Label Bahasa Indonesia per status — sinkron dengan backend enum.
 */
export const TA_STATUS_LABEL = {
  draft: "Draft",
  under_review: "Menunggu Review",
  approved: "Disetujui",
  active: "Aktif",
  completed: "Selesai",
  archived: "Diarsipkan",
};

/**
 * Config visual (warna, icon) per status — dipakai oleh badge & action menu.
 */
export const TA_STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "text-[#3f4945]",
    bg: "bg-[#eceeed]",
    border: "border-[#bfc9c4]/40",
    dot: "bg-[#3f4945]",
    icon: "draft",
  },
  under_review: {
    label: "Menunggu Review",
    color: "text-[#7a4f00]",
    bg: "bg-[#ffdeac]/40",
    border: "border-[#ffdeac]",
    dot: "bg-[#f59e0b]",
    icon: "pending",
  },
  approved: {
    label: "Disetujui",
    color: "text-[#005db5]",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: "verified",
  },
  active: {
    label: "Aktif",
    color: "text-[#006e2a]",
    bg: "bg-[#006e2a]/10",
    border: "border-[#006e2a]/20",
    dot: "bg-[#006e2a]",
    icon: "check_circle",
    pulse: true,
  },
  completed: {
    label: "Selesai",
    color: "text-[#3f4945]",
    bg: "bg-[#eceeed]",
    border: "border-[#bfc9c4]/30",
    dot: "bg-[#3f4945]/60",
    icon: "task_alt",
  },
  archived: {
    label: "Diarsipkan",
    color: "text-[#3f4945]/50",
    bg: "bg-[#eceeed]/60",
    border: "border-[#bfc9c4]/20",
    dot: "bg-[#3f4945]/30",
    icon: "inventory_2",
  },
};

/**
 * Ambil status workflow dari field `status` backend.
 * Pakai ini sebagai source of truth — bukan is_active boolean.
 *
 * Fallback ke derivasi lama (is_active) kalau field status belum ada
 * di respons API (misal: cache lama sebelum migration dijalankan).
 */
export function getWorkflowStatus(t) {
  if (t?.status && TA_STATUS_CONFIG[t.status]) return t.status;

  // Fallback legacy
  if (t?.is_active) return TA_STATUS.ACTIVE;
  if (t?.is_archived) return TA_STATUS.ARCHIVED;
  return TA_STATUS.DRAFT;
}

/**
 * @deprecated Pakai getWorkflowStatus() + TA_STATUS_CONFIG.
 * Dipertahankan agar komponen lain yang belum dimigrasi tidak breaking.
 */
export function getStatusTahunAjaran(t, activeTahun = null) {
  const ws = getWorkflowStatus(t);
  if (ws === TA_STATUS.ACTIVE) return "AKTIF";
  if (ws === TA_STATUS.COMPLETED || ws === TA_STATUS.ARCHIVED) return "SELESAI";
  if (
    ws === TA_STATUS.DRAFT ||
    ws === TA_STATUS.UNDER_REVIEW ||
    ws === TA_STATUS.APPROVED
  ) {
    // Kalau ada TA aktif sebagai referensi, bandingkan tahun
    if (activeTahun) {
      const yearStart = (tahun) => parseInt(tahun?.split("/")[0] ?? "0", 10);
      const tStart = yearStart(t.tahun);
      const activeStart = yearStart(activeTahun);
      if (tStart > activeStart) return "AKAN DATANG";
    }
  }
  return "SELESAI";
}

// ── Role-based Action Permissions ────────────────────────────────────────────

/**
 * Tentukan aksi mana yang boleh ditampilkan di action menu
 * berdasarkan role user dan status TA saat ini.
 *
 * Return object boolean — komponen tinggal pakai destructuring.
 *
 * @param {object} t        - objek TahunAjaran dari API
 * @param {object} perms    - hasil hasPermission() dari AuthContext
 *
 * Contoh:
 *   const actions = getTahunAjaranActions(ta, {
 *     canManage:      hasPermission("master_data.tahun_ajaran.manage"),
 *     canReview:      hasPermission("master_data.tahun_ajaran.review"),
 *     canApprove:     hasPermission("master_data.tahun_ajaran.approve"),
 *     canActivate:    hasPermission("master_data.tahun_ajaran.activate"),
 *   });
 *   if (actions.showSubmitReview) { ... }
 */
export function getTahunAjaranActions(t, perms = {}) {
  const {
    canManage = false,
    canReview = false,
    canApprove = false,
    canActivate = false,
  } = perms;
  const status = getWorkflowStatus(t);

  return {
    // ── View — semua role yang punya akses bisa lihat detail
    showDetail: true,

    // ── Operator: edit & hapus hanya saat DRAFT
    showEdit: canManage && status === TA_STATUS.DRAFT,
    showDelete: canManage && status === TA_STATUS.DRAFT,

    // ── Wakasek: submit ke review — hanya dari DRAFT
    showSubmitReview: canReview && status === TA_STATUS.DRAFT,

    // ── Kepsek: approve / reject — hanya saat UNDER_REVIEW
    showApprove: canApprove && status === TA_STATUS.UNDER_REVIEW,
    showReject: canApprove && status === TA_STATUS.UNDER_REVIEW,

    // ── Kepsek: aktifkan — hanya saat APPROVED
    showAktifkan: canActivate && status === TA_STATUS.APPROVED,

    // ── Wakasek: ganti semester aktif — hanya saat ACTIVE
    showSetSemesterAktif: canReview && status === TA_STATUS.ACTIVE,

    // ── Wakasek: selesaikan / tutup buku — hanya saat ACTIVE
    showSelesaikan: canReview && status === TA_STATUS.ACTIVE,

    // ── Operator: arsipkan — hanya saat COMPLETED
    showArsip: canManage && status === TA_STATUS.COMPLETED,

    // ── Operator: unarsip — hanya saat ARCHIVED
    showUnarsip: canManage && status === TA_STATUS.ARCHIVED,

    // ── Kepsek bisa lihat catatan review
    showCatatanReview: canApprove || canActivate,
  };
}
