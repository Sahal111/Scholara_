import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/axios";
import { useSemesterAktif } from "../../hooks/api/useTahunAjaran";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Filter,
  CalendarDays,
  BarChart3,
  Users,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  User,
  FileSpreadsheet,
  FileText,
  Settings2,
  AlertTriangle,
} from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

const getDateRange = (
  mode,
  weekOffset = 0,
  month = null,
  year = null,
  semester = null,
  semAktifData = null,
) => {
  const now = new Date();

  if (mode === "minggu") {
    const day = now.getDay(); // 0=Sun
    const mon = new Date(now);
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      dari: `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`,
      sampai: `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`,
    };
  }

  if (mode === "bulan") {
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const lastDay = new Date(y, m, 0).getDate();
    return {
      dari: `${y}-${pad(m)}-01`,
      sampai: `${y}-${pad(m)}-${pad(lastDay)}`,
    };
  }

  if (mode === "semester") {
    // Prioritaskan tanggal riil dari DB jika ada
    if (semAktifData?.tgl_mulai && semAktifData?.tgl_selesai) {
      return { dari: semAktifData.tgl_mulai, sampai: semAktifData.tgl_selesai };
    }
    const y = year ?? now.getFullYear();
    if (semester === 1) return { dari: `${y}-01-01`, sampai: `${y}-06-30` };
    return { dari: `${y}-07-01`, sampai: `${y}-12-31` };
  }

  return { dari: "", sampai: "" };
};

const BULAN_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
].map((label, i) => ({ value: i + 1, label }));

const pct = (count, total) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

const StatBadge = ({ label, value, total, color, extra }) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm font-medium mt-0.5">{label}</p>
      </div>
      {extra}
    </div>
    <p className="text-xs opacity-70 mt-1">{pct(value, total)}% dari total</p>
  </div>
);

// ─── Component ─────────────────────────────────────────────────
export default function RekapAbsensiGuru() {
  const now = new Date();

  // Filter state
  const [kelasId, setKelasId] = useState("");
  const [mode, setMode] = useState("bulan"); // minggu | bulan | semester
  const [weekOffset, setWeekOffset] = useState(0);
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [semester, setSemester] = useState(1);
  const [viewMode, setViewMode] = useState("kelas"); // kelas | siswa
  const [rekapMode, setRekapMode] = useState("harian"); // harian | mapel

  // Ambil semester aktif — set default filter semester & tahun
  const { data: semesterAktif } = useSemesterAktif();
  useEffect(() => {
    if (!semesterAktif) return;
    setSemester(semesterAktif.nama === "Genap" ? 2 : 1);
    if (semesterAktif.tgl_mulai) {
      setTahun(new Date(semesterAktif.tgl_mulai).getFullYear());
    }
  }, [semesterAktif]);

  // Derive date range
  const { dari, sampai } = useMemo(
    () => getDateRange(mode, weekOffset, bulan, tahun, semester, semesterAktif),
    [mode, weekOffset, bulan, tahun, semester, semesterAktif],
  );

  // ── Queries ──────────────────────────────────────────────────
  const { data: kelasList } = useQuery({
    queryKey: ["guru-kelas-dropdown"],
    queryFn: () => api.get("/guru/kelas").then((r) => r.data.data),
    onSuccess: (list) => {
      if (list?.length && !kelasId) setKelasId(list[0].id);
    },
  });

  // auto-select first class
  const effectiveKelasId = kelasId || kelasList?.[0]?.id;

  const { data: rekap, isLoading } = useQuery({
    queryKey: ["guru-rekap", effectiveKelasId, dari, sampai],
    queryFn: () =>
      api
        .get(`/guru/kelas/${effectiveKelasId}/rekap`, {
          params: { dari, sampai },
        })
        .then((r) => r.data.data),
    enabled: !!effectiveKelasId && !!dari && !!sampai,
  });

  // ── Derived totals ────────────────────────────────────────────
  const namaKelas = rekap?.kelas?.nama_kelas ?? effectiveKelasId;
  const siswaList = rekap?.rekap ?? [];

  const total = useMemo(() => {
    const base = { hadir: 0, sakit: 0, izin: 0, alpa: 0, bolos: 0 };
    siswaList.forEach((s) => {
      const data = rekapMode === "harian" ? s.rekap_harian : s.rekap_mapel;
      base.hadir += data?.hadir || 0;
      base.sakit += data?.sakit || 0;
      base.izin += data?.izin || 0;
      base.alpa += data?.alpa || 0;
      if (rekapMode === "harian") {
        base.bolos += data?.bolos_jam_pelajaran || 0;
      }
    });
    return { ...base, all: base.hadir + base.sakit + base.izin + base.alpa };
  }, [siswaList, rekapMode]);

  // ── Render helpers ────────────────────────────────────────────
  const MiniBar = ({ value, max, color }) => (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-4 text-right">{value}</span>
    </div>
  );

  const labelRentang = () => {
    if (mode === "minggu") {
      const { dari: d, sampai: s } = getDateRange("minggu", weekOffset);
      const fmt = (t) =>
        new Date(t).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        });
      return `${fmt(d)} – ${fmt(s)}`;
    }
    if (mode === "bulan") return `${BULAN_OPTIONS[bulan - 1]?.label} ${tahun}`;
    return `Semester ${semester} – ${tahun}`;
  };

  // ── Export Excel ──────────────────────────────────────────────
  const exportExcel = () => {
    if (!siswaList.length) return;
    const periode = labelRentang();
    const rows = siswaList.map((s, i) => {
      const data = rekapMode === "harian" ? s.rekap_harian : s.rekap_mapel;
      const row = {
        No: i + 1,
        "No. Absen": s.no_absen,
        "Nama Siswa": s.nama_lengkap,
        Hadir: data.hadir,
        Sakit: data.sakit,
        Izin: data.izin,
        Alpa: data.alpa,
        Total: data.hadir + data.sakit + data.izin + data.alpa,
      };
      if (rekapMode === "harian") {
        row["Catatan Bolos Mapel"] =
          data.bolos_jam_pelajaran > 0
            ? `${data.bolos_jam_pelajaran}x bolos sebagian`
            : "-";
      }
      return row;
    });

    // Tambah baris total
    const totRow = {
      No: "",
      "No. Absen": "",
      "Nama Siswa": "TOTAL",
      Hadir: total.hadir,
      Sakit: total.sakit,
      Izin: total.izin,
      Alpa: total.alpa,
      Total: total.all,
    };
    if (rekapMode === "harian") totRow["Catatan Bolos Mapel"] = "";

    rows.push(totRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `Rekap ${rekapMode === "harian" ? "Harian" : "Mapel"}`,
    );
    XLSX.writeFile(
      wb,
      `Rekap_Absensi_${rekapMode}_${namaKelas}_${periode}.xlsx`,
    );
  };

  // ── Export PDF ────────────────────────────────────────────────
  const exportPDF = () => {
    if (!siswaList.length) return;
    const periode = labelRentang();
    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Rekap Absensi ${rekapMode === "harian" ? "Harian" : "Per Mapel"} - Kelas ${namaKelas}`,
      pageWidth / 2,
      16,
      { align: "center" },
    );
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Periode: ${periode}  |  ${rekap?.hari_efektif ?? 0} hari efektif`,
      pageWidth / 2,
      23,
      { align: "center" },
    );

    const head =
      rekapMode === "harian"
        ? [
            [
              "No",
              "No.Absen",
              "Nama Siswa",
              "Hadir",
              "Sakit",
              "Izin",
              "Alpa",
              "Catatan Bolos",
              "Total",
            ],
          ]
        : [
            [
              "No",
              "No.Absen",
              "Nama Siswa",
              "Hadir",
              "Sakit",
              "Izin",
              "Alpa",
              "Total Mapel",
            ],
          ];

    const body = siswaList.map((s, i) => {
      const data = rekapMode === "harian" ? s.rekap_harian : s.rekap_mapel;
      if (rekapMode === "harian") {
        return [
          i + 1,
          s.no_absen,
          s.nama_lengkap,
          data.hadir,
          data.sakit,
          data.izin,
          data.alpa,
          data.bolos_jam_pelajaran > 0 ? `${data.bolos_jam_pelajaran}x` : "-",
          data.hadir + data.sakit + data.izin + data.alpa,
        ];
      }
      return [
        i + 1,
        s.no_absen,
        s.nama_lengkap,
        data.hadir,
        data.sakit,
        data.izin,
        data.alpa,
        data.hadir + data.sakit + data.izin + data.alpa,
      ];
    });

    if (rekapMode === "harian") {
      body.push([
        "",
        "",
        "TOTAL",
        total.hadir,
        total.sakit,
        total.izin,
        total.alpa,
        "",
        total.all,
      ]);
    } else {
      body.push([
        "",
        "",
        "TOTAL",
        total.hadir,
        total.sakit,
        total.izin,
        total.alpa,
        total.all,
      ]);
    }

    autoTable(doc, {
      startY: 28,
      head,
      body,
      headStyles: { fillColor: [79, 70, 229] },
      footStyles: { fillColor: [243, 244, 246] },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [237, 233, 254];
        }
      },
    });
    doc.save(`Rekap_Absensi_${rekapMode}_${namaKelas}_${periode}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rekap Absensi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ringkasan kehadiran siswa berdasarkan periode yang dipilih.
          </p>
        </div>
        {/* Download Buttons */}
        {siswaList.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        )}
      </div>

      {/* ── Filter Panel ────────────────────────────────────── */}
      <div className="card p-4 space-y-4">
        {/* Row 1 : kelas + mode */}
        <div className="flex flex-wrap gap-4">
          {/* Pilih Kelas */}
          <div className="sm:w-48">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
              Kelas
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={effectiveKelasId}
                onChange={(e) => setKelasId(e.target.value)}
                className="input-field pl-9 w-full bg-white"
              >
                {kelasList?.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Periode */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
              Periode
            </label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {[
                { val: "minggu", label: "Minggu" },
                { val: "bulan", label: "Bulan" },
                { val: "semester", label: "Semester" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setMode(val)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    mode === val
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
              Tampilkan
            </label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {[
                { val: "kelas", label: "Per Kelas" },
                { val: "siswa", label: "Per Siswa" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setViewMode(val)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === val
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rekap Mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase text-indigo-600 flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5" />
              Mode Rekap
            </label>
            <div className="flex rounded-xl overflow-hidden border border-indigo-200 shadow-sm">
              {[
                { val: "harian", label: "Harian (50%)" },
                { val: "mapel", label: "Per Mata Pelajaran" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setRekapMode(val)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    rekapMode === val
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 : sub-filter per mode */}
        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100">
          {mode === "minggu" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
              >
                ‹ Sebelumnya
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {labelRentang()}
              </span>
              <button
                onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
                disabled={weekOffset === 0}
                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Berikutnya ›
              </button>
            </div>
          )}

          {mode === "bulan" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Bulan
                </label>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(Number(e.target.value))}
                  className="input-field bg-white text-sm"
                >
                  {BULAN_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Tahun
                </label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="input-field bg-white text-sm"
                >
                  {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {mode === "semester" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Semester
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  {[1, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSemester(s)}
                      className={`px-4 py-1.5 text-sm font-medium ${semester === s ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}
                    >
                      Ganjil {s === 1 ? "(1)" : "(2)"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Tahun Ajaran
                </label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="input-field bg-white text-sm"
                >
                  {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Label periode aktif */}
          <span className="text-sm text-gray-500 italic ml-auto">
            Periode:{" "}
            <strong className="text-gray-700 not-italic">
              {labelRentang()}
            </strong>{" "}
            · {rekap?.hari_efektif ?? 0} hari efektif
          </span>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────── */}
      {!isLoading && rekap && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            Ringkasan {rekapMode === "harian" ? "Harian" : "Per Mapel"} - Kelas{" "}
            {namaKelas}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatBadge
              label="Hadir"
              value={total.hadir}
              total={total.all}
              color="bg-green-50 text-green-700 border border-green-100"
            />
            <StatBadge
              label="Sakit"
              value={total.sakit}
              total={total.all}
              color="bg-yellow-50 text-yellow-700 border border-yellow-100"
            />
            <StatBadge
              label="Izin"
              value={total.izin}
              total={total.all}
              color="bg-blue-50 text-blue-700 border border-blue-100"
            />
            <StatBadge
              label="Alpa"
              value={total.alpa}
              total={total.all}
              color="bg-red-50 text-red-700 border border-red-100"
            />
            {rekapMode === "harian" && (
              <StatBadge
                label="Bolos Mapel"
                value={total.bolos}
                total={total.all}
                color="bg-orange-50 text-orange-700 border border-orange-100"
                extra={<AlertTriangle className="w-5 h-5 text-orange-400" />}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────── */}
      {viewMode === "kelas" && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-700 text-sm">
              Rekap Per Kelas (Total semua siswa)
            </h3>
          </div>
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
              Memuat data rekap...
            </div>
          ) : (
            <div className="p-4 grid md:grid-cols-2 gap-4">
              {[
                { label: "Hadir", value: total.hadir, color: "bg-green-500" },
                { label: "Sakit", value: total.sakit, color: "bg-yellow-400" },
                { label: "Izin", value: total.izin, color: "bg-blue-500" },
                { label: "Alpa", value: total.alpa, color: "bg-red-500" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <span className="text-sm font-medium text-gray-600 w-10">
                    {label}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${pct(value, total.all)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-8 text-right">
                    {value}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {pct(value, total.all)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "siswa" && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-8">
                    No
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Nama Siswa
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium w-16">
                    Hadir
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium w-16">
                    Sakit
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium w-16">
                    Izin
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium w-16">
                    Alpa
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium min-w-[120px]">
                    Progress Hadir
                  </th>
                  {rekapMode === "harian" && (
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      Catatan
                    </th>
                  )}
                  <th className="w-20 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-12 text-gray-400"
                    >
                      <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
                      Memuat data...
                    </td>
                  </tr>
                ) : siswaList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-12 text-gray-400"
                    >
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      Tidak ada data absensi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  siswaList.map((s, idx) => {
                    const data =
                      rekapMode === "harian" ? s.rekap_harian : s.rekap_mapel;
                    const tot =
                      data?.hadir + data?.sakit + data?.izin + data?.alpa;
                    return (
                      <tr
                        key={s.nisn}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">
                            {s.nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-400">
                            No. Absen: {s.no_absen}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-green-600">
                            {data?.hadir || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-yellow-500">
                            {data?.sakit || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-blue-500">
                            {data?.izin || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-red-500">
                            {data?.alpa || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <MiniBar
                            value={data?.hadir || 0}
                            max={tot || 1}
                            color="bg-green-400"
                          />
                        </td>
                        {rekapMode === "harian" && (
                          <td className="px-4 py-3 text-center">
                            {data?.bolos_jam_pelajaran > 0 && (
                              <span
                                title={`${data.bolos_jam_pelajaran}x terindikasi bolos jam pelajaran (alpa di 1-2 mapel tapi hadir secara harian)`}
                                className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-semibold cursor-help"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {data.bolos_jam_pelajaran}x Bolos
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/guru/siswa/${s.nisn}/riwayat`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Detail <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
