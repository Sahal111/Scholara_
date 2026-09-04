import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

/* ── Struktur menu Wakasek Kurikulum ─────────────────────────── */
const MENU_SECTIONS = [
  {
    key: "kebijakan",
    label: "Kebijakan Akademik",
    icon: "policy",
    items: [
      {
        to: "/wakasek/tahun-ajaran",
        icon: "calendar_today",
        label: "Tahun Ajaran & Semester",
      },
      {
        to: "/wakasek/kurikulum",
        icon: "school",
        label: "Kurikulum",
      },
      {
        to: "/wakasek/program-pendidikan",
        icon: "account_tree",
        label: "Program Pendidikan",
      },
      {
        to: "/wakasek/mapel",
        icon: "menu_book",
        label: "Mata Pelajaran",
      },
    ],
  },
  {
    key: "operasional",
    label: "Operasional Kelas",
    icon: "class",
    items: [
      {
        to: "/wakasek/kelas",
        icon: "meeting_room",
        label: "Kelas & Rombel",
      },
      {
        to: "/wakasek/penempatan-siswa",
        icon: "transfer_within_a_station",
        label: "Penempatan Siswa",
        soon: true,
      },
      {
        to: "/wakasek/pengampu-mapel",
        icon: "assignment_ind",
        label: "Pengampu Mapel",
        soon: true,
      },
      {
        to: "/wakasek/jadwal",
        icon: "event_note",
        label: "Jadwal Pelajaran",
        soon: true,
      },
      {
        to: "/wakasek/kalender",
        icon: "calendar_month",
        label: "Kalender Akademik",
        soon: true,
      },
    ],
  },
  {
    key: "penilaian",
    label: "Penilaian & Rapor",
    icon: "grade",
    items: [
      {
        to: "/wakasek/nilai",
        icon: "grading",
        label: "Rekap Nilai Semua Kelas",
        soon: true,
      },
      {
        to: "/wakasek/rapor",
        icon: "description",
        label: "Finalisasi Rapor",
        soon: true,
      },
      {
        to: "/wakasek/naik-kelas",
        icon: "trending_up",
        label: "Kenaikan Kelas",
        soon: true,
      },
    ],
  },
  {
    key: "pengawasan",
    label: "Pengawasan",
    icon: "manage_search",
    items: [
      {
        to: "/wakasek/absensi",
        icon: "checklist",
        label: "Rekap Absensi",
      },
      {
        to: "/wakasek/guru",
        icon: "supervisor_account",
        label: "Data Guru",
      },
      {
        to: "/wakasek/siswa",
        icon: "groups",
        label: "Data Siswa",
      },
    ],
  },
  {
    key: "informasi",
    label: "Informasi",
    icon: "campaign",
    items: [
      {
        to: "/wakasek/pengumuman",
        icon: "notification_important",
        label: "Pengumuman",
      },
      {
        to: "/wakasek/laporan",
        icon: "assessment",
        label: "Laporan",
      },
    ],
  },
];

/* ── Dropdown Section ─────────────────────────────────────────── */
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
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-white/60 hover:text-[#a78bfa] hover:bg-white/5 rounded-xl transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px]">
            {section.icon}
          </span>
          <span className="text-[11px] font-bold tracking-widest uppercase">
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
        className="flex flex-col ml-8 mt-0.5 gap-0.5 overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "600px" : "0px" }}
      >
        {section.items.map((item) => (
          <SidebarItem key={item.to} item={item} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

/* ── Item individual ─────────────────────────────────────────── */
function SidebarItem({ item, onClose }) {
  if (item.soon) {
    return (
      <div className="text-white/25 px-4 py-2 text-sm rounded-lg flex items-center gap-2 cursor-not-allowed select-none">
        <span className="flex-1">{item.label}</span>
        <span className="text-[9px] font-bold bg-white/5 text-white/25 px-1.5 py-0.5 rounded uppercase tracking-wide">
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
        `px-4 py-2 transition-all duration-200 text-sm rounded-lg flex items-center ${
          isActive
            ? "text-[#a78bfa] bg-white/10 font-semibold"
            : "text-white/50 hover:text-[#a78bfa] hover:bg-white/5"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

/* ── SidebarContent (export utama) ──────────────────────────── */
export function WakasekSidebarContent({ onClose }) {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login", { replace: true });
  };

  const schoolName = school?.nama ?? "Scholara";

  return (
    <div
      className="flex flex-col h-full w-[272px] overflow-y-auto border-r border-white/5"
      style={{ background: "#1e1b4b" }}
    >
      {/* ── Logo Header ── */}
      <div
        className="p-5 border-b border-white/10 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "rgba(30,27,75,0.97)" }}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-[#a78bfa]/40">
          <span className="material-symbols-outlined text-[#a78bfa] text-xl">
            school
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-sm leading-tight truncate">
            {schoolName}
          </h1>
          <p className="text-[#a78bfa]/70 text-[10px] font-semibold uppercase tracking-widest mt-0.5">
            Waka Kurikulum
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/40 md:hidden"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* ── User Info ── */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-[#a78bfa]/20 border border-[#a78bfa]/30 overflow-hidden flex items-center justify-center shrink-0">
            {user?.foto ? (
              <img
                src={`${BASE_URL}/storage/${user.foto}`}
                alt={user?.nama_lengkap}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#a78bfa] font-bold text-sm">
                {user?.nama_lengkap?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white/90 truncate">
              {user?.nama_lengkap}
            </p>
            <p className="text-[10px] text-white/40">Wakasek Kurikulum</p>
          </div>
        </div>
      </div>

      {/* ── Dashboard link ── */}
      <div className="px-3 pt-3 pb-1">
        <NavLink
          to="/wakasek"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#a78bfa]/20 text-[#a78bfa]"
                : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`
          }
        >
          <span className="material-symbols-outlined text-[18px]">
            dashboard
          </span>
          Dashboard
        </NavLink>
      </div>

      {/* ── Menu Sections ── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {MENU_SECTIONS.map((section) => (
          <SidebarSection
            key={section.key}
            section={section}
            onClose={onClose}
          />
        ))}
      </nav>

      {/* ── Profil & Logout ── */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <NavLink
          to="/wakasek/profil"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`
          }
        >
          <span className="material-symbols-outlined text-[18px]">
            account_circle
          </span>
          Profil Saya
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Keluar
        </button>
      </div>
    </div>
  );
}
