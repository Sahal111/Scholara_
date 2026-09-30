export default function MetricCard({
  label,
  value,
  icon,
  colorClass = "text-[#006e2a]",
  barWidth,
  barColor = "bg-[#006e2a]",
}) {
  return (
    <div className="p-5 bg-[#f2f4f3]/50 rounded-2xl border border-[#bfc9c4]/10 hover:border-[#006e2a]/30 transition-colors group">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] font-black text-[#3f4945]/50 uppercase tracking-[0.2em] mb-1">
            {label}
          </p>
          <p
            className={`text-2xl font-extrabold ${colorClass} group-hover:opacity-80 transition-colors font-headline-card`}
          >
            {value}
          </p>
        </div>
        <span
          className={`material-symbols-outlined ${colorClass} opacity-40 group-hover:opacity-80 transition-colors`}
        >
          {icon}
        </span>
      </div>
      {barWidth != null && (
        <div className="w-full h-1.5 bg-[#eceeed] rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}
    </div>
  );
}
