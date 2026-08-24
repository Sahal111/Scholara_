const CHECKLIST_ITEMS = [
  {
    key: "ta_dibuat",
    label: "Tahun Ajaran Dibuat",
    desc: "Tahun ajaran terdaftar pada sistem",
    icon: "calendar_today",
  },
  {
    key: "semester_dibuat",
    label: "Semester Lengkap",
    desc: "Tersedia Semester Ganjil dan Semester Genap",
    icon: "calendar_view_month",
  },
  {
    key: "rombel_dibuat",
    label: "Rombongan Belajar",
    desc: "Struktur kelas telah dibentuk",
    icon: "account_tree",
  },
  {
    key: "guru_mengajar",
    label: "Penugasan Guru",
    desc: "Guru pengajar terdistribusi pada mata pelajaran",
    icon: "person_celebrate",
  },
  {
    key: "mapel_lengkap",
    label: "Mata Pelajaran",
    desc: "Kurikulum mata pelajaran aktif",
    icon: "menu_book",
  },
  {
    key: "wali_kelas",
    label: "Wali Kelas Terisi",
    desc: "Setiap rombel telah memiliki wali kelas",
    icon: "supervisor_account",
  },
  {
    key: "jadwal_selesai",
    label: "Jadwal Pelajaran",
    desc: "Entri jadwal pelajaran semester aktif telah siap",
    icon: "schedule",
  },
  {
    key: "kalender",
    label: "Kalender Akademik",
    desc: "Agenda dan libur nasional terkonfigurasi",
    icon: "event",
  },
  {
    key: "siswa_terdistribusi",
    label: "Distribusi Siswa",
    desc: "Siswa aktif telah masuk ke dalam kelas",
    icon: "group",
  },
  {
    key: "kepsek_dikunci",
    label: "Otoritas Kepala Sekolah",
    desc: "Tanda tangan rapor & ijazah sudah terkonfigurasi",
    icon: "verified",
  },
];

export default function ModalChecklistKesiapan({ open, onClose, checklist }) {
  if (!open) return null;

  const doneCount = CHECKLIST_ITEMS.filter((i) => checklist?.[i.key]).length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white/60 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#bfc9c4]/30 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a]">
              <span className="material-symbols-outlined text-[22px]">
                checklist
              </span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#00342b] font-headline-card">
                Kesiapan Tahun Ajaran
              </h3>
              <p className="text-xs text-[#3f4945]/70">
                Audit kelengkapan parameter operasional akademik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f4f3] text-[#3f4945] hover:bg-[#e6e9e8] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Progress */}
        <div className="bg-[#f8faf9] rounded-2xl p-5 border border-[#bfc9c4]/30 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#3f4945] uppercase tracking-widest">
              Total Kelengkapan
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#006e2a] font-headline-card">
                {pct}%
              </span>
              <span className="text-xs text-[#3f4945]/60 font-medium">
                ({doneCount}/{CHECKLIST_ITEMS.length} selesai)
              </span>
            </div>
          </div>
          <div className="w-full bg-[#e6e9e8] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#006e2a] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(0,110,42,0.4)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => {
            const isDone = !!checklist?.[item.key];
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isDone
                    ? "bg-white border-[#006e2a]/20 shadow-sm"
                    : "bg-[#f8faf9] border-[#bfc9c4]/30 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-[#006e2a]/10 text-[#006e2a]" : "bg-gray-100 text-gray-400"}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#00342b] truncate">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-[#3f4945]/70 truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${isDone ? "bg-[#006e2a]/10 text-[#006e2a] border border-[#006e2a]/20" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isDone ? "bg-[#006e2a]" : "bg-amber-500 animate-pulse"}`}
                  />
                  {isDone ? "Terpenuhi" : "Belum"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-[#bfc9c4]/20">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#00342b] text-white text-xs font-bold hover:bg-[#004d40] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
