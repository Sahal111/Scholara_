import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { Search, Eye } from "lucide-react";

const jenisPtkOptions = [
  "Kepala Sekolah",
  "Guru Kelas",
  "Guru Mapel",
  "Guru BK",
  "Tenaga Administrasi",
  "Pustakawan",
  "Laboran",
  "Penjaga Sekolah",
  "Lainnya",
];

const fetchGuru = (search, jenis, statusAktif) =>
  api
    .get("/wakasek/guru", {
      params: { search, jenis_ptk: jenis, status_aktif: statusAktif },
    })
    .then((r) => r.data.data);

export default function DataGuruWakasek() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [jenis, setJenis] = useState("");
  const [statusAktif, setStatusAktif] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["wakasek-guru", search, jenis, statusAktif],
    queryFn: () => fetchGuru(search, jenis, statusAktif),
    keepPreviousData: true,
  });

  const gurus = data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Guru</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Daftar seluruh guru dan tenaga pendidik (khusus lihat)
        </p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau NUPTK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
            className="input-field w-full sm:w-48"
          >
            <option value="">Semua Jenis PTK</option>
            {jenisPtkOptions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
          <select
            value={statusAktif}
            onChange={(e) => setStatusAktif(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Non-aktif</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Nama Guru
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                NUPTK
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Jenis PTK
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Status Kepegawaian
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Status Aktif
              </th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Memuat data...
                </td>
              </tr>
            ) : gurus.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Belum ada data guru.
                </td>
              </tr>
            ) : (
              gurus.map((g) => (
                <tr
                  key={g.nuptk}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/wakasek/guru/${g.nuptk}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {g.foto ? (
                          <img
                            src={`http://127.0.0.1:8001/storage/${g.foto}`}
                            alt={g.nama_lengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-700 font-semibold text-xs">
                            {g.nama_lengkap?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {g.nama_lengkap}
                        </p>
                        <p className="text-xs text-gray-400">
                          {g.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                    {g.nuptk}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      {g.jenis_ptk}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {g.status_kepegawaian}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${g.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                    >
                      {g.is_active ? "Aktif" : "Non-aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/wakasek/guru/${g.nuptk}`);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data?.total > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            Menampilkan {gurus.length} dari {data.total} guru
          </div>
        )}
      </div>
    </div>
  );
}
