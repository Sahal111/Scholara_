import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CalendarDays,
  BarChart3,
  Users,
  TrendingDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  School,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Helpers ────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

const BULAN = [
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
];

const getDateRange = (mode, bulan, tahun, semester) => {
  const now = new Date();
  if (mode === "harian") {
    const t = now.toISOString().split("T")[0];
    return { dari: t, sampai: t };
  }
  if (mode === "bulan") {
    const m = bulan ?? now.getMonth() + 1;
    const y = tahun ?? now.getFullYear();
    const last = new Date(y, m, 0).getDate();
    return { dari: `${y}-${pad(m)}-01`, sampai: `${y}-${pad(m)}-${pad(last)}` };
  }
  if (mode === "semester") {
    const y = tahun ?? now.getFullYear();
    return semester === 1
      ? { dari: `${y}-01-01`, sampai: `${y}-06-30` }
      : { dari: `${y}-07-01`, sampai: `${y}-12-31` };
  }
  return { dari: "", sampai: "" };
};

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

const STATUS_COLORS = {
  hadir: "#10b981",
  sakit: "#f59e0b",
  izin: "#3b82f6",
  alpa: "#ef4444",
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className={`rounded-xl p-5 border ${color} flex items-center gap-4`}>
      <div className="w-11 h-11 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-80">{label}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const w = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${w}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">
        {Math.round(w)}%
      </span>
    </div>
  );
}

// ─── Custom tooltip untuk chart ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-gray-600">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span>{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MonitoringAbsensi() {
  const now = new Date();

  // Filter state
  const [mode, setMode] = useState("bulan");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [semester, setSemester] = useState(1);
  const [kelasFilter, setKelasFilter] = useState("all");
  const [chartType, setChartType] = useState("bar"); // bar | line
  const [activeTab, setActiveTab] = useState("rekap"); // rekap | alpa

  const { dari, sampai } = useMemo(
    () => getDateRange(mode, bulan, tahun, semester),
    [mode, bulan, tahun, semester],
  );

  const labelPeriode = useMemo(() => {
    if (mode === "harian")
      return `Hari Ini (${new Date(dari).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })})`;
    if (mode === "bulan") return `${BULAN[bulan - 1]} ${tahun}`;
    return `Semester ${semester} – ${tahun}`;
  }, [mode, bulan, tahun, semester, dari]);

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: kelasList } = useQuery({
    queryKey: ["wakasek-kelas"],
    queryFn: () => api.get("/wakasek/kelas-filter").then((r) => r.data.data),
  });

  const { data: rekapData, isLoading: loadingRekap } = useQuery({
    queryKey: ["wakasek-rekap", dari, sampai],
    queryFn: () =>
      api
        .get("/wakasek/rekap", { params: { dari, sampai } })
        .then((r) => r.data.data),
    enabled: !!dari && !!sampai,
  });

  const { data: alpaData, isLoading: loadingAlpa } = useQuery({
    queryKey: ["wakasek-alpa", dari, sampai],
    queryFn: () =>
      api
        .get("/wakasek/siswa-alpa", { params: { dari, sampai, limit: 20 } })
        .then((r) => r.data.data),
    enabled: !!dari && !!sampai,
  });

  // ── Derived data ─────────────────────────────────────────────────────────
  const rekapList = rekapData?.rekap ?? [];

  const filteredRekap = useMemo(() => {
    if (kelasFilter === "all") return rekapList;
    return rekapList.filter((k) => String(k.id_kelas) === String(kelasFilter));
  }, [rekapList, kelasFilter]);

  const totalAll = useMemo(() => {
    const acc = { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 };
    filteredRekap.forEach((k) => {
      acc.hadir += k.total_hadir;
      acc.sakit += k.total_sakit;
      acc.izin += k.total_izin;
      acc.alpa += k.total_alpa;
    });
    acc.total = acc.hadir + acc.sakit + acc.izin + acc.alpa;
    return acc;
  }, [filteredRekap]);

  const chartData = useMemo(
    () =>
      filteredRekap.map((k) => ({
        name: k.nama_kelas,
        Hadir: k.total_hadir,
        Sakit: k.total_sakit,
        Izin: k.total_izin,
        Alpa: k.total_alpa,
        pct: k.persentase_kehadiran,
      })),
    [filteredRekap],
  );

  const pieData = [
    { name: "Hadir", value: totalAll.hadir },
    { name: "Sakit", value: totalAll.sakit },
    { name: "Izin", value: totalAll.izin },
    { name: "Alpa", value: totalAll.alpa },
  ].filter((d) => d.value > 0);

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!filteredRekap.length) return;
    const rows = filteredRekap.map((k, i) => ({
      No: i + 1,
      Kelas: k.nama_kelas,
      "Total Siswa": k.total_siswa,
      "Hari Efektif": k.hari_efektif,
      Hadir: k.total_hadir,
      Sakit: k.total_sakit,
      Izin: k.total_izin,
      Alpa: k.total_alpa,
      "% Kehadiran": `${k.persentase_kehadiran}%`,
    }));
    rows.push({
      No: "",
      Kelas: "TOTAL",
      "Total Siswa": "",
      "Hari Efektif": "",
      Hadir: totalAll.hadir,
      Sakit: totalAll.sakit,
      Izin: totalAll.izin,
      Alpa: totalAll.alpa,
      "% Kehadiran": `${pct(totalAll.hadir, totalAll.total)}%`,
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
    XLSX.writeFile(
      wb,
      `Rekap_Absensi_${labelPeriode.replace(/\s/g, "_")}.xlsx`,
    );
  };

  const exportPdf = () => {
    if (!filteredRekap.length) return;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Rekap Absensi – " + labelPeriode, 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "MI Nurul Huda · Dicetak: " +
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      14,
      22,
    );

    autoTable(doc, {
      startY: 28,
      head: [
        [
          "No",
          "Kelas",
          "Siswa",
          "Hari Efektif",
          "Hadir",
          "Sakit",
          "Izin",
          "Alpa",
          "% Hadir",
        ],
      ],
      body: [
        ...filteredRekap.map((k, i) => [
          i + 1,
          k.nama_kelas,
          k.total_siswa,
          k.hari_efektif,
          k.total_hadir,
          k.total_sakit,
          k.total_izin,
          k.total_alpa,
          k.persentase_kehadiran + "%",
        ]),
        [
          "",
          "TOTAL",
          "",
          "",
          totalAll.hadir,
          totalAll.sakit,
          totalAll.izin,
          totalAll.alpa,
          pct(totalAll.hadir, totalAll.total) + "%",
        ],
      ],
      headStyles: { fillColor: [79, 70, 229] },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: [30, 30, 30],
        fontStyle: "bold",
      },
      didParseCell: (data) => {
        // baris total (terakhir) di-bold
        if (data.row.index === filteredRekap.length) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [243, 244, 246];
        }
      },
    });

    doc.save("Rekap_Absensi_" + labelPeriode.replace(/\s/g, "_") + ".pdf");
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Monitoring Absensi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau kehadiran seluruh siswa — periode:{" "}
            <strong className="text-gray-700">{labelPeriode}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            disabled={!filteredRekap.length}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={exportPdf}
            disabled={!filteredRekap.length}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* ── Filter ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">
            Periode
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {[
              { val: "harian", label: "Hari Ini" },
              { val: "bulan", label: "Bulanan" },
              { val: "semester", label: "Semester" },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === val
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {mode === "bulan" && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">
                Bulan
              </label>
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {BULAN.map((b, i) => (
                  <option key={i} value={i + 1}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">
                Tahun
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {[
                  now.getFullYear(),
                  now.getFullYear() - 1,
                  now.getFullYear() - 2,
                ].map((y) => (
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
              <label className="block text-xs text-gray-500 mb-1 font-medium">
                Semester
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {[1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSemester(s)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      semester === s
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">
                Tahun
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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

        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">
            Filter Kelas
          </label>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">Semua Kelas</option>
            {kelasList?.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      {!loadingRekap && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Hadir"
            value={totalAll.hadir}
            sub={`${pct(totalAll.hadir, totalAll.total)}% dari total`}
            color="bg-emerald-50 text-emerald-700 border-emerald-100"
            icon={CheckCircle2}
          />
          <StatCard
            label="Sakit"
            value={totalAll.sakit}
            sub={`${pct(totalAll.sakit, totalAll.total)}% dari total`}
            color="bg-amber-50 text-amber-700 border-amber-100"
            icon={CalendarDays}
          />
          <StatCard
            label="Izin"
            value={totalAll.izin}
            sub={`${pct(totalAll.izin, totalAll.total)}% dari total`}
            color="bg-blue-50 text-blue-700 border-blue-100"
            icon={Filter}
          />
          <StatCard
            label="Alpa"
            value={totalAll.alpa}
            sub={`${pct(totalAll.alpa, totalAll.total)}% dari total`}
            color="bg-red-50 text-red-700 border-red-100"
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { val: "rekap", label: "Rekap Per Kelas", icon: BarChart3 },
          { val: "alpa", label: "Siswa Sering Alpa", icon: TrendingDown },
        ].map(({ val, label, icon: Icon }) => (
          <button
            key={val}
            onClick={() => setActiveTab(val)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === val
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*   TAB: REKAP PER KELAS                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "rekap" && (
        <div className="space-y-6">
          {/* Grafik + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart utama */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 text-sm">
                  Grafik Absensi per Kelas —{" "}
                  <span className="text-indigo-600">{labelPeriode}</span>
                </h2>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
                  <button
                    onClick={() => setChartType("bar")}
                    className={`px-3 py-1 font-medium transition-colors ${chartType === "bar" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-3 py-1 font-medium transition-colors ${chartType === "line" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    Line
                  </button>
                </div>
              </div>

              {loadingRekap ? (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full mr-2" />
                  Memuat...
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <School className="w-10 h-10 text-gray-200 mr-2" />
                  Tidak ada data pada periode ini
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  {chartType === "bar" ? (
                    <BarChart data={chartData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        fontSize={11}
                        tick={{ fill: "#6b7280" }}
                      />
                      <YAxis
                        fontSize={11}
                        tick={{ fill: "#6b7280" }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Bar
                        dataKey="Hadir"
                        fill={STATUS_COLORS.hadir}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar
                        dataKey="Sakit"
                        fill={STATUS_COLORS.sakit}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar
                        dataKey="Izin"
                        fill={STATUS_COLORS.izin}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar
                        dataKey="Alpa"
                        fill={STATUS_COLORS.alpa}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={30}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        fontSize={11}
                        tick={{ fill: "#6b7280" }}
                      />
                      <YAxis
                        fontSize={11}
                        tick={{ fill: "#6b7280" }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Hadir"
                        stroke={STATUS_COLORS.hadir}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Sakit"
                        stroke={STATUS_COLORS.sakit}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Izin"
                        stroke={STATUS_COLORS.izin}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Alpa"
                        stroke={STATUS_COLORS.alpa}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart distribusi */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 text-sm mb-4">
                Distribusi Kehadiran
              </h2>
              {loadingRekap ? (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
                </div>
              ) : pieData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-300 text-sm">
                  Belum ada data
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        dataKey="value"
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [v, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map((d, i) => (
                      <div
                        key={d.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i] }}
                          />
                          <span className="text-gray-600">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {d.value}
                          </span>
                          <span className="text-xs text-gray-400 w-10 text-right">
                            {pct(d.value, totalAll.total)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabel rekap per kelas */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-700 text-sm">
                Rekap Absensi Per Kelas
              </h3>
              <span className="ml-auto text-xs text-gray-400">
                {filteredRekap.length} kelas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">
                      Kelas
                    </th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      Siswa
                    </th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      Hari Efektif
                    </th>
                    <th className="text-center px-4 py-3 text-emerald-600 font-medium">
                      Hadir
                    </th>
                    <th className="text-center px-4 py-3 text-amber-600 font-medium">
                      Sakit
                    </th>
                    <th className="text-center px-4 py-3 text-blue-600 font-medium">
                      Izin
                    </th>
                    <th className="text-center px-4 py-3 text-red-600 font-medium">
                      Alpa
                    </th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium min-w-[160px]">
                      % Kehadiran
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingRekap ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-12 text-gray-400"
                      >
                        <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-2" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredRekap.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-12 text-gray-400"
                      >
                        <School className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        Tidak ada data absensi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRekap.map((k) => {
                      const isLow = k.persentase_kehadiran < 75;
                      return (
                        <tr
                          key={k.id_kelas}
                          className={`hover:bg-gray-50 transition-colors ${isLow ? "bg-red-50/30" : ""}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                {k.tingkat}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {k.nama_kelas}
                                </p>
                                {isLow && (
                                  <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                                    <AlertTriangle className="w-3 h-3" />{" "}
                                    Kehadiran rendah
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {k.total_siswa}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {k.hari_efektif}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-emerald-600">
                            {k.total_hadir}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-amber-500">
                            {k.total_sakit}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-blue-500">
                            {k.total_izin}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-red-500">
                            {k.total_alpa}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                value={k.total_hadir}
                                max={
                                  k.total_hadir +
                                  k.total_sakit +
                                  k.total_izin +
                                  k.total_alpa
                                }
                                color={
                                  k.persentase_kehadiran >= 80
                                    ? "#10b981"
                                    : k.persentase_kehadiran >= 60
                                      ? "#f59e0b"
                                      : "#ef4444"
                                }
                              />
                              <span
                                className={`text-xs font-bold w-12 shrink-0 ${
                                  k.persentase_kehadiran >= 80
                                    ? "text-emerald-600"
                                    : k.persentase_kehadiran >= 60
                                      ? "text-amber-600"
                                      : "text-red-600"
                                }`}
                              >
                                {k.persentase_kehadiran}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Baris total */}
                  {filteredRekap.length > 0 && !loadingRekap && (
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                      <td className="px-5 py-3 text-gray-700">
                        Total Keseluruhan
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">—</td>
                      <td className="px-4 py-3 text-center text-gray-600">—</td>
                      <td className="px-4 py-3 text-center text-emerald-700">
                        {totalAll.hadir}
                      </td>
                      <td className="px-4 py-3 text-center text-amber-600">
                        {totalAll.sakit}
                      </td>
                      <td className="px-4 py-3 text-center text-blue-600">
                        {totalAll.izin}
                      </td>
                      <td className="px-4 py-3 text-center text-red-600">
                        {totalAll.alpa}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-indigo-700 font-bold text-sm">
                          {pct(totalAll.hadir, totalAll.total)}% rata-rata
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*   TAB: SISWA SERING ALPA                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "alpa" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-gray-700 text-sm">
              Daftar Siswa Sering Tidak Hadir (Alpa)
            </h3>
            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {labelPeriode}
            </span>
          </div>

          {loadingAlpa ? (
            <div className="py-12 text-center text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full mx-auto mb-2" />
              Memuat data...
            </div>
          ) : !alpaData?.length ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                Tidak ada siswa dengan catatan alpa tinggi
              </p>
              <p className="text-gray-400 text-sm mt-1">
                pada periode {labelPeriode}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alpaData.map((s, idx) => {
                const isCritical = s.total_alpa >= 5;
                const isWarning = s.total_alpa >= 3 && s.total_alpa < 5;
                return (
                  <div
                    key={s.nisn}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${isCritical ? "bg-red-50/40" : ""}`}
                  >
                    {/* Rank */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === 0
                          ? "bg-red-600 text-white"
                          : idx === 1
                            ? "bg-red-400 text-white"
                            : idx === 2
                              ? "bg-red-300 text-white"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                      {s.nama_lengkap?.[0] ?? "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {s.nama_lengkap ?? "-"}
                      </p>
                      <p className="text-xs text-gray-400">NISN: {s.nisn}</p>
                    </div>

                    {/* Badge alpa */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-gray-700"}`}
                        >
                          {s.total_alpa}x
                        </p>
                        <p className="text-xs text-gray-400">alpa</p>
                      </div>

                      {/* Bar visual */}
                      <div className="w-24 hidden sm:block">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-gray-400"}`}
                            style={{
                              width: `${Math.min((s.total_alpa / (alpaData[0]?.total_alpa || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Status badge */}
                      {isCritical && (
                        <span className="hidden sm:flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Kritis
                        </span>
                      )}
                      {isWarning && (
                        <span className="hidden sm:flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Perlu Perhatian
                        </span>
                      )}

                      {/* Link detail */}
                      <Link
                        to={`/wakasek/siswa/${s.nisn}`}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        Detail <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
