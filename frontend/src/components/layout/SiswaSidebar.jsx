import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Award,
  Bell,
  User,
  LogOut,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard Siswa", icon: GraduationCap, path: "/siswa", end: true },
  { label: "Jadwal Pelajaran", icon: Calendar, path: "/siswa/jadwal" },
  {
    label: "Kehadiran / Absensi Saya",
    icon: CheckCircle2,
    path: "/siswa/absensi",
  },
  { label: "Nilai & Rapor Digital", icon: Award, path: "/siswa/nilai" },
  { label: "Pengumuman Sekolah", icon: Bell, path: "/siswa/pengumuman" },
  { label: "Profil Saya", icon: User, path: "/siswa/profil" },
];

export default function SiswaSidebar({ onClose }) {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();
  const schoolName = school?.nama ?? "Portal Siswa";

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 tracking-tight">
              Portal Siswa
            </h2>
            <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider truncate">
              {schoolName}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-slate-400 p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
            {user?.nama?.charAt(0) || "S"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user?.nama || "Siswa"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              NISN: {user?.username || "-"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Portal
        </button>
      </div>
    </aside>
  );
}
