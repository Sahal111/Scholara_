import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { Search, Eye, Filter } from "lucide-react";

const fetchSiswa = (search, idKelas, statusPd, jenisKelamin) =>
  api
    .get("/wakasek/siswa", {
      params: {
        search,
        id_kelas: idKelas,
        status_pd: statusPd,
        jenis_kelamin: jenisKelamin,
      },
    })
    .then((r) => r.data.data);

const fetchKelasFilter = () =>
  api.get("/wakasek/kelas-filter").then((r) => r.data.data);

export default function DataSiswaWakasek() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [idKelas, setIdKelas] = useState("");
  const [statusPd, setStatusPd] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["wakasek-siswa", search, idKelas, statusPd, jenisKelamin],
    queryFn: () => fetchSiswa(search, idKelas, statusPd, jenisKelamin),
    keepPreviousData: true,
  });

  const { data: kelasOptions } = useQuery({
    queryKey: ["wakasek-kelas-filter"],
    queryFn: fetchKelasFilter,
  });

  const siswaList = data?.data ?? [];

  const handleReset = () => {
    setSearch("");
    setIdKelas("");
    setStatusPd("");
    setJenisKelamin("");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Siswa</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Daftar seluruh siswa (khusus lihat)
        </p>
      </div>

      {/* Filter Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3 text-gray-600">
          <Filter className="w-4 h-4" />
          <p className="text-sm font-medium">Filter Data Siswa</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>

          <select
            value={idKelas}
            onChange={(e) => setIdKelas(e.target.value)}
            className="input-field"
          >
            <option value="">Semua Kelas</option>
            {kelasOptions?.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>

          <select
            value={statusPd}
            onChange={(e) => setStatusPd(e.target.value)}
            className="input-field"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Mutasi">Mutasi</option>
            <option value="Lulus">Lulus</option>
            <option value="Keluar">Keluar</option>
          </select>

          <select
            value={jenisKelamin}
            onChange={(e) => setJenisKelamin(e.target.value)}
            className="input-field"
          >
            <option value="">Semua Jenis Kelamin</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        {(search || idKelas || statusPd || jenisKelamin) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Nama Siswa
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                NISN
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Kelas
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Jenis Kelamin
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Status
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
            ) : siswaList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Belum ada data siswa.
                </td>
              </tr>
            ) : (
              siswaList.map((s) => (
                <tr
                  key={s.nisn}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/wakasek/siswa/${s.nisn}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {s.foto ? (
                          <img
                            src={`http://127.0.0.1:8001/storage/${s.foto}`}
                            alt={s.nama_lengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-green-700 font-semibold text-xs">
                            {s.nama_lengkap?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {s.nama_lengkap}
                        </p>
                        {s.kelas_aktif && (
                          <p className="text-xs text-gray-400">
                            {s.kelas_aktif.nama_kelas}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                    {s.nisn}
                  </td>
                  <td className="px-6 py-4">
                    {s.kelas_aktif ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {s.kelas_aktif.nama_kelas}
                        </p>
                        <p className="text-xs text-gray-400">
                          Tingkat {s.kelas_aktif.tingkat}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        s.status_pd === "Aktif"
                          ? "bg-green-100 text-green-700"
                          : s.status_pd === "Lulus"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.status_pd}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/wakasek/siswa/${s.nisn}`);
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
            Menampilkan {siswaList.length} dari {data.total} siswa
          </div>
        )}
      </div>
    </div>
  );
}
