export function ReportSection({
  number,
  title,
  description,
  children,
}: {
  number: number | string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-5">
      <header className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tabular-nums text-zinc-400">
          {String(number).padStart(2, "0")}
        </span>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          {title}
        </h2>
      </header>
      {description && (
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}
