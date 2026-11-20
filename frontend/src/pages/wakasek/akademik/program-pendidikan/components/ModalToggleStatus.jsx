import { createPortal } from "react-dom";

/* ─── ModalToggleStatus ───────────────────────────────────────────────────────── */
export default function ModalToggleStatus({
  item,
  onClose,
  onConfirm,
  isPending,
}) {
  if (!item) return null;

  const akanNonaktif = item.is_active;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-sm border border-[#bfc9c4]/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center border ${
              akanNonaktif
                ? "bg-amber-50 border-amber-100"
                : "bg-[#006e2a]/10 border-[#006e2a]/20"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[28px] ${
                akanNonaktif ? "text-amber-500" : "text-[#006e2a]"
              }`}
            >
              {akanNonaktif ? "pause_circle" : "play_circle"}
            </span>
          </div>
          <div>
            <h3
              className="font-bold text-[#00342b] text-base mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              {akanNonaktif ? "Nonaktifkan Program?" : "Aktifkan Program?"}
            </h3>
            <p className="text-sm text-[#707975]">
              <span className="font-semibold text-[#00342b]">{item.nama}</span>{" "}
              {akanNonaktif
                ? "tidak akan muncul lagi di pilihan program saat menempatkan siswa. Data yang sudah ada tidak dihapus dan program bisa diaktifkan kembali."
                : "akan kembali muncul di pilihan program saat menempatkan siswa."}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-sm font-semibold text-[#3f4945] hover:bg-[#f2f4f3] transition-colors disabled:opacity-60"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-colors ${
                akanNonaktif
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-[#006e2a] hover:bg-[#004d40]"
              }`}
            >
              {isPending
                ? "Memproses..."
                : akanNonaktif
                  ? "Ya, Nonaktifkan"
                  : "Ya, Aktifkan"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
