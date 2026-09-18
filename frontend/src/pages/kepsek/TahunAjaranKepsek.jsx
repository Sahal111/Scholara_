import { useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useTahunAjaranList,
  tahunAjaranKeys,
  useApproveTahunAjaran,
  useRejectTahunAjaran,
  useAktifkanTahunAjaran,
} from "../../hooks/api/useTahunAjaran";
import {
  fmt,
  getWorkflowStatus,
  TA_STATUS,
  TA_STATUS_CONFIG,
  getTglMulai,
  getTglSelesai,
} from "../wakasek/akademik/tahun-ajaran/utils/tahunAjaranHelpers";

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = TA_STATUS_CONFIG[status] ?? TA_STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {cfg.pulse ? (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      )}
      {cfg.label.toUpperCase()}
    </span>
  );
}

// ── Semester Pills ────────────────────────────────────────────────────────────
function SemesterPills({ semesters = [] }) {
  if (!semesters.length)
    return <span className="text-xs text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {semesters.map((s) => (
        <span
          key={s.ulid ?? s.id}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            s.is_active
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}
        >
          {s.is_active && (
            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          )}
          {s.nama}
          {s.tgl_mulai && (
            <span className="opacity-60">
              &nbsp;{fmt(s.tgl_mulai)} – {fmt(s.tgl_selesai)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── Modal Approve ─────────────────────────────────────────────────────────────
function ModalApprove({ item, onClose }) {
  const [catatan, setCatatan] = useState("");
  const approveMut = useApproveTahunAjaran();

  const handleSubmit = () => {
    approveMut.mutate(
      { ulid: item.ulid, catatan: catatan.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
          <span
            className="material-symbols-outlined text-blue-600 text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 text-center mb-1">
          Setujui Tahun Ajaran?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-5">
          <span className="font-semibold text-gray-700">{item.tahun}</span> akan
          disetujui. Data tidak bisa diedit setelah ini. Aktifkan TA setelah
          approve.
        </p>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Catatan{" "}
            <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan untuk wakasek / operator..."
            rows={3}
            maxLength={500}
            className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={approveMut.isPending}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={approveMut.isPending}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {approveMut.isPending ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Menyetujui...
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                Ya, Setujui
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Modal Reject ──────────────────────────────────────────────────────────────
function ModalReject({ item, onClose }) {
  const [catatan, setCatatan] = useState("");
  const rejectMut = useRejectTahunAjaran();
  const valid = catatan.trim().length > 0;

  const handleSubmit = () => {
    if (!valid) return;
    rejectMut.mutate(
      { ulid: item.ulid, catatan: catatan.trim() },
      { onSuccess: onClose },
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <span
            className="material-symbols-outlined text-red-500 text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            cancel
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 text-center mb-1">
          Tolak & Kembalikan?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-5">
          <span className="font-semibold text-gray-700">{item.tahun}</span> akan
          dikembalikan ke Draft. Wakasek perlu memperbaiki dan submit ulang.
        </p>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Alasan Penolakan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Jelaskan apa yang perlu diperbaiki..."
            rows={3}
            maxLength={500}
            className={`w-full resize-none border rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 outline-none transition ${
              !valid && catatan.length > 0
                ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                : "border-gray-200 focus:ring-red-200 focus:border-red-400"
            }`}
          />
          {!valid && catatan.length > 0 && (
            <p className="text-[11px] text-red-500 mt-1">Alasan wajib diisi.</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={rejectMut.isPending}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rejectMut.isPending || !valid}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {rejectMut.isPending ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Menolak...
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  cancel
                </span>
                Ya, Tolak
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Modal Aktifkan ────────────────────────────────────────────────────────────
function ModalAktifkan({ item, onClose }) {
  const aktifkanMut = useAktifkanTahunAjaran();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
          <span
            className="material-symbols-outlined text-green-600 text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 text-center mb-1">
          Aktifkan Tahun Ajaran?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-2">
          <span className="font-semibold text-gray-700">{item.tahun}</span> akan
          dijadikan tahun ajaran aktif. Semester Ganjil otomatis aktif.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
          <p className="text-xs text-amber-700 flex items-start gap-1.5">
            <span className="material-symbols-outlined text-sm text-amber-500 shrink-0 mt-0.5">
              warning
            </span>
            TA lain yang sedang <strong>Aktif</strong> akan otomatis berstatus{" "}
            <strong>Selesai</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={aktifkanMut.isPending}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() =>
              aktifkanMut.mutate(item.ulid, { onSuccess: onClose })
            }
            disabled={aktifkanMut.isPending}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {aktifkanMut.isPending ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Mengaktifkan...
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                Ya, Aktifkan
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Kartu TA ──────────────────────────────────────────────────────────────────
function KartuTahunAjaran({ ta, onApprove, onReject, onAktifkan }) {
  const status = getWorkflowStatus(ta);
  const cfg = TA_STATUS_CONFIG[status] ?? TA_STATUS_CONFIG.draft;
  const tglMulai = getTglMulai(ta);
  const tglSelesai = getTglSelesai(ta);

  const showApprove = status === TA_STATUS.UNDER_REVIEW;
  const showReject = status === TA_STATUS.UNDER_REVIEW;
  const showAktifkan = status === TA_STATUS.APPROVED;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition hover:shadow-md ${
        status === TA_STATUS.ACTIVE
          ? "border-green-200 ring-1 ring-green-100"
          : status === TA_STATUS.UNDER_REVIEW
            ? "border-amber-200 ring-1 ring-amber-100"
            : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-800">{ta.tahun}</h3>
            <StatusBadge status={status} />
          </div>
          {tglMulai && (
            <p className="text-xs text-gray-400">
              {fmt(tglMulai)} — {fmt(tglSelesai)}
            </p>
          )}
        </div>
        {/* Icon status besar */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}
        >
          <span
            className={`material-symbols-outlined text-xl ${cfg.color}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {cfg.icon}
          </span>
        </div>
      </div>

      {/* Semester */}
      <div className="px-5 pb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Semester
        </p>
        <SemesterPills semesters={ta.semesters} />
      </div>

      {/* Catatan review (jika ada) */}
      {ta.catatan_review && (
        <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Catatan Review
          </p>
          <p className="text-xs text-amber-800">{ta.catatan_review}</p>
        </div>
      )}

      {/* Info approval */}
      {ta.approved_by && ta.approved_at && (
        <div className="mx-5 mb-4 flex items-center gap-2 text-xs text-gray-400">
          <span className="material-symbols-outlined text-sm text-green-500">
            verified
          </span>
          Disetujui {fmt(ta.approved_at)}
        </div>
      )}

      {/* Action buttons */}
      {(showApprove || showReject || showAktifkan) && (
        <div
          className={`px-5 pb-5 flex gap-2 ${showApprove && showReject ? "flex-row" : ""}`}
        >
          {showReject && (
            <button
              type="button"
              onClick={() => onReject(ta)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cancel
              </span>
              Tolak
            </button>
          )}
          {showApprove && (
            <button
              type="button"
              onClick={() => onApprove(ta)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              Setujui
            </button>
          )}
          {showAktifkan && (
            <button
              type="button"
              onClick={() => onAktifkan(ta)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              Aktifkan
            </button>
          )}
        </div>
      )}

      {/* Status info kalau tidak ada aksi */}
      {!showApprove && !showReject && !showAktifkan && (
        <div className="px-5 pb-4">
          <p className="text-[11px] text-gray-400 italic">
            {status === TA_STATUS.DRAFT &&
              "Menunggu wakasek submit untuk review."}
            {status === TA_STATUS.ACTIVE && "Tahun ajaran sedang berjalan."}
            {status === TA_STATUS.COMPLETED && "Tahun ajaran sudah selesai."}
            {status === TA_STATUS.ARCHIVED && "Tahun ajaran diarsipkan."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TahunAjaranKepsek() {
  const { data, isLoading, isError } = useTahunAjaranList();
  const list = data?.data ?? [];

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [aktifkanModal, setAktifkanModal] = useState(null);

  // Group TA berdasarkan urgensi untuk kepsek
  const needsAction = list.filter((t) => {
    const s = getWorkflowStatus(t);
    return s === TA_STATUS.UNDER_REVIEW || s === TA_STATUS.APPROVED;
  });
  const others = list.filter((t) => {
    const s = getWorkflowStatus(t);
    return s !== TA_STATUS.UNDER_REVIEW && s !== TA_STATUS.APPROVED;
  });

  // Hitung statistik cepat
  const activeTA = list.find((t) => getWorkflowStatus(t) === TA_STATUS.ACTIVE);
  const pendingCount = list.filter(
    (t) => getWorkflowStatus(t) === TA_STATUS.UNDER_REVIEW,
  ).length;
  const approvedCount = list.filter(
    (t) => getWorkflowStatus(t) === TA_STATUS.APPROVED,
  ).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-400 mb-2">
            error
          </span>
          <p className="text-gray-500">Gagal memuat data tahun ajaran.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Tahun Ajaran & Semester
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review dan setujui tahun ajaran yang diajukan wakasek.
        </p>
      </div>

      {/* Statistik singkat */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="material-symbols-outlined text-green-500 text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              TA Aktif
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {activeTA?.tahun ?? "—"}
          </p>
          {activeTA && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Semester aktif:{" "}
              {activeTA.semesters?.find((s) => s.is_active)?.nama ?? "—"}
            </p>
          )}
        </div>

        <div
          className={`bg-white rounded-2xl border p-4 shadow-sm ${pendingCount > 0 ? "border-amber-300 ring-1 ring-amber-100" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`material-symbols-outlined text-lg ${pendingCount > 0 ? "text-amber-500" : "text-gray-400"}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pending
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Menunggu Review
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-gray-800"}`}
          >
            {pendingCount}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Perlu ditinjau kepsek
          </p>
        </div>

        <div
          className={`bg-white rounded-2xl border p-4 shadow-sm ${approvedCount > 0 ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`material-symbols-outlined text-lg ${approvedCount > 0 ? "text-blue-500" : "text-gray-400"}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Disetujui
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${approvedCount > 0 ? "text-blue-600" : "text-gray-800"}`}
          >
            {approvedCount}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Siap diaktifkan</p>
        </div>
      </div>

      {/* Butuh Aksi Kepsek */}
      {needsAction.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-500">
              notifications_active
            </span>
            <h2 className="text-base font-bold text-gray-700">
              Butuh Tindakan
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {needsAction.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {needsAction.map((ta) => (
              <KartuTahunAjaran
                key={ta.ulid}
                ta={ta}
                onApprove={setApproveModal}
                onReject={setRejectModal}
                onAktifkan={setAktifkanModal}
              />
            ))}
          </div>
        </div>
      )}

      {/* TA lainnya */}
      {others.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-4">
            Semua Tahun Ajaran
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {others.map((ta) => (
              <KartuTahunAjaran
                key={ta.ulid}
                ta={ta}
                onApprove={setApproveModal}
                onReject={setRejectModal}
                onAktifkan={setAktifkanModal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
            calendar_today
          </span>
          <p className="text-gray-500 font-medium">Belum ada tahun ajaran</p>
          <p className="text-sm text-gray-400 mt-1">
            Operator perlu membuat draft tahun ajaran terlebih dahulu.
          </p>
        </div>
      )}

      {/* Modals */}
      {approveModal && (
        <ModalApprove
          item={approveModal}
          onClose={() => setApproveModal(null)}
        />
      )}
      {rejectModal && (
        <ModalReject item={rejectModal} onClose={() => setRejectModal(null)} />
      )}
      {aktifkanModal && (
        <ModalAktifkan
          item={aktifkanModal}
          onClose={() => setAktifkanModal(null)}
        />
      )}
    </div>
  );
}
