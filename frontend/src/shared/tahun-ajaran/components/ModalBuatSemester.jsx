import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/axios";
import toast from "react-hot-toast";
import { tahunAjaranKeys } from "../../../hooks/api/useTahunAjaran";
import { semesterKeys } from "../../../hooks/api/useSemester";

/**
 * Status TA yang dianggap "locked" — setelah disetujui kepsek.
 * Edit tanggal semester harus lewat endpoint individual + wajib catatan.
 */
const TA_LOCKED_STATUSES = ["approved", "active", "completed"];

export default function ModalBuatSemester({
  open,
  onClose,
  tahunAjaran,
  queryClient,
}) {
  const tahun = tahunAjaran?.tahun ?? "";
  const [y1, y2] = tahun.split("/");

  // Edit mode: TA sudah punya semester → pre-fill dari data existing
  const existingGanjil = tahunAjaran?.semesters?.find(
    (s) => s.nama === "Ganjil",
  );
  const existingGenap = tahunAjaran?.semesters?.find((s) => s.nama === "Genap");
  const isEditMode = !!(existingGanjil || existingGenap);

  // Setelah TA approved/active, edit semester harus lewat endpoint individual
  const isTaLocked = TA_LOCKED_STATUSES.includes(tahunAjaran?.status);

  const [form, setForm] = useState({
    semester_ganjil_mulai: "",
    semester_ganjil_selesai: "",
    semester_genap_mulai: "",
    semester_genap_selesai: "",
    catatan: "",
  });

  useEffect(() => {
    if (!open) return;
    if (isEditMode) {
      // Pre-fill dari data existing
      setForm({
        semester_ganjil_mulai: existingGanjil?.tgl_mulai?.slice(0, 10) ?? "",
        semester_ganjil_selesai:
          existingGanjil?.tgl_selesai?.slice(0, 10) ?? "",
        semester_genap_mulai: existingGenap?.tgl_mulai?.slice(0, 10) ?? "",
        semester_genap_selesai: existingGenap?.tgl_selesai?.slice(0, 10) ?? "",
        catatan: "",
      });
    } else if (y1 && y2) {
      // Default untuk buat baru
      setForm({
        semester_ganjil_mulai: `${y1}-07-14`,
        semester_ganjil_selesai: `${y1}-12-31`,
        semester_genap_mulai: `${y2}-01-02`,
        semester_genap_selesai: `${y2}-06-30`,
        catatan: "",
      });
    }
  }, [open, tahunAjaran?.ulid]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Cek apakah semester tertentu sedang active (hanya boleh ubah tgl_selesai)
  const isGanjilActive = existingGanjil?.status === "active";
  const isGenapActive = existingGenap?.status === "active";
  const isGanjilLocked =
    existingGanjil?.status === "closed" ||
    existingGanjil?.status === "archived";
  const isGenapLocked =
    existingGenap?.status === "closed" || existingGenap?.status === "archived";

  // --- Mutation: TA belum locked → bulk update via TA endpoint ---
  const bulkMutation = useMutation({
    mutationFn: () =>
      api.put(`/operator/master-data/tahun-ajaran/${tahunAjaran.ulid}`, {
        tahun: tahunAjaran.tahun,
        buat_semester: true,
        semester_ganjil_mulai: form.semester_ganjil_mulai,
        semester_ganjil_selesai: form.semester_ganjil_selesai,
        semester_genap_mulai: form.semester_genap_mulai,
        semester_genap_selesai: form.semester_genap_selesai,
      }),
    onSuccess: () => {
      toast.success(
        isEditMode
          ? "Semester berhasil diperbarui."
          : "Semester berhasil dibuat.",
      );
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tahunAjaranKeys.detail(tahunAjaran.ulid),
      });
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal membuat semester."),
  });

  // --- Mutation: TA locked → individual semester update via /semesters/{ulid} ---
  const individualMutation = useMutation({
    mutationFn: async () => {
      const promises = [];

      // Update Ganjil jika ada dan belum locked
      if (existingGanjil && !isGanjilLocked) {
        const ganjilPayload = isGanjilActive
          ? { tgl_selesai: form.semester_ganjil_selesai, catatan: form.catatan }
          : {
              tgl_mulai: form.semester_ganjil_mulai,
              tgl_selesai: form.semester_ganjil_selesai,
              catatan: form.catatan,
            };
        promises.push(
          api.put(
            `/operator/master-data/semesters/${existingGanjil.ulid}`,
            ganjilPayload,
          ),
        );
      }

      // Update Genap jika ada dan belum locked
      if (existingGenap && !isGenapLocked) {
        const genapPayload = isGenapActive
          ? { tgl_selesai: form.semester_genap_selesai, catatan: form.catatan }
          : {
              tgl_mulai: form.semester_genap_mulai,
              tgl_selesai: form.semester_genap_selesai,
              catatan: form.catatan,
            };
        promises.push(
          api.put(
            `/operator/master-data/semesters/${existingGenap.ulid}`,
            genapPayload,
          ),
        );
      }

      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Semester berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tahunAjaranKeys.detail(tahunAjaran.ulid),
      });
      queryClient.invalidateQueries({ queryKey: semesterKeys.lists() });
      onClose();
    },
    onError: (err) => {
      const code = err.response?.data?.error_code;
      if (code === "REASON_REQUIRED") {
        toast.error("Wajib isi alasan perubahan setelah TA disetujui.");
      } else if (code === "ACTIVE_SEMESTER_LOCKED") {
        toast.error("Semester aktif hanya boleh mengubah tanggal selesai.");
      } else {
        toast.error(
          err.response?.data?.message ?? "Gagal memperbarui semester.",
        );
      }
    },
  });

  const mutation = isTaLocked ? individualMutation : bulkMutation;

  if (!open) return null;

  const dateCls =
    "w-full bg-[#f2f4f3]/50 text-on-surface text-sm rounded-lg border border-[#bfc9c4]/30 focus:border-[#00c853] focus:ring-4 focus:ring-[#00c853]/10 focus:bg-white focus:outline-none transition-all px-4 py-2.5";
  const disabledCls =
    "w-full bg-[#eceeed] text-[#3f4945]/50 text-sm rounded-lg border border-[#bfc9c4]/20 px-4 py-2.5 cursor-not-allowed";
  const labelCls =
    "block text-[11px] font-semibold text-[#3f4945] uppercase tracking-wider mb-1.5";

  const isDisabled =
    mutation.isPending ||
    !form.semester_ganjil_mulai ||
    !form.semester_ganjil_selesai ||
    !form.semester_genap_mulai ||
    !form.semester_genap_selesai ||
    (isTaLocked && !form.catatan?.trim());

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#bfc9c4]/20 p-6 md:p-8 rounded-t-3xl overflow-hidden bg-[#f2f4f3]">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] bg-[#00c853]/20 pointer-events-none" />
          <div className="flex flex-col gap-3">
            <h2 className="font-extrabold text-3xl md:text-4xl tracking-tighter leading-none text-[#004d40]">
              {isEditMode ? "Edit" : "Buat"}{" "}
              <em className="font-serif not-italic text-[#006e2a]">Semester</em>
            </h2>
            <p className="text-sm text-[#3f4945]/80 leading-relaxed">
              Atur rentang tanggal semester untuk Tahun Ajaran{" "}
              <span className="font-bold text-[#004d40]">{tahun}</span>.
              {isTaLocked && (
                <span className="block mt-1 text-xs text-amber-600 font-semibold">
                  ⚠ TA sudah disetujui — perubahan wajib menyertakan alasan.
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#e1e3e2] text-[#3f4945] hover:bg-[#d8dada] hover:text-[#00342b] transition-all duration-300 shadow-sm active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="px-3 py-1 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
              <span className="text-[9px] text-[#006e2a] tracking-[0.2em] uppercase font-black">
                Detail Semester
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ganjil */}
            <div
              className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-all duration-300 ${
                isGanjilLocked
                  ? "border-[#bfc9c4]/20 opacity-50"
                  : "border-[#bfc9c4]/30 hover:shadow-md hover:border-[#00c853]/30"
              }`}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#004d40]" />
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-full bg-[#00c853]/5 flex items-center justify-center border border-[#00c853]/10 shadow-inner shrink-0">
                  <span
                    className="material-symbols-outlined text-[#004d40] text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    looks_one
                  </span>
                </div>
                <div>
                  <h4 className="text-[#00342b] font-bold text-base leading-tight">
                    Semester Ganjil
                  </h4>
                  <p className="text-[10px] text-[#00c853] font-black uppercase tracking-[0.15em] mt-0.5">
                    {isGanjilLocked
                      ? "Terkunci"
                      : isGanjilActive
                        ? "Aktif — hanya tgl selesai"
                        : "Periode Pertama"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelCls} htmlFor="bs-ganjil-mulai">
                    Tanggal Mulai
                  </label>
                  <input
                    id="bs-ganjil-mulai"
                    type="date"
                    value={form.semester_ganjil_mulai}
                    onChange={(e) =>
                      set("semester_ganjil_mulai", e.target.value)
                    }
                    disabled={isGanjilActive || isGanjilLocked}
                    className={
                      isGanjilActive || isGanjilLocked ? disabledCls : dateCls
                    }
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="bs-ganjil-selesai">
                    Tanggal Selesai
                  </label>
                  <input
                    id="bs-ganjil-selesai"
                    type="date"
                    value={form.semester_ganjil_selesai}
                    onChange={(e) =>
                      set("semester_ganjil_selesai", e.target.value)
                    }
                    disabled={isGanjilLocked}
                    className={isGanjilLocked ? disabledCls : dateCls}
                  />
                </div>
              </div>
            </div>

            {/* Genap */}
            <div
              className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-all duration-300 ${
                isGenapLocked
                  ? "border-[#bfc9c4]/20 opacity-50"
                  : "border-[#bfc9c4]/30 hover:shadow-md hover:border-[#00c853]/30"
              }`}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00c853]" />
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-full bg-[#00c853]/5 flex items-center justify-center border border-[#00c853]/10 shadow-inner shrink-0">
                  <span
                    className="material-symbols-outlined text-[#00c853] text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    looks_two
                  </span>
                </div>
                <div>
                  <h4 className="text-[#00342b] font-bold text-base leading-tight">
                    Semester Genap
                  </h4>
                  <p className="text-[10px] text-[#00c853] font-black uppercase tracking-[0.15em] mt-0.5">
                    {isGenapLocked
                      ? "Terkunci"
                      : isGenapActive
                        ? "Aktif — hanya tgl selesai"
                        : "Periode Kedua"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelCls} htmlFor="bs-genap-mulai">
                    Tanggal Mulai
                  </label>
                  <input
                    id="bs-genap-mulai"
                    type="date"
                    value={form.semester_genap_mulai}
                    onChange={(e) =>
                      set("semester_genap_mulai", e.target.value)
                    }
                    disabled={isGenapActive || isGenapLocked}
                    className={
                      isGenapActive || isGenapLocked ? disabledCls : dateCls
                    }
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="bs-genap-selesai">
                    Tanggal Selesai
                  </label>
                  <input
                    id="bs-genap-selesai"
                    type="date"
                    value={form.semester_genap_selesai}
                    onChange={(e) =>
                      set("semester_genap_selesai", e.target.value)
                    }
                    disabled={isGenapLocked}
                    className={isGenapLocked ? disabledCls : dateCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Catatan / Alasan — wajib saat TA sudah locked */}
          {isTaLocked && (
            <div className="mt-5">
              <label
                className={labelCls}
                htmlFor="bs-catatan"
              >
                Alasan Perubahan{" "}
                <span className="text-danger">*</span>
              </label>
              <textarea
                id="bs-catatan"
                rows={3}
                placeholder="Jelaskan alasan perubahan tanggal semester setelah TA disetujui..."
                value={form.catatan}
                onChange={(e) => set("catatan", e.target.value)}
                className="w-full bg-[#f2f4f3]/50 text-on-surface text-sm rounded-lg border border-[#bfc9c4]/30 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:bg-white focus:outline-none transition-all px-4 py-2.5 resize-none"
              />
              <p className="text-[10px] text-[#3f4945]/60 mt-1.5">
                Alasan akan dicatat di log aktivitas untuk audit.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f2f4f3]/80 backdrop-blur-md px-6 md:px-8 py-5 border-t border-[#bfc9c4]/20 flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#eceeed] hover:text-[#00342b] transition-all duration-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={isDisabled}
            className="px-10 py-3 rounded-xl bg-[#004d40] text-white font-bold text-[11px] tracking-[0.1em] uppercase shadow-lg shadow-[#004d40]/20 hover:bg-[#00c853] hover:shadow-[#00c853]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                {isEditMode ? "Simpan Perubahan" : "Buat Semester"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

