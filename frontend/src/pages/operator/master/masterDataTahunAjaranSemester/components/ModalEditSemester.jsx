import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../../../../../lib/axios";
import toast from "react-hot-toast";
import { tahunAjaranKeys } from "../../../../../hooks/api/useTahunAjaran";

export default function ModalEditSemester({
  open,
  semester,
  tahunAjaran,
  tahunAjaranId,
  onClose,
  queryClient,
}) {
  const [form, setForm] = useState({ tgl_mulai: "", tgl_selesai: "" });

  useEffect(() => {
    if (open && semester) {
      setForm({
        tgl_mulai: semester.tgl_mulai ? semester.tgl_mulai.slice(0, 10) : "",
        tgl_selesai: semester.tgl_selesai
          ? semester.tgl_selesai.slice(0, 10)
          : "",
      });
    }
  }, [open, semester]);

  const namaSem = semester?.nama?.toLowerCase() ?? "ganjil";

  const mut = useMutation({
    mutationFn: () =>
      api.put(`/operator/master-data/tahun-ajaran/${tahunAjaranId}`, {
        tahun: tahunAjaran?.tahun,
        is_active: tahunAjaran?.is_active ?? false,
        buat_semester: true,
        [`semester_${namaSem}_mulai`]: form.tgl_mulai || null,
        [`semester_${namaSem}_selesai`]: form.tgl_selesai || null,
        ...(tahunAjaran?.is_active && semester?.is_active
          ? { semester_aktif: semester.nama }
          : {}),
      }),
    onSuccess: () => {
      toast.success("Semester berhasil diperbarui.");
      queryClient.invalidateQueries({
        queryKey: tahunAjaranKeys.detail(tahunAjaranId),
      });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal menyimpan."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#00342b] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">
              edit_calendar
            </span>
          </div>
          <div>
            <h2 className="text-white font-extrabold text-[17px] font-headline-card">
              Edit Semester {semester?.nama}
            </h2>
            <p className="text-[#afefdd] text-[11px]">
              Ubah tanggal mulai & selesai
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {[
            { label: "Tanggal Mulai", key: "tgl_mulai" },
            { label: "Tanggal Selesai", key: "tgl_selesai" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-[#00342b] uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <input
                type="date"
                value={form[key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-[#f8faf9] border border-[#bfc9c4]/40 rounded-xl text-sm text-[#111827] focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] outline-none transition-all"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-xs uppercase tracking-wider hover:bg-[#eceeed] transition"
          >
            Batal
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="flex-1 py-3 rounded-full bg-[#006e2a] hover:bg-[#00531e] text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#006e2a]/30 disabled:opacity-60"
          >
            {mut.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
