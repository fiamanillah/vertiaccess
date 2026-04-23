interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
}

export function MetricCard({ label, value, color }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    emerald: "text-[#15803D]",
    red: "text-red-600",
    amber: "text-amber-700",
    blue: "text-blue-600",
    default: "text-slate-800",
  };

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
      <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`text-[28px] font-black tracking-tight ${colorClasses[color || "default"]}`}
      >
        {value}
      </p>
    </div>
  );
}
