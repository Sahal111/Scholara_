import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, BookOpen, Layers } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import DataField from "@/components/ui/DataField";
import { useImplementasiKurikulum } from "@/hooks/api/useKurikulum";
import ImplementasiStatusBadge from "./components/ImplementasiStatusBadge";
import ImplementasiWorkflowPanel from "./components/ImplementasiWorkflowPanel";
import {
  IMPLEMENTASI_LANGKAH,
  IMPLEMENTASI_STATUS,
} from "./implementasiStatus";

function fmtWaktu(str) {
  if (!str) return null;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

/** Stepper horizontal: langkah yang sudah dicapai diberi warna. */
function Stepper({ status }) {
  const idxSekarang = IMPLEMENTASI_LANGKAH.indexOf(status);

  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {IMPLEMENTASI_LANGKAH.map((langkah, i) => {
        const tercapai = i <= idxSekarang;
        const sekarang = i === idxSekarang;
        return (
          <li key={langkah} className="flex items-center gap-2 shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                sekarang
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : tercapai
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-400 border-gray-200"
              }`}
            >
              {IMPLEMENTASI_STATUS[langkah].label}
            </span>
            {i < IMPLEMENTASI_LANGKAH.length - 1 && (
              <span
                className={`w-6 h-px ${i < idxSekarang ? "bg-emerald-300" : "bg-gray-200"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Halaman detail implementasi kurikulum + workflow persetujuan.
 * Dipakai wakasek (ajukan review, selesaikan) dan kepsek (setujui, tolak, aktifkan).
 *
 * Route: .../kurikulum/implementasi/:ulid
 */
export default function DetailImplementasiKurikulum() {
  const { ulid } = useParams();
  const navigate = useNavigate();
  const { data: res, isLoading, isError, error } = useImplementasiKurikulum(ulid);

  const impl = res?.data;

  const kembali = (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
    >
      <ArrowLeft size={16} /> Kembali
    </button>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {kembali}
        <p className="text-sm text-gray-500">Memuat implementasi kurikulum...</p>
      </div>
    );
  }

  if (isError || !impl) {
    const notFound = error?.response?.status === 404;
    return (
      <div className="p-6 space-y-4">
        {kembali}
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>
            {notFound
              ? "Implementasi kurikulum tidak ditemukan."
              : (error?.response?.data?.message ??
                "Gagal memuat implementasi kurikulum.")}
          </span>
        </div>
      </div>
    );
  }

  const tingkat = Array.isArray(impl.tingkat_kelas) ? impl.tingkat_kelas : [];
  const waktu = [
    ["Diajukan review", impl.reviewed_at],
    ["Disetujui", impl.approved_at],
    ["Diaktifkan", impl.activated_at],
    ["Diselesaikan", impl.completed_at],
  ].filter(([, v]) => fmtWaktu(v));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {kembali}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-700" />
            {impl.kurikulum?.nama ?? "Implementasi Kurikulum"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {[impl.kurikulum?.kode, impl.tahun_ajaran?.tahun]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <ImplementasiStatusBadge status={impl.status} />
      </header>

      <SectionCard
        title="Status & Persetujuan"
        description="Alur: Draft → Menunggu Review → Disetujui → Aktif → Selesai"
      >
        <div className="space-y-5">
          <Stepper status={impl.status} />

          {impl.catatan_review && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                impl.status === "draft"
                  ? "border-red-100 bg-red-50 text-red-700"
                  : "border-gray-100 bg-gray-50 text-gray-600"
              }`}
            >
              <p className="font-medium mb-0.5">
                {impl.status === "draft"
                  ? "Catatan penolakan"
                  : "Catatan kepala sekolah"}
              </p>
              <p>{impl.catatan_review}</p>
            </div>
          )}

          <ImplementasiWorkflowPanel impl={impl} />
        </div>
      </SectionCard>

      <SectionCard title="Informasi" icon={Layers}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DataField
            label="Tingkat"
            value={
              tingkat.length > 0
                ? tingkat.map((t) => `Kelas ${t}`).join(", ")
                : "Semua tingkat"
            }
          />
          <DataField
            label="Jumlah baris struktur"
            value={impl.jumlah_struktur ?? "-"}
          />
          {waktu.map(([label, v]) => (
            <DataField key={label} label={label} value={fmtWaktu(v)} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
