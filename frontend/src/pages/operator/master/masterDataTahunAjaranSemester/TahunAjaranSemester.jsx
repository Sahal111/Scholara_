import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import {
  tahunAjaranKeys,
  useTrashTahunAjaran,
  useRestoreTahunAjaran,
  useForceDeleteTahunAjaran,
} from "../../../../hooks/api/useTahunAjaran";

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtShortMonthYear(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

function fmtLong(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function daysRemaining(end) {
  if (!end) return null;
  return Math.round((new Date(end) - new Date()) / 86400000);
}

function getTglMulai(t) {
  if (!t || !t.semesters) return null;
  const ganjil = t.semesters.find((s) => s.nama === "Ganjil");
  return ganjil ? ganjil.tgl_mulai : null;
}

function getTglSelesai(t) {
  if (!t || !t.semesters) return null;
  const genap = t.semesters.find((s) => s.nama === "Genap");
  const ganjil = t.semesters.find((s) => s.nama === "Ganjil");
  return genap ? genap.tgl_selesai : ganjil ? ganjil.tgl_selesai : null;
}

function getStatusTahunAjaran(t) {
  if (t.is_active) return "AKTIF";
  const now = new Date();
  const mulai = getTglMulai(t);
  const selesai = getTglSelesai(t);
  if (selesai && new Date(selesai) < now) return "SELESAI";
  if (!mulai || new Date(mulai) > now) return "AKAN DATANG";
  return "SELESAI";
}

// ── Modal Tambah / Edit Tahun Ajaran ──────────────────────────────────────────
function ModalTahunAjaran({ open, onClose, editData, queryClient }) {
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
    const dec31 = `${startYear}-12-31`;
    const jan02 = `${startYear + 1}-01-02`;

    return {
      semester_ganjil_mulai: startStr,
      semester_ganjil_selesai: dec31,
      semester_genap_mulai: jan02,
      semester_genap_selesai: endStr,
    };
  };

  useEffect(() => {
    if (open) {
      if (editData) {
        const ganjil = editData.semesters?.find((s) => s.nama === "Ganjil");
        const genap = editData.semesters?.find((s) => s.nama === "Genap");
        const startTA = ganjil?.tgl_mulai || "";
        const endTA = genap?.tgl_selesai || ganjil?.tgl_selesai || "";
        const activeSem = editData.semesters?.find((s) => s.is_active);

        setForm({
          tahun: editData.tahun || "",
          tgl_mulai_ta: startTA,
          tgl_selesai_ta: endTA,
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
    }
  }, [open, editData]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleTglMulaiChange = (val) => {
    setForm((f) => {
      const updated = { ...f, tgl_mulai_ta: val };
      if (val && f.tgl_selesai_ta) {
        const autoSem = calcSemesterDates(val, f.tgl_selesai_ta);
        return { ...updated, ...autoSem };
      } else if (val && !f.tgl_selesai_ta) {
        const start = new Date(val);
        if (!isNaN(start.getTime())) {
          const endYear = start.getFullYear() + 1;
          const defaultEnd = `${endYear}-06-30`;
          const autoSem = calcSemesterDates(val, defaultEnd);
          return { ...updated, tgl_selesai_ta: defaultEnd, ...autoSem };
        }
      }
      return updated;
    });
  };

  const handleTglSelesaiChange = (val) => {
    setForm((f) => {
      const updated = { ...f, tgl_selesai_ta: val };
      if (f.tgl_mulai_ta && val) {
        const autoSem = calcSemesterDates(f.tgl_mulai_ta, val);
        return { ...updated, ...autoSem };
      }
      return updated;
    });
  };

  const handleTahunTextChange = (val) => {
    setForm((f) => {
      const updated = { ...f, tahun: val };
      const match = val.match(/^(\d{4})\/(\d{4})$/);
      // Auto-fill selalu dijalankan saat format lengkap — tidak peduli ada tanggal lama
      if (match) {
        const y1 = match[1];
        const y2 = match[2];
        // Kalender madrasah Indonesia: Ganjil Jul–Des, Genap Jan–Jun
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
      if (isEdit) {
        queryClient.invalidateQueries({
          queryKey: tahunAjaranKeys.detail(editData.id),
        });
      }
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
  const sectionBadge = (
    <div className="flex items-center gap-3 mb-5">
      <div className="px-3 py-1 rounded-full bg-[#006e2a]/10 border border-[#006e2a]/20 flex items-center gap-2 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
        <span className="text-[9px] text-[#006e2a] tracking-[0.2em] uppercase font-black">
          Informasi Tahun Ajaran
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-[#006e2a]/20 to-transparent" />
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col my-auto max-h-full animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-[#bfc9c4]/20 p-6 md:p-8 sticky top-0 bg-[#f2f4f3] z-10 rounded-t-3xl overflow-hidden">
          {/* decorative corner blob */}
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

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1">
          {/* SECTION 1: Informasi Tahun Ajaran */}
          <div className="p-6 md:p-8 border-b border-[#bfc9c4]/20">
            {sectionBadge}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Tahun Ajaran — full width */}
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

              {/* Mulai Periode */}
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

              {/* Selesai Periode */}
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
                  form.buat_semester ? "bg-[#00c853]" : "bg-[#bfc9c4]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow border border-gray-200/50 transition-transform duration-200 ${
                    form.buat_semester ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 2: Detail Semester */}
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

            {form.buat_semester ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Semester Ganjil Card */}
                <div className="bg-white rounded-2xl p-5 border border-[#bfc9c4]/30 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#00c853]/30">
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

                {/* Semester Genap Card */}
                <div className="bg-white rounded-2xl p-5 border border-[#bfc9c4]/30 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#00c853]/30">
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

        {/* ── Footer ── */}
        <div className="bg-[#f2f4f3]/80 backdrop-blur-md px-6 md:px-8 py-5 border-t border-[#bfc9c4]/20 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-10 rounded-b-3xl">
          {/* Jadikan aktif checkbox */}
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
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                form.is_active
                  ? "bg-[#004d40] border-[#004d40]"
                  : "bg-white border-[#bfc9c4]"
              }`}
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

          {/* Action buttons */}
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

// ── Modal Buat Semester (untuk TA yang belum punya semester) ──────────────────
function ModalBuatSemester({ open, onClose, tahunAjaran, queryClient }) {
  const tahun = tahunAjaran?.tahun ?? "";
  const y1 = tahun.split("/")[0];
  const y2 = tahun.split("/")[1];

  const [form, setForm] = useState({
    semester_ganjil_mulai: "",
    semester_ganjil_selesai: "",
    semester_genap_mulai: "",
    semester_genap_selesai: "",
  });

  // Auto-fill tanggal saat modal dibuka
  useEffect(() => {
    if (open && y1 && y2) {
      setForm({
        semester_ganjil_mulai: `${y1}-07-14`,
        semester_ganjil_selesai: `${y1}-12-31`,
        semester_genap_mulai: `${y2}-01-02`,
        semester_genap_selesai: `${y2}-06-30`,
      });
    }
  }, [open, y1, y2]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const inputCls =
    "w-full px-4 py-2.5 bg-[#f8faf9] border border-[#bfc9c4]/40 rounded-xl text-sm text-[#111827] focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] outline-none transition-all";

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/operator/master-data/tahun-ajaran/${tahunAjaran.id}`, {
        tahun: tahunAjaran.tahun,
        buat_semester: true,
        semester_ganjil_mulai: form.semester_ganjil_mulai,
        semester_ganjil_selesai: form.semester_ganjil_selesai,
        semester_genap_mulai: form.semester_genap_mulai,
        semester_genap_selesai: form.semester_genap_selesai,
      }),
    onSuccess: () => {
      toast.success("Semester berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tahunAjaranKeys.detail(tahunAjaran.id),
      });
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal membuat semester."),
  });

  if (!open) return null;

  const dateCls =
    "w-full bg-[#f2f4f3]/50 text-on-surface text-sm rounded-lg border border-[#bfc9c4]/30 focus:border-[#00c853] focus:ring-4 focus:ring-[#00c853]/10 focus:bg-white focus:outline-none transition-all px-4 py-2.5";
  const labelCls =
    "block text-[11px] font-semibold text-[#3f4945] uppercase tracking-wider mb-1.5";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-[#bfc9c4]/20 p-6 md:p-8 rounded-t-3xl overflow-hidden bg-[#f2f4f3]">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] bg-[#00c853]/20 pointer-events-none" />
          <div className="flex flex-col gap-3">
            <h2 className="font-extrabold text-3xl md:text-4xl tracking-tighter leading-none text-[#004d40]">
              Buat{" "}
              <em className="font-serif not-italic text-[#006e2a]">Semester</em>
            </h2>
            <p className="text-sm text-[#3f4945]/80 leading-relaxed">
              Atur rentang tanggal semester untuk Tahun Ajaran{" "}
              <span className="font-bold text-[#004d40]">{tahun}</span>.
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

        {/* ── Body ── */}
        <div className="p-6 md:p-8">
          {/* Section badge */}
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
            {/* Semester Ganjil Card */}
            <div className="bg-white rounded-2xl p-5 border border-[#bfc9c4]/30 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#00c853]/30">
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
                    className={dateCls}
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
                    className={dateCls}
                  />
                </div>
              </div>
            </div>

            {/* Semester Genap Card */}
            <div className="bg-white rounded-2xl p-5 border border-[#bfc9c4]/30 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#00c853]/30">
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
                    className={dateCls}
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
                    className={dateCls}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
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
            disabled={
              mutation.isPending ||
              !form.semester_ganjil_mulai ||
              !form.semester_ganjil_selesai ||
              !form.semester_genap_mulai ||
              !form.semester_genap_selesai
            }
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
                Buat Semester
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── SemesterCard — sub-row rincian semester ───────────────────────────────────
function SemesterCard({
  semester,
  nama,
  nomor,
  taId,
  taIsActive,
  onAktifkan,
  onDetail,
  onBuat,
}) {
  const isAktif = semester?.is_active;
  const belumDibuat = !semester;

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
        isAktif
          ? "bg-success/5 border-success/20"
          : "bg-surface-container-lowest border-border-light"
      }`}
    >
      {/* Kiri — info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Nomor badge */}
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
            isAktif
              ? "bg-success text-white"
              : "bg-surface-container text-text-secondary"
          }`}
        >
          {nomor}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-text-primary">
              Semester {nama}
            </span>
            {belumDibuat ? (
              <span className="px-1.5 py-0.5 rounded-full bg-danger/10 text-danger text-[9px] font-bold tracking-wide">
                BELUM DIBUAT
              </span>
            ) : isAktif ? (
              <span className="px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[9px] font-extrabold tracking-wide">
                AKTIF
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-text-secondary text-[9px] font-bold tracking-wide">
                STANDBY
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5 truncate">
            {belumDibuat
              ? "Belum ada periode semester"
              : `${fmt(semester.tgl_mulai)} – ${fmt(semester.tgl_selesai)}`}
          </p>
        </div>
      </div>

      {/* Kanan — aksi */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {belumDibuat ? (
          <button
            onClick={onBuat}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-container text-on-primary text-[11px] font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[13px]">add</span>
            Buat
          </button>
        ) : (
          <>
            {taIsActive && !isAktif && (
              <button
                onClick={onAktifkan}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-[11px] font-bold hover:bg-success/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">
                  check_circle
                </span>
                Aktifkan
              </button>
            )}
            <button
              onClick={onDetail}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-text-primary text-[11px] font-bold hover:bg-surface-container-high hover:text-primary transition-colors"
            >
              Detail
              <span className="material-symbols-outlined text-[13px]">
                chevron_right
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Recycle Bin View ──────────────────────────────────────────────────────────
function RecycleBinView() {
  const { data: trashList = [], isLoading } = useTrashTahunAjaran();
  const restore = useRestoreTahunAjaran();
  const forceDelete = useForceDeleteTahunAjaran();

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true,
  });

  const openConfirm = ({ title, message, onConfirm, isDanger = true }) =>
    setConfirmModal({ open: true, title, message, onConfirm, isDanger });
  const closeConfirm = () =>
    setConfirmModal((s) => ({ ...s, open: false, onConfirm: null }));

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <span className="material-symbols-outlined text-amber-600 text-[22px]">
          info
        </span>
        <p className="text-sm text-amber-800">
          Tahun ajaran di recycle bin akan dihapus permanen jika tidak
          dipulihkan. Hapus permanen hanya diizinkan jika tidak ada data
          akademik yang terikat.
        </p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : trashList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <span className="material-symbols-outlined text-5xl">
            delete_sweep
          </span>
          <p className="text-sm font-medium">Recycle bin kosong</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trashList.map((t) => {
            const deletedAt = t.deleted_at
              ? new Date(t.deleted_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "-";
            const semCount = t.semesters?.length ?? 0;

            return (
              <div
                key={t.id}
                className="flex items-center justify-between gap-4 p-4 bg-white border border-red-100 rounded-2xl shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-red-400 text-[20px]">
                      delete
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800">{t.tahun}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {semCount} semester · Dihapus {deletedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Restore */}
                  <button
                    onClick={() =>
                      openConfirm({
                        title: "Pulihkan Tahun Ajaran",
                        message: `"${t.tahun}" akan dipulihkan beserta semua semesternya.`,
                        onConfirm: () => restore.mutate(t.id),
                        isDanger: false,
                      })
                    }
                    disabled={restore.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      restore
                    </span>
                    Pulihkan
                  </button>

                  {/* Force delete */}
                  <button
                    onClick={() =>
                      openConfirm({
                        title: "Hapus Permanen",
                        message: `"${t.tahun}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                        onConfirm: () => forceDelete.mutate(t.id),
                      })
                    }
                    disabled={forceDelete.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      delete_forever
                    </span>
                    Hapus Permanen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            onClick={closeConfirm}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`h-1.5 w-full ${confirmModal.isDanger ? "bg-red-500" : "bg-emerald-500"}`}
              />
              <div className="px-6 pt-6 pb-4">
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
              <div className="flex gap-3 px-6 pb-6 pt-2">
                <button
                  onClick={closeConfirm}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wide hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm?.();
                    closeConfirm();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wide transition-all ${
                    confirmModal.isDanger
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  {confirmModal.isDanger ? "Ya, Hapus" : "Ya, Pulihkan"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ── Arsip View (tahun ajaran SELESAI) ─────────────────────────────────────────
function ArsipView({ list, navigate }) {
  const arsip = list.filter((t) => getStatusTahunAjaran(t) === "SELESAI");

  if (arsip.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <span className="material-symbols-outlined text-5xl">archive</span>
        <p className="text-sm font-medium">Belum ada tahun ajaran yang selesai</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <span className="material-symbols-outlined text-blue-600 text-[22px]">
          info
        </span>
        <p className="text-sm text-blue-800">
          Menampilkan <strong>{arsip.length}</strong> tahun ajaran yang telah selesai. Data ini hanya untuk referensi dan tidak dapat diaktifkan kembali dari halaman ini.
        </p>
      </div>

      {arsip.map((t) => {
        const tMulai = getTglMulai(t);
        const tSelesai = getTglSelesai(t);
        const semGanjil = t.semesters?.find((s) => s.nama === "Ganjil");
        const semGenap = t.semesters?.find((s) => s.nama === "Genap");

        return (
          <div
            key={t.id}
            className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-emerald-200 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">
                  archive
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-gray-800">{t.tahun}</p>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                    Selesai
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tMulai && tSelesai
                    ? `${fmt(tMulai)} – ${fmt(tSelesai)}`
                    : "-"}
                  {" · "}
                  {[semGanjil, semGenap].filter(Boolean).length} semester
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/operator/master/tahun-ajaran/${t.id}`)
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-700 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]">
                visibility
              </span>
              Lihat Detail
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function TahunAjaran() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("aktif"); // "aktif" | "arsip" | "trash"
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [buatSemesterOpen, setBuatSemesterOpen] = useState(false);
  const [buatSemesterTA, setBuatSemesterTA] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // "semua" | "aktif" | "selesai" | "mendatang"

  // State modal konfirmasi — menggantikan window.confirm() yang tidak bisa di-style
  // dan diblokir di beberapa browser / WebView environment.
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true,
  });

  const openConfirm = ({ title, message, onConfirm, isDanger = true }) =>
    setConfirmModal({ open: true, title, message, onConfirm, isDanger });
  const closeConfirm = () =>
    setConfirmModal((s) => ({ ...s, open: false, onConfirm: null }));

  // Fetch list of Tahun Ajaran
  const { data: listData = [], isLoading } = useQuery({
    queryKey: tahunAjaranKeys.lists(),
    queryFn: () =>
      api.get("/operator/master-data/tahun-ajaran").then((r) => r.data.data),
    staleTime: 30_000,
  });

  const list = listData ?? [];
  const aktif = list.find((t) => t.is_active);

  // Set default selected ID when data is loaded
  useEffect(() => {
    if (list.length > 0 && !selectedId) {
      setSelectedId(aktif?.id ?? list[0]?.id);
    }
  }, [list, aktif, selectedId]);

  const selectedTA = list.find((t) => t.id === selectedId) || aktif || list[0];

  const handleOpenAction = (e, id) => {
    e.stopPropagation();

    // Tutup kalau tombol yang sama diklik lagi
    if (openActionId === id) {
      setOpenActionId(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const menuWidth = 192;
    const menuHeight = 220;
    const gap = 8;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    // Jika ruang bawah tidak cukup,
    // dropdown muncul ke atas
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - gap;
    }

    // Jangan keluar dari kanan layar
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    // Jangan keluar dari kiri layar
    if (left < 12) {
      left = 12;
    }

    setActionMenuPosition({
      top,
      left,
    });

    setOpenActionId(id);
  };

  // Fetch detail data for the selected academic year (used in sidebar stats)
  const { data: selectedDetailData, isLoading: loadingDetail } = useQuery({
    queryKey: tahunAjaranKeys.detail(selectedTA?.id),
    queryFn: () =>
      api
        .get(`/operator/master-data/tahun-ajaran/${selectedTA.id}`)
        .then((r) => r.data),
    enabled: !!selectedTA?.id,
    staleTime: 60_000,
  });

  // Mutation: Set active year
  const setAktif = useMutation({
    mutationFn: (id) =>
      api.patch(`/operator/master-data/tahun-ajaran/${id}/aktif`),
    onSuccess: () => {
      toast.success("Tahun ajaran aktif berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      if (selectedTA?.id) {
        queryClient.invalidateQueries({
          queryKey: tahunAjaranKeys.detail(selectedTA.id),
        });
      }
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ?? "Gagal mengubah status aktif.",
      ),
  });

  // Mutation: Set active semester
  const setSemesterAktif = useMutation({
    mutationFn: ({ taId, semesterNama }) =>
      api.patch(`/operator/master-data/tahun-ajaran/${taId}/semester-aktif`, {
        semester_nama: semesterNama,
      }),
    onSuccess: (_, vars) => {
      toast.success(`Semester ${vars.semesterNama} berhasil diaktifkan.`);
      // Invalidate list DAN detail dari TA yang baru saja diubah (bukan cuma selectedTA)
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tahunAjaranKeys.detail(vars.taId),
      });
      if (selectedTA?.id && selectedTA.id !== vars.taId) {
        queryClient.invalidateQueries({
          queryKey: tahunAjaranKeys.detail(selectedTA.id),
        });
      }
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ?? "Gagal mengaktifkan semester.",
      ),
  });

  // Mutation: Delete year
  const hapus = useMutation({
    mutationFn: (id) => api.delete(`/operator/master-data/tahun-ajaran/${id}`),
    onSuccess: () => {
      toast.success("Tahun ajaran berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.dropdown() });
      setSelectedId(null);
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ?? "Gagal menghapus tahun ajaran.",
      ),
  });

  // Computed summary stats
  const totalTahunAjaran = list.length;
  let totalGanjil = 0;
  let totalGenap = 0;
  let totalSemesterSelesai = 0;
  let totalMendatang = 0;

  list.forEach((t) => {
    const st = getStatusTahunAjaran(t);
    if (st === "SELESAI") totalSemesterSelesai += t.semesters?.length || 2;
    if (st === "AKAN DATANG") totalMendatang += 1;
    t.semesters?.forEach((s) => {
      if (s.nama === "Ganjil") totalGanjil += 1;
      if (s.nama === "Genap") totalGenap += 1;
    });
  });

  // Filter list
  const filtered = list.filter((t) => {
    const matchSearch =
      !search || t.tahun?.toLowerCase().includes(search.toLowerCase());
    const status = getStatusTahunAjaran(t);
    if (!matchSearch) return false;
    if (statusFilter === "aktif") return status === "AKTIF";
    if (statusFilter === "selesai") return status === "SELESAI";
    if (statusFilter === "mendatang") return status === "AKAN DATANG";
    return true;
  });

  // Selected TA metrics — dari API detail, null saat loading
  const metricGuru = selectedDetailData?.total_guru ?? null;
  const metricKelas = selectedDetailData?.total_kelas ?? null;
  const metricMapel = selectedDetailData?.total_mapel ?? null;
  const metricJadwal = selectedDetailData?.total_jadwal ?? null;
  const metricSiswa = selectedDetailData?.total_siswa ?? null;
  const metricRombel = selectedDetailData?.total_kelas ?? null;

  // Active semester name for selected TA
  const selectedActiveSemester =
    selectedTA?.semesters?.find((s) => s.is_active)?.nama ||
    (selectedTA?.semesters?.[0]?.nama ?? "Ganjil");

  // Hitung progress dari checklist jika ada, fallback dari status
  const getAcademicProgress = (t) => {
    // Kalau TA ini yang sedang dipilih dan detail sudah di-load
    if (
      selectedDetailData &&
      selectedTA?.id === t.id &&
      selectedDetailData.checklist
    ) {
      const checks = Object.values(selectedDetailData.checklist);
      const done = checks.filter(Boolean).length;
      return Math.round((done / checks.length) * 100);
    }
    // Fallback dari status saja (tanpa angka palsu)
    const st = getStatusTahunAjaran(t);
    if (st === "AKTIF") return null; // render skeleton
    if (st === "SELESAI") return 100;
    if (st === "AKAN DATANG") return 0;
    return null;
  };

  return (
    <div className="min-h-screen relative w-full space-y-5 animate-fade-up">
      {/* ── Atmospheric Background Blur ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#94d3c1]/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-[#caead6]/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#ffdeac]/15 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
      </div>

      <div className="relative z-10 space-y-5">
        {/* ── 1. Header Section ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-4">
          <div className="relative flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-1">
              Manajemen{" "}
              <span className="font-serif-accent italic text-primary font-normal">
                Tahun Ajaran
              </span>{" "}
              &amp; Semester
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Kelola periode akademik sekolah, semester aktif, serta status
              periode yang digunakan dalam proses akademik secara terpusat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                {
                  id: "aktif",
                  label: "Aktif & Mendatang",
                  icon: "calendar_month",
                },
                { id: "arsip", label: "Arsip", icon: "archive" },
                { id: "trash", label: "Recycle Bin", icon: "delete" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: tahunAjaranKeys.all })
              }
              title="Muat Ulang Data"
              className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-border-light text-text-secondary hover:text-primary hover:bg-surface-container-low flex items-center justify-center transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
            </button>

            {activeTab === "aktif" && (
              <button
                onClick={() => {
                  setEditData(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-container text-on-primary rounded-xl text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                Tambah Tahun Ajaran
              </button>
            )}
          </div>
        </div>

        {/* ── Tab: Arsip / Recycle Bin ──────────────────────────────────────── */}
        {activeTab === "trash" && (
          <div className="bg-white/85 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[20px]">
                delete
              </span>
              Recycle Bin — Tahun Ajaran Terhapus
            </h2>
            <RecycleBinView />
          </div>
        )}

        {activeTab === "arsip" && (
          <div className="bg-white/85 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 text-[20px]">
                archive
              </span>
              Arsip — Tahun Ajaran Selesai
            </h2>
            <ArsipView list={list} navigate={navigate} />
          </div>
        )}

        {activeTab === "aktif" && (
          <>
            {/* ── 2. Bento Grid Layout (4 Stat Cards) ────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Active Period Card */}
              <div className="bg-[#00342b] text-white rounded-2xl p-4 shadow-md relative overflow-hidden border border-[#004d40]">
                <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-bold text-[#afefdd] uppercase tracking-widest">
                      Tahun Ajaran Aktif
                    </p>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#69ff87] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#69ff87]" />
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold text-white">
                    {aktif?.tahun || "-"}
                  </h4>
                  <p className="text-xs font-medium text-[#94d3c1] mt-1 italic font-serif-accent">
                    {aktif
                      ? `Semester ${aktif.semesters?.find((s) => s.is_active)?.nama || "Ganjil"}`
                      : "Belum Ada Periode Aktif"}
                  </p>
                </div>
                <div className="absolute -right-3 -bottom-3 opacity-15 text-white pointer-events-none">
                  <span className="material-symbols-outlined text-6xl">
                    calendar_month
                  </span>
                </div>
              </div>

              {/* Card 2: Total Tahun Card */}
              <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-4 shadow-sm">
                <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <p className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mb-1">
                  Total Tahun Ajaran
                </p>
                <h4 className="text-2xl font-bold text-text-primary">
                  {totalTahunAjaran}
                </h4>
                <p className="text-[11px] text-[#006e2a] font-bold mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    school
                  </span>
                  {totalGanjil} Ganjil • {totalGenap} Genap
                </p>
              </div>

              {/* Card 3: Semester Selesai Card */}
              <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-4 shadow-sm">
                <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <p className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mb-1">
                  Semester Selesai
                </p>
                <h4 className="text-2xl font-bold text-text-primary">
                  {totalSemesterSelesai}
                </h4>
                <p className="text-[11px] text-[#006e2a] font-bold mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    check_circle
                  </span>
                  {totalSemesterSelesai > 0
                    ? `${totalSemesterSelesai} Semester Selesai`
                    : "Belum ada yg selesai"}
                </p>
              </div>

              {/* Card 4: Jadwal Mendatang Card */}
              <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-4 shadow-sm">
                <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <p className="text-[10px] font-bold text-[#3f4945] uppercase tracking-widest mb-1">
                  Jadwal Mendatang
                </p>
                <h4 className="text-2xl font-bold text-text-primary">
                  {totalMendatang > 0 ? totalMendatang : aktif ? 1 : 0}
                </h4>
                <p className="text-[11px] text-[#00342b] font-bold mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    event
                  </span>
                  {totalMendatang > 0
                    ? `${totalMendatang} TA Mendatang`
                    : aktif
                      ? `Semester ${aktif.semesters?.find((s) => !s.is_active)?.nama ?? "Genap"} Berikutnya`
                      : "Belum ada periode"}
                </p>
              </div>
            </div>

            {/* ── 3. Main Content Area: Data Table + Detail Sidebar ─────────────── */}
            <div className="grid grid-cols-12 gap-5 items-start">
              {/* Main Data Column (Span 8) */}
              <div className="col-span-12 xl:col-span-8 flex flex-col gap-5">
                {/* Search and Filters Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md border border-white/50 p-3 rounded-2xl shadow-xs">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f4945]/50 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari tahun ajaran (contoh: 2026/2027)..."
                      className="w-full pl-10 pr-9 py-2 bg-white/80 border border-[#bfc9c4]/30 rounded-xl text-xs sm:text-sm text-[#111827] placeholder:text-[#3f4945]/40 focus:outline-none focus:ring-2 focus:ring-[#006e2a]/20 focus:border-[#006e2a] transition-all"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3f4945]/40 hover:text-[#111827]"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          close
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1 bg-[#eceeed]/60 p-1 rounded-xl shrink-0 overflow-x-auto">
                    {[
                      { id: "semua", label: "Semua" },
                      { id: "aktif", label: "Aktif" },
                      { id: "selesai", label: "Selesai" },
                      { id: "mendatang", label: "Mendatang" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          statusFilter === tab.id
                            ? "bg-white text-[#00342b] shadow-xs"
                            : "text-[#3f4945]/70 hover:text-[#00342b]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Table Card */}
                <div className="bg-white/85 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-xl p-6 sm:p-8 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#bfc9c4]/20">
                          <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                            Tahun Ajaran
                          </th>
                          <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                            Semester
                          </th>
                          <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                            Periode
                          </th>
                          <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                            Status
                          </th>
                          <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold">
                            Data Akademik
                          </th>
                          <th className="py-4 px-3 font-serif-accent text-[14px] text-[#00342b] uppercase tracking-widest font-bold text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#bfc9c4]/15">
                        {isLoading ? (
                          [...Array(3)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td colSpan={6} className="py-6 px-3">
                                <div className="h-4 bg-[#eceeed] rounded-lg w-full mb-2" />
                              </td>
                            </tr>
                          ))
                        ) : filtered.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-14 px-3 text-center text-[#3f4945]/60"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-4xl text-[#bfc9c4]">
                                  calendar_today
                                </span>
                                <p className="font-semibold text-sm">
                                  {search
                                    ? "Tidak ada tahun ajaran yang sesuai dengan pencarian."
                                    : "Belum ada data tahun ajaran."}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((t) => {
                            const status = getStatusTahunAjaran(t);
                            const isRowSelected = selectedId === t.id;
                            const isExpanded = expandedId === t.id;
                            const academicProg = getAcademicProgress(t);
                            const tMulai = getTglMulai(t);
                            const tSelesai = getTglSelesai(t);
                            const periodeStr =
                              tMulai && tSelesai
                                ? `${fmtShortMonthYear(tMulai)} – ${fmtShortMonthYear(tSelesai)}`
                                : "-";

                            return (
                              <React.Fragment key={t.id}>
                                <tr
                                  onClick={() => {
                                    setSelectedId(t.id);
                                    setExpandedId(isExpanded ? null : t.id);
                                  }}
                                  className={`transition-all duration-300 cursor-pointer group ${
                                    isRowSelected
                                      ? "bg-[#006e2a]/8"
                                      : "hover:bg-[#006e2a]/4"
                                  }`}
                                >
                                  {/* Tahun Ajaran Column */}
                                  <td className="py-6 px-3">
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedId(
                                            isExpanded ? null : t.id,
                                          );
                                        }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#3f4945]/60 hover:text-[#006e2a] hover:bg-[#006e2a]/10 transition-colors"
                                        title="Lihat Detail Semester"
                                      >
                                        <span
                                          className="material-symbols-outlined text-[18px] transition-transform duration-300"
                                          style={{
                                            transform: isExpanded
                                              ? "rotate(90deg)"
                                              : "rotate(0deg)",
                                          }}
                                        >
                                          chevron_right
                                        </span>
                                      </button>
                                      <div>
                                        <div className="font-headline-card text-[17px] font-extrabold text-[#00342b] group-hover:text-[#006e2a] transition-colors flex items-center gap-2">
                                          {t.tahun}
                                          {isRowSelected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a]" />
                                          )}
                                        </div>
                                        <span className="text-[11px] text-[#3f4945]/60">
                                          {t.semesters?.length || 2} Semester
                                          Terdaftar
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Semester Column */}
                                  <td className="py-6 px-3">
                                    <div className="font-body-md text-sm text-[#191c1c] font-semibold">
                                      {t.semesters?.find((s) => s.is_active)
                                        ?.nama || "Ganjil & Genap"}
                                    </div>
                                    <div className="text-[11px] text-[#3f4945]/60">
                                      {t.is_active
                                        ? "Semester Aktif Berjalan"
                                        : "Periode Reguler"}
                                    </div>
                                  </td>

                                  {/* Periode Column */}
                                  <td className="py-6 px-3">
                                    <div className="font-body-md text-sm text-[#3f4945]/80 font-medium">
                                      {periodeStr}
                                    </div>
                                  </td>

                                  {/* Status Column */}
                                  <td className="py-6 px-3">
                                    {status === "AKTIF" ? (
                                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-label-badge text-[10px] font-bold tracking-widest border border-[#006e2a]/20 shadow-xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] animate-pulse" />
                                        AKTIF
                                      </span>
                                    ) : status === "SELESAI" ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eceeed] text-[#3f4945] font-label-badge text-[10px] font-bold tracking-widest">
                                        SELESAI
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-label-badge text-[10px] font-bold tracking-widest border border-[#006e2a]/20">
                                        AKAN DATANG
                                      </span>
                                    )}
                                  </td>

                                  {/* Data Akademik Column */}
                                  <td className="py-6 px-3">
                                    {(() => {
                                      const pct = getAcademicProgress(t);
                                      return (
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-1.5 bg-[#bfc9c4]/30 rounded-full overflow-hidden">
                                            {pct !== null ? (
                                              <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#006e2a] to-[#52b788] transition-all duration-700"
                                                style={{ width: `${pct}%` }}
                                              />
                                            ) : (
                                              <div className="h-full w-1/2 rounded-full bg-[#bfc9c4]/50 animate-pulse" />
                                            )}
                                          </div>
                                          <span className="text-[11px] font-bold text-[#3f4945] w-8 text-right">
                                            {pct !== null ? `${pct}%` : "—"}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </td>

                                  {/* Aksi Column */}
                                  <td className="py-6 px-3 text-right">
                                    <div
                                      className="inline-flex"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          handleOpenAction(e, t.id)
                                        }
                                        title="Opsi"
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                          openActionId === t.id
                                            ? "bg-[#00342b] text-white shadow-md"
                                            : "text-[#3f4945]/70 hover:text-[#00342b] hover:bg-[#eceeed]"
                                        }`}
                                      >
                                        <span className="material-symbols-outlined text-[20px]">
                                          more_vert
                                        </span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Sub-row when expanded: Shows Ganjil & Genap breakdown */}
                                {isExpanded && (
                                  <tr className="bg-[#006e2a]/[0.03]">
                                    <td
                                      colSpan={6}
                                      className="py-4 px-6 border-b border-[#006e2a]/15"
                                    >
                                      <div className="bg-white rounded-2xl border border-[#bfc9c4]/30 p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold text-[#00342b]">
                                          <span className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-[#006e2a]">
                                              calendar_view_month
                                            </span>
                                            Rincian Semester — {t.tahun}
                                          </span>
                                          <span className="text-[11px] text-[#3f4945]/60 font-normal">
                                            Klik detail untuk melihat jadwal,
                                            kelas, dan kurikulum semester
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <SemesterCard
                                            semester={t.semesters?.find(
                                              (s) => s.nama === "Ganjil",
                                            )}
                                            nama="Ganjil"
                                            nomor="1"
                                            taId={t.id}
                                            taIsActive={t.is_active}
                                            onAktifkan={() =>
                                              setSemesterAktif.mutate({
                                                taId: t.id,
                                                semesterNama: "Ganjil",
                                              })
                                            }
                                            onDetail={() =>
                                              navigate(
                                                `/operator/master/tahun-ajaran/${t.id}/semester/Ganjil`,
                                              )
                                            }
                                            onBuat={() => {
                                              setBuatSemesterTA(t);
                                              setBuatSemesterOpen(true);
                                            }}
                                          />
                                          <SemesterCard
                                            semester={t.semesters?.find(
                                              (s) => s.nama === "Genap",
                                            )}
                                            nama="Genap"
                                            nomor="2"
                                            taId={t.id}
                                            taIsActive={t.is_active}
                                            onAktifkan={() =>
                                              setSemesterAktif.mutate({
                                                taId: t.id,
                                                semesterNama: "Genap",
                                              })
                                            }
                                            onDetail={() =>
                                              navigate(
                                                `/operator/master/tahun-ajaran/${t.id}/semester/Genap`,
                                              )
                                            }
                                            onBuat={() => {
                                              setBuatSemesterTA(t);
                                              setBuatSemesterOpen(true);
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Helper */}
                  <div className="mt-5 pt-4 border-t border-[#bfc9c4]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#3f4945]/70">
                    <span>
                      Menampilkan <b>{filtered.length}</b> dari {list.length}{" "}
                      tahun ajaran
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#006e2a]">
                        touch_app
                      </span>
                      Pilih baris untuk melihat statistik detail periode di
                      sidebar kanan
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Sidebar Column (Span 4) */}
              <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                {/* 1. Detail Periode Card */}
                <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  {/* Decorative Atmosphere Glow */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#006e2a]/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none transition-colors group-hover:bg-[#006e2a]/10" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00342b]/5 rounded-full blur-[50px] -ml-16 -mb-16 pointer-events-none" />

                  {/* Header */}
                  <div className="relative z-10 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00342b]/5 flex items-center justify-center border border-[#00342b]/10 text-[#00342b]">
                          <span
                            className="material-symbols-outlined text-[22px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            analytics
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary">
                          Detail Periode
                        </h3>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-[#006e2a]/10 text-[#006e2a] font-label-badge text-[10px] font-extrabold tracking-widest border border-[#006e2a]/20 shadow-xs">
                        {selectedTA
                          ? `${selectedTA.tahun} ${selectedActiveSemester.toUpperCase()}`
                          : "2026/2027 GANJIL"}
                      </span>
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-[#bfc9c4]/30 via-[#bfc9c4]/10 to-transparent" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2.5 relative z-10">
                    {/* Guru */}
                    <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          person
                        </span>
                      </div>
                      <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                        Total Guru
                      </p>
                      {loadingDetail ? (
                        <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                      ) : (
                        <p className="text-xl font-bold text-text-primary">
                          {metricGuru ?? "—"}
                        </p>
                      )}
                    </div>

                    {/* Kelas */}
                    <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          school
                        </span>
                      </div>
                      <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                        Total Kelas
                      </p>
                      {loadingDetail ? (
                        <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                      ) : (
                        <p className="text-xl font-bold text-text-primary">
                          {metricKelas ?? "—"}
                        </p>
                      )}
                    </div>

                    {/* Mapel */}
                    <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          menu_book
                        </span>
                      </div>
                      <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                        Mata Pelajaran
                      </p>
                      {loadingDetail ? (
                        <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                      ) : (
                        <p className="text-xl font-bold text-text-primary">
                          {metricMapel ?? "—"}
                        </p>
                      )}
                    </div>

                    {/* Jadwal */}
                    <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          calendar_today
                        </span>
                      </div>
                      <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                        Total Jadwal
                      </p>
                      {loadingDetail ? (
                        <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                      ) : (
                        <p className="text-xl font-bold text-text-primary">
                          {metricJadwal ?? "—"}
                        </p>
                      )}
                    </div>

                    {/* Siswa */}
                    <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          groups
                        </span>
                      </div>
                      <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                        Total Siswa
                      </p>
                      {loadingDetail ? (
                        <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                      ) : (
                        <p className="text-xl font-bold text-text-primary">
                          {metricSiswa ?? "—"}
                        </p>
                      )}
                    </div>

                    {/* Rombel */}
                    <div className="bg-surface-container p-3 rounded-xl border border-border-light flex flex-col items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          grid_view
                        </span>
                      </div>
                      <p className="font-label-badge text-[10px] text-[#3f4945]/70 uppercase tracking-wider font-bold mb-1">
                        Rombel
                      </p>
                      {loadingDetail ? (
                        <span className="inline-block w-10 h-6 bg-[#bfc9c4]/40 rounded-lg animate-pulse mt-1" />
                      ) : (
                        <p className="text-xl font-bold text-text-primary">
                          {metricRombel ?? "—"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View Detail CTA Button */}
                  {selectedTA && (
                    <div className="mt-5 relative z-10">
                      <button
                        onClick={() =>
                          navigate(
                            `/operator/master/tahun-ajaran/${selectedTA.id}`,
                          )
                        }
                        className="w-full py-3 rounded-2xl bg-[#00342b] text-white hover:bg-[#004d40] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-[#00342b]/20 hover:shadow-lg"
                      >
                        <span>Buka Rincian Lengkap</span>
                        <span className="material-symbols-outlined text-[16px]">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Danger Zone Card */}
                <div className="bg-surface-container-lowest border border-danger/20 rounded-2xl p-5 shadow-sm">
                  {/* Subtle Background Glow */}
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#ba1a1a]/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="relative z-10">
                    {/* Header Label */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
                      <span className="font-label-badge text-[10px] text-[#ba1a1a] font-black tracking-[0.2em] uppercase">
                        Zona Berbahaya
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center border border-[#ba1a1a]/20 shadow-sm shrink-0 text-[#ba1a1a] group-hover:shadow-[0_0_15px_rgba(186,26,26,0.2)] transition-shadow duration-300">
                        <span className="material-symbols-outlined text-[24px]">
                          warning
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-text-primary mb-1.5">
                          Hapus Periode
                        </h4>
                        {selectedTA?.is_active ? (
                          <>
                            <p className="font-body-md text-xs text-[#3f4945]/80 leading-relaxed mb-4">
                              Periode tidak dapat dihapus karena masih berstatus{" "}
                              <span className="font-bold text-[#ba1a1a]">
                                AKTIF
                              </span>{" "}
                              dan digunakan oleh seluruh modul akademik.
                              Nonaktifkan terlebih dahulu sebelum menghapus.
                            </p>
                            <button
                              disabled
                              className="w-full bg-[#eceeed] text-[#3f4945]/40 px-5 py-3 rounded-xl font-label-badge text-[11px] font-bold tracking-widest uppercase cursor-not-allowed border border-[#bfc9c4]/30 flex items-center justify-center gap-2 shadow-inner"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                lock
                              </span>
                              Hapus Periode
                            </button>
                          </>
                        ) : selectedTA ? (
                          <>
                            <p className="font-body-md text-xs text-[#3f4945]/80 leading-relaxed mb-4">
                              Tindakan ini akan menghapus periode{" "}
                              <b>{selectedTA.tahun}</b> beserta data semesternya
                              secara permanen.
                            </p>
                            <button
                              onClick={() =>
                                openConfirm({
                                  title: "Hapus Tahun Ajaran",
                                  message: `Periode "${selectedTA.tahun}" beserta data semesternya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                                  onConfirm: () => hapus.mutate(selectedTA.id),
                                })
                              }
                              disabled={hapus.isPending}
                              className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white px-5 py-3 rounded-xl font-label-badge text-[11px] font-black tracking-widest uppercase shadow-md hover:shadow-lg shadow-[#ba1a1a]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                delete_forever
                              </span>
                              Hapus Periode {selectedTA.tahun}
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-[#3f4945]/60">
                            Pilih tahun ajaran untuk opsi penghapusan.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 4. Modal Tambah / Edit ────────────────────────────────────────── */}
      {/* ── Action Dropdown Portal ─────────────────────────────── */}
      {openActionId &&
        actionMenuPosition &&
        (() => {
          const actionItem = list.find((item) => item.id === openActionId);
          if (!actionItem) return null;
          const close = () => {
            setOpenActionId(null);
            setActionMenuPosition(null);
          };
          return createPortal(
            <div
              className="fixed z-[9999] w-52"
              style={{
                top: actionMenuPosition.top,
                left: actionMenuPosition.left,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-surface rounded-2xl border border-border-light shadow-xl shadow-black/8 p-1 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                {/* HEADER — nama TA */}
                <div className="px-3 pt-2.5 pb-2 border-b border-border-light mb-1">
                  <p className="text-[11px] font-bold text-text-primary truncate">
                    {actionItem.tahun}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {actionItem.is_active
                      ? "Tahun Ajaran Aktif"
                      : "Periode Tidak Aktif"}
                  </p>
                </div>

                {/* DETAIL */}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    navigate(`/operator/master/tahun-ajaran/${actionItem.id}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-text-primary hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">
                    visibility
                  </span>
                  <span>Lihat Detail</span>
                </button>

                {/* EDIT */}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setEditData({ ...actionItem });
                    setModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-text-primary hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">
                    edit
                  </span>
                  <span>Edit Periode</span>
                </button>

                {/* SET AKTIF */}
                {!actionItem.is_active && (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      openConfirm({
                        title: "Aktifkan Tahun Ajaran",
                        message: `"${actionItem.tahun}" akan dijadikan tahun ajaran aktif. Tahun ajaran yang sedang aktif akan dinonaktifkan secara otomatis.`,
                        onConfirm: () => setAktif.mutate(actionItem.id),
                        isDanger: false,
                      });
                    }}
                    disabled={setAktif.isPending}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-success hover:bg-success/8 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px] text-success">
                      check_circle
                    </span>
                    <span>Jadikan Aktif</span>
                  </button>
                )}

                {/* DIVIDER */}
                <div className="h-px bg-border-light mx-1 my-1" />

                {/* DELETE */}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openConfirm({
                      title: "Hapus Tahun Ajaran",
                      message: `Periode "${actionItem.tahun}" beserta data semesternya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                      onConfirm: () => hapus.mutate(actionItem.id),
                    });
                  }}
                  disabled={hapus.isPending || actionItem.is_active}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium text-danger hover:bg-danger/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px] text-danger">
                    delete
                  </span>
                  <span>Hapus Periode</span>
                </button>

                {/* INFO UNTUK DATA AKTIF */}
                {actionItem.is_active && (
                  <div className="px-3 pb-2">
                    <p className="text-[10px] text-text-secondary/70">
                      Periode aktif tidak dapat dihapus.
                    </p>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          );
        })()}

      <ModalTahunAjaran
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
        queryClient={queryClient}
      />
      <ModalBuatSemester
        open={buatSemesterOpen}
        onClose={() => {
          setBuatSemesterOpen(false);
          setBuatSemesterTA(null);
        }}
        tahunAjaran={buatSemesterTA}
        queryClient={queryClient}
      />

      {/* ── Modal Konfirmasi — menggantikan window.confirm() ─────────────────── */}
      {confirmModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            onClick={closeConfirm}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top strip */}
              <div
                className={`h-1.5 w-full ${
                  confirmModal.isDanger ? "bg-[#ba1a1a]" : "bg-[#00c853]"
                }`}
              />
              {/* Body */}
              <div className="px-6 pt-6 pb-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                    confirmModal.isDanger
                      ? "bg-[#ba1a1a]/8 border border-[#ba1a1a]/15"
                      : "bg-[#00c853]/8 border border-[#00c853]/15"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[28px] ${
                      confirmModal.isDanger
                        ? "text-[#ba1a1a]"
                        : "text-[#004d40]"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {confirmModal.isDanger ? "warning" : "check_circle"}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#00342b] mb-2 tracking-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-[#3f4945]/80 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6 pt-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="flex-1 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-[#3f4945] font-bold text-[11px] tracking-[0.1em] uppercase hover:bg-[#eceeed] hover:text-[#00342b] transition-all duration-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm?.();
                    closeConfirm();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-[11px] tracking-[0.1em] uppercase shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 ${
                    confirmModal.isDanger
                      ? "bg-[#ba1a1a] hover:bg-[#93000a] shadow-[#ba1a1a]/20 hover:shadow-[#ba1a1a]/40"
                      : "bg-[#004d40] hover:bg-[#00c853] shadow-[#004d40]/20 hover:shadow-[#00c853]/40"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {confirmModal.isDanger ? "delete" : "check_circle"}
                  </span>
                  {confirmModal.isDanger ? "Ya, Hapus" : "Ya, Aktifkan"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}