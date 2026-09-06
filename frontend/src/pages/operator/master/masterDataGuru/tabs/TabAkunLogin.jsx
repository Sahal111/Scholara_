import { useState } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { InfoRow, SectionTitle, fmtDate } from "./helpers";

/**
 * TabAkunLogin — Tab 8: Akun Login Terhubung Guru
 */
export default function TabAkunLogin({
  akunGuru,
  nuptk,
  navigate,
  toggleActive,
  resetPassword,
  hapusAkun,
}) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("master_data.guru.create");
  const canUpdate = hasPermission("master_data.guru.update");
  const canDelete = hasPermission("master_data.guru.delete");
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  if (!akunGuru) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
          <SectionTitle
            icon="shield_person"
            label="Akun Login"
            desc="Guru ini belum memiliki akun login."
          />
          <button
            onClick={() =>
              navigate("/operator", { state: { openModal: true, nuptk } })
            }
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Buat Akun Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
          <SectionTitle
            icon="shield_person"
            label="Akun Login"
            desc="Informasi akun yang digunakan guru untuk mengakses sistem."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-4">
              <InfoRow label="Username" value={akunGuru.username} />
              <InfoRow label="Email Login" value={akunGuru.email} />
              <InfoRow label="Role" value={akunGuru.roles?.[0] ?? "Guru"} />
              <div className="flex justify-between border-b border-surface-container pb-2">
                <span className="text-sm text-text-secondary">Status Akun</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                    akunGuru.is_active
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      akunGuru.is_active ? "bg-success" : "bg-danger"
                    }`}
                  />
                  {akunGuru.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <InfoRow
                label="Terakhir Login"
                value={
                  akunGuru.last_login_at
                    ? fmtDate(akunGuru.last_login_at)
                    : "Belum pernah login"
                }
              />
              <InfoRow
                label="Password Terakhir Diubah"
                value={
                  akunGuru.password_changed_at
                    ? fmtDate(akunGuru.password_changed_at)
                    : "-"
                }
              />
              <InfoRow
                label="Perangkat Terakhir"
                value={akunGuru.last_device ?? "-"}
              />
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">
                Password
              </span>
              <button className="text-primary text-sm font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">
                  visibility
                </span>{" "}
                Lihat
              </button>
            </div>
            <div className="text-lg tracking-widest font-mono mb-2">
              ••••••••••••••
            </div>
            <p className="text-xs text-text-secondary italic">
              Password disimpan secara terenkripsi. Demi keamanan sistem
              disarankan melakukan reset password daripada melihat password.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-3 rounded-lg bg-surface-bright border border-outline-variant/20 text-center">
              <p className="text-xs text-text-secondary mb-1">Login Gagal</p>
              <p className="text-sm font-bold text-text-primary">
                {akunGuru.failed_logins ?? 0} kali
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-bright border border-outline-variant/20 text-center">
              <p className="text-xs text-text-secondary mb-1">Status Email</p>
              {akunGuru.email_verified_at ? (
                <p className="text-sm font-bold text-success flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    check_circle
                  </span>{" "}
                  Terverifikasi
                </p>
              ) : (
                <p className="text-sm font-bold text-text-secondary">Belum</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-surface-bright border border-outline-variant/20 text-center">
              <p className="text-xs text-text-secondary mb-1">2FA</p>
              <p className="text-sm font-bold text-text-secondary">
                Belum Aktif
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-surface-container">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>{" "}
              Reset Password
            </button>
            <button
              onClick={() => navigate(`/operator/master/guru/edit/${nuptk}`)}
              className="px-4 py-2 bg-surface border border-outline-variant text-text-primary rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>{" "}
              Edit Username
            </button>
            <button
              onClick={() => navigate(`/operator/master/guru/edit/${nuptk}`)}
              className="px-4 py-2 bg-surface border border-outline-variant text-text-primary rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                mail
              </span>{" "}
              Ubah Email
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    `${akunGuru.is_active ? "Nonaktifkan" : "Aktifkan"} akun ini?`,
                  )
                )
                  toggleActive.mutate(akunGuru.id);
              }}
              className="px-4 py-2 bg-surface border border-warning/30 text-warning rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-warning/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                block
              </span>{" "}
              {akunGuru.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
            </button>
            {canDelete && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Hapus akun login guru ini? Tindakan ini tidak bisa dibatalkan.",
                    )
                  )
                    hapusAkun.mutate(akunGuru.id);
                }}
                className="px-4 py-2 bg-surface border border-error/30 text-error rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-error/5 transition-colors ml-auto"
              >
                <span className="material-symbols-outlined text-[18px]">
                  delete
                </span>{" "}
                Hapus Akun
              </button>
            )}
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm border border-border-light">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <div>
                <h3 className="font-bold text-text-primary">Reset Password</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Akun: {akunGuru.username}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setNewPassword("");
                }}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password Baru <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-border-light">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setNewPassword("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (newPassword.length < 8) {
                    toast.error("Password minimal 8 karakter.");
                    return;
                  }
                  resetPassword.mutate({
                    id: akunGuru.id,
                    password: newPassword,
                  });
                  setShowResetModal(false);
                  setNewPassword("");
                }}
                disabled={resetPassword.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {resetPassword.isPending ? "Mereset..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
