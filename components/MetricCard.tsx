type MetricTone = "default" | "green" | "blue" | "orange";

const TONE_CLASS: Record<MetricTone, string> = {
  default: "text-zinc-900",
  green: "text-emerald-600",
  blue: "text-sky-600",
  orange: "text-amber-600",
};

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: MetricTone;
}) {
  return (
    <div className="surface px-4 py-3.5">
      <div className="section-title">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${TONE_CLASS[tone]}`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}
