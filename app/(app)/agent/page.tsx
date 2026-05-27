"use client";

import Link from "next/link";
import { Headphones, ScanLine, ScrollText } from "lucide-react";
import { InterviewVoiceAgent } from "@/components/InterviewVoiceAgent";

export default function AgentPage() {
  return (
    <main className="container-page space-y-5 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Voice agent
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            A calm ElevenLabs voice that scans your inbox, summarizes upcoming
            interviews, and reads evidence-based prep reports out loud.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="btn-secondary">
            <ScanLine className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link href="/reports" className="btn-secondary">
            <ScrollText className="h-3.5 w-3.5" />
            Prep report
          </Link>
        </div>
      </header>

      <InterviewVoiceAgent />

      <section className="surface p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-100">
            <Headphones className="h-4 w-4 text-zinc-600" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
              How the agent stays evidence-based
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-600">
              The agent will not claim an interview exists unless InterviewRadar
              actually found one in your inbox. It will not create a calendar
              event unless the email has a clear date and time. It only
              summarizes preparation items that are directly supported by the
              recruiter email — never invented advice.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
            <div className="section-title">Tools the agent can call</div>
            <ul className="mt-2 space-y-1 text-xs text-zinc-700">
              <li>
                <code className="font-mono text-[11px] text-zinc-800">
                  POST /api/tools/scan-inbox
                </code>{" "}
                — scan Gmail/Outlook for interview emails.
              </li>
              <li>
                <code className="font-mono text-[11px] text-zinc-800">
                  GET /api/tools/upcoming-interviews
                </code>{" "}
                — list confirmed interviews.
              </li>
              <li>
                <code className="font-mono text-[11px] text-zinc-800">
                  GET /api/tools/latest-report
                </code>{" "}
                — pull the most recent prep report.
              </li>
              <li>
                <code className="font-mono text-[11px] text-zinc-800">
                  GET /api/tools/report-summary?reportId=…
                </code>{" "}
                — fetch an evidence-based summary.
              </li>
              <li>
                <code className="font-mono text-[11px] text-zinc-800">
                  POST /api/tools/create-calendar-event
                </code>{" "}
                — only if date/time are confirmed.
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
            <div className="section-title">Briefing format</div>
            <ul className="mt-2 space-y-1 text-xs text-zinc-700">
              <li>&ldquo;Based on the email, here is what we know…&rdquo;</li>
              <li>&ldquo;The email specifically mentions…&rdquo;</li>
              <li>&ldquo;What you should prepare is…&rdquo;</li>
              <li>&ldquo;What is unclear is…&rdquo;</li>
              <li>&ldquo;Here are useful follow-up questions…&rdquo;</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
