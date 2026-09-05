// import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  Trash2,
  X,
  KeyRound,
  Edit2,
  Check,
} from "lucide-react";

// ── fetch helpers ──────────────────────────────────────────
const fetchUsers = (role, search) =>
  api
    .get("/operator/users", { params: { role, search } })
    .then((r) => r.data.data);

const fetchKode = () =>
  api
    .get("/operator/pengaturan/kode-registrasi")
    .then((r) => r.data.data.kode_registrasi);

// ── Badge role ─────────────────────────────────────────────
const roleBadge = {
  operator: "bg-purple-100 text-purple-700",
  guru: "bg-blue-100   text-blue-700",
  ortu: "bg-green-100  text-green-700",
  kepsek: "bg-orange-100 text-orange-700",
};

// ── Modal Tambah Akun ──────────────────────────────────────
function ModalTambahAkun({ open, onClose, queryClient }) {
  const [tipe, setTipe] = useState("guru");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    nama_lengkap: "",
    no_hp: "",
    nuptk: "",
    no_sk: "",
    tmt_jabatan: "",
    nisn: "",
    hubungan: "Ayah",
  });

  useEffect(() => {
    if (open) {
      setTipe("guru");
      setForm({
        username: "",
        email: "",
        password: "",
        nama_lengkap: "",
        no_hp: "",
        nuptk: "",
        no_sk: "",
        tmt_jabatan: "",
        nisn: "",
        hubungan: "Ayah",
      });
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/operator/${tipe}`, data),
    onSuccess: () => {
      toast.success("Akun berhasil dibuat!");
      queryClient.invalidateQueries(["users"]);
      onClose();
      setForm({
        username: "",
        email: "",
        password: "",
        nama_lengkap: "",
        no_hp: "",
        nuptk: "",
        no_sk: "",
        tmt_jabatan: "",
        nisn: "",
        hubungan: "Ayah",
      });
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).forEach((e) =>
          toast.error(e[0]),
        );
      } else {
        toast.error(err.response?.data?.message ?? "Gagal membuat akun.");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-gray-800">Tambah Akun Baru</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Tipe akun */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Akun <span className="text-red-500">*</span>
            </label>
            <select
              value={tipe}
              onChange={(e) => setTipe(e.target.value)}
              className="input-field"
            >
              <option value="operator">Operator</option>
              <option value="guru">Guru</option>
              <option value="kepsek">Kepala Sekolah</option>
              <option value="ortu">Orang Tua</option>
            </select>
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Informasi Spesifik
            </h4>

            {/* Field NUPTK (Guru & Kepsek) */}
            {(tipe === "guru" || tipe === "kepsek") && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NUPTK <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nomor NUPTK guru"
                  value={form.nuptk}
                  onChange={(e) => setForm({ ...form, nuptk: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            )}

            {/* Field Kepsek */}
            {tipe === "kepsek" && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No SK
                  </label>
                  <input
                    type="text"
                    placeholder="Opsional"
                    value={form.no_sk}
                    onChange={(e) =>
                      setForm({ ...form, no_sk: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TMT Jabatan
                  </label>
                  <input
                    type="date"
                    value={form.tmt_jabatan}
                    onChange={(e) =>
                      setForm({ ...form, tmt_jabatan: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {/* Field Ortu */}
            {tipe === "ortu" && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NISN Anak <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="NISN siswa yang terdaftar"
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Hubungan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.hubungan}
                    onChange={(e) =>
                      setForm({ ...form, hubungan: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Wali">Wali</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Informasi Akun
            </h4>

            {/* Nama */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama lengkap"
                value={form.nama_lengkap}
                onChange={(e) =>
                  setForm({ ...form, nama_lengkap: e.target.value })
                }
                className="input-field"
                required
              />
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Untuk login"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Email & No HP */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Email aktif"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. HP
                </label>
                <input
                  type="text"
                  placeholder="Opsional"
                  value={form.no_hp}
                  onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Komponen Kode Registrasi ───────────────────────────────
function KodeRegistrasiPanel() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const { data: kode, isLoading } = useQuery({
    queryKey: ["kode-registrasi"],
    queryFn: fetchKode,
  });

  const mutation = useMutation({
    mutationFn: (newKode) =>
      api.post("/operator/pengaturan/kode-registrasi", {
        kode_registrasi: newKode,
      }),
    onSuccess: (res) => {
      toast.success("Kode registrasi berhasil diperbarui.");
      queryClient.setQueryData(
        ["kode-registrasi"],
        res.data.data.kode_registrasi,
      );
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui kode.");
    },
  });

  if (isLoading) return null;

  return (
    <div className="card mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Kode Registrasi Orang Tua
          </h3>
          {isEditing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="input-field py-1 px-2 text-sm w-40"
                autoFocus
              />
              <button
                onClick={() => mutation.mutate(editValue)}
                disabled={mutation.isPending || !editValue}
                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title="Simpan"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <code className="text-lg font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {kode}
              </code>
              <button
                onClick={() => {
                  setEditValue(kode);
                  setIsEditing(true);
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Ubah Kode"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-xs text-gray-500">
          Berikan kode ini kepada orang tua siswa
        </p>
        <p className="text-xs text-gray-500">
          agar mereka bisa mendaftar di sistem.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ManajemenAkun() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["users", roleFilter, search],
    queryFn: () => fetchUsers(roleFilter, search),
    keepPreviousData: true,
  });

  const toggleActive = useMutation({
    mutationFn: (id) => api.patch(`/operator/users/${id}/toggle-active`),
    onSuccess: () => {
      toast.success("Status akun diperbarui.");
      queryClient.invalidateQueries(["users"]);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal."),
  });

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/operator/users/${id}`),
    onSuccess: () => {
      toast.success("Akun berhasil dihapus.");
      queryClient.invalidateQueries(["users"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal menghapus."),
  });

  const users = data?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Akun</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola akun operator, guru, kepala sekolah, dan orang tua
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Akun
        </button>
      </div>

      {/* Panel Kode Registrasi */}
      <KodeRegistrasiPanel />

      {/* Filter & Search */}
      <div className="card mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, username, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-full sm:w-44 bg-white"
          >
            <option value="">Semua Role</option>
            <option value="operator">Operator</option>
            <option value="guru">Guru</option>
            <option value="kepsek">Kepsek</option>
            <option value="ortu">Ortu</option>
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Nama
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Username
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Role
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
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-semibold text-xs">
                            {u.nama_lengkap?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {u.nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.username}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleBadge[u.role?.slug] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {u.role?.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                      >
                        {u.is_active ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle aktif */}
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `${u.is_active ? "Nonaktifkan" : "Aktifkan"} akun ${u.nama_lengkap}?`,
                              )
                            ) {
                              toggleActive.mutate(u.id);
                            }
                          }}
                          title={u.is_active ? "Nonaktifkan" : "Aktifkan"}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {u.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                        {/* Hapus */}
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus akun ${u.nama_lengkap}? Tindakan ini tidak bisa dibatalkan.`,
                              )
                            ) {
                              deleteUser.mutate(u.id);
                            }
                          }}
                          title="Hapus akun"
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {data?.total > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            Menampilkan {users.length} dari {data.total} akun
          </div>
        )}
      </div>

      {/* Modal */}
      <ModalTambahAkun
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        queryClient={queryClient}
      />
    </div>
  );
}
