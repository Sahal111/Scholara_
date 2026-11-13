import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Server,
  Database,
  Key,
  Sliders,
  HardDrive,
  Activity,
  LogOut,
  Building2,
  Cpu,
  BookOpen,
} from "lucide-react";

const navItems = [
  {
    label: "Developer Dashboard",
    icon: Server,
    path: "/superadmin",
    end: true,
  },
  {
    label: "Tenant & Multi-School",
    icon: Building2,
    path: "/superadmin/tenant",
  },
  {
    label: "Kurikulum Sekolah",
    icon: BookOpen,
    path: "/superadmin/kurikulum",
  },
  { label: "Role & Permissions System", icon: Key, path: "/superadmin/rbac" },
  {
    label: "System Config & Gateways",
    icon: Sliders,
    path: "/superadmin/config",
  },
  {
    label: "Database Backup & Restore",
    icon: Database,
    path: "/superadmin/database",
  },
  {
    label: "Storage & Server Quotas",
    icon: HardDrive,
    path: "/superadmin/storage",
  },
  { label: "Audit & Error Logs", icon: Activity, path: "/superadmin/logs" },
];

export default function SuperAdminSidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-white tracking-wide">
            SIAKAD SaaS Platform
          </h2>
          <p className="text-[10px] text-purple-400 uppercase font-mono tracking-widest font-semibold">
            Global Super Admin
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          ⚙️ System Infrastructure
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`
            }
          >
            <item.icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
            SA
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.nama || "Developer Super Admin"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Developer Mode
        </button>
      </div>
    </aside>
  );
}
