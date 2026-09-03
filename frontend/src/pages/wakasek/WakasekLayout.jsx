import AppLayout from "../../components/layout/AppLayout";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  UserCircle,
  GraduationCap,
} from "lucide-react";

const menus = [
  { path: "/wakasek", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/wakasek/kurikulum", label: "Kurikulum", icon: GraduationCap },
  { path: "/wakasek/guru", label: "Data Guru", icon: Users },
  { path: "/wakasek/siswa", label: "Data Siswa", icon: Users },
  { path: "/wakasek/jadwal", label: "Jadwal Pelajaran", icon: CalendarDays },
  { path: "/wakasek/absensi", label: "Rekap Absensi", icon: ClipboardList },
  { path: "/wakasek/laporan", label: "Laporan", icon: FileText },
  { path: "/wakasek/pengumuman", label: "Pengumuman", icon: BookOpen },
  { path: "/wakasek/profil", label: "Profil", icon: UserCircle },
];

export default function WakasekLayout() {
  return <AppLayout menus={menus} />;
}
