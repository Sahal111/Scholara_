import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import { tahunAjaranKeys } from "../../../../hooks/api/useTahunAjaran";
import ModalTahunAjaranComp from "./components/ModalTahunAjaran";
import ModalChecklistKesiapanComp from "./components/ModalChecklistKesiapan";
import {
  fmt,
  fmtLong,
  daysBetween,
  daysRemaining,
  calcProgress,
} from "./utils/tahunAjaranHelpers";

// ── Alias — komponen dipindah ke ./components/ ────────────────────────────────
const ModalEditTahunAjaran = ModalTahunAjaranComp;
const ModalChecklistKesiapan = ModalChecklistKesiapanComp;

// ── Main Page Component ──────────────────────────────────────────────────────
export default function DetailTahunAjaran() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [searchKelas, setSearchKelas] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tahunAjaranKeys.detail(id),
    queryFn: () =>
      api.get(`/operator/master-data/tahun-ajaran/${id}`).then((r) => r.data),
    retry: false, // ← jangan retry, biar error langsung kelihatan
    staleTime: 30_000,
  });

  const setAktif = useMutation({
    mutationFn: () =>
      api.patch(`/operator/master-data/tahun-ajaran/${id}/aktif`),
    onSuccess: () => {
      toast.success("Tahun ajaran berhasil diaktifkan.");
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ?? "Gagal mengaktifkan tahun ajaran.",
      ),
  });

  const setSemesterAktif = useMutation({
    mutationFn: (semesterNama) =>
      api.patch(`/operator/master-data/tahun-ajaran/${id}/semester-aktif`, {
        semester_nama: semesterNama,
      }),
    onSuccess: (_, semesterNama) => {
      toast.success(`Semester ${semesterNama} berhasil diaktifkan.`);
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ?? "Gagal mengganti semester aktif.",
      ),
  });

  const arsipkanTA = useMutation({
    mutationFn: () => api.delete(`/operator/master-data/tahun-ajaran/${id}`),
    onSuccess: () => {
      toast.success("Tahun ajaran berhasil diarsipkan.");
      navigate("/operator/master/tahun-ajaran");
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ?? "Gagal mengarsipkan tahun ajaran.",
      ),
  });

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMoreMenuOpen(false);
    if (moreMenuOpen) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [moreMenuOpen]);

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <div className="h-6 w-64 bg-[#e6e9e8] rounded-lg"></div>
        <div className="h-72 bg-[#ffffff]/80 rounded-[2.5rem] border border-white/60"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-[#ffffff]/80 rounded-2xl border border-white/60"
            ></div>
          ))}
        </div>
        <div className="h-64 bg-[#ffffff]/80 rounded-[2.5rem] border border-white/60"></div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-[#3f4945]">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#ba1a1a]">
          <span className="material-symbols-outlined text-[36px]">
            error_outline
          </span>
        </div>
        <p className="font-bold text-lg text-[#00342b]">
          Tahun ajaran tidak ditemukan.
        </p>
        <button
          onClick={() => navigate("/operator/master/tahun-ajaran")}
          className="px-6 py-2.5 rounded-full bg-[#00342b] text-white text-xs font-bold hover:bg-[#004d40] flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const ta = data.data;
  const kelasList = data.kelas ?? [];
  const totalKelas = data.total_kelas ?? 0;
  const totalSiswa = data.total_siswa ?? 0;
  const totalGuru = data.total_guru ?? 0;
  const totalMapel = data.total_mapel ?? 0;
  const totalWaliKelas = data.total_wali_kelas ?? 0;
  const totalRuangan = data.total_ruangan ?? 0;
  const totalJadwal = data.total_jadwal ?? 0;

  // Helper: tampil angka atau "—" jika 0/null
  const disp = (n) => (n > 0 ? n.toLocaleString("id-ID") : "—");
  const aktivitas = data.aktivitas ?? [];
  const taPrev = data.ta_prev ?? null;
  const taNext = data.ta_next ?? null;
  const checklist = data.checklist ?? {};
  const semesters = ta.semesters ?? [];
  const ganjil = semesters.find((s) => s.nama === "Ganjil");
  const genap = semesters.find((s) => s.nama === "Genap");
  const semAktif = semesters.find((s) => s.is_active);

  // Label badge semester berdasarkan lifecycle TA, bukan hanya is_active semester
  const semBadgeLabel = ta.is_active ? "STANDBY" : "SELESAI";

  // Year parsing (e.g. 2026/2027 => 2026 and 2027)
  const tahunParts = (ta.tahun || "").split(/[/ -]/).filter(Boolean);
  const startYear = tahunParts[0] || ta.tahun || "2026";
  const endYear = tahunParts[1] || "";

  // Date calculations
  const tglMulaiTA = ganjil?.tgl_mulai || ta.tanggal_mulai;
  const tglSelesaiTA =
    genap?.tgl_selesai || ganjil?.tgl_selesai || ta.tanggal_selesai;
  const progressTA =
    calcProgress(tglMulaiTA, tglSelesaiTA) || (ta.is_active ? 42 : 0);
  const hariTotal = daysBetween(tglMulaiTA, tglSelesaiTA) || 335;
  const totalBulan = Math.max(1, Math.round(hariTotal / 30));

  // Capacity calculation
  const totalKapasitas = kelasList.reduce(
    (acc, k) => acc + (Number(k.kapasitas) || 0),
    0,
  );
  const kapasitasPct =
    totalKapasitas > 0
      ? Math.min(100, Math.round((totalSiswa / totalKapasitas) * 100))
      : 92;

  // Filtered kelas
  const filteredKelas = kelasList.filter(
    (k) =>
      (k.nama_kelas || "").toLowerCase().includes(searchKelas.toLowerCase()) ||
      (k.kurikulum || "").toLowerCase().includes(searchKelas.toLowerCase()) ||
      (k.nama_wali || "").toLowerCase().includes(searchKelas.toLowerCase()),
  );

  return (
    <div className="w-full space-y-8 pb-16 font-body-md antialiased text-[#111827]">
      <style>{`
        .serif-italic { font-family: 'EB Garamond', Georgia, serif; font-style: italic; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); }
        .font-headline-card { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-headline-section { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-display-hero { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes bar-fill {
          0% { width: 0; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-bar-fill {
          animation: bar-fill 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      {/* ── 1. Breadcrumb & Back Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4 sm:gap-6 w-full flex-wrap">
          <button
            onClick={() => navigate("/operator/master/tahun-ajaran")}
            className="flex items-center gap-2 px-3.5 py-1.5 text-[#3f4945] hover:text-[#00342b] hover:bg-[#00342b]/5 rounded-xl transition-all duration-200 group border border-transparent hover:border-[#00342b]/10"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span className="text-sm font-semibold">Kembali</span>
          </button>
          <div className="h-4 w-px bg-[#bfc9c4]/40 hidden sm:block"></div>
          <nav className="flex items-center gap-2 ml-auto text-xs flex-wrap">
            <button
              onClick={() => navigate("/operator/master/tahun-ajaran")}
              className="font-medium text-[#3f4945]/60 hover:text-[#00342b] transition-colors"
            >
              Master Data
            </button>
            <span className="material-symbols-outlined text-[14px] text-[#3f4945]/40">
              chevron_right
            </span>
            <button
              onClick={() => navigate("/operator/master/tahun-ajaran")}
              className="font-medium text-[#3f4945]/60 hover:text-[#00342b] transition-colors"
            >
              Tahun Ajaran &amp; Semester
            </button>
            <span className="material-symbols-outlined text-[14px] text-[#3f4945]/40">
              chevron_right
            </span>
            <span className="font-bold text-[#00342b] tracking-wide">
              {ta.tahun}
            </span>
          </nav>
        </div>
      </div>

      {/* ── 2. Hero Header Section ── */}
      <section className="animate-fade-in-up">
        <div className="glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 lg:p-12 border border-white/80 shadow-[0_20px_50px_rgba(0,52,43,0.05)] relative overflow-hidden group">
          {/* Decorative Background Elements */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#006e2a]/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-[#00342b]/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/islamic-art.png")',
            }}
          ></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
            <div className="max-w-3xl">
              {/* Top Badge Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <span className="px-4 py-1.5 rounded-full bg-[#00342b]/5 text-[#00342b] text-[10px] font-bold uppercase tracking-[0.25em] border border-[#00342b]/10">
                  Manajemen Akademik
                </span>
                {ta.is_active ? (
                  <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#69ff87]/15 border border-[#69ff87]/30 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2a] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006e2a]"></span>
                    </span>
                    <span className="text-[#006e2a] font-black text-[10px] uppercase tracking-widest">
                      Tahun Ajaran Aktif
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="text-[#3f4945] font-bold text-[10px] uppercase tracking-widest">
                      Tahun Ajaran Nonaktif
                    </span>
                  </div>
                )}
              </div>

              {/* Main Heading */}
              <div className="mb-6 sm:mb-8">
                <span className="serif-italic text-[#006e2a] text-2xl sm:text-3xl block mb-2">
                  Tahun Ajaran
                </span>
                <h1 className="font-display-hero text-5xl sm:text-7xl md:text-[88px] text-[#00342b] font-extrabold tracking-tighter leading-none">
                  {startYear}
                  {endYear && (
                    <>
                      <span className="text-[#006e2a]/20 font-light mx-1 sm:mx-2">
                        /
                      </span>
                      <span className="text-[#006e2a]">{endYear}</span>
                    </>
                  )}
                </h1>
              </div>

              {/* Info & Description */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#bfc9c4]/25 shadow-sm">
                    <span className="material-symbols-outlined text-[#00342b] text-[18px]">
                      calendar_today
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#3f4945]">
                      {tglMulaiTA ? fmtLong(tglMulaiTA) : "15 Juli 2026"} —{" "}
                      {tglSelesaiTA ? fmtLong(tglSelesaiTA) : "15 Juni 2027"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#3f4945]/60 px-2 text-xs font-medium">
                    <span className="material-symbols-outlined text-[16px]">
                      history
                    </span>
                    <span>
                      Pembaruan Terakhir: {fmt(ta.updated_at || ta.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-[#3f4945]/80 leading-relaxed max-w-2xl font-body-lg">
                  Periode akademik komprehensif yang mengintegrasikan{" "}
                  <span className="text-[#00342b] font-semibold">
                    kurikulum nasional
                  </span>{" "}
                  dengan{" "}
                  <span className="serif-italic text-[#006e2a]">
                    nilai-nilai keislaman
                  </span>{" "}
                  untuk Semester Ganjil dan Genap.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row lg:flex-col items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-[#00342b]/10 text-[#00342b] font-bold rounded-full shadow-sm hover:shadow-xl hover:border-[#00342b]/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group/btn text-sm"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px] group-hover/btn:rotate-12 transition-transform text-[#006e2a]">
                  edit_calendar
                </span>
                Edit Tahun Ajaran
              </button>

              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoreMenuOpen((v) => !v);
                  }}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-[#bfc9c4]/40 hover:border-[#00342b] text-[#00342b] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all group/more"
                  title="Opsi Lainnya"
                >
                  <span className="material-symbols-outlined group-hover/more:rotate-90 transition-transform text-[20px]">
                    more_vert
                  </span>
                </button>

                {moreMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#bfc9c4]/30 py-2 z-30 animate-fade-in-up"
                  >
                    {!ta.is_active && (
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          if (
                            confirm(
                              `Jadikan "${ta.tahun}" sebagai tahun ajaran aktif?`,
                            )
                          ) {
                            setAktif.mutate();
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#006e2a] hover:bg-[#006e2a]/5 flex items-center gap-2.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          verified
                        </span>
                        Jadikan TA Aktif
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        const target =
                          semAktif?.nama === "Ganjil" ? "Genap" : "Ganjil";
                        if (
                          confirm(
                            `Pindah semester aktif ke Semester ${target}?`,
                          )
                        ) {
                          setSemesterAktif.mutate(target);
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#3f4945] hover:bg-[#f8faf9] flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        swap_horiz
                      </span>
                      Ganti ke Semester{" "}
                      {semAktif?.nama === "Ganjil" ? "Genap" : "Ganjil"}
                    </button>
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setChecklistModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#3f4945] hover:bg-[#f8faf9] flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        checklist
                      </span>
                      Periksa Kesiapan
                    </button>
                    <div className="h-px bg-[#bfc9c4]/20 my-1"></div>
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        if (
                          confirm(
                            `Apakah Anda yakin ingin mengarsipkan tahun ajaran "${ta.tahun}"?`,
                          )
                        ) {
                          arsipkanTA.mutate();
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#ba1a1a] hover:bg-red-50 flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        archive
                      </span>
                      Arsipkan Periode
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Key Count Stat Row (5 columns) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 mt-6 sm:mt-8">
          {/* Siswa */}
          <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 border border-white/50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-[#006e2a]/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 sm:gap-5 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00342b] leading-none truncate">
                {disp(totalSiswa)}
              </span>
              <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest mt-1.5">
                Siswa
              </span>
            </div>
          </div>

          {/* Guru */}
          <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 border border-white/50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-[#006e2a]/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 sm:gap-5 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl">
                person_celebrate
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00342b] leading-none truncate">
                {disp(totalGuru)}
              </span>
              <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest mt-1.5">
                Guru
              </span>
            </div>
          </div>

          {/* Kelas */}
          <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 border border-white/50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-[#006e2a]/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 sm:gap-5 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl">
                meeting_room
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00342b] leading-none truncate">
                {disp(totalKelas)}
              </span>
              <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest mt-1.5">
                Kelas
              </span>
            </div>
          </div>

          {/* Mata Pelajaran */}
          <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 border border-white/50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-[#006e2a]/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 sm:gap-5 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl">
                menu_book
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00342b] leading-none truncate">
                {disp(totalMapel)}
              </span>
              <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest mt-1.5">
                Mata Pelajaran
              </span>
            </div>
          </div>

          {/* Rombel */}
          <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 border border-white/50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-[#006e2a]/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 sm:gap-5 group col-span-2 sm:col-span-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] shrink-0 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl">
                account_tree
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#00342b] leading-none truncate">
                {disp(totalKelas)}
              </span>
              <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest mt-1.5">
                Rombel
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. Quick Status Cards (4 columns) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {/* Status Saat Ini */}
          <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[1.25rem] p-5 sm:p-6 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-xl hover:bg-[#006e2a]/[0.02] transition-all duration-500 ease-in-out group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#006e2a]/5 rounded-full blur-xl group-hover:bg-[#006e2a]/20 group-hover:scale-150 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] relative z-10 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest mb-1 font-headline-card">
                Status Saat Ini
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-headline-card font-extrabold text-[#00342b]">
                  {ta.is_active ? "Aktif" : "Nonaktif"}
                </span>
                {ta.is_active && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2a] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006e2a]"></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Semester Aktif */}
          <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[1.25rem] p-5 sm:p-6 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-xl hover:bg-[#006e2a]/[0.02] transition-all duration-500 ease-in-out group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#00342b]/5 rounded-full blur-xl group-hover:bg-[#006e2a]/20 group-hover:scale-150 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b] relative z-10 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest mb-1 font-headline-card">
                Semester Aktif
              </p>
              <span className="text-lg sm:text-xl font-headline-card font-extrabold text-[#00342b]">
                {semAktif?.nama || "Ganjil"}
              </span>
            </div>
          </div>

          {/* Durasi Tahun */}
          <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[1.25rem] p-5 sm:p-6 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-xl hover:bg-[#006e2a]/[0.02] transition-all duration-500 ease-in-out group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#006e2a]/5 rounded-full blur-xl group-hover:bg-[#006e2a]/20 group-hover:scale-150 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] relative z-10 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <span className="material-symbols-outlined">timelapse</span>
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest mb-1 font-headline-card">
                Durasi Tahun
              </p>
              <span className="text-lg sm:text-xl font-headline-card font-extrabold text-[#00342b]">
                {totalBulan} Bulan
              </span>
            </div>
          </div>

          {/* Total Semester */}
          <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[1.25rem] p-5 sm:p-6 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-xl hover:bg-[#006e2a]/[0.02] transition-all duration-500 ease-in-out group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#00342b]/5 rounded-full blur-xl group-hover:bg-[#006e2a]/20 group-hover:scale-150 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b] relative z-10 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <span className="material-symbols-outlined">layers</span>
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest mb-1 font-headline-card">
                Total Semester
              </p>
              <span className="text-lg sm:text-xl font-headline-card font-extrabold text-[#00342b]">
                {semesters.length || 2} Periode
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Status Panel: Progres Tahun Ajaran (Chart & KPI) ── */}
      <section className="mb-16 bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-white/50 shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#00342b]/10 transition-all duration-500 ease-in-out">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-20"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#69ff87]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 relative z-10">
          {/* Left: Main Chart Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6 sm:mb-8 flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="font-headline-card text-xl sm:text-2xl font-extrabold text-[#00342b] tracking-tight">
                  Progres Tahun Ajaran
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-[#006e2a] text-sm">
                    info
                  </span>
                  <p className="text-xs sm:text-sm text-[#3f4945]/70 italic">
                    Aktivitas Akademik Semester {semAktif?.nama || "Ganjil"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00342b]/10 text-[#00342b] text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#00342b] animate-pulse"></span>{" "}
                  Aktivitas
                </span>
              </div>
            </div>

            <div className="flex-1 relative h-40 sm:h-48 w-full group-hover:drop-shadow-[0_0_15px_rgba(0,200,83,0.3)] transition-all duration-500">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 800 200"
              >
                <defs>
                  <linearGradient
                    id="academicGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#00c853"
                      stopOpacity="0.25"
                    ></stop>
                    <stop
                      offset="100%"
                      stopColor="#00c853"
                      stopOpacity="0"
                    ></stop>
                  </linearGradient>
                </defs>
                <path
                  d="M0,160 Q133,120 266,140 T533,80 T800,100 L800,200 L0,200 Z"
                  fill="url(#academicGradient)"
                ></path>
                <path
                  d="M0,160 Q133,120 266,140 T533,80 T800,100"
                  fill="none"
                  stroke="#00c853"
                  strokeLinecap="round"
                  strokeWidth="4"
                ></path>
                <circle
                  cx="266"
                  cy="140"
                  fill="#00c853"
                  r="5"
                  stroke="white"
                  strokeWidth="2"
                ></circle>
                <circle
                  cx="533"
                  cy="80"
                  fill="#00c853"
                  r="5"
                  stroke="white"
                  strokeWidth="2"
                ></circle>
                <circle
                  cx="800"
                  cy="100"
                  fill="#00c853"
                  r="5"
                  stroke="white"
                  strokeWidth="2"
                ></circle>
              </svg>
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest px-1">
                <span>Jul</span>
                <span>Agu</span>
                <span>Sep</span>
                <span>Okt</span>
                <span>Nov</span>
                <span>Des</span>
              </div>
            </div>
          </div>

          {/* Right: KPI Cards & Capacity */}
          <div className="lg:w-80 flex flex-col gap-4">
            {/* Progress KPI */}
            <div className="bg-[#00342b] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden group/kpi">
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-[#afefdd] uppercase tracking-widest mb-1">
                  Berjalan
                </p>
                <h4 className="text-4xl font-extrabold font-headline-card">
                  {progressTA}%
                </h4>
                <div className="mt-3 w-full bg-white/20 h-1.5 rounded-full overflow-hidden relative">
                  <div
                    className="bg-[#69ff87] h-full rounded-full animate-bar-fill"
                    style={{ width: `${progressTA}%` }}
                  ></div>
                  <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"></div>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl opacity-10">
                trending_up
              </span>
            </div>

            {/* Classrooms & Capacity Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#bfc9c4]/20 hover:border-[#00342b]/30 rounded-2xl p-4 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-500 ease-out shadow-sm hover:shadow-xl">
                <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest mb-1">
                  Ruang Kelas
                </span>
                <span className="text-2xl font-black text-[#00342b] group-hover:scale-110 transition-transform">
                  {disp(totalRuangan || totalKelas)}
                </span>
              </div>
              <div className="bg-white border border-[#bfc9c4]/20 hover:border-[#00342b]/30 rounded-2xl p-4 flex flex-col items-center justify-center group hover:-translate-y-1 transition-all duration-500 ease-out shadow-sm hover:shadow-xl">
                <div className="relative w-12 h-12 group-hover:scale-110 transition-transform">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="stroke-[#e1e3e2]"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="16"
                      strokeWidth="4"
                    ></circle>
                    <circle
                      cx="18"
                      cy="18"
                      fill="none"
                      r="16"
                      stroke="#006e2a"
                      strokeDasharray={`${kapasitasPct}, 100`}
                      strokeLinecap="round"
                      strokeWidth="4"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-[#00342b]">
                      {kapasitasPct}%
                    </span>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-[#006e2a] uppercase tracking-widest mt-1">
                  Kapasitas
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5b. Ringkasan Tahunan ── */}
      <section className="mb-16 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#00342b]/5 border border-[#00342b]/10 w-fit">
            <span className="material-symbols-outlined text-[#00342b] text-[18px]">
              summarize
            </span>
            <span className="text-[10px] font-bold text-[#00342b] uppercase tracking-[0.3em]">
              Ringkasan Tahunan
            </span>
          </div>
          <h3 className="font-headline-section text-3xl sm:text-4xl font-extrabold text-[#00342b] tracking-tight">
            Kondisi{" "}
            <span className="serif-italic font-light text-[#006e2a]">
              Keseluruhan
            </span>
          </h3>
          <p className="text-[#3f4945]/70 text-sm sm:text-base max-w-xl leading-relaxed">
            Ringkasan data level tahunan — gambaran menyeluruh tahun ajaran{" "}
            {ta.tahun}.
          </p>
        </div>

        {/* Grid 2 kolom: Siswa + Guru */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─ A. Ringkasan Siswa ─ */}
          {(() => {
            const totalL = kelasList.reduce(
              (s, k) => s + (k.total_siswa_laki ?? 0),
              0,
            );
            const totalP = kelasList.reduce(
              (s, k) => s + (k.total_siswa_perempuan ?? 0),
              0,
            );
            const pctL =
              totalSiswa > 0 ? Math.round((totalL / totalSiswa) * 100) : 0;
            const pctP =
              totalSiswa > 0 ? Math.round((totalP / totalSiswa) * 100) : 0;
            const siswaItems = [
              {
                label: "Laki-laki",
                value: totalL || "—",
                sub: totalL > 0 ? `${pctL}%` : null,
                color: "#006e2a",
                icon: "man",
              },
              {
                label: "Perempuan",
                value: totalP || "—",
                sub: totalP > 0 ? `${pctP}%` : null,
                color: "#00342b",
                icon: "woman",
              },
              {
                label: "Siswa Masuk",
                value: data.total_siswa_masuk ?? "—",
                sub: "Tahun ini",
                color: "#006e2a",
                icon: "person_add",
              },
              {
                label: "Keluar/Mutasi",
                value: data.total_siswa_keluar ?? "—",
                sub: "Tahun ini",
                color: "#ba1a1a",
                icon: "person_remove",
              },
              {
                label: "Naik Kelas",
                value: ta.is_tutup_buku ? (data.total_siswa_naik ?? "—") : null,
                sub: ta.is_tutup_buku ? null : "Belum diproses",
                color: "#006e2a",
                icon: "trending_up",
              },
              {
                label: "Tidak Naik",
                value: ta.is_tutup_buku
                  ? (data.total_siswa_tidak_naik ?? "—")
                  : null,
                sub: ta.is_tutup_buku ? null : "Belum diproses",
                color: "#eaa300",
                icon: "trending_flat",
              },
            ];
            return (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/60 shadow-[0_20px_50px_rgba(0,52,43,0.05)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#006e2a]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#006e2a]/10 transition-colors duration-500" />
                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:scale-110 group-hover:bg-[#006e2a]/20 transition-all duration-500">
                        <span
                          className="material-symbols-outlined text-[26px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          groups
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em]">
                          Ringkasan
                        </p>
                        <h4 className="text-xl font-extrabold text-[#00342b] font-headline-card tracking-tight">
                          Siswa Tahunan
                        </h4>
                      </div>
                    </div>
                    {/* Total bubble */}
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-[#006e2a] font-headline-card leading-none">
                        {disp(totalSiswa)}
                      </span>
                      <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-wider mt-1">
                        Total Aktif
                      </span>
                    </div>
                  </div>

                  {/* Gender bar visual */}
                  {(totalL > 0 || totalP > 0) && (
                    <div className="mb-6">
                      <div className="flex rounded-full overflow-hidden h-2.5 mb-2">
                        <div
                          className="bg-[#006e2a] transition-all duration-700"
                          style={{ width: `${pctL}%` }}
                        />
                        <div
                          className="bg-[#00342b]/30 transition-all duration-700"
                          style={{ width: `${pctP}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#3f4945]/60">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#006e2a]" />
                          L: {pctL}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#00342b]/30" />
                          P: {pctP}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Grid items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {siswaItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1.5 p-3.5 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/20 hover:border-[#006e2a]/20 hover:bg-white transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="material-symbols-outlined text-[16px]"
                            style={{ color: item.color, opacity: 0.7 }}
                          >
                            {item.icon}
                          </span>
                          {item.value === null ? (
                            <span className="text-[9px] font-bold text-[#eaa300] uppercase tracking-wide bg-[#eaa300]/10 px-2 py-0.5 rounded-full border border-[#eaa300]/20">
                              {item.sub}
                            </span>
                          ) : null}
                        </div>
                        <span
                          className="text-xl font-black font-headline-card"
                          style={{
                            color: item.value === null ? "#bfc9c4" : item.color,
                          }}
                        >
                          {item.value === null ? "—" : item.value}
                        </span>
                        <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider leading-tight">
                          {item.label}
                        </span>
                        {item.sub && item.value !== null && (
                          <span className="text-[9px] font-bold text-[#3f4945]/40">
                            {item.sub}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─ B. Ringkasan Guru ─ */}
          {(() => {
            const totalTetap = data.total_guru_tetap ?? 0;
            const totalHonorer = data.total_guru_honorer ?? 0;
            const totalTanpaTugas = data.total_guru_tanpa_tugas ?? 0;
            const pctTetap =
              totalGuru > 0 ? Math.round((totalTetap / totalGuru) * 100) : 0;
            const guruItems = [
              {
                label: "Guru Tetap",
                value: totalTetap || "—",
                sub: totalTetap > 0 ? `${pctTetap}%` : null,
                color: "#006e2a",
                icon: "verified_user",
              },
              {
                label: "Honorer",
                value: totalHonorer || "—",
                sub: totalHonorer > 0 ? `${100 - pctTetap}%` : null,
                color: "#eaa300",
                icon: "badge",
              },
              {
                label: "Wali Kelas",
                value: totalWaliKelas || "—",
                sub: "Ditugaskan",
                color: "#00342b",
                icon: "supervised_user_circle",
              },
              {
                label: "Guru Mengajar",
                value: totalGuru || "—",
                sub: "Aktif semester ini",
                color: "#006e2a",
                icon: "school",
              },
              {
                label: "Mutasi Masuk",
                value: data.total_guru_mutasi_masuk ?? "—",
                sub: "Tahun ini",
                color: "#006e2a",
                icon: "login",
              },
              {
                label: "Tanpa Tugas",
                value: totalTanpaTugas > 0 ? totalTanpaTugas : "—",
                sub: totalTanpaTugas > 0 ? "Perlu perhatian" : "Semua bertugas",
                color: totalTanpaTugas > 0 ? "#ba1a1a" : "#006e2a",
                icon: totalTanpaTugas > 0 ? "person_off" : "check_circle",
              },
            ];
            return (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/60 shadow-[0_20px_50px_rgba(0,52,43,0.05)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
                <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#00342b]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#00342b]/10 transition-colors duration-500" />
                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b] group-hover:scale-110 group-hover:bg-[#00342b]/20 transition-all duration-500">
                        <span
                          className="material-symbols-outlined text-[26px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          person_celebrate
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em]">
                          Ringkasan
                        </p>
                        <h4 className="text-xl font-extrabold text-[#00342b] font-headline-card tracking-tight">
                          Guru Tahunan
                        </h4>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-[#006e2a] font-headline-card leading-none">
                        {disp(totalGuru)}
                      </span>
                      <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-wider mt-1">
                        Total Aktif
                      </span>
                    </div>
                  </div>

                  {/* Tetap vs Honorer bar */}
                  {(totalTetap > 0 || totalHonorer > 0) && (
                    <div className="mb-6">
                      <div className="flex rounded-full overflow-hidden h-2.5 mb-2">
                        <div
                          className="bg-[#006e2a] transition-all duration-700"
                          style={{ width: `${pctTetap}%` }}
                        />
                        <div
                          className="bg-[#eaa300]/40 transition-all duration-700"
                          style={{ width: `${100 - pctTetap}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#3f4945]/60">
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

                  {/* Grid items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {guruItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1.5 p-3.5 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/20 hover:border-[#00342b]/20 hover:bg-white transition-all duration-300"
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ color: item.color, opacity: 0.7 }}
                        >
                          {item.icon}
                        </span>
                        <span
                          className="text-xl font-black font-headline-card"
                          style={{
                            color: item.value === "—" ? "#bfc9c4" : item.color,
                          }}
                        >
                          {item.value}
                        </span>
                        <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider leading-tight">
                          {item.label}
                        </span>
                        {item.sub && (
                          <span className="text-[9px] font-bold text-[#3f4945]/40">
                            {item.sub}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Grid 2 kolom: Rombel + Akademik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─ C. Ringkasan Rombel ─ */}
          {(() => {
            const siswaPerKelas =
              totalKelas > 0 ? Math.round(totalSiswa / totalKelas) : 0;
            const kelasHampirPenuh = kelasList.filter((k) => {
              const kap = Number(k.kapasitas) || 0;
              const isi = k.total_siswa ?? 0;
              return kap > 0 && isi > 0 && isi / kap >= 0.8 && isi / kap < 1;
            }).length;
            const kelasPenuh = kelasList.filter((k) => {
              const kap = Number(k.kapasitas) || 0;
              const isi = k.total_siswa ?? 0;
              return kap > 0 && isi >= kap;
            }).length;
            const sisaKapasitas = Math.max(0, totalKapasitas - totalSiswa);

            const rombelItems = [
              {
                label: "Total Rombel",
                value: disp(totalKelas),
                color: "#006e2a",
                icon: "account_tree",
              },
              {
                label: "Kapasitas Total",
                value: totalKapasitas > 0 ? disp(totalKapasitas) : "—",
                color: "#00342b",
                icon: "people",
              },
              {
                label: "Siswa Terdistribusi",
                value: disp(totalSiswa),
                color: "#006e2a",
                icon: "groups",
              },
              {
                label: "Sisa Kapasitas",
                value: totalKapasitas > 0 ? disp(sisaKapasitas) : "—",
                color: sisaKapasitas < 10 ? "#ba1a1a" : "#3f4945",
                icon: "reduce_capacity",
              },
              {
                label: "Rombel Penuh",
                value: kelasPenuh > 0 ? kelasPenuh : "—",
                color: "#ba1a1a",
                icon: "meeting_room",
              },
              {
                label: "Hampir Penuh",
                value: kelasHampirPenuh > 0 ? kelasHampirPenuh : "—",
                color: "#eaa300",
                icon: "door_front",
              },
            ];
            return (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/60 shadow-[0_20px_50px_rgba(0,52,43,0.05)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
                <div className="absolute -right-10 -top-10 w-44 h-44 bg-[#006e2a]/5 rounded-full blur-[70px] pointer-events-none" />
                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:scale-110 group-hover:bg-[#006e2a]/20 transition-all duration-500">
                        <span
                          className="material-symbols-outlined text-[26px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          meeting_room
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em]">
                          Ringkasan
                        </p>
                        <h4 className="text-xl font-extrabold text-[#00342b] font-headline-card tracking-tight">
                          Rombel Tahunan
                        </h4>
                      </div>
                    </div>
                    {/* Donut kapasitas */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-14 h-14">
                        <svg
                          className="w-full h-full -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <circle
                            className="stroke-[#e1e3e2]"
                            cx="18"
                            cy="18"
                            fill="none"
                            r="14"
                            strokeWidth="4"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            fill="none"
                            r="14"
                            stroke="#006e2a"
                            strokeDasharray={`${kapasitasPct}, 100`}
                            strokeLinecap="round"
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black text-[#00342b]">
                            {kapasitasPct}%
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-[#3f4945]/50 uppercase tracking-wider mt-1">
                        Terisi
                      </span>
                    </div>
                  </div>

                  {/* Capacity fill bar */}
                  {totalKapasitas > 0 && (
                    <div className="mb-6 p-3.5 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider">
                          Tingkat Pengisian
                        </span>
                        <span className="text-[10px] font-black text-[#006e2a]">
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

                  {/* Grid items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {rombelItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1.5 p-3.5 bg-[#f8faf9] rounded-2xl border border-[#bfc9c4]/20 hover:border-[#006e2a]/20 hover:bg-white transition-all duration-300"
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ color: item.color, opacity: 0.7 }}
                        >
                          {item.icon}
                        </span>
                        <span
                          className="text-xl font-black font-headline-card"
                          style={{
                            color: item.value === "—" ? "#bfc9c4" : item.color,
                          }}
                        >
                          {item.value}
                        </span>
                        <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-wider leading-tight">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─ D. Ringkasan Akademik ─ */}
          {(() => {
            const totalHariEfektif = ta.total_hari_efektif ?? 0;
            const totalHariLibur = ta.total_hari_libur ?? 0;
            const totalAgenda = data.kalender?.length ?? 0;
            const totalMapelWajib = data.total_mapel_wajib ?? 0;
            const totalMapelLokal = data.total_mapel_lokal ?? 0;
            const totalPengampu = totalGuru;

            const akademikItems = [
              {
                label: "Total Mapel",
                value: disp(totalMapel),
                color: "#006e2a",
                icon: "menu_book",
              },
              {
                label: "Mapel Wajib",
                value: totalMapelWajib > 0 ? disp(totalMapelWajib) : "—",
                color: "#00342b",
                icon: "check_box",
              },
              {
                label: "Muatan Lokal",
                value: totalMapelLokal > 0 ? disp(totalMapelLokal) : "—",
                color: "#eaa300",
                icon: "local_library",
              },
              {
                label: "Total Pengampu",
                value: disp(totalPengampu),
                color: "#006e2a",
                icon: "co_present",
              },
              {
                label: "Hari Efektif",
                value: totalHariEfektif > 0 ? disp(totalHariEfektif) : "—",
                color: "#00342b",
                icon: "today",
              },
              {
                label: "Agenda Kalender",
                value: totalAgenda > 0 ? disp(totalAgenda) : "—",
                color: "#3f4945",
                icon: "event_note",
              },
            ];
            return (
              <div className="bg-[#00342b] rounded-[2.5rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,52,43,0.2)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
                {/* Decorative dot pattern */}
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
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#69ff87]/10 flex items-center justify-center text-[#69ff87] group-hover:scale-110 group-hover:bg-[#69ff87]/20 transition-all duration-500">
                        <span
                          className="material-symbols-outlined text-[26px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          auto_stories
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                          Ringkasan
                        </p>
                        <h4 className="text-xl font-extrabold text-white font-headline-card tracking-tight">
                          Akademik Tahunan
                        </h4>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-[#69ff87] font-headline-card leading-none">
                        {disp(totalJadwal)}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">
                        Total Jadwal
                      </span>
                    </div>
                  </div>

                  {/* Hari Efektif progress bar */}
                  {totalHariEfektif > 0 && hariTotal > 0 && (
                    <div className="mb-6 p-3.5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                          Hari Efektif
                        </span>
                        <span className="text-[10px] font-black text-[#69ff87]">
                          {totalHariEfektif} dari {hariTotal} hari
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#006e2a] to-[#69ff87] rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, Math.round((totalHariEfektif / hariTotal) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-white/30 mt-1 block">
                        {totalHariLibur} hari libur dikurangi
                      </span>
                    </div>
                  )}

                  {/* Grid items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {akademikItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1.5 p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#69ff87] opacity-70">
                          {item.icon}
                        </span>
                        <span
                          className={`text-xl font-black font-headline-card ${item.value === "—" ? "text-white/20" : "text-white"}`}
                        >
                          {item.value}
                        </span>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-tight">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── 6. Semester Panels (Semester Ganjil & Genap) ── */}
      <section className="mb-16">
        <div className="relative mb-10">
          <div className="absolute -left-10 -top-10 w-64 h-64 bg-[#006e2a]/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex flex-col gap-3">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#006e2a]/5 border border-[#006e2a]/10 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006e2a]"></span>
                </span>
                <span className="material-symbols-outlined text-[#006e2a] text-[18px]">
                  calendar_view_month
                </span>
                <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-[0.3em]">
                  Manajemen Semester
                </span>
              </div>
              {/* Main Heading */}
              <div className="flex items-baseline gap-3">
                <h3 className="font-headline-section text-3xl sm:text-4xl font-extrabold text-[#00342b] tracking-tight">
                  Semester{" "}
                  <span className="serif-italic font-light text-[#006e2a]">
                    Akademik
                  </span>
                </h3>
              </div>
              <p className="text-[#3f4945]/70 font-body-md text-sm sm:text-base max-w-xl leading-relaxed">
                Dua semester dalam tahun ajaran {ta.tahun}. Kelola kurikulum,
                jadwal, dan aktivitas akademik untuk setiap periode secara
                efisien.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 relative z-10">
          {/* PANEL 1: SEMESTER GANJIL */}
          <div
            className={`rounded-[2.5rem] border shadow-[0_20px_50px_rgba(0,52,43,0.05)] p-6 sm:p-10 relative overflow-hidden group transition-all duration-500 ease-in-out hover:-translate-y-1 hover:shadow-2xl ${
              ganjil?.is_active
                ? "bg-white border-[#006e2a]/20 hover:shadow-[#00342b]/20"
                : "bg-white/60 backdrop-blur-sm border-[#bfc9c4]/30"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#006e2a]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#006e2a]/5 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-6 right-8 sm:right-10 text-6xl sm:text-7xl font-black text-[#00342b]/5 select-none">
              01
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 flex-wrap">
                <h4 className="text-2xl sm:text-3xl font-headline-card text-[#00342b] font-extrabold">
                  Semester Ganjil
                </h4>
                {ganjil?.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#006e2a] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#006e2a]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    AKTIF
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-gray-100 text-[#3f4945]/60 text-[10px] font-black uppercase tracking-widest border border-gray-200">
                    {semBadgeLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-[#3f4945]/70 mb-8 bg-[#f2f4f3]/50 w-fit px-4 py-2 rounded-full border border-[#bfc9c4]/20 text-xs sm:text-sm font-semibold">
                <span className="material-symbols-outlined text-[16px] sm:text-lg text-[#006e2a]">
                  calendar_today
                </span>
                <span>
                  {ganjil?.tgl_mulai
                    ? fmtLong(ganjil.tgl_mulai)
                    : "15 Juli 2026"}{" "}
                  —{" "}
                  {ganjil?.tgl_selesai
                    ? fmtLong(ganjil.tgl_selesai)
                    : "20 Desember 2026"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-10 justify-items-center">
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#00342b]/5 flex items-center justify-center text-[#00342b] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      group
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Siswa
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#00342b]">
                      {ganjil?.is_active ? disp(totalSiswa) : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#00342b]/5 flex items-center justify-center text-[#00342b] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      meeting_room
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Kelas
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#00342b]">
                      {ganjil?.is_active ? disp(totalKelas) : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#00342b]/5 flex items-center justify-center text-[#00342b] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      person_celebrate
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Guru
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#00342b]">
                      {ganjil?.is_active ? disp(totalGuru) : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#00342b]/5 flex items-center justify-center text-[#00342b] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      event_repeat
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Jadwal
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#00342b]">
                      {ganjil?.is_active ? disp(totalJadwal) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {(() => {
                const doneCount =
                  Object.values(checklist).filter(Boolean).length;
                const total = Object.keys(checklist).length || 10;
                const pct =
                  total > 0 ? Math.round((doneCount / total) * 100) : 0;
                return (
                  <div className="mb-8 bg-[#f2f4f3]/40 p-4 sm:p-5 rounded-2xl border border-[#bfc9c4]/15">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[11px] font-bold text-[#3f4945]/70 uppercase tracking-widest">
                        Kesiapan akademik
                      </span>
                      <span className="text-xs sm:text-sm font-black text-[#006e2a]">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e1e3e2] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#006e2a] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() =>
                  navigate(
                    `/operator/master/tahun-ajaran/${id}/semester/Ganjil`,
                  )
                }
                className="w-full py-3.5 sm:py-4 bg-[#00342b] text-white font-bold rounded-full shadow-xl shadow-[#00342b]/20 hover:bg-[#004d40] hover:shadow-[#00342b]/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group/btn text-sm"
              >
                Lihat Detail Semester
                <span className="material-symbols-outlined text-xl group-hover/btn:translate-x-1 transition-transform duration-300">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* PANEL 2: SEMESTER GENAP */}
          <div
            className={`rounded-[2.5rem] border shadow-[0_20px_50px_rgba(0,52,43,0.05)] p-6 sm:p-10 relative overflow-hidden group transition-all duration-500 ease-in-out hover:-translate-y-1 hover:shadow-2xl ${
              genap?.is_active
                ? "bg-white border-[#006e2a]/20 hover:shadow-[#00342b]/20"
                : "bg-white/60 backdrop-blur-sm border-[#bfc9c4]/30"
            }`}
          >
            <div className="absolute top-6 right-8 sm:right-10 text-6xl sm:text-7xl font-black text-[#3f4945]/5 select-none">
              02
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 flex-wrap">
                <h4 className="text-2xl sm:text-3xl font-headline-card text-[#3f4945]/80 font-extrabold">
                  Semester Genap
                </h4>
                {genap?.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#006e2a] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#006e2a]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    AKTIF
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-gray-100 text-[#3f4945]/60 text-[10px] font-black uppercase tracking-widest border border-gray-200">
                    {semBadgeLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-[#3f4945]/50 mb-8 px-4 py-2 text-xs sm:text-sm font-medium">
                <span className="material-symbols-outlined text-[16px] sm:text-lg">
                  calendar_today
                </span>
                <span>
                  {genap?.tgl_mulai
                    ? fmtLong(genap.tgl_mulai)
                    : "10 Januari 2027"}{" "}
                  —{" "}
                  {genap?.tgl_selesai
                    ? fmtLong(genap.tgl_selesai)
                    : "15 Juni 2027"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-10 opacity-60 justify-items-center">
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#3f4945]/5 flex items-center justify-center text-[#3f4945] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      group
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Siswa
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#3f4945]">
                      {genap?.is_active ? totalSiswa : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#3f4945]/5 flex items-center justify-center text-[#3f4945] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      meeting_room
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Kelas
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#3f4945]">
                      {genap?.is_active ? totalKelas : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#3f4945]/5 flex items-center justify-center text-[#3f4945] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      person_celebrate
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Guru
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#3f4945]">
                      {genap?.is_active ? totalGuru : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#3f4945]/5 flex items-center justify-center text-[#3f4945] transition-transform duration-500 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl">
                      event_repeat
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#3f4945]/40 uppercase tracking-widest block">
                      Jadwal
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#3f4945]">
                      {genap?.is_active ? totalJadwal : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-xs sm:text-sm font-bold text-[#3f4945]/50 italic flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">
                    hourglass_empty
                  </span>
                  {genap?.is_active ? "Sedang Berjalan" : "Belum dimulai"}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(`/operator/master/tahun-ajaran/${id}/semester/Genap`)
                }
                className="w-full py-3.5 sm:py-4 bg-white border-2 border-[#bfc9c4]/50 group-hover:border-[#00342b]/50 group-hover:text-[#00342b] hover:border-[#00342b] hover:text-[#00342b] hover:shadow-[0_0_15px_rgba(0,110,42,0.2)] text-[#3f4945]/70 font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-3 group/btn text-sm"
              >
                {genap?.is_active
                  ? "Lihat Detail Semester"
                  : "Siapkan Semester"}
                <span className="material-symbols-outlined text-xl group-hover/btn:rotate-90 transition-transform">
                  settings
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Komparasi Semester ── */}
      <section className="mb-16 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/50 shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#006e2a]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col gap-3 mb-8 sm:mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00342b]/5 border border-[#00342b]/10 w-fit">
            <span className="material-symbols-outlined text-[#00342b] text-[16px]">
              compare_arrows
            </span>
            <span className="text-[10px] font-bold text-[#00342b] uppercase tracking-[0.2em]">
              Academic Comparison
            </span>
          </div>
          <h2 className="font-headline-section text-3xl font-extrabold text-[#00342b] tracking-tight">
            Komparasi{" "}
            <span className="serif-italic font-light text-[#006e2a]">
              Semester
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
          {/* Semester Ganjil Card */}
          <div className="bg-white/80 rounded-3xl p-6 sm:p-8 border border-[#006e2a]/20 shadow-lg relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:bg-white/95 transition-all duration-500 ease-out">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#006e2a]/10 rounded-bl-full"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl sm:text-2xl font-headline-card font-extrabold text-[#00342b]">
                Semester Ganjil
              </h3>
              <span className="px-4 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] text-[10px] font-black uppercase tracking-widest border border-[#006e2a]/20">
                Aktif
              </span>
            </div>
            <div className="space-y-4 sm:space-y-6 relative z-10">
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#f2f4f3]/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      group
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Total Siswa
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#00342b]">
                  {disp(totalSiswa)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#f2f4f3]/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      meeting_room
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Ruang Kelas
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#00342b]">
                  {disp(totalKelas)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#f2f4f3]/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      person_celebrate
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Tenaga Pengajar
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#00342b]">
                  {disp(totalGuru)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#f2f4f3]/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#00342b]/10 flex items-center justify-center text-[#00342b] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      menu_book
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Mata Pelajaran
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#00342b]">
                  {disp(totalMapel)}
                </span>
              </div>
            </div>
          </div>

          {/* Semester Genap Card */}
          <div className="bg-white/40 rounded-3xl p-6 sm:p-8 border border-[#bfc9c4]/30 shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:bg-white/95 transition-all duration-500 ease-out">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bfc9c4]/10 rounded-bl-full"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl sm:text-2xl font-headline-card font-extrabold text-[#3f4945]/70">
                Semester Genap
              </h3>
              <span className="px-4 py-1.5 rounded-full bg-gray-100 text-[#3f4945]/50 text-[10px] font-black uppercase tracking-widest border border-gray-200">
                Standby
              </span>
            </div>
            <div className="space-y-4 sm:space-y-6 relative z-10 opacity-70">
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#3f4945]/10 flex items-center justify-center text-[#3f4945] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      group
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Total Siswa
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#3f4945]/50">
                  —
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#3f4945]/10 flex items-center justify-center text-[#3f4945] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      meeting_room
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Ruang Kelas
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#3f4945]/50">
                  —
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#3f4945]/10 flex items-center justify-center text-[#3f4945] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      person_celebrate
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Tenaga Pengajar
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#3f4945]/50">
                  —
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#3f4945]/10 flex items-center justify-center text-[#3f4945] group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-[20px] sm:text-2xl">
                      menu_book
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#3f4945]">
                    Mata Pelajaran
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#3f4945]/50">
                  —
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Kesiapan Tahun Ajaran ── */}
      <section className="mb-16 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/60 shadow-xl relative overflow-hidden group">
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#00342b]/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
          {/* Left Column: Editorial Metrics */}
          <div className="flex-1 flex flex-col gap-8 sm:gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00342b]/5 border border-[#00342b]/10 mb-4">
                <span className="material-symbols-outlined text-[#00342b] text-[18px]">
                  analytics
                </span>
                <span className="text-[10px] font-bold text-[#00342b] uppercase tracking-[0.2em]">
                  Kesiapan Akademik
                </span>
              </div>
              <h2 className="font-headline-section text-3xl sm:text-4xl font-extrabold text-[#00342b] tracking-tight mb-3">
                Kesiapan{" "}
                <span className="serif-italic font-light text-[#006e2a]">
                  Tahun Ajaran
                </span>
              </h2>
              <p className="text-[#3f4945]/70 font-body-md text-sm sm:text-base leading-relaxed">
                Status kesiapan komponen utama untuk menjalankan tahun akademik
                secara optimal dengan integrasi data real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              {/* Kesiapan cards — driven by checklist from API */}
              {[
                {
                  key: "siswa_terdistribusi",
                  label: "Data Siswa",
                  icon: "person",
                  color: "#006e2a",
                },
                {
                  key: "guru_mengajar",
                  label: "Data Guru",
                  icon: "school",
                  color: "#006e2a",
                },
                {
                  key: "rombel_dibuat",
                  label: "Data Kelas",
                  icon: "meeting_room",
                  color: "#006e2a",
                },
                {
                  key: "mapel_lengkap",
                  label: "Mata Pelajaran",
                  icon: "menu_book",
                  color: "#006e2a",
                },
              ].map(({ key, label, icon, color }) => {
                const isDone = !!checklist[key];
                const pct = isDone ? 100 : 0;
                return (
                  <div
                    key={key}
                    className="group/stat bg-white/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-[#006e2a]/20 hover:-translate-y-1 transition-all duration-500 ease-out"
                  >
                    <div className="flex justify-between items-start mb-6 sm:mb-8">
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center group-hover/stat:scale-110 group-hover/stat:-rotate-3 transition-all duration-500"
                        style={{
                          background: `${isDone ? color : "#3f4945"}22`,
                          color: isDone ? color : "#3f4945",
                        }}
                      >
                        <span className="material-symbols-outlined text-[24px] sm:text-[28px]">
                          {icon}
                        </span>
                      </div>
                      <span
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border"
                        style={{
                          background: isDone ? `${color}1a` : "#3f494522",
                          color: isDone ? color : "#3f4945",
                          borderColor: isDone ? `${color}33` : "#bfc9c430",
                        }}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isDone ? "animate-pulse" : ""}`}
                          style={{ background: isDone ? color : "#3f4945" }}
                        />
                        {isDone ? "Terpenuhi" : "Belum"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <p className="text-xs font-bold text-[#3f4945]/50 uppercase tracking-widest font-headline-card">
                        {label}
                      </p>
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#00342b] font-headline-card leading-none">
                          {isDone ? "✓" : "—"}
                        </span>
                        <div className="flex-1 max-w-[120px] mb-1">
                          <div className="relative w-full h-1.5 bg-[#e1e3e2] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: isDone ? color : "#bfc9c4",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Readiness Gauge & Alerts */}
          <div className="lg:w-[380px] flex flex-col gap-8 flex-1">
            <div className="bg-white border border-[#bfc9c4]/20 rounded-[2.5rem] flex flex-col items-center text-center shadow-xl p-6 sm:p-8 relative overflow-hidden h-full">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#006e2a]/5 rounded-full blur-2xl"></div>
              <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h4 className="font-headline-card text-base sm:text-lg font-extrabold text-[#00342b]">
                    Visualisasi Kesiapan
                  </h4>
                  <span className="material-symbols-outlined text-[#006e2a]">
                    insights
                  </span>
                </div>

                {(() => {
                  const checklistItems = Object.values(checklist);
                  const totalItems = checklistItems.length || 10;
                  const doneItems = checklistItems.filter(Boolean).length;
                  const overallPct =
                    totalItems > 0
                      ? Math.round((doneItems / totalItems) * 100)
                      : 0;

                  // Ganjil: ta_dibuat + semester_dibuat + rombel_dibuat + guru_mengajar + jadwal_selesai
                  const ganjilKeys = [
                    "ta_dibuat",
                    "semester_dibuat",
                    "rombel_dibuat",
                    "guru_mengajar",
                    "jadwal_selesai",
                  ];
                  const ganjilDone = ganjilKeys.filter(
                    (k) => checklist[k],
                  ).length;
                  const ganjilPct = Math.round(
                    (ganjilDone / ganjilKeys.length) * 100,
                  );

                  // Genap: mapel_lengkap + wali_kelas + kalender + siswa_terdistribusi + kepsek_dikunci
                  const genapKeys = [
                    "mapel_lengkap",
                    "wali_kelas",
                    "kalender",
                    "siswa_terdistribusi",
                    "kepsek_dikunci",
                  ];
                  const genapDone = genapKeys.filter(
                    (k) => checklist[k],
                  ).length;
                  const genapPct = Math.round(
                    (genapDone / genapKeys.length) * 100,
                  );

                  const outerCircumference = 2 * Math.PI * 42; // ≈ 263.89
                  const outerOffset =
                    outerCircumference -
                    (overallPct / 100) * outerCircumference;
                  const innerCircumference = 2 * Math.PI * 30; // ≈ 188.5
                  const innerOffset =
                    innerCircumference - (ganjilPct / 100) * innerCircumference;

                  return (
                    <>
                      <div className="relative flex justify-center items-center py-4">
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                          <svg
                            className="w-full h-full -rotate-90"
                            viewBox="0 0 100 100"
                          >
                            <circle
                              className="stroke-[#e1e3e2]"
                              cx="50"
                              cy="50"
                              fill="none"
                              r="42"
                              strokeWidth="8"
                            />
                            <circle
                              className="stroke-[#006e2a] drop-shadow-[0_0_8px_rgba(0,200,83,0.4)]"
                              cx="50"
                              cy="50"
                              fill="none"
                              r="42"
                              strokeDasharray={outerCircumference}
                              strokeDashoffset={outerOffset}
                              strokeLinecap="round"
                              strokeWidth="8"
                            />
                            <circle
                              className="stroke-[#e1e3e2]"
                              cx="50"
                              cy="50"
                              fill="none"
                              r="30"
                              strokeWidth="8"
                            />
                            <circle
                              className="stroke-[#006e2a]/30"
                              cx="50"
                              cy="50"
                              fill="none"
                              r="30"
                              strokeDasharray={innerCircumference}
                              strokeDashoffset={innerOffset}
                              strokeLinecap="round"
                              strokeWidth="8"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-black text-[#00342b] leading-none">
                              {overallPct}%
                            </span>
                            <span className="text-[10px] font-bold text-[#006e2a] uppercase tracking-widest mt-1">
                              Kesiapan
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-[#006e2a]/5 border border-[#006e2a]/10">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-[#006e2a]" />
                            <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest">
                              Ganjil
                            </span>
                          </div>
                          <span className="text-xl font-black text-[#00342b]">
                            {ganjilPct}%
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-[#e1e3e2]/30 border border-[#bfc9c4]/20">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-[#3f4945]/30" />
                            <span className="text-[10px] font-bold text-[#3f4945]/60 uppercase tracking-widest">
                              Genap
                            </span>
                          </div>
                          <span className="text-xl font-black text-[#3f4945]/60">
                            {genapPct}%
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="mt-6 pt-6 border-t border-[#bfc9c4]/15 flex flex-col gap-4">
                  {/* Info Tip */}
                  <div className="flex gap-3 p-3.5 rounded-2xl bg-[#006e2a]/5 border border-[#006e2a]/10 text-left">
                    <span className="material-symbols-outlined text-[#006e2a] text-[18px] shrink-0">
                      info
                    </span>
                    <p className="text-[11px] leading-relaxed text-[#3f4945]/70 font-medium">
                      Metrik dihitung otomatis berdasarkan sinkronisasi data
                      riil dari modul Siswa, Guru, Kelas, dan Jadwal.
                    </p>
                  </div>

                  {/* Action Link */}
                  <button
                    onClick={() => setChecklistModalOpen(true)}
                    className="group/link flex items-center justify-between px-5 py-3 rounded-xl bg-white border border-[#bfc9c4]/30 hover:border-[#006e2a]/50 hover:bg-[#006e2a]/[0.02] hover:shadow-sm transition-all duration-300 w-full"
                  >
                    <span className="text-xs font-bold text-[#006e2a] uppercase tracking-widest">
                      Periksa Kesiapan
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-px bg-[#006e2a]/30 group-hover/link:w-8 transition-all duration-300"></span>
                      <span className="material-symbols-outlined text-[#006e2a] text-[18px] group-hover:translate-x-1.5 transition-transform duration-300">
                        arrow_forward
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Konfigurasi Akademik Dasar ── */}
      <section className="mb-16">
        <div className="flex flex-col gap-3 mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#00342b]/10 border border-[#00342b]/20 w-fit mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006e2a]"></span>
            </span>
            <span className="text-xs font-bold text-[#00342b] uppercase tracking-widest">
              Konfigurasi Akademik Dasar
            </span>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="font-headline-section text-3xl sm:text-4xl font-extrabold text-[#00342b] tracking-tight">
              Konfigurasi{" "}
              <span className="serif-italic font-light text-[#006e2a]">
                Akademik
              </span>
            </h2>
            <div className="h-px bg-gradient-to-r from-[#00342b]/20 to-transparent flex-1 mt-2"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Kurikulum Card */}
          <div className="bg-white border border-[#bfc9c4]/30 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-[#00342b]/20 hover:border-[#00342b]/50 hover:-translate-y-1 transition-all duration-500 ease-out group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a]/20 group-hover:scale-110 transition-all duration-500 ease-out">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                  Kurikulum
                </span>
                <span className="text-base font-bold text-[#00342b]">
                  Merdeka
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-[#bfc9c4]/15 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#006e2a]"></span>
              <span className="text-[11px] font-bold text-[#006e2a] uppercase tracking-wider">
                Aktif
              </span>
            </div>
          </div>

          {/* Struktur Kelas Card */}
          <div className="bg-white border border-[#bfc9c4]/30 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-[#00342b]/20 hover:border-[#00342b]/50 hover:-translate-y-1 transition-all duration-500 ease-out group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a]/20 group-hover:scale-110 transition-all duration-500 ease-out">
                <span className="material-symbols-outlined">account_tree</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                  Struktur Kelas
                </span>
                <span className="text-base font-bold text-[#00342b]">
                  {totalKelas > 0 ? `${totalKelas} Rombel` : "—"}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-[#bfc9c4]/15 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#006e2a]"></span>
              <span className="text-[11px] font-bold text-[#006e2a] uppercase tracking-wider">
                Tersedia
              </span>
            </div>
          </div>

          {/* Mata Pelajaran Card */}
          <div className="bg-white border border-[#bfc9c4]/30 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-[#00342b]/20 hover:border-[#00342b]/50 hover:-translate-y-1 transition-all duration-500 ease-out group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a]/20 group-hover:scale-110 transition-all duration-500 ease-out">
                <span className="material-symbols-outlined">library_books</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                  Mata Pelajaran
                </span>
                <span className="text-base font-bold text-[#00342b]">
                  {totalMapel > 0 ? `${totalMapel} Mapel` : "—"}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-[#bfc9c4]/15 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#006e2a]"></span>
              <span className="text-[11px] font-bold text-[#006e2a] uppercase tracking-wider">
                Tersedia
              </span>
            </div>
          </div>

          {/* Penugasan Guru Card */}
          <div className="bg-white border border-[#bfc9c4]/30 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-[#00342b]/20 hover:border-[#00342b]/50 hover:-translate-y-1 transition-all duration-500 ease-out group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#ffba3b]/10 flex items-center justify-center text-[#d99600] group-hover:bg-[#ffba3b]/20 group-hover:scale-110 transition-all duration-500 ease-out">
                <span className="material-symbols-outlined">group_add</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-widest">
                  Penugasan Guru
                </span>
                <span className="text-base font-bold text-[#00342b]">
                  {totalGuru > 0
                    ? `${totalWaliKelas} / ${totalGuru} Guru`
                    : "—"}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-[#bfc9c4]/15 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d99600] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#d99600] uppercase tracking-wider">
                {totalGuru > 0
                  ? `${Math.max(0, totalGuru - totalWaliKelas)} Belum Ditugaskan`
                  : "Belum ada data"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Daftar Kelas Section ── */}
      <section className="mb-16 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a]">
              <span className="material-symbols-outlined text-[22px]">
                school
              </span>
            </div>
            <div>
              <h3 className="font-headline-card text-xl sm:text-2xl font-extrabold text-[#00342b]">
                Daftar Rombongan Belajar
              </h3>
              <p className="text-xs text-[#3f4945]/70">
                Daftar kelas aktif pada tahun ajaran ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#3f4945]/50 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari kelas, wali, kurikulum..."
                value={searchKelas}
                onChange={(e) => setSearchKelas(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full border border-[#bfc9c4]/40 text-xs bg-white focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] outline-none w-48 sm:w-64"
              />
            </div>
            <button
              onClick={() => navigate("/operator/master/kelas")}
              className="px-4 py-2 rounded-full bg-[#00342b] text-white text-xs font-bold hover:bg-[#004d40] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Kelola Kelas
            </button>
          </div>
        </div>

        {kelasList.length === 0 ? (
          <div className="text-center py-12 text-[#3f4945]/60 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
              school
            </span>
            <p className="text-sm font-medium">
              Belum ada kelas yang terdaftar pada tahun ajaran ini.
            </p>
            <button
              onClick={() => navigate("/operator/master/kelas")}
              className="text-[#006e2a] text-xs font-bold hover:underline"
            >
              + Tambah Kelas Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-[#bfc9c4]/30 text-[#3f4945]/60 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-4">Nama Kelas</th>
                  <th className="pb-3 px-4">Tingkat</th>
                  <th className="pb-3 px-4">Wali Kelas</th>
                  <th className="pb-3 px-4">Kurikulum</th>
                  <th className="pb-3 px-4">Ruangan</th>
                  <th className="pb-3 px-4 text-center">Kapasitas</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bfc9c4]/15">
                {filteredKelas.map((k) => (
                  <tr
                    key={k.id}
                    className="hover:bg-[#f8faf9] transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#00342b] text-sm">
                      {k.nama_kelas}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#00342b]/5 text-[#00342b] font-bold text-[10px]">
                        Tingkat {k.tingkat}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#3f4945]">
                      {k.nama_wali !== "-" ? (
                        k.nama_wali
                      ) : (
                        <span className="italic text-[#3f4945]/40">
                          Belum ditentukan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#3f4945]/80">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#006e2a]">
                          menu_book
                        </span>
                        {k.kurikulum || "Merdeka"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#3f4945]/80">
                      {k.ruangan ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#3f4945]/50">
                            location_on
                          </span>
                          {k.ruangan}
                        </span>
                      ) : (
                        <span className="text-[#3f4945]/40">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-[#00342b]">
                          {k.total_siswa ?? 0}{" "}
                          <span className="text-[#3f4945]/40 font-normal">
                            / {k.kapasitas || 32}
                          </span>
                        </span>
                        <div className="w-16 bg-[#e1e3e2] h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-[#006e2a] h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((k.total_siswa || 0) / (k.kapasitas || 32)) * 100))}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {k.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-bold text-[10px]">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-[#3f4945]/60 font-bold text-[10px]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          navigate(`/operator/master/kelas/${k.id}`)
                        }
                        className="px-3 py-1 rounded-full border border-[#00342b]/20 hover:border-[#00342b] text-[#00342b] hover:bg-[#00342b]/5 font-bold transition-all text-[11px]"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 11. Timeline & Metadata / Danger Zone ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-16 items-stretch">
        {/* Refined Activity Timeline */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-[#bfc9c4]/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-[#00342b]/5 h-full">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#006e2a]/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex justify-between items-center mb-8 sm:mb-12 relative z-10 flex-wrap gap-2">
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-card text-2xl font-extrabold text-[#00342b] tracking-tight">
                Aktivitas{" "}
                <span className="serif-italic font-light text-[#006e2a]">
                  Akademik
                </span>
              </h3>
              <p className="text-xs font-medium text-[#3f4945]/50 uppercase tracking-widest">
                Log Perubahan Terbaru
              </p>
            </div>
            <button
              onClick={() => setChecklistModalOpen(true)}
              className="px-4 py-2 bg-[#f2f4f3] text-[#00342b] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#bfc9c4]/30 hover:bg-[#00342b] hover:text-white transition-all duration-300 shadow-sm"
            >
              Lihat Semua
            </button>
          </div>

          <div className="relative flex-1 z-10">
            {/* Subtle Connection Line */}
            <div className="absolute top-2 bottom-2 w-px bg-gradient-to-b from-[#006e2a]/30 via-[#bfc9c4]/30 to-transparent left-6"></div>

            <div className="flex flex-col gap-6">
              {aktivitas.length > 0 ? (
                aktivitas.slice(0, 3).map((act, index) => (
                  <div
                    key={act.id || index}
                    className="relative flex gap-4 sm:gap-6 group/item cursor-pointer p-2 -ml-2 rounded-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00342b]/5 hover:bg-white/60"
                  >
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-[#bfc9c4]/20 flex items-center justify-center shadow-sm group-hover/item:border-[#006e2a] group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-500">
                      <span className="material-symbols-outlined text-[#006e2a] text-xl">
                        {index === 0
                          ? "check_circle"
                          : index === 1
                            ? "group_add"
                            : "update"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 pt-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-[#006e2a] uppercase tracking-widest">
                          {act.action || "Log"}
                        </span>
                        <span className="text-[9px] font-medium text-[#3f4945]/40">
                          {fmt(act.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-[#3f4945] leading-relaxed">
                        {act.keterangan || act.action}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Default Entry 1 */}
                  <div className="relative flex gap-4 sm:gap-6 group/item cursor-pointer p-2 -ml-2 rounded-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00342b]/5 hover:bg-white/60">
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-[#bfc9c4]/20 flex items-center justify-center shadow-sm group-hover/item:border-[#006e2a] group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-500">
                      <span className="material-symbols-outlined text-[#006e2a] text-xl">
                        check_circle
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 pt-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-[#006e2a] uppercase tracking-widest">
                          Status
                        </span>
                        <span className="text-[9px] font-medium text-[#3f4945]/40">
                          {tglMulaiTA ? fmt(tglMulaiTA) : "15 Jul 2026"}
                        </span>
                      </div>
                      <p className="text-xs text-[#3f4945] leading-relaxed">
                        Semester Ganjil{" "}
                        <span className="font-bold text-[#00342b]">
                          diaktifkan
                        </span>{" "}
                        oleh sistem.
                      </p>
                    </div>
                  </div>

                  {/* Default Entry 2 */}
                  <div className="relative flex gap-4 sm:gap-6 group/item cursor-pointer p-2 -ml-2 rounded-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00342b]/5 hover:bg-white/60">
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-[#bfc9c4]/20 flex items-center justify-center shadow-sm group-hover/item:border-[#00342b] group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-500">
                      <span className="material-symbols-outlined text-[#00342b] text-xl">
                        group_add
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 pt-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-[#00342b] uppercase tracking-widest">
                          Akademik
                        </span>
                        <span className="text-[9px] font-medium text-[#3f4945]/40">
                          {fmt(ta.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-[#3f4945] leading-relaxed">
                        Penambahan{" "}
                        <span className="font-bold text-[#006e2a]">
                          Struktur Kelas &amp; Rombel
                        </span>{" "}
                        ke tahun ajaran.
                      </p>
                    </div>
                  </div>

                  {/* Default Entry 3 */}
                  <div className="relative flex gap-4 sm:gap-6 group/item cursor-pointer p-2 -ml-2 rounded-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00342b]/5 hover:bg-white/60">
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-[#bfc9c4]/20 flex items-center justify-center shadow-sm group-hover/item:border-[#ffba3b] group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-500">
                      <span className="material-symbols-outlined text-[#d99600] text-xl">
                        update
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 pt-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-[#d99600] uppercase tracking-widest">
                          Sistem
                        </span>
                        <span className="text-[9px] font-medium text-[#3f4945]/40">
                          {fmt(ta.updated_at)}
                        </span>
                      </div>
                      <p className="text-xs text-[#3f4945] leading-relaxed">
                        Konfigurasi{" "}
                        <span className="font-bold text-[#00342b]">
                          Semester Genap &amp; Ganjil
                        </span>{" "}
                        diperbarui.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Refined Danger Zone Card */}
        <div className="bg-[#f2f4f3]/50 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-[#ba1a1a]/20 shadow-sm flex flex-col relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-[#ba1a1a]/10 h-fit">
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/islamic-art.png")',
            }}
          ></div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#ba1a1a]/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#ba1a1a]/20 w-fit mb-4 sm:mb-8 shadow-sm">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[18px] animate-pulse">
                security
              </span>
              <span className="text-[10px] font-bold text-[#ba1a1a] uppercase tracking-[0.3em]">
                Zona Berbahaya
              </span>
            </div>

            <h3 className="font-headline-section text-2xl sm:text-3xl font-extrabold text-[#00342b] tracking-tight mb-2 sm:mb-4">
              Arsipkan{" "}
              <span className="serif-italic font-light text-[#ba1a1a]">
                Tahun Ajaran
              </span>
            </h3>

            <p className="text-[#3f4945]/70 font-body-md text-xs sm:text-sm leading-relaxed opacity-80">
              Pengarsipan akan menonaktifkan periode ini dari operasional harian
              namun tetap menjaga integritas data historis untuk pelaporan.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Apakah Anda yakin ingin mengarsipkan Tahun Ajaran "${ta.tahun}"? Data historis tetap terjaga.`,
                    )
                  ) {
                    arsipkanTA.mutate();
                  }
                }}
                disabled={arsipkanTA.isPending}
                className="w-full py-3.5 sm:py-4 bg-white border-2 border-[#ba1a1a]/20 text-[#ba1a1a] font-bold rounded-2xl shadow-sm hover:shadow-xl hover:shadow-[#ba1a1a]/20 hover:bg-[#ba1a1a] hover:text-white hover:border-[#ba1a1a] hover:scale-[1.02] transition-all duration-500 flex items-center justify-center gap-3 group/btn text-sm"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px] group-hover/btn:rotate-12 transition-transform">
                  archive
                </span>
                Arsipkan Sekarang
              </button>

              <div className="flex items-center gap-3.5 p-3.5 sm:p-4 bg-[#3f4945]/5 border border-[#bfc9c4]/20 rounded-2xl opacity-75">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[#3f4945]/60 text-[18px] sm:text-[20px]">
                    lock_reset
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#3f4945]/70 leading-snug">
                  Penghapusan permanen{" "}
                  <span className="font-bold">dinonaktifkan</span> karena data
                  telah terikat dengan modul akademik aktif.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 12. Navigation (Previous & Next Academic Year) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-8 sm:py-12 border-t border-[#bfc9c4]/20 mt-8">
        {/* Previous Year Card */}
        {taPrev ? (
          <button
            onClick={() =>
              navigate(`/operator/master/tahun-ajaran/${taPrev.id}`)
            }
            className="group flex items-center gap-4 sm:gap-5 p-3.5 sm:p-4 sm:pr-8 bg-white/50 hover:bg-white rounded-2xl border border-[#bfc9c4]/20 hover:border-[#006e2a]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a] group-hover:text-white transition-all duration-500 shrink-0">
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em] mb-0.5">
                Tahun Sebelumnya
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#00342b] font-headline-card">
                {taPrev.tahun}
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[#bfc9c4]/30 text-xs text-[#3f4945]/50 text-center sm:text-left">
            Tidak ada tahun ajaran sebelumnya
          </div>
        )}

        {/* Next Year Card */}
        {taNext ? (
          <button
            onClick={() =>
              navigate(`/operator/master/tahun-ajaran/${taNext.id}`)
            }
            className="group flex items-center justify-end sm:justify-start gap-4 sm:gap-5 p-3.5 sm:p-4 sm:pl-8 bg-white/50 hover:bg-white rounded-2xl border border-[#bfc9c4]/20 hover:border-[#006e2a]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out"
          >
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-[#3f4945]/50 uppercase tracking-[0.2em] mb-0.5">
                Tahun Berikutnya
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#00342b] font-headline-card">
                {taNext.tahun}
              </span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a] group-hover:bg-[#006e2a] group-hover:text-white transition-all duration-500 shrink-0">
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[#bfc9c4]/30 text-xs text-[#3f4945]/50 text-center sm:text-right">
            Tidak ada tahun ajaran berikutnya
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ModalEditTahunAjaran
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editData={ta}
        queryClient={queryClient}
      />

      <ModalChecklistKesiapan
        open={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        checklist={checklist}
        navigate={navigate}
      />
    </div>
  );
}
