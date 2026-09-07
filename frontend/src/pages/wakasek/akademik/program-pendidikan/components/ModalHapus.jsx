import { createPortal } from "react-dom";

/* ─── ModalHapus ──────────────────────────────────────────────────────────────── */
export default function ModalHapus({ item, onClose, onConfirm, isPending }) {
  if (!item) return null;
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
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-[#ba1a1a]">
              delete_forever
            </span>
          </div>
          <div>
            <h3
              className="font-bold text-[#00342b] text-base mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              Hapus Program?
            </h3>
            <p className="text-sm text-[#707975]">
              <span className="font-semibold text-[#00342b]">{item.nama}</span>{" "}
              akan dihapus. Program tidak dapat dihapus jika masih memiliki
              kelas atau sub-program terkait.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#bfc9c4]/50 text-sm font-semibold text-[#3f4945] hover:bg-[#f2f4f3] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
