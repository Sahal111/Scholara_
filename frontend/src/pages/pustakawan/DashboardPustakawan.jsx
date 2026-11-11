import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useBukuStats } from "../../hooks/api/usePerpustakaan";
import {
  BookOpen,
  BookOpenCheck,
  AlertTriangle,
  Users,
  Plus,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, bg, to }) {
  const content = (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 ${color}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-800">{value ?? "—"}</p>
        <p className="text-sm text-gray-500 truncate">{label}</p>
      </div>
      {to && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function DashboardPustakawan() {
  const { user } = useAuth();
  const { data: statsData, isLoading, refetch } = useBukuStats();
  const stats = statsData?.data;

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard Perpustakaan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat datang, {user?.nama || user?.name || "Pustakawan"} · {today}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Judul Buku"
            value={stats?.total_judul}
            color="border-l-blue-500"
            bg="bg-blue-50 text-blue-600"
            to="/pustakawan/buku"
          />
          <StatCard
            icon={BookOpen}
            label="Total Eksemplar"
            value={stats?.total_eksemplar}
            color="border-l-indigo-500"
            bg="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            icon={BookOpenCheck}
            label="Sedang Dipinjam"
            value={stats?.sedang_dipinjam}
            color="border-l-amber-500"
            bg="bg-amber-50 text-amber-600"
            to="/pustakawan/peminjaman?status=dipinjam"
          />
          <StatCard
            icon={AlertTriangle}
            label="Terlambat Kembali"
            value={stats?.terlambat}
            color="border-l-red-500"
            bg="bg-red-50 text-red-600"
            to="/pustakawan/peminjaman?status=terlambat"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link
            to="/pustakawan/buku/tambah"
            className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-blue-700">Tambah Buku</span>
          </Link>
          <Link
            to="/pustakawan/peminjaman/tambah"
            className="flex items-center gap-3 p-4 rounded-xl border border-green-100 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <BookOpenCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-700">Catat Peminjaman</span>
          </Link>
          <Link
            to="/pustakawan/peminjaman?status=terlambat"
            className="flex items-center gap-3 p-4 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-700">Buku Terlambat</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
