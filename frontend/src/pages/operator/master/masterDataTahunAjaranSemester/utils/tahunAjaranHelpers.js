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

export function getStatusTahunAjaran(t) {
  if (t.is_active) return "AKTIF";

  const now = new Date();
  const mulai = getTglMulai(t);
  const selesai = getTglSelesai(t);

  // Kasus 1: ada tanggal mulai & selesai → bisa kalkulasi presisi
  if (mulai && selesai) {
    if (new Date(mulai) > now) return "AKAN DATANG";
    if (new Date(selesai) < now) return "SELESAI";
    // mulai ≤ now ≤ selesai → sedang berjalan tapi tidak aktif (is_active=false)
    return "SELESAI";
  }

  // Kasus 2: hanya ada tanggal mulai
  if (mulai) {
    return new Date(mulai) > now ? "AKAN DATANG" : "SELESAI";
  }

  // Kasus 3: tidak ada tanggal sama sekali → fallback ke nama tahun
  // "2028/2029" → tahunMulai=2028, sekarang=2026 → AKAN DATANG
  // "2025/2026" → tahunMulai=2025, sekarang=2026 → SELESAI
  const tahunMulai = t.tahun ? parseInt(t.tahun.split("/")[0]) : null;
  if (tahunMulai) {
    const tahunSelesai = t.tahun ? parseInt(t.tahun.split("/")[1]) : null;
    const tahunSekarang = now.getFullYear();
    if (tahunMulai > tahunSekarang) return "AKAN DATANG";
    if (tahunSelesai && tahunSelesai <= tahunSekarang) return "SELESAI";
  }

  return "SELESAI";
}
