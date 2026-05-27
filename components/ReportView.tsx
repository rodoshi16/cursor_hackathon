"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Headphones,
  Link2,
  Loader2,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import type { InterviewReport } from "@/types/report";
import { EvidenceChip } from "./EvidenceChip";
import { ReportSection } from "./ReportSection";
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

export function ReportView({ report }: { report: InterviewReport }) {
  const [audioState, setAudioState] = useState<
    "idle" | "loading" | "playing" | "error"
  >("idle");
  const [scriptFallback, setScriptFallback] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    setScriptFallback(null);
    setAudioState("idle");
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

  return (
    <div className="space-y-5">
      <header className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-700" />
            Evidence-Based Prep Report
          </div>
          <div className="flex items-center gap-2">
            <ProviderBadge provider={report.provider} />
            <span className="chip border-zinc-200 bg-zinc-50 text-zinc-600">
              Confidence{" "}
              <span className="font-semibold text-zinc-800">
                {Math.round(report.confidence * 100)}%
              </span>
            </span>
          </div>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {report.company || "Unknown company"}
          {report.role ? (
            <span className="text-zinc-500"> · {report.role}</span>
          ) : null}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          This report is based only on details found in the email. Anything
          unclear is listed under{" "}
          <span className="font-medium text-zinc-800">
            Needs Clarification
          </span>
          .
        </p>
        <div className="mt-3 text-xs text-zinc-500">
          Source email subject:{" "}
          <span className="text-zinc-700">{report.emailSubject}</span>
        </div>
      </header>

      <ReportSection number={1} title="Interview details">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {report.confirmedDetails.length === 0 ? (
            <dd className="text-zinc-500">
              No confirmed details could be extracted from the email.
            </dd>
          ) : (
            report.confirmedDetails.map((d) => (
              <div
                key={d.label}
                className="flex items-start justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-b-0"
              >
                <dt className="text-zinc-500">{d.label}</dt>
                <dd className="text-right text-zinc-800">{d.value}</dd>
              </div>
            ))
          )}
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-600">
          {report.startDateTime ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              {formatDateTime(report.startDateTime)}
              {report.timezone && (
                <span className="text-zinc-400"> · {report.timezone}</span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <Calendar className="h-3.5 w-3.5" />
              No exact date or time in the email
            </span>
          )}
          {report.meetingLink && (
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-zinc-500" />
              <span className="max-w-md truncate">{report.meetingLink}</span>
            </span>
          )}
        </div>
      </ReportSection>

      <ReportSection
        number={2}
        title="Evidence found"
        description="Exact phrases pulled from the email that informed this report."
      >
        {report.evidenceFound.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No specific evidence phrases were found in this email.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {report.evidenceFound.map((e) => (
              <EvidenceChip key={e} text={e} />
            ))}
          </div>
        )}
      </ReportSection>

      <ReportSection
        number={3}
        title="What to prepare"
        description="Each item is tied to a phrase from the email. Nothing invented."
      >
        {report.whatToPrepare.length === 0 ? (
          <p className="text-sm text-zinc-700">
            The email does not include enough detail to create a specific
            prep plan. The safest next step is to confirm the interview
            format and whether anything should be prepared.
          </p>
        ) : (
          <ul className="space-y-3">
            {report.whatToPrepare.map((item, idx) => (
              <li
                key={`${item.item}-${idx}`}
                className="rounded-lg border border-zinc-200 bg-white p-3"
              >
                <div className="text-sm font-medium text-zinc-900">
                  {item.item}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Based on:{" "}
                  <span className="font-mono text-zinc-700">
                    &ldquo;{item.evidence}&rdquo;
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection
        number={4}
        title="Unknowns / Needs Clarification"
        description="Details the email did not include. Confirm these with the recruiter."
      >
        {report.unknowns.length === 0 ? (
          <p className="text-sm text-zinc-500">
            The email covers the essentials — nothing flagged as unclear.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {report.unknowns.map((u) => (
              <li
                key={u}
                className="flex items-start gap-2 text-sm text-zinc-800"
              >
                <span className="dot mt-2 bg-amber-500" />
                {u}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection
        number={5}
        title="Suggested follow-up questions"
        description="Send these to the recruiter to fill in the gaps."
      >
        {report.suggestedFollowUpQuestions.length === 0 ? (
          <p className="text-sm text-zinc-500">No follow-ups suggested.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-zinc-800">
            {report.suggestedFollowUpQuestions.map((q) => (
              <li key={q} className="flex items-start gap-2">
                <span className="font-mono text-xs text-zinc-400">?</span>
                {q}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection
        number={6}
        title="Source email"
        description="The original recruiter message this report is based on."
      >
        <div className="rounded-lg border-l-2 border-zinc-300 bg-zinc-50/70 p-3">
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
      </ReportSection>

      <ReportSection
        number={7}
        title="Voice briefing"
        description="Listen to an evidence-based read of this report."
      >
        <div className="flex flex-wrap items-center gap-2">
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
              : "Listen to evidence-based briefing"}
          </button>
          {audioState === "playing" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-accent-700">
              <span className="dot bg-accent-500 animate-pulseDot" />
              <span
                className="dot bg-accent-500 animate-pulseDot"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="dot bg-accent-500 animate-pulseDot"
                style={{ animationDelay: "300ms" }}
              />
              Speaking
            </span>
          )}
        </div>
        {scriptFallback && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
            <div className="mb-1 font-semibold">
              ElevenLabs credentials missing — here&apos;s the script that
              would be spoken:
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">
              {scriptFallback}
            </p>
          </div>
        )}
      </ReportSection>

      <div className="pt-2 text-xs text-zinc-500">
        <StatusBadge status="added_to_calendar" />{" "}
        {report.confidenceExplanation}
      </div>
    </div>
  );
}
