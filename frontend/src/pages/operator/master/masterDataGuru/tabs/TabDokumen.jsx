import { useState, useRef } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../../lib/axios";
import toast from "react-hot-toast";
import { BASE_URL, useFileDownload, fmtDate } from "./helpers";

/* ── Modal Riwayat Versi Dokumen ── */
function ModalVersions({ dokumen, nuptk, baseUrl, onClose }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["guru-dokumen-versions", dokumen.id],
    queryFn: () =>
      api
        .get(
          `/operator/master-data/guru/${nuptk}/dokumen/${dokumen.id}/versions`,
        )
        .then((r) => r.data.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Riwayat Versi</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {dokumen.nama_dokumen}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Memuat...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Belum ada riwayat versi.
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-primary">
                      v{v.versi}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {v.original_filename ?? `Versi ${v.versi}`}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {v.uploader?.name ?? "—"} ·{" "}
                      {new Date(v.created_at).toLocaleDateString("id-ID")}
                      {v.catatan && (
                        <>
                          {" "}
                          · <em>{v.catatan}</em>
                        </>
                      )}
                    </p>
                  </div>
                  <a
                    href={`${baseUrl}/storage/${v.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    title="Buka file versi ini"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      open_in_new
                    </span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modal Audit Log Dokumen ── */
function ModalAuditLog({ dokumen, nuptk, onClose }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["guru-dokumen-logs", dokumen.id],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/dokumen/${dokumen.id}/logs`)
        .then((r) => r.data.data),
  });

  const aksiIcon = {
    upload: { icon: "upload", cls: "text-blue-500 bg-blue-50" },
    replace: { icon: "sync", cls: "text-amber-500 bg-amber-50" },
    download: { icon: "download", cls: "text-gray-500 bg-gray-100" },
    preview: { icon: "visibility", cls: "text-gray-500 bg-gray-100" },
    approve: { icon: "check_circle", cls: "text-emerald-500 bg-emerald-50" },
    reject: { icon: "cancel", cls: "text-red-500 bg-red-50" },
    revisi: { icon: "edit_note", cls: "text-amber-600 bg-amber-50" },
    delete: { icon: "delete", cls: "text-red-400 bg-red-50" },
    restore: { icon: "restore", cls: "text-gray-500 bg-gray-100" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Audit Log</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {dokumen.nama_dokumen}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Memuat...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Belum ada aktivitas.
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const cfg = aksiIcon[log.aksi] ?? {
                  icon: "info",
                  cls: "text-gray-400 bg-gray-100",
                };
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.cls}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {cfg.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-xs font-semibold text-gray-800 capitalize">
                        {log.aksi}
                      </p>
                      {log.keterangan && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {log.keterangan}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {log.user?.name ?? "—"} ·{" "}
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * TabDokumen — Tab 5: Manajemen Dokumen Guru
 */
export default function TabDokumen({ nuptk, guru }) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("master_data.guru.create");
  const canUpdate = hasPermission("master_data.guru.update");
  const canDelete = hasPermission("master_data.guru.delete");
  const queryClient = useQueryClient();
  const [modalUpload, setModalUpload] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [modalVersions, setModalVersions] = useState(null);
  const [modalLogs, setModalLogs] = useState(null);
  const [modalReject, setModalReject] = useState(null);
  const [modalPreview, setModalPreview] = useState(null);
  const fileRef = useRef();

  const approveDokumen = useMutation({
    mutationFn: (id) =>
      api.patch(`/operator/master-data/guru/${nuptk}/dokumen/${id}/approve`),
    onSuccess: () => {
      toast.success("Dokumen disetujui.");
      queryClient.invalidateQueries(["guru-dokumen", nuptk]);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal approve."),
  });

  const rejectDokumen = useMutation({
    mutationFn: ({ id, alasan }) =>
      api.patch(`/operator/master-data/guru/${nuptk}/dokumen/${id}/reject`, {
        alasan,
      }),
    onSuccess: () => {
      toast.success("Dokumen ditolak.");
      queryClient.invalidateQueries(["guru-dokumen", nuptk]);
      setModalReject(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal reject."),
  });

  const { data: dokumenResponse, isLoading } = useQuery({
    queryKey: ["guru-dokumen", nuptk],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/dokumen`)
        .then((r) => r.data),
  });

  const dokumens = dokumenResponse?.data ?? [];
  const statistik = dokumenResponse?.statistik ?? {
    total: 0,
    disetujui: 0,
    menunggu: 0,
    ditolak: 0,
    persen: 0,
  };
  const checklist = dokumenResponse?.checklist ?? [];

  const deleteDokumen = useMutation({
    mutationFn: (id) =>
      api.delete(`/operator/master-data/guru/${nuptk}/dokumen/${id}`),
    onSuccess: () => {
      toast.success("Dokumen dihapus.");
      queryClient.invalidateQueries(["guru-dokumen", nuptk]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menghapus."),
  });

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-section-title text-section-title text-text-primary">
              Dokumen Guru
            </h3>
            <p className="text-sm text-text-secondary">
              Kelola berkas identitas, ijazah, SK, dan sertifikat
            </p>
          </div>
          <button
            onClick={() => setModalUpload(true)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              upload_file
            </span>{" "}
            Upload Dokumen
          </button>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-surface-container-low rounded-xl">
            <p className="text-xs text-text-secondary">Total Dokumen</p>
            <p className="text-lg font-bold text-text-primary">
              {statistik.total}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-xl">
            <p className="text-xs text-green-700">Disetujui</p>
            <p className="text-lg font-bold text-green-700">
              {statistik.disetujui}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-700">Menunggu Verifikasi</p>
            <p className="text-lg font-bold text-amber-700">
              {statistik.menunggu}
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl">
            <p className="text-xs text-red-700">Ditolak / Revisi</p>
            <p className="text-lg font-bold text-red-700">
              {statistik.ditolak}
            </p>
          </div>
        </div>
      </div>

      {/* Dokumen List */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        {isLoading ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Memuat dokumen...
          </p>
        ) : dokumens.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Belum ada dokumen yang diupload.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dokumens.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-border-light bg-surface-container-low/30 hover:bg-surface-container-low transition-colors space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase">
                      {d.kategori}
                    </span>
                    <h4 className="font-semibold text-text-primary text-sm">
                      {d.nama_dokumen}
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      d.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : d.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {d.status === "approved"
                      ? "Disetujui"
                      : d.status === "rejected"
                        ? "Ditolak"
                        : "Menunggu"}
                  </span>
                </div>
                {d.file_path && (
                  <p className="text-xs text-text-secondary truncate">
                    File: {d.original_filename ?? d.file_path}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-border-light">
                  {d.file_path && (
                    <a
                      href={`${BASE_URL}/storage/${d.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        visibility
                      </span>{" "}
                      Lihat
                    </a>
                  )}
                  <button
                    onClick={() => setModalVersions(d)}
                    className="text-xs text-text-secondary hover:text-text-primary"
                  >
                    Versi
                  </button>
                  <button
                    onClick={() => setModalLogs(d)}
                    className="text-xs text-text-secondary hover:text-text-primary"
                  >
                    Log
                  </button>
                  {d.status === "pending" && (
                    <>
                      <button
                        onClick={() => approveDokumen.mutate(d.id)}
                        className="text-xs text-green-600 font-semibold hover:underline ml-auto"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setModalReject(d)}
                        className="text-xs text-red-600 font-semibold hover:underline"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      confirm("Hapus dokumen ini?") &&
                      deleteDokumen.mutate(d.id)
                    }
                    className="text-xs text-red-500 hover:underline ml-auto"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalVersions && (
        <ModalVersions
          dokumen={modalVersions}
          nuptk={nuptk}
          baseUrl={BASE_URL}
          onClose={() => setModalVersions(null)}
        />
      )}
      {modalLogs && (
        <ModalAuditLog
          dokumen={modalLogs}
          nuptk={nuptk}
          onClose={() => setModalLogs(null)}
        />
      )}
    </div>
  );
}
