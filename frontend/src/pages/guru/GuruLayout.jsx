import AppLayout from "../../components/layout/AppLayout";
import AppSidebar from "../../components/layout/AppSidebar";
import AppTopBar from "../../components/layout/AppTopBar";
import AppFooter from "../../components/layout/AppFooter";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  CalendarDays,
  Megaphone,
  UserCircle,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const menus = [
  { path: "/guru", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/guru/siswa", label: "Data Siswa", icon: Users },
  { path: "/guru/absensi", label: "Input Absensi", icon: ClipboardList },
  { path: "/guru/rekap-absensi", label: "Rekap Absensi", icon: BarChart3 },
  { path: "/guru/jadwal", label: "Jadwal Mengajar", icon: CalendarDays },
  { path: "/guru/lms/materi", label: "Materi", icon: BookOpen },
  { path: "/guru/lms/tugas", label: "Tugas", icon: ClipboardCheck },
  { path: "/guru/lms/ujian", label: "Ujian", icon: FileQuestion },
  { path: "/guru/pengumuman", label: "Pengumuman", icon: Megaphone },
  { path: "/guru/profil", label: "Profil Guru", icon: UserCircle },
];

export default function GuruLayout() {
  return (
    <AppLayout
      sidebar={
        <AppSidebar menus={menus} roleLabel="Guru" profilePath="/guru/profil" />
      }
      topBar={(onMenuClick) => (
        <AppTopBar
          onMenuClick={onMenuClick}
          roleLabel="Guru"
          searchPlaceholder="Cari siswa, jadwal, materi..."
        />
      )}
      footer={<AppFooter roleLabel="Guru" />}
      className="bg-[#f8fafc] text-slate-800 antialiased"
      contentClassName=""
      sidebarWidth={256}
      renderContent={(location) =>
        location.pathname === "/guru" ? (
          <Outlet />
        ) : (
          <div className="p-3 sm:p-4 md:p-6 w-full max-w-[1600px] mx-auto flex-1">
            <Outlet />
          </div>
        )
      }
    />
  );
}
