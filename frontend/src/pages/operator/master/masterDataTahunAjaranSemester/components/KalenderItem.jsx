import { fmtShort } from "../utils/tahunAjaranHelpers";

const COLOR_MAP = {
  libur: "bg-[#ba1a1a]",
  pts: "bg-[#006e2a]",
  pas: "bg-[#eaa300]",
  ph: "bg-[#006e2a]",
  kegiatan: "bg-[#3f4945]",
};

export default function KalenderItem({ item }) {
  const jenis = item.jenis?.toLowerCase();
  const isUpcoming =
    item.tanggal_mulai && new Date(item.tanggal_mulai) > new Date();
  const dotColor = COLOR_MAP[jenis] ?? "bg-[#bfc9c4]";
  const labelColor =
    jenis === "libur"
      ? "text-[#ba1a1a] bg-[#ba1a1a]/10"
      : jenis === "pts" || jenis === "pas"
        ? "text-[#006e2a] bg-[#006e2a]/10"
        : "text-[#3f4945]/60 bg-[#eceeed]";

  return (
    <div className="group/item relative flex gap-5 pl-1 hover:bg-[#f8faf9] hover:translate-x-1 p-2 -ml-2 rounded-xl transition-all duration-300">
      <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-xl bg-white/80 border border-[#bfc9c4]/20 flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
        <span
          className={`w-2.5 h-2.5 rounded-full ${dotColor} ${isUpcoming ? "animate-pulse" : ""}`}
        />
      </div>
      <div className="flex flex-col gap-1 justify-center">
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full w-fit ${labelColor}`}
        >
          {fmtShort(item.tanggal_mulai)}
          {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai
            ? ` – ${fmtShort(item.tanggal_selesai)}`
            : ""}
        </span>
        <h4 className="text-sm font-bold text-[#00342b]">{item.judul}</h4>
        {item.is_nasional && (
          <span className="text-[10px] text-[#ba1a1a] font-bold uppercase">
            Nasional
          </span>
        )}
      </div>
    </div>
  );
}
