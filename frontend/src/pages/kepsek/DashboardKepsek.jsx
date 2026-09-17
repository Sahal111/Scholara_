import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  ClipboardCheck,
  Bell,
  Calendar,
  Megaphone,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------
// SESUAIKAN DENGAN SETUP PROJECT KAMU
// ---------------------------------------------------------
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? "-"}</p>
      </div>
    </div>
  );
}

function NotifIcon({ tipe }) {
  if (tipe === "danger")
    return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
  if (tipe === "warning")
    return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
  return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
}

export default function DashboardKepsek() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["kepsek-dashboard"],
    queryFn: () => api.get("/kepsek/dashboard").then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Memuat dashboard...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Gagal memuat data dashboard.
      </div>
    );
  }

  const hariIni = data.hari_ini ?? {};

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Kepala Sekolah
        </h1>
        <p className="text-gray-500 text-sm">
          Ringkasan data sekolah —{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="Jumlah Siswa"
          value={data.total_siswa}
          color="bg-blue-500"
        />
        <StatCard
          icon={GraduationCap}
          label="Jumlah Guru"
          value={data.total_guru}
          color="bg-emerald-500"
        />
        <StatCard
          icon={School}
          label="Jumlah Kelas"
          value={data.total_kelas}
          color="bg-purple-500"
        />
        <StatCard
          icon={BookOpen}
          label="Mata Pelajaran"
          value={data.total_mapel}
          color="bg-orange-500"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Absensi Hari Ini"
          value={`${hariIni.kelas_sudah_absen}/${data.total_kelas} kelas`}
          color="bg-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAFIK KEHADIRAN */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            Grafik Kehadiran Siswa (7 Hari Terakhir)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.grafik_kehadiran}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="hadir"
                name="Hadir"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="sakit"
                name="Sakit"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="izin"
                name="Izin"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="alpa"
                name="Alpa"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* NOTIFIKASI PENTING */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" /> Notifikasi Penting
          </h2>
          <div className="space-y-3">
            {data.notifikasi.map((n, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <NotifIcon tipe={n.tipe} />
                <p>{n.pesan}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENGUMUMAN TERBARU */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-gray-400" /> Pengumuman Terbaru
          </h2>
          <div className="divide-y divide-gray-100">
            {data.pengumuman_terbaru.length === 0 && (
              <p className="text-sm text-gray-400 py-4">
                Belum ada pengumuman.
              </p>
            )}
            {data.pengumuman_terbaru.map((p) => (
              <div key={p.id} className="py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-800 text-sm">{p.judul}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {p.kategori}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{p.ringkasan}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {p.penulis} • {p.tanggal}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* KALENDER AKADEMIK */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" /> Kalender Akademik
          </h2>

          {data.kalender_akademiks.tahun_ajaran_aktif && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                {data.kalender_akademiks.tahun_ajaran_aktif.nama}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {data.kalender_akademiks.tahun_ajaran_aktif.mulai} s/d{" "}
                {data.kalender_akademiks.tahun_ajaran_aktif.selesai}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {data.kalender_akademiks.agenda.length === 0 && (
              <p className="text-sm text-gray-400">
                Belum ada agenda tercatat.
              </p>
            )}
            {data.kalender_akademiks.agenda.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                  {a.kategori}
                </span>
                <p className="text-gray-700">{a.judul}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
