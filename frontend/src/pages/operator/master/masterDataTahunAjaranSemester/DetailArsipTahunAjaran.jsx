import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import { tahunAjaranKeys } from "../../../../hooks/api/useTahunAjaran";
import {
  fmt,
  daysBetween,
  calcProgress,
  weeksBetween,
} from "./utils/tahunAjaranHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const disp = (n) => (n > 0 ? n.toLocaleString("id-ID") : "—");

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonPage() {
  return (
    <div className="space-y-8 pb-12 animate-pulse">
      <div className="h-8 w-72 bg-[#e6e9e8] rounded-xl" />
      <div className="h-56 bg-[#e6e9e8] rounded-[2.5rem]" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-[#e6e9e8] rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-[#e6e9e8] rounded-[2.5rem]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[480px] bg-[#e6e9e8] rounded-[2.5rem]" />
        <div className="h-[480px] bg-[#e6e9e8] rounded-[2.5rem]" />
      </div>
    </div>
  );
}

// Badge arsip — selalu "ARSIP" di halaman ini
function ArsipBadge({ archivedAt }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6e9e8] border border-[#bfc9c4]/40 shadow-sm">
      <span
        className="material-symbols-outlined text-[14px] text-[#3f4945]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        inventory_2
      </span>
      <span className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest">
        Arsip
        {archivedAt ? ` · ${fmt(archivedAt)}` : ""}
      </span>
    </div>
  );
}

// Progress bar horizontal
function ProgressBar({ value, color = "#006e2a" }) {
  return (
    <div className="w-full bg-[#e1e3e2]/60 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

// Stat mini card (icon + angka + label)
function StatChip({ icon, value, label, color = "#006e2a" }) {
  return (
    <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color }}
        >
          {icon}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xl font-extrabold text-[#00342b] leading-none truncate">
          {value}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest mt-1"
          style={{ color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// Checklist item
function CheckItem({ label, ok }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-[#bfc9c4]/10 last:border-0">
      <span
        className="material-symbols-outlined text-[18px]"
        style={{
          color: ok ? "#006e2a" : "#bfc9c4",
          fontVariationSettings: "'FILL' 1",
        }}
      >
        {ok ? "check_circle" : "radio_button_unchecked"}
      </span>
      <span
        className={`text-sm font-medium ${ok ? "text-[#191c1c]" : "text-[#3f4945]/50"}`}
      >
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SemesterPanel — satu panel untuk satu semester (Ganjil / Genap)
// ─────────────────────────────────────────────────────────────────────────────

function SemesterPanel({ semester, payload, ta, accentColor = "#006e2a" }) {
  if (!semester) {
    return (
      <div className="bg-white/50 backdrop-blur-md border border-[#bfc9c4]/20 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <span className="material-symbols-outlined text-5xl text-[#bfc9c4]">
          event_busy
        </span>
        <p className="text-sm font-semibold text-[#3f4945]/60">
          Semester tidak tersedia
        </p>
      </div>
    );
  }

  const tglMulai = semester.tgl_mulai;
  const tglSelesai = semester.tgl_selesai;
  const progress = calcProgress(tglMulai, tglSelesai);
  const totalHari = daysBetween(tglMulai, tglSelesai);
  const totalMinggu = weeksBetween(tglMulai, tglSelesai);

  // Filter kelas yang sesuai semester ini
  const kelasList = payload.kelas ?? [];
  const kelasFilter = kelasList.filter(
    (k) =>
      k.semester?.toLowerCase() === semester.nama?.toLowerCase() ||
      !k.semester ||
      k.semester === "-",
  );
  const totalSiswa = kelasFilter.reduce((s, k) => s + (k.total_siswa ?? 0), 0);
  const totalKelas = kelasFilter.length;

  // Kalender semester ini
  const kalenderAll = payload.kalender ?? [];
  const kalender = kalenderAll.filter((k) => {
    if (!tglMulai || !k.tanggal_mulai) return true;
    const tgl = new Date(k.tanggal_mulai);
    const start = new Date(tglMulai);
    const end = tglSelesai ? new Date(tglSelesai) : null;
    return tgl >= start && (end == null || tgl <= end);
  });

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] overflow-hidden shadow-sm">
      {/* Header semester */}
      <div
        className="px-7 pt-7 pb-5 relative overflow-hidden"
        style={{ background: `${accentColor}08` }}
      >
        <div
          className="absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[80px] pointer-events-none"
          style={{ background: `${accentColor}20` }}
        />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1.5"
              style={{ color: accentColor }}
            >
              Semester
            </p>
            <h3 className="font-headline-card text-3xl font-extrabold text-[#00342b] tracking-tight">
              {semester.nama}
            </h3>
            <p className="text-sm text-[#3f4945]/60 font-medium mt-1">
              {fmt(tglMulai)} — {fmt(tglSelesai)}
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
            style={{
              background: `${accentColor}15`,
              borderColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            SELESAI
          </div>
        </div>
      </div>

      <div className="p-7 flex flex-col gap-6">
        {/* Progress selesai */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#3f4945]/60 uppercase tracking-wider">
              Progress Semester
            </span>
            <span
              className="text-sm font-extrabold"
              style={{ color: accentColor }}
            >
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} color={accentColor} />
          <div className="flex items-center justify-between mt-2 text-[10px] text-[#3f4945]/50 font-medium">
            <span>{totalHari ?? "—"} hari total</span>
            <span>{totalMinggu ?? "—"} minggu</span>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3">
          <StatChip
            icon="groups"
            value={disp(totalSiswa)}
            label="Siswa"
            color={accentColor}
          />
          <StatChip
            icon="meeting_room"
            value={disp(totalKelas)}
            label="Kelas"
            color={accentColor}
          />
          <StatChip
            icon="person_celebrate"
            value={disp(payload.total_guru ?? 0)}
            label="Guru"
            color={accentColor}
          />
          <StatChip
            icon="menu_book"
            value={disp(payload.total_mapel ?? 0)}
            label="Mapel"
            color={accentColor}
          />
        </div>

        {/* Daftar kelas ringkas */}
        {kelasFilter.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest mb-3">
              Daftar Kelas ({kelasFilter.length})
            </p>
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
              {kelasFilter.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#f2f4f3]/60 border border-[#bfc9c4]/15 hover:border-[#bfc9c4]/40 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ color: accentColor }}
                    >
                      class
                    </span>
                    <span className="text-sm font-semibold text-[#191c1c] truncate">
                      {k.nama_kelas}
                    </span>
                    {k.kurikulum && (
                      <span className="text-[9px] font-bold text-[#3f4945]/40 uppercase tracking-wider hidden sm:inline">
                        {k.kurikulum}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#3f4945]/60 shrink-0 ml-2">
                    {k.total_siswa ?? 0} siswa
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kalender semester */}
        {kalender.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest mb-3">
              Kalender Akademik ({kalender.length})
            </p>
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
              {kalender.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl bg-[#f2f4f3]/60 border border-[#bfc9c4]/15"
                >
                  <span
                    className="material-symbols-outlined text-[16px] mt-0.5 shrink-0"
                    style={{ color: accentColor }}
                  >
                    event_note
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#191c1c] truncate">
                      {ev.judul || ev.nama}
                    </p>
                    <p className="text-[10px] text-[#3f4945]/50 font-medium mt-0.5">
                      {fmt(ev.tanggal_mulai)}
                      {ev.tanggal_selesai &&
                        ev.tanggal_selesai !== ev.tanggal_mulai &&
                        ` — ${fmt(ev.tanggal_selesai)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DetailArsipTahunAjaran() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tahunAjaranKeys.detail(id),
    queryFn: () =>
      api.get(`/operator/master-data/tahun-ajaran/${id}`).then((r) => r.data),
    retry: false,
    staleTime: 60_000,
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return <SkeletonPage />;

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#ba1a1a]">
          <span className="material-symbols-outlined text-[36px]">
            error_outline
          </span>
        </div>
        <p className="font-bold text-lg text-[#00342b]">
          Data tidak ditemukan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="px-5 py-2 rounded-full border border-[#bfc9c4]/40 text-[#3f4945] text-xs font-bold hover:bg-[#f2f4f3] transition"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => navigate("/operator/master/tahun-ajaran/arsip")}
            className="px-5 py-2 rounded-full bg-[#00342b] text-white text-xs font-bold hover:bg-[#006e2a] transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Kembali ke Arsip
          </button>
        </div>
      </div>
    );
  }

  // ── Data extraction ────────────────────────────────────────────────────────
  const payload = data;
  const ta = data.data;
  const semesters = ta.semesters ?? [];
  const ganjil = semesters.find((s) => s.nama === "Ganjil");
  const genap = semesters.find((s) => s.nama === "Genap");

  const totalSiswa = data.total_siswa ?? 0;
  const totalGuru = data.total_guru ?? 0;
  const totalKelas = data.total_kelas ?? 0;
  const totalMapel = data.total_mapel ?? 0;
  const totalJadwal = data.total_jadwal ?? 0;

  const tglMulaiTA = ganjil?.tgl_mulai ?? ta.tanggal_mulai;
  const tglSelesaiTA =
    genap?.tgl_selesai ?? ganjil?.tgl_selesai ?? ta.tanggal_selesai;
  const progressTA = calcProgress(tglMulaiTA, tglSelesaiTA) || 100;
  const hariTotalTA = daysBetween(tglMulaiTA, tglSelesaiTA);
  const totalBulan = hariTotalTA
    ? Math.max(1, Math.round(hariTotalTA / 30))
    : null;

  const tahunParts = (ta.tahun || "").split(/[/ -]/).filter(Boolean);
  const startYear = tahunParts[0] || ta.tahun || "";
  const endYear = tahunParts[1] || "";

  const checklist = data.checklist ?? {};
  const checkItems = [
    { key: "ta_dibuat", label: "Tahun Ajaran Dibuat" },
    { key: "semester_dibuat", label: "Semester Dibuat" },
    { key: "rombel_dibuat", label: "Rombel Tersedia" },
    { key: "guru_mengajar", label: "Guru Mengajar" },
    { key: "mapel_lengkap", label: "Mapel Lengkap" },
    { key: "wali_kelas", label: "Wali Kelas Ditetapkan" },
    { key: "jadwal_selesai", label: "Jadwal Selesai" },
    { key: "kalender", label: "Kalender Diisi" },
    { key: "siswa_terdistribusi", label: "Siswa Terdistribusi" },
  ];
  const checkPass = checkItems.filter((c) => checklist[c.key]).length;
  const checkTotal = checkItems.length;

  const aktivitas = data.aktivitas ?? [];
  const taPrev = data.ta_prev ?? null;
  const taNext = data.ta_next ?? null;

  return (
    <div className="w-full space-y-8 pb-16 antialiased text-[#111827]">
      <style>{`
        .serif-italic { font-family: 'EB Garamond', Georgia, serif; font-style: italic; }
        .glass-panel { background: rgba(255,255,255,0.72); backdrop-filter: blur(16px); }
        .font-headline-card { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-headline-section { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── 1. Breadcrumb & Back ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4 sm:gap-6 w-full flex-wrap">
          <button
            onClick={() => navigate("/operator/master/tahun-ajaran/arsip")}
            className="flex items-center gap-2 px-3.5 py-1.5 text-[#3f4945] hover:text-[#00342b] hover:bg-[#00342b]/5 rounded-xl transition-all group border border-transparent hover:border-[#00342b]/10"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span className="text-sm font-semibold">Kembali ke Arsip</span>
          </button>
          <div className="h-4 w-px bg-[#bfc9c4]/40 hidden sm:block" />
          <nav className="flex items-center gap-2 ml-auto text-xs flex-wrap">
            <Link
              to="/operator/master/tahun-ajaran"
              className="font-medium text-[#3f4945]/60 hover:text-[#00342b] transition-colors"
            >
              Master Data
            </Link>
            <span className="material-symbols-outlined text-[14px] text-[#3f4945]/40">
              chevron_right
            </span>
            <Link
              to="/operator/master/tahun-ajaran/arsip"
              className="font-medium text-[#3f4945]/60 hover:text-[#00342b] transition-colors"
            >
              Arsip
            </Link>
            <span className="material-symbols-outlined text-[14px] text-[#3f4945]/40">
              chevron_right
            </span>
            <span className="font-bold text-[#00342b]">{ta.tahun}</span>
          </nav>
        </div>
      </div>

      {/* ── 2. Hero Header ───────────────────────────────────────────────────── */}
      <section className="animate-fade-in-up glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-white/80 shadow-[0_20px_50px_rgba(0,52,43,0.05)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#3f4945]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-[#00342b]/5 rounded-full blur-[80px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              'url("https://www.transparenttextures.com/patterns/islamic-art.png")',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <ArsipBadge archivedAt={ta.archived_at} />
              <span className="px-4 py-1.5 rounded-full bg-[#00342b]/5 text-[#00342b] text-[10px] font-bold uppercase tracking-[0.25em] border border-[#00342b]/10">
                Data Historis
              </span>
            </div>

            {/* Judul */}
            <div className="mb-4">
              <span className="serif-italic text-[#3f4945]/60 text-xl block mb-1">
                Tahun Ajaran
              </span>
              <h1 className="font-headline-section text-5xl sm:text-7xl text-[#00342b] font-extrabold tracking-tighter leading-none">
                {startYear}
                {endYear && (
                  <>
                    <span className="text-[#3f4945]/20 font-light mx-1">/</span>
                    <span className="text-[#3f4945]/50">{endYear}</span>
                  </>
                )}
              </h1>
            </div>

            <p className="text-sm text-[#3f4945]/60 font-medium">
              {fmt(tglMulaiTA)} — {fmt(tglSelesaiTA)}
              {totalBulan && (
                <span className="ml-2 text-[#3f4945]/40">
                  · {totalBulan} bulan
                </span>
              )}
            </p>
          </div>

          {/* Progress lingkaran sederhana */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#e1e3e2"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#3f4945"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressTA / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-[#00342b]">
                  {progressTA}%
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
              Selesai
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. Stat Chips (ringkasan keseluruhan TA) ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatChip icon="group" value={disp(totalSiswa)} label="Siswa" />
        <StatChip
          icon="person_celebrate"
          value={disp(totalGuru)}
          label="Guru"
        />
        <StatChip icon="meeting_room" value={disp(totalKelas)} label="Kelas" />
        <StatChip
          icon="menu_book"
          value={disp(totalMapel)}
          label="Mata Pelajaran"
        />
        <StatChip
          icon="calendar_month"
          value={disp(totalJadwal)}
          label="Jadwal"
          color="#3f4945"
        />
      </div>

      {/* ── 4. Kesiapan Akademik ─────────────────────────────────────────────── */}
      <section className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest mb-0.5">
              Rekap
            </p>
            <h3 className="font-headline-card text-xl font-extrabold text-[#00342b]">
              Kesiapan Akademik
            </h3>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00342b]/5 border border-[#00342b]/10">
            <span className="text-lg font-extrabold text-[#00342b]">
              {checkPass}
            </span>
            <span className="text-sm text-[#3f4945]/50 font-medium">
              / {checkTotal}
            </span>
            <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
              terpenuhi
            </span>
          </div>
        </div>

        <div className="mb-4">
          <ProgressBar
            value={Math.round((checkPass / checkTotal) * 100)}
            color={checkPass === checkTotal ? "#006e2a" : "#eaa300"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {checkItems.map((c) => (
            <CheckItem key={c.key} label={c.label} ok={!!checklist[c.key]} />
          ))}
        </div>
      </section>

      {/* ── 5. Dua Panel Semester ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#bfc9c4]/20" />
        <span className="text-[11px] font-bold text-[#3f4945]/40 uppercase tracking-[0.25em]">
          Detail Semester
        </span>
        <div className="h-px flex-1 bg-[#bfc9c4]/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SemesterPanel
          semester={ganjil}
          payload={payload}
          ta={ta}
          accentColor="#006e2a"
        />
        <SemesterPanel
          semester={genap}
          payload={payload}
          ta={ta}
          accentColor="#00342b"
        />
      </div>

      {/* ── 6. Aktivitas / Log ───────────────────────────────────────────────── */}
      {aktivitas.length > 0 && (
        <section className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#00342b]/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-[#00342b]">
                history
              </span>
            </div>
            <h3 className="font-headline-card text-xl font-extrabold text-[#00342b]">
              Riwayat Aktivitas
            </h3>
          </div>
          <div className="flex flex-col gap-0">
            {aktivitas.slice(0, 8).map((a, i) => (
              <div
                key={i}
                className="relative flex gap-4 group/item py-3 px-2 rounded-2xl hover:bg-white/50 transition-all duration-300"
              >
                {/* Timeline line */}
                {i < aktivitas.slice(0, 8).length - 1 && (
                  <div className="absolute left-[22px] top-[48px] bottom-0 w-px bg-[#bfc9c4]/20" />
                )}
                <div className="relative z-10 w-9 h-9 rounded-xl bg-white border border-[#bfc9c4]/20 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[#3f4945] text-[16px]">
                    {a.icon || "info"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 flex-1 pt-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[9px] font-bold text-[#3f4945]/40 uppercase tracking-widest">
                      {a.actor || "Sistem"}
                    </span>
                    <span className="text-[9px] font-medium text-[#3f4945]/40">
                      {fmt(a.created_at || a.tanggal)}
                    </span>
                  </div>
                  <p className="text-xs text-[#3f4945] leading-relaxed">
                    {a.deskripsi || a.keterangan || a.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. Navigasi TA Sebelum / Sesudah ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 border-t border-[#bfc9c4]/15">
        {taPrev ? (
          <button
            onClick={() =>
              navigate(`/operator/master/tahun-ajaran/arsip/${taPrev.id}`)
            }
            className="group flex items-center gap-4 p-4 sm:pr-8 bg-white/50 hover:bg-white rounded-2xl border border-[#bfc9c4]/20 hover:border-[#3f4945]/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-full bg-[#3f4945]/10 flex items-center justify-center text-[#3f4945] group-hover:bg-[#3f4945] group-hover:text-white transition-all duration-500 shrink-0">
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em] mb-0.5">
                Arsip Sebelumnya
              </span>
              <span className="text-lg font-extrabold text-[#00342b] font-headline-card">
                {taPrev.tahun}
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[#bfc9c4]/30 text-xs text-[#3f4945]/40 text-center sm:text-left">
            Tidak ada arsip sebelumnya
          </div>
        )}

        {taNext ? (
          <button
            onClick={() =>
              navigate(`/operator/master/tahun-ajaran/arsip/${taNext.id}`)
            }
            className="group flex items-center justify-end gap-4 p-4 sm:pl-8 bg-white/50 hover:bg-white rounded-2xl border border-[#bfc9c4]/20 hover:border-[#3f4945]/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
          >
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em] mb-0.5">
                Arsip Selanjutnya
              </span>
              <span className="text-lg font-extrabold text-[#00342b] font-headline-card">
                {taNext.tahun}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3f4945]/10 flex items-center justify-center text-[#3f4945] group-hover:bg-[#3f4945] group-hover:text-white transition-all duration-500 shrink-0">
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[#bfc9c4]/30 text-xs text-[#3f4945]/40 text-center sm:text-right">
            Tidak ada arsip selanjutnya
          </div>
        )}
      </div>
    </div>
  );
}
