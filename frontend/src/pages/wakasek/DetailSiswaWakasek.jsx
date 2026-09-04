import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import {
  ArrowLeft,
  Phone,
  User,
  Home,
  Calendar,
  School,
  BarChart,
  Users,
  BookOpen,
} from "lucide-react";

export default function DetailSiswaWakasek() {
  const { nisn } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["wakasek-siswa-detail", nisn],
    queryFn: () => api.get(`/wakasek/siswa/${nisn}`).then((r) => r.data.data),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );

  const siswa = data?.siswa;
  const orangTua = data?.orang_tua ?? [];
  const riwayatKelas = data?.riwayat_kelas ?? [];
  const statistikAbsensi = data?.statistik_absensi;

  if (!siswa)
    return (
      <div className="text-center py-20 text-gray-400">
        Data siswa tidak ditemukan.
      </div>
    );

  const fotoUrl = siswa.foto
    ? `http://127.0.0.1:8001/storage/${siswa.foto}`
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/wakasek/siswa")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detail Siswa</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Informasi lengkap data siswa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Kolom Kiri - Data Utama */}
        <div className="col-span-2 space-y-6">
          {/* Profil Siswa */}
          <div className="card">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-green-100 overflow-hidden flex-shrink-0">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={siswa.nama_lengkap}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-green-700 font-bold text-3xl">
                      {siswa.nama_lengkap?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {siswa.nama_lengkap}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    NISN: {siswa.nisn}
                  </span>
                  {siswa.kelas_aktif && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                      {siswa.kelas_aktif.nama_kelas}
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      siswa.status_pd === "Aktif"
                        ? "bg-green-100 text-green-700"
                        : siswa.status_pd === "Lulus"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {siswa.status_pd}
                  </span>
                </div>
              </div>
            </div>

            {/* Data Pribadi */}
            <Section title="Data Pribadi" icon={User}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="NISN" value={siswa.nisn} mono />
                <InfoItem label="NIK" value={siswa.nik ?? "-"} mono />
                <InfoItem
                  label="No. Induk"
                  value={siswa.no_induk ?? "-"}
                  mono
                />
                <InfoItem
                  label="Kode Anak"
                  value={siswa.kode_anak ?? "-"}
                  mono
                />
                <InfoItem
                  label="Jenis Kelamin"
                  value={
                    siswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"
                  }
                />
                <InfoItem label="Agama" value={siswa.agama ?? "-"} />
                <InfoItem
                  label="Tempat Lahir"
                  value={siswa.tempat_lahir ?? "-"}
                />
                <InfoItem
                  label="Tanggal Lahir"
                  value={siswa.tanggal_lahir ?? "-"}
                />
                <InfoItem
                  label="Anak Ke"
                  value={siswa.anak_ke ? `${siswa.anak_ke}` : "-"}
                />
                <InfoItem
                  label="Status Dalam Keluarga"
                  value={siswa.status_dalam_keluarga ?? "-"}
                />
                <InfoItem
                  label="Nama Ibu Kandung"
                  value={siswa.nama_ibu_kandung ?? "-"}
                />
                <InfoItem
                  label="Kewarganegaraan"
                  value={siswa.kewarganegaraan ?? "-"}
                />
                {siswa.no_hp && (
                  <InfoItem label="No. HP" value={siswa.no_hp} icon={Phone} />
                )}
              </div>
            </Section>

            {/* Alamat */}
            <Section title="Alamat" icon={Home}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InfoItem label="Jalan" value={siswa.alamat_jalan ?? "-"} />
                </div>
                <InfoItem
                  label="RT / RW"
                  value={`${siswa.rt ?? "-"} / ${siswa.rw ?? "-"}`}
                />
                <InfoItem label="Desa/Kelurahan" value={siswa.desa ?? "-"} />
                <InfoItem label="Kecamatan" value={siswa.kecamatan ?? "-"} />
                <InfoItem
                  label="Kabupaten/Kota"
                  value={siswa.kabupaten ?? "-"}
                />
                <InfoItem label="Provinsi" value={siswa.provinsi ?? "-"} />
                <InfoItem label="Kode Pos" value={siswa.kode_pos ?? "-"} />
              </div>
            </Section>

            {/* Data Akademik */}
            <Section title="Data Akademik" icon={School}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Asal Sekolah"
                  value={siswa.asal_sekolah ?? "-"}
                />
                <InfoItem
                  label="Tanggal Masuk"
                  value={siswa.tanggal_masuk ?? "-"}
                />
                {siswa.kelas_aktif && (
                  <>
                    <InfoItem
                      label="Kelas Aktif"
                      value={siswa.kelas_aktif.nama_kelas}
                    />
                    <InfoItem
                      label="Tingkat"
                      value={`Tingkat ${siswa.kelas_aktif.tingkat}`}
                    />
                    <InfoItem
                      label="Semester"
                      value={`Semester ${siswa.kelas_aktif.semester ?? "-"}`}
                    />
                    <InfoItem
                      label="No. Absen"
                      value={siswa.kelas_aktif.no_absen ?? "-"}
                    />
                    {siswa.kelas_aktif.tahun_ajaran && (
                      <InfoItem
                        label="Tahun Ajaran"
                        value={siswa.kelas_aktif.tahun_ajaran}
                      />
                    )}
                    {siswa.kelas_aktif.wali_kelas && (
                      <InfoItem
                        label="Wali Kelas"
                        value={siswa.kelas_aktif.wali_kelas.nama}
                      />
                    )}
                  </>
                )}
              </div>
            </Section>
          </div>

          {/* Riwayat Kelas */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" /> Riwayat Kelas
            </h3>

            {riwayatKelas.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                Belum ada riwayat kelas.
              </div>
            ) : (
              <div className="space-y-3">
                {riwayatKelas.map((rk, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-xl p-4 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <School className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-800">
                          {rk.nama_kelas ?? "-"}
                        </p>
                        {rk.status_keluar && rk.status_keluar !== "Aktif" ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                            Keluar
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>
                          Tingkat {rk.tingkat} • Semester {rk.semester}
                        </p>
                        <p>Tahun Ajaran: {rk.tahun_ajaran ?? "-"}</p>
                        <p>No. Absen: {rk.no_absen ?? "-"}</p>
                        <p>
                          Masuk:{" "}
                          {rk.tanggal_masuk
                            ? new Date(rk.tanggal_masuk).toLocaleDateString(
                                "id-ID",
                              )
                            : "-"}
                        </p>
                        {rk.status_keluar && rk.status_keluar !== "Aktif" && (
                          <p>
                            Keluar:{" "}
                            {rk.tanggal_keluar
                              ? new Date(rk.tanggal_keluar).toLocaleDateString(
                                  "id-ID",
                                )
                              : "-"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan - Info Pendukung */}
        <div className="space-y-6">
          {/* Statistik Absensi */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-gray-500" /> Statistik Absensi
            </h3>

            {statistikAbsensi && statistikAbsensi.total > 0 ? (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-gray-100">
                  <p className="text-3xl font-bold text-primary-600">
                    {statistikAbsensi.persentase_kehadiran}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tingkat Kehadiran
                  </p>
                </div>

                <div className="space-y-2">
                  <StatItem
                    label="Total Pertemuan"
                    value={statistikAbsensi.total}
                    color="gray"
                  />
                  <StatItem
                    label="Hadir"
                    value={statistikAbsensi.hadir}
                    color="green"
                  />
                  <StatItem
                    label="Sakit"
                    value={statistikAbsensi.sakit}
                    color="yellow"
                  />
                  <StatItem
                    label="Izin"
                    value={statistikAbsensi.izin}
                    color="blue"
                  />
                  <StatItem
                    label="Alpa"
                    value={statistikAbsensi.alpa}
                    color="red"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Belum ada data absensi.</p>
              </div>
            )}
          </div>

          {/* Data Orang Tua */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" /> Data Orang Tua
            </h3>

            {orangTua.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Belum ada data orang tua terdaftar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orangTua.map((ortu, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {ortu.nama_lengkap ?? "-"}
                        </p>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          {ortu.hubungan ?? "Orang Tua"}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 pt-1">
                      {ortu.nik && <p className="font-mono">NIK: {ortu.nik}</p>}
                      {ortu.no_hp && (
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ortu.no_hp}
                        </p>
                      )}
                      {ortu.pekerjaan && <p>Pekerjaan: {ortu.pekerjaan}</p>}
                      {ortu.pendidikan && <p>Pendidikan: {ortu.pendidikan}</p>}
                      {ortu.penghasilan && (
                        <p>Penghasilan: {ortu.penghasilan}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoItem({ label, value, mono = false, icon: Icon }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p
        className={`text-sm text-gray-700 ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatItem({ label, value, color }) {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-gray-600">{label}</p>
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[color]}`}
      >
        {value}
      </span>
    </div>
  );
}
