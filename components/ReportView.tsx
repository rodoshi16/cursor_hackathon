"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Headphones,
  Link2,
  Loader2,
  Slash,
  Volume2,
  X,
} from "lucide-react";
import type { DecisionReport, DecisionOutcome } from "@/types/report";
import { EvidenceChip } from "./EvidenceChip";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/utils";

function ProviderBadge({ provider }: { provider: "google" | "microsoft" }) {
  const label = provider === "google" ? "Gmail" : "Outlook";
  const cls =
    provider === "google"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-sky-200 bg-sky-50 text-sky-700";
  return <span className={`chip ${cls}`}>{label}</span>;
}

const SUBTITLE: Record<DecisionOutcome, string> = {
  added_to_calendar: "Turned into a calendar event + evidence-based prep plan.",
  needs_review: "Looks interview-related, but missing a confirmed date or time.",
  ignored: "Classified as application-confirmation noise.",
  error: "Something went wrong while processing this email.",
};

const WHY_HEADING: Record<DecisionOutcome, string> = {
  added_to_calendar: "Why this was added to your calendar",
  needs_review: "Why this needs review",
  ignored: "Why this was ignored",
  error: "Why this errored",
};

function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface p-5 ${className}`}>
      {title && (
        <header>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
          )}
        </header>
      )}
      <div className={title ? "mt-3" : undefined}>{children}</div>
    </section>
  );
}

export function ReportView({ report }: { report: DecisionReport }) {
  const [audioState, setAudioState] = useState<
    "idle" | "loading" | "playing" | "error"
  >("idle");
  const [scriptFallback, setScriptFallback] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    setScriptFallback(null);
    setAudioState("idle");
    setShowEmail(false);
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id]);

  async function handleListen() {
    setScriptFallback(null);
    setAudioState("loading");
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });
      const ct = res.headers.get("Content-Type") || "";
      if (ct.includes("audio/mpeg")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        setAudioEl(a);
        a.play();
        setAudioState("playing");
        a.onended = () => setAudioState("idle");
      } else {
        const data = await res.json();
        setScriptFallback(data.script || data.error || "No script available.");
        setAudioState("idle");
      }
    } catch {
      setAudioState("error");
    }
  }

  function stopAudio() {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    setAudioState("idle");
  }

  const hasPrep = report.whatToPrepare.length > 0;
  const hasUnknowns = report.unknowns.length > 0;
  const hasFollowUps = report.suggestedFollowUpQuestions.length > 0;
  const showPrepSection =
    hasPrep ||
    report.outcome === "added_to_calendar" ||
    report.outcome === "needs_review";

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.08em] text-zinc-500">
            Decision Report
          </span>
          <div className="flex items-center gap-2">
            <ProviderBadge provider={report.provider} />
            <StatusBadge status={report.outcome} />
            <span className="chip border-zinc-200 bg-zinc-50 text-zinc-600">
              {Math.round(report.confidence * 100)}%
            </span>
          </div>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {report.company || "Unknown sender"}
          {report.role ? (
            <span className="text-zinc-500"> · {report.role}</span>
          ) : null}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600">
          {SUBTITLE[report.outcome]}
        </p>
        {(report.startDateTime ||
          report.meetingLink ||
          report.calendarEventUrl) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-600">
            {report.startDateTime && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {formatDateTime(report.startDateTime)}
              </span>
            )}
            {report.meetingLink && (
              <span className="inline-flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-zinc-500" />
                <span className="max-w-md truncate">{report.meetingLink}</span>
              </span>
            )}
            {report.calendarEventUrl && (
              <a
                href={report.calendarEventUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-accent-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Calendar event
              </a>
            )}
          </div>
        )}
      </header>

      {/* The big "Because → So we" card */}
      <Card title={WHY_HEADING[report.outcome]}>
        <p className="text-sm text-zinc-800">{report.decision.summary}</p>

        {report.decision.evidence.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-700">
                Because the email says
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {report.decision.evidence.slice(0, 6).map((e) => (
                <EvidenceChip key={e} text={e} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-500">
          <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-700">
            So we
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {report.decision.actionsTaken.map((a) => (
            <li
              key={a.label}
              className="flex items-start gap-2 text-sm text-zinc-800"
            >
              <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3 w-3" />
              </span>
              <span>{a.label}</span>
            </li>
          ))}
        </ul>

        {report.decision.actionsNotTaken.length > 0 && (
          <details className="mt-4 group">
            <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              What we did <span className="underline">not</span> do (and why)
            </summary>
            <ul className="mt-2 space-y-1.5 pl-5">
              {report.decision.actionsNotTaken.map((a) => (
                <li
                  key={a.label}
                  className="flex items-start gap-2 text-sm text-zinc-600"
                >
                  <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                    <X className="h-3 w-3" />
                  </span>
                  <div>
                    <div className="text-zinc-800">{a.label}</div>
                    <div className="text-xs text-zinc-500">{a.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      {/* Prep plan — only when interview-like */}
      {showPrepSection && (
        <Card
          title="Prep plan"
          subtitle="Evidence-based. Each item ties back to an exact phrase from the email."
        >
          {hasPrep ? (
            <ul className="space-y-2">
              {report.whatToPrepare.map((item, idx) => (
                <li
                  key={`${item.item}-${idx}`}
                  className="rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <div className="text-sm font-medium text-zinc-900">
                    {item.item}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    from{" "}
                    <span className="font-mono text-zinc-700">
                      &ldquo;{item.evidence}&rdquo;
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">
              No prep plan — the email did not include preparation
              instructions or interview format details.
            </p>
          )}
        </Card>
      )}

      {/* Still unclear + next steps — combined */}
      {(hasUnknowns ||
        hasFollowUps ||
        report.decision.nextSteps.length > 0) && (
        <Card
          title={
            report.outcome === "ignored"
              ? "What to do next"
              : "Still unclear & what to do next"
          }
        >
          {hasUnknowns && (
            <div>
              <div className="section-title">What&apos;s missing</div>
              <ul className="mt-1.5 space-y-1">
                {report.unknowns.slice(0, 5).map((u) => (
                  <li
                    key={u}
                    className="flex items-start gap-2 text-sm text-zinc-800"
                  >
                    <span className="mt-2 dot bg-amber-500" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.decision.nextSteps.length > 0 && (
            <div className={hasUnknowns ? "mt-4" : undefined}>
              <div className="section-title">Next steps</div>
              <ul className="mt-1.5 space-y-1">
                {report.decision.nextSteps.slice(0, 4).map((s) => (
                  <li
                    key={s}
                    className="flex items-start gap-2 text-sm text-zinc-800"
                  >
                    <span className="mt-2 dot bg-accent-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasFollowUps && (
            <details className="mt-4 group">
              <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                Follow-up questions to send the recruiter (
                {report.suggestedFollowUpQuestions.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-5 text-sm text-zinc-800">
                {report.suggestedFollowUpQuestions.map((q) => (
                  <li key={q} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-zinc-400">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}

      {/* Voice + source email — compact footer */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={audioState === "playing" ? stopAudio : handleListen}
            disabled={audioState === "loading"}
            className="btn-accent"
          >
            {audioState === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : audioState === "playing" ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <Headphones className="h-3.5 w-3.5" />
            )}
            {audioState === "loading"
              ? "Loading…"
              : audioState === "playing"
              ? "Stop briefing"
              : "Listen to decision briefing"}
          </button>
          <button
            type="button"
            onClick={() => setShowEmail((v) => !v)}
            className="btn-ghost"
            aria-expanded={showEmail}
          >
            {showEmail ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showEmail ? "Hide source email" : "Show source email"}
          </button>
        </div>
        {scriptFallback && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
            <div className="mb-1 font-semibold">
              ElevenLabs credentials missing — script that would be spoken:
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">
              {scriptFallback}
            </p>
          </div>
        )}
        {showEmail && (
          <div className="mt-3 rounded-lg border-l-2 border-zinc-300 bg-zinc-50/70 p-3">
            <div className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-800">Subject:</span>{" "}
              {report.emailSubject}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {report.sourceEmailBody ||
                report.emailSnippet ||
                "(No body available.)"}
            </p>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
        {report.outcome === "ignored" ? (
          <span className="chip border-zinc-200 bg-zinc-50 text-zinc-600">
            <Slash className="h-3 w-3" /> Ignored
          </span>
        ) : null}
        <span className="line-clamp-1">{report.confidenceExplanation}</span>
      </div>
    </div>
  );
}
