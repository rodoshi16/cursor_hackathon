"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";

type ConnectedAccount = {
  provider: "google" | "microsoft";
  email?: string;
  name?: string;
};

type AccountsResponse = {
  ok: boolean;
  demoMode: boolean;
  accounts: ConnectedAccount[];
};

const PROVIDERS: {
  key: "google" | "microsoft";
  label: string;
  blurb: string;
  bar: string;
  bg: string;
}[] = [
  {
    key: "google",
    label: "Gmail",
    blurb:
      "Scan recent recruiter emails in Gmail and add confirmed interviews to Google Calendar.",
    bar: "bg-rose-400",
    bg: "from-rose-50",
  },
  {
    key: "microsoft",
    label: "Outlook",
    blurb:
      "Scan recent recruiter emails in Outlook and add confirmed interviews to Outlook Calendar.",
    bar: "bg-sky-500",
    bg: "from-sky-50",
  },
];

export default function ConnectPage() {
  return (
    <Suspense
      fallback={
        <main className="container-page py-16">
          <div className="mx-auto flex max-w-md items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        </main>
      }
    >
      <ConnectInner />
    </Suspense>
  );
}

function ConnectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState<AccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const justConnected = params.get("connected") || "";
  const authError = params.get("auth_error");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d: AccountsResponse) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [justConnected]);

  useEffect(() => {
    if (authError) setError(decodeURIComponent(authError));
  }, [authError]);

  const connectedByProvider = useMemo(() => {
    const m = new Map<"google" | "microsoft", ConnectedAccount>();
    for (const a of data?.accounts || []) m.set(a.provider, a);
    return m;
  }, [data]);

  const isDemo = data?.demoMode;
  const totalConnected = connectedByProvider.size;

  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
            <Sparkles className="h-3.5 w-3.5 text-accent-700" />
            One quick step
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Connect your inboxes
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            InterviewRadar reads recent recruiter mail and adds confirmed
            interviews to your calendar. Connect Gmail, Outlook, or both — you
            can also start with the demo and connect later.
          </p>
        </header>

        {justConnected && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {justConnected === "google" ? "Gmail" : "Outlook"} connected.
            </div>
            <p className="mt-0.5 text-xs">
              {totalConnected === 2
                ? "Both inboxes are wired up. You're ready to scan."
                : "Add the other inbox below, or continue to the dashboard."}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50/70 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="surface flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking your connected accounts…
          </div>
        ) : (
          <div className="space-y-3">
            {PROVIDERS.map((p) => {
              const account = connectedByProvider.get(p.key);
              const connected = !!account;
              return (
                <article
                  key={p.key}
                  className={`surface relative overflow-hidden bg-gradient-to-br ${p.bg} via-white to-white p-5`}
                >
                  <div
                    className={`absolute left-0 top-0 h-full w-[3px] ${p.bar}`}
                  />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-zinc-500" />
                        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                          {p.label}
                        </h2>
                        {connected ? (
                          <span className="chip border-accent-200 bg-accent-50 text-accent-800">
                            <Check className="h-3 w-3" />
                            {isDemo ? "Demo connected" : "Connected"}
                          </span>
                        ) : (
                          <span className="chip border-zinc-200 bg-zinc-50 text-zinc-600">
                            <span className="dot bg-zinc-400" />
                            Not connected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">{p.blurb}</p>
                      {connected && account?.email && (
                        <div className="mt-1.5 text-xs text-zinc-500">
                          Signed in as{" "}
                          <span className="font-medium text-zinc-800">
                            {account.email}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {connected ? (
                        <button
                          type="button"
                          disabled
                          className="btn-secondary disabled:opacity-100"
                        >
                          <Check className="h-3.5 w-3.5 text-accent-700" />
                          Connected
                        </button>
                      ) : (
                        <a
                          href={`/api/auth/${p.key}`}
                          className="btn-primary"
                        >
                          Connect {p.label}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link href="/" className="btn-ghost">
            ← Back to landing
          </Link>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="btn-primary"
            disabled={loading}
          >
            {totalConnected > 0 ? "Continue to dashboard" : "Skip — try demo"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {isDemo && (
          <p className="text-center text-xs text-zinc-500">
            You&apos;re in demo mode — Gmail and Outlook are pre-filled with
            sample recruiter emails so you can see how InterviewRadar works.
          </p>
        )}
      </div>
    </main>
  );
}
