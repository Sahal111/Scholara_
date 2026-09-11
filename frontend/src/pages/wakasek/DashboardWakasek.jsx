import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

const PILLAR_DATA = [
  {
    label: "Pembelajaran",
    icon: "auto_stories",
    value: "94.0%",
    width: "94%",
    badge: "Sangat Baik",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-100/70 text-blue-600 border-blue-200/60",
    barColor: "bg-blue-500",
    hoverBg: "hover:bg-blue-50/30 hover:border-blue-200",
    sub: "38 dari 42 sesi selesai",
  },
  {
    label: "Kehadiran Siswa",
    icon: "fact_check",
    value: "98.2%",
    width: "98.2%",
    badge: "Optimal",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-100/70 text-emerald-600 border-emerald-200/60",
    barColor: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-50/30 hover:border-emerald-200",
    sub: "1.226 dari 1.248 hadir",
  },
  {
    label: "Penilaian",
    icon: "edit_note",
    value: "86.0%",
    width: "86%",
    badge: "Perlu Perhatian",
    badgeColor: "text-amber-800 bg-amber-100/80 border-amber-200",
    dotColor: "bg-amber-400",
    iconBg: "bg-amber-100/70 text-amber-700 border-amber-200/60",
    barColor: "bg-amber-400",
    hoverBg: "hover:bg-amber-50/30 hover:border-amber-200",
    sub: "12 kelas butuh input",
    subColor: "text-amber-700",
  },
  {
    label: "Beban Mengajar",
    icon: "balance",
    value: "91.0%",
    width: "91%",
    badge: "Sesuai SK",
    badgeColor: "text-purple-700 bg-purple-100/70 border-purple-200",
    dotColor: "bg-purple-500",
    iconBg: "bg-purple-100/70 text-purple-700 border-purple-200/60",
    barColor: "bg-purple-500",
    hoverBg: "hover:bg-purple-50/30 hover:border-purple-200",
    sub: "72 dari 84 guru optimal",
  },
];

const ALERTS = [
  {
    count: 12,
    title: "Guru belum isi jurnal",
    desc: "Rekap pertemuan ke-8 belum tervalidasi di sistem.",
    badge: "Tindak Lanjut",
    colors: "border-rose-200/80 from-rose-50/60",
    countBg: "bg-rose-100 text-rose-600 border-rose-200",
    badgeCls: "bg-rose-100 text-rose-700",
    btnCls: "border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white",
    icon: "send",
    btnLabel: "Kirim Notifikasi WA",
  },
  {
    count: 8,
    title: "Kelas belum input nilai STS",
    desc: "Asesmen Sumatif Matematika & Fisika tertunda.",
    badge: "Penting",
    colors: "border-amber-200/80 from-amber-50/50",
    countBg: "bg-amber-100 text-amber-700 border-amber-200",
    badgeCls: "bg-amber-100 text-amber-800",
    btnCls: "border-amber-200 text-amber-800 hover:bg-amber-500 hover:text-white",
    icon: "description",
    btnLabel: "Buka Form Validasi",
  },
  {
    count: 4,
    title: "Sesi belum dikonfirmasi",
    desc: "Tugas mandiri guru dinas luar di rombel X-IPS 2.",
    badge: "Validasi",
    colors: "border-blue-200/80 from-blue-50/50",
    countBg: "bg-blue-100 text-blue-600 border-blue-200",
    badgeCls: "bg-blue-100 text-blue-700",
    btnCls: "border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white",
    icon: "how_to_reg",
    btnLabel: "Disposisi Guru Piket",
  },
  {
    count: 2,
    title: "Benturan jadwal lab komputer",
    desc: "Lab Terpadu terpakai bersamaan di sesi 5-6.",
    badge: "Konflik",
    colors: "border-purple-200/80 from-purple-50/50",
    countBg: "bg-purple-100 text-purple-700 border-purple-200",
    badgeCls: "bg-purple-100 text-purple-700",
    btnCls: "border-purple-200 text-purple-700 hover:bg-purple-500 hover:text-white",
    icon: "schedule",
    btnLabel: "Sesuaikan Slot Ruang",
  },
];

const AGENDA = [
  {
    date: "09 OKT",
    title: "Penilaian Tengah Semester (PTS)",
    desc: "Jadwal Asesmen Sumatif Tengah Semester ganjil sesi 1 & 2.",
    time: "07:30 - 12:00",
    meta: "Semua Kelas",
    dateBg: "bg-blue-500 text-white",
    borderColor: "border-blue-300/50",
    bg: "bg-blue-50/30",
    tag: "Hari Ini",
    tagCls: "text-blue-600 bg-blue-100",
  },
  {
    date: "11 OKT",
    title: "Batas Validasi Nilai Asesmen",
    desc: "Sinkronisasi data e-Rapor nilai harian & remedial tahap I ke pusat.",
    time: "23:59 WIB",
    meta: "Batas Akhir",
    metaColor: "text-amber-700 font-semibold",
    dateBg: "bg-amber-500 text-white",
    borderColor: "border-amber-200",
    bg: "bg-amber-50/30",
    tag: "Penting",
    tagCls: "text-amber-800 bg-amber-100",
  },
  {
    date: "15 OKT",
    title: "Rapat Tim Kurikulum & MGMP",
    desc: "Evaluasi ketercapaian Alur Tujuan Pembelajaran (ATP) tengah semester.",
    time: "14:00 - 15:30",
    meta: "R. Multimedia",
    dateBg: "bg-slate-200 text-slate-600 border border-slate-300",
    borderColor: "border-slate-200",
    bg: "bg-slate-50/30",
    tag: "Monev",
    tagCls: "text-slate-500 bg-slate-100",
  },
  {
    date: "18 OKT",
    title: "Evaluasi Pembelajaran & PKG",
    desc: "Supervisi klinis kinerja guru dan tindak lanjut rekomendasi pengawas.",
    time: "13:00 WIB",
    meta: "Wakasek + Guru",
    dateBg: "bg-slate-200 text-slate-600 border border-slate-300",
    borderColor: "border-slate-200",
    bg: "bg-slate-50/30",
    tag: "Pleno",
    tagCls: "text-slate-500 bg-slate-100",
  },
];

const QUICK_ACTIONS = [
  { icon: "calendar_month", label: "Buat Agenda Akademik", to: "/wakasek/kalender", primary: true },
  { icon: "balance", label: "Review Beban Mengajar", to: "/wakasek/guru" },
  { icon: "event_available", label: "Validasi Jadwal & Ruang", to: "/wakasek/kelas" },
  { icon: "task", label: "Monitor Penilaian e-Rapor", to: "/wakasek/nilai", disabled: true },
  { icon: "assessment", label: "Lihat Laporan Akademik", to: "/wakasek/laporan" },
];

function Icon({ name, className = "text-xl" }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function PillarCard({ d }) {
  return (
    <div className={`p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 ${d.hoverBg} flex flex-col justify-between transition-all duration-200 group shadow-sm hover:shadow`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${d.dotColor}`} /> {d.label}
          </span>
          <div className={`w-7 h-7 rounded-lg ${d.iconBg} flex items-center justify-center border transition-transform group-hover:scale-110`}>
            <Icon name={d.icon} className="text-[14px]" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-1">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{d.value}</span>
          <span className={`text-[10px] font-bold ${d.badgeColor} px-2 py-0.5 rounded-md border`}>{d.badge}</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/40">
          <div className={`${d.barColor} h-full rounded-full transition-all duration-500`} style={{ width: d.width }} />
        </div>
      </div>
      <span className={`text-[10px] ${d.subColor || "text-slate-400"} mt-2 font-medium`}>{d.sub}</span>
    </div>
  );
}

function AlertCard({ a }) {
  return (
    <div className={`p-3.5 rounded-xl border ${a.colors} bg-gradient-to-r to-white hover:shadow-sm transition-all flex items-start gap-3 group`}>
      <div className={`w-8 h-8 rounded-xl ${a.countBg} font-extrabold text-xs flex items-center justify-center shrink-0 border shadow-sm`}>
        {a.count}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-xs font-semibold text-slate-800 truncate">{a.title}</p>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.badgeCls} uppercase tracking-wide shrink-0`}>{a.badge}</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{a.desc}</p>
        <div className="mt-2">
          <button className={`px-2.5 py-1 rounded-lg bg-white border ${a.btnCls} text-[11px] font-semibold transition-all shadow-sm inline-flex items-center gap-1.5`}>
            <Icon name={a.icon} className="text-[13px]" />
            {a.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgendaCard({ a }) {
  return (
    <div className={`p-3.5 rounded-xl border ${a.borderColor} ${a.bg} flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-md ${a.dateBg} text-[11px] font-bold`}>{a.date}</span>
          <span className={`text-[10px] font-bold ${a.tagCls} px-1.5 py-0.5 rounded`}>{a.tag}</span>
        </div>
        <h4 className="text-xs font-bold text-slate-800">{a.title}</h4>
        <p className="text-[11px] text-slate-500 mt-1">{a.desc}</p>
      </div>
      <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Icon name="schedule" className="text-[13px]" /> {a.time}
        </span>
        <span className={`font-semibold ${a.metaColor || "text-slate-500"}`}>{a.meta}</span>
      </div>
    </div>
  );
}

export default function DashboardWakasek() {
  const { user, school } = useAuth();
  const firstName = user?.nama_lengkap?.split(" ")[0] ?? "Wakasek";

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5 max-w-[1600px] w-full mx-auto">

      {/* ── PAGE HEADER ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <Icon name="grid_view" className="text-[14px]" />
                Portal Pimpinan Kurikulum
              </span>
              <span>/</span>
              <span className="text-slate-500">{school?.nama || "Scholara SIMS"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-[22px] font-extrabold text-slate-900 tracking-tight">
                Selamat datang, {firstName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <Icon name="terminal" className="text-[14px]" /> Academic Command Center
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Pantau kesehatan akademik, pelaksanaan pembelajaran harian, dan capaian target kurikulum sekolah secara terpusat dan real-time.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-500">
                <Icon name="calendar_today" className="text-[14px] text-blue-500" />
                Semester Ganjil 2024/2025
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Data diperbarui: Baru saja
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-500">
                <Icon name="groups" className="text-[14px] text-purple-500" />
                64 Rombel Aktif
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
              <Icon name="download" className="text-[16px]" />
              Unduh Laporan
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all">
              <Icon name="refresh" className="text-[16px]" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: ACADEMIC HEALTH OVERVIEW ── */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-emerald-50/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
          <div className="flex items-center gap-5 xl:pr-8 xl:border-r border-slate-200/80 flex-shrink-0">
            <div className="relative flex items-center justify-center shrink-0 p-2 rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-100 border border-blue-100 shadow-sm">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" stroke="#E2E8F0" strokeWidth="5.5" fill="none" />
                <circle cx="40" cy="40" r="34" stroke="#2563EB" strokeWidth="6" strokeDasharray="213.6" strokeDashoffset="16.2" strokeLinecap="round" fill="none" className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
                <span className="text-[22px] font-extrabold text-slate-900 tracking-tight">92.4</span>
                <span className="text-[8px] font-bold text-blue-600 tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100/80 mt-1 border border-blue-200/60">Indeks</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Kesehatan Akademik</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Baik · Melampaui Target
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">Konsolidasi 4 pilar mutu KBM harian & kepatuhan regulasi kalender akademik.</p>
              <div className="flex items-center gap-2 pt-0.5 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                  Target Rapor Pendidikan: <strong className="font-bold text-slate-700 ml-1">≥ 90.0</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                  (+2.4% di atas standar)
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1 min-w-0">
            {PILLAR_DATA.map((d) => <PillarCard key={d.label} d={d} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 2 & 3: ACADEMIC PULSE + PRIORITY ATTENTION ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Academic Pulse */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-50/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                  </span>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">Academic Pulse</h2>
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <Icon name="monitor_heart" className="text-[13px]" /> Live Sensor
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Performa dan dinamika fluktuasi operasional KBM dalam 7 hari terakhir.</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto">
                <button className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-blue-600 shadow-sm">7 Hari</button>
                <button className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">Pekan Ini</button>
                <button className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">Bulan Ini</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div className="p-3.5 rounded-xl bg-blue-50/30 border border-blue-100/70 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Pembelajaran
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                    <Icon name="auto_stories" className="text-[14px]" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">94.8%</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">↑ +1.2%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Rata-rata 38 dari 42 sesi</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/30 border border-emerald-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Kehadiran Siswa
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
                    <Icon name="how_to_reg" className="text-[14px]" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">98.2%</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Puncak Mingguan</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">1.226 dari 1.248 hadir</span>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/30 border border-purple-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Progres Penilaian
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center">
                    <Icon name="checklist" className="text-[14px]" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">86.0%</span>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Cut-off H-3</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">112 mapel tuntas diinput</span>
              </div>
            </div>
            <div className="relative w-full h-48 sm:h-56 mt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pulsePrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                    <stop offset="90%" stopColor="#2563EB" stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="pulseSuccessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.16" />
                    <stop offset="90%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="45" y1="25" x2="675" y2="25" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="45" y1="70" x2="675" y2="70" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="45" y1="115" x2="675" y2="115" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="45" y1="160" x2="675" y2="160" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                <text x="36" y="29" fontSize="10" fill="#94A3B8" textAnchor="end" fontFamily="Inter" fontWeight="500">100%</text>
                <text x="36" y="74" fontSize="10" fill="#94A3B8" textAnchor="end" fontFamily="Inter" fontWeight="500">95%</text>
                <text x="36" y="119" fontSize="10" fill="#94A3B8" textAnchor="end" fontFamily="Inter" fontWeight="500">90%</text>
                <text x="36" y="164" fontSize="10" fill="#94A3B8" textAnchor="end" fontFamily="Inter" fontWeight="500">85%</text>
                <path d="M 65,96 C 145,86 185,68 265,58 C 345,50 425,46 505,48 C 585,50 635,62 665,65 L 665,185 L 65,185 Z" fill="url(#pulsePrimaryGrad)" />
                <path d="M 65,48 C 145,40 185,34 265,30 C 345,34 425,36 505,37 C 585,40 635,44 665,46 L 665,185 L 65,185 Z" fill="url(#pulseSuccessGrad)" />
                <line x1="265" y1="15" x2="265" y2="180" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                <path d="M 65,152 C 145,142 185,134 265,128 C 345,118 425,110 505,106 C 585,104 635,102 665,100" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
                {[[265,128],[505,106],[665,100]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="3.5" fill="#8B5CF6" stroke="#FFF" strokeWidth="1.5" />)}
                <path d="M 65,48 C 145,40 185,34 265,30 C 345,34 425,36 505,37 C 585,40 635,44 665,46" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                {[[65,48],[165,39],[365,35],[465,36],[565,41],[665,46]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="3.5" fill="#FFF" stroke="#10B981" strokeWidth="2" />)}
                <circle cx="265" cy="30" r="4.5" fill="#10B981" stroke="#FFF" strokeWidth="2.5" />
                <path d="M 65,96 C 145,86 185,68 265,58 C 345,50 425,46 505,48 C 585,50 635,62 665,65" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                {[[65,96],[165,78],[365,52],[465,47],[565,54],[665,65]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="3.5" fill="#FFF" stroke="#2563EB" strokeWidth="2" />)}
                <circle cx="265" cy="58" r="6" fill="#2563EB" stroke="#FFF" strokeWidth="2.5" />
              </svg>
              <div className="absolute left-[37.8%] top-1 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/60 text-xs pointer-events-none z-10 hidden sm:block">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="font-bold text-slate-100 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Rabu (Puncak KBM)
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Optimal</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="text-blue-400 font-semibold">KBM: <strong className="text-white font-bold">98.4%</strong></span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400 font-semibold">Hadir: <strong className="text-white font-bold">99.1%</strong></span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-slate-400 mt-2 px-2 sm:px-8 font-medium">
              {["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"].map(d => (
                <span key={d} className={d === "Rabu" ? "font-bold text-blue-600 bg-blue-50/70 py-0.5 rounded-md" : ""}>{d}</span>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Tersinkronisasi otomatis via presensi mobile & e-Jurnal pendidik.
            </span>
            <button className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto">
              Audit Matriks Lengkap <Icon name="chevron_right" className="text-[14px]" />
            </button>
          </div>
        </div>

        {/* Priority Attention */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-rose-50/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100/70 text-rose-500 flex items-center justify-center">
                    <Icon name="warning" className="text-[14px]" />
                  </div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">Perlu Perhatian</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Hal yang membutuhkan keputusan & disposisi hari ini.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-500 border border-rose-200 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                4 Isu Kritis
              </span>
            </div>
            <div className="space-y-3 mt-4">
              {ALERTS.map((a) => <AlertCard key={a.title} a={a} />)}
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-200/60">
            <button className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200/80 shadow-sm">
              Buka Seluruh Antrean Isu Akademik
              <Icon name="north_east" className="text-[14px]" />
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: ACADEMIC SNAPSHOT (3 Panels) ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Presensi Siswa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-50/70 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Real-time Presensi
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/40">Hari Ini</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Presensi Siswa</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Monitoring kehadiran harian seluruh rombel</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shadow-sm shrink-0">
                <Icon name="how_to_reg" className="text-xl" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">98.2%</span>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> +1.8% vs kemarin
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {[
                { label: "Hadir", value: "1.226", pct: "98.2%", dot: "bg-emerald-500", pctCls: "text-emerald-700 bg-emerald-100/70" },
                { label: "Izin/Sakit", value: "14", pct: "1.1%", dot: "bg-amber-400", pctCls: "text-amber-800 bg-amber-100/70", valueColor: "text-amber-700" },
                { label: "Alfa", value: "8", pct: "0.7%", dot: "bg-rose-500", pctCls: "text-rose-700 bg-rose-100/70", valueColor: "text-rose-500" },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-500 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
                  </div>
                  <span className={`text-sm font-extrabold ${s.valueColor || "text-slate-800"} block leading-tight`}>{s.value}</span>
                  <span className={`text-[9px] font-semibold ${s.pctCls} px-1.5 py-0.5 rounded-full inline-block mt-1`}>{s.pct}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 shadow-inner border border-slate-200/40">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "98.2%" }} />
                <div className="bg-amber-400 h-full rounded-full" style={{ width: "1.1%" }} />
                <div className="bg-rose-500 h-full rounded-full" style={{ width: "0.7%" }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Toleransi Alfa: &lt; 2.0%</span>
                <span className="font-semibold text-slate-600">Total: 1.248 Siswa (64 Rombel)</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/70 shadow-sm">
              <Icon name="check_circle" className="text-[13px]" /> 98% Kelas Tervalidasi
            </span>
            <Link to="/wakasek/absensi" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
              Lihat Detail <span>→</span>
            </Link>
          </div>
        </div>

        {/* Pelaksanaan Pembelajaran */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Monitoring Sesi KBM
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">42 Sesi</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-1.5 tracking-tight">Pelaksanaan Pembelajaran</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
                <Icon name="schedule" className="text-xl" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">42 Sesi</span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Sesi Aktif
                </span>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs shadow-sm">
                <span className="flex items-center gap-2 text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Terlaksana
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">38 sesi</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">90.5%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/40 border border-blue-100/70 text-xs shadow-sm">
                <span className="flex items-center gap-2 text-blue-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" /> Berlangsung
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600">4 sesi</span>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md font-semibold border border-blue-200/70">9.5%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/40 border border-amber-100/70 text-xs shadow-sm">
                <span className="flex items-center gap-2 text-amber-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Perlu Konfirmasi
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/60">2 sesi</span>
              </div>
            </div>
            <div className="mt-3.5">
              <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 shadow-inner border border-slate-200/40">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "90.5%" }} />
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "9.5%" }} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/70">
              <Icon name="verified_user" className="text-[13px]" /> 0 Jam Kosong Terlantar
            </span>
            <button className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
              Audit Sesi <span>→</span>
            </button>
          </div>
        </div>

        {/* Progres Penilaian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-50/50 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-700 animate-pulse" /> e-Rapor Ganjil
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Mid Semester</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-1.5 tracking-tight">Progres Penilaian</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/70 text-purple-700 flex items-center justify-center shadow-sm shrink-0">
                <Icon name="task" className="text-xl" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">86.0%</span>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> 132 / 144 Kelas
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">Cut-off H-3</span>
            </div>
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-4 shadow-sm">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 68 68">
                  <circle cx="34" cy="34" r="28" stroke="#E2E8F0" strokeWidth="6" fill="none" />
                  <circle cx="34" cy="34" r="28" stroke="#8B5CF6" strokeWidth="6" strokeDasharray="175.9" strokeDashoffset="24.6" strokeLinecap="round" fill="none" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">86%</span>
                  <span className="text-[8px] font-semibold text-purple-700 uppercase tracking-wider mt-0.5">Input</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                {[
                  { label: "Tuntas", value: "112 Kelas", dot: "bg-purple-500", pct: "78%", pctCls: "text-purple-700 bg-purple-50 border-purple-100" },
                  { label: "Dalam Proses", value: "20 Kelas", dot: "bg-blue-500", pct: "14%", pctCls: "text-blue-700 bg-blue-50 border-blue-100" },
                  { label: "Perlu Input", value: "12 Kelas", dot: "bg-amber-400 animate-pulse", pct: "8%", pctCls: "text-amber-800 bg-amber-100 border-amber-200", labelColor: "text-amber-800", valueColor: "text-amber-700" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between text-xs">
                    <span className={`${m.labelColor || "text-slate-500"} flex items-center gap-1.5 font-medium`}>
                      <span className={`w-2 h-2 rounded-full ${m.dot}`} /> {m.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${m.valueColor || "text-slate-700"}`}>{m.value}</span>
                      <span className={`text-[10px] font-semibold ${m.pctCls} px-1.5 py-0.5 rounded border`}>{m.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3.5">
              <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 shadow-inner border border-slate-200/40">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: "78%" }} />
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "14%" }} />
                <div className="bg-amber-400 h-full rounded-full" style={{ width: "8%" }} />
              </div>
            </div>
            <div className="mt-3.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-50/70 to-white border border-amber-200/80 flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60">
                  <Icon name="error" className="text-[13px]" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-semibold text-amber-800 leading-tight">Batas Cut-Off: <span className="font-extrabold">H-3 (11 Okt)</span></p>
                  <p className="text-[10px] text-slate-400 leading-tight">Sisa 3 hari kerja sebelum sinkronisasi</p>
                </div>
              </div>
              <button className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[10px] font-bold text-amber-800 hover:bg-amber-500 hover:text-white transition-all shadow-sm shrink-0">
                Segera Input
              </button>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-medium inline-flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/70">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 12 kelas butuh verifikasi
            </span>
            <button className="text-purple-700 font-semibold hover:underline inline-flex items-center gap-1">
              Buka e-Rapor <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: AGENDA AKADEMIK ── */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/50">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="event" className="text-lg text-blue-500" />
              <h2 className="text-base font-bold text-slate-800">Agenda Akademik Terdekat</h2>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">Kalender Pimpinan</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Linimasa jadwal asesmen, koordinasi supervisi klinis, dan batas cut-off kurikulum.</p>
          </div>
          <Link to="/wakasek/kalender" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 self-start sm:self-auto">
            Buka Kalender Lengkap <Icon name="arrow_forward" className="text-[13px]" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {AGENDA.map((a) => <AgendaCard key={a.date} a={a} />)}
        </div>
      </section>

      {/* ── SECTION 6: QUICK ACTIONS + INSIGHTS ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Quick Actions */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50">
              <Icon name="bolt" className="text-lg text-blue-500" />
              <h2 className="text-base font-bold text-slate-800">Aksi Cepat</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Pintasan tugas pimpinan kurikulum dan tata kelola pembelajaran.</p>
            <div className="space-y-2 mt-4">
              {QUICK_ACTIONS.map(q => q.primary ? (
                <Link key={q.label} to={q.to} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                  <span className="flex items-center gap-2">
                    <Icon name={q.icon} className="text-[16px]" /> {q.label}
                  </span>
                  <Icon name="add" className="text-[14px]" />
                </Link>
              ) : q.disabled ? (
                <div key={q.label} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-300 cursor-not-allowed">
                  <span className="flex items-center gap-2">
                    <Icon name={q.icon} className="text-[16px]" /> {q.label}
                  </span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Soon</span>
                </div>
              ) : (
                <Link key={q.label} to={q.to} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 transition-colors">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Icon name={q.icon} className="text-[16px] text-blue-500" /> {q.label}
                  </span>
                  <Icon name="chevron_right" className="text-[14px] text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/50 text-center">
            <span className="text-[10px] text-slate-400">Wakil Kepala Sekolah Bidang Kurikulum</span>
          </div>
        </div>

        {/* Executive Insights */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
              <div className="flex items-center gap-2">
                <Icon name="auto_awesome" className="text-lg text-blue-500" />
                <h2 className="text-base font-bold text-slate-800">Insight Akademik</h2>
              </div>
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Kompilasi Scholara AI</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Ringkasan intelijen operasional untuk dasar pengambilan keputusan pimpinan kurikulum.</p>
            <div className="space-y-3 mt-4">
              {[
                {
                  icon: "trending_up", iconBg: "bg-emerald-100 text-emerald-600",
                  title: "Kehadiran Siswa Terus Meningkat",
                  text: <>Kehadiran siswa meningkat <strong className="text-emerald-600 font-semibold">1.8% dibanding minggu lalu</strong> (kini mencapai 98.2%). Didorong oleh efektivitas program bimbingan wali kelas dan presensi digital real-time.</>,
                },
                {
                  icon: "check", iconBg: "bg-blue-100 text-blue-600",
                  title: "Kedisiplinan Jurnal Guru Menguat",
                  text: <><strong className="text-blue-600 font-semibold">92% guru telah mengisi jurnal pembelajaran</strong> tepat waktu pada hari pelaksanaan. Ketercapaian Alur Tujuan Pembelajaran (ATP) terjaga pada standar 94.8%.</>,
                },
                {
                  icon: "error_outline", iconBg: "bg-amber-100 text-amber-600",
                  title: "Intervensi Input Nilai Dibutuhkan Segera",
                  text: <><strong className="text-amber-600 font-semibold">12 kelas masih membutuhkan tindak lanjut penilaian</strong> sumatif tengah semester. Batas akhir cut-off e-Rapor tersisa 3 hari kerja sebelum sinkronisasi.</>,
                },
              ].map(insight => (
                <div key={insight.title} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-lg ${insight.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon name={insight.icon} className="text-[16px]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{insight.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
            <span>Saran Sistem: Kirim rekapitulasi evaluasi otomatis ke forum MGMP sekolah.</span>
            <button className="text-blue-600 font-semibold hover:underline">Ekspor Ringkasan Eksekutif →</button>
          </div>
        </div>
      </section>

    </div>
  );
}
