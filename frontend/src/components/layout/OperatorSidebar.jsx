import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

/* ── Struktur menu ─────────────────────────────────────────── */
const MENU_SECTIONS = [
  {
    key: "utama",
    label: "Navigasi Utama",
    items: [
      {
        to: "/operator/dashboard",
        end: true,
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />{" "}
          </svg>
        ),
        label: "Dashboard",
        isDashboard: true,
      },
    ],
  },
  {
    key: "master",
    label: "Master Data",
    icon: (
      <svg
        className="w-4 h-4"
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
    ),
    items: [
      { to: "/operator/master/siswa", label: "Data Siswa" },
      { to: "/operator/master/guru", label: "Guru & Tendik" },
      { to: "/operator/master/ortu", label: "Orang Tua / Wali" },
    ],
  },
  {
    key: "referensi",
    label: "Referensi Akademik",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/master/tahun-ajaran", label: "Tahun Ajaran" },
      { to: "/operator/master/kelas", label: "Kelas & Rombel" },
      { to: "/operator/master/mapel", end: true, label: "Mata Pelajaran" },
    ],
  },
  {
    key: "akademik",
    label: "Akademik",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      {
        to: "/operator/akademik/penempatan-siswa",
        label: "Penempatan Siswa",
        soon: true,
      },
      {
        to: "/operator/akademik/penugasan-guru",
        label: "Pengampu Mapel",
        soon: true,
      },
      {
        to: "/operator/master/jadwal-pelajaran",
        label: "Jadwal Pelajaran",
        soon: true,
      },
      {
        to: "/operator/master/kalender",
        label: "Kalender Akademik",
        soon: true,
      },
      { to: "/operator/master/penilaian", label: "Penilaian", soon: true },
      { to: "/operator/master/rapor", label: "Rapor", soon: true },
      { to: "/operator/master/naik-kelas", label: "Kenaikan Kelas" },
      { to: "/operator/akademik/kelulusan", label: "Kelulusan", soon: true },
    ],
  },
  {
    key: "kesiswaan",
    label: "Kesiswaan",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/absensi", label: "Presensi & Absensi" },
      {
        to: "/operator/master/siswa/mutasi",
        label: "Mutasi Siswa",
        soon: true,
      },
      {
        to: "/operator/kesiswaan/ekstrakurikuler",
        label: "Ekstrakurikuler",
        soon: true,
      },
      { to: "/operator/kesiswaan/organisasi", label: "Organisasi", soon: true },
      { to: "/operator/kesiswaan/kegiatan", label: "Kegiatan", soon: true },
      { to: "/operator/kesiswaan/prestasi", label: "Prestasi", soon: true },
    ],
  },
  {
    key: "ppdb",
    label: "PPDB",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/ppdb/dashboard", label: "Dashboard PPDB", soon: true },
      { to: "/operator/ppdb/gelombang", label: "Gelombang", soon: true },
      { to: "/operator/ppdb/jalur", label: "Jalur Pendaftaran", soon: true },
      { to: "/operator/ppdb/pendaftar", label: "Pendaftar", soon: true },
      {
        to: "/operator/ppdb/verifikasi",
        label: "Verifikasi Berkas",
        soon: true,
      },
      { to: "/operator/ppdb/seleksi", label: "Seleksi", soon: true },
      { to: "/operator/ppdb/pengumuman", label: "Pengumuman PPDB", soon: true },
      { to: "/operator/ppdb/daftar-ulang", label: "Daftar Ulang", soon: true },
    ],
  },
  {
    key: "keuangan",
    label: "Keuangan",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/keuangan", label: "Keuangan SPP", dot: true },
      { to: "/operator/keuangan/tagihan", label: "Tagihan Siswa" },
      { to: "/operator/keuangan/rekap", label: "Rekap Kas" },
    ],
  },
  {
    key: "laporan",
    label: "Laporan",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/laporan/siswa", label: "Laporan Siswa", soon: true },
      { to: "/operator/laporan/guru", label: "Laporan Guru", soon: true },
      {
        to: "/operator/laporan/akademik",
        label: "Laporan Akademik",
        soon: true,
      },
      { to: "/operator/laporan/absensi", label: "Laporan Absensi", soon: true },
      { to: "/operator/laporan/nilai", label: "Nilai & Rapor", soon: true },
      {
        to: "/operator/laporan/keuangan",
        label: "Laporan Keuangan",
        soon: true,
      },
      { to: "/operator/laporan/ppdb", label: "Laporan PPDB", soon: true },
    ],
  },
  {
    key: "administrasi",
    label: "Administrasi",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/approval-ortu", label: "Approval Orang Tua" },
      { to: "/operator/manajemen-akun", label: "Manajemen Akun" },
      { to: "/operator/arsip-dokumen", label: "Arsip Dokumen", soon: true },
      { to: "/operator/surat", label: "Surat Menyurat", soon: true },
      { to: "/operator/cetak-dokumen", label: "Cetak Dokumen", soon: true },
    ],
  },
  {
    key: "informasi",
    label: "Informasi",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/pengumuman", label: "Pengumuman Sekolah" },
      { to: "/operator/master/galeri", label: "Galeri" },
    ],
  },
  {
    key: "pengguna",
    label: "Pengguna",
    icon: (
      <svg
        className="w-4 h-4"
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
    ),
    items: [
      { to: "/operator/manajemen-akun", label: "Manajemen User" },
      { to: "/operator/roles", label: "Role & Hak Akses", soon: true },
      { to: "/operator/ortu-pending", label: "Approval Orang Tua" },
    ],
  },
  {
    key: "sistem",
    label: "Sistem",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
    items: [
      { to: "/operator/logs", label: "Audit Log", soon: true },
      { to: "/operator/aktivitas", label: "Aktivitas User", soon: true },
      { to: "/operator/backup", label: "Backup & Restore", soon: true },
      { to: "/operator/import-export", label: "Import / Export", soon: true },
      { to: "/operator/notifikasi", label: "Notifikasi", soon: true },
    ],
  },
];

/* ── Section dropdown ──────────────────────────────────────── */
function SidebarSection({ section, onClose }) {
  const location = useLocation();
  const isAnyChildActive = section.items.some((item) =>
    item.to ? location.pathname.startsWith(item.to) : false,
  );
  const [open, setOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) setOpen(true);
  }, [location.pathname, isAnyChildActive]);

  return (
    <details
      className="group"
      open={open || undefined}
      onToggle={(e) => setOpen(e.target.open)}
    >
      <summary className="rounded-xl px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-between text-sm font-medium cursor-pointer list-none">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200/70 text-slate-500 group-hover:text-slate-800 flex items-center justify-center shrink-0 transition-colors">
            {section.icon}
          </div>
          <span>{section.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {section.badge && (
            <span className="bg-rose-50 text-rose-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-100">
              {section.badge}
            </span>
          )}
          <svg
            className="w-3.5 h-3.5 text-slate-400 group-open:rotate-90 transition-transform shrink-0"
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
        </div>
      </summary>
      <div className="border-l border-slate-200 ml-5 pl-3.5 my-1 space-y-1">
        {section.items.map((item) =>
          item.soon ? (
            <div
              key={item.to}
              className="text-xs py-1.5 px-2 rounded-lg flex items-center justify-between text-slate-300 cursor-not-allowed select-none"
            >
              <span>{item.label}</span>
              <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Soon
              </span>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `text-xs py-1.5 px-2 rounded-lg block transition flex items-center justify-between ${
                  isActive
                    ? "text-blue-600 bg-blue-50/60 font-semibold"
                    : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                }`
              }
            >
              <span>{item.label}</span>
              {item.dot && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </NavLink>
          ),
        )}
      </div>
    </details>
  );
}

/* ── Export utama ──────────────────────────────────────────── */
export function SidebarContent({ onClose }) {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OP";

  const schoolName = school?.nama ?? "Scholara";

  return (
    <div className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-full">
      {/* ── Scrollable top ── */}
      <div className="p-5 overflow-y-auto flex-1">
        {/* Logo & Branding */}
        <div className="flex items-center justify-between gap-3 mb-6 px-1">
          <div className="flex items-center gap-3">
            {/* Logo icon */}
            <div className="relative flex items-center justify-center shrink-0 group/logo cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 rounded-2xl blur-sm opacity-40 group-hover/logo:opacity-75 transition-opacity duration-300" />
              <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-2 ring-white/40 transition-all duration-300 group-hover/logo:scale-105">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 14l9-5-9-5-9 5 9 5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M12 14v7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-blue-600" />
              </div>
            </div>
            {/* Brand text */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[18px] leading-none tracking-tight text-slate-900">
                  Scholara
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-700 rounded-md ring-1 ring-blue-600/20">
                  SIMS
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-[11px] font-semibold text-slate-400 truncate tracking-wide">
                  {schoolName}
                </p>
              </div>
            </div>
          </div>
          {/* Close button mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Tutup Menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="space-y-6">
          {/* Dashboard link (active item style beda) */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
              Navigasi Utama
            </div>
            <NavLink
              to="/operator/dashboard"
              end
              onClick={onClose}
              className={({ isActive }) =>
                isActive
                  ? "bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/25 font-medium px-3.5 py-2.5 flex items-center justify-between group hover:bg-blue-700 transition"
                  : "rounded-xl px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-between text-sm font-medium"
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Dashboard</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </>
              )}
            </NavLink>

            {/* Dropdowns */}
            {MENU_SECTIONS.filter(
              (s) =>
                s.key !== "utama" &&
                s.key !== "keuangan" &&
                s.key !== "administrasi",
            ).map((section) => (
              <SidebarSection
                key={section.key}
                section={section}
                onClose={onClose}
              />
            ))}
          </div>

          {/* Keuangan */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
              Keuangan
            </div>
            {MENU_SECTIONS.filter((s) => s.key === "keuangan").map(
              (section) => (
                <SidebarSection
                  key={section.key}
                  section={section}
                  onClose={onClose}
                />
              ),
            )}
          </div>

          {/* Administrasi */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
              Administrasi
            </div>
            {MENU_SECTIONS.filter((s) => s.key === "administrasi").map(
              (section) => (
                <SidebarSection
                  key={section.key}
                  section={section}
                  onClose={onClose}
                />
              ),
            )}
          </div>
        </nav>
      </div>

      {/* ── Footer profile ── */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 flex flex-col gap-2 shrink-0">
        <div className="relative overflow-hidden rounded-2xl bg-white p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-[2px] shadow-sm group-hover:scale-105 transition-transform duration-200">
                {user?.foto ? (
                  <img
                    src={`${BASE_URL}/storage/${user.foto}`}
                    alt={user?.name}
                    className="w-full h-full rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-extrabold text-xs tracking-wider">
                    {initials}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center ring-1 ring-emerald-600/20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              </span>
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name ?? "Operator"}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-600/20">
                  <span className="w-1 h-1 rounded-full bg-blue-600" />
                  Operator
                </span>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-3 mt-3 border-t border-slate-100/90 relative z-10">
            <NavLink
              to="/operator/profil"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-slate-50/80 hover:bg-blue-50/80 border border-slate-200/70 hover:border-blue-100 transition-all duration-200 shadow-sm group/btn active:scale-[0.99]"
            >
              <svg
                className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Profil</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/40 hover:bg-rose-50 border border-rose-100/70 hover:border-rose-200 transition-all duration-200 shadow-sm group/btn active:scale-[0.99]"
            >
              <svg
                className="w-3.5 h-3.5 text-rose-500 group-hover/btn:translate-x-0.5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
