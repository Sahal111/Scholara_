/**
 * AppFooter — shared footer untuk semua role (kecuali Operator & Wakasek yg punya custom).
 *
 * Props:
 *  roleLabel — string: nama role untuk label bantuan (e.g. "Guru", "Kepala Sekolah")
 */
export default function AppFooter({ roleLabel = "Pengguna" }) {
  return (
    <footer className="px-6 lg:px-8 py-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 text-xs text-slate-500 flex flex-col lg:flex-row items-center justify-between gap-4 mt-auto shrink-0">
      {/* Left */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-center sm:text-left">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 14l9-5-9-5-9 5 9 5z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <span className="font-extrabold text-slate-800 tracking-tight">
            Scholara SIMS
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded border border-slate-200/70">
            v1.0.0
          </span>
        </div>
        <span className="text-slate-300 hidden sm:inline">•</span>
        <span className="text-slate-500 text-[11px]">© 2025 Scholara.</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Kemendikbudristek RI
        </span>
      </div>

      {/* Center links */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-medium text-slate-500">
        <a
          className="hover:text-blue-600 transition-colors flex items-center gap-1"
          href="#"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          Bantuan {roleLabel}
        </a>
        <span className="text-slate-300">•</span>
        <a
          className="hover:text-blue-600 transition-colors flex items-center gap-1"
          href="#"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          Panduan Teknis
        </a>
        <span className="text-slate-300">•</span>
        <a className="hover:text-blue-600 transition-colors" href="#">
          Kebijakan Privasi
        </a>
      </div>

      {/* Right: Server status */}
      <div className="flex items-center shrink-0">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 text-[11px] font-semibold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Server Operasional</span>
        </div>
      </div>
    </footer>
  );
}
