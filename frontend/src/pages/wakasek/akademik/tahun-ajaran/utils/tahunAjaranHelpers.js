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

/**
 * Tentukan status lifecycle Tahun Ajaran berdasarkan posisi relatif
 * terhadap Tahun Ajaran yang sedang aktif.
 *
 * Prinsip:
 *   - is_active=true         → AKTIF
 *   - tahun < tahun aktif    → SELESAI
 *   - tahun > tahun aktif    → AKAN DATANG
 *   - fallback (tanpa aktif) → gunakan posisi tahun vs tahun sekarang
 *
 * Tanggal semester TIDAK dipakai sebagai penentu status lifecycle.
 * Status periode dan progress data akademik adalah dua hal yang independen.
 *
 * @param {object}      t           - objek TahunAjaran
 * @param {string|null} activeTahun - nilai `tahun` dari TA yang is_active=true,
 *                                    e.g. "2025/2026". Pass null jika tidak ada.
 */
export function getStatusTahunAjaran(t, activeTahun = null) {
  if (t.is_active) return "AKTIF";

  const yearStart = (tahun) => parseInt(tahun?.split("/")[0] ?? "0", 10);

  if (activeTahun) {
    const tStart = yearStart(t.tahun);
    const activeStart = yearStart(activeTahun);
    if (tStart < activeStart) return "SELESAI";
    if (tStart > activeStart) return "AKAN DATANG";
  }

  // Fallback: tidak ada TA aktif → posisi relatif vs tahun kalender sekarang
  const tahunMulai = yearStart(t.tahun);
  const tahunSelesai = t.tahun ? parseInt(t.tahun.split("/")[1], 10) : null;
  const tahunSekarang = new Date().getFullYear();

  if (!tahunMulai) return "SELESAI";
  if (tahunMulai > tahunSekarang) return "AKAN DATANG";
  if (tahunSelesai && tahunSelesai <= tahunSekarang) return "SELESAI";
  return "SELESAI";
}
