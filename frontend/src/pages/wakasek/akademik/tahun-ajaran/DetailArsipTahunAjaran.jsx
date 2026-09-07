import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import { tahunAjaranKeys } from "../../../../hooks/api/useTahunAjaran";
import MetricCardComp from "./components/MetricCard";
import KalenderItemComp from "./components/KalenderItem";
import {
  fmt,
  fmtLong,
  fmtShort,
  daysBetween,
  daysRemaining,
  calcProgress,
  weeksBetween,
} from "./utils/tahunAjaranHelpers";

const MetricCard = MetricCardComp;
const KalenderItem = KalenderItemComp;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const disp = (n) =>
  n != null && n !== "" && Number(n) > 0
    ? Number(n).toLocaleString("id-ID")
    : "—";

function Sk({ className = "" }) {
  return (
    <div className={`animate-pulse bg-[#e6e9e8] rounded-2xl ${className}`} />
  );
}

function SkeletonPage() {
  return (
    <div className="space-y-8 pb-12">
      <Sk className="h-8 w-72 rounded-xl" />
      <Sk className="h-64 rounded-[2.5rem]" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Sk key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Sk className="h-72 rounded-[2.5rem]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Sk className="h-96 rounded-[2.5rem]" />
        <Sk className="h-96 rounded-[2.5rem]" />
      </div>
      <Sk className="h-64 rounded-[2.5rem]" />
      <Sk className="h-80 rounded-[2.5rem]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header — reusable
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ badge, title, accent, icon }) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00342b]/8 border border-[#00342b]/12 w-fit">
          {icon && (
            <span className="material-symbols-outlined text-[#00342b] text-[15px]">
              {icon}
            </span>
          )}
          <span className="text-[10px] font-bold text-[#00342b] uppercase tracking-[0.25em]">
            {badge}
          </span>
        </div>
      )}
      <h2 className="font-headline-section text-2xl sm:text-3xl font-extrabold text-[#00342b] tracking-tight">
        {title}{" "}
        {accent && (
          <span
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              color: "#3ce36a",
            }}
          >
            {accent}
          </span>
        )}
      </h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatMini — small stat cell inside summary cards
// ─────────────────────────────────────────────────────────────────────────────
function StatMini({
  icon,
  label,
  value,
  sub,
  color = "#006e2a",
  dark = false,
}) {
  const isEmpty = value === "—" || value === null || value === undefined;
  return (
    <div
      className={`flex flex-col gap-1.5 p-3.5 rounded-2xl border transition-all duration-300 ${
        dark
          ? "bg-white/5 border-white/10 hover:bg-white/10"
          : "bg-[#f8faf9] border-[#bfc9c4]/20 hover:bg-white hover:border-[#006e2a]/20"
      }`}
    >
      <span
        className="material-symbols-outlined text-[16px]"
        style={{
          color: dark ? "#69ff87" : color,
          opacity: isEmpty ? 0.4 : 0.75,
        }}
      >
        {icon}
      </span>
      <span
        className="text-xl font-black font-headline-card"
        style={{
          color: isEmpty
            ? dark
              ? "rgba(255,255,255,0.2)"
              : "#bfc9c4"
            : dark
              ? "#fff"
              : color,
        }}
      >
        {isEmpty ? "—" : value}
      </span>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${
          dark ? "text-white/40" : "text-[#3f4945]/60"
        }`}
      >
        {label}
      </span>
      {sub && (
        <span
          className={`text-[9px] font-bold ${dark ? "text-white/30" : "text-[#3f4945]/40"}`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChecklistPanel — sticky sidebar
// ─────────────────────────────────────────────────────────────────────────────
function ChecklistPanel({ checklist, checkItems }) {
  const doneCount = checkItems.filter((c) => checklist[c.key]).length;
  const healthScore = checkItems.length
    ? Math.round((doneCount / checkItems.length) * 100)
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-[#bfc9c4]/20 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#bfc9c4]/15">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-card text-base font-extrabold text-[#00342b]">
            Checklist Kesiapan
          </h3>
          <span className="px-3 py-1 rounded-full bg-[#006e2a]/10 text-[#006e2a] text-xs font-black border border-[#006e2a]/20">
            {doneCount}/{checkItems.length}
          </span>
        </div>
        {/* Mini progress bar */}
        <div className="w-full h-2 bg-[#e6e9e8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${healthScore}%`,
              background:
                healthScore >= 80
                  ? "#006e2a"
                  : healthScore >= 50
                    ? "#eaa300"
                    : "#ba1a1a",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] font-bold text-[#3f4945]/40">
            Kesiapan
          </span>
          <span
            className="text-[9px] font-black"
            style={{
              color:
                healthScore >= 80
                  ? "#006e2a"
                  : healthScore >= 50
                    ? "#eaa300"
                    : "#ba1a1a",
            }}
          >
            {healthScore}%
          </span>
        </div>
      </div>
      {/* Items */}
      <div className="p-4 space-y-1.5">
        {checkItems.map(({ key, label }) => {
          const isDone = !!checklist[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isDone ? "bg-[#006e2a]/5" : "bg-transparent"
              }`}
            >
              <span
                className="material-symbols-outlined text-[17px] shrink-0"
                style={{
                  color: isDone ? "#006e2a" : "#bfc9c4",
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                {isDone ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span
                className={`text-xs font-medium ${
                  isDone ? "text-[#191c1c]" : "text-[#3f4945]/45"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SemesterBlock
// ─────────────────────────────────────────────────────────────────────────────
function SemesterBlock({ semester, payload, ta, accentColor = "#006e2a" }) {
  if (!semester) {
    return (
      <div className="bg-white/50 border border-[#bfc9c4]/20 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
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
  const hariSisa = Math.max(0, daysRemaining(tglSelesai) ?? 0);
  const hariBerjalan =
    totalHari != null ? Math.max(0, totalHari - hariSisa) : null;
  const totalMinggu = weeksBetween(tglMulai, tglSelesai);

  const kelasList = payload.kelas ?? [];
  const kalenderAll = payload.kalender ?? [];
  const checklist = payload.checklist ?? {};

  const kelasFilter = kelasList.filter(
    (k) =>
      k.semester?.toLowerCase() === semester.nama?.toLowerCase() ||
      !k.semester ||
      k.semester === "-",
  );
  const totalSiswa = kelasFilter.reduce((s, k) => s + (k.total_siswa ?? 0), 0);
  const totalKelas = kelasFilter.length;

  const kalender = kalenderAll.filter((k) => {
    if (!tglMulai || !k.tanggal_mulai) return true;
    const tgl = new Date(k.tanggal_mulai);
    const start = new Date(tglMulai);
    const end = tglSelesai ? new Date(tglSelesai) : null;
    return tgl >= start && (end == null || tgl <= end);
  });

  const checkValues = Object.values(checklist);
  const healthScore = checkValues.length
    ? Math.round(
        (checkValues.filter(Boolean).length / checkValues.length) * 100,
      )
    : 0;

  const checkItems = [
    { key: "ta_dibuat", label: "Tahun Ajaran Dibuat" },
    { key: "semester_dibuat", label: "Semester Dibuat" },
    { key: "rombel_dibuat", label: "Rombel Tersedia" },
    { key: "guru_mengajar", label: "Guru Mengajar" },
    { key: "mapel_lengkap", label: "Mapel Lengkap" },
    { key: "wali_kelas", label: "Wali Kelas" },
    { key: "jadwal_selesai", label: "Jadwal Selesai" },
    { key: "kalender", label: "Kalender Diisi" },
    { key: "siswa_terdistribusi", label: "Siswa Terdistribusi" },
    { key: "kepsek_dikunci", label: "Profil Kepsek Lengkap" },
  ];

  const kenaikan = payload.kenaikan_kelas ?? null;
  const mapelList = payload.mapel_list ?? [];

  return (
    <div className="space-y-8">
      {/* ── Header Semester ── */}
      <div
        className="rounded-[2rem] p-8 sm:p-10 relative overflow-hidden"
        style={{
          background: `${accentColor}08`,
          border: `1px solid ${accentColor}18`,
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left: identity */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: `${accentColor}15`,
                  borderColor: `${accentColor}30`,
                  color: accentColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
                Semester {semester.nama}
              </div>
              <span className="text-xs text-[#3f4945]/60 font-medium">
                {fmt(tglMulai)} — {fmt(tglSelesai)}
              </span>
            </div>
            <h3 className="font-headline-section text-3xl md:text-4xl font-extrabold text-[#00342b] tracking-tight">
              {ta.tahun} —{" "}
              <span
                style={{
                  fontFamily: "'EB Garamond',serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: accentColor,
                }}
              >
                Semester {semester.nama}
              </span>
            </h3>
            <p className="text-xs text-[#3f4945]/60">
              {totalMinggu ?? "—"} minggu · {totalHari ?? "—"} hari
            </p>
          </div>

          {/* Right: progress ring */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#e1e3e2"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[#00342b]">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                Progress
              </span>
              <span className="text-sm font-bold text-[#00342b]">
                Day {hariBerjalan ?? "–"} of {totalHari ?? "–"}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
                Selesai
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-8 relative z-10">
          <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${accentColor}, #69ff87)`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-[#3f4945]/40 font-medium">
            <span>{fmt(tglMulai)}</span>
            <span>{fmt(tglSelesai)}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: "groups", label: "Total Siswa", value: totalSiswa },
          { icon: "meeting_room", label: "Total Kelas", value: totalKelas },
          {
            icon: "co_present",
            label: "Guru Mengajar",
            value: payload.total_guru ?? "—",
          },
          {
            icon: "menu_book",
            label: "Mata Pelajaran",
            value: payload.total_mapel ?? "—",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#bfc9c4]/20 rounded-2xl p-5 flex flex-col gap-1"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ color: accentColor }}
            >
              {s.icon}
            </span>
            <span className="text-2xl font-black text-[#00342b] font-headline-card">
              {s.value}
            </span>
            <span className="text-[10px] font-bold text-[#3f4945]/55 uppercase tracking-wider">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Distribusi Siswa + Kalender ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribusi Siswa */}
        <div className="bg-white border border-[#bfc9c4]/20 rounded-3xl p-6 flex flex-col gap-5">
          <div>
            <h4 className="font-headline-card text-base font-extrabold text-[#00342b]">
              Distribusi Siswa per Kelas
            </h4>
            <p className="text-xs text-[#3f4945]/55 mt-0.5">
              Semester {semester.nama} · {ta.tahun}
            </p>
          </div>
          {kelasFilter.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {(() => {
                const maxSiswa = Math.max(
                  ...kelasFilter.map((k) => k.total_siswa ?? 0),
                  1,
                );
                return kelasFilter.slice(0, 8).map((k) => {
                  const pct = Math.round(
                    ((k.total_siswa ?? 0) / maxSiswa) * 100,
                  );
                  return (
                    <div key={k.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#3f4945]/55 w-20 truncate text-right shrink-0">
                        {k.nama_kelas}
                      </span>
                      <div className="flex-1 bg-[#e1e3e2]/50 rounded-full h-4 overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(4, pct)}%`,
                            background: `linear-gradient(90deg, ${accentColor}, #69ff87)`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-[#00342b] w-8 text-right shrink-0">
                        {k.total_siswa ?? 0}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#bfc9c4] gap-2 py-8">
              <span className="material-symbols-outlined text-3xl">
                groups_off
              </span>
              <p className="text-sm">Belum ada data kelas</p>
            </div>
          )}
        </div>

        {/* Kalender Akademik */}
        <div className="bg-white border border-[#bfc9c4]/20 rounded-3xl p-6 flex flex-col gap-5">
          <div>
            <h4 className="font-headline-card text-base font-extrabold text-[#00342b]">
              Kalender Akademik
            </h4>
            <p className="text-xs text-[#3f4945]/55 mt-0.5">
              {kalender.length} agenda · Semester {semester.nama}
            </p>
          </div>
          {kalender.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {kalender.map((ev, i) => (
                <KalenderItem key={i} event={ev} />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#bfc9c4] gap-2 py-8">
              <span className="material-symbols-outlined text-4xl">
                calendar_month
              </span>
              <p className="text-sm font-medium text-[#3f4945]/50">
                Belum ada agenda
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Kesiapan Akademik ── */}
      <div className="bg-white border border-[#bfc9c4]/20 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Score */}
          <div className="lg:w-56 flex flex-col items-center justify-center gap-4 p-6 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/15 shrink-0">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#e1e3e2"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={
                    healthScore >= 80
                      ? "#006e2a"
                      : healthScore >= 50
                        ? "#eaa300"
                        : "#ba1a1a"
                  }
                  strokeWidth="3.5"
                  strokeDasharray={`${healthScore}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-[#00342b]">
                  {healthScore}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-extrabold text-[#00342b]">
                {healthScore >= 80
                  ? "Siap"
                  : healthScore >= 50
                    ? "Cukup"
                    : "Perlu Perhatian"}
              </p>
              <p className="text-[10px] text-[#3f4945]/55 mt-0.5">
                Kesiapan Akademik
              </p>
            </div>
          </div>
          {/* Checklist grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checkItems.map(({ key, label }) => {
              const done = !!checklist[key];
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${
                    done
                      ? "bg-[#006e2a]/5 border-[#006e2a]/15"
                      : "bg-[#f8faf9] border-[#bfc9c4]/20"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[18px] shrink-0"
                    style={{
                      color: done ? "#006e2a" : "#bfc9c4",
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {done ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span
                    className={`text-xs font-medium ${done ? "text-[#191c1c]" : "text-[#3f4945]/45"}`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mata Pelajaran ── */}
      {mapelList.length > 0 && (
        <div>
          <h4 className="font-headline-card text-base font-extrabold text-[#00342b] mb-4">
            Mata Pelajaran
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mapelList.slice(0, 8).map((mp, i) => {
              const icons = ["menu_book", "calculate", "science", "mosque"];
              return (
                <div
                  key={mp.id}
                  className="bg-white border border-[#bfc9c4]/20 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${accentColor}12`,
                        color: accentColor,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {icons[i % icons.length]}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        mp.is_active
                          ? "bg-[#006e2a]/10 text-[#006e2a] border-[#006e2a]/20"
                          : "bg-[#eceeed] text-[#3f4945] border-[#bfc9c4]/30"
                      }`}
                    >
                      {mp.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#00342b]">
                      {mp.nama_mapel}
                    </p>
                    <p className="text-[10px] text-[#3f4945]/55 mt-0.5">
                      {mp.jam_per_minggu
                        ? `${mp.jam_per_minggu} jam/minggu`
                        : "—"}
                      {mp.kelompok ? ` · Kel. ${mp.kelompok}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Kelas & Rombel ── */}
      {kelasFilter.length > 0 && (
        <div>
          <h4 className="font-headline-card text-base font-extrabold text-[#00342b] mb-4">
            Kelas & Rombel
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kelasFilter.slice(0, 8).map((k) => (
              <div
                key={k.id}
                className="bg-white border border-[#bfc9c4]/20 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${accentColor}12`,
                      color: accentColor,
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      door_front
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      k.is_active !== false
                        ? "text-[#006e2a] bg-[#006e2a]/10 border-[#006e2a]/20"
                        : "text-[#3f4945]/60 bg-[#eceeed] border-[#bfc9c4]/20"
                    }`}
                  >
                    {k.is_active !== false ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#00342b]">
                    {k.nama_kelas}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 pt-3 border-t border-[#bfc9c4]/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
                      Wali Kelas
                    </span>
                    <span className="text-[10px] font-bold text-[#00342b]">
                      {k.nama_wali ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
                      Siswa
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: accentColor }}
                    >
                      {k.total_siswa ?? 0} siswa
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Kenaikan Kelas ── */}
      {kenaikan && (
        <div className="bg-[#00342b] rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none rounded-[2rem]"
            style={{
              backgroundImage:
                "radial-gradient(#69ff87 0.5px, transparent 0.5px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#69ff87]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#69ff87] text-[20px]">
                  trending_up
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Rekap Akhir
                </p>
                <h4 className="text-base font-extrabold text-white font-headline-card">
                  Kenaikan Kelas
                </h4>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Naik Kelas",
                  value: kenaikan.naik,
                  icon: "arrow_upward",
                  color: "#69ff87",
                },
                {
                  label: "Tidak Naik",
                  value: kenaikan.tidak_naik,
                  icon: "arrow_downward",
                  color: "#ba1a1a",
                },
                {
                  label: "Belum Ditentukan",
                  value: kenaikan.belum_ditentukan,
                  icon: "help",
                  color: "#eaa300",
                },
                {
                  label: "Lulus / Tamat",
                  value: kenaikan.lulus,
                  icon: "school",
                  color: "#69ff87",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/10 transition-all duration-300"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${item.color}20` }}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <p
                    className="text-2xl font-black font-headline-card"
                    style={{
                      color:
                        item.value == null
                          ? "rgba(255,255,255,0.15)"
                          : item.color,
                    }}
                  >
                    {item.value != null
                      ? item.value.toLocaleString("id-ID")
                      : "—"}
                  </p>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider leading-tight">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DetailArsipTahunAjaran() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchKelas, setSearchKelas] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tahunAjaranKeys.detail(id),
    queryFn: () =>
      api.get(`/operator/master-data/tahun-ajaran/${id}`).then((r) => r.data),
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) return <SkeletonPage />;

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
            className="px-5 py-2 rounded-full bg-[#00342b] text-white text-xs font-bold flex items-center gap-2"
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

  // ── Data extraction ──────────────────────────────────────────────────────
  const payload = data.data ?? data;
  const ta = data.data?.data ?? data.data ?? {};
  const semesters = ta.semesters ?? [];
  const ganjil = semesters.find((s) => s.nama === "Ganjil");
  const genap = semesters.find((s) => s.nama === "Genap");
  const kelasList = payload.kelas ?? [];

  const totalKelas = payload.total_kelas ?? kelasList.length ?? 0;
  const totalSiswa = payload.total_siswa ?? 0;
  const totalGuru = payload.total_guru ?? 0;
  const totalMapel = payload.total_mapel ?? 0;
  const totalWaliKelas = payload.total_wali_kelas ?? 0;
  const totalRuangan = payload.total_ruangan ?? 0;
  const totalJadwal = payload.total_jadwal ?? 0;
  const totalKapasitas = kelasList.reduce(
    (acc, k) => acc + (Number(k.kapasitas) || 0),
    0,
  );
  const kapasitasPct =
    totalKapasitas > 0
      ? Math.min(100, Math.round((totalSiswa / totalKapasitas) * 100))
      : 0;

  const checklist = payload.checklist ?? {};
  const aktivitas = payload.aktivitas ?? [];
  const taPrev = payload.ta_prev ?? null;
  const taNext = payload.ta_next ?? null;

  const tahunParts = (ta.tahun || "").split(/[/ -]/).filter(Boolean);
  const startYear = tahunParts[0] || ta.tahun || "";
  const endYear = tahunParts[1] || "";

  const tglMulaiTA = ganjil?.tgl_mulai || ta.tanggal_mulai;
  const tglSelesaiTA =
    genap?.tgl_selesai || ganjil?.tgl_selesai || ta.tanggal_selesai;
  const progressTA = calcProgress(tglMulaiTA, tglSelesaiTA) || 100;
  const hariTotalTA = daysBetween(tglMulaiTA, tglSelesaiTA);
  const totalBulan = hariTotalTA
    ? Math.max(1, Math.round(hariTotalTA / 30))
    : null;

  const kurikulumMayoritas = (() => {
    if (!kelasList.length) return "—";
    const counts = {};
    kelasList.forEach((k) => {
      const kur = k.kurikulum || "Merdeka";
      counts[kur] = (counts[kur] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();

  const totalL = payload.total_siswa_laki ?? 0;
  const totalP = payload.total_siswa_perempuan ?? 0;
  const pctL = totalSiswa > 0 ? Math.round((totalL / totalSiswa) * 100) : 0;
  const pctP = totalSiswa > 0 ? Math.round((totalP / totalSiswa) * 100) : 0;
  const totalTetap = payload.total_guru_tetap ?? 0;
  const totalHonorer = payload.total_guru_honorer ?? 0;
  const pctTetap =
    totalGuru > 0 ? Math.round((totalTetap / totalGuru) * 100) : 0;
  const totalTanpaTugas = payload.total_guru_tanpa_tugas ?? 0;
  const totalMapelWajib = payload.total_mapel_wajib ?? 0;
  const totalMapelLokal = payload.total_mapel_lokal ?? 0;
  const totalHariEfektif = ta.total_hari_efektif ?? 0;
  const totalHariLibur = ta.total_hari_libur ?? 0;
  const totalAgenda = payload.kalender?.length ?? 0;
  const siswaPerKelas =
    totalKelas > 0 ? Math.round(totalSiswa / totalKelas) : 0;
  const sisaKapasitas = Math.max(0, totalKapasitas - totalSiswa);

  const filteredKelas = kelasList.filter(
    (k) =>
      (k.nama_kelas || "").toLowerCase().includes(searchKelas.toLowerCase()) ||
      (k.kurikulum || "").toLowerCase().includes(searchKelas.toLowerCase()) ||
      (k.nama_wali || "").toLowerCase().includes(searchKelas.toLowerCase()),
  );

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
    { key: "kepsek_dikunci", label: "Profil Kepsek Lengkap" },
  ];

  return (
    <div className="w-full space-y-12 pb-16 antialiased text-[#111827]">
      <style>{`
        .serif-italic { font-family: 'EB Garamond', Georgia, serif; font-style: italic; }
        .font-headline-card { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-headline-section { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fade-in-up { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
        .animate-fade-in-up { animation: fade-in-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ━━━━━━ 1. BREADCRUMB ━━━━━━ */}
      <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-in-up">
        <button
          onClick={() => navigate("/operator/master/tahun-ajaran/arsip")}
          className="flex items-center gap-2 px-3.5 py-1.5 text-[#3f4945] hover:text-[#00342b] hover:bg-[#00342b]/5 rounded-xl transition-all group border border-transparent hover:border-[#00342b]/10"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          <span className="text-sm font-semibold">Kembali ke Arsip</span>
        </button>
        <nav className="flex items-center gap-2 text-xs">
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

      {/* ━━━━━━ 2. HERO ━━━━━━ */}
      <section className="animate-fade-in-up bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden">
        {/* Top bar — arsip badge */}
        <div className="px-8 sm:px-12 pt-8 flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6e9e8] border border-[#bfc9c4]/40">
            <span
              className="material-symbols-outlined text-[14px] text-[#3f4945]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              inventory_2
            </span>
            <span className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest">
              Arsip{ta.archived_at ? ` · ${fmt(ta.archived_at)}` : ""}
            </span>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-[#00342b]/5 text-[#00342b] text-[10px] font-bold uppercase tracking-widest border border-[#00342b]/10">
            Data Historis
          </span>
        </div>

        {/* Main content */}
        <div className="px-8 sm:px-12 pb-10 pt-5 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <span className="serif-italic text-[#3f4945]/50 text-xl block mb-1">
              Tahun Ajaran
            </span>
            <h1 className="font-headline-section text-5xl sm:text-7xl font-extrabold text-[#00342b] tracking-tighter leading-none">
              {startYear}
              {endYear && (
                <>
                  <span className="text-[#3f4945]/20 font-light mx-1">/</span>
                  <span className="text-[#3f4945]/50">{endYear}</span>
                </>
              )}
            </h1>
            <p className="text-sm text-[#3f4945]/55 font-medium mt-3">
              {fmt(tglMulaiTA)} — {fmt(tglSelesaiTA)}
              {totalBulan && (
                <span className="ml-2 text-[#3f4945]/35">
                  · {totalBulan} bulan
                </span>
              )}
            </p>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-5 shrink-0">
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
                <span className="text-2xl font-extrabold text-[#00342b]">
                  {progressTA}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                Progress
              </span>
              <span className="text-sm font-bold text-[#00342b]">Selesai</span>
            </div>
          </div>
        </div>

        {/* Bottom strip — key metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#bfc9c4]/15 divide-x divide-[#bfc9c4]/15">
          {[
            { label: "Kurikulum", value: kurikulumMayoritas },
            {
              label: "Total Bulan",
              value: totalBulan ? `${totalBulan} bulan` : "—",
            },
            {
              label: "Hari Efektif",
              value: totalHariEfektif > 0 ? `${totalHariEfektif} hari` : "—",
            },
            { label: "Status", value: "Diarsipkan" },
          ].map((m) => (
            <div key={m.label} className="px-6 py-4 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-[#3f4945]/45 uppercase tracking-widest">
                {m.label}
              </span>
              <span className="text-sm font-extrabold text-[#00342b]">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━ 3. STAT CHIPS ━━━━━━ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { icon: "group", value: disp(totalSiswa), label: "Siswa" },
          { icon: "person_celebrate", value: disp(totalGuru), label: "Guru" },
          { icon: "meeting_room", value: disp(totalKelas), label: "Kelas" },
          {
            icon: "menu_book",
            value: disp(totalMapel),
            label: "Mata Pelajaran",
          },
          {
            icon: "event_note",
            value: disp(totalJadwal),
            label: "Total Jadwal",
            span: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-white border border-[#bfc9c4]/20 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group ${s.span ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-xl">
                {s.icon}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl font-extrabold text-[#00342b] leading-none truncate">
                {s.value}
              </span>
              <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest mt-1">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ━━━━━━ 4. PROGRES + ABSENSI ━━━━━━ */}
      <section className="bg-white border border-[#bfc9c4]/20 rounded-[2.5rem] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Absensi */}
          <div className="flex-1">
            <h3 className="font-headline-card text-lg font-extrabold text-[#00342b] mb-1">
              Aktivitas Akademik
            </h3>
            <p className="text-xs text-[#3f4945]/55 mb-6">
              Rekap absensi keseluruhan tahun ajaran
            </p>
            {(() => {
              const rekap = payload.absensi_rekap;
              if (!rekap)
                return (
                  <div className="flex flex-col items-center justify-center h-32 text-[#3f4945]/40 gap-2">
                    <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
                      bar_chart_off
                    </span>
                    <p className="text-xs font-medium">
                      Belum ada data absensi
                    </p>
                  </div>
                );
              const bars = [
                { label: "Hadir", value: rekap.hadir, color: "#006e2a" },
                { label: "Sakit", value: rekap.sakit, color: "#eaa300" },
                { label: "Izin", value: rekap.izin, color: "#3f4945" },
                { label: "Alpa", value: rekap.alpa, color: "#ba1a1a" },
              ];
              const maxVal = Math.max(...bars.map((b) => b.value), 1);
              return (
                <div className="flex flex-col gap-3">
                  {bars.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider w-10 text-right shrink-0">
                        {b.label}
                      </span>
                      <div className="flex-1 bg-[#e1e3e2]/50 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(2, (b.value / maxVal) * 100)}%`,
                            backgroundColor: b.color,
                          }}
                        />
                      </div>
                      <span className="text-xs font-black text-[#00342b] w-16 text-right shrink-0">
                        {b.value.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-[#bfc9c4]/20" />

          {/* Progress + quick stats */}
          <div className="lg:w-72 flex flex-col gap-4">
            <div className="bg-[#00342b] text-white rounded-2xl p-5 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                  Progress Tahunan
                </p>
                <h4 className="text-4xl font-extrabold font-headline-card">
                  {progressTA}%
                </h4>
                <div className="mt-3 w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#69ff87] h-full rounded-full"
                    style={{ width: `${progressTA}%` }}
                  />
                </div>
              </div>
              <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl opacity-10">
                trending_up
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f8faf9] border border-[#bfc9c4]/20 rounded-2xl p-4 flex flex-col gap-1 items-center text-center">
                <span className="text-[10px] font-bold text-[#3f4945]/55 uppercase tracking-widest">
                  Ruang Kelas
                </span>
                <span className="text-2xl font-black text-[#00342b]">
                  {disp(totalRuangan || totalKelas)}
                </span>
              </div>
              <div className="bg-[#f8faf9] border border-[#bfc9c4]/20 rounded-2xl p-4 flex flex-col gap-1 items-center text-center">
                <span className="text-[10px] font-bold text-[#3f4945]/55 uppercase tracking-widest">
                  Kapasitas
                </span>
                <span className="text-2xl font-black text-[#00342b]">
                  {kapasitasPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━ 5. RINGKASAN TAHUNAN ━━━━━━ */}
      <section>
        <SectionHeader
          badge="Ringkasan Tahunan"
          title="Kondisi"
          accent="Keseluruhan"
          icon="summarize"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Siswa */}
          <div className="bg-white border border-[#bfc9c4]/20 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a]">
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    groups
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                    Ringkasan
                  </p>
                  <h4 className="text-base font-extrabold text-[#00342b]">
                    Siswa Tahunan
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#006e2a]">
                  {disp(totalSiswa)}
                </span>
                <p className="text-[9px] font-bold text-[#3f4945]/45 uppercase tracking-wider mt-0.5">
                  Total Aktif
                </p>
              </div>
            </div>

            {(totalL > 0 || totalP > 0) && (
              <div className="mb-5 p-4 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/15">
                <div className="flex rounded-full overflow-hidden h-2 mb-2">
                  <div
                    className="bg-[#006e2a] transition-all duration-700"
                    style={{ width: `${pctL}%` }}
                  />
                  <div
                    className="bg-[#00342b]/25 transition-all duration-700"
                    style={{ width: `${pctP}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-[9px] font-bold text-[#3f4945]/60">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#006e2a]" />
                    Laki-laki: {pctL}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00342b]/25" />
                    Perempuan: {pctP}%
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatMini
                icon="man"
                label="Laki-laki"
                value={totalL || "—"}
                sub={totalL > 0 ? `${pctL}%` : null}
                color="#006e2a"
              />
              <StatMini
                icon="woman"
                label="Perempuan"
                value={totalP || "—"}
                sub={totalP > 0 ? `${pctP}%` : null}
                color="#00342b"
              />
              <StatMini
                icon="person_add"
                label="Siswa Masuk"
                value={payload.total_siswa_masuk ?? "—"}
                sub="Tahun ini"
                color="#006e2a"
              />
              <StatMini
                icon="person_remove"
                label="Keluar/Mutasi"
                value={payload.total_siswa_keluar ?? "—"}
                sub="Tahun ini"
                color="#ba1a1a"
              />
              <StatMini
                icon="trending_up"
                label="Naik Kelas"
                value={
                  ta.is_tutup_buku ? (payload.total_siswa_naik ?? "—") : null
                }
                color="#006e2a"
              />
              <StatMini
                icon="trending_flat"
                label="Tidak Naik"
                value={
                  ta.is_tutup_buku
                    ? (payload.total_siswa_tidak_naik ?? "—")
                    : null
                }
                color="#eaa300"
              />
            </div>
          </div>

          {/* Guru */}
          <div className="bg-white border border-[#bfc9c4]/20 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b]">
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    person_celebrate
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                    Ringkasan
                  </p>
                  <h4 className="text-base font-extrabold text-[#00342b]">
                    Guru Tahunan
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#006e2a]">
                  {disp(totalGuru)}
                </span>
                <p className="text-[9px] font-bold text-[#3f4945]/45 uppercase tracking-wider mt-0.5">
                  Total Aktif
                </p>
              </div>
            </div>

            {(totalTetap > 0 || totalHonorer > 0) && (
              <div className="mb-5 p-4 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/15">
                <div className="flex rounded-full overflow-hidden h-2 mb-2">
                  <div
                    className="bg-[#006e2a] transition-all duration-700"
                    style={{ width: `${pctTetap}%` }}
                  />
                  <div
                    className="bg-[#eaa300]/40 transition-all duration-700"
                    style={{ width: `${100 - pctTetap}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-[9px] font-bold text-[#3f4945]/60">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#006e2a]" />
                    Tetap: {pctTetap}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#eaa300]/40" />
                    Honorer: {100 - pctTetap}%
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatMini
                icon="verified_user"
                label="Guru Tetap"
                value={totalTetap || "—"}
                sub={totalTetap > 0 ? `${pctTetap}%` : null}
                color="#006e2a"
              />
              <StatMini
                icon="badge"
                label="Honorer"
                value={totalHonorer || "—"}
                sub={totalHonorer > 0 ? `${100 - pctTetap}%` : null}
                color="#eaa300"
              />
              <StatMini
                icon="supervised_user_circle"
                label="Wali Kelas"
                value={totalWaliKelas || "—"}
                sub="Ditugaskan"
                color="#00342b"
              />
              <StatMini
                icon="school"
                label="Guru Mengajar"
                value={totalGuru || "—"}
                sub="Aktif"
                color="#006e2a"
              />
              <StatMini
                icon={totalTanpaTugas > 0 ? "person_off" : "check_circle"}
                label="Tanpa Tugas"
                value={totalTanpaTugas > 0 ? totalTanpaTugas : "—"}
                sub={totalTanpaTugas > 0 ? "Perlu perhatian" : "Semua bertugas"}
                color={totalTanpaTugas > 0 ? "#ba1a1a" : "#006e2a"}
              />
            </div>
          </div>

          {/* Rombel */}
          <div className="bg-white border border-[#bfc9c4]/20 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a]">
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_tree
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                    Ringkasan
                  </p>
                  <h4 className="text-base font-extrabold text-[#00342b]">
                    Rombongan Belajar
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#006e2a]">
                  {disp(totalKelas)}
                </span>
                <p className="text-[9px] font-bold text-[#3f4945]/45 uppercase tracking-wider mt-0.5">
                  Total Rombel
                </p>
              </div>
            </div>

            {totalKapasitas > 0 && (
              <div className="mb-5 p-4 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/15">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-[#3f4945]/55 uppercase tracking-wider">
                    Tingkat Pengisian
                  </span>
                  <span className="text-[9px] font-black text-[#006e2a]">
                    {totalSiswa} / {totalKapasitas}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#e6e9e8] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${kapasitasPct >= 90 ? "bg-[#ba1a1a]" : kapasitasPct >= 75 ? "bg-[#eaa300]" : "bg-[#006e2a]"}`}
                    style={{ width: `${kapasitasPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-[#3f4945]/40">
                    Rata-rata {siswaPerKelas} siswa/kelas
                  </span>
                  <span className="text-[9px] text-[#3f4945]/40">
                    Sisa {disp(sisaKapasitas)} slot
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <StatMini
                icon="account_tree"
                label="Total Rombel"
                value={disp(totalKelas)}
                color="#006e2a"
              />
              <StatMini
                icon="people"
                label="Kapasitas Total"
                value={totalKapasitas > 0 ? disp(totalKapasitas) : "—"}
                color="#00342b"
              />
              <StatMini
                icon="groups"
                label="Terdistribusi"
                value={disp(totalSiswa)}
                color="#006e2a"
              />
              <StatMini
                icon="reduce_capacity"
                label="Sisa Kapasitas"
                value={totalKapasitas > 0 ? disp(sisaKapasitas) : "—"}
                color={sisaKapasitas < 10 ? "#ba1a1a" : "#3f4945"}
              />
            </div>
          </div>

          {/* Akademik — dark */}
          <div className="bg-[#00342b] rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none rounded-[2rem]"
              style={{
                backgroundImage:
                  "radial-gradient(#69ff87 0.5px, transparent 0.5px)",
                backgroundSize: "16px 16px",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#69ff87]/10 flex items-center justify-center text-[#69ff87]">
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_stories
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Ringkasan
                    </p>
                    <h4 className="text-base font-extrabold text-white">
                      Akademik Tahunan
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#69ff87]">
                    {disp(totalJadwal)}
                  </span>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">
                    Total Jadwal
                  </p>
                </div>
              </div>

              {totalHariEfektif > 0 && hariTotalTA > 0 && (
                <div className="mb-5 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                      Hari Efektif
                    </span>
                    <span className="text-[9px] font-black text-[#69ff87]">
                      {totalHariEfektif} dari {hariTotalTA} hari
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#006e2a] to-[#69ff87] rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.round((totalHariEfektif / hariTotalTA) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-white/30 mt-1 block">
                    {totalHariLibur} hari libur
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatMini
                  dark
                  icon="menu_book"
                  label="Total Mapel"
                  value={disp(totalMapel)}
                />
                <StatMini
                  dark
                  icon="check_box"
                  label="Mapel Wajib"
                  value={totalMapelWajib > 0 ? disp(totalMapelWajib) : "—"}
                />
                <StatMini
                  dark
                  icon="local_library"
                  label="Muatan Lokal"
                  value={totalMapelLokal > 0 ? disp(totalMapelLokal) : "—"}
                />
                <StatMini
                  dark
                  icon="co_present"
                  label="Pengampu"
                  value={disp(totalGuru)}
                />
                <StatMini
                  dark
                  icon="today"
                  label="Hari Efektif"
                  value={totalHariEfektif > 0 ? disp(totalHariEfektif) : "—"}
                />
                <StatMini
                  dark
                  icon="event_note"
                  label="Agenda"
                  value={totalAgenda > 0 ? disp(totalAgenda) : "—"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━ 6. KONFIGURASI + CHECKLIST ━━━━━━ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Konfigurasi — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader
            badge="Konfigurasi Akademik"
            title="Konfigurasi"
            accent="Dasar"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "menu_book",
                label: "Kurikulum",
                value: kurikulumMayoritas,
                sub: "Aktif",
                subColor: "#006e2a",
              },
              {
                icon: "account_tree",
                label: "Struktur Kelas",
                value: totalKelas > 0 ? `${totalKelas} Rombel` : "—",
                sub: "Tersedia",
                subColor: "#006e2a",
              },
              {
                icon: "library_books",
                label: "Mata Pelajaran",
                value: totalMapel > 0 ? `${totalMapel} Mapel` : "—",
                sub: "Tersedia",
                subColor: "#006e2a",
              },
              {
                icon: "group_add",
                label: "Penugasan Guru",
                value:
                  totalGuru > 0 ? `${totalWaliKelas} / ${totalGuru} Guru` : "—",
                sub:
                  totalGuru > 0
                    ? `${Math.max(0, totalGuru - totalWaliKelas)} belum ditugaskan`
                    : "Belum ada data",
                subColor: "#eaa300",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white border border-[#bfc9c4]/20 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:border-[#006e2a]/20 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                    {card.label}
                  </p>
                  <p className="text-base font-bold text-[#00342b] truncate">
                    {card.value}
                  </p>
                  <p
                    className="text-[10px] font-bold mt-0.5"
                    style={{ color: card.subColor }}
                  >
                    {card.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist — 1/3 */}
        <div>
          <SectionHeader badge="Kesiapan" title="Checklist" accent="Akademik" />
          <ChecklistPanel checklist={checklist} checkItems={checkItems} />
        </div>
      </section>

      {/* ━━━━━━ 7. DAFTAR KELAS ━━━━━━ */}
      <section className="bg-white border border-[#bfc9c4]/20 rounded-[2.5rem] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 border-b border-[#bfc9c4]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a]">
              <span className="material-symbols-outlined text-[22px]">
                school
              </span>
            </div>
            <div>
              <h3 className="font-headline-card text-lg font-extrabold text-[#00342b]">
                Daftar Rombongan Belajar
              </h3>
              <p className="text-xs text-[#3f4945]/55">
                {kelasList.length} kelas terdaftar
              </p>
            </div>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#3f4945]/45 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari kelas, wali, kurikulum..."
              value={searchKelas}
              onChange={(e) => setSearchKelas(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full border border-[#bfc9c4]/40 text-xs bg-[#f8faf9] focus:bg-white focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] outline-none w-48 sm:w-60 transition-all"
            />
          </div>
        </div>

        {kelasList.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
              school
            </span>
            <p className="text-sm font-medium text-[#3f4945]/55">
              Belum ada kelas yang terdaftar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="bg-[#f8faf9] border-b border-[#bfc9c4]/15 text-[#3f4945]/55 font-bold uppercase tracking-wider">
                  {[
                    "Nama Kelas",
                    "Tingkat",
                    "Wali Kelas",
                    "Kurikulum",
                    "Ruangan",
                    "Kapasitas",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="py-3 px-5 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bfc9c4]/10">
                {filteredKelas.map((k) => (
                  <tr
                    key={k.id}
                    className="hover:bg-[#f8faf9] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-bold text-[#00342b]">
                      {k.nama_kelas}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#00342b]/5 text-[#00342b] font-bold text-[10px]">
                        Tingkat {k.tingkat}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#3f4945]">
                      {k.nama_wali && k.nama_wali !== "-" ? (
                        k.nama_wali
                      ) : (
                        <span className="italic text-[#3f4945]/35">
                          Belum ditentukan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-[#3f4945]/70">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#006e2a]">
                          menu_book
                        </span>
                        {k.kurikulum || "Merdeka"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#3f4945]/70">
                      {k.ruangan ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#3f4945]/45">
                            location_on
                          </span>
                          {k.ruangan}
                        </span>
                      ) : (
                        <span className="text-[#3f4945]/35">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[#00342b]">
                          {k.total_siswa ?? 0}{" "}
                          <span className="text-[#3f4945]/35 font-normal">
                            / {k.kapasitas || 32}
                          </span>
                        </span>
                        <div className="w-16 bg-[#e1e3e2] h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-[#006e2a] h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((k.total_siswa || 0) / (k.kapasitas || 32)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {k.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-bold text-[10px]">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#f2f4f3] text-[#3f4945]/55 font-bold text-[10px]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ━━━━━━ 8. DIVIDER SEMESTER ━━━━━━ */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#bfc9c4]/20" />
        </div>
        <div className="relative flex justify-center">
          <div className="bg-[#f2f4f3] px-5 py-2 rounded-full border border-[#bfc9c4]/25 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#3f4945]/45 text-[16px]">
              calendar_view_month
            </span>
            <span className="text-[11px] font-bold text-[#3f4945]/45 uppercase tracking-[0.2em]">
              Detail Per Semester
            </span>
          </div>
        </div>
      </div>

      {/* ━━━━━━ 9. SEMESTER GANJIL ━━━━━━ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-10 rounded-full bg-[#006e2a]" />
          <div>
            <p className="text-[10px] font-bold text-[#006e2a] uppercase tracking-[0.25em]">
              Semester 1
            </p>
            <h2 className="font-headline-section text-2xl font-extrabold text-[#00342b]">
              Ganjil
            </h2>
          </div>
        </div>
        <SemesterBlock
          semester={ganjil}
          payload={payload}
          ta={ta}
          accentColor="#006e2a"
        />
      </section>

      {/* ━━━━━━ 10. SEMESTER GENAP ━━━━━━ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-10 rounded-full bg-[#00342b]" />
          <div>
            <p className="text-[10px] font-bold text-[#00342b] uppercase tracking-[0.25em]">
              Semester 2
            </p>
            <h2 className="font-headline-section text-2xl font-extrabold text-[#00342b]">
              Genap
            </h2>
          </div>
        </div>
        <SemesterBlock
          semester={genap}
          payload={payload}
          ta={ta}
          accentColor="#00342b"
        />
      </section>

      {/* ━━━━━━ 11. TIMELINE AKTIVITAS ━━━━━━ */}
      {aktivitas.length > 0 && (
        <section className="bg-white border border-[#bfc9c4]/20 rounded-[2.5rem] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#00342b]/8 flex items-center justify-center text-[#00342b]">
              <span className="material-symbols-outlined text-[20px]">
                history
              </span>
            </div>
            <div>
              <h3 className="font-headline-card text-lg font-extrabold text-[#00342b]">
                Log Aktivitas
              </h3>
              <p className="text-xs text-[#3f4945]/55">
                Riwayat perubahan akademik
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[#bfc9c4]/20" />
            <div className="space-y-4">
              {aktivitas.slice(0, 10).map((a, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className="relative z-10 w-9 h-9 rounded-xl bg-white border border-[#bfc9c4]/25 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[#3f4945]/45 text-[15px]">
                      {a.icon || "info"}
                    </span>
                  </div>
                  <div className="flex-1 bg-[#f8faf9] rounded-2xl p-4 border border-[#bfc9c4]/15">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
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
          </div>
        </section>
      )}

      {/* ━━━━━━ 12. NAVIGASI ARSIP ━━━━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 border-t border-[#bfc9c4]/15">
        {taPrev ? (
          <button
            onClick={() =>
              navigate(`/operator/master/tahun-ajaran/arsip/${taPrev.id}`)
            }
            className="group flex items-center gap-4 p-4 bg-white hover:bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/20 hover:border-[#006e2a]/25 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-full bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a] group-hover:text-white transition-all duration-300 shrink-0">
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold text-[#3f4945]/45 uppercase tracking-widest block">
                Arsip Sebelumnya
              </span>
              <span className="text-base font-extrabold text-[#00342b]">
                {taPrev.tahun}
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[#bfc9c4]/25 text-xs text-[#3f4945]/35 text-center">
            Tidak ada arsip sebelumnya
          </div>
        )}
        {taNext ? (
          <button
            onClick={() =>
              navigate(`/operator/master/tahun-ajaran/arsip/${taNext.id}`)
            }
            className="group flex items-center justify-end gap-4 p-4 bg-white hover:bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/20 hover:border-[#006e2a]/25 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="text-right">
              <span className="text-[9px] font-bold text-[#3f4945]/45 uppercase tracking-widest block">
                Arsip Selanjutnya
              </span>
              <span className="text-base font-extrabold text-[#00342b]">
                {taNext.tahun}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a] group-hover:text-white transition-all duration-300 shrink-0">
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[#bfc9c4]/25 text-xs text-[#3f4945]/35 text-center">
            Tidak ada arsip selanjutnya
          </div>
        )}
      </div>
    </div>
  );
}
