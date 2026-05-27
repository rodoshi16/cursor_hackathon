"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Headphones,
  HelpCircle,
  Link2,
  Loader2,
  Mail,
  ScrollText,
  Volume2,
} from "lucide-react";
import type { InterviewEmail } from "@/types/interview";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { DecisionExplanationModal } from "./DecisionExplanationModal";

function ProviderBadge({ provider }: { provider: "google" | "microsoft" }) {
  const label = provider === "google" ? "Gmail" : "Outlook";
  const cls =
    provider === "google"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-sky-200 bg-sky-50 text-sky-700";
  return <span className={`chip ${cls}`}>{label}</span>;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.85
      ? "bg-accent-600"
      : value >= 0.6
      ? "bg-amber-500"
      : "bg-zinc-400";
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-600">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums font-medium text-zinc-700">{pct}%</span>
    </div>
  );
}

export function InterviewCard({ interview }: { interview: InterviewEmail }) {
  const [audioState, setAudioState] = useState<
    "idle" | "loading" | "playing" | "error"
  >("idle");
  const [fallbackScript, setFallbackScript] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const showReason =
    interview.status === "needs_review" || interview.status === "error";

  const whyLabel =
    interview.status === "added_to_calendar"
      ? "Why was this added?"
      : interview.status === "needs_review"
      ? "Why does this need review?"
      : "Why was this ignored?";

  async function handleListen() {
    if (!interview.reportId) return;
    setFallbackScript(null);
    setAudioState("loading");
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: interview.reportId }),
      });
      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("audio/mpeg")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        setAudioEl(a);
        a.play();
        setAudioState("playing");
        a.onended = () => setAudioState("idle");
      } else {
        const data = await res.json();
        setFallbackScript(data.script || data.error || "No script available.");
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
    <article className="surface p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-900">
              {interview.company || "Unknown company"}
            </h3>
            <ProviderBadge provider={interview.provider} />
            {interview.interviewType && (
              <span className="chip border-zinc-200 bg-zinc-50 text-zinc-700">
                {interview.interviewType}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            {interview.role || interview.subject}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={interview.status} />
          <ConfidenceBar value={interview.confidence} />
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
        {interview.startDateTime ? (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            {formatDateTime(interview.startDateTime)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <Calendar className="h-3.5 w-3.5" />
            No exact time
          </span>
        )}
        {interview.meetingLink && (
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-zinc-500" />
            <span className="max-w-[16rem] truncate">
              {interview.meetingLink}
            </span>
          </span>
        )}
      </div>

      {showReason && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/70 p-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800">
            Why this needs review
          </div>
          <p className="mt-1 text-sm text-amber-900">{interview.reason}</p>
        </div>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
        <button
          type="button"
          onClick={() => setWhyOpen(true)}
          className="btn-secondary"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {whyLabel}
        </button>
        {interview.reportId && (
          <Link
            href={`/reports/${interview.reportId}`}
            className="btn-ghost"
            title="View full Decision Report"
          >
            <ScrollText className="h-3.5 w-3.5" />
            View Decision Report
          </Link>
        )}
        <button
          type="button"
          onClick={() => setEmailOpen((v) => !v)}
          className="btn-ghost"
          aria-expanded={emailOpen}
        >
          <Mail className="h-3.5 w-3.5" />
          {emailOpen ? "Hide original email" : "View original email"}
          {emailOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {interview.reportId && interview.status !== "ignored" && (
          <button
            type="button"
            onClick={audioState === "playing" ? stopAudio : handleListen}
            disabled={audioState === "loading"}
            className="btn-ghost"
          >
            {audioState === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : audioState === "playing" ? (
              <Volume2 className="h-3.5 w-3.5 text-accent-700" />
            ) : (
              <Headphones className="h-3.5 w-3.5" />
            )}
            {audioState === "playing" ? "Stop briefing" : "Listen briefing"}
          </button>
        )}
        {interview.calendarEventUrl && (
          <a
            href={interview.calendarEventUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Calendar event
          </a>
        )}
      </footer>

      {emailOpen && (
        <div className="mt-3 rounded-lg border-l-2 border-zinc-300 bg-zinc-50/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
            <div className="min-w-0">
              <span className="font-medium text-zinc-800">From:</span>{" "}
              <span className="truncate">
                {interview.from || "Unknown sender"}
              </span>
            </div>
            {interview.receivedAt && (
              <span className="text-zinc-400">
                {formatDateTime(interview.receivedAt)}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            <span className="font-medium text-zinc-800">Subject:</span>{" "}
            {interview.subject}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
            {interview.body || interview.snippet || "(No body available.)"}
          </p>
        </div>
      )}

      {fallbackScript && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
          <div className="mb-1 font-medium">
            ElevenLabs credentials missing — script preview:
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{fallbackScript}</p>
        </div>
      )}

      <DecisionExplanationModal
        reportId={interview.reportId}
        fallbackTitle={interview.subject}
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
      />
    </article>
  );
}
