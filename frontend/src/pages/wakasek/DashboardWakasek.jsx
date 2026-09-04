import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

/* ── Kartu shortcut cepat ─────────────────────────────────── */
function QuickCard({ to, icon, label, desc, available = true }) {
  if (!available) {
    return (
      <div className="relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm opacity-50 cursor-not-allowed select-none">
        <span className="absolute top-3 right-3 text-[9px] font-bold bg-indigo-50 text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-wide">
          Soon
        </span>
        <span className="material-symbols-outlined text-indigo-200 text-3xl mb-3 block">
          {icon}
        </span>
        <p className="font-semibold text-gray-400 text-sm">{label}</p>
        <p className="text-xs text-gray-300 mt-1">{desc}</p>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
    >
      <span className="material-symbols-outlined text-indigo-500 text-3xl mb-3 block group-hover:scale-110 transition-transform duration-200">
        {icon}
      </span>
      <p className="font-semibold text-gray-800 text-sm">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </Link>
  );
}

/* ── Info banner scope role ───────────────────────────────── */
function ScopeBanner() {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start">
      <span className="material-symbols-outlined text-indigo-400 text-2xl shrink-0 mt-0.5">
        info
      </span>
      <div>
        <p className="text-sm font-semibold text-indigo-800">
          Ruang Lingkup Wakasek Kurikulum
        </p>
        <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
          Kamu bertanggung jawab atas kebijakan akademik sekolah — kurikulum,
          tahun ajaran, program pendidikan, mata pelajaran, struktur kelas,
          jadwal, dan finalisasi rapor. Data administrasi (input guru/siswa,
          import/export) dikelola oleh Operator.
        </p>
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────── */
export default function DashboardWakasek() {
  const { user } = useAuth();
  const firstName = user?.nama_lengkap?.split(" ")[0] ?? "Wakasek";

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      {/* Header */}
      <div
        className="px-6 md:px-10 pt-10 pb-16"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
        }}
      >
        <p className="text-indigo-300 text-sm font-medium mb-1">
          Selamat datang kembali 👋
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {firstName}
        </h1>
        <p className="text-indigo-200/70 text-sm mt-1">
          Wakil Kepala Sekolah Bidang Kurikulum
        </p>
      </div>

      {/* Content — overlap header */}
      <div className="-mt-8 px-4 md:px-8 pb-10 space-y-6">
        {/* Scope banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-5 flex gap-4 items-start">
          <span className="material-symbols-outlined text-indigo-400 text-xl shrink-0 mt-0.5">
            policy
          </span>
          <div>
            <p className="text-sm font-semibold text-indigo-800">
              Tanggung jawab kamu
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Kebijakan akademik — kurikulum, tahun ajaran, program pendidikan,
              mata pelajaran, kelas, jadwal, dan finalisasi rapor. Data teknis
              (guru, siswa, import/export) dikelola Operator.
            </p>
          </div>
        </div>

        {/* Akses cepat — kebijakan akademik */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Kebijakan Akademik
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <QuickCard
              to="/wakasek/tahun-ajaran"
              icon="calendar_today"
              label="Tahun Ajaran"
              desc="Atur tahun ajaran & semester aktif"
            />
            <QuickCard
              to="/wakasek/kurikulum"
              icon="school"
              label="Kurikulum"
              desc="Kelola kurikulum sekolah"
            />
            <QuickCard
              to="/wakasek/program-pendidikan"
              icon="account_tree"
              label="Program Pendidikan"
              desc="Jurusan & konsentrasi"
              available={false}
            />
            <QuickCard
              to="/wakasek/mapel"
              icon="menu_book"
              label="Mata Pelajaran"
              desc="Daftar mapel & beban JP"
              available={false}
            />
          </div>
        </div>

        {/* Akses cepat — operasional */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Operasional Kelas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <QuickCard
              to="/wakasek/kelas"
              icon="meeting_room"
              label="Kelas & Rombel"
              desc="Buat dan atur rombongan belajar"
              available={false}
            />
            <QuickCard
              to="/wakasek/jadwal"
              icon="event_note"
              label="Jadwal Pelajaran"
              desc="Susun jadwal per kelas"
              available={false}
            />
            <QuickCard
              to="/wakasek/kalender"
              icon="calendar_month"
              label="Kalender Akademik"
              desc="Hari efektif & libur sekolah"
              available={false}
            />
            <QuickCard
              to="/wakasek/rapor"
              icon="description"
              label="Finalisasi Rapor"
              desc="Lock & distribusi rapor"
              available={false}
            />
          </div>
        </div>

        {/* Akses cepat — pengawasan */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Pengawasan
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <QuickCard
              to="/wakasek/absensi"
              icon="checklist"
              label="Rekap Absensi"
              desc="Pantau kehadiran semua kelas"
            />
            <QuickCard
              to="/wakasek/nilai"
              icon="grading"
              label="Rekap Nilai"
              desc="Nilai semua siswa & kelas"
              available={false}
            />
            <QuickCard
              to="/wakasek/guru"
              icon="supervisor_account"
              label="Data Guru"
              desc="Lihat & verifikasi data guru"
            />
            <QuickCard
              to="/wakasek/laporan"
              icon="assessment"
              label="Laporan"
              desc="Laporan akademik & absensi"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
