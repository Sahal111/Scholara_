import { useState } from "react";
import { CheckCircle, CheckCircle2, FileText, Lock, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Confirm from "@/components/ui/Confirm";
import {
  useAjukanReviewImplementasi,
  useSetujuiImplementasi,
  useTolakImplementasi,
  useAktifkanImplementasi,
  useSelesaikanImplementasi,
} from "@/hooks/api/useKurikulum";
import { PETUNJUK_STATUS } from "../implementasiStatus";

const BTN = {
  primary: "bg-emerald-700 hover:bg-emerald-800 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  neutral: "bg-gray-700 hover:bg-gray-800 text-white",
};

/**
 * Konfigurasi tiap aksi workflow.
 * Kunci sama dengan nilai `aksi_tersedia` dari backend.
 */
const AKSI = {
  ajukan_review: {
    label: "Ajukan Review",
    icon: FileText,
    tone: "primary",
    confirm: {
      title: "Ajukan untuk review?",
      message:
        "Struktur akan dikunci dan dikirim ke kepala sekolah untuk direview.",
      confirmLabel: "Ya, Ajukan",
      variant: "info",
    },
  },
  setujui: {
    label: "Setujui",
    icon: CheckCircle2,
    tone: "primary",
    confirm: {
      title: "Setujui struktur kurikulum?",
      message: "Struktur ini akan berstatus Disetujui dan siap diaktifkan.",
      confirmLabel: "Ya, Setujui",
      variant: "info",
    },
  },
  tolak: {
    label: "Tolak",
    icon: X,
    tone: "danger",
    // memakai modal catatan, bukan Confirm
  },
  aktifkan: {
    label: "Aktifkan",
    icon: CheckCircle,
    tone: "primary",
    confirm: {
      title: "Aktifkan kurikulum ini?",
      message:
        "Kurikulum akan berlaku untuk tingkat yang terdaftar. Tidak boleh ada kurikulum aktif lain di tingkat yang sama.",
      confirmLabel: "Ya, Aktifkan",
      variant: "warning",
    },
  },
  selesaikan: {
    label: "Selesaikan",
    icon: Lock,
    tone: "neutral",
    confirm: {
      title: "Selesaikan kurikulum ini?",
      message: "Status berubah menjadi Selesai dan tidak bisa diubah lagi.",
      confirmLabel: "Ya, Selesaikan",
      variant: "warning",
    },
  },
};

/**
 * Panel tombol workflow implementasi kurikulum.
 *
 * Tombol yang tampil MENGIKUTI `impl.aksi_tersedia` dari backend, yang sudah
 * memperhitungkan status saat ini dan permission user — jadi tidak ada
 * pengecekan role di sini.
 *
 * Props:
 *   impl: objek dari GET /kurikulum/implementasi/{ulid}
 */
export default function ImplementasiWorkflowPanel({ impl }) {
  const [aksiAktif, setAksiAktif] = useState(null);
  const [catatan, setCatatan] = useState("");

  const mutasi = {
    ajukan_review: useAjukanReviewImplementasi(),
    setujui: useSetujuiImplementasi(),
    tolak: useTolakImplementasi(),
    aktifkan: useAktifkanImplementasi(),
    selesaikan: useSelesaikanImplementasi(),
  };

  const aksiTersedia = (impl.aksi_tersedia ?? []).filter((a) => AKSI[a]);
  const sedangProses = aksiAktif ? mutasi[aksiAktif].isPending : false;

  const tutup = () => {
    setAksiAktif(null);
    setCatatan("");
  };

  const jalankan = (body = {}) => {
    mutasi[aksiAktif].mutate({ ulid: impl.ulid, ...body }, { onSuccess: tutup });
  };

  const cfgAktif = aksiAktif ? AKSI[aksiAktif] : null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {PETUNJUK_STATUS[impl.status] ?? ""}
      </p>

      {aksiTersedia.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Tidak ada tindakan yang tersedia untuk peran kamu pada status ini.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {aksiTersedia.map((kode) => {
            const cfg = AKSI[kode];
            const Icon = cfg.icon;
            return (
              <button
                key={kode}
                type="button"
                onClick={() => setAksiAktif(kode)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${BTN[cfg.tone]}`}
              >
                <Icon size={16} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Aksi dengan konfirmasi biasa */}
      <Confirm
        isOpen={!!cfgAktif?.confirm}
        onClose={tutup}
        onConfirm={() => jalankan()}
        isLoading={sedangProses}
        title={cfgAktif?.confirm?.title}
        message={cfgAktif?.confirm?.message}
        confirmLabel={cfgAktif?.confirm?.confirmLabel}
        variant={cfgAktif?.confirm?.variant}
      />

      {/* Tolak: wajib catatan */}
      <Modal
        isOpen={aksiAktif === "tolak"}
        onClose={tutup}
        title="Tolak struktur kurikulum"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Struktur dikembalikan ke Draft. Tulis alasan supaya wakasek tahu apa
            yang perlu diperbaiki.
          </p>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Contoh: alokasi JP Matematika kelas 7 belum sesuai."
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={tutup}
              disabled={sedangProses}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => jalankan({ catatan: catatan.trim() })}
              disabled={sedangProses || catatan.trim().length === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {sedangProses ? "Memproses..." : "Tolak"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
