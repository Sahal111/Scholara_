import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Upload,
  Save,
  Shield,
  CheckCircle2,
  UserCircle,
  Building2,
  BadgeCheck,
  MapPin,
  Calendar,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://127.0.0.1:8001";

const FORM_DEFAULT = {
  email: "",
  no_hp: "",
  password_lama: "",
  password_baru: "",
  password_baru_confirmation: "",
  foto: null,
};

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800">
        {value || "-"}
      </span>
    </div>
  );
}

export default function ProfilWakasek() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(FORM_DEFAULT);
  const [previewImage, setPreviewImage] = useState(null);

  // ── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["wakasek-profil"],
    queryFn: () => api.get("/wakasek/profil").then((r) => r.data.data),
  });

  // ── Mutation ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (values) => {
      const form = new FormData();
      if (values.email) form.append("email", values.email);
      if (values.no_hp) form.append("no_hp", values.no_hp);
      if (values.password_lama && values.password_baru) {
        form.append("password_lama", values.password_lama);
        form.append("password_baru", values.password_baru);
        form.append(
          "password_baru_confirmation",
          values.password_baru_confirmation,
        );
      }
      if (values.foto) form.append("foto", values.foto);
      return api.post("/wakasek/profil/update", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (res) => {
      toast.success("Profil berhasil diperbarui");
      // Backend mengembalikan { success, message, data: userObject }
      // Sync ke AuthContext & localStorage agar foto sidebar langsung update
      const updatedUser = res?.data?.data;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      queryClient.invalidateQueries(["wakasek-profil"]);
      queryClient.invalidateQueries(["auth-user"]);
      setIsEditing(false);
      setFormData(FORM_DEFAULT);
      setPreviewImage(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Gagal memperbarui profil");
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData({ ...formData, foto: file });
    setPreviewImage(URL.createObjectURL(file));
    setIsEditing(true);
  };

  const handleEdit = () => {
    setFormData({
      ...FORM_DEFAULT,
      email: data?.user?.email ?? "",
      no_hp: data?.user?.no_hp ?? "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(FORM_DEFAULT);
    setPreviewImage(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.password_baru &&
      formData.password_baru !== formData.password_baru_confirmation
    ) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }
    updateMutation.mutate(formData);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-400">Memuat data profil...</p>
      </div>
    );
  }

  const { user, kepsek, master } = data ?? {};

  const fotoUrl =
    previewImage ?? (user?.foto ? `${BASE_URL}/storage/${user.foto}` : null);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* decorative */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
          <Shield className="w-64 h-64" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/20 border-4 border-white/30 overflow-hidden flex items-center justify-center shadow-inner">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-20 h-20 text-white/60" />
              )}
            </div>
            {/* Overlay upload saat mode edit */}
            <label
              className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-opacity ${isEditing ? "opacity-0 hover:opacity-100" : "hidden"}`}
            >
              <Upload className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-xs font-semibold">
                Ganti Foto
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Info singkat */}
          <div className="text-center sm:text-left mt-1 sm:mt-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {user?.nama_lengkap ?? "-"}
            </h1>
            <p className="text-indigo-200 text-base mt-1">Kepala Sekolah</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
              {kepsek?.nuptk && (
                <span className="bg-white/20 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-green-300" />
                  NUPTK: {kepsek.nuptk}
                </span>
              )}
              {master?.status_kepegawaian && (
                <span className="bg-white/20 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  {master.status_kepegawaian}
                </span>
              )}
              {kepsek?.no_sk && (
                <span className="bg-white/20 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-200" />
                  SK: {kepsek.no_sk}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body 2 kolom ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom kiri — akun & password */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Pengaturan Akun & Keamanan
              </h2>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Edit Profil
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Batal
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Username — read only */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    disabled
                    value={user?.username ?? "-"}
                    className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Username tidak dapat diubah
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={isEditing ? formData.email : (user?.email ?? "-")}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                    />
                  </div>
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nomor HP
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={isEditing ? formData.no_hp : (user?.no_hp ?? "-")}
                      onChange={(e) =>
                        setFormData({ ...formData, no_hp: e.target.value })
                      }
                      className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Ganti password — hanya tampil saat edit */}
              {isEditing && (
                <div className="pt-4 mt-2 border-t border-gray-100 space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Ganti Password{" "}
                    <span className="font-normal text-gray-400 normal-case">
                      (opsional)
                    </span>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password Lama
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password_lama}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password_lama: e.target.value,
                          })
                        }
                        className="input-field pl-10"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password Baru
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                        <input
                          type="password"
                          value={formData.password_baru}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password_baru: e.target.value,
                            })
                          }
                          className="input-field pl-10 border-indigo-200 focus:border-indigo-400"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Konfirmasi Password Baru
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                        <input
                          type="password"
                          value={formData.password_baru_confirmation}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password_baru_confirmation: e.target.value,
                            })
                          }
                          className="input-field pl-10 border-indigo-200 focus:border-indigo-400"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="btn-primary flex items-center gap-2"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Data Jabatan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Data Jabatan Kepala Sekolah
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <InfoRow label="NUPTK" value={kepsek?.nuptk} />
              <InfoRow label="No. SK Kepala Sekolah" value={kepsek?.no_sk} />
              <InfoRow
                label="TMT Jabatan"
                value={
                  kepsek?.tmt_jabatan
                    ? new Date(kepsek.tmt_jabatan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : null
                }
              />
            </div>
          </div>
        </div>

        {/* Kolom kanan — data kepegawaian (read-only dari tabel guru) */}
        <div className="space-y-4">
          {/* Identitas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-700 text-sm flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-500" />
              Identitas
            </h2>
            {master ? (
              <div className="space-y-3.5">
                <InfoRow label="NIP" value={master.nip} />
                <InfoRow label="NIK" value={master.nik} />
                <InfoRow
                  label="Jenis Kelamin"
                  value={
                    master.jenis_kelamin === "L"
                      ? "Laki-Laki"
                      : master.jenis_kelamin === "P"
                        ? "Perempuan"
                        : null
                  }
                />
                <InfoRow label="Agama" value={master.agama} />
                <InfoRow
                  label="Status Perkawinan"
                  value={master.status_perkawinan}
                />
                <InfoRow
                  label="Tempat, Tgl Lahir"
                  value={
                    master.tempat_lahir && master.tanggal_lahir
                      ? `${master.tempat_lahir}, ${new Date(master.tanggal_lahir).toLocaleDateString("id-ID")}`
                      : null
                  }
                />
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                Data belum tersedia
              </p>
            )}
          </div>

          {/* Kepegawaian */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-700 text-sm flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-purple-500" />
              Kepegawaian
            </h2>
            {master ? (
              <div className="space-y-3.5">
                <InfoRow label="Jenis PTK" value={master.jenis_ptk} />
                <InfoRow
                  label="Status Kepegawaian"
                  value={master.status_kepegawaian}
                />
                <InfoRow label="Golongan" value={master.golongan} />
                <InfoRow
                  label="TMT Golongan"
                  value={
                    master.tmt_golongan
                      ? new Date(master.tmt_golongan).toLocaleDateString(
                          "id-ID",
                        )
                      : null
                  }
                />
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                Data belum tersedia
              </p>
            )}
          </div>

          {/* Alamat */}
          {master?.alamat_jalan && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-700 text-sm flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-red-400" />
                Alamat
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {master.alamat_jalan}
                {(master.rt || master.rw) &&
                  ` RT ${master.rt ?? "-"}/RW ${master.rw ?? "-"}`}
                {master.desa && `, ${master.desa}`}
                {master.kecamatan && `, Kec. ${master.kecamatan}`}
                {master.kabupaten && `, ${master.kabupaten}`}
                {master.provinsi && `, ${master.provinsi}`}
                {master.kode_pos && ` ${master.kode_pos}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
