import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  tahunAjaranKeys,
  useTahunAjaranList,
  useTahunAjaranDetail,
  useSetTahunAjaranAktif,
  useSetSemesterAktif,
  useDeleteTahunAjaran,
  useArsipkanTahunAjaran,
} from "../../../../hooks/api/useTahunAjaran";
import ModalTahunAjaranComp from "./components/ModalTahunAjaran";
import ModalBuatSemesterComp from "./components/ModalBuatSemester";
import SemesterCardComp from "./components/SemesterCard";
import {
  fmt,
  fmtShortMonthYear,
  fmtLong,
  daysBetween,
  daysRemaining,
  getTglMulai,
  getTglSelesai,
  getStatusTahunAjaran,
} from "./utils/tahunAjaranHelpers";

// ── Alias — komponen dipindah ke ./components/ModalTahunAjaran.jsx ─────────────
const ModalTahunAjaran = ModalTahunAjaranComp;
const ModalBuatSemester = ModalBuatSemesterComp;
const SemesterCard = SemesterCardComp;

// ── Main Page Component ────────────────────────────────────────────────────────
export default function TahunAjaran() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [buatSemesterOpen, setBuatSemesterOpen] = useState(false);
  const [buatSemesterTA, setBuatSemesterTA] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // "semua" | "aktif" | "selesai" | "mendatang"

  // State modal konfirmasi — menggantikan window.confirm() yang tidak bisa di-style
  // dan diblokir di beberapa browser / WebView environment.
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true,
  });

  const openConfirm = ({ title, message, onConfirm, isDanger = true }) =>
    setConfirmModal({ open: true, title, message, onConfirm, isDanger });
  const closeConfirm = () =>
    setConfirmModal((s) => ({ ...s, open: false, onConfirm: null }));

  // State modal arsip — tampilkan textarea catatan opsional
  const [arsipModal, setArsipModal] = useState({
    open: false,
    item: null,
    catatan: "",
    isPending: false,
  });

  const closeArsipModal = () =>
    setArsipModal({ open: false, item: null, catatan: "", isPending: false });

  // Fetch list of Tahun Ajaran
  const { data: listData = [], isLoading } = useTahunAjaranList();

  const list = listData?.data ?? listData ?? [];
  const aktif = list.find((t) => t.is_active);

  // Set default selected ID when data is loaded
  useEffect(() => {
    if (list.length > 0 && !selectedId) {
      setSelectedId(aktif?.id ?? list[0]?.id);
    }
  }, [list, aktif, selectedId]);

  const selectedTA = list.find((t) => t.id === selectedId) || aktif || list[0];

  const handleOpenAction = (e, id) => {
    e.stopPropagation();

    // Tutup kalau tombol yang sama diklik lagi
    if (openActionId === id) {
      setOpenActionId(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const menuWidth = 192;
    const menuHeight = 220;
    const gap = 8;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    // Jika ruang bawah tidak cukup,
    // dropdown muncul ke atas
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - gap;
    }

    // Jangan keluar dari kanan layar
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    // Jangan keluar dari kiri layar
    if (left < 12) {
      left = 12;
    }

    setActionMenuPosition({
      top,
      left,
    });

    setOpenActionId(id);
  };

  // Fetch detail data for the selected academic year (used in sidebar stats)
  const { data: selectedDetailData, isLoading: loadingDetail } =
    useTahunAjaranDetail(selectedTA?.id);

  // Mutations — pakai hooks yang sudah ada (tidak duplikasi logic)
  const setAktif = useSetTahunAjaranAktif();
  const setSemesterAktif = useSetSemesterAktif();
  const hapusMut = useDeleteTahunAjaran();
  const arsipkanMut = useArsipkanTahunAjaran();

  // Wrapper untuk hapus: set selectedId null setelah berhasil
  const hapus = {
    mutate: (id) =>
      hapusMut.mutate(id, { onSuccess: () => setSelectedId(null) }),
    isPending: hapusMut.isPending,
  };

  // Computed summary stats
  const totalTahunAjaran = list.length;
  let totalGanjil = 0;
  let totalGenap = 0;
  let totalSemesterSelesai = 0;
  let totalMendatang = 0;

  list.forEach((t) => {
    const st = getStatusTahunAjaran(t);
    if (st === "SELESAI") totalSemesterSelesai += t.semesters?.length || 2;
    if (st === "AKAN DATANG") totalMendatang += 1;
    t.semesters?.forEach((s) => {
      if (s.nama === "Ganjil") totalGanjil += 1;
      if (s.nama === "Genap") totalGenap += 1;
    });
  });

  // Filter list
  const filtered = list.filter((t) => {
    const matchSearch =
      !search || t.tahun?.toLowerCase().includes(search.toLowerCase());
    const status = getStatusTahunAjaran(t);
    if (!matchSearch) return false;
    if (statusFilter === "aktif") return status === "AKTIF";
    if (statusFilter === "selesai") return status === "SELESAI";
    if (statusFilter === "mendatang") return status === "AKAN DATANG";
    return true;
  });

  // Selected TA metrics — dari API detail, null saat loading
  const metricGuru = selectedDetailData?.total_guru ?? null;
  const metricKelas = selectedDetailData?.total_kelas ?? null;
  const metricMapel = selectedDetailData?.total_mapel ?? null;
  const metricJadwal = selectedDetailData?.total_jadwal ?? null;
  const metricSiswa = selectedDetailData?.total_siswa ?? null;
  const metricWaliKelas = selectedDetailData?.total_wali_kelas ?? null;

  // Active semester name for selected TA
  const selectedActiveSemester =
    selectedTA?.semesters?.find((s) => s.is_active)?.nama ||
    (selectedTA?.semesters?.[0]?.nama ?? "Ganjil");

  // Hitung progress dari checklist jika ada, fallback dari status
  const getAcademicProgress = (t) => {
    // Kalau TA ini yang sedang dipilih dan detail sudah di-load
    if (
      selectedDetailData &&
      selectedTA?.id === t.id &&
      selectedDetailData.checklist
    ) {
      const checks = Object.values(selectedDetailData.checklist);
      const done = checks.filter(Boolean).length;
      return Math.round((done / checks.length) * 100);
    }
    // Fallback dari status saja (tanpa angka palsu)
    const st = getStatusTahunAjaran(t);
    if (st === "AKTIF") return null; // render skeleton
    if (st === "SELESAI") return 100;
    if (st === "AKAN DATANG") return 0;
    return null;
  };

  return (
    <div className="min-h-screen relative w-full space-y-5 animate-fade-up">
      {/* ── Atmospheric Background Blur ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#94d3c1]/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-[#caead6]/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#ffdeac]/15 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
      </div>

      <div className="relative z-10 space-y-5">
        {/* ── 1. Header Section ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-4">
          <div className="relative flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-1">
              Manajemen{" "}
              <span className="font-serif-accent italic text-primary font-normal">
                Tahun Ajaran
              </span>{" "}
              &amp; Semester
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Kelola periode akademik sekolah, semester aktif, serta status
              periode yang digunakan dalam proses akademik secara terpusat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Link ke halaman dedicated */}
            <Link
              to="/operator/master/tahun-ajaran/arsip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm text-xs font-bold transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">
                inventory_2
              </span>
              Arsip
            </Link>
            <Link
              to="/operator/master/tahun-ajaran/recycle-bin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm text-xs font-bold transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">
                delete
              </span>
              Recycle Bin
            </Link>

            <button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.all })
              }
              title="Muat Ulang Data"
              className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-border-light text-text-secondary hover:text-primary hover:bg-surface-container-low flex items-center justify-center transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
            </button>

            <button
              onClick={() => {
                setEditData(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-container text-on-primary rounded-xl text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Tahun Ajaran
            </button>
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <>
          {/* ── 2. Bento Grid Layout (4 Stat Cards) ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Active Period Card */}
            <div className="bg-[#00342b] text-white rounded-2xl p-4 shadow-md relative overflow-hidden border border-[#004d40]">
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold text-[#afefdd] uppercase tracking-widest">
                    Tahun Ajaran Aktif
                  </p>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#69ff87] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#69ff87]" />
                  </span>
                </div>
                <h4 className="text-2xl font-bold text-white">
                  {aktif?.tahun || "-"}
                </h4>
                <p className="text-xs font-medium text-[#94d3c1] mt-1 italic font-serif-accent">
                  {aktif
                    ? `Semester ${aktif.semesters?.find((s) => s.is_active)?.nama || "Ganjil"}`
                    : "Belum Ada Periode Aktif"}
                </p>
              </div>
              <div className="absolute -right-3 -bottom-3 opacity-15 text-white pointer-events-none">
                <span className="material-symbols-outlined text-6xl">
                  calendar_month
                </span>
              </div>
            </div>

            {/* Card 2: Total Tahun Card */}
            <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-4 shadow-sm">
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
              <p className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mb-1">
                Total Tahun Ajaran
              </p>
              <h4 className="text-2xl font-bold text-text-primary">
                {totalTahunAjaran}
              </h4>
              <p className="text-[11px] text-[#006e2a] font-bold mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  school
                </span>
                {totalGanjil} Ganjil • {totalGenap} Genap
              </p>
            </div>

            {/* Card 3: Semester Selesai Card */}
            <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-4 shadow-sm">
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
              <p className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mb-1">
                Semester Selesai
              </p>
              <h4 className="text-2xl font-bold text-text-primary">
                {totalSemesterSelesai}
              </h4>
              <p className="text-[11px] text-[#006e2a] font-bold mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                {totalSemesterSelesai > 0
                  ? `${totalSemesterSelesai} Semester Selesai`
                  : "Belum ada yg selesai"}
              </p>
            </div>

            {/* Card 4: Jadwal Mendatang Card */}
            <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-4 shadow-sm">
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
              <p className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mb-1">
                Jadwal Mendatang
              </p>
              <h4 className="text-2xl font-bold text-text-primary">
                {totalMendatang > 0 ? totalMendatang : aktif ? 1 : 0}
              </h4>
              <p className="text-[11px] text-[#00342b] font-bold mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">event</span>
                {totalMendatang > 0
                  ? `${totalMendatang} TA Mendatang`
                  : aktif
                    ? `Semester ${aktif.semesters?.find((s) => !s.is_active)?.nama ?? "Genap"} Berikutnya`
                    : "Belum ada periode"}
              </p>
            </div>
          </div>

          {/* ── 3. Main Content Area: Data Table + Detail Sidebar ─────────────── */}
          <div className="grid grid-cols-12 gap-5 items-start">
            {/* Main Data Column (Span 8) */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-5">
              {/* Search and Filters Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md border border-white/50 p-3 rounded-2xl shadow-xs">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f4945]/50 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari tahun ajaran (contoh: 2026/2027)..."
                    className="w-full pl-10 pr-9 py-2 bg-white/80 border border-[#bfc9c4]/30 rounded-xl text-xs sm:text-sm text-[#111827] placeholder:text-[#3f4945]/40 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3f4945]/40 hover:text-[#111827]"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        close
                      </span>
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 bg-[#eceeed]/60 p-1 rounded-xl shrink-0 overflow-x-auto">
                  {[
                    { id: "semua", label: "Semua" },
                    { id: "aktif", label: "Aktif" },
                    { id: "selesai", label: "Selesai" },
                    { id: "mendatang", label: "Mendatang" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statusFilter === tab.id
                          ? "bg-white text-[#00342b] shadow-xs"
                          : "text-[#3f4945]/70 hover:text-[#00342b]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Table Card */}
              <div className="bg-white/85 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-xl p-6 sm:p-8 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#bfc9c4]/20">
                        <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                          Tahun Ajaran
                        </th>
                        <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                          Semester
                        </th>
                        <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                          Periode
                        </th>
                        <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                          Status
                        </th>
                        <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                          Data Akademik
                        </th>
                        <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#bfc9c4]/15">
                      {isLoading ? (
                        [...Array(3)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={6} className="py-6 px-3">
                              <div className="h-4 bg-[#eceeed] rounded-lg w-full mb-2" />
                            </td>
                          </tr>
                        ))
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-14 px-3 text-center text-[#3f4945]/60"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
                                calendar_today
                              </span>
                              <p className="font-semibold text-sm">
                                {search
                                  ? "Tidak ada tahun ajaran yang sesuai dengan pencarian."
                                  : "Belum ada data tahun ajaran."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((t) => {
                          const status = getStatusTahunAjaran(t);
                          const isRowSelected = selectedId === t.id;
                          const isExpanded = expandedId === t.id;
                          const academicProg = getAcademicProgress(t);
                          const tMulai = getTglMulai(t);
                          const tSelesai = getTglSelesai(t);
                          const periodeStr =
                            tMulai && tSelesai
                              ? `${fmtShortMonthYear(tMulai)} – ${fmtShortMonthYear(tSelesai)}`
                              : "-";

                          return (
                            <React.Fragment key={t.id}>
                              <tr
                                onClick={() => {
                                  setSelectedId(t.id);
                                  setExpandedId(isExpanded ? null : t.id);
                                }}
                                className={`transition-all duration-300 cursor-pointer group ${
                                  isRowSelected
                                    ? "bg-[#006e2a]/8"
                                    : "hover:bg-[#006e2a]/4"
                                }`}
                              >
                                {/* Tahun Ajaran Column */}
                                <td className="py-6 px-3">
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedId(isExpanded ? null : t.id);
                                      }}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#3f4945]/60 hover:text-[#006e2a] hover:bg-[#006e2a]/10 transition-colors"
                                      title="Lihat Detail Semester"
                                    >
                                      <span
                                        className="material-symbols-outlined text-[18px] transition-transform duration-300"
                                        style={{
                                          transform: isExpanded
                                            ? "rotate(90deg)"
                                            : "rotate(0deg)",
                                        }}
                                      >
                                        chevron_right
                                      </span>
                                    </button>
                                    <div>
                                      <div className="font-headline-card text-[17px] font-extrabold text-[#00342b] group-hover:text-[#006e2a] transition-colors flex items-center gap-2">
                                        {t.tahun}
                                        {isRowSelected && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a]" />
                                        )}
                                      </div>
                                      <span className="text-[11px] text-[#3f4945]/60">
                                        {t.semesters?.length || 2} Semester
                                        Terdaftar
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Semester Column */}
                                <td className="py-6 px-3">
                                  <div className="font-body-md text-sm text-[#191c1c] font-semibold">
                                    {t.semesters?.find((s) => s.is_active)
                                      ?.nama || "Ganjil & Genap"}
                                  </div>
                                  <div className="text-[11px] text-[#3f4945]/60">
                                    {t.is_active
                                      ? "Semester Aktif Berjalan"
                                      : "Periode Reguler"}
                                  </div>
                                </td>

                                {/* Periode Column */}
                                <td className="py-6 px-3">
                                  <div className="font-body-md text-sm text-[#3f4945]/80 font-medium">
                                    {periodeStr}
                                  </div>
                                </td>

                                {/* Status Column */}
                                <td className="py-6 px-3">
                                  {status === "AKTIF" ? (
                                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-label-badge text-[10px] font-bold tracking-widest border border-[#006e2a]/20 shadow-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
                                      AKTIF
                                    </span>
                                  ) : status === "SELESAI" ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eceeed] text-[#3f4945] font-label-badge text-[10px] font-bold tracking-widest">
                                      SELESAI
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-label-badge text-[10px] font-bold tracking-widest border border-[#006e2a]/20">
                                      AKAN DATANG
                                    </span>
                                  )}
                                </td>

                                {/* Data Akademik Column */}
                                <td className="py-6 px-3">
                                  {(() => {
                                    const pct = getAcademicProgress(t);
                                    return (
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-[#bfc9c4]/30 rounded-full overflow-hidden">
                                          {pct !== null ? (
                                            <div
                                              className="h-full rounded-full bg-gradient-to-r from-[#006e2a] to-[#52b788] transition-all duration-700"
                                              style={{ width: `${pct}%` }}
                                            />
                                          ) : (
                                            <div className="h-full w-1/2 rounded-full bg-[#bfc9c4]/50 animate-pulse" />
                                          )}
                                        </div>
                                        <span className="text-[11px] font-bold text-[#3f4945] w-8 text-right">
                                          {pct !== null ? `${pct}%` : "—"}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* Aksi Column */}
                                <td className="py-6 px-3 text-right">
                                  <div
                                    className="inline-flex"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenAction(e, t.id)}
                                      title="Opsi"
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                        openActionId === t.id
                                          ? "bg-[#00342b] text-white shadow-md"
                                          : "text-[#3f4945]/70 hover:text-[#00342b] hover:bg-[#eceeed]"
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[20px]">
                                        more_vert
                                      </span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Sub-row when expanded: Shows Ganjil & Genap breakdown */}
                              {isExpanded && (
                                <tr className="bg-[#006e2a]/[0.03]">
                                  <td
                                    colSpan={6}
                                    className="py-4 px-6 border-b border-[#006e2a]/15"
                                  >
                                    <div className="bg-white rounded-2xl border border-[#bfc9c4]/30 p-4 shadow-sm space-y-3">
                                      <div className="flex items-center justify-between text-xs font-bold text-[#00342b]">
                                        <span className="flex items-center gap-1.5">
                                          <span className="material-symbols-outlined text-[16px] text-[#006e2a]">
                                            calendar_view_month
                                          </span>
                                          Rincian Semester — {t.tahun}
                                        </span>
                                        <span className="text-[11px] text-[#3f4945]/60 font-normal">
                                          Klik detail untuk melihat jadwal,
                                          kelas, dan kurikulum semester
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <SemesterCard
                                          semester={t.semesters?.find(
                                            (s) => s.nama === "Ganjil",
                                          )}
                                          nama="Ganjil"
                                          nomor="1"
                                          taId={t.id}
                                          taIsActive={t.is_active}
                                          onAktifkan={() =>
                                            setSemesterAktif.mutate({
                                              taId: t.id,
                                              semesterNama: "Ganjil",
                                            })
                                          }
                                          onDetail={() =>
                                            navigate(
                                              `/operator/master/tahun-ajaran/${t.id}/semester/Ganjil`,
                                            )
                                          }
                                          onBuat={() => {
                                            setBuatSemesterTA(t);
                                            setBuatSemesterOpen(true);
                                          }}
                                        />
                                        <SemesterCard
                                          semester={t.semesters?.find(
                                            (s) => s.nama === "Genap",
                                          )}
                                          nama="Genap"
                                          nomor="2"
                                          taId={t.id}
                                          taIsActive={t.is_active}
                                          onAktifkan={() =>
                                            setSemesterAktif.mutate({
                                              taId: t.id,
                                              semesterNama: "Genap",
                                            })
                                          }
                                          onDetail={() =>
                                            navigate(
                                              `/operator/master/tahun-ajaran/${t.id}/semester/Genap`,
                                            )
                                          }
                                          onBuat={() => {
                                            setBuatSemesterTA(t);
                                            setBuatSemesterOpen(true);
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Helper */}
                <div className="mt-5 pt-4 border-t border-[#bfc9c4]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#3f4945]/70">
                  <span>
                    Menampilkan <b>{filtered.length}</b> dari {list.length}{" "}
                    tahun ajaran
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#006e2a]">
                      touch_app
                    </span>
                    Pilih baris untuk melihat statistik detail periode di
                    sidebar kanan
                  </span>
                </div>
              </div>
            </div>

            {/* Detail Sidebar Column (Span 4) */}
            <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
              {/* 1. Detail Periode Card */}
              <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
                {/* Decorative Atmosphere Glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#006e2a]/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none transition-colors group-hover:bg-[#006e2a]/10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00342b]/5 rounded-full blur-[50px] -ml-16 -mb-16 pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00342b]/5 flex items-center justify-center border border-[#00342b]/10 text-[#00342b]">
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          analytics
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-text-primary">
                        Detail Periode
                      </h3>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-label-badge text-[10px] font-extrabold tracking-widest border border-[#006e2a]/20 shadow-xs">
                      {selectedTA
                        ? `${selectedTA.tahun} ${selectedActiveSemester.toUpperCase()}`
                        : "2026/2027 GANJIL"}
                    </span>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-[#bfc9c4]/30 via-[#bfc9c4]/10 to-transparent" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 relative z-10">
                  {/* Guru */}
                  <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        person
                      </span>
                    </div>
                    <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                      Total Guru
                    </p>
                    {loadingDetail ? (
                      <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-text-primary">
                        {metricGuru ?? "—"}
                      </p>
                    )}
                  </div>

                  {/* Kelas */}
                  <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        school
                      </span>
                    </div>
                    <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                      Total Kelas
                    </p>
                    {loadingDetail ? (
                      <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-text-primary">
                        {metricKelas ?? "—"}
                      </p>
                    )}
                  </div>

                  {/* Mapel */}
                  <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        menu_book
                      </span>
                    </div>
                    <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                      Mata Pelajaran
                    </p>
                    {loadingDetail ? (
                      <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-text-primary">
                        {metricMapel ?? "—"}
                      </p>
                    )}
                  </div>

                  {/* Jadwal */}
                  <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        calendar_today
                      </span>
                    </div>
                    <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                      Total Jadwal
                    </p>
                    {loadingDetail ? (
                      <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-text-primary">
                        {metricJadwal ?? "—"}
                      </p>
                    )}
                  </div>

                  {/* Siswa */}
                  <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        groups
                      </span>
                    </div>
                    <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                      Total Siswa
                    </p>
                    {loadingDetail ? (
                      <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-text-primary">
                        {metricSiswa ?? "—"}
                      </p>
                    )}
                  </div>

                  {/* Wali Kelas */}
                  <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        manage_accounts
                      </span>
                    </div>
                    <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                      Wali Kelas
                    </p>
                    {loadingDetail ? (
                      <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-text-primary">
                        {metricWaliKelas ?? "—"}
                      </p>
                    )}
                  </div>
                </div>

                {/* View Detail CTA Button */}
                {selectedTA && (
                  <div className="mt-5 relative z-10">
                    <button
                      onClick={() =>
                        navigate(
                          `/operator/master/tahun-ajaran/${selectedTA.id}`,
                        )
                      }
                      className="w-full py-3 rounded-2xl bg-[#00342b] text-white hover:bg-[#004d40] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-[#00342b]/20 hover:shadow-lg"
                    >
                      <span>Buka Rincian Lengkap</span>
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Arsip Card */}
              <div className="bg-surface-container-lowest border border-[#bfc9c4]/30 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                {/* Subtle background glow */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#006e2a]/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="relative z-10">
                  {/* Header Label */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-[#006e2a]" />
                    <span className="font-label-badge text-[10px] text-[#006e2a] font-black tracking-[0.2em] uppercase">
                      Arsip &amp; Recycle Bin
                    </span>
                  </div>

                  {/* Arsip Tahun Ajaran */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center border border-[#006e2a]/20 shadow-sm shrink-0 text-[#006e2a]">
                      <span className="material-symbols-outlined text-[24px]">
                        inventory_2
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-text-primary mb-1.5">
                        Arsip Tahun Ajaran
                      </h4>
                      <p className="font-body-md text-xs text-[#3f4945]/80 leading-relaxed mb-4">
                        Lihat dan kelola tahun ajaran yang telah diarsipkan.
                        Data arsip tidak aktif namun tetap tersimpan untuk
                        referensi.
                      </p>
                      <Link
                        to="/operator/master/tahun-ajaran/arsip"
                        className="w-full bg-[#006e2a] hover:bg-[#004d1a] text-white px-5 py-3 rounded-xl font-label-badge text-[11px] font-black tracking-widest uppercase shadow-md hover:shadow-lg shadow-[#006e2a]/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          inventory_2
                        </span>
                        Buka Arsip
                      </Link>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#bfc9c4]/20 mb-4" />

                  {/* Recycle Bin */}
                  {/* <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#3f4945]/8 flex items-center justify-center border border-[#bfc9c4]/30 shadow-sm shrink-0 text-[#3f4945]">
                      <span className="material-symbols-outlined text-[24px]">
                        delete_sweep
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-text-primary mb-1.5">
                        Recycle Bin
                      </h4>
                      <p className="font-body-md text-xs text-[#3f4945]/80 leading-relaxed mb-4">
                        Pulihkan atau hapus permanen tahun ajaran yang telah
                        dihapus sementara.
                      </p>
                      <Link
                        to="/operator/master/tahun-ajaran/recycle-bin"
                        className="w-full bg-[#eceeed] hover:bg-[#e6e9e8] text-[#3f4945] px-5 py-3 rounded-xl font-label-badge text-[11px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all border border-[#bfc9c4]/30"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          delete_sweep
                        </span>
                        Buka Recycle Bin
                      </Link>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* 3. Danger Zone Card */}
              <div className="bg-surface-container-lowest border border-danger/20 rounded-2xl p-5 shadow-sm">
                {/* Subtle Background Glow */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#ba1a1a]/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="relative z-10">
                  {/* Header Label */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
                    <span className="font-label-badge text-[10px] text-[#ba1a1a] font-black tracking-[0.2em] uppercase">
                      Zona Berbahaya
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center border border-[#ba1a1a]/20 shadow-sm shrink-0 text-[#ba1a1a] group-hover:shadow-[0_0_15px_rgba(186,26,26,0.2)] transition-shadow duration-300">
                      <span className="material-symbols-outlined text-[24px]">
                        warning
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-text-primary mb-1.5">
                        Hapus Periode
                      </h4>
                      {selectedTA?.is_active ? (
                        <>
                          <p className="font-body-md text-xs text-[#3f4945]/80 leading-relaxed mb-4">
                            Periode tidak dapat dihapus karena masih berstatus{" "}
                            <span className="font-bold text-[#ba1a1a]">
                              AKTIF
                            </span>{" "}
                            dan digunakan oleh seluruh modul akademik.
                            Nonaktifkan terlebih dahulu sebelum menghapus.
                          </p>
                          <button
                            disabled
                            className="w-full bg-[#eceeed] text-[#3f4945]/40 px-5 py-3 rounded-xl font-label-badge text-[11px] font-bold tracking-widest uppercase cursor-not-allowed border border-[#bfc9c4]/30 flex items-center justify-center gap-2 shadow-inner"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              lock
                            </span>
                            Hapus Periode
                          </button>
                        </>
                      ) : selectedTA ? (
                        <>
                          <p className="font-body-md text-xs text-[#3f4945]/80 leading-relaxed mb-4">
                            Tindakan ini akan menghapus periode{" "}
                            <b>{selectedTA.tahun}</b> beserta data semesternya
                            secara permanen.
                          </p>
                          <button
                            onClick={() =>
                              openConfirm({
                                title: "Hapus Tahun Ajaran",
                                message: `Periode "${selectedTA.tahun}" beserta data semesternya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                                onConfirm: () => hapus.mutate(selectedTA.id),
                              })
                            }
                            disabled={hapus.isPending}
                            className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white px-5 py-3 rounded-xl font-label-badge text-[11px] font-black tracking-widest uppercase shadow-md hover:shadow-lg shadow-[#ba1a1a]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete_forever
                            </span>
                            Hapus Periode {selectedTA.tahun}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-[#3f4945]/60">
                          Pilih tahun ajaran untuk opsi penghapusan.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
        {/* )} */}
      </div>

      {/* ── 4. Modal Tambah / Edit ────────────────────────────────────────── */}
      {/* ── Action Dropdown Portal ─────────────────────────────── */}
      {openActionId &&
        actionMenuPosition &&
        (() => {
          const actionItem = list.find((item) => item.id === openActionId);
          if (!actionItem) return null;
          const close = () => {
            setOpenActionId(null);
            setActionMenuPosition(null);
          };
          return createPortal(
            <div
              className="fixed z-[9999] w-52"
              style={{
                top: actionMenuPosition.top,
                left: actionMenuPosition.left,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-surface rounded-2xl border border-border-light shadow-xl shadow-black/8 p-1 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                {/* HEADER — nama TA */}
                <div className="px-3 pt-2.5 pb-2 border-b border-border-light mb-1">
                  <p className="text-[11px] font-bold text-text-primary truncate">
                    {actionItem.tahun}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {actionItem.is_active
                      ? "Tahun Ajaran Aktif"
                      : "Periode Tidak Aktif"}
                  </p>
                </div>

                {/* DETAIL */}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    navigate(`/operator/master/tahun-ajaran/${actionItem.id}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-text-primary hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">
                    visibility
                  </span>
                  <span>Lihat Detail</span>
                </button>

                {/* EDIT */}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setEditData({ ...actionItem });
                    setModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-text-primary hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">
                    edit
                  </span>
                  <span>Edit Periode</span>
                </button>

                {/* SET AKTIF */}
                {!actionItem.is_active && (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      openConfirm({
                        title: "Aktifkan Tahun Ajaran",
                        message: `"${actionItem.tahun}" akan dijadikan tahun ajaran aktif. Tahun ajaran yang sedang aktif akan dinonaktifkan secara otomatis.`,
                        onConfirm: () => setAktif.mutate(actionItem.id),
                        isDanger: false,
                      });
                    }}
                    disabled={setAktif.isPending}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-success hover:bg-success/8 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px] text-success">
                      check_circle
                    </span>
                    <span>Jadikan Aktif</span>
                  </button>
                )}

                {/* DIVIDER */}
                <div className="h-px bg-border-light mx-1 my-1" />

                {/* SELESAI & ARSIPKAN — hanya muncul kalau TA tidak aktif */}
                {!actionItem.is_active && (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setArsipModal({
                        open: true,
                        item: actionItem,
                        catatan: "",
                        isPending: false,
                      });
                    }}
                    disabled={arsipkanMut.isPending}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-[#006e2a] hover:bg-[#006e2a]/8 transition-colors disabled:opacity-50"
                  >
                    <span
                      className="material-symbols-outlined text-[18px] text-[#006e2a]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      inventory_2
                    </span>
                    <span>Selesai &amp; Arsipkan</span>
                  </button>
                )}

                {/* DELETE → recycle bin */}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openConfirm({
                      title: "Pindahkan ke Recycle Bin",
                      message: `Periode "${actionItem.tahun}" akan dipindahkan ke recycle bin. Data dapat dipulihkan kembali.`,
                      onConfirm: () => hapus.mutate(actionItem.id),
                    });
                  }}
                  disabled={hapus.isPending || actionItem.is_active}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-danger hover:bg-danger/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px] text-danger">
                    delete
                  </span>
                  <span>Pindah ke Recycle Bin</span>
                </button>

                {/* INFO UNTUK DATA AKTIF */}
                {actionItem.is_active && (
                  <div className="px-3 pb-2">
                    <p className="text-[10px] text-text-secondary/70">
                      Nonaktifkan dulu sebelum mengarsipkan atau menghapus.
                    </p>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          );
        })()}
      {/* </>
      </div> */}

      <ModalTahunAjaran
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
        queryClient={queryClient}
      />
      <ModalBuatSemester
        open={buatSemesterOpen}
        onClose={() => {
          setBuatSemesterOpen(false);
          setBuatSemesterTA(null);
        }}
        tahunAjaran={buatSemesterTA}
        queryClient={queryClient}
      />

      {/* ── Modal Konfirmasi — menggantikan window.confirm() ─────────────────── */}
      {confirmModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            onClick={closeConfirm}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top strip */}
              <div
                className={`h-1.5 w-full ${
                  confirmModal.isDanger ? "bg-[#ba1a1a]" : "bg-[#00c853]"
                }`}
              />
              {/* Body */}
              <div className="px-6 pt-6 pb-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                    confirmModal.isDanger
                      ? "bg-[#ba1a1a]/8 border border-[#ba1a1a]/15"
                      : "bg-[#00c853]/8 border border-[#00c853]/15"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[28px] ${
                      confirmModal.isDanger
                        ? "text-[#ba1a1a]"
                        : "text-[#004d40]"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {confirmModal.isDanger ? "warning" : "check_circle"}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#00342b] mb-2 tracking-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-[#3f4945]/80 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6 pt-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="flex-1 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#eceeed] hover:text-[#00342b] transition-all duration-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm?.();
                    closeConfirm();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-[11px] tracking-[0.1em] uppercase shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 ${
                    confirmModal.isDanger
                      ? "bg-[#ba1a1a] hover:bg-[#93000a] shadow-[#ba1a1a]/20 hover:shadow-[#ba1a1a]/40"
                      : "bg-[#004d40] hover:bg-[#00c853] shadow-[#004d40]/20 hover:shadow-[#00c853]/40"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {confirmModal.isDanger ? "delete" : "check_circle"}
                  </span>
                  {confirmModal.isDanger ? "Ya, Hapus" : "Ya, Aktifkan"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── Modal Arsip ──────────────────────────────────────────────────── */}
      {arsipModal.open &&
        arsipModal.item &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeArsipModal}
          >
            <div
              className="bg-white rounded-[20px] w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#5cfd80]/20 border border-[#006e2a]/20 flex items-center justify-center mx-auto mb-5">
                <span
                  className="material-symbols-outlined text-[#006e2a] text-[30px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  inventory_2
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-extrabold text-[#00342b] text-center mb-1">
                Arsipkan Tahun Ajaran?
              </h3>
              <p className="text-sm text-[#3f4945]/70 text-center mb-5 leading-relaxed">
                Periode{" "}
                <strong className="text-[#00342b]">
                  {arsipModal.item.tahun}
                </strong>{" "}
                akan ditandai sebagai selesai dan dipindahkan ke arsip historis.
                Data tetap aman dan bisa dilihat kapan saja.
              </p>

              {/* Info chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                  Data tetap tersimpan
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">
                    visibility
                  </span>
                  Bisa dilihat kapan saja
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffdeac]/40 text-[#7a4f00] text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">
                    restore
                  </span>
                  Bisa dibatalkan
                </span>
              </div>

              {/* Catatan opsional */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-[#3f4945] uppercase tracking-wider mb-2">
                  Catatan{" "}
                  <span className="font-normal text-[#707975] normal-case tracking-normal">
                    (opsional)
                  </span>
                </label>
                <textarea
                  value={arsipModal.catatan}
                  onChange={(e) =>
                    setArsipModal((s) => ({ ...s, catatan: e.target.value }))
                  }
                  placeholder="Contoh: Tahun ajaran ini telah selesai pada Juli 2025..."
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none bg-[#f2f4f3]/60 border border-[#bfc9c4]/30 rounded-xl py-3 px-4 text-sm text-[#191c1c] placeholder:text-[#3f4945]/40 focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] outline-none transition-all"
                />
                <p className="text-[11px] text-[#707975] mt-1 text-right">
                  {arsipModal.catatan.length}/500
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeArsipModal}
                  disabled={arsipModal.isPending}
                  className="flex-1 py-3 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-xs uppercase tracking-wider hover:bg-[#f2f4f3] transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={arsipModal.isPending || arsipkanMut.isPending}
                  onClick={() => {
                    setArsipModal((s) => ({ ...s, isPending: true }));
                    arsipkanMut.mutate(
                      {
                        id: arsipModal.item.id,
                        catatan: arsipModal.catatan.trim() || undefined,
                      },
                      {
                        onSuccess: () => {
                          toast.success(
                            `Tahun ajaran "${arsipModal.item.tahun}" berhasil diarsipkan.`,
                          );
                          closeArsipModal();
                          setSelectedId(null);
                        },
                        onError: (err) => {
                          toast.error(
                            err.response?.data?.message ??
                              "Gagal mengarsipkan tahun ajaran.",
                          );
                          setArsipModal((s) => ({ ...s, isPending: false }));
                        },
                      },
                    );
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#006e2a] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#00342b] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {arsipModal.isPending || arsipkanMut.isPending ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Mengarsipkan...
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        inventory_2
                      </span>
                      Ya, Arsipkan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
