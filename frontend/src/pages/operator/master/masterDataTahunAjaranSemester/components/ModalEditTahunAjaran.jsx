import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../../../../../lib/axios";
import toast from "react-hot-toast";

export default function ModalEditTahunAjaran({ open, onClose, ta, onUpdated }) {
  const [form, setForm] = useState({
    tahun: "",
    is_active: false,
    semester_ganjil_mulai: "",
    semester_ganjil_selesai: "",
    semester_genap_mulai: "",
    semester_genap_selesai: "",
    semester_aktif: "Ganjil",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && ta) {
      const ganjil = ta.semesters?.find((s) => s.nama === "Ganjil");
      const genap = ta.semesters?.find((s) => s.nama === "Genap");
      const active = ta.semesters?.find((s) => s.is_active);
      setForm({
        tahun: ta.tahun || "",
        is_active: ta.is_active || false,
        semester_ganjil_mulai: ganjil?.tgl_mulai?.slice(0, 10) || "",
        semester_ganjil_selesai: ganjil?.tgl_selesai?.slice(0, 10) || "",
        semester_genap_mulai: genap?.tgl_mulai?.slice(0, 10) || "",
        semester_genap_selesai: genap?.tgl_selesai?.slice(0, 10) || "",
        semester_aktif: active?.nama || "Ganjil",
      });
    }
  }, [open, ta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tahun.trim()) {
      toast.error("Nama tahun ajaran wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.put(`/operator/master-data/tahun-ajaran/${ta.id}`, {
        tahun: form.tahun,
        is_active: form.is_active,
        semester_ganjil_mulai: form.semester_ganjil_mulai,
        semester_ganjil_selesai: form.semester_ganjil_selesai,
        semester_genap_mulai: form.semester_genap_mulai,
        semester_genap_selesai: form.semester_genap_selesai,
        semester_aktif: form.semester_aktif,
      });
      toast.success("Tahun ajaran berhasil diperbarui.");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Gagal memperbarui tahun ajaran.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-[#bfc9c4]/50 focus:border-[#006e2a] focus:ring-2 focus:ring-[#006e2a]/20 outline-none text-sm text-[#111827] bg-[#f8faf9]";
  const dateCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-xs bg-white focus:ring-2 focus:ring-[#006e2a]/20 outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white/60 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#bfc9c4]/30 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006e2a]/10 flex items-center justify-center text-[#006e2a]">
              <span className="material-symbols-outlined text-[22px]">
                edit_calendar
              </span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#00342b] font-headline-card">
                Edit Tahun Ajaran
              </h3>
              <p className="text-xs text-[#3f4945]/70">
                Perbarui informasi periode dan semester
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f4f3] text-[#3f4945] hover:bg-[#e6e9e8] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama tahun ajaran */}
          <div>
            <label className="block text-xs font-bold text-[#3f4945] uppercase tracking-wider mb-2">
              Nama Tahun Ajaran <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              value={form.tahun}
              onChange={(e) => setForm({ ...form, tahun: e.target.value })}
              placeholder="Contoh: 2026/2027"
              className={inputCls}
              required
            />
          </div>

          {/* Toggle aktif */}
          <div className="p-4 rounded-2xl bg-[#006e2a]/5 border border-[#006e2a]/15 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#00342b]">
                Status Tahun Ajaran
              </p>
              <p className="text-xs text-[#3f4945]/70">
                Jadikan sebagai tahun ajaran aktif operasional
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006e2a]" />
            </label>
          </div>

          {/* Semester Ganjil */}
          <div className="p-5 rounded-2xl bg-[#f8faf9] border border-[#bfc9c4]/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#006e2a] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006e2a]" />
                Semester Ganjil
              </span>
              <label className="flex items-center gap-2 text-xs font-medium text-[#3f4945] cursor-pointer">
                <input
                  type="radio"
                  name="semester_aktif"
                  value="Ganjil"
                  checked={form.semester_aktif === "Ganjil"}
                  onChange={() =>
                    setForm({ ...form, semester_aktif: "Ganjil" })
                  }
                  className="text-[#006e2a] focus:ring-[#006e2a]"
                />
                Semester Aktif
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#3f4945]/70 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={form.semester_ganjil_mulai}
                  onChange={(e) =>
                    setForm({ ...form, semester_ganjil_mulai: e.target.value })
                  }
                  className={dateCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#3f4945]/70 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={form.semester_ganjil_selesai}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      semester_ganjil_selesai: e.target.value,
                    })
                  }
                  className={dateCls}
                />
              </div>
            </div>
          </div>

          {/* Semester Genap */}
          <div className="p-5 rounded-2xl bg-[#f8faf9] border border-[#bfc9c4]/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3f4945] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#bfc9c4]" />
                Semester Genap
              </span>
              <label className="flex items-center gap-2 text-xs font-medium text-[#3f4945] cursor-pointer">
                <input
                  type="radio"
                  name="semester_aktif"
                  value="Genap"
                  checked={form.semester_aktif === "Genap"}
                  onChange={() => setForm({ ...form, semester_aktif: "Genap" })}
                  className="text-[#006e2a] focus:ring-[#006e2a]"
                />
                Semester Aktif
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#3f4945]/70 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={form.semester_genap_mulai}
                  onChange={(e) =>
                    setForm({ ...form, semester_genap_mulai: e.target.value })
                  }
                  className={dateCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#3f4945]/70 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={form.semester_genap_selesai}
                  onChange={(e) =>
                    setForm({ ...form, semester_genap_selesai: e.target.value })
                  }
                  className={dateCls}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-sm hover:bg-[#f2f4f3] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-[#006e2a] text-white font-bold text-sm hover:bg-[#004d40] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
              )}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
