import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSuratStats, useLegalisirStats } from "../../hooks/api/useTataUsaha";
import {
  Mail,
  Archive,
  Stamp,
  Plus,
  RefreshCw,
  ChevronRight,
  FileText,
  Clock,
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

export default function DashboardTataUsaha() {
  const { user } = useAuth();
  const { data: suratData, isLoading: loadSurat, refetch: refetchSurat } = useSuratStats();
  const { data: legalisirData, isLoading: loadLegalisir, refetch: refetchLegalisir } = useLegalisirStats();

  const surat = suratData?.data;
  const legalisir = legalisirData?.data;
  const isLoading = loadSurat || loadLegalisir;

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
          <h1 className="text-xl font-bold text-gray-800">Dashboard Tata Usaha</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat datang, {user?.nama || user?.name || "Tata Usaha"} · {today}
          </p>
        </div>
        <button
          onClick={() => { refetchSurat(); refetchLegalisir(); }}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Stats Surat */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Statistik Surat</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={FileText}
              label="Total Surat"
              value={surat?.total}
              color="border-l-blue-500"
              bg="bg-blue-50 text-blue-600"
              to="/tata-usaha/surat"
            />
            <StatCard
              icon={Mail}
              label="Bulan Ini"
              value={surat?.bulan_ini}
              color="border-l-green-500"
              bg="bg-green-50 text-green-600"
            />
            <StatCard
              icon={Archive}
              label="Diarsipkan"
              value={surat?.diarsipkan}
              color="border-l-gray-500"
              bg="bg-gray-50 text-gray-600"
              to="/tata-usaha/arsip"
            />
          </div>
        )}
      </div>

      {/* Stats Legalisir */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Permohonan Legalisir</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={Stamp}
              label="Total Permohonan"
              value={legalisir?.total}
              color="border-l-purple-500"
              bg="bg-purple-50 text-purple-600"
              to="/tata-usaha/legalisir"
            />
            <StatCard
              icon={Clock}
              label="Menunggu Proses"
              value={legalisir?.menunggu}
              color="border-l-amber-500"
              bg="bg-amber-50 text-amber-600"
              to="/tata-usaha/legalisir?status=menunggu"
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link
            to="/tata-usaha/surat/tambah"
            className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-blue-700">Tambah Surat</span>
          </Link>
          <Link
            to="/tata-usaha/legalisir/tambah"
            className="flex items-center gap-3 p-4 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <Stamp className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-purple-700">Catat Legalisir</span>
          </Link>
          <Link
            to="/tata-usaha/arsip"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Archive className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-700">Arsip Surat</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
