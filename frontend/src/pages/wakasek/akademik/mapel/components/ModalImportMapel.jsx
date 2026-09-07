import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, X, Download } from "lucide-react";
import Modal from "../../../../../components/ui/Modal";
import toast from "react-hot-toast";
import {
  useImportMapel,
  downloadTemplateMapel,
} from "../../../../../hooks/api/useMapel";

/**
 * ModalImportMapel — dialog upload file Excel untuk import mata pelajaran.
 *
 * Props:
 *   isOpen:  boolean
 *   onClose: () => void
 */
export default function ModalImportMapel({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [downloadingTpl, setDlTpl] = useState(false);
  const fileInputRef = useRef(null);

  const importMapel = useImportMapel();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Validasi tipe file
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowed.includes(f.type) && !f.name.endsWith(".xlsx")) {
      toast.error("Hanya file .xlsx yang diizinkan.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".xlsx")) {
      toast.error("Hanya file .xlsx yang diizinkan.");
      return;
    }
    setFile(f);
    // Sync ke input hidden
    const dt = new DataTransfer();
    dt.items.add(f);
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  };

  const handleUpload = () => {
    if (!file) return;
    importMapel.mutate(file, {
      onSuccess: () => {
        setFile(null);
        onClose();
      },
    });
  };

  const handleDownloadTemplate = async () => {
    setDlTpl(true);
    try {
      await downloadTemplateMapel();
    } finally {
      setDlTpl(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Mata Pelajaran"
      size="md"
    >
      <div className="p-6 space-y-5">
        {/* Panduan */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800 space-y-1.5">
          <p className="font-semibold">Panduan Import</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Gunakan template resmi yang disediakan.</li>
            <li>
              Kolom <strong>tingkat</strong>: isi angka kelas dipisah koma
              (contoh: <code>7,8,9</code>), atau tulis <strong>Semua</strong>.
            </li>
            <li>
              Kolom <strong>kelompok</strong>: harus sesuai pilihan yang
              tersedia (A - Wajib, B - Wajib, dll).
            </li>
            <li>
              Data akan diproses di latar belakang. Refresh halaman beberapa
              saat setelah upload.
            </li>
          </ul>
        </div>

        {/* Download Template */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={downloadingTpl}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            border border-dashed border-emerald-600 text-emerald-700 text-sm font-medium
            hover:bg-emerald-50 transition-colors disabled:opacity-60"
        >
          {downloadingTpl ? (
            <span className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          ) : (
            <Download size={15} />
          )}
          {downloadingTpl ? "Mengunduh…" : "Unduh Template Excel"}
        </button>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-3 p-8
            rounded-xl border-2 border-dashed border-surface-container
            hover:border-emerald-600/50 hover:bg-emerald-50/30 cursor-pointer transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 w-full">
                <FileSpreadsheet
                  size={28}
                  className="text-emerald-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <X size={14} className="text-emerald-700" />
                </button>
              </div>
              <p className="text-xs text-text-secondary">
                Klik untuk ganti file
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                <UploadCloud size={24} className="text-text-secondary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-on-surface">
                  Klik atau seret file ke sini
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Format: .xlsx — Maks. 5 MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-container">
        <button
          type="button"
          onClick={handleClose}
          disabled={importMapel.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-surface-container
            text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || importMapel.isPending}
          className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-800
            text-white transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {importMapel.isPending && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {importMapel.isPending ? "Mengirim…" : "Upload & Proses"}
        </button>
      </div>
    </Modal>
  );
}
