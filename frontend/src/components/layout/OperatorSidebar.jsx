import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

/* ── Data struktur menu ─────────────────────────────────────── */
const MENU_SECTIONS = [
  {
    key: "master",
    label: "Master Data",
    icon: "database",
    items: [
      {
        to: "/operator/master/siswa",
        end: false,
        icon: "school",
        label: "Siswa",
      },
      {
        to: "/operator/master/guru",
        end: false,
        icon: "supervisor_account",
        label: "Guru",
      },
      {
        to: "/operator/master/ortu",
        end: false,
        icon: "family_restroom",
        label: "Orang Tua",
      },
      {
        to: "/operator/master/kelas",
        end: false,
        icon: "meeting_room",
        label: "Kelas",
      },
      {
        to: "/operator/master/mapel",
        end: true,
        icon: "menu_book",
        label: "Mata Pelajaran",
      },
      {
        to: "/operator/master/program-pendidikan",
        end: false,
        icon: "account_tree",
        label: "Program Pendidikan",
      },
      {
        to: "/operator/master/tahun-ajaran",
        end: false,
        icon: "calendar_today",
        label: "Tahun Ajaran & Semester",
      },
    ],
  },
  {
    key: "akademik",
    label: "Akademik",
    icon: "school",
    items: [
      {
        to: "/operator/akademik/penempatan-siswa",
        icon: "transfer_within_a_station",
        label: "Penempatan Siswa",
        soon: true,
      },
      {
        to: "/operator/akademik/penugasan-guru",
        icon: "assignment_ind",
        label: "Pengampu Mapel",
        soon: true,
      },
      {
        to: "/operator/master/jadwal-pelajaran",
        icon: "event_note",
        label: "Jadwal Pelajaran",
      },
      {
        to: "/operator/master/kalender",
        icon: "calendar_month",
        label: "Kalender Akademik",
        soon: true,
      },
      {
        to: "/operator/master/absensi",
        icon: "checklist",
        label: "Absensi",
        soon: true,
      },
      {
        to: "/operator/master/penilaian",
        icon: "grade",
        label: "Penilaian",
        soon: true,
      },
      {
        to: "/operator/master/rapor",
        icon: "description",
        label: "Rapor",
        soon: true,
      },
      {
        to: "/operator/master/naik-kelas",
        icon: "trending_up",
        label: "Kenaikan Kelas",
      },
      {
        to: "/operator/master/siswa/mutasi",
        icon: "swap_horiz",
        label: "Mutasi Siswa",
        soon: true,
      },
      {
        to: "/operator/akademik/kelulusan",
        icon: "workspace_premium",
        label: "Kelulusan",
        soon: true,
      },
    ],
  },
  {
    key: "ppdb",
    label: "PPDB",
    icon: "person_add",
    items: [
      {
        to: "/operator/ppdb/dashboard",
        icon: "dashboard_customize",
        label: "Dashboard",
        soon: true,
      },
      {
        to: "/operator/ppdb/gelombang",
        icon: "waves",
        label: "Gelombang",
        soon: true,
      },
      {
        to: "/operator/ppdb/jalur",
        icon: "alt_route",
        label: "Jalur Pendaftaran",
        soon: true,
      },
      {
        to: "/operator/ppdb/pendaftar",
        icon: "group_add",
        label: "Pendaftar",
        soon: true,
      },
      {
        to: "/operator/ppdb/verifikasi",
        icon: "fact_check",
        label: "Verifikasi Berkas",
        soon: true,
      },
      {
        to: "/operator/ppdb/seleksi",
        icon: "filter_alt",
        label: "Seleksi",
        soon: true,
      },
      {
        to: "/operator/ppdb/pengumuman",
        icon: "campaign",
        label: "Pengumuman",
        soon: true,
      },
      {
        to: "/operator/ppdb/daftar-ulang",
        icon: "how_to_reg",
        label: "Daftar Ulang",
        soon: true,
      },
    ],
  },
  {
    key: "pengguna",
    label: "Pengguna",
    icon: "manage_accounts",
    items: [
      {
        to: "/operator",
        end: true,
        icon: "manage_accounts",
        label: "Manajemen User",
      },
      {
        to: "/operator/roles",
        icon: "shield",
        label: "Role & Permission",
        soon: true,
      },
      {
        to: "/operator/ortu-pending",
        icon: "verified_user",
        label: "Approval Orang Tua",
      },
    ],
  },
  {
    key: "administrasi",
    label: "Administrasi",
    icon: "account_balance_wallet",
    items: [
      {
        to: "/operator/keuangan",
        icon: "account_balance_wallet",
        label: "Keuangan",
      },
      {
        to: "/operator/arsip-dokumen",
        icon: "folder_zip",
        label: "Arsip Dokumen",
        soon: true,
      },
      {
        to: "/operator/surat",
        icon: "mail",
        label: "Surat Menyurat",
        soon: true,
      },
      {
        to: "/operator/cetak-dokumen",
        icon: "print",
        label: "Cetak Dokumen",
        soon: true,
      },
    ],
  },
  {
    key: "laporan",
    label: "Laporan",
    icon: "assessment",
    items: [
      {
        to: "/operator/laporan/siswa",
        icon: "person_search",
        label: "Siswa",
        soon: true,
      },
      {
        to: "/operator/laporan/guru",
        icon: "badge",
        label: "Guru",
        soon: true,
      },
      {
        to: "/operator/laporan/akademik",
        icon: "analytics",
        label: "Akademik",
        soon: true,
      },
      {
        to: "/operator/laporan/absensi",
        icon: "checklist",
        label: "Absensi",
        soon: true,
      },
      {
        to: "/operator/laporan/nilai",
        icon: "grade",
        label: "Nilai & Rapor",
        soon: true,
      },
      {
        to: "/operator/laporan/keuangan",
        icon: "receipt_long",
        label: "Keuangan",
        soon: true,
      },
      {
        to: "/operator/laporan/ppdb",
        icon: "summarize",
        label: "PPDB",
        soon: true,
      },
    ],
  },
  {
    key: "informasi",
    label: "Informasi",
    icon: "campaign",
    items: [
      {
        to: "/operator/master/pengumuman",
        icon: "notification_important",
        label: "Pengumuman",
      },
      {
        to: "/operator/rapor-online",
        icon: "description",
        label: "Rapor Online",
        soon: true,
      },
      { to: "/operator/master/galeri", icon: "photo_library", label: "Galeri" },
    ],
  },
  {
    key: "sistem",
    label: "Sistem",
    icon: "settings_suggest",
    items: [
      {
        to: "/operator/logs",
        icon: "history_edu",
        label: "Audit Log",
        soon: true,
      },
      {
        to: "/operator/aktivitas",
        icon: "person_check",
        label: "Aktivitas User",
        soon: true,
      },
      {
        to: "/operator/backup",
        icon: "backup",
        label: "Backup & Restore",
        soon: true,
      },
      {
        to: "/operator/import-export",
        icon: "sync_alt",
        label: "Import / Export",
        soon: true,
      },
      {
        to: "/operator/notifikasi",
        icon: "notifications",
        label: "Notifikasi",
        soon: true,
      },
      {
        to: "/operator/settings",
        icon: "tune",
        label: "Pengaturan",
        soon: true,
      },
    ],
  },
];

/* ── Dropdown Section ────────────────────────────────────────── */
function SidebarSection({ section, onClose }) {
  const location = useLocation();

  const isAnyChildActive = section.items.some((item) => {
    if (item.soon) return false;
    return item.end
      ? location.pathname === item.to
      : location.pathname === item.to ||
          location.pathname.startsWith(item.to + "/");
  });

  const [open, setOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) setOpen(true);
  }, [location.pathname, isAnyChildActive]);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-white/60 hover:text-[#69ff87] hover:bg-white/5 rounded-xl transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">
            {section.icon}
          </span>
          <span className="text-sm font-semibold tracking-wide uppercase">
            {section.label}
          </span>
        </div>
        <span
          className="material-symbols-outlined text-sm transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      <div
        className="flex flex-col ml-9 mt-1 gap-1 overflow-hidden transition-all duration-500"
        style={{ maxHeight: open ? "600px" : "0px" }}
      >
        {section.items.map((item) => (
          <SidebarItem key={item.to} item={item} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

/* ── Item individual ────────────────────────────────────────── */
function SidebarItem({ item, onClose }) {
  if (item.soon) {
    return (
      <div className="text-white/30 px-4 py-2 text-sm rounded-lg flex items-center gap-2 cursor-not-allowed select-none">
        <span>{item.label}</span>
        <span className="text-[9px] font-bold bg-white/5 text-white/30 px-1.5 py-0.5 rounded uppercase tracking-wide ml-auto">
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end ?? false}
      onClick={onClose}
      className={({ isActive }) =>
        `px-4 py-2 transition-all duration-300 text-sm rounded-lg flex items-center ${
          isActive
            ? "text-[#69ff87] bg-white/10 font-semibold"
            : "text-white/50 hover:text-[#69ff87] hover:bg-white/5"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

/* ── SidebarContent ─────────────────────────────────────────── */
export function SidebarContent({ onClose }) {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login", { replace: true });
  };

  const schoolName = school?.nama ?? "Admin Portal";

  return (
    <div
      className="flex flex-col h-full w-[280px] overflow-y-auto border-r border-white/5"
      style={{ background: "#00342b" }}
    >
      {/* ── Logo Header ── */}
      <div
        className="p-6 border-b border-white/5 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md"
        style={{ background: "rgba(0,52,43,0.95)" }}
      >
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-[#69ff87]/50 shadow-md">
          <span className="material-symbols-outlined text-white text-2xl">
            school
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className="font-extrabold text-white text-lg leading-tight tracking-tight truncate"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {schoolName}
          </h1>
          <p className="text-[#94d3c1] text-xs font-medium uppercase tracking-wider mt-1">
            Admin Portal
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/50 md:hidden"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
        {/* Dashboard Active Link */}
        <NavLink
          to="/operator/dashboard"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-all duration-300 ${
              isActive
                ? "bg-[#69ff87]/10 text-[#69ff87] font-bold shadow-[0_0_20px_rgba(105,255,135,0.1)] border-l-4 border-[#69ff87]"
                : "text-white/60 hover:text-[#69ff87] hover:bg-white/5 border-l-4 border-transparent"
            }`
          }
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="flex-1">Dashboard</span>
        </NavLink>

        {/* Semua sections dropdown */}
        {MENU_SECTIONS.map((section) => (
          <SidebarSection
            key={section.key}
            section={section}
            onClose={onClose}
          />
        ))}

        {/* Settings bottom */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <a
            href="#"
            className="flex items-center gap-3 text-white/40 px-4 py-3 hover:text-[#69ff87] hover:bg-white/5 transition-all duration-300 text-sm rounded-xl border border-transparent hover:border-[#69ff87]/20 group"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-500 group-hover:rotate-90">
              settings
            </span>
            <span className="font-medium">Pengaturan Sistem</span>
          </a>
        </div>
      </nav>

      {/* ── User Profile ── */}
      <div className="px-4 pt-3 pb-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-white/20">
              {user?.foto ? (
                <img
                  alt={user?.nama_lengkap || "Admin"}
                  className="w-full h-full object-cover"
                  src={`${BASE_URL}/storage/${user.foto}`}
                />
              ) : (
                <span>
                  {user?.nama_lengkap?.charAt(0)?.toUpperCase() || "A"}
                </span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#69ff87] rounded-full border-2 border-[#00342b]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {user?.nama_lengkap || "Admin Operator"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold bg-[#69ff87]/20 text-[#69ff87] px-1.5 py-0.5 rounded uppercase tracking-wide">
                Admin
              </span>
              <span className="text-[10px] text-white/40 truncate">
                MI Nurul Huda 3
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="shrink-0 text-white/30 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
          </button>
        </div>
        <div className="mt-2 px-1 flex items-center justify-between text-[10px] text-white/20">
          <span>© 2026 MI Nurul Huda 3</span>
          <span className="font-semibold">v2.4.1</span>
        </div>
      </div>
    </div>
  );
}

/* ── Default export ─────────────────────────────────────────── */
export default function OperatorSidebar({ onClose }) {
  return (
    <aside className="fixed left-0 top-0 h-screen z-40 shadow-2xl overflow-hidden">
      <SidebarContent onClose={onClose} />
    </aside>
  );
}
