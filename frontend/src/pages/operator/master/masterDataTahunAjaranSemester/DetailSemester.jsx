import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import { tahunAjaranKeys } from "../../../../hooks/api/useTahunAjaran";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtShort(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}
function daysRemaining(end) {
  if (!end) return null;
  return Math.round((new Date(end) - new Date()) / 86400000);
}
function calcProgress(start, end) {
  if (!start || !end) return 0;
  const total = daysBetween(start, end);
  if (!total) return 0;
  const rem = Math.max(0, daysRemaining(end) ?? 0);
  return Math.max(0, Math.min(100, Math.round(((total - rem) / total) * 100)));
}
function weeksBetween(a, b) {
  const d = daysBetween(a, b);
  return d != null ? Math.floor(d / 7) : null;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ className = "" }) {
  return (
    <div className={`animate-pulse bg-[#e6e9e8] rounded-2xl ${className}`} />
  );
}
function SkeletonPage() {
  return (
    <div className="space-y-8 pb-12">
      <Sk className="h-40 rounded-[2.5rem]" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Sk key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Sk className="h-64 rounded-[2.5rem]" />
          <Sk className="h-80 rounded-[2.5rem]" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <Sk className="h-72 rounded-[2.5rem]" />
          <Sk className="h-64 rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}

// ── Modal Edit Semester ───────────────────────────────────────────────────────
function ModalEditSemester({
  open,
  semester,
  tahunAjaran,
  tahunAjaranId,
  onClose,
  queryClient,
}) {
  const [form, setForm] = useState({ tgl_mulai: "", tgl_selesai: "" });
  useEffect(() => {
    if (open && semester) {
      setForm({
        tgl_mulai: semester.tgl_mulai ? semester.tgl_mulai.slice(0, 10) : "",
        tgl_selesai: semester.tgl_selesai
          ? semester.tgl_selesai.slice(0, 10)
          : "",
      });
    }
  }, [open, semester]);

  const namaSem = semester?.nama?.toLowerCase() ?? "ganjil";
  const mut = useMutation({
    mutationFn: () =>
      api.put(`/operator/master-data/tahun-ajaran/${tahunAjaranId}`, {
        tahun: tahunAjaran?.tahun,
        is_active: tahunAjaran?.is_active ?? false,
        buat_semester: true,
        [`semester_${namaSem}_mulai`]: form.tgl_mulai || null,
        [`semester_${namaSem}_selesai`]: form.tgl_selesai || null,
        ...(tahunAjaran?.is_active && semester?.is_active
          ? { semester_aktif: semester.nama }
          : {}),
      }),
    onSuccess: () => {
      toast.success("Semester berhasil diperbarui.");
      // Gunakan tahunAjaranKeys agar cache yang di-invalidate sinkron
      // dengan TahunAjaranSemester.jsx dan halaman lain yang pakai hook yang sama.
      queryClient.invalidateQueries({
        queryKey: tahunAjaranKeys.detail(tahunAjaranId),
      });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal menyimpan."),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#00342b] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">
              edit_calendar
            </span>
          </div>
          <div>
            <h2 className="text-white font-extrabold text-[17px] font-headline-card">
              Edit Semester {semester?.nama}
            </h2>
            <p className="text-[#afefdd] text-[11px]">
              Ubah tanggal mulai & selesai
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Tanggal Mulai", key: "tgl_mulai" },
            { label: "Tanggal Selesai", key: "tgl_selesai" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-[#00342b] uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <input
                type="date"
                value={form[key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-[#f8faf9] border border-[#bfc9c4]/40 rounded-xl text-sm text-[#111827] focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] outline-none transition-all"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-xs uppercase tracking-wider hover:bg-[#eceeed] transition"
          >
            Batal
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="flex-1 py-3 rounded-full bg-[#006e2a] hover:bg-[#00531e] text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#006e2a]/30 disabled:opacity-60"
          >
            {mut.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kalender Item ─────────────────────────────────────────────────────────────
function KalenderItem({ item }) {
  const colorMap = {
    libur: "bg-[#ba1a1a]",
    pts: "bg-[#006e2a]",
    pas: "bg-[#eaa300]",
    ph: "bg-[#006e2a]",
    kegiatan: "bg-[#3f4945]",
  };
  const jenis = item.jenis?.toLowerCase();
  const isUpcoming =
    item.tanggal_mulai && new Date(item.tanggal_mulai) > new Date();
  const dotColor = colorMap[jenis] ?? "bg-[#bfc9c4]";
  const labelColor =
    jenis === "libur"
      ? "text-[#ba1a1a] bg-[#ba1a1a]/10"
      : jenis === "pts" || jenis === "pas"
        ? "text-[#006e2a] bg-[#006e2a]/10"
        : "text-[#3f4945]/60 bg-[#eceeed]";

  return (
    <div className="group/item relative flex gap-5 pl-1 hover:bg-[#f8faf9] hover:translate-x-1 p-2 -ml-2 rounded-xl transition-all duration-300">
      <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-xl bg-white/80 border border-[#bfc9c4]/20 flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
        <span
          className={`w-2.5 h-2.5 rounded-full ${dotColor} ${isUpcoming ? "animate-pulse" : ""}`}
        />
      </div>
      <div className="flex flex-col gap-1 justify-center">
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full w-fit ${labelColor}`}
        >
          {fmtShort(item.tanggal_mulai)}
          {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai
            ? ` – ${fmtShort(item.tanggal_selesai)}`
            : ""}
        </span>
        <h4 className="text-sm font-bold text-[#00342b]">{item.judul}</h4>
        {item.is_nasional && (
          <span className="text-[10px] text-[#ba1a1a] font-bold uppercase">
            Nasional
          </span>
        )}
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  icon,
  colorClass = "text-[#006e2a]",
  barWidth,
  barColor = "bg-[#006e2a]",
}) {
  return (
    <div className="p-5 bg-[#f2f4f3]/50 rounded-2xl border border-[#bfc9c4]/10 hover:border-[#006e2a]/30 transition-colors group">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] font-black text-[#3f4945]/50 uppercase tracking-[0.2em] mb-1">
            {label}
          </p>
          <p
            className={`text-2xl font-extrabold ${colorClass} group-hover:opacity-80 transition-colors font-headline-card`}
          >
            {value}
          </p>
        </div>
        <span
          className={`material-symbols-outlined ${colorClass} opacity-40 group-hover:opacity-80 transition-colors`}
        >
          {icon}
        </span>
      </div>
      {barWidth != null && (
        <div className="w-full h-1.5 bg-[#eceeed] rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DetailSemester() {
  const { taId, semesterNama } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  // Pakai tahunAjaranKeys.detail() agar sinkron dengan cache dari halaman lain.
  // Sebelumnya pakai ["detail-semester", taId] — tidak match dengan invalidateQueries
  // yang dikirim dari TahunAjaranSemester.jsx maupun useTahunAjaran.js hook.
  const { data, isLoading, isError } = useQuery({
    queryKey: tahunAjaranKeys.detail(taId),
    queryFn: () =>
      api.get(`/operator/master-data/tahun-ajaran/${taId}`).then((r) => r.data),
    enabled: !!taId,
    staleTime: 60_000,
  });

  const setSemAktif = useMutation({
    mutationFn: () =>
      api.patch(`/operator/master-data/tahun-ajaran/${taId}/semester-aktif`, {
        semester_nama: semesterNama,
      }),
    onSuccess: () => {
      toast.success(`Semester ${semesterNama} berhasil diaktifkan.`);
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.detail(taId) });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ?? "Gagal mengaktifkan semester.",
      ),
  });

  if (isLoading) return <SkeletonPage />;

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-[#3f4945]">
        <span className="material-symbols-outlined text-[56px] text-[#bfc9c4]">
          calendar_today
        </span>
        <p className="font-semibold text-[#00342b]">Data tidak ditemukan.</p>
        <button
          onClick={() => navigate("/operator/master/tahun-ajaran")}
          className="text-[#006e2a] text-sm hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Kembali
        </button>
      </div>
    );
  }

  const ta = data.data;
  const semesters = ta.semesters ?? [];
  const semester = semesters.find(
    (s) => s.nama?.toLowerCase() === semesterNama?.toLowerCase(),
  );

  if (!semester) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <span className="material-symbols-outlined text-[56px] text-[#bfc9c4]">
          event_busy
        </span>
        <p className="font-semibold text-[#00342b]">
          Semester "{semesterNama}" tidak ditemukan.
        </p>
        <button
          onClick={() => navigate(`/operator/master/tahun-ajaran/${taId}`)}
          className="text-[#006e2a] text-sm hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Kembali ke Tahun Ajaran
        </button>
      </div>
    );
  }

  const kelasList = data.kelas ?? [];
  const kalenderAll = data.kalender ?? [];
  const aktivitas = data.aktivitas ?? [];
  const checklist = data.checklist ?? {};
  const tglMulai = semester.tgl_mulai;
  const tglSelesai = semester.tgl_selesai;
  const isAktif = semester.is_active;
  const isTaAktif = ta.is_active;

  const kalender = kalenderAll.filter((k) => {
    if (!tglMulai || !k.tanggal_mulai) return true;
    const tgl = new Date(k.tanggal_mulai);
    const start = new Date(tglMulai);
    const end = tglSelesai ? new Date(tglSelesai) : null;
    return tgl >= start && (end == null || tgl <= end);
  });

  const progress = calcProgress(tglMulai, tglSelesai);
  const totalHari = daysBetween(tglMulai, tglSelesai);
  const hariSisa = Math.max(0, daysRemaining(tglSelesai) ?? 0);
  const hariBerjalan =
    totalHari != null ? Math.max(0, totalHari - hariSisa) : null;
  const totalMinggu = weeksBetween(tglMulai, tglSelesai);

  const kelasFilter = kelasList.filter(
    (k) =>
      k.semester?.toLowerCase() === semesterNama?.toLowerCase() ||
      !k.semester ||
      k.semester === "-",
  );
  const totalSiswa = kelasFilter.reduce((s, k) => s + (k.total_siswa ?? 0), 0);
  const totalKelas = kelasFilter.length;
  const semLain = semesters.find((s) => s.nama !== semester.nama);

  const checkValues = Object.values(checklist);
  const healthScore = checkValues.length
    ? Math.round(
        (checkValues.filter(Boolean).length / checkValues.length) * 100,
      )
    : 0;

  const alerts = [
    !checklist.jadwal_selesai && {
      msg: "Jadwal pelajaran belum lengkap",
      icon: "calendar_month",
      color: "text-[#ba1a1a]",
      bg: "bg-[#ba1a1a]/10",
      border: "border-[#ba1a1a]/20",
    },
    !checklist.siswa_terdistribusi && {
      msg: "Siswa belum terdistribusi ke kelas",
      icon: "groups",
      color: "text-[#ba1a1a]",
      bg: "bg-[#ba1a1a]/10",
      border: "border-[#ba1a1a]/20",
    },
    !checklist.wali_kelas && {
      msg: "Wali kelas belum ditetapkan",
      icon: "person_off",
      color: "text-[#eaa300]",
      bg: "bg-[#eaa300]/10",
      border: "border-[#eaa300]/20",
    },
    !checklist.mapel_lengkap && {
      msg: "Mata pelajaran belum diisi",
      icon: "menu_book",
      color: "text-[#eaa300]",
      bg: "bg-[#eaa300]/10",
      border: "border-[#eaa300]/20",
    },
    !checklist.kalender && {
      msg: "Kalender akademik masih kosong",
      icon: "event_note",
      color: "text-[#3f4945]",
      bg: "bg-[#eceeed]",
      border: "border-[#bfc9c4]/30",
    },
    !checklist.kepsek_dikunci && {
      msg: "Profil kepala sekolah belum diisi",
      icon: "manage_accounts",
      color: "text-[#3f4945]",
      bg: "bg-[#eceeed]",
      border: "border-[#bfc9c4]/30",
    },
  ].filter(Boolean);

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

  return (
    <>
      <ModalEditSemester
        open={showEditModal}
        semester={semester}
        tahunAjaran={ta}
        tahunAjaranId={taId}
        onClose={() => setShowEditModal(false)}
        queryClient={queryClient}
      />

      <div className="w-full space-y-10 pb-16">
        {/* ── Atmospheric Background ── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full bg-[#006e2a] opacity-[0.05] filter blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] rounded-full bg-[#ffdeac] opacity-[0.05] filter blur-[120px]" />
        </div>

        {/* ── SECTION: Header ── */}
        <section className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 bg-white/40 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/20 shadow-xl overflow-hidden relative">
            <div className="absolute -left-8 -top-5 w-32 h-32 bg-[#69ff87]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Breadcrumb + Title */}
            <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
              <nav className="flex items-center gap-1.5 text-sm text-[#3f4945] font-medium flex-wrap">
                <Link
                  to="/operator/master/tahun-ajaran"
                  className="hover:text-[#006e2a] transition-colors"
                >
                  Tahun Ajaran
                </Link>
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
                <Link
                  to={`/operator/master/tahun-ajaran/${taId}`}
                  className="hover:text-[#006e2a] transition-colors"
                >
                  {ta.tahun}
                </Link>
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
                <span className="text-[#111827]">Semester {semester.nama}</span>
              </nav>

              <div className="flex items-center gap-4 flex-wrap">
                {isAktif ? (
                  <span className="inline-flex items-center gap-2 bg-[#006e2a]/10 px-4 py-1.5 rounded-full border border-[#006e2a]/20 text-[10px] font-bold text-[#006e2a] tracking-widest uppercase shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse" />
                    AKTIF
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-[#eceeed] px-4 py-1.5 rounded-full border border-[#bfc9c4]/30 text-[10px] font-bold text-[#3f4945] tracking-widest uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#3f4945]" />
                    TIDAK AKTIF
                  </span>
                )}
                <div className="h-4 w-[1px] bg-[#bfc9c4]/30" />
                <div className="flex items-center gap-2 text-[#3f4945]/70 text-sm font-medium">
                  <span className="material-symbols-outlined text-[18px] text-[#00342b]/40">
                    event_available
                  </span>
                  {fmt(tglMulai)} — {fmt(tglSelesai)}
                </div>
              </div>

              <h1 className="font-headline-section text-[40px] md:text-[52px] font-extrabold text-[#00342b] tracking-tight leading-[1.1]">
                {ta.tahun}{" "}
                <span className="font-serif-accent text-[#3ce36a] italic font-normal ml-2">
                  — Semester {semester.nama}
                </span>
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 flex items-center gap-3 flex-wrap shrink-0">
              {isTaAktif && !isAktif && (
                <button
                  onClick={() => {
                    if (confirm(`Aktifkan Semester ${semester.nama}?`))
                      setSemAktif.mutate();
                  }}
                  disabled={setSemAktif.isPending}
                  className="px-6 py-3 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 text-[#006e2a] font-bold text-xs uppercase tracking-widest hover:bg-[#006e2a]/20 transition flex items-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Set Aktif
                </button>
              )}
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-gradient-to-r from-[#00342b] to-[#00342b] text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-500 flex items-center gap-2 shadow-[0_10px_25px_-5px_rgba(0,52,43,0.3)] hover:shadow-[0_20px_35px_-5px_rgba(105,255,135,0.3)] hover:scale-[1.02] group"
              >
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-12">
                  edit_square
                </span>
                Edit Semester
              </button>
              <button
                onClick={() => navigate("/operator/master/tahun-ajaran")}
                className="w-12 h-12 bg-white/80 backdrop-blur-md border border-[#bfc9c4]/30 hover:bg-[#eceeed] rounded-full flex items-center justify-center text-[#00342b] transition-all shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined text-[22px]">
                  arrow_back
                </span>
              </button>
            </div>
          </div>

          {/* ── Progress Card ── */}
          <div className="mt-6 bg-white/70 backdrop-blur-md rounded-[2.5rem] p-10 relative overflow-hidden border border-white/40 group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#006e2a]/5 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="relative z-10">
              {/* Progress Header */}
              <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:scale-110 group-hover:bg-[#006e2a]/20 transition-all duration-300">
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        trending_up
                      </span>
                    </div>
                    <h3 className="font-headline-card text-[28px] text-[#00342b] font-extrabold tracking-tight leading-none">
                      Semester Progress
                    </h3>
                  </div>
                  <p className="text-[#3f4945]/70 text-[15px] font-medium pl-1">
                    Real-time tracking periode dan timeline akademik semester
                    ini
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-4 shadow-sm flex items-center gap-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.15em] mb-1">
                      Current Progress
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-[#00342b] tracking-tighter group-hover:text-[#006e2a] transition-colors duration-300">
                        {progress}
                      </span>
                      <span className="text-lg font-bold text-[#006e2a]">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-[#bfc9c4]/20" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-[#5cfd80]/30 px-3 py-1 rounded-full border border-[#006e2a]/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
                      <span className="text-[10px] font-black text-[#00732c] uppercase tracking-wider">
                        {isAktif ? "On Track" : "Tidak Aktif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="material-symbols-outlined text-[14px] text-[#3f4945]/60">
                        calendar_month
                      </span>
                      <span className="text-[11px] font-bold text-[#3f4945]/70 uppercase tracking-tight">
                        {semester.nama} {ta.tahun?.split("/")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-12">
                <div className="relative h-3 bg-[#e1e3e2]/30 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00342b] via-[#006e2a] to-[#69ff87] rounded-full shadow-[0_0_15px_rgba(0,110,42,0.3)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-shadow duration-500"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                      <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-white rounded-full border-4 border-[#006e2a] shadow-lg z-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ left: `${progress}%` }}
                >
                  <div className="w-1.5 h-1.5 bg-[#006e2a] rounded-full animate-pulse" />
                </div>
              </div>

              {/* 3-col Date Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Mulai */}
                <div className="relative bg-gradient-to-br from-white to-[#006e2a]/5 backdrop-blur-md rounded-2xl p-6 border border-[#bfc9c4]/20 border-l-4 border-l-[#006e2a] shadow-sm flex items-center gap-5 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 group/card overflow-hidden">
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-white/40 border border-white/80 flex items-center justify-center text-[#006e2a] shrink-0 shadow-[0_4px_12px_rgba(0,110,42,0.15)] group-hover/card:scale-110 transition-transform">
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      calendar_today
                    </span>
                  </div>
                  <div className="relative z-10 flex flex-col">
                    <p className="text-[10px] font-black text-[#006e2a] uppercase tracking-[0.2em] mb-1 font-headline-card">
                      Mulai
                    </p>
                    <h4 className="text-xl font-extrabold text-[#00342b] font-headline-card tracking-tight">
                      {fmt(tglMulai)}
                    </h4>
                  </div>
                </div>

                {/* Day counter */}
                <div className="bg-[#00342b] rounded-2xl p-6 border border-[#006e2a]/20 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#00342b]/40 transition-all duration-500 group/center">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#006e2a]/20 rounded-full blur-2xl" />
                  <div className="relative z-10 transform group-hover/center:scale-105 transition-transform duration-500">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#006e2a]/20 border border-[#006e2a]/30 text-[#5cfd80] text-[10px] font-bold uppercase tracking-widest mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5cfd80] mr-2 animate-pulse" />
                      Hari Ini
                    </div>
                    <div className="text-white font-extrabold text-3xl leading-none mb-1 font-headline-card tracking-tight">
                      Day {hariBerjalan ?? "–"}{" "}
                      <span className="font-serif-accent italic font-normal text-[#5cfd80] text-lg">
                        of {totalHari ?? "–"}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/70 font-bold uppercase tracking-wider mt-2">
                      {hariSisa} days remaining
                    </div>
                  </div>
                </div>

                {/* Selesai */}
                <div className="relative bg-gradient-to-bl from-white to-[#00342b]/5 backdrop-blur-md rounded-2xl p-6 border border-[#bfc9c4]/20 border-r-4 border-r-[#00342b] shadow-sm flex items-center gap-5 justify-end text-right hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 group/card overflow-hidden">
                  <div className="relative z-10 flex flex-col">
                    <p className="text-[10px] font-black text-[#00342b] uppercase tracking-[0.2em] mb-1 font-headline-card">
                      Selesai
                    </p>
                    <h4 className="text-xl font-extrabold text-[#00342b] font-headline-card tracking-tight">
                      {fmt(tglSelesai)}
                    </h4>
                  </div>
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-white/40 border border-white/80 flex items-center justify-center text-[#00342b] shrink-0 shadow-[0_4px_12px_rgba(0,52,43,0.15)] group-hover/card:scale-110 transition-transform">
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      flag
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: Statistics Overview ── */}
        <section className="relative z-10">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2a] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006e2a]" />
              </span>
              <span className="text-[12px] font-bold text-[#006e2a] uppercase tracking-widest font-label-badge">
                Live Data
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#bfc9c4]/30 to-transparent" />
            </div>
            <h2 className="font-headline-section text-4xl font-extrabold text-[#00342b] tracking-tight">
              Statistics{" "}
              <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                Overview
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Primary: Total Siswa */}
            <div className="md:col-span-4 bg-[#00342b] text-white rounded-3xl p-6 shadow-lg relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,200,83,0.15)]">
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-[#afefdd] uppercase tracking-widest mb-1">
                  Total Siswa Aktif
                </p>
                <h4 className="text-4xl font-extrabold font-headline-card">
                  {totalSiswa}
                </h4>
                <div className="mt-4 h-10 w-full flex items-end gap-1">
                  {kelasFilter.slice(0, 4).map((k, i) => {
                    const maxS = Math.max(
                      ...kelasFilter.map((x) => x.total_siswa ?? 0),
                      1,
                    );
                    const pct =
                      Math.round(((k.total_siswa ?? 0) / maxS) * 90) + 10;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-white/30 rounded-t-sm group-hover:animate-pulse"
                        style={{
                          height: `${pct}%`,
                          animationDelay: `${i * 100}ms`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-7xl">
                  groups
                </span>
              </div>
            </div>

            {/* Secondary 4-col */}
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Guru Mengajar",
                  value: data.total_guru ?? "-",
                  sub: "100% Aktif",
                  subColor: "text-[#006e2a]",
                  icon: "check_circle",
                },
                {
                  label: "Total Kelas",
                  value: totalKelas,
                  sub: "Semester ini",
                  subColor: "text-[#3f4945]/60",
                },
                {
                  label: "Mata Pelajaran",
                  value: data.total_mapel ?? "-",
                  sub: "Kurikulum",
                  subColor: "text-[#3f4945]/60",
                },
                {
                  label: "Total Jadwal",
                  value: data.total_jadwal ?? "-",
                  sub: "95% Terset",
                  subColor: "text-[#006e2a]",
                  icon: "verified",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-500"
                >
                  <p className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mb-1">
                    {s.label}
                  </p>
                  <h4 className="text-2xl font-extrabold font-headline-card text-[#00342b]">
                    {s.value}
                  </h4>
                  <p
                    className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${s.subColor}`}
                  >
                    {s.icon && (
                      <span className="material-symbols-outlined text-xs">
                        {s.icon}
                      </span>
                    )}
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION: Kesiapan Akademik ── */}
        <section className="relative z-10">
          <div className="bg-white rounded-[2.5rem] p-10 border border-[#bfc9c4]/20 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left: Score + Alerts */}
              <div className="lg:w-1/3 space-y-8">
                <div>
                  <h2 className="font-headline-section text-[28px] text-[#00342b] font-extrabold tracking-tight mb-2">
                    Kesiapan Akademik
                  </h2>
                  <p className="text-[#3f4945]/70 text-sm font-medium">
                    Skor kesiapan operasional semester berdasarkan checklist
                    standar.
                  </p>
                </div>

                {/* Radial gauge */}
                <div className="flex items-center gap-6 bg-[#00342b]/5 p-6 rounded-3xl border border-[#00342b]/10">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        className="text-[#bfc9c4]/20"
                        cx="18"
                        cy="18"
                        fill="none"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <circle
                        className="text-[#006e2a]"
                        cx="18"
                        cy="18"
                        fill="none"
                        r="16"
                        stroke="currentColor"
                        strokeDasharray={`${healthScore}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-[#00342b] font-headline-card">
                        {healthScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse" />
                      <p className="text-sm font-bold text-[#00342b] uppercase tracking-wider">
                        Status:{" "}
                        {healthScore >= 80
                          ? "Good"
                          : healthScore >= 50
                            ? "Fair"
                            : "Needs Work"}
                      </p>
                    </div>
                    <p className="text-xs text-[#3f4945]/70 leading-relaxed">
                      {healthScore >= 80
                        ? "Siap untuk kegiatan akademik berjalan."
                        : "Perlu perhatian pada beberapa item checklist."}
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                  <div className="bg-[#ffdad6]/20 rounded-2xl p-5 border border-[#ba1a1a]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#ba1a1a]/10 flex items-center justify-center text-[#ba1a1a]">
                        <span className="material-symbols-outlined text-[20px]">
                          warning
                        </span>
                      </div>
                      <h4 className="text-[#ba1a1a] text-sm font-bold uppercase tracking-widest">
                        Needs Attention
                      </h4>
                    </div>
                    <ul className="space-y-2.5">
                      {alerts.map((a, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-[#3f4945] font-medium"
                        >
                          <span className="w-1 h-1 rounded-full bg-[#ba1a1a] mt-1.5 shrink-0" />
                          {a.msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right: Detailed Metrics */}
              <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {checkItems.map(({ key, label }) => {
                  const done = checklist[key];
                  const pct = done ? 100 : 0;
                  const barC = done ? "bg-[#006e2a]" : "bg-[#eaa300]";
                  const valC = done ? "text-[#00342b]" : "text-[#eaa300]";
                  return (
                    <MetricCard
                      key={key}
                      label={label}
                      value={done ? "100%" : "0%"}
                      icon={done ? "check_circle" : "pending"}
                      colorClass={valC}
                      barWidth={pct}
                      barColor={barC}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: Distribusi Siswa + Kalender Akademik ── */}
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Distribusi Siswa */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-xl flex flex-col h-full relative overflow-hidden group transition-all duration-500 hover:shadow-2xl">
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#69ff87]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2a] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006e2a]" />
                  </span>
                  <span className="text-[12px] font-bold text-[#006e2a] uppercase tracking-widest font-label-badge">
                    Live Data
                  </span>
                </div>
                <h3 className="font-headline-card text-2xl font-extrabold text-[#00342b] tracking-tight">
                  Distribusi{" "}
                  <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                    Siswa
                  </span>{" "}
                  per Kelas
                </h3>
                <p className="text-sm text-[#3f4945]/70 font-medium">
                  Populasi aktif {semester.nama} {ta.tahun}
                </p>
              </div>
              <button className="w-10 h-10 rounded-xl bg-[#eceeed]/50 flex items-center justify-center text-[#707975] hover:text-[#00342b] hover:bg-[#69ff87]/20 transition-all border border-[#bfc9c4]/20">
                <span className="material-symbols-outlined text-[20px]">
                  analytics
                </span>
              </button>
            </div>

            {/* Bar chart */}
            <div className="flex-1 flex flex-col justify-end relative z-10">
              <div className="relative flex-1 flex items-end justify-around gap-4 px-2 pb-10 mt-6 min-h-[120px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-10 pt-4 z-0">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-full h-[1px] bg-[#bfc9c4]/10" />
                  ))}
                </div>
                <div className="relative flex items-end justify-around gap-3 w-full h-full z-10">
                  {kelasFilter.slice(0, 6).map((k) => {
                    const maxS = Math.max(
                      ...kelasFilter.map((x) => x.total_siswa ?? 0),
                      1,
                    );
                    const pct = Math.max(
                      15,
                      Math.round(((k.total_siswa ?? 0) / maxS) * 90),
                    );
                    return (
                      <div
                        key={k.id}
                        className="flex-1 flex flex-col items-center gap-2 group/bar cursor-pointer h-full justify-end"
                      >
                        <div
                          className={`relative w-full max-w-[32px] bg-gradient-to-t from-[#00342b] to-[#006e2a] rounded-t-xl transition-all duration-500 group-hover/bar:scale-105 group-hover/bar:shadow-[0_0_15px_rgba(0,110,42,0.3)]`}
                          style={{ height: `${pct}%` }}
                        />
                        <span className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mt-1">
                          {k.nama_kelas}
                        </span>
                      </div>
                    );
                  })}
                  {kelasFilter.length === 0 && (
                    <div className="flex items-center justify-center w-full text-[#bfc9c4] text-sm">
                      Belum ada kelas
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#bfc9c4]/20 mt-4">
                {[
                  {
                    label: "Aktif",
                    value: totalSiswa,
                    color: "text-[#00342b]",
                    bg: "bg-[#00342b]/5",
                    border: "border-[#00342b]/10",
                  },
                  {
                    label: "Transfer",
                    value: data.total_siswa_transfer ?? 0,
                    color: "text-[#006e2a]",
                    bg: "bg-[#006e2a]/5",
                    border: "border-[#006e2a]/10",
                  },
                  {
                    label: "Tdk Aktif",
                    value: data.total_siswa_nonaktif ?? 0,
                    color: "text-[#ba1a1a]",
                    bg: "bg-[#ba1a1a]/5",
                    border: "border-[#ba1a1a]/10",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`flex flex-col items-center p-3 ${s.bg} rounded-2xl border ${s.border} hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer`}
                  >
                    <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest mb-1">
                      {s.label}
                    </span>
                    <span
                      className={`text-xl font-extrabold ${s.color} font-headline-card`}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kalender Akademik */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-sm flex flex-col h-full relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#006e2a]/20 hover:border-[#006e2a]/30">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#006e2a]/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-[#006e2a]/10 transition-colors duration-500" />
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <span
                  className="material-symbols-outlined text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  calendar_today
                </span>
              </div>
              <div>
                <h3 className="font-headline-card text-2xl font-extrabold text-[#00342b] tracking-tight">
                  Kalender{" "}
                  <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                    Akademik
                  </span>
                </h3>
                <p className="text-xs text-[#3f4945]/70 font-medium">
                  Agenda pendidikan semester ini
                </p>
              </div>
            </div>

            <div className="relative flex-1 z-10">
              <div className="absolute left-[23px] top-4 bottom-4 w-[1px] border-l border-dashed border-[#006e2a]/20" />
              {kalender.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#3f4945]/50 gap-3">
                  <span className="material-symbols-outlined text-5xl text-[#bfc9c4]">
                    event_busy
                  </span>
                  <p className="text-sm">Belum ada event kalender.</p>
                  <Link
                    to="/kepsek/kalender"
                    className="text-[#006e2a] text-xs font-bold hover:underline"
                  >
                    Tambah event →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {kalender.slice(0, 4).map((item) => (
                    <KalenderItem key={item.id} item={item} />
                  ))}
                  {kalender.length > 4 && (
                    <p className="pl-6 text-xs text-[#3f4945]/60 font-medium">
                      +{kalender.length - 4} event lainnya...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-[#bfc9c4]/20 relative z-10">
              <Link
                to="/kepsek/kalender"
                className="w-full py-3 bg-[#006e2a]/5 hover:bg-[#006e2a] hover:text-white text-[#006e2a] text-[11px] font-bold uppercase tracking-widest rounded-xl border border-[#006e2a]/20 transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-sm hover:shadow-md"
              >
                Lihat Kalender Lengkap
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover/btn:translate-x-2">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── SECTION: Mata Pelajaran ── */}
        <section className="relative z-10">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-[#006e2a]/10 px-3 py-1 rounded-full border border-[#006e2a]/20 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
                <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest">
                  MASTER DATA
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#bfc9c4]/30 to-transparent" />
            </div>
            <h2 className="font-headline-section text-3xl md:text-4xl font-extrabold text-[#00342b] tracking-tight">
              Mata{" "}
              <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                Pelajaran
              </span>
            </h2>
            <p className="text-[#3f4945] text-sm font-medium max-w-2xl leading-relaxed">
              Kelola daftar mata pelajaran inti dan koordinator akademik untuk
              memastikan standar kurikulum terpenuhi.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(data.mapel_list ?? []).slice(0, 4).map((mp, i) => {
              const icons = ["menu_book", "calculate", "science", "mosque"];
              const colorSets = [
                {
                  bg: "bg-[#006e2a]/5",
                  iconColor: "text-[#006e2a]",
                  hoverBg: "group-hover:bg-[#006e2a]",
                },
                {
                  bg: "bg-[#00342b]/5",
                  iconColor: "text-[#00342b]",
                  hoverBg: "group-hover:bg-[#00342b]",
                },
                {
                  bg: "bg-[#eaa300]/10",
                  iconColor: "text-[#eaa300]",
                  hoverBg: "group-hover:bg-[#eaa300]",
                },
                {
                  bg: "bg-[#006e2a]/5",
                  iconColor: "text-[#006e2a]",
                  hoverBg: "group-hover:bg-[#006e2a]",
                },
              ];
              const cs = colorSets[i % colorSets.length];
              const initials =
                mp.koordinator
                  ?.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "??";
              return (
                <div
                  key={mp.id}
                  className="group bg-white/80 backdrop-blur-md border border-white/60 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div
                      className={`w-14 h-14 rounded-2xl ${cs.bg} flex items-center justify-center ${cs.iconColor} ${cs.hoverBg} group-hover:text-white transition-all duration-500 shadow-inner`}
                    >
                      <span
                        className="material-symbols-outlined text-[32px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {icons[i % icons.length]}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${mp.is_active ? "bg-[#006e2a]/10 text-[#006e2a] border-[#006e2a]/20" : "bg-[#eceeed] text-[#3f4945] border-[#bfc9c4]/30"}`}
                      >
                        {mp.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-[#00342b] font-headline-card mb-6 group-hover:text-[#006e2a] transition-colors">
                    {mp.nama}
                  </h4>
                  <div className="flex items-center gap-3 p-3 bg-[#f2f4f3]/50 rounded-2xl border border-[#bfc9c4]/10 group-hover:border-[#006e2a]/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#004d40] flex items-center justify-center text-xs font-bold text-[#7ebdac] border-2 border-white shadow-sm">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
                        Koordinator
                      </span>
                      <span className="text-sm font-bold text-[#00342b]">
                        {mp.koordinator ?? "-"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {(data.mapel_list ?? []).length === 0 &&
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/50 border border-[#bfc9c4]/20 rounded-[2rem] p-6 flex items-center justify-center text-[#bfc9c4] min-h-[200px]"
                >
                  <span className="material-symbols-outlined text-4xl">
                    menu_book
                  </span>
                </div>
              ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              to="/operator/master/mapel"
              className="px-8 py-3 rounded-xl border border-[#006e2a]/30 text-[#006e2a] font-bold text-xs uppercase tracking-widest hover:bg-[#006e2a]/5 transition-all flex items-center gap-2 group"
            >
              Lihat Semua Mata Pelajaran
              <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>
          </div>
        </section>

        {/* ── SECTION: Kelas & Rombel ── */}
        <section className="relative z-10">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#00342b]/10 border border-[#00342b]/20 text-[10px] font-bold text-[#00342b] tracking-widest uppercase shadow-sm">
                MASTER DATA
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#bfc9c4]/30 to-transparent" />
            </div>
            <h2 className="font-headline-section text-4xl font-extrabold text-[#00342b] tracking-tight">
              Kelas &{" "}
              <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                Rombel
              </span>
            </h2>
            <p className="text-[#3f4945]/70 text-sm font-medium">
              Ringkasan pembagian rombongan belajar dan kapasitas kelas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kelasFilter.slice(0, 8).map((k) => (
              <div
                key={k.id}
                onClick={() => navigate(`/operator/master/kelas/${k.id}`)}
                className="bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">
                      door_front
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#006e2a] bg-[#006e2a]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Aktif
                  </span>
                </div>
                <h4 className="text-lg font-extrabold text-[#00342b] font-headline-card mb-4">
                  {k.nama_kelas}
                </h4>
                <div className="flex flex-col gap-2 pt-4 border-t border-[#bfc9c4]/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
                      Wali Kelas
                    </span>
                    <span className="text-xs font-bold text-[#00342b]">
                      {k.nama_wali ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
                      Siswa
                    </span>
                    <span className="text-xs font-bold text-[#006e2a]">
                      {k.total_siswa ?? 0} Siswa
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {kelasFilter.length === 0 && (
              <div className="col-span-4 flex items-center justify-center py-16 text-[#bfc9c4] gap-3">
                <span className="material-symbols-outlined text-5xl">
                  door_front
                </span>
                <p className="text-sm text-[#3f4945]/50">
                  Belum ada kelas untuk semester ini.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION: Ringkasan Akademik (Gauge + 4 Cards) ── */}
        <section className="relative z-10">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="inline-flex items-center gap-3 bg-[#00342b]/10 border border-[#00342b]/20 px-5 py-2 rounded-full w-fit">
                <span className="w-2 h-2 rounded-full bg-[#00342b] animate-pulse" />
                <span className="text-[#00342b] font-bold text-xs tracking-[0.25em] uppercase">
                  Ringkasan
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#00342b]/20 to-transparent" />
            </div>
            <h2 className="font-headline-section text-3xl md:text-4xl font-extrabold text-[#00342b] tracking-tight">
              Ringkasan{" "}
              <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                Akademik
              </span>
            </h2>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Gauge */}
              <div className="lg:col-span-5 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00342b] to-[#00342b] rounded-[2rem] shadow-2xl shadow-[#00342b]/20 transition-transform duration-500 group-hover:scale-[1.01]" />
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none rounded-[2rem] overflow-hidden"
                  style={{
                    backgroundImage:
                      "radial-gradient(#69ff87 0.5px, transparent 0.5px)",
                    backgroundSize: "15px 15px",
                  }}
                />
                <div className="relative z-10 h-full p-10 flex flex-col items-center justify-center text-center">
                  <div className="space-y-1 mb-8">
                    <p className="text-[10px] font-bold text-[#afefdd]/60 uppercase tracking-[0.3em]">
                      Academic Readiness
                    </p>
                    <div className="h-[1px] w-12 mx-auto bg-gradient-to-r from-transparent via-[#94d3c1]/40 to-transparent" />
                  </div>
                  <div className="relative w-56 h-56 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 rounded-full border border-white/5 scale-110" />
                    <div className="absolute inset-0 rounded-full border border-white/10 scale-125 opacity-30" />
                    <svg
                      className="w-full h-full transform -rotate-90 drop-shadow-[0_0_20px_rgba(105,255,135,0.4)]"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        className="text-white/5"
                        cx="18"
                        cy="18"
                        fill="none"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        className="text-[#3ce36a]"
                        cx="18"
                        cy="18"
                        fill="none"
                        r="16"
                        stroke="currentColor"
                        strokeDasharray={`${healthScore}, 100`}
                        strokeLinecap="round"
                        strokeWidth="2.5"
                        style={{
                          filter: "drop-shadow(0 0 12px rgba(105,255,135,0.6))",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="flex items-baseline">
                        <span className="text-7xl font-black text-white tracking-tighter font-headline-card">
                          {healthScore}
                        </span>
                        <span className="text-2xl font-bold text-[#3ce36a] ml-1">
                          %
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mt-[-4px]">
                        Readiness Score
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="inline-flex items-center gap-2.5 bg-[#3ce36a]/10 backdrop-blur-xl px-6 py-2.5 rounded-full border border-[#3ce36a]/20 shadow-[0_0_20px_rgba(105,255,135,0.1)]">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ce36a] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3ce36a]" />
                      </span>
                      <span className="text-xs font-black text-[#3ce36a] uppercase tracking-[0.15em]">
                        Status:{" "}
                        {healthScore >= 80
                          ? "Optimal"
                          : healthScore >= 50
                            ? "Fair"
                            : "Needs Work"}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 font-medium max-w-[220px] leading-relaxed italic font-serif-accent">
                      "Exceeding operational benchmarks for the current academic
                      term"
                    </p>
                  </div>
                </div>
              </div>

              {/* 2x2 Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    icon: "person_off",
                    badge: "Attention",
                    badgeCls:
                      "bg-[#3f2900]/10 text-[#eaa300] border-[#3f2900]/20",
                    iconBg: "bg-[#3f2900]/10",
                    iconColor: "text-[#eaa300]",
                    title: "Penugasan Guru",
                    desc: checklist.guru_mengajar
                      ? "Semua guru sudah memiliki penugasan kelas."
                      : "Ada guru yang belum memiliki penugasan kelas semester ini.",
                  },
                  {
                    icon: "pending_actions",
                    badge: checklist.jadwal_selesai ? "Done" : "Pending",
                    badgeCls: checklist.jadwal_selesai
                      ? "bg-[#006e2a]/10 text-[#006e2a] border-[#006e2a]/20"
                      : "bg-[#ba1a1a]/10 text-[#ba1a1a] border-[#ba1a1a]/20",
                    iconBg: checklist.jadwal_selesai
                      ? "bg-[#006e2a]/10"
                      : "bg-[#ba1a1a]/10",
                    iconColor: checklist.jadwal_selesai
                      ? "text-[#006e2a]"
                      : "text-[#ba1a1a]",
                    title: "Konfigurasi Jadwal",
                    desc: checklist.jadwal_selesai
                      ? "Jadwal pelajaran sudah terkonfigurasi lengkap."
                      : "Pengaturan jadwal pelajaran belum selesai.",
                  },
                  {
                    icon: "verified",
                    badge: "Verified",
                    badgeCls:
                      "bg-[#006e2a]/10 text-[#006e2a] border-[#006e2a]/20",
                    iconBg: "bg-[#006e2a]/10",
                    iconColor: "text-[#006e2a]",
                    title: "Kurikulum Inti",
                    desc: "Semua mata pelajaran inti telah dikonfigurasi untuk semester ini.",
                  },
                  {
                    icon: "group_add",
                    badge: checklist.siswa_terdistribusi
                      ? "Done"
                      : "In Progress",
                    badgeCls: checklist.siswa_terdistribusi
                      ? "bg-[#006e2a]/10 text-[#006e2a] border-[#006e2a]/20"
                      : "bg-[#00342b]/10 text-[#00342b] border-[#00342b]/20",
                    iconBg: "bg-[#00342b]/10",
                    iconColor: "text-[#00342b]",
                    title: "Distribusi Siswa",
                    desc: checklist.siswa_terdistribusi
                      ? `${totalSiswa} siswa sudah terdistribusi ke ${totalKelas} kelas.`
                      : "Proses distribusi siswa ke kelas sedang berjalan.",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="p-6 bg-white/60 backdrop-blur-md border border-white/80 rounded-[2rem] flex flex-col justify-between hover:bg-white/80 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center ${c.iconColor} group-hover:scale-110 transition-transform`}
                      >
                        <span
                          className="material-symbols-outlined text-3xl"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {c.icon}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full ${c.badgeCls} text-[10px] font-bold uppercase tracking-wider border`}
                      >
                        {c.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#00342b] mb-2 font-headline-card">
                        {c.title}
                      </h4>
                      <p className="text-sm text-[#3f4945]/70 leading-relaxed">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: Absensi Semester ── */}
        <section className="relative z-10">
          {/* Section Header */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#006e2a]/5 border border-[#006e2a]/10 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2a] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006e2a]" />
                </span>
                <span className="material-symbols-outlined text-[#006e2a] text-[16px]">
                  co_present
                </span>
                <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-[0.3em]">
                  Operasional Semester
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
            </div>
            <h2 className="font-headline-section text-3xl md:text-4xl font-extrabold text-[#00342b] tracking-tight">
              Data{" "}
              <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                Absensi
              </span>
            </h2>
            <p className="text-[#3f4945]/70 text-sm font-medium max-w-xl leading-relaxed">
              Rekap kehadiran siswa sepanjang Semester {semester.nama}{" "}
              {ta.tahun}.
            </p>
          </div>

          {(() => {
            const absensi = data.absensi_rekap ?? null;
            const totalSiswaAbsen = absensi?.total_siswa ?? totalSiswa;
            const totalHadir = absensi?.hadir ?? null;
            const totalSakit = absensi?.sakit ?? null;
            const totalIzin = absensi?.izin ?? null;
            const totalAlpa = absensi?.alpa ?? null;
            const totalPertemuan =
              (totalHadir ?? 0) +
              (totalSakit ?? 0) +
              (totalIzin ?? 0) +
              (totalAlpa ?? 0);
            const pctHadir =
              totalPertemuan > 0
                ? Math.round(((totalHadir ?? 0) / totalPertemuan) * 100)
                : null;
            const siswaAdaData = absensi?.siswa_ada_data ?? null;
            const siswaBelumData = absensi?.siswa_belum_data ?? null;
            const siswaBermasalah = absensi?.siswa_bermasalah ?? null;
            const hasData = absensi !== null;

            return (
              <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/50 shadow-xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#006e2a]/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#00342b]/5 rounded-full blur-[80px] pointer-events-none" />

                {!hasData ? (
                  /* ── Empty State ── */
                  <div className="relative z-10 flex flex-col items-center justify-center py-16 gap-5 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-[#006e2a]/5 flex items-center justify-center text-[#006e2a]/40">
                      <span className="material-symbols-outlined text-[48px]">
                        event_busy
                      </span>
                    </div>
                    <div>
                      <p className="font-headline-card text-lg font-bold text-[#00342b] mb-1">
                        Belum Ada Data Absensi
                      </p>
                      <p className="text-sm text-[#3f4945]/60 max-w-sm leading-relaxed">
                        Data absensi akan muncul setelah guru mulai merekap
                        kehadiran siswa pada semester ini.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#eaa300]/10 border border-[#eaa300]/20">
                      <span className="w-2 h-2 rounded-full bg-[#eaa300] animate-pulse" />
                      <span className="text-[11px] font-bold text-[#eaa300] uppercase tracking-wider">
                        Menunggu Input Absensi
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {/* Top row: persentase kehadiran besar + ringkasan */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                      {/* Kiri: Gauge kehadiran */}
                      <div className="lg:col-span-4">
                        <div className="bg-gradient-to-br from-[#00342b] to-[#006e2a] rounded-[2rem] p-8 text-center relative overflow-hidden h-full flex flex-col items-center justify-center gap-4">
                          <div
                            className="absolute inset-0 opacity-[0.08] pointer-events-none rounded-[2rem] overflow-hidden"
                            style={{
                              backgroundImage:
                                "radial-gradient(#69ff87 0.5px, transparent 0.5px)",
                              backgroundSize: "14px 14px",
                            }}
                          />
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] relative z-10">
                            Tingkat Kehadiran
                          </p>
                          <div className="relative w-36 h-36 z-10">
                            <svg
                              className="w-full h-full -rotate-90"
                              viewBox="0 0 36 36"
                            >
                              <circle
                                cx="18"
                                cy="18"
                                fill="none"
                                r="15"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="3.5"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                fill="none"
                                r="15"
                                stroke="#69ff87"
                                strokeDasharray={`${pctHadir ?? 0}, 100`}
                                strokeLinecap="round"
                                strokeWidth="3.5"
                                style={{
                                  filter:
                                    "drop-shadow(0 0 8px rgba(105,255,135,0.5))",
                                }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-4xl font-black text-white font-headline-card leading-none">
                                {pctHadir !== null ? `${pctHadir}%` : "—"}
                              </span>
                              <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-1">
                                Hadir
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#69ff87]/15 border border-[#69ff87]/20 z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#69ff87] animate-pulse" />
                            <span className="text-[10px] font-black text-[#69ff87] uppercase tracking-wider">
                              {(pctHadir ?? 0) >= 90
                                ? "Sangat Baik"
                                : (pctHadir ?? 0) >= 75
                                  ? "Cukup Baik"
                                  : "Perlu Perhatian"}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/30 z-10">
                            {totalPertemuan.toLocaleString("id-ID")} total
                            pertemuan direkap
                          </p>
                        </div>
                      </div>

                      {/* Kanan: Breakdown hadir/sakit/izin/alpa */}
                      <div className="lg:col-span-8 grid grid-cols-2 gap-4">
                        {[
                          {
                            label: "Hadir",
                            value: totalHadir,
                            icon: "check_circle",
                            color: "#006e2a",
                            bg: "bg-[#006e2a]/5",
                            border: "border-[#006e2a]/15",
                            pct: pctHadir,
                          },
                          {
                            label: "Sakit",
                            value: totalSakit,
                            icon: "medical_services",
                            color: "#eaa300",
                            bg: "bg-[#eaa300]/5",
                            border: "border-[#eaa300]/15",
                            pct:
                              totalPertemuan > 0
                                ? Math.round(
                                    ((totalSakit ?? 0) / totalPertemuan) * 100,
                                  )
                                : null,
                          },
                          {
                            label: "Izin",
                            value: totalIzin,
                            icon: "assignment_turned_in",
                            color: "#00342b",
                            bg: "bg-[#00342b]/5",
                            border: "border-[#00342b]/15",
                            pct:
                              totalPertemuan > 0
                                ? Math.round(
                                    ((totalIzin ?? 0) / totalPertemuan) * 100,
                                  )
                                : null,
                          },
                          {
                            label: "Alpa",
                            value: totalAlpa,
                            icon: "cancel",
                            color: "#ba1a1a",
                            bg: "bg-[#ba1a1a]/5",
                            border: "border-[#ba1a1a]/15",
                            pct:
                              totalPertemuan > 0
                                ? Math.round(
                                    ((totalAlpa ?? 0) / totalPertemuan) * 100,
                                  )
                                : null,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`${item.bg} ${item.border} border rounded-[1.5rem] p-5 sm:p-6 flex flex-col gap-3 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg group`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                                style={{ background: `${item.color}18` }}
                              >
                                <span
                                  className="material-symbols-outlined text-[20px]"
                                  style={{
                                    color: item.color,
                                    fontVariationSettings: "'FILL' 1",
                                  }}
                                >
                                  {item.icon}
                                </span>
                              </div>
                              {item.pct !== null && (
                                <span
                                  className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                                  style={{
                                    color: item.color,
                                    background: `${item.color}12`,
                                    borderColor: `${item.color}25`,
                                  }}
                                >
                                  {item.pct}%
                                </span>
                              )}
                            </div>
                            <div>
                              <p
                                className="text-3xl font-black font-headline-card leading-none mb-1"
                                style={{
                                  color:
                                    item.value === null
                                      ? "#bfc9c4"
                                      : item.color,
                                }}
                              >
                                {item.value !== null
                                  ? item.value.toLocaleString("id-ID")
                                  : "—"}
                              </p>
                              <p className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider">
                                {item.label}
                              </p>
                            </div>
                            {item.pct !== null && (
                              <div className="w-full h-1.5 bg-[#e6e9e8] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${item.pct}%`,
                                    background: item.color,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom row: status siswa */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#bfc9c4]/15">
                      {[
                        {
                          label: "Siswa Ada Data Absensi",
                          value: siswaAdaData,
                          icon: "group",
                          color: "#006e2a",
                          sub:
                            totalSiswaAbsen > 0 && siswaAdaData !== null
                              ? `${Math.round((siswaAdaData / totalSiswaAbsen) * 100)}% dari total`
                              : null,
                        },
                        {
                          label: "Siswa Belum Ada Data",
                          value: siswaBelumData,
                          icon: "person_off",
                          color: "#eaa300",
                          sub:
                            siswaBelumData !== null && siswaBelumData > 0
                              ? "Perlu segera direkap"
                              : siswaBelumData === 0
                                ? "Semua sudah direkap"
                                : null,
                          isWarning:
                            siswaBelumData !== null && siswaBelumData > 0,
                        },
                        {
                          label: "Siswa Bermasalah",
                          value: siswaBermasalah,
                          icon: "warning",
                          color: "#ba1a1a",
                          sub:
                            siswaBermasalah !== null && siswaBermasalah > 0
                              ? "Kehadiran di bawah standar"
                              : siswaBermasalah === 0
                                ? "Tidak ada masalah"
                                : null,
                          isWarning:
                            siswaBermasalah !== null && siswaBermasalah > 0,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${item.isWarning ? "bg-[#ba1a1a]/5 border-[#ba1a1a]/15" : "bg-[#f8faf9] border-[#bfc9c4]/20"}`}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${item.color}18` }}
                          >
                            <span
                              className="material-symbols-outlined text-[22px]"
                              style={{ color: item.color }}
                            >
                              {item.icon}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider mb-0.5 leading-tight">
                              {item.label}
                            </p>
                            <p
                              className="text-xl font-black font-headline-card"
                              style={{
                                color:
                                  item.value === null ? "#bfc9c4" : item.color,
                              }}
                            >
                              {item.value !== null
                                ? item.value.toLocaleString("id-ID")
                                : "—"}
                            </p>
                            {item.sub && (
                              <p className="text-[10px] text-[#3f4945]/50 mt-0.5">
                                {item.sub}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        {/* ── SECTION: Penilaian Semester ── */}
        <section className="relative z-10">
          {/* Section Header */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#00342b]/5 border border-[#00342b]/10 w-fit">
                <span className="material-symbols-outlined text-[#00342b] text-[16px]">
                  grade
                </span>
                <span className="text-[10px] font-bold text-[#00342b] uppercase tracking-[0.3em]">
                  Akademik
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#00342b]/20 to-transparent" />
            </div>
            <h2 className="font-headline-section text-3xl md:text-4xl font-extrabold text-[#00342b] tracking-tight">
              Data{" "}
              <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                Penilaian
              </span>
            </h2>
            <p className="text-[#3f4945]/70 text-sm font-medium max-w-xl leading-relaxed">
              Kelengkapan input nilai siswa Semester {semester.nama} {ta.tahun}.
            </p>
          </div>

          {(() => {
            const nilai = data.penilaian_rekap ?? null;
            const mapelDinilai = nilai?.mapel_dinilai ?? null;
            const mapelBelumLengkap = nilai?.mapel_belum_lengkap ?? null;
            const guruInputNilai = nilai?.guru_input_nilai ?? null;
            const siswaSudahDinilai = nilai?.siswa_sudah_dinilai ?? null;
            const siswaBelumDinilai = nilai?.siswa_belum_dinilai ?? null;
            const pctKelengkapan = nilai?.pct_kelengkapan ?? null;
            const totalMapelSem = data.total_mapel ?? 0;
            const hasData = nilai !== null;

            const pctMapel =
              mapelDinilai !== null && totalMapelSem > 0
                ? Math.round((mapelDinilai / totalMapelSem) * 100)
                : null;
            const pctSiswa =
              siswaSudahDinilai !== null && totalSiswa > 0
                ? Math.round((siswaSudahDinilai / totalSiswa) * 100)
                : null;

            return (
              <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/50 shadow-xl relative overflow-hidden">
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#00342b]/5 rounded-full blur-[100px] pointer-events-none" />

                {!hasData ? (
                  /* ── Empty State ── */
                  <div className="relative z-10 flex flex-col items-center justify-center py-16 gap-5 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-[#00342b]/5 flex items-center justify-center text-[#00342b]/30">
                      <span className="material-symbols-outlined text-[48px]">
                        assignment_late
                      </span>
                    </div>
                    <div>
                      <p className="font-headline-card text-lg font-bold text-[#00342b] mb-1">
                        Belum Ada Data Penilaian
                      </p>
                      <p className="text-sm text-[#3f4945]/60 max-w-sm leading-relaxed">
                        Data nilai siswa akan tersedia setelah guru mulai
                        menginput nilai pada semester ini.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#eaa300]/10 border border-[#eaa300]/20">
                      <span className="w-2 h-2 rounded-full bg-[#eaa300] animate-pulse" />
                      <span className="text-[11px] font-bold text-[#eaa300] uppercase tracking-wider">
                        Menunggu Input Nilai
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {/* Progress kelengkapan nilai — utama */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                      {/* Kiri: Kelengkapan besar */}
                      <div className="lg:col-span-5">
                        <div className="bg-[#f8faf9] border border-[#bfc9c4]/20 rounded-[2rem] p-8 h-full flex flex-col justify-between gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.25em] mb-3">
                              Kelengkapan Nilai
                            </p>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-6xl font-black text-[#00342b] font-headline-card leading-none">
                                {pctKelengkapan !== null
                                  ? pctKelengkapan
                                  : (pctSiswa ?? "—")}
                              </span>
                              {(pctKelengkapan ?? pctSiswa) !== null && (
                                <span className="text-2xl font-bold text-[#006e2a]">
                                  %
                                </span>
                              )}
                            </div>
                            <p className="text-[#3f4945]/60 text-sm">
                              {siswaSudahDinilai !== null
                                ? `${siswaSudahDinilai.toLocaleString("id-ID")} dari ${totalSiswa.toLocaleString("id-ID")} siswa sudah memiliki nilai`
                                : ""}
                            </p>
                          </div>

                          {/* Dual progress bars */}
                          <div className="space-y-4">
                            {/* Mapel */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider">
                                  Mapel Selesai
                                </span>
                                <span className="text-[11px] font-black text-[#006e2a]">
                                  {mapelDinilai !== null ? mapelDinilai : "—"} /{" "}
                                  {totalMapelSem}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-[#e6e9e8] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#006e2a] rounded-full transition-all duration-700"
                                  style={{ width: `${pctMapel ?? 0}%` }}
                                />
                              </div>
                            </div>
                            {/* Siswa */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider">
                                  Siswa Dinilai
                                </span>
                                <span className="text-[11px] font-black text-[#00342b]">
                                  {siswaSudahDinilai !== null
                                    ? siswaSudahDinilai
                                    : "—"}{" "}
                                  / {totalSiswa}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-[#e6e9e8] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#00342b] rounded-full transition-all duration-700"
                                  style={{ width: `${pctSiswa ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit text-[10px] font-black uppercase tracking-wider
                            ${
                              (pctKelengkapan ?? pctSiswa ?? 0) >= 90
                                ? "bg-[#006e2a]/10 border-[#006e2a]/20 text-[#006e2a]"
                                : (pctKelengkapan ?? pctSiswa ?? 0) >= 60
                                  ? "bg-[#eaa300]/10 border-[#eaa300]/20 text-[#eaa300]"
                                  : "bg-[#ba1a1a]/10 border-[#ba1a1a]/20 text-[#ba1a1a]"
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{
                                background:
                                  (pctKelengkapan ?? pctSiswa ?? 0) >= 90
                                    ? "#006e2a"
                                    : (pctKelengkapan ?? pctSiswa ?? 0) >= 60
                                      ? "#eaa300"
                                      : "#ba1a1a",
                              }}
                            />
                            {(pctKelengkapan ?? pctSiswa ?? 0) >= 90
                              ? "Hampir Lengkap"
                              : (pctKelengkapan ?? pctSiswa ?? 0) >= 60
                                ? "Sedang Berjalan"
                                : "Perlu Perhatian"}
                          </div>
                        </div>
                      </div>

                      {/* Kanan: 4 metric cards */}
                      <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                        {[
                          {
                            label: "Mapel Dinilai",
                            value: mapelDinilai,
                            total: totalMapelSem,
                            icon: "menu_book",
                            color: "#006e2a",
                            sub:
                              pctMapel !== null ? `${pctMapel}% selesai` : null,
                          },
                          {
                            label: "Mapel Belum Lengkap",
                            value: mapelBelumLengkap,
                            icon: "pending_actions",
                            color: "#ba1a1a",
                            sub:
                              mapelBelumLengkap === 0
                                ? "Semua mapel selesai"
                                : mapelBelumLengkap !== null
                                  ? "Perlu dilengkapi"
                                  : null,
                            isGood: mapelBelumLengkap === 0,
                          },
                          {
                            label: "Guru Input Nilai",
                            value: guruInputNilai,
                            icon: "person_celebrate",
                            color: "#00342b",
                            sub:
                              guruInputNilai !== null
                                ? `dari ${data.total_guru ?? "?"} guru mengajar`
                                : null,
                          },
                          {
                            label: "Siswa Belum Dinilai",
                            value: siswaBelumDinilai,
                            icon: "person_off",
                            color: "#eaa300",
                            sub:
                              siswaBelumDinilai === 0
                                ? "Semua siswa sudah dinilai"
                                : siswaBelumDinilai !== null
                                  ? "Perlu segera dilengkapi"
                                  : null,
                            isGood: siswaBelumDinilai === 0,
                          },
                        ].map((item) => {
                          const finalColor = item.isGood
                            ? "#006e2a"
                            : item.color;
                          return (
                            <div
                              key={item.label}
                              className="bg-white border border-[#bfc9c4]/20 rounded-[1.5rem] p-5 sm:p-6 flex flex-col justify-between gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                                  style={{ background: `${finalColor}18` }}
                                >
                                  <span
                                    className="material-symbols-outlined text-[20px]"
                                    style={{
                                      color: finalColor,
                                      fontVariationSettings: "'FILL' 1",
                                    }}
                                  >
                                    {item.isGood ? "check_circle" : item.icon}
                                  </span>
                                </div>
                                {item.sub && (
                                  <span
                                    className="text-[9px] font-bold px-2 py-0.5 rounded-full border leading-tight text-right max-w-[100px]"
                                    style={{
                                      color: finalColor,
                                      background: `${finalColor}10`,
                                      borderColor: `${finalColor}22`,
                                    }}
                                  >
                                    {item.sub}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p
                                  className="text-2xl font-black font-headline-card leading-none mb-1"
                                  style={{
                                    color:
                                      item.value === null
                                        ? "#bfc9c4"
                                        : finalColor,
                                  }}
                                >
                                  {item.value !== null
                                    ? item.value.toLocaleString("id-ID")
                                    : "—"}
                                  {item.total !== undefined &&
                                    item.value !== null && (
                                      <span className="text-base font-bold text-[#3f4945]/30 ml-1">
                                        /{item.total}
                                      </span>
                                    )}
                                </p>
                                <p className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider">
                                  {item.label}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        {/* ── SECTION: Rapor Semester ── */}
        <section className="relative z-10">
          {/* Section Header */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#006e2a]/5 border border-[#006e2a]/10 w-fit">
                <span className="material-symbols-outlined text-[#006e2a] text-[16px]">
                  description
                </span>
                <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-[0.3em]">
                  Hasil Akhir
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
            </div>
            <h2 className="font-headline-section text-3xl md:text-4xl font-extrabold text-[#00342b] tracking-tight">
              Status{" "}
              <span className="font-serif-accent italic font-normal text-[#3ce36a]">
                Rapor
              </span>
            </h2>
            <p className="text-[#3f4945]/70 text-sm font-medium max-w-xl leading-relaxed">
              Progres pengisian, verifikasi, dan distribusi rapor Semester{" "}
              {semester.nama} {ta.tahun}.
            </p>
          </div>

          {(() => {
            const rapor = data.rapor_rekap ?? null;
            const belumLengkap = rapor?.belum_lengkap ?? null;
            const sudahLengkap = rapor?.sudah_lengkap ?? null;
            const diverifikasi = rapor?.diverifikasi ?? null;
            const siapCetak = rapor?.siap_cetak ?? null;
            const sudahDicetak = rapor?.sudah_dicetak ?? null;
            const tglBagi = rapor?.tanggal_pembagian ?? null;
            const isGenap = semester.nama?.toLowerCase() === "genap";
            const kenaikan = data.kenaikan_kelas ?? null;
            const hasData = rapor !== null;
            const pctRapor =
              sudahLengkap !== null && totalSiswa > 0
                ? Math.round((sudahLengkap / totalSiswa) * 100)
                : null;

            const raporStages = [
              {
                label: "Belum Lengkap",
                value: belumLengkap,
                icon: "edit_note",
                color: "#eaa300",
                isWarning: belumLengkap !== null && belumLengkap > 0,
              },
              {
                label: "Sudah Lengkap",
                value: sudahLengkap,
                icon: "assignment_turned_in",
                color: "#006e2a",
              },
              {
                label: "Diverifikasi",
                value: diverifikasi,
                icon: "verified",
                color: "#00342b",
              },
              {
                label: "Siap Cetak",
                value: siapCetak,
                icon: "print",
                color: "#006e2a",
              },
              {
                label: "Sudah Dicetak",
                value: sudahDicetak,
                icon: "task_alt",
                color: "#3f4945",
              },
            ];

            return (
              <div className="space-y-6">
                {/* Card Rapor Utama */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/50 shadow-xl relative overflow-hidden">
                  <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-[#006e2a]/5 rounded-full blur-[90px] pointer-events-none" />

                  {!hasData ? (
                    /* ── Empty State ── */
                    <div className="relative z-10 flex flex-col items-center justify-center py-16 gap-5 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-[#006e2a]/5 flex items-center justify-center text-[#006e2a]/30">
                        <span className="material-symbols-outlined text-[48px]">
                          description
                        </span>
                      </div>
                      <div>
                        <p className="font-headline-card text-lg font-bold text-[#00342b] mb-1">
                          Rapor Belum Diproses
                        </p>
                        <p className="text-sm text-[#3f4945]/60 max-w-sm leading-relaxed">
                          Pengisian rapor dimulai setelah semua nilai siswa
                          sudah diinput dan divalidasi.
                        </p>
                      </div>
                      {tglBagi && (
                        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#006e2a]/5 border border-[#006e2a]/15">
                          <span className="material-symbols-outlined text-[#006e2a] text-[18px]">
                            event
                          </span>
                          <div className="text-left">
                            <p className="text-[9px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
                              Rencana Pembagian
                            </p>
                            <p className="text-sm font-bold text-[#00342b]">
                              {new Date(tglBagi).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#eaa300]/10 border border-[#eaa300]/20">
                        <span className="w-2 h-2 rounded-full bg-[#eaa300] animate-pulse" />
                        <span className="text-[11px] font-bold text-[#eaa300] uppercase tracking-wider">
                          Menunggu Nilai Lengkap
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      {/* Header baris: pct besar + tanggal bagi */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div>
                          <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.25em] mb-2">
                            Rapor Selesai
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-[#006e2a] font-headline-card leading-none">
                              {pctRapor !== null ? pctRapor : "—"}
                            </span>
                            {pctRapor !== null && (
                              <span className="text-2xl font-bold text-[#006e2a]">
                                %
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#3f4945]/60 mt-1">
                            {sudahLengkap !== null
                              ? `${sudahLengkap.toLocaleString("id-ID")} dari ${totalSiswa.toLocaleString("id-ID")} rapor selesai`
                              : ""}
                          </p>
                        </div>

                        {/* Tanggal & status cetak */}
                        <div className="flex flex-col gap-3">
                          {tglBagi && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#006e2a]/5 border border-[#006e2a]/15">
                              <span className="material-symbols-outlined text-[#006e2a] text-[20px]">
                                event
                              </span>
                              <div>
                                <p className="text-[9px] font-bold text-[#3f4945]/50 uppercase tracking-wider">
                                  Pembagian Rapor
                                </p>
                                <p className="text-sm font-bold text-[#00342b]">
                                  {new Date(tglBagi).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                          <div
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border ${(sudahDicetak ?? 0) > 0 ? "bg-[#006e2a]/5 border-[#006e2a]/15" : "bg-[#f8faf9] border-[#bfc9c4]/20"}`}
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{
                                color:
                                  (sudahDicetak ?? 0) > 0
                                    ? "#006e2a"
                                    : "#bfc9c4",
                              }}
                            >
                              print
                            </span>
                            <span
                              className="text-xs font-bold"
                              style={{
                                color:
                                  (sudahDicetak ?? 0) > 0
                                    ? "#006e2a"
                                    : "#3f4945",
                              }}
                            >
                              {(sudahDicetak ?? 0) > 0
                                ? `${(sudahDicetak ?? 0).toLocaleString("id-ID")} rapor sudah dicetak`
                                : "Belum ada rapor dicetak"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar + pipeline stages */}
                      <div className="mb-6">
                        <div className="w-full h-2.5 bg-[#e6e9e8] rounded-full overflow-hidden mb-5">
                          <div
                            className="h-full bg-gradient-to-r from-[#006e2a] to-[#69ff87] rounded-full transition-all duration-700"
                            style={{ width: `${pctRapor ?? 0}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {raporStages.map((stage) => (
                            <div
                              key={stage.label}
                              className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all duration-300 hover:shadow-md
                                ${stage.isWarning ? "bg-[#eaa300]/5 border-[#eaa300]/20" : "bg-[#f8faf9] border-[#bfc9c4]/20"}`}
                            >
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                  background: `${stage.isWarning ? "#eaa300" : stage.color}18`,
                                }}
                              >
                                <span
                                  className="material-symbols-outlined text-[16px]"
                                  style={{
                                    color: stage.isWarning
                                      ? "#eaa300"
                                      : stage.color,
                                    fontVariationSettings: "'FILL' 1",
                                  }}
                                >
                                  {stage.icon}
                                </span>
                              </div>
                              <p
                                className="text-lg font-black font-headline-card leading-none"
                                style={{
                                  color:
                                    stage.value === null
                                      ? "#bfc9c4"
                                      : stage.isWarning
                                        ? "#eaa300"
                                        : stage.color,
                                }}
                              >
                                {stage.value !== null
                                  ? stage.value.toLocaleString("id-ID")
                                  : "—"}
                              </p>
                              <p className="text-[9px] font-bold text-[#3f4945]/60 uppercase tracking-wider leading-tight">
                                {stage.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Kenaikan Kelas — hanya tampil di Semester Genap */}
                {isGenap && (
                  <div className="bg-[#00342b] rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,52,43,0.25)] relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-[0.06] pointer-events-none rounded-[2.5rem] overflow-hidden"
                      style={{
                        backgroundImage:
                          "radial-gradient(#69ff87 0.5px, transparent 0.5px)",
                        backgroundSize: "16px 16px",
                      }}
                    />
                    <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#69ff87]/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-[#69ff87]/10 flex items-center justify-center text-[#69ff87]">
                          <span
                            className="material-symbols-outlined text-[26px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            trending_up
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.25em]">
                            Semester Genap
                          </p>
                          <h3 className="text-xl font-extrabold text-white font-headline-card tracking-tight">
                            Kenaikan Kelas
                          </h3>
                        </div>
                      </div>

                      {kenaikan === null ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#eaa300]/10 border border-[#eaa300]/20">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#eaa300] animate-pulse" />
                            <span className="text-sm font-bold text-[#eaa300] uppercase tracking-wider">
                              Belum Diproses
                            </span>
                          </div>
                          <p className="text-white/40 text-sm leading-relaxed">
                            Proses kenaikan kelas akan tersedia setelah seluruh
                            nilai rapor selesai dan terverifikasi.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/10 transition-all duration-300"
                            >
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${item.color}20` }}
                              >
                                <span
                                  className="material-symbols-outlined text-[20px]"
                                  style={{ color: item.color }}
                                >
                                  {item.icon}
                                </span>
                              </div>
                              <p
                                className="text-3xl font-black font-headline-card leading-none"
                                style={{
                                  color:
                                    item.value === null
                                      ? "rgba(255,255,255,0.15)"
                                      : item.color,
                                }}
                              >
                                {item.value !== null
                                  ? item.value.toLocaleString("id-ID")
                                  : "—"}
                              </p>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-tight">
                                {item.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        {/* ── SECTION: Navigasi Semester ── */}
        <section className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {semLain ? (
              <Link
                to={`/operator/master/tahun-ajaran/${taId}/semester/${semLain.nama}`}
                className="group flex items-center gap-5 p-6 bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-3xl hover:border-[#006e2a]/30 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#3f4945] group-hover:text-[#006e2a] group-hover:scale-110 transition-all duration-500 shadow-sm">
                  <span className="material-symbols-outlined">arrow_back</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em] mb-1">
                    Semester Lainnya
                  </span>
                  <span className="text-lg font-extrabold text-[#00342b] font-headline-card group-hover:text-[#006e2a] transition-colors">
                    {ta.tahun} — {semLain.nama}
                  </span>
                </div>
              </Link>
            ) : (
              <div />
            )}
            <Link
              to={`/operator/master/tahun-ajaran/${taId}`}
              className="group flex items-center justify-end gap-5 p-6 bg-[#f2f4f3]/50 border border-[#bfc9c4]/20 rounded-3xl hover:border-[#006e2a]/30 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500 text-right"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em] mb-1">
                  Kembali ke
                </span>
                <span className="text-lg font-extrabold text-[#00342b] font-headline-card group-hover:text-[#006e2a] transition-colors">
                  Tahun Ajaran {ta.tahun}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#3f4945] group-hover:text-[#006e2a] group-hover:scale-110 transition-all duration-500 shadow-sm">
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
