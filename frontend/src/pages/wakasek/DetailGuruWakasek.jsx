import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { ArrowLeft, Phone, Mail, BookOpen } from "lucide-react";

export default function DetailGuruWakasek() {
  const { nuptk } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["wakasek-guru-detail", nuptk],
    queryFn: () => api.get(`/wakasek/guru/${nuptk}`).then((r) => r.data.data),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );

  const guru = data?.guru;
  const mapelDiampu = data?.mata_pelajaran_diampu ?? [];

  if (!guru)
    return (
      <div className="text-center py-20 text-gray-400">
        Data guru tidak ditemukan.
      </div>
    );

  const fotoUrl = guru.foto
    ? `http://127.0.0.1:8001/storage/${guru.foto}`
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/wakasek/guru")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detail Guru</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Informasi lengkap data guru
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Kolom Kiri */}
        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 overflow-hidden flex-shrink-0">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={guru.nama_lengkap}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-3xl">
                      {guru.nama_lengkap?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {guru.nama_lengkap}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    {guru.jenis_ptk}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    {guru.status_kepegawaian}
                  </span>
                  {guru.golongan && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                      Gol. {guru.golongan}
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${guru.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {guru.is_active ? "Aktif" : "Non-aktif"}
                  </span>
                </div>
              </div>
            </div>

            {/* Data Pribadi */}
            <Section title="Data Pribadi">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="NUPTK" value={guru.nuptk} mono />
                <InfoItem label="NIP" value={guru.nip ?? "-"} mono />
                <InfoItem label="NIK" value={guru.nik ?? "-"} mono />
                <InfoItem
                  label="Jenis Kelamin"
                  value={guru.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                />
                <InfoItem label="Tempat Lahir" value={guru.tempat_lahir} />
                <InfoItem label="Tanggal Lahir" value={guru.tanggal_lahir} />
                <InfoItem label="Agama" value={guru.agama ?? "-"} />
                <InfoItem
                  label="Status Perkawinan"
                  value={guru.status_perkawinan ?? "-"}
                />
                {guru.no_hp && (
                  <InfoItem label="No. HP" value={guru.no_hp} icon={Phone} />
                )}
                {guru.email && (
                  <InfoItem label="Email" value={guru.email} icon={Mail} />
                )}
              </div>
            </Section>

            {/* Kepegawaian */}
            <Section title="Kepegawaian">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Golongan" value={guru.golongan ?? "-"} />
                <InfoItem
                  label="TMT Golongan"
                  value={guru.tmt_golongan ?? "-"}
                />
              </div>
            </Section>

            {/* Alamat */}
            <Section title="Alamat">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InfoItem label="Jalan" value={guru.alamat_jalan ?? "-"} />
                </div>
                <InfoItem
                  label="RT / RW"
                  value={`${guru.rt ?? "-"} / ${guru.rw ?? "-"}`}
                />
                <InfoItem label="Desa/Kelurahan" value={guru.desa ?? "-"} />
                <InfoItem label="Kecamatan" value={guru.kecamatan ?? "-"} />
                <InfoItem
                  label="Kabupaten/Kota"
                  value={guru.kabupaten ?? "-"}
                />
                <InfoItem label="Provinsi" value={guru.provinsi ?? "-"} />
                <InfoItem label="Kode Pos" value={guru.kode_pos ?? "-"} />
              </div>
            </Section>
          </div>
        </div>

        {/* Kolom Kanan — Mata Pelajaran yang Diampu */}
        <div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" /> Mata Pelajaran yang
              Diampu
            </h3>

            {mapelDiampu.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Guru ini belum terjadwal mengajar mata pelajaran apa pun.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mapelDiampu.map((m) => (
                  <div
                    key={m.id_mapel}
                    className="bg-gray-50 rounded-xl p-3 space-y-1"
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {m.nama_mapel ?? "-"}
                    </p>
                    {m.kode_mapel && (
                      <p className="text-xs text-gray-400 font-mono">
                        {m.kode_mapel}
                      </p>
                    )}
                    {m.kelas_diampu?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.kelas_diampu.map((k) => (
                          <span
                            key={k}
                            className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
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
function Section({ title, children }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoItem({ label, value, mono = false, icon: Icon }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p
        className={`text-sm text-gray-700 ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}
