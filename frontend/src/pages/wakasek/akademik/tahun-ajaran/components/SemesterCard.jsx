import { fmt } from "../utils/tahunAjaranHelpers";

/**
 * SemesterCard — kartu semester di daftar Tahun Ajaran.
 *
 * Perubahan P2:
 * - Badge sekarang berdasarkan semester.status (enum dari backend: upcoming/active/closed/archived)
 *   bukan is_active boolean. is_active tetap sebagai fallback backward-compat.
 * - Tombol "Aktifkan" hanya muncul kalau canSemesterActivate=true (permission terpisah dari canManage).
 * - onAktifkan sekarang dikirim semester.ulid, bukan {taId, semesterNama}.
 */
export default function SemesterCard({
  semester,
  nama,
  nomor,
  taId,
  taStatus, // status TA: "AKTIF" | "SELESAI" | "AKAN DATANG" | "MENUNGGU REVIEW" | "DISETUJUI"
  canSemesterActivate, // boolean — permission master_data.semester.activate
  onAktifkan, // () => void — dipanggil dengan semester.ulid
  onDetail,
  onBuat,
}) {
  const belumDibuat = !semester;

  // Gunakan status enum dari backend; fallback ke is_active untuk backward-compat
  const semesterStatus =
    semester?.status ?? (semester?.is_active ? "active" : "upcoming");
  const isAktif = semesterStatus === "active";
  const isClosed = semesterStatus === "closed";
  const isArchived = semesterStatus === "archived";

  const getBadge = () => {
    if (isAktif)
      return { label: "AKTIF", className: "bg-success/15 text-success" };
    if (isClosed)
      return {
        label: "SELESAI",
        className: "bg-surface-container text-text-secondary",
      };
    if (isArchived)
      return {
        label: "DIARSIPKAN",
        className: "bg-surface-container text-text-tertiary",
      };
    if (taStatus === "SELESAI" || taStatus === "DIARSIPKAN") {
      return {
        label: "SELESAI",
        className: "bg-surface-container text-text-secondary",
      };
    }
    if (taStatus === "AKAN DATANG") {
      return {
        label: "MENUNGGU",
        className: "bg-surface-container text-text-secondary",
      };
    }
    // TA AKTIF tapi semester ini belum aktif
    return {
      label: "STANDBY",
      className: "bg-surface-container text-text-secondary",
    };
  };

  const badge = getBadge();

  // Tombol aktifkan: hanya saat TA aktif, semester belum aktif/closed, dan punya permission
  const showAktifkan =
    taStatus === "AKTIF" &&
    !isAktif &&
    !isArchived &&
    canSemesterActivate &&
    !belumDibuat;

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
        isAktif
          ? "bg-success/5 border-success/20"
          : isArchived
            ? "bg-surface-container-lowest border-border-light opacity-60"
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
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${badge.className}`}
              >
                {badge.label}
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
            {showAktifkan && (
              <button
                onClick={() => onAktifkan(semester.ulid)}
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
