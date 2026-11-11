import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useKonselingStats } from "../../hooks/api/useBk";
import {
  HeartHandshake,
  NotebookPen,
  AlertTriangle,
  TrendingUp,
  Users,
  CalendarDays,
  ChevronRight,
  RefreshCw,
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

const KATEGORI_LABELS = {
  pribadi: "Pribadi",
  sosial: "Sosial",
  belajar: "Belajar",
  karir: "Karir",
  keluarga: "Keluarga",
  lainnya: "Lainnya",
};

const KATEGORI_COLORS = {
  pribadi: "bg-purple-100 text-purple-700",
  sosial: "bg-blue-100 text-blue-700",
  belajar: "bg-green-100 text-green-700",
  karir: "bg-orange-100 text-orange-700",
  keluarga: "bg-pink-100 text-pink-700",
  lainnya: "bg-gray-100 text-gray-700",
};

export default function DashboardGuruBk() {
  const { user } = useAuth();
  const { data: statsData, isLoading, refetch } = useKonselingStats();
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
          <h1 className="text-xl font-bold text-gray-800">Dashboard Guru BK</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat datang, {user?.nama || user?.name || "Guru BK"} · {today}
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

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={HeartHandshake}
            label="Total Konseling"
            value={stats?.total}
            color="border-l-blue-500"
            bg="bg-blue-50 text-blue-600"
            to="/guru-bk/konseling"
          />
          <StatCard
            icon={CalendarDays}
            label="Konseling Bulan Ini"
            value={stats?.bulan_ini}
            color="border-l-green-500"
            bg="bg-green-50 text-green-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Perlu Tindak Lanjut"
            value={stats?.perlu_tindak_lanjut}
            color="border-l-amber-500"
            bg="bg-amber-50 text-amber-600"
            to="/guru-bk/konseling?status=perlu_tindak_lanjut"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Per Kategori */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Konseling per Kategori
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.per_kategori && Object.keys(stats.per_kategori).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(stats.per_kategori).map(([kat, jumlah]) => (
                <li key={kat} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${KATEGORI_COLORS[kat] ?? "bg-gray-100 text-gray-700"}`}>
                    {KATEGORI_LABELS[kat] ?? kat}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{jumlah}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada data konseling</p>
          )}
        </div>

        {/* Siswa Sering Konseling */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Siswa Paling Sering Konseling
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.sering_konseling?.length > 0 ? (
            <ul className="space-y-2">
              {stats.sering_konseling.map((item, idx) => (
                <li key={item.siswa_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${idx === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{item.siswa?.nama ?? "—"}</p>
                      <p className="text-xs text-gray-400">{item.siswa?.nisn}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-600">{item.jumlah}x</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada data</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link
            to="/guru-bk/konseling/tambah"
            className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <HeartHandshake className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-blue-700">Catat Konseling</span>
          </Link>
          <Link
            to="/guru-bk/catatan/tambah"
            className="flex items-center gap-3 p-4 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <NotebookPen className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-purple-700">Tambah Catatan</span>
          </Link>
          <Link
            to="/guru-bk/konseling?status=perlu_tindak_lanjut"
            className="flex items-center gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-700">Tindak Lanjut</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
