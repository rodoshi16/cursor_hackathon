export function EvidenceChip({ text }: { text: string }) {
  return (
    <span className="chip border-zinc-200 bg-white text-zinc-700">
      <span className="dot bg-accent-500" />
      <span className="font-mono text-[11px] tracking-tight text-zinc-700">
        &ldquo;{text}&rdquo;
      </span>
    </span>
  );
}
