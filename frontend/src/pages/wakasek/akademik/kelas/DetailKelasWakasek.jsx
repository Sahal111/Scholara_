import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";

// ── Icon helper ───────────────────────────────────────────────────────────────
function Icon({ name, className = "", fill = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={
        fill
          ? {
              fontVariationSettings:
                "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
            }
          : undefined
      }
    >
      {name}
    </span>
  );
}

function initials(nama = "") {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Halaman Utama ─────────────────────────────────────────────────────────────
export default function DetailKelasWakasek() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch info kelas + riwayat akademik + stats
  const { data, isLoading, isError } = useQuery({
    queryKey: ["wakasek-detail-kelas", id],
    queryFn: () =>
      api
        .get(`/operator/master-data/kelas/${id}/riwayat`)
        .then((r) => r.data.data),
    enabled: !!id,
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-text-secondary">
        <Icon
          name="progress_activity"
          className="animate-spin text-primary text-3xl"
        />
        <span>Memuat data kelas...</span>
      </div>
    );

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-text-secondary">
        <Icon name="error_outline" className="text-danger text-5xl" />
        <p className="text-lg font-semibold text-text-primary">
          Data kelas tidak ditemukan
        </p>
        <Link
          to="/wakasek/kelas"
          className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          Kembali ke Daftar Kelas
        </Link>
      </div>
    );

  const { kelas, riwayat_akademik, riwayat_wali, stats } = data;

  // Hitung okupansi dari riwayat aktif (periode aktif)
  const periodeAktif = riwayat_akademik.find((r) => r.is_active);
  const jumlahAktif = periodeAktif?.jumlah_siswa ?? 0;
  const kapasitas = kelas.kapasitas ?? 0;
  const okupansiPct = kapasitas
    ? Math.round((jumlahAktif / kapasitas) * 100)
    : 0;

  return (
    <div className="w-full space-y-6 pb-10 opacity-0 animate-fade-up">
      {/* ── Breadcrumb & Page Header ──────────────────────────────────────── */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-text-secondary mb-3">
          <Link to="/wakasek" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <Link to="/wakasek" className="hover:text-primary transition-colors">
            Master Data
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <Link
            to="/wakasek/kelas"
            className="hover:text-primary transition-colors"
          >
            Kelas
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <span className="text-primary font-semibold">Detail Kelas</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Detail Master Data Kelas
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Kelola dan lihat riwayat data kelas secara terperinci.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/wakasek/kelas"
              className="px-4 py-2 bg-surface-container-lowest border border-border-light text-text-primary rounded-xl font-medium hover:bg-surface-container-low transition-colors flex items-center gap-2"
            >
              <Icon name="arrow_back" className="text-sm" />
              Kembali
            </Link>
            <button className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm">
              <Icon name="edit" className="text-sm" />
              Edit Kelas
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero Card ────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-[18px] border border-border-light shadow-sm p-6 flex flex-col md:flex-row justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />

        {/* Left — info kelas */}
        <div className="flex-1 z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-surface-container-low rounded-2xl border border-border-light flex items-center justify-center shrink-0">
              <span className="font-headline-lg text-headline-lg text-primary">
                {kelas.nama_kelas}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-headline-md text-headline-md text-text-primary">
                  Kelas {kelas.nama_kelas}
                </h3>
                {kelas.is_active ? (
                  <span className="px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Aktif
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-surface-variant text-on-surface-variant border border-border-light rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    Nonaktif
                  </span>
                )}
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Master data referensi untuk pendaftaran dan akademik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <InfoItem
              icon="tag"
              label="Kode Kelas"
              value={`KLS-${String(kelas.id).padStart(3, "0")}`}
            />
            <InfoItem
              icon="signal_cellular_alt"
              label="Tingkat"
              value={`Kelas ${kelas.tingkat}`}
            />
            <InfoItem
              icon="groups"
              label="Kapasitas Default"
              value={`${kapasitas} Siswa`}
            />
            <InfoItem
              icon="meeting_room"
              label="Ruangan Default"
              value={kelas.ruangan ?? "-"}
            />
            <InfoItem
              icon="menu_book"
              label="Kurikulum"
              value={kelas.kurikulum ?? "-"}
            />
            <InfoItem
              icon="person"
              label="Wali Kelas Saat Ini"
              value={kelas.wali?.nama ?? "Belum ditugaskan"}
            />
          </div>
        </div>

        {/* Right — Okupansi */}
        <div className="w-full md:w-72 flex flex-col justify-center bg-surface-container-low/50 p-6 rounded-xl border border-border-light z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="font-section-title text-section-title text-text-primary">
              Okupansi Terkini
            </span>
            <span className="text-2xl font-bold text-primary">
              {jumlahAktif}
              <span className="text-sm text-text-secondary font-normal">
                /{kapasitas}
              </span>
            </span>
          </div>
          <div className="w-full bg-border-light rounded-full h-3 mb-2 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(okupansiPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary text-right">
            {periodeAktif
              ? `Tahun Ajaran ${periodeAktif.tahun_ajaran}`
              : "Belum ada periode aktif"}
          </p>
        </div>
      </div>

      {/* ── Statistics Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tahun Digunakan"
          value={String(stats.total_tahun)}
          iconName="calendar_today"
          colorClass="bg-primary/10 text-primary"
        />
        <StatCard
          label="Total Periode Akademik"
          value={String(riwayat_akademik.length)}
          iconName="layers"
          colorClass="bg-info/10 text-info"
        />
        <StatCard
          label="Total Siswa Pernah Menggunakan"
          value={String(stats.total_siswa_unik)}
          iconName="group"
          colorClass="bg-accent-gold/10 text-accent-gold"
        />
        <StatCard
          label="Total Wali Kelas"
          value={String(stats.total_wali)}
          iconName="person"
          colorClass="bg-secondary/10 text-secondary"
        />
      </div>

      {/* ── Main Grid: Left (2/3) + Right (1/3) ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Riwayat Akademik */}
          <div className="bg-surface-container-lowest rounded-[18px] border border-border-light shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border-light flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="font-section-title text-section-title text-text-primary flex items-center gap-2">
                  <Icon name="history_edu" className="text-primary" />
                  Riwayat Akademik
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Riwayat penggunaan kelas pada setiap Tahun Ajaran.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-surface-container-low/50 border-b border-border-light text-xs uppercase text-text-secondary font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">No</th>
                    <th className="px-6 py-4 whitespace-nowrap">
                      Tahun Ajaran
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap">Wali Kelas</th>
                    <th className="px-6 py-4 whitespace-nowrap">
                      Jumlah Siswa
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light text-sm">
                  {riwayat_akademik.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-text-secondary"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Icon
                            name="history_edu"
                            className="text-3xl text-outline-variant"
                          />
                          <p>Belum ada riwayat akademik untuk kelas ini.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    riwayat_akademik.map((row, idx) => (
                      <tr
                        key={row.tahun_ajaran_id}
                        className="hover:bg-surface-container-low/30 transition-colors group"
                      >
                        <td className="px-6 py-4 text-text-secondary">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-text-primary">
                          {row.tahun_ajaran}
                        </td>
                        <td className="px-6 py-4 text-text-primary">
                          <div className="flex items-center gap-2">
                            {row.wali_foto ? (
                              <img
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                                src={row.wali_foto}
                                alt={row.wali_nama}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                {row.wali_nama ? initials(row.wali_nama) : "?"}
                              </div>
                            )}
                            {row.wali_nama ?? (
                              <span className="italic text-text-secondary text-xs">
                                Belum ditugaskan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-primary">
                          {row.jumlah_siswa}
                        </td>
                        <td className="px-6 py-4">
                          {row.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/20">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-variant text-on-surface-variant border border-border-light">
                              Selesai
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              navigate(
                                `/wakasek/kelas/${id}/periode/${row.tahun_ajaran_id}`,
                              )
                            }
                            className={`font-medium text-sm inline-flex items-center gap-1 transition-colors ${
                              row.is_active
                                ? "text-primary hover:text-primary-container"
                                : "text-text-secondary hover:text-primary opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            Lihat Detail
                            <Icon name="arrow_forward" className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Riwayat Wali Kelas */}
          <div className="bg-surface-container-lowest rounded-[18px] border border-border-light shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border-light">
              <h3 className="font-section-title text-section-title text-text-primary flex items-center gap-2">
                <Icon name="badge" className="text-secondary" />
                Riwayat Wali Kelas
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead className="bg-surface-container-low/50 border-b border-border-light text-xs uppercase text-text-secondary font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Nama Guru</th>
                    <th className="px-6 py-4 whitespace-nowrap">
                      Tahun Ajaran
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light text-sm">
                  {riwayat_wali.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-10 text-center text-text-secondary text-sm"
                      >
                        Belum ada riwayat wali kelas.
                      </td>
                    </tr>
                  ) : (
                    riwayat_wali.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-surface-container-low/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-text-primary">
                          <div className="flex items-center gap-3">
                            {row.guru_foto ? (
                              <img
                                className="w-8 h-8 rounded-full object-cover bg-border-light shrink-0"
                                src={row.guru_foto}
                                alt={row.guru_nama}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {initials(row.guru_nama ?? "")}
                              </div>
                            )}
                            {row.guru_nama ?? "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-primary">
                          {row.tahun_ajaran ?? "-"}
                        </td>
                        <td className="px-6 py-4">
                          {row.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/20">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-variant text-on-surface-variant border border-border-light">
                              Selesai
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Informasi Kelas */}
          <div className="bg-surface-container-lowest rounded-[18px] border border-border-light shadow-sm p-6 bg-gradient-to-b from-transparent to-surface-container-low/30">
            <h3 className="font-section-title text-section-title text-text-primary mb-4 flex items-center gap-2">
              <Icon name="info" className="text-text-secondary" />
              Informasi Kelas
            </h3>
            <div className="space-y-3 text-sm">
              <SistemCard label="Nama Kelas" value={kelas.nama_kelas} />
              <SistemCard label="Tingkat" value={`Kelas ${kelas.tingkat}`} />
              <SistemCard label="Kurikulum" value={kelas.kurikulum ?? "-"} />
              <SistemCard label="Ruangan" value={kelas.ruangan ?? "-"} />
              <SistemCard label="Kapasitas" value={`${kapasitas} Siswa`} />
              <SistemCard
                label="Tahun Ajaran Terkini"
                value={kelas.tahunAjaran?.tahun ?? "-"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-komponen ──────────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-text-secondary mb-1 text-xs uppercase tracking-wide font-medium">
        {label}
      </span>
      <span className="text-text-primary font-medium flex items-center gap-2">
        <Icon name={icon} className="text-sm text-primary" />
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value, iconName, colorClass }) {
  return (
    <div className="bg-surface-container-lowest rounded-[18px] border border-border-light shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-text-secondary text-sm font-medium mb-1">
            {label}
          </p>
          <h4 className="font-headline-lg text-headline-lg text-text-primary">
            {value}
          </h4>
        </div>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
        >
          <Icon name={iconName} />
        </div>
      </div>
    </div>
  );
}

function SistemCard({ label, value }) {
  return (
    <div className="p-3 bg-surface rounded-lg border border-border-light border-dashed">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="font-medium text-text-primary">{value}</p>
    </div>
  );
}
