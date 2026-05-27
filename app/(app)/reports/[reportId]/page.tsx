"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ReportView } from "@/components/ReportView";
import type { InterviewReport } from "@/types/report";

type Props = {
  params: { reportId: string };
};

export default function ReportDetailPage({ params }: Props) {
  const reportId = params.reportId;
  const [report, setReport] = useState<InterviewReport | null | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/tools/report-summary?reportId=${encodeURIComponent(reportId)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.ok && data.report) {
          setReport(data.report);
          return;
        }
      } catch {
        // fall through
      }
      // Demo fallback: scan, then fetch latest.
      if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        try {
          await fetch("/api/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: "all" }),
          });
          const latestRes = await fetch("/api/tools/latest-report");
          const latest = await latestRes.json();
          if (!cancelled) setReport(latest.report || null);
        } catch {
          if (!cancelled) setReport(null);
        }
      } else if (!cancelled) {
        setReport(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (report === undefined) {
    return (
      <main className="container-page py-16">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading decision report…
        </div>
      </main>
    );
  }

  if (report === null) {
    return (
      <main className="container-page py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Decision report not found
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          We couldn&apos;t find this decision report. Try scanning your inbox
          from the{" "}
          <Link href="/dashboard" className="text-accent-700 underline">
            dashboard
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="container-page space-y-3 py-6">
      <div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All decisions
        </Link>
      </div>
      <ReportView report={report} />
    </main>
  );
}
