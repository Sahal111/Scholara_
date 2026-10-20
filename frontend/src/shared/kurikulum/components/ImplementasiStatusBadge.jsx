import { getImplementasiStatus } from "../implementasiStatus";

/**
 * Badge status implementasi kurikulum.
 * Props:
 *   status: "draft" | "under_review" | "approved" | "active" | "completed"
 */
export default function ImplementasiStatusBadge({ status }) {
  const cfg = getImplementasiStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
