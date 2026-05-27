"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HelpCircle, Inbox, ListFilter, RefreshCw, Search, ScrollText } from "lucide-react";
import { DashboardSummaryCards } from "@/components/DashboardSummaryCards";
import { DecisionExplanationModal } from "@/components/DecisionExplanationModal";
import { InterviewCard } from "@/components/InterviewCard";
import { ProviderConnectCard } from "@/components/ProviderConnectCard";
import type { InterviewEmail } from "@/types/interview";
import { useScan } from "@/lib/use-ensure-scan";

export default function DashboardPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { scan, scanning, runScan } = useScan(true);

  const groups = useMemo(() => {
    const results = scan?.results || [];
    return {
      added: results.filter((r) => r.status === "added_to_calendar"),
      needs: results.filter((r) => r.status === "needs_review"),
      ignored: results.filter((r) => r.status === "ignored"),
    };
  }, [scan]);

  return (
    <main className="container-page space-y-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Inbox triage
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Real recruiter emails added to your calendar. Confirmation noise
            ignored. Evidence-based prep generated only from what the emails
            say.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
            <Search className="h-3.5 w-3.5" />
            <span>
              Last scan:{" "}
              {scan
                ? `${scan.scannedCount} emails reviewed`
                : "no scan yet"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => runScan("all")}
            disabled={!!scanning}
            className="btn-primary"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                scanning === "all" ? "animate-spin" : ""
              }`}
            />
            {scanning === "all" ? "Scanning…" : "Scan All"}
          </button>
        </div>
      </header>

      <DashboardSummaryCards scan={scan} />

      <section className="grid gap-3 sm:grid-cols-2">
        <ProviderConnectCard
          provider="google"
          connected
          email={demoMode ? "you@example.com (demo)" : undefined}
          onScan={() => runScan("google")}
          scanning={scanning === "google"}
        />
        <ProviderConnectCard
          provider="microsoft"
          connected={demoMode}
          email={demoMode ? "you@outlook.com (demo)" : undefined}
          onScan={() => runScan("microsoft")}
          scanning={scanning === "microsoft"}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Added to calendar"
          count={groups.added.length}
          description="High confidence interview emails with a clear date and time."
        />
        {groups.added.length === 0 ? (
          <EmptyState
            label={
              scanning
                ? "Scanning…"
                : "Nothing here yet. Run Scan All to fetch demo emails."
            }
          />
        ) : (
          <div className="space-y-3">
            {groups.added.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Needs review"
          count={groups.needs.length}
          description="Interview-like emails missing a clear date or time. Confirm and add manually."
        />
        {groups.needs.length === 0 ? (
          <EmptyState label="No emails currently need review." />
        ) : (
          <div className="space-y-3">
            {groups.needs.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Ignored"
          count={groups.ignored.length}
          description="Generic application confirmations and rejection messages filtered out automatically."
        />
        {groups.ignored.length === 0 ? (
          <EmptyState label="Nothing ignored yet." />
        ) : (
          <div className="space-y-3">
            {groups.ignored.map((interview) => (
              <IgnoredCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  description,
  count,
}: {
  title: string;
  description: string;
  count: number;
}) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <ListFilter className="h-3.5 w-3.5 text-zinc-500" />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            {title}
          </h2>
          <span className="chip border-zinc-200 bg-zinc-50 text-zinc-600">
            {count}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
    </header>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="surface-subtle flex items-center gap-2 px-3 py-3 text-xs text-zinc-500">
      <Inbox className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function IgnoredCard({ interview }: { interview: InterviewEmail }) {
  const [whyOpen, setWhyOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/60 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-700">
            {interview.subject}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {interview.company || interview.from || "Unknown sender"} ·{" "}
            {interview.provider === "google" ? "Gmail" : "Outlook"}
          </div>
        </div>
        <span className="chip border-zinc-200 bg-zinc-50 text-zinc-500">
          Ignored
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{interview.reason}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setWhyOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <HelpCircle className="h-3 w-3" />
          Why was this ignored?
        </button>
        {interview.reportId && (
          <Link
            href={`/reports/${interview.reportId}`}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            <ScrollText className="h-3 w-3" />
            View Decision Report
          </Link>
        )}
      </div>
      <DecisionExplanationModal
        reportId={interview.reportId}
        fallbackTitle={interview.subject}
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
      />
    </div>
  );
}
