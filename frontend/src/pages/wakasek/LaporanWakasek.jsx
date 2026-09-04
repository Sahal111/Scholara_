import { Link } from "react-router-dom";

const LAPORAN_ITEMS = [
  {
    to: "/wakasek/absensi",
    icon: "checklist",
    label: "Rekap Absensi",
    desc: "Monitoring kehadiran siswa semua kelas per periode",
    color: "indigo",
  },
  {
    to: "/wakasek/guru",
    icon: "supervisor_account",
    label: "Data Guru",
    desc: "Daftar guru & tenaga pendidik beserta statusnya",
    color: "violet",
  },
  {
    to: "/wakasek/siswa",
    icon: "groups",
    label: "Data Siswa",
    desc: "Daftar siswa aktif per kelas & program pendidikan",
    color: "purple",
  },
  {
    icon: "grading",
    label: "Rekap Nilai",
    desc: "Rekap nilai semua kelas per semester",
    color: "fuchsia",
    soon: true,
  },
  {
    icon: "description",
    label: "Laporan Rapor",
    desc: "Status distribusi & finalisasi rapor",
    color: "pink",
    soon: true,
  },
  {
    icon: "trending_up",
    label: "Laporan Kenaikan Kelas",
    desc: "Data siswa naik kelas, tinggal kelas, dan lulus",
    color: "rose",
    soon: true,
  },
];

const COLOR_MAP = {
  indigo:
    "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300",
  violet:
    "bg-violet-50 text-violet-600 border-violet-100 hover:border-violet-300",
  purple:
    "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300",
  fuchsia: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
  pink: "bg-pink-50 text-pink-600 border-pink-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};

function LaporanCard({ item }) {
  const colorClass = COLOR_MAP[item.color] ?? COLOR_MAP.indigo;

  if (item.soon) {
    return (
      <div
        className={`relative rounded-2xl border p-5 opacity-50 cursor-not-allowed select-none ${colorClass}`}
      >
        <span className="absolute top-3 right-3 text-[9px] font-bold bg-white/60 px-1.5 py-0.5 rounded uppercase tracking-wide text-gray-400">
          Soon
        </span>
        <span className="material-symbols-outlined text-3xl mb-3 block opacity-50">
          {item.icon}
        </span>
        <p className="font-semibold text-sm text-gray-500">{item.label}</p>
        <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      className={`group relative rounded-2xl border p-5 bg-white transition-all duration-200 shadow-sm hover:shadow-md ${colorClass}`}
    >
      <span className="material-symbols-outlined text-3xl mb-3 block group-hover:scale-110 transition-transform duration-200">
        {item.icon}
      </span>
      <p className="font-semibold text-sm text-gray-800">{item.label}</p>
      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
      <span className="material-symbols-outlined absolute bottom-4 right-4 text-base opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        arrow_forward
      </span>
    </Link>
  );
}

export default function LaporanWakasek() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Akademik</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Pantau dan ekspor data akademik sekolah
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAPORAN_ITEMS.map((item) => (
          <LaporanCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
