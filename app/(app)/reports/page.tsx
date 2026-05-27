"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileWarning, Loader2, ScanLine } from "lucide-react";
import { ReportView } from "@/components/ReportView";
import type { InterviewReport } from "@/types/report";
import { useScan } from "@/lib/use-ensure-scan";
import { formatDateTime } from "@/lib/utils";

export default function ReportsPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { scan, scanning, runScan } = useScan(true);
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const ids = (scan?.results || [])
        .filter((r) => r.reportId)
        .map((r) => r.reportId!);
      if (ids.length === 0) {
        // Fall back to latest report
        try {
          const res = await fetch("/api/tools/latest-report");
          const data = await res.json();
          if (!cancelled) {
            if (data.report) {
              setReports([data.report]);
              setActiveId(data.report.id);
            } else {
              setReports([]);
              setActiveId(null);
            }
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setLoading(false);
          }
        }
        return;
      }
      try {
        const fetched = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(
              `/api/tools/report-summary?reportId=${encodeURIComponent(id)}`
            );
            const data = await res.json();
            return data.report as InterviewReport | undefined;
          })
        );
        const valid = fetched.filter(Boolean) as InterviewReport[];
        if (!cancelled) {
          setReports(valid);
          setActiveId((prev) => prev || valid[0]?.id || null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [scan]);

  const activeReport = useMemo(
    () => reports.find((r) => r.id === activeId) || reports[0] || null,
    [reports, activeId]
  );

  if (loading && !activeReport) {
    return (
      <main className="container-page py-16">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading evidence-based prep reports…
        </div>
      </main>
    );
  }

  if (!activeReport) {
    return (
      <main className="container-page py-12">
        <div className="surface mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-md bg-zinc-100">
            <FileWarning className="h-5 w-5 text-zinc-500" />
          </div>
          <h1 className="mt-3 text-lg font-semibold tracking-tight">
            No prep reports yet
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Reports are generated automatically when InterviewRadar finds an
            interview email. Try running a scan from the dashboard.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => runScan("all")}
              disabled={!!scanning}
            >
              <ScanLine className="h-3.5 w-3.5" />
              {scanning ? "Scanning…" : demoMode ? "Run demo scan" : "Scan inboxes"}
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Open dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-page py-6">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Prep reports
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Every report is built only from phrases in the recruiter email.
            Switch between reports below.
          </p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-1.5">
          <div className="section-title px-1">
            All reports ({reports.length})
          </div>
          {reports.map((r) => {
            const active = r.id === activeReport.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-zinc-900 bg-white shadow-soft"
                    : "border-zinc-200 bg-white/60 hover:border-zinc-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-semibold text-zinc-900">
                    {r.company || "Unknown"}
                  </div>
                  <span
                    className={`chip ${
                      r.provider === "google"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-sky-200 bg-sky-50 text-sky-700"
                    }`}
                  >
                    {r.provider === "google" ? "Gmail" : "Outlook"}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-zinc-500">
                  {r.role || r.emailSubject}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {r.startDateTime ? formatDateTime(r.startDateTime) : "No date"}
                </div>
              </button>
            );
          })}
          <div className="pt-2">
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => runScan("all")}
              disabled={!!scanning}
            >
              <ScanLine className="h-3.5 w-3.5" />
              {scanning ? "Scanning…" : "Re-scan inboxes"}
            </button>
          </div>
        </aside>

        <div>
          <ReportView report={activeReport} />
        </div>
      </div>
    </main>
  );
}
