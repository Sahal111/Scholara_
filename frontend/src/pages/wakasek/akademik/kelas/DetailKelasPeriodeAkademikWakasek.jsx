import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";

// ── Icon Helper ────────────────────────────────────────────────────────────────
function Icon({ name, className = "" }) {
  return (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
  );
}

function initials(nama = "") {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DetailKelasPeriodeAkademikWakasek() {
  const { kelasId, periodeId } = useParams(); // periodeId = tahun_ajaran_id
  const [activeTab, setActiveTab] = useState("siswa");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wakasek-detail-kelas-periode", kelasId, periodeId],
    queryFn: () =>
      api
        .get(`/operator/master-data/kelas/${kelasId}/periode/${periodeId}`)
        .then((r) => r.data.data),
    enabled: !!kelasId && !!periodeId,
  });

  const tabs = [
    { id: "informasi", label: "Informasi" },
    { id: "siswa", label: "Siswa" },
    { id: "jadwal", label: "Jadwal" },
    { id: "absensi", label: "Absensi" },
    { id: "nilai", label: "Nilai" },
    { id: "rapor", label: "Rapor" },
    { id: "dokumen", label: "Dokumen" },
    { id: "log", label: "Log Aktivitas" },
  ];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-text-secondary">
        <Icon
          name="progress_activity"
          className="animate-spin text-primary text-3xl"
        />
        <span>Memuat data periode...</span>
      </div>
    );

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-text-secondary">
        <Icon name="error_outline" className="text-danger text-5xl" />
        <p className="text-lg font-semibold text-text-primary">
          Data tidak ditemukan
        </p>
        <Link
          to={`/wakasek/kelas/${kelasId}`}
          className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          Kembali ke Detail Kelas
        </Link>
      </div>
    );

  const {
    kelas,
    tahun_ajaran,
    wali_periode,
    siswa_aktif,
    siswa_keluar,
    total_siswa,
    total_laki,
    total_perempuan,
  } = data;

  const kapasitas = kelas.kapasitas ?? 0;
  const pct = kapasitas ? Math.round((total_siswa / kapasitas) * 100) : 0;
  const strokeOffset = 251.2 - (251.2 * pct) / 100;

  const waliNama = wali_periode?.guru?.nama ?? kelas.wali?.nama ?? null;
  const waliFoto = wali_periode?.guru?.foto ?? null;

  const siswaFiltered = siswa_aktif.filter(
    (r) =>
      (r.siswa?.nama_lengkap ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (r.siswa?.nisn ?? "").includes(search),
  );

  const periodeLabel = `${tahun_ajaran.tahun}`;

  return (
    <div className="w-full space-y-6 pb-10 opacity-0 animate-fade-up">
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex text-sm text-text-secondary font-label-md mb-6">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link
              to="/operator/dashboard"
              className="hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <Icon name="chevron_right" className="text-[16px] mx-1" />
              <Link
                to="/wakasek"
                className="hover:text-primary transition-colors"
              >
                Master Data
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <Icon name="chevron_right" className="text-[16px] mx-1" />
              <Link
                to="/wakasek/kelas"
                className="hover:text-primary transition-colors"
              >
                Kelas
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <Icon name="chevron_right" className="text-[16px] mx-1" />
              <Link
                to={`/wakasek/kelas/${kelasId}`}
                className="hover:text-primary transition-colors"
              >
                Detail Kelas {kelas.nama_kelas}
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <Icon name="chevron_right" className="text-[16px] mx-1" />
              <span className="text-primary font-semibold">
                TA {periodeLabel}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Detail Kelas Periode Akademik
          </h1>
          <p className="text-sm text-text-secondary max-w-2xl">
            Kelola seluruh data operasional kelas berdasarkan Tahun Ajaran dan
            Semester.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={`/wakasek/kelas/${kelasId}`}
            className="px-4 py-2 rounded-xl border border-border-light bg-white text-text-primary text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Kembali
          </Link>
        </div>
      </div>

      {/* ── 2 Column Layout ───────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Column (Main Content) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Hero Card */}
          <div className="bg-white rounded-[18px] border border-border-light p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

            <div className="flex-1 relative z-10 w-full">
              <div className="flex items-center gap-4 mb-6">
                <h2
                  className="text-2xl font-bold text-text-primary"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Kelas {kelas.nama_kelas}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    kelas.is_active
                      ? "bg-on-primary-container text-on-primary-fixed-variant border-primary-fixed"
                      : "bg-surface-variant text-text-secondary border-border-light"
                  }`}
                >
                  {kelas.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                <InfoItem label="Tahun Ajaran" value={tahun_ajaran.tahun} />
                <InfoItem label="Kurikulum" value={kelas.kurikulum ?? "-"} />
                <InfoItem label="Ruangan" value={kelas.ruangan ?? "-"} />
                <InfoItem
                  label="Wali Kelas"
                  value={
                    waliNama ? (
                      <div className="flex items-center gap-2">
                        {waliFoto ? (
                          <img
                            className="w-6 h-6 rounded-full object-cover"
                            src={waliFoto}
                            alt={waliNama}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                            {initials(waliNama)}
                          </div>
                        )}
                        <span className="font-semibold text-text-primary">
                          {waliNama}
                        </span>
                      </div>
                    ) : (
                      <span className="italic text-text-secondary text-sm">
                        Belum ditugaskan
                      </span>
                    )
                  }
                />
                <InfoItem label="Kapasitas" value={`${kapasitas} Siswa`} />
              </div>
            </div>

            {/* Donut Chart */}
            <div className="w-full md:w-auto flex flex-col items-center justify-center p-6 bg-surface-bright rounded-xl border border-border-light shadow-sm shrink-0 relative z-10">
              <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-variant stroke-current"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-primary stroke-current"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    strokeDasharray="251.2"
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-text-primary">
                    {total_siswa}
                    <span className="text-sm font-normal text-text-secondary">
                      /{kapasitas}
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium text-text-secondary text-center">
                Kapasitas Terisi
                <br />({pct}%)
              </span>
            </div>
          </div>

          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="groups"
              iconColor="text-primary"
              iconBg="bg-secondary-container"
              label="Total Siswa"
              value={String(total_siswa)}
              footer={`${total_laki}L / ${total_perempuan}P`}
            />
            <StatCard
              icon="person_remove"
              iconColor="text-warning"
              iconBg="bg-surface-container"
              label="Siswa Keluar"
              value={String(siswa_keluar.length)}
              footer="mutasi / lulus / nonaktif"
            />
            <StatCard
              icon="event_seat"
              iconColor="text-success"
              iconBg="bg-surface-container"
              label="Sisa Kursi"
              value={String(Math.max(kapasitas - total_siswa, 0))}
              progressBar
              progressPercent={pct}
            />
            <StatCard
              icon="book"
              iconColor="text-info"
              iconBg="bg-surface-container"
              label="Tahun Ajaran"
              value={tahun_ajaran.tahun}
              footer={
                tahun_ajaran.is_active ? "Sedang berjalan" : "Sudah selesai"
              }
            />
          </div>

          {/* Content Area with Tabs */}
          <div className="bg-white rounded-[18px] border border-border-light shadow-sm overflow-hidden flex flex-col">
            {/* Navigation Tabs */}
            <div className="border-b border-border-light px-2 pt-2 bg-surface-bright overflow-x-auto">
              <ul className="flex whitespace-nowrap min-w-max">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 rounded-t-lg ${
                        activeTab === tab.id
                          ? "text-primary bg-white border-primary font-semibold"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-container-low border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tab: Informasi */}
            {activeTab === "informasi" && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <InfoCard label="Nama Kelas" value={kelas.nama_kelas} />
                  <InfoCard label="Tingkat" value={`Kelas ${kelas.tingkat}`} />
                  <InfoCard label="Tahun Ajaran" value={tahun_ajaran.tahun} />
                  <InfoCard label="Kurikulum" value={kelas.kurikulum ?? "-"} />
                  <InfoCard label="Ruangan" value={kelas.ruangan ?? "-"} />
                  <InfoCard label="Kapasitas" value={`${kapasitas} siswa`} />
                  <InfoCard
                    label="Wali Kelas"
                    value={waliNama ?? "Belum ditugaskan"}
                  />
                  <InfoCard
                    label="Status Kelas"
                    value={kelas.is_active ? "Aktif" : "Nonaktif"}
                  />
                </div>
              </div>
            )}

            {/* Tab: Siswa */}
            {activeTab === "siswa" && (
              <div className="p-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <div className="relative w-full sm:w-72">
                    <Icon
                      name="search"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]"
                    />
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg bg-surface-bright focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="Cari nama atau NISN..."
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-3 py-2 border border-border-light rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                      <Icon name="download" className="text-[18px]" />
                      Export
                    </button>
                  </div>
                </div>

                {siswaFiltered.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-text-secondary">
                    <Icon name="group_off" className="text-4xl" />
                    <p className="text-sm">
                      {search
                        ? "Tidak ada hasil pencarian."
                        : "Belum ada siswa di periode ini."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table */}
                    <div className="overflow-x-auto border border-border-light rounded-xl">
                      <table className="w-full text-left text-sm text-text-secondary">
                        <thead className="bg-surface-bright text-xs uppercase text-text-secondary font-semibold border-b border-border-light sticky top-0">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">No</th>
                            <th className="px-4 py-3">NISN</th>
                            <th className="px-4 py-3">Nama Lengkap</th>
                            <th className="px-4 py-3">L/P</th>
                            <th className="px-4 py-3">No Absen</th>
                            <th className="px-4 py-3">Tgl Masuk</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                          {siswaFiltered.map((r, idx) => (
                            <tr
                              key={r.id}
                              className="hover:bg-surface-container-lowest transition-colors bg-white"
                            >
                              <td className="px-4 py-3 text-center text-text-secondary">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                                {r.siswa?.nisn ?? "-"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    {initials(r.siswa?.nama_lengkap ?? "")}
                                  </div>
                                  <span className="font-medium text-text-primary">
                                    {r.siswa?.nama_lengkap ?? "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-text-primary">
                                {r.siswa?.jenis_kelamin ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-semibold text-text-primary">
                                {String(r.no_absen ?? "-").padStart(2, "0")}
                              </td>
                              <td className="px-4 py-3 text-text-secondary text-xs">
                                {r.tanggal_masuk
                                  ? new Date(
                                      r.tanggal_masuk,
                                    ).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "-"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2.5 py-1 bg-on-primary-container text-on-primary-fixed-variant text-[10px] uppercase font-bold rounded-full border border-primary-fixed">
                                  Aktif
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-text-secondary">
                        Menampilkan {siswaFiltered.length} dari {total_siswa}{" "}
                        siswa
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Siswa Keluar */}
            {activeTab === "log" && (
              <div className="p-6">
                {siswa_keluar.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-text-secondary">
                    <Icon
                      name="check_circle"
                      className="text-4xl text-success"
                    />
                    <p className="text-sm">
                      Tidak ada siswa yang keluar pada periode ini.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border-light rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-bright text-xs uppercase text-text-secondary font-semibold border-b border-border-light">
                        <tr>
                          <th className="px-4 py-3">Nama Siswa</th>
                          <th className="px-4 py-3">NISN</th>
                          <th className="px-4 py-3">Tgl Masuk</th>
                          <th className="px-4 py-3">Tgl Keluar</th>
                          <th className="px-4 py-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {siswa_keluar.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-surface-container-lowest transition-colors bg-white"
                          >
                            <td className="px-4 py-3 font-medium text-text-primary">
                              {r.siswa?.nama_lengkap ?? "-"}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                              {r.siswa?.nisn ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-text-secondary text-xs">
                              {r.tanggal_masuk
                                ? new Date(r.tanggal_masuk).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-text-secondary text-xs">
                              {r.tanggal_keluar
                                ? new Date(r.tanggal_keluar).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-danger/10 text-danger border border-danger/20 text-[10px] uppercase font-bold rounded-full">
                                {r.jenis_perubahan?.replace(/_/g, " ") ?? "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab placeholder: jadwal, absensi, nilai, rapor, dokumen */}
            {!["informasi", "siswa", "log"].includes(activeTab) && (
              <div className="p-6 text-center text-text-secondary py-16">
                <Icon
                  name="construction"
                  className="text-[48px] text-outline-variant mb-3"
                />
                <p className="text-sm font-medium">
                  Tab {activeTab} belum tersedia
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <aside className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6">
          {/* Summary Card */}
          <div className="bg-white rounded-[18px] border border-border-light p-5 shadow-sm">
            <h3
              className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Icon name="info" className="text-primary text-[20px]" />
              Ringkasan Kelas
            </h3>
            <div className="space-y-4">
              <SummaryRow
                label="Status"
                value={
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      kelas.is_active
                        ? "bg-on-primary-container text-on-primary-fixed-variant"
                        : "bg-surface-variant text-text-secondary"
                    }`}
                  >
                    {kelas.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                }
              />
              <SummaryRow
                label="Wali Kelas"
                value={waliNama ?? "Belum ditugaskan"}
              />
              <SummaryRow
                label="Kapasitas"
                value={`${total_siswa} / ${kapasitas}`}
              />
              <SummaryRow label="Kurikulum" value={kelas.kurikulum ?? "-"} />
              <SummaryRow
                label="Tahun Ajaran"
                value={tahun_ajaran.tahun}
                last
              />
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-[18px] border border-border-light p-5 shadow-sm">
            <h3
              className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Icon name="flash_on" className="text-primary text-[20px]" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <QuickActionButton icon="calendar_month" label="Kelola Jadwal" />
              <QuickActionButton icon="checklist" label="Input Absensi" />
              <QuickActionButton icon="edit_document" label="Input Nilai" />
              <div className="h-px bg-border-light my-2 w-full" />
              <QuickActionButton
                icon="print"
                label="Cetak Daftar Siswa"
                secondary
              />
              <QuickActionButton
                icon="summarize"
                label="Generate Rapor"
                secondary
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-Components ─────────────────────────────────────────────────────────────
function InfoItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">
        {label}
      </span>
      {typeof value === "string" ? (
        <span className="text-sm font-semibold text-text-primary">{value}</span>
      ) : (
        value
      )}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-3 bg-surface-container-lowest rounded-xl border border-border-light">
      <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  footer,
  progressBar,
  progressPercent,
}) {
  return (
    <div className="bg-white p-5 rounded-[18px] border border-border-light shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div
          className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}
        >
          <Icon name={icon} />
        </div>
      </div>
      <div>
        <p className="text-sm text-text-secondary font-medium mb-1">{label}</p>
        <h3
          className="text-2xl font-bold text-text-primary"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {value}
        </h3>
      </div>
      {progressBar && (
        <div className="w-full bg-surface-variant rounded-full h-1.5 mt-auto">
          <div
            className={`h-1.5 rounded-full ${progressPercent >= 100 ? "bg-danger" : progressPercent >= 85 ? "bg-warning" : "bg-success"}`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      )}
      {footer && (
        <div className="text-xs text-text-secondary mt-auto">{footer}</div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, last = false }) {
  return (
    <div
      className={`flex justify-between items-center py-2 ${!last ? "border-b border-border-light/50" : ""}`}
    >
      <span className="text-sm text-text-secondary">{label}</span>
      {typeof value === "string" ? (
        <span className="text-sm font-medium text-text-primary">{value}</span>
      ) : (
        value
      )}
    </div>
  );
}

function QuickActionButton({ icon, label, secondary = false }) {
  return (
    <button
      className={`flex items-center justify-start gap-3 w-full p-3 rounded-lg border border-border-light transition-all text-sm font-medium text-text-primary group ${
        secondary
          ? "hover:bg-surface-container-low"
          : "hover:border-primary hover:bg-surface-bright hover:text-primary"
      }`}
    >
      <Icon
        name={icon}
        className={`text-text-secondary text-[20px] ${!secondary ? "group-hover:text-primary transition-colors" : ""}`}
      />
      {label}
    </button>
  );
}
