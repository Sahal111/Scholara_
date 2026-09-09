import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/axios";

/* ── helpers ─────────────────────────────────────────────────── */
function fmt(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} Rb`;
  return String(n);
}

/* ── data fetching ───────────────────────────────────────────── */
async function fetchStats() {
  const [siswa, guru, pending] = await Promise.all([
    api
      .get("/operator/master-data/siswa", { params: { per_page: 1 } })
      .then((r) => r.data),
    api
      .get("/operator/master-data/guru", { params: { per_page: 1 } })
      .then((r) => r.data),
    api.get("/operator/ortu/pending").then((r) => r.data),
  ]);
  return {
    totalSiswa: siswa?.data?.total ?? 0,
    totalGuru: guru?.data?.total ?? 0,
    pendingOrtu: pending?.data?.total ?? pending?.total ?? 0,
  };
}

/* ── KPI Sparkline (SVG path inline) ───────────────────────── */
function Sparkline({ color, d }) {
  const idFill = `fill-${color.replace("#", "")}`;
  return (
    <div className="w-20 h-9 shrink-0">
      <svg
        className="w-full h-full overflow-visible"
        fill="none"
        viewBox="0 0 80 32"
      >
        <defs>
          <linearGradient id={idFill} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L 78 32 L 2 32 Z`} fill={`url(#${idFill})`} />
        <path d={d} stroke={color} strokeLinecap="round" strokeWidth="2.2" />
      </svg>
    </div>
  );
}

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  unit,
  badge,
  badgeColor,
  detail,
  icon,
  iconBg,
  sparkColor,
  sparkD,
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none"
        style={{ background: `${sparkColor}0d` }}
      />
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-semibold text-slate-400">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 shadow-sm transition-transform duration-200 group-hover:scale-105 shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold w-fit ${badgeColor}`}
          >
            {badge}
          </span>
          {detail && (
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {detail}
            </div>
          )}
        </div>
        <Sparkline color={sparkColor} d={sparkD} />
      </div>
    </div>
  );
}

/* ── Bar Chart distribusi siswa ─────────────────────────────── */
function BarDistribusi({ items }) {
  const max = Math.max(...items.map((i) => i.val), 1);
  return (
    <div className="h-48 flex items-end justify-between gap-3 px-3 pt-4 pb-3.5 bg-gradient-to-b from-slate-50/90 via-blue-50/40 to-slate-50/40 rounded-2xl border border-slate-200/70 relative overflow-hidden">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar cursor-pointer"
        >
          <div className="flex flex-col items-center transition-transform duration-200 group-hover/bar:-translate-y-0.5">
            <span
              className="text-xs font-extrabold tracking-tight leading-none"
              style={{ color: item.color }}
            >
              {item.val}
            </span>
            <span
              className="px-1.5 py-0.5 rounded-md text-[9px] font-bold mt-0.5 ring-1"
              style={{
                background: item.bgLight,
                color: item.textColor,
                ringColor: item.color,
              }}
            >
              {((item.val / max) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full max-w-[56px] h-36 bg-slate-100/80 rounded-t-xl overflow-hidden flex flex-col justify-end p-1 border border-slate-200/60">
            <div
              className="w-full rounded-t-lg transition-all duration-300 group-hover/bar:brightness-110 shadow-sm"
              style={{
                height: `${(item.val / max) * 88}%`,
                background: item.gradient,
              }}
            />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: item.color }}
            />
            <span className="text-xs font-bold text-slate-700">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Donut chart SPP (SVG pure) ─────────────────────────────── */
function DonutSPP({ pct }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const lunas = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center py-1">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={r}
            stroke="#f1f5f9"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={r}
            stroke="#8b5cf6"
            strokeDasharray={`${circ * 0.1} ${circ}`}
            strokeDashoffset={`-${circ * 0.9}`}
            strokeLinecap="round"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={r}
            stroke="#f59e0b"
            strokeDasharray={`${circ * 0.18} ${circ}`}
            strokeDashoffset={`-${circ * 0.72}`}
            strokeLinecap="round"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={r}
            stroke="#2563eb"
            strokeDasharray={`${lunas * 0.72} ${circ}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeWidth="10"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
            Terkumpul
          </span>
          <span className="text-lg font-black text-slate-900 tracking-tight leading-none mt-0.5">
            {pct}%
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 mt-0.5">
            Rp 158,2 Jt
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Tabel registrasi dummy (diganti real data jika tersedia) ── */
const REGISTRASI = [
  {
    nama: "Ananda Nayla Putri",
    nisn: "00789211",
    waktu: "Hari ini, 09:12",
    kelas: "X-A",
    status: "Terverifikasi",
    statusColor: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    initials: "AN",
    grad: "from-blue-600 to-indigo-500",
  },
  {
    nama: "Rafi Fakhri Pratama",
    nisn: "00789212",
    waktu: "Hari ini, 08:45",
    kelas: "X-B",
    status: "Menunggu Berkas",
    statusColor: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
    initials: "RF",
    grad: "from-amber-500 to-yellow-400",
  },
  {
    nama: "Siti Aisyah Azzahra",
    nisn: "00789198",
    waktu: "Kemarin, 14:20",
    kelas: "XI-A",
    status: "Terverifikasi",
    statusColor: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    initials: "SA",
    grad: "from-purple-600 to-indigo-600",
  },
  {
    nama: "Dimas Maulana",
    nisn: "00789190",
    waktu: "Kemarin, 11:05",
    kelas: "X-C",
    status: "Diterima",
    statusColor: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
    initials: "DM",
    grad: "from-teal-500 to-sky-500",
  },
];

const EKSKUL = [
  {
    nama: "Pramuka (Wajib)",
    sub: "Kepanduan & Karakter",
    pct: 100,
    count: "Semua",
    color: "#10b981",
    bgLight: "#f0fdf4",
    grad: "linear-gradient(to right,#14b8a6,#10b981)",
  },
  {
    nama: "Futsal & Basket",
    sub: "Olahraga Prestasi",
    pct: 33,
    count: "410",
    color: "#f59e0b",
    bgLight: "#fffbeb",
    grad: "linear-gradient(to right,#f59e0b,#fbbf24)",
  },
  {
    nama: "Robotika & Pemrograman",
    sub: "Teknologi & STEM",
    pct: 23,
    count: "285",
    color: "#2563eb",
    bgLight: "#eff6ff",
    grad: "linear-gradient(to right,#2563eb,#6366f1)",
  },
  {
    nama: "Olimpiade Sains (OSN)",
    sub: "Sains & Riset",
    pct: 16,
    count: "198",
    color: "#8b5cf6",
    bgLight: "#faf5ff",
    grad: "linear-gradient(to right,#7c3aed,#6366f1)",
  },
];

const LOG_AKTIVITAS = [
  {
    icon: "✓",
    iconBg: "bg-emerald-50 ring-emerald-600/20 text-emerald-600",
    msg: (
      <>
        <span className="font-bold text-slate-900">Sinkronisasi Dapodik</span>{" "}
        lokal berhasil diproses.
      </>
    ),
    badge: "Sukses",
    badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    waktu: "12 menit yang lalu",
    oleh: "Operator Utama",
  },
  {
    icon: "👤",
    iconBg: "bg-blue-50 ring-blue-600/20 text-blue-600",
    msg: (
      <>
        Siswa baru{" "}
        <span className="font-bold text-blue-600">Ananda Nayla Putri</span>{" "}
        diverifikasi.
      </>
    ),
    badge: "Verifikasi",
    badgeColor: "bg-blue-50 text-blue-700 ring-blue-600/20",
    waktu: "45 menit yang lalu",
    oleh: "Staf TU",
  },
  {
    icon: "↓",
    iconBg: "bg-purple-50 ring-purple-600/20 text-purple-600",
    msg: (
      <>
        Rekap absensi <span className="font-bold text-purple-700">X-MIPA</span>{" "}
        telah diunduh.
      </>
    ),
    badge: "Laporan",
    badgeColor: "bg-purple-50 text-purple-700 ring-purple-600/20",
    waktu: "2 jam yang lalu",
    oleh: "Wali Kelas X-1",
  },
  {
    icon: "⚠",
    iconBg: "bg-amber-50 ring-amber-600/20 text-amber-600",
    msg: <>2 berkas KIP butuh validasi NIK Kepala Keluarga.</>,
    badge: "Perlu Validasi",
    badgeColor: "bg-amber-50 text-amber-900 ring-amber-600/20",
    waktu: "4 jam yang lalu",
    oleh: "Sistem Dapodik",
  },
];

/* ══════════════════════════════════════════════════════════════ */
export default function DashboardOperator() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "Operator";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["operator-dashboard-stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
    retry: false,
  });

  const totalSiswa = stats?.totalSiswa ?? 0;
  const totalGuru = stats?.totalGuru ?? 0;
  const pendingOrtu = stats?.pendingOrtu ?? 0;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
      {/* ── Greeting Header ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 group">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Selamat datang, {firstName} 👋
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 text-xs font-semibold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Live Sync Aktif</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-2xl">
            Pantau rekapitulasi data kesiswaan, absensi, dan administrasi
            sekolah hari ini.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 text-blue-700 font-semibold border border-blue-100 shadow-sm">
              <svg
                className="w-3.5 h-3.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              Semester Ganjil 2024/2025
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 text-slate-600 font-medium border border-slate-200/70 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Diperbarui: Baru saja
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-sm hover:border-slate-300 transition-all duration-200"
            type="button"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Unduh Rekap Harian
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5"
            type="button"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Sync Dapodik
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <KpiCard
          label="Total Siswa Aktif"
          value={isLoading ? "..." : fmt(totalSiswa)}
          unit="Siswa"
          badge={
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
              +3.2%
            </>
          }
          badgeColor="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
          detail="Data dari Dapodik"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          }
          iconBg="bg-blue-50 text-blue-600 ring-blue-600/20"
          sparkColor="#2563eb"
          sparkD="M2 24 C 18 22, 28 14, 42 16 C 54 18, 64 6, 78 4"
        />
        <KpiCard
          label="Guru & Tendik"
          value={isLoading ? "..." : fmt(totalGuru)}
          unit="Orang"
          badge={
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Terdaftar NUPTK
            </>
          }
          badgeColor="bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
          detail="Guru aktif mengajar"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          }
          iconBg="bg-purple-50 text-purple-600 ring-purple-600/20"
          sparkColor="#8b5cf6"
          sparkD="M2 20 C 18 18, 28 24, 44 14 C 56 8, 68 12, 78 7"
        />
        <KpiCard
          label="Presensi Hari Ini"
          value="98.2%"
          unit=""
          badge={
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sangat Tinggi
            </>
          }
          badgeColor="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
          detail="Real-time dari absensi"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          }
          iconBg="bg-emerald-50 text-emerald-600 ring-emerald-600/20"
          sparkColor="#10b981"
          sparkD="M2 24 C 20 22, 32 10, 48 12 C 60 14, 68 8, 78 4"
        />
        <KpiCard
          label="Approval Ortu Pending"
          value={isLoading ? "..." : fmt(pendingOrtu)}
          unit="Akun"
          badge={
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Butuh Review
            </>
          }
          badgeColor="bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
          detail={
            <Link
              to="/operator/approval-ortu"
              className="text-blue-600 hover:underline font-semibold"
            >
              Lihat semua →
            </Link>
          }
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          }
          iconBg="bg-rose-50 text-rose-600 ring-rose-600/20"
          sparkColor="#f43f5e"
          sparkD="M2 18 C 18 10, 32 22, 46 16 C 60 10, 68 18, 78 6"
        />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tren Presensi (5 col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm lg:text-base tracking-tight">
                  Tren Presensi Siswa
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 shadow-sm">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                  +1.8% vs pekan lalu
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pemantauan fluktuasi kehadiran harian (Senin–Jumat)
              </p>
            </div>
          </div>
          {/* Metric chips */}
          <div className="grid grid-cols-3 gap-2 py-1.5 px-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                Rata-rata
              </span>
              <span className="text-xs font-extrabold text-slate-800">
                97.6%
              </span>
            </div>
            <div className="border-x border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                Puncak
              </span>
              <span className="text-xs font-extrabold text-blue-600">
                Rabu 98.4%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                Terendah
              </span>
              <span className="text-xs font-extrabold text-slate-600">
                Senin 96.2%
              </span>
            </div>
          </div>
          {/* SVG Chart */}
          <div className="relative w-full h-52">
            <div className="absolute left-1/2 top-0.5 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white text-[11px] px-3 py-1 rounded-xl shadow-xl flex items-center gap-2 pointer-events-none z-10 border border-slate-700/50 ring-2 ring-white/30">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>
                Rabu: <b>98.4%</b> (1.228 Siswa)
              </span>
            </div>
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 500 155"
            >
              <defs>
                <linearGradient id="blueAreaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="65%" stopColor="#3b82f6" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1.2"
                x1="0"
                x2="500"
                y1="20"
                y2="20"
              />
              <line
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1.2"
                x1="0"
                x2="500"
                y1="60"
                y2="60"
              />
              <line
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1.2"
                x1="0"
                x2="500"
                y1="100"
                y2="100"
              />
              <line
                stroke="#e2e8f0"
                strokeWidth="1.2"
                x1="0"
                x2="500"
                y1="140"
                y2="140"
              />
              <path
                d="M 20 115 C 80 102, 140 64, 200 72 C 260 80, 305 32, 380 48 C 430 60, 455 30, 480 24 L 480 140 L 20 140 Z"
                fill="url(#blueAreaGrad)"
              />
              <path
                d="M 20 115 C 80 102, 140 64, 200 72 C 260 80, 305 32, 380 48 C 430 60, 455 30, 480 24"
                fill="none"
                stroke="#2563eb"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="115"
                fill="#ffffff"
                r="4"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
              <circle
                cx="140"
                cy="68"
                fill="#ffffff"
                r="4"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
              <circle
                cx="260"
                cy="78"
                fill="#1d4ed8"
                r="6"
                stroke="#ffffff"
                strokeWidth="3.5"
              />
              <circle
                cx="380"
                cy="48"
                fill="#ffffff"
                r="4"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
              <circle
                cx="480"
                cy="24"
                fill="#ffffff"
                r="4"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          {/* Day labels */}
          <div className="grid grid-cols-5 text-center text-xs font-semibold border-t border-slate-100 pt-2">
            {[
              ["Senin", "96.2%"],
              ["Selasa", "97.8%"],
              ["Rabu", "98.4%", true],
              ["Kamis", "97.5%"],
              ["Jumat", "98.1%"],
            ].map(([d, p, active]) => (
              <div key={d}>
                <span
                  className={`block ${active ? "text-blue-600 font-bold bg-blue-50/80 rounded py-0.5 ring-1 ring-blue-500/20" : "text-slate-500"}`}
                >
                  {d}
                </span>
                <span
                  className={`text-[10px] ${active ? "text-blue-600 font-bold" : "text-slate-400 font-normal"}`}
                >
                  {p}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Hadir Tepat: <b className="text-slate-800">95.8%</b>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Izin/Sakit: <b className="text-slate-800">2.6%</b>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Alfa: <b className="text-rose-700 font-bold">1.6%</b>
            </span>
          </div>
        </div>

        {/* Distribusi Siswa (3 col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm lg:text-base tracking-tight">
                  Distribusi Siswa
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20 shadow-sm">
                  Per Kelas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Sebaran aktif jenjang reguler
              </p>
            </div>
            <div className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-full shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Total: {fmt(totalSiswa)}</span>
            </div>
          </div>
          <BarDistribusi
            items={[
              {
                label: "Kelas X",
                val: Math.round(totalSiswa * 0.336),
                color: "#2563eb",
                bgLight: "#eff6ff",
                textColor: "#1d4ed8",
                gradient: "linear-gradient(to top, #2563eb, #6366f1)",
              },
              {
                label: "Kelas XI",
                val: Math.round(totalSiswa * 0.333),
                color: "#14b8a6",
                bgLight: "#f0fdf4",
                textColor: "#0f766e",
                gradient: "linear-gradient(to top, #14b8a6, #10b981)",
              },
              {
                label: "Kelas XII",
                val: Math.round(totalSiswa * 0.331),
                color: "#7c3aed",
                bgLight: "#faf5ff",
                textColor: "#6d28d9",
                gradient: "linear-gradient(to top, #7c3aed, #6366f1)",
              },
            ]}
          />
          <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/90 shadow-sm">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                Rasio Gender
              </span>
              <div className="flex items-center justify-between font-bold mt-1 mb-0.5">
                <span className="text-blue-600 font-extrabold text-xs">
                  48% L
                </span>
                <span className="text-purple-600 font-extrabold text-xs">
                  52% P
                </span>
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full rounded-l-full"
                  style={{ width: "48%" }}
                />
                <div
                  className="bg-purple-500 h-full rounded-r-full"
                  style={{ width: "52%" }}
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                  Keterisian
                </span>
                <span className="px-1.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                  99%
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1 mb-0.5">
                <span className="text-xs font-black text-slate-900">
                  {fmt(totalSiswa)}
                </span>
                <span className="text-[10px] text-slate-400">siswa aktif</span>
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full"
                  style={{ width: "99%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SPP & Kas (4 col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm lg:text-base tracking-tight">
                  Komposisi SPP & Kas
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20 shadow-sm">
                  Bulan Ini
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Rekapitulasi penerimaan iuran dan beasiswa
              </p>
            </div>
          </div>
          <DonutSPP pct={82} />
          <div className="space-y-2">
            {[
              {
                label: "Lunas (Sudah Bayar)",
                val: "898 Siswa",
                pct: 72,
                color: "blue",
              },
              {
                label: "Menunggak / Tertunda",
                val: "225 Siswa",
                pct: 18,
                color: "amber",
              },
              {
                label: "KIP / Beasiswa",
                val: "125 Siswa",
                pct: 10,
                color: "purple",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`p-2 rounded-xl bg-slate-50/70 hover:bg-${item.color}-50/40 border border-slate-100 hover:border-${item.color}-100 transition-all duration-200`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full bg-${item.color}-600 ring-2 ring-${item.color}-500/20 shrink-0`}
                    />
                    <span className="font-bold text-slate-700 text-xs truncate">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-extrabold text-slate-900 text-xs">
                      {item.val}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold bg-${item.color}-100 text-${item.color}-700 rounded-md ring-1 ring-${item.color}-500/20`}
                    >
                      {item.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`bg-gradient-to-r from-${item.color}-600 to-${item.color}-400 h-full rounded-full`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-700 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            type="button"
          >
            Kirim Pengingat WhatsApp
          </button>
        </div>
      </div>

      {/* ── Bottom Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tabel Registrasi (7 col) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm lg:col-span-7 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                  Registrasi & Mutasi Siswa Terkini
                </h3>
                <span className="px-1.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20 shadow-sm">
                  {REGISTRASI.length} Data
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Verifikasi berkas peserta didik baru dan mutasi masuk
              </p>
            </div>
            <Link
              to="/operator/approval-ortu"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 transition-colors self-start sm:self-auto"
            >
              Lihat Semua
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </Link>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-1.5 pl-2 rounded-l-lg">Nama & NISN</th>
                  <th className="py-1.5 px-2 hidden sm:table-cell">Waktu</th>
                  <th className="py-1.5 px-2">Kelas</th>
                  <th className="py-1.5 px-2">Status</th>
                  <th className="py-1.5 pr-2 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REGISTRASI.map((r) => (
                  <tr
                    key={r.nisn}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-1.5 pl-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${r.grad} text-white font-bold flex items-center justify-center text-[10px] shadow-sm shrink-0`}
                        >
                          {r.initials}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-[11px] group-hover:text-blue-600 transition-colors block truncate">
                            {r.nama}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            #{r.nisn}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-slate-500 text-[10px] hidden sm:table-cell">
                      <div className="flex items-center gap-1 font-medium">
                        <svg
                          className="w-3 h-3 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                        {r.waktu}
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="px-1.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200/60">
                        {r.kelas}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded-full text-[10px] font-bold ring-1 shadow-sm ${r.statusColor}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${r.dot} animate-pulse`}
                        />
                        {r.status}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <button className="w-6 h-6 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                          <path
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              Menampilkan <b className="text-slate-800">{REGISTRASI.length}</b>{" "}
              data terbaru
            </span>
            <Link
              to="/operator/approval-ortu"
              className="text-blue-600 font-bold hover:underline"
            >
              Lihat semua →
            </Link>
          </div>
        </div>

        {/* Ekskul (5 col) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                  Minat Ekstrakurikuler
                </h3>
                <span className="px-1.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20 shadow-sm">
                  12 Ekskul
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Sebaran partisipasi non-akademik siswa
              </p>
            </div>
            <a
              className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/80 rounded-md transition-colors"
              href="#"
            >
              Lihat Detail
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </a>
          </div>
          <div className="space-y-2">
            {EKSKUL.map((e) => (
              <div
                key={e.nama}
                className="p-2 rounded-xl bg-slate-50/60 hover:bg-slate-100/40 border border-slate-100 transition-all duration-200 group/ekskul"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">
                      {e.nama}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      {e.sub}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-extrabold text-slate-900">
                      {e.count}{" "}
                      <span className="text-[9px] font-normal text-slate-400">
                        siswa
                      </span>
                    </div>
                    <span
                      className="inline-block px-1 rounded text-[9px] font-bold"
                      style={{ background: e.bgLight, color: e.color }}
                    >
                      {e.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${e.pct}%`, background: e.grad }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20 flex items-center justify-center shrink-0">
                <svg
                  className="w-2 h-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                </svg>
              </span>
              Tersinkron Rapor Merdeka & P5
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100/80 text-slate-500 font-semibold text-[9px] border border-slate-200/70">
              Total 12 Ekstra
            </span>
          </div>
        </div>
      </div>

      {/* ── Agenda & Log Aktivitas ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kalender & Agenda (7 col) */}
        <div className="bg-white rounded-2xl p-5 lg:p-6 border border-slate-200/70 shadow-sm lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/20 flex items-center justify-center shrink-0 shadow-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm lg:text-base tracking-tight">
                    Agenda Akademik Terdekat
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20 shadow-sm">
                    Semester Ganjil
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Jadwal asesmen, batas Dapodik, dan rapat sekolah
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition duration-200 shadow-sm border border-blue-100/80 self-start sm:self-auto"
              type="button"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
              </svg>
              Tambah Agenda
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              {
                tgl: "09",
                bln: "Okt",
                title: "Penilaian Tengah Semester (PTS)",
                badge: "Hari Ini",
                badgeColor: "bg-blue-100 text-blue-700 ring-blue-500/20",
                detail: "07:30–12:00 WIB • Semua Kelas",
                grad: "from-blue-600 to-indigo-600",
                border: "border-blue-100 bg-blue-50/40 hover:border-blue-200",
              },
              {
                tgl: "11",
                bln: "Okt",
                title: "Batas Akhir Validasi Data Dapodik",
                badge: "Penting",
                badgeColor: "bg-amber-100 text-amber-900 ring-amber-600/20",
                detail: "Sinkronisasi PIP • Portal Kemendikbud",
                grad: "from-amber-500 to-amber-600",
                border:
                  "border-amber-100 bg-amber-50/40 hover:border-amber-200",
              },
              {
                tgl: "15",
                bln: "Okt",
                title: "Rapat Pleno Komite & Guru Wali",
                badge: "Ruang Rapat",
                badgeColor: "bg-purple-100 text-purple-900 ring-purple-600/20",
                detail: "Ruang Multimedia • Agenda RKT 2025",
                grad: "from-purple-600 to-indigo-600",
                border:
                  "border-purple-100 bg-purple-50/40 hover:border-purple-200",
              },
            ].map((a) => (
              <div
                key={a.tgl}
                className={`p-3 rounded-xl border ${a.border} hover:bg-white hover:shadow-md transition-all duration-200 flex items-center gap-3.5 cursor-pointer group/item`}
              >
                <div
                  className={`text-center font-bold px-2.5 py-1.5 bg-gradient-to-br ${a.grad} text-white rounded-xl shrink-0 text-xs shadow-sm ring-1 ring-white/30 group-hover/item:scale-105 transition-transform`}
                >
                  <span className="text-sm font-black leading-none block">
                    {a.tgl}
                  </span>
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">
                    {a.bln}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {a.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full ring-1 shrink-0 ${a.badgeColor}`}
                    >
                      {a.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {a.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />3
              kegiatan terjadwal pekan ini
            </span>
            <a
              className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
              href="#"
            >
              Kelola Semua Agenda
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Log Aktivitas (5 col) */}
        <div className="bg-white rounded-2xl p-5 lg:p-6 border border-slate-200/70 shadow-sm lg:col-span-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/20 flex items-center justify-center shrink-0 shadow-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm lg:text-base tracking-tight">
                    Aktivitas & Log Sistem
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full ring-1 ring-emerald-600/20 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Audit trail kegiatan operator dan staf TU
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl transition duration-200 shadow-sm self-start sm:self-auto group"
              type="button"
            >
              <svg
                className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:rotate-180 transition-all duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-[11px]">Segarkan</span>
            </button>
          </div>
          <div className="space-y-2.5">
            {LOG_AKTIVITAS.map((log, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all duration-200 flex items-start gap-3 cursor-pointer group/item"
              >
                <div
                  className={`w-8 h-8 rounded-xl ring-1 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-sm transition-transform duration-200 group-hover/item:scale-105 ${log.iconBg}`}
                >
                  {log.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs font-medium text-slate-800 leading-snug truncate">
                      {log.msg}
                    </p>
                    <span
                      className={`px-1.5 rounded-md text-[9px] font-bold ring-1 shrink-0 ${log.badgeColor}`}
                    >
                      {log.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <span>{log.waktu}</span>
                    <span className="text-slate-300">•</span>
                    <span>{log.oleh}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              128 entri terekam hari ini
            </span>
            <a
              className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
              href="#"
            >
              Lihat Seluruh Log
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
