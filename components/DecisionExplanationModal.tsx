"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  ScrollText,
  ShieldCheck,
  X,
} from "lucide-react";
import type { DecisionReport } from "@/types/report";
import { StatusBadge } from "./StatusBadge";
import { EvidenceChip } from "./EvidenceChip";

export function DecisionExplanationModal({
  reportId,
  fallbackTitle,
  open,
  onClose,
}: {
  reportId?: string;
  fallbackTitle?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [report, setReport] = useState<DecisionReport | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (!open || !reportId) return;
    let cancelled = false;
    setReport(undefined);
    (async () => {
      try {
        const res = await fetch(
          `/api/tools/report-summary?reportId=${encodeURIComponent(reportId)}`
        );
        const data = await res.json();
        if (cancelled) return;
        setReport(data.ok && data.report ? data.report : null);
      } catch {
        if (!cancelled) setReport(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reportId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="surface w-full max-w-xl overflow-hidden rounded-t-2xl border-zinc-200 shadow-card sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-700" />
            Decision explanation
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin p-4">
          {report === undefined && (
            <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading decision…
            </div>
          )}

          {report === null && (
            <div className="py-6 text-sm text-zinc-600">
              We couldn&apos;t load the decision report.
              {fallbackTitle ? <> ({fallbackTitle})</> : null}
            </div>
          )}

          {report && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={report.outcome} />
                  <span className="text-xs text-zinc-500">
                    {Math.round(report.confidence * 100)}% confidence
                  </span>
                </div>
                <h2 className="mt-2 text-base font-semibold tracking-tight text-zinc-900">
                  {report.company || "Unknown sender"}
                  {report.role ? (
                    <span className="text-zinc-500"> · {report.role}</span>
                  ) : null}
                </h2>
                <p className="mt-1 text-sm text-zinc-700">
                  {report.decision.summary}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {report.decision.why}
                </p>
              </div>

              {report.decision.evidence.length > 0 && (
                <section>
                  <div className="section-title">Evidence found</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {report.decision.evidence.slice(0, 6).map((e) => (
                      <EvidenceChip key={e} text={e} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="section-title">Actions taken</div>
                <ul className="mt-1.5 space-y-1">
                  {report.decision.actionsTaken.map((a) => (
                    <li
                      key={a.label}
                      className="flex items-start gap-2 text-sm text-zinc-800"
                    >
                      <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-3 w-3" />
                      </span>
                      {a.label}
                    </li>
                  ))}
                </ul>
              </section>

              {report.decision.actionsNotTaken.length > 0 && (
                <section>
                  <div className="section-title">Actions not taken</div>
                  <ul className="mt-1.5 space-y-1">
                    {report.decision.actionsNotTaken.map((a) => (
                      <li
                        key={a.label}
                        className="flex items-start gap-2 text-sm text-zinc-600"
                      >
                        <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                          <X className="h-3 w-3" />
                        </span>
                        {a.label}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {report.decision.nextSteps.length > 0 && (
                <section>
                  <div className="section-title">Next step</div>
                  <ul className="mt-1.5 space-y-1 text-sm text-zinc-800">
                    {report.decision.nextSteps.slice(0, 3).map((s) => (
                      <li key={s} className="flex items-start gap-2">
                        <span className="mt-2 dot bg-accent-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 p-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            Close
          </button>
          {report && (
            <Link
              href={`/reports/${report.id}`}
              className="btn-primary"
              onClick={onClose}
            >
              <ScrollText className="h-3.5 w-3.5" />
              View full Decision Report
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
}
