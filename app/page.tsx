import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Filter,
  Headphones,
  Inbox,
  LogIn,
  ShieldCheck,
  Sparkle,
} from "lucide-react";
import { ProductPreview } from "@/components/ProductPreview";
import { isAuth0Configured } from "@/lib/auth0-config";

const FEATURES = [
  {
    Icon: Inbox,
    title: "Works with Gmail and Outlook",
    body: "Connect either provider in seconds. InterviewRadar reads recent recruiter mail across both inboxes.",
  },
  {
    Icon: Filter,
    title: "Filters application-confirmation noise",
    body: "Generic 'we received your application' messages get ignored automatically so you only see the real signals.",
  },
  {
    Icon: Calendar,
    title: "Adds confirmed interviews to your calendar",
    body: "Only emails with a clear date and time get added — to Google Calendar or Outlook Calendar.",
  },
  {
    Icon: ShieldCheck,
    title: "Creates evidence-based prep reports",
    body: "Every prep item is tied to a phrase from the original email. Nothing invented, nothing stretched.",
  },
  {
    Icon: Headphones,
    title: "Reads briefings through ElevenLabs",
    body: "Listen to a calm voice walk you through what the recruiter actually asked for.",
  },
  {
    Icon: Sparkle,
    title: "Flags missing details before calendar creation",
    body: "If a recruiter doesn't include a time, the email lands in Needs Review — not in your calendar.",
  },
];

export default function LandingPage() {
  const authReady = isAuth0Configured();
  const primaryHref = authReady
    ? "/api/auth/login?returnTo=/connect"
    : "/connect";
  const primaryLabel = authReady ? "Sign in" : "Get started";
  return (
    <main className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-zinc-900 text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              InterviewRadar
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-ghost hidden sm:inline-flex">
              View demo
            </Link>
            <a href={primaryHref} className="btn-primary">
              <LogIn className="h-4 w-4" />
              {primaryLabel}
            </a>
          </div>
        </div>
      </nav>

      <section className="container-page pt-16 pb-10 sm:pt-24">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
              <span className="dot bg-accent-500" />
              Voice-first interview assistant
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              Never miss the interview email buried in your inbox.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-zinc-600 sm:text-lg">
              InterviewRadar connects to Gmail or Outlook, finds real recruiter
              emails, filters out application-confirmation noise, adds confirmed
              interviews to your calendar, and creates evidence-based prep
              reports you can listen to.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <a href={primaryHref} className="btn-primary">
                <LogIn className="h-4 w-4" />
                {primaryLabel}
              </a>
              <Link href="/dashboard" className="btn-ghost">
                View demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {!authReady && (
              <p className="mt-3 text-xs text-zinc-500">
                Auth0 isn&apos;t configured yet — the &ldquo;Open app&rdquo;
                button takes you straight into the demo. Add your Auth0 keys
                to <span className="font-mono">.env.local</span> to require
                sign-in.
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="dot bg-zinc-400" />
                Gmail + Outlook
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="dot bg-zinc-400" />
                Google Calendar + Outlook Calendar
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="dot bg-zinc-400" />
                Evidence-based prep
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="dot bg-zinc-400" />
                ElevenLabs voice briefings
              </span>
            </div>
          </div>

          <aside className="surface p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-700" />
              <span className="font-semibold text-zinc-800">
                The core rule
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              InterviewRadar does not hallucinate prep advice. It only creates
              reports from the recruiter email and clearly labels anything
              unknown.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-start gap-2 text-zinc-700">
                <span className="dot mt-2 bg-accent-500" />
                If the email says &ldquo;project showcase,&rdquo; the report
                helps you prepare that — not LeetCode.
              </li>
              <li className="flex items-start gap-2 text-zinc-700">
                <span className="dot mt-2 bg-accent-500" />
                If the email says &ldquo;recruiter screen,&rdquo; the report
                covers resume walkthrough and availability — nothing else.
              </li>
              <li className="flex items-start gap-2 text-zinc-700">
                <span className="dot mt-2 bg-accent-500" />
                Missing details are clearly listed under{" "}
                <span className="font-medium">Needs Clarification</span>.
              </li>
            </ul>
          </aside>
        </div>

        <ProductPreview />
      </section>

      <section className="container-page py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="section-title">The promise</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
              Prep reports without guesswork.
            </h2>
            <p className="mt-4 text-base text-zinc-600">
              InterviewRadar only recommends preparation backed by the original
              email. If the recruiter email says &ldquo;project showcase,&rdquo;
              your report helps you prepare that. If details are missing, they
              are clearly listed under Needs Clarification.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="surface p-4">
                <Icon className="h-4 w-4 text-zinc-500" />
                <div className="mt-3 text-sm font-semibold text-zinc-900">
                  {title}
                </div>
                <p className="mt-1 text-sm text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200/70 bg-white">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <span>
            InterviewRadar · Built for the hackathon · In-memory MVP
          </span>
          <Link href="/dashboard" className="text-zinc-700 hover:text-zinc-900">
            Open dashboard →
          </Link>
        </div>
      </footer>
    </main>
  );
}
