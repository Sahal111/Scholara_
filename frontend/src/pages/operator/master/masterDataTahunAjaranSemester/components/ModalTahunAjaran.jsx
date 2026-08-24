import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../../../../lib/axios";
import toast from "react-hot-toast";
import { tahunAjaranKeys } from "../../../../../hooks/api/useTahunAjaran";

export default function ModalTahunAjaran({
  open,
  onClose,
  editData,
  queryClient,
}) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    tahun: "",
    tgl_mulai_ta: "",
    tgl_selesai_ta: "",
    is_active: false,
    buat_semester: true,
    semester_ganjil_mulai: "",
    semester_ganjil_selesai: "",
    semester_genap_mulai: "",
    semester_genap_selesai: "",
    semester_aktif: "Ganjil",
  });

  const calcSemesterDates = (startStr, endStr) => {
    if (!startStr || !endStr) return {};
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end)
      return {};
    const startYear = start.getFullYear();
    return {
      semester_ganjil_mulai: startStr,
      semester_ganjil_selesai: `${startYear}-12-31`,
      semester_genap_mulai: `${startYear + 1}-01-02`,
      semester_genap_selesai: endStr,
    };
  };

  useEffect(() => {
    if (!open) return;
    if (editData) {
      const ganjil = editData.semesters?.find((s) => s.nama === "Ganjil");
      const genap = editData.semesters?.find((s) => s.nama === "Genap");
      const activeSem = editData.semesters?.find((s) => s.is_active);
      setForm({
        tahun: editData.tahun || "",
        tgl_mulai_ta: ganjil?.tgl_mulai || "",
        tgl_selesai_ta: genap?.tgl_selesai || ganjil?.tgl_selesai || "",
        is_active: editData.is_active || false,
        buat_semester: !!(ganjil || genap),
        semester_ganjil_mulai: ganjil?.tgl_mulai || "",
        semester_ganjil_selesai: ganjil?.tgl_selesai || "",
        semester_genap_mulai: genap?.tgl_mulai || "",
        semester_genap_selesai: genap?.tgl_selesai || "",
        semester_aktif: activeSem?.nama || "Ganjil",
      });
    } else {
      setForm({
        tahun: "",
        tgl_mulai_ta: "",
        tgl_selesai_ta: "",
        is_active: false,
        buat_semester: true,
        semester_ganjil_mulai: "",
        semester_ganjil_selesai: "",
        semester_genap_mulai: "",
        semester_genap_selesai: "",
        semester_aktif: "Ganjil",
      });
    }
  }, [open, editData]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleTglMulaiChange = (val) => {
    setForm((f) => {
      const updated = { ...f, tgl_mulai_ta: val };
      if (val && f.tgl_selesai_ta)
        return { ...updated, ...calcSemesterDates(val, f.tgl_selesai_ta) };
      if (val) {
        const start = new Date(val);
        if (!isNaN(start.getTime())) {
          const defaultEnd = `${start.getFullYear() + 1}-06-30`;
          return {
            ...updated,
            tgl_selesai_ta: defaultEnd,
            ...calcSemesterDates(val, defaultEnd),
          };
        }
      }
      return updated;
    });
  };

  const handleTglSelesaiChange = (val) => {
    setForm((f) => {
      const updated = { ...f, tgl_selesai_ta: val };
      if (f.tgl_mulai_ta && val)
        return { ...updated, ...calcSemesterDates(f.tgl_mulai_ta, val) };
      return updated;
    });
  };

  const handleTahunTextChange = (val) => {
    setForm((f) => {
      const updated = { ...f, tahun: val };
      const match = val.match(/^(\d{4})\/(\d{4})$/);
      if (match) {
        const [, y1, y2] = match;
        const startTA = `${y1}-07-14`;
        const endTA = `${y2}-06-30`;
        return {
          ...updated,
          tgl_mulai_ta: startTA,
          tgl_selesai_ta: endTA,
          semester_ganjil_mulai: startTA,
          semester_ganjil_selesai: `${y1}-12-31`,
          semester_genap_mulai: `${y2}-01-02`,
          semester_genap_selesai: endTA,
        };
      }
      return updated;
    });
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      const { tgl_mulai_ta, tgl_selesai_ta, ...payload } = data;
      return isEdit
        ? api.put(`/operator/master-data/tahun-ajaran/${editData.id}`, payload)
        : api.post("/operator/master-data/tahun-ajaran", payload);
    },
    onSuccess: () => {
      toast.success(
        `Tahun ajaran berhasil ${isEdit ? "diperbarui" : "ditambahkan"}.`,
      );
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      if (isEdit)
        queryClient.invalidateQueries({
          queryKey: tahunAjaranKeys.detail(editData.id),
        });
      onClose();
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message ?? "Gagal menyimpan.");
    },
  });

  if (!open) return null;

  const inputCls =
    "w-full bg-white text-on-surface text-sm rounded-lg border border-[#bfc9c4]/50 focus:border-[#00c853] focus:ring-4 focus:ring-[#00c853]/10 focus:outline-none transition-all px-4 py-2.5 shadow-sm placeholder:text-[#707975]/40";
  const dateCls =
    "w-full bg-[#f2f4f3]/50 text-on-surface text-sm rounded-lg border border-[#bfc9c4]/30 focus:border-[#00c853] focus:ring-4 focus:ring-[#00c853]/10 focus:bg-white focus:outline-none transition-all px-4 py-2.5";
  const labelCls =
    "block text-[11px] font-semibold text-[#3f4945] uppercase tracking-wider mb-1.5";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col my-auto max-h-full animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#bfc9c4]/20 p-6 md:p-8 sticky top-0 bg-[#f2f4f3] z-10 rounded-t-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] bg-[#00c853]/20 pointer-events-none" />
          <div className="flex flex-col gap-3">
            <h2 className="font-extrabold text-3xl md:text-4xl tracking-tighter leading-none text-[#004d40]">
              {isEdit ? (
                <>
                  Edit{" "}
                  <em className="font-serif not-italic text-[#006e2a]">
                    Tahun Ajaran
                  </em>
                </>
              ) : (
                <>
                  Tambah{" "}
                  <em className="font-serif not-italic text-[#006e2a]">
                    Tahun Ajaran
                  </em>
                </>
              )}
            </h2>
            <p className="text-sm text-[#3f4945]/80 leading-relaxed max-w-md">
              {isEdit
                ? `Perbarui data periode akademik ${form.tahun || "—"} madrasah.`
                : "Siapkan periode akademik baru untuk sistem operasional madrasah."}
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
        <div className="overflow-y-auto flex-1">
          {/* Section 1: Informasi Tahun Ajaran */}
          <div className="p-6 md:p-8 border-b border-[#bfc9c4]/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="px-3 py-1 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
                <span className="text-[9px] text-[#006e2a] tracking-[0.2em] uppercase font-black">
                  Informasi Tahun Ajaran
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-semibold text-[#111827] mb-1.5"
                  htmlFor="ta-tahun"
                >
                  Tahun Ajaran <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="ta-tahun"
                  value={form.tahun}
                  onChange={(e) => handleTahunTextChange(e.target.value)}
                  className={`${inputCls} font-bold text-base`}
                  placeholder="e.g. 2026/2027"
                  maxLength={9}
                />
                <p className="text-xs text-[#707975] mt-1.5">
                  Format YYYY/YYYY — tanggal semester terisi otomatis.
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-[#111827] mb-1.5"
                  htmlFor="ta-mulai"
                >
                  Mulai Periode <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[#707975] text-lg">
                      calendar_month
                    </span>
                  </div>
                  <input
                    id="ta-mulai"
                    type="date"
                    value={form.tgl_mulai_ta}
                    onChange={(e) => handleTglMulaiChange(e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-[#111827] mb-1.5"
                  htmlFor="ta-selesai"
                >
                  Selesai Periode <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[#707975] text-lg">
                      calendar_month
                    </span>
                  </div>
                  <input
                    id="ta-selesai"
                    type="date"
                    value={form.tgl_selesai_ta}
                    onChange={(e) => handleTglSelesaiChange(e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Semester otomatis toggle */}
            <div className="mt-6 flex items-center justify-between gap-4 py-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00c853]/5 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#00c853] text-xl">
                    auto_mode
                  </span>
                </div>
                <div>
                  <h4 className="text-[#00342b] font-bold text-base leading-tight">
                    Pengaturan Semester Otomatis
                  </h4>
                  <p className="text-[#3f4945]/70 text-xs mt-0.5 leading-tight">
                    Bagi periode menjadi dua semester secara otomatis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => set("buat_semester", !form.buat_semester)}
                className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#00c853]/20 shadow-inner ${
                  form.buat_semester ? "bg-[#004d40]" : "bg-[#bfc9c4]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    form.buat_semester ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Detail Semester */}
          <div className="p-6 md:p-8">
            {form.buat_semester ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Semester Ganjil */}
                <div className="bg-white rounded-2xl p-5 border border-[#bfc9c4]/30 shadow-sm relative overflow-hidden hover:shadow-md hover:border-[#00c853]/30 transition-all duration-300">
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
                        Periode Pertama
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls} htmlFor="ganjil-mulai">
                        Tanggal Mulai
                      </label>
                      <input
                        id="ganjil-mulai"
                        type="date"
                        value={form.semester_ganjil_mulai}
                        onChange={(e) =>
                          set("semester_ganjil_mulai", e.target.value)
                        }
                        className={dateCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="ganjil-selesai">
                        Tanggal Selesai
                      </label>
                      <input
                        id="ganjil-selesai"
                        type="date"
                        value={form.semester_ganjil_selesai}
                        onChange={(e) =>
                          set("semester_ganjil_selesai", e.target.value)
                        }
                        className={dateCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Semester Genap */}
                <div className="bg-white rounded-2xl p-5 border border-[#bfc9c4]/30 shadow-sm relative overflow-hidden hover:shadow-md hover:border-[#00c853]/30 transition-all duration-300">
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
                        Periode Kedua
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls} htmlFor="genap-mulai">
                        Tanggal Mulai
                      </label>
                      <input
                        id="genap-mulai"
                        type="date"
                        value={form.semester_genap_mulai}
                        onChange={(e) =>
                          set("semester_genap_mulai", e.target.value)
                        }
                        className={dateCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="genap-selesai">
                        Tanggal Selesai
                      </label>
                      <input
                        id="genap-selesai"
                        type="date"
                        value={form.semester_genap_selesai}
                        onChange={(e) =>
                          set("semester_genap_selesai", e.target.value)
                        }
                        className={dateCls}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-4 bg-[#f2f4f3] rounded-2xl border border-dashed border-[#bfc9c4]/50">
                <span className="material-symbols-outlined text-[#707975] text-[20px]">
                  date_range
                </span>
                <p className="text-sm text-[#3f4945]/70">
                  Semester tidak dibuat otomatis — dapat ditambahkan manual
                  nanti.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f2f4f3]/80 backdrop-blur-md px-6 md:px-8 py-5 border-t border-[#bfc9c4]/20 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-10 rounded-b-3xl">
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-[#bfc9c4]/30 shadow-sm cursor-pointer hover:border-[#00c853]/30 transition-all"
            onClick={() => {
              const active = !form.is_active;
              setForm((f) => ({
                ...f,
                is_active: active,
                semester_aktif: active ? f.semester_aktif || "Ganjil" : "",
              }));
            }}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${form.is_active ? "bg-[#004d40] border-[#004d40]" : "bg-white border-[#bfc9c4]"}`}
            >
              {form.is_active && (
                <span
                  className="material-symbols-outlined text-white text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
                >
                  check
                </span>
              )}
            </div>
            <span className="text-[#00342b] font-bold text-xs uppercase tracking-wider">
              Jadikan Aktif
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#eceeed] hover:text-[#00342b] transition-all duration-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending || !form.tahun}
              className="flex-1 sm:flex-none px-10 py-3 rounded-xl bg-[#004d40] text-white font-bold text-[11px] tracking-[0.1em] uppercase shadow-lg shadow-[#004d40]/20 hover:bg-[#00c853] hover:shadow-[#00c853]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
                  {isEdit ? "Perbarui" : "Simpan"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
