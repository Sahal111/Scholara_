// ── Guru Module Shared Constants & Helpers ────────────────────────────────────

export const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

export const jenisPtkOptions = [
  "Kepala Sekolah",
  "Guru Kelas",
  "Guru Mapel",
  "Guru BK",
  "Tenaga Administrasi",
  "Pustakawan",
  "Laboran",
  "Penjaga Sekolah",
  "Lainnya",
];
export const statusOptions = [
  "PNS",
  "PPPK",
  "GTY",
  "GTT",
  "Honorer",
  "Lainnya",
];
export const agamaOptions = [
  "Islam",
  "Kristen Protestan",
  "Kristen Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
];
export const perkawinanOpts = [
  "Belum Menikah",
  "Menikah",
  "Cerai Hidup",
  "Cerai Mati",
];

export const defaultForm = {
  nuptk: "",
  nip: "",
  nik: "",
  nama: "",
  jenis_kelamin: "L",
  tanggal_lahir: "",
  tempat_lahir: "",
  agama: "Islam",
  status_perkawinan: "Belum Kawin",
  jenis_ptk: "Guru Kelas",
  status_kepegawaian: "GTT",
  // golongan: "",
  // tmt_golongan: "",
  no_hp: "",
  email: "",
  alamat_jalan: "",
  rt: "",
  rw: "",
  desa_kelurahan: "",
  kecamatan: "",
  kota_kabupaten: "",
  provinsi: "",
  kode_pos: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function fotoUrl(foto) {
  return foto ? `${BASE_URL}/storage/${foto}` : null;
}

export function statusColor(status) {
  if (!status)
    return "bg-surface-variant text-text-secondary border-outline-variant/30";
  const s = status.toLowerCase();
  if (s === "aktif") return "bg-success/10 text-success border-success/20";
  if (s === "cuti") return "bg-warning/10 text-warning border-warning/20";
  if (s === "pensiun" || s === "mutasi" || s === "keluar")
    return "bg-danger/10 text-danger border-danger/20";
  return "bg-surface-variant text-text-secondary border-outline-variant/30";
}

// Template-style status badge — pakai token yang ada di index.css project
export function statusBadge(status) {
  if (!status)
    return "bg-surface-variant text-on-surface-variant border-outline-variant/30";
  const s = status.toLowerCase();
  if (s === "aktif")
    return "bg-secondary-container/30 text-on-secondary-fixed-variant border-secondary-container/40";
  if (s === "cuti")
    return "bg-accent-gold/10 text-accent-gold border-accent-gold/30";
  if (s === "pensiun" || s === "mutasi" || s === "keluar")
    return "bg-error-container/20 text-error border-error/20";
  return "bg-surface-variant text-on-surface-variant border-outline-variant/30";
}

// ── Form Field Components ─────────────────────────────────────────────────────
export const INPUT =
  "w-full px-3 py-2.5 rounded-xl border border-border-light bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-text-primary placeholder:text-text-secondary";
export const SELECT = INPUT + " appearance-none";

export function Field({ label, required, half, children }) {
  return (
    <div className={half ? "" : ""}>
      <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
        {children}
      </span>
      <div className="flex-1 h-px bg-border-light" />
    </div>
  );
}

// ── Skeleton Row (7 cols: checkbox, guru, L/P, jabatan, wali, status, aksi) ──
export function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/10">
      {/* Checkbox */}
      <td className="px-6 py-4 w-12">
        <div className="w-4 h-4 bg-surface-container-high rounded animate-pulse mx-auto" />
      </td>
      {/* Guru (avatar + name) */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-36 bg-surface-container-high rounded animate-pulse" />
            <div className="h-2.5 w-24 bg-surface-container-high/60 rounded animate-pulse" />
          </div>
        </div>
      </td>
      {/* L/P */}
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="h-3 w-6 bg-surface-container-high rounded animate-pulse" />
      </td>
      {/* Jabatan */}
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="h-3 w-28 bg-surface-container-high rounded animate-pulse" />
      </td>
      {/* Wali Kelas */}
      <td className="px-6 py-4 hidden lg:table-cell">
        <div className="h-6 w-20 bg-surface-container-high rounded-lg animate-pulse" />
      </td>
      {/* Status */}
      <td className="px-6 py-4">
        <div className="h-6 w-16 bg-surface-container-high rounded-full animate-pulse" />
      </td>
      {/* Aksi */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-container-high animate-pulse" />
          <div className="w-7 h-7 rounded-lg bg-surface-container-high animate-pulse" />
          <div className="w-7 h-7 rounded-lg bg-surface-container-high animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, iconBg, iconColor }) {
  return (
    <div className="bg-surface/90 backdrop-blur-md border border-outline-variant/30 shadow-sm rounded-[20px] p-5 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-text-secondary font-medium mb-1">
            {label}
          </p>
          <h3
            className="text-2xl font-bold text-text-primary"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {value}
          </h3>
        </div>
        <div className={`p-2.5 ${iconBg} rounded-xl ${iconColor}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
    </div>
  );
}
