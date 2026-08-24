import { fmt } from "../utils/tahunAjaranHelpers";

export default function SemesterCard({
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
      {/* Kiri */}
      <div className="flex items-center gap-3 min-w-0">
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

      {/* Kanan */}
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
