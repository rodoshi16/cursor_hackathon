import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Inbox,
  ScanLine,
  Volume2,
} from "lucide-react";

const previewEmails = [
  {
    company: "Google",
    provider: "Gmail",
    subject: "Your application was received",
    body: "Thank you for applying. We received your application and will be in touch.",
    status: "Ignored",
    accent: "text-zinc-500",
    bg: "bg-zinc-50/60 border-zinc-200",
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
    note: "Generic application confirmation",
  },
  {
    company: "Shopify",
    provider: "Gmail",
    subject: "Final interview invitation for Software Developer Intern",
    body: "…final interview… prepare a 10-minute project showcase … implementation decisions, challenges, and technical tradeoffs. Held on Google Meet.",
    status: "Added to calendar",
    accent: "text-accent-700",
    bg: "bg-white border-accent-200/70 ring-1 ring-accent-100",
    badge: "bg-accent-50 text-accent-800 border-accent-200",
    dot: "bg-accent-500",
    note: "Friday, May 29, 2026 · 2:00 PM",
  },
  {
    company: "Wealthsimple",
    provider: "Outlook",
    subject: "Next steps for Product Engineering Intern",
    body: "…would like to schedule a recruiter screen. Please send over your availability for next week.",
    status: "Needs review",
    accent: "text-amber-700",
    bg: "bg-white border-amber-200/80",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    note: "Asked for availability — no exact time",
  },
];

const workflow = [
  { Icon: Inbox, label: "Inbox noise" },
  { Icon: ScanLine, label: "Interview detected" },
  { Icon: Calendar, label: "Calendar event" },
  { Icon: CheckCircle2, label: "Evidence-based report" },
  { Icon: Volume2, label: "Voice briefing" },
];

export function ProductPreview() {
  return (
    <div className="surface mt-12 overflow-hidden">
      <div className="border-b border-zinc-100 bg-zinc-50/60 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-zinc-300" />
          <span className="inline-flex h-2 w-2 rounded-full bg-zinc-300" />
          <span className="inline-flex h-2 w-2 rounded-full bg-zinc-300" />
          <span className="ml-2 font-mono">interviewradar.app / dashboard</span>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {workflow.map(({ Icon, label }, idx) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-zinc-400" />
                <span>{label}</span>
                {idx < workflow.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-zinc-300" />
                )}
              </span>
            ))}
          </div>

          <div className="mt-4 space-y-2.5">
            {previewEmails.map((e) => (
              <div
                key={e.company}
                className={`rounded-lg border p-3 ${e.bg}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="truncate font-medium text-zinc-900">
                        {e.company}
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span>{e.provider}</span>
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium text-zinc-900">
                      {e.subject}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                      {e.body}
                    </div>
                  </div>
                  <span
                    className={`chip ${e.badge} whitespace-nowrap`}
                  >
                    <span className={`dot ${e.dot}`} />
                    {e.status}
                  </span>
                </div>
                <div className={`mt-1.5 text-[11px] ${e.accent}`}>
                  {e.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="section-title">Evidence-based report</div>
          <div className="mt-2 text-sm font-semibold text-zinc-900">
            Shopify · Final Interview / Project Showcase
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            Friday, May 29, 2026 · 2:00 PM
          </div>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Evidence from the email
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              "final interview",
              "prepare a 10-minute project showcase",
              "discuss your implementation decisions",
              "challenges",
              "technical tradeoffs",
            ].map((p) => (
              <span
                key={p}
                className="chip border-zinc-200 bg-white font-mono text-[11px] text-zinc-700"
              >
                <span className="dot bg-accent-500" />
                &ldquo;{p}&rdquo;
              </span>
            ))}
          </div>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            What to prepare
          </div>
          <ul className="mt-1.5 space-y-1 text-sm text-zinc-700">
            <li>• Prepare a 10-minute project showcase.</li>
            <li>• Walk through your implementation decisions.</li>
            <li>• Prepare to explain technical tradeoffs.</li>
          </ul>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
            Needs clarification
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-zinc-700">
            <li>• Exact total interview duration is not specified.</li>
            <li>• The email does not say whether there will be live coding.</li>
          </ul>

          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700">
            <Volume2 className="h-3.5 w-3.5 text-accent-700" />
            <span>Listening to evidence-based briefing…</span>
            <span className="inline-flex items-center gap-0.5">
              <span className="dot bg-accent-500 animate-pulseDot" />
              <span
                className="dot bg-accent-500 animate-pulseDot"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="dot bg-accent-500 animate-pulseDot"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
