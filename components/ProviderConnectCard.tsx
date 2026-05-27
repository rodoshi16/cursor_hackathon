"use client";

import Link from "next/link";
import { Mail, Plug } from "lucide-react";

export function ProviderConnectCard({
  provider,
  connected,
  email,
  onScan,
  scanning,
}: {
  provider: "google" | "microsoft";
  connected: boolean;
  email?: string;
  onScan: () => void;
  scanning?: boolean;
}) {
  const label = provider === "google" ? "Gmail" : "Outlook";
  const accentBar =
    provider === "google" ? "bg-rose-400" : "bg-sky-500";

  return (
    <div className="surface relative overflow-hidden p-4">
      <div className={`absolute left-0 top-0 h-full w-[3px] ${accentBar}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-zinc-500" />
            <div className="text-sm font-semibold text-zinc-900">
              {label}
            </div>
            <span
              className={`chip ${
                connected
                  ? "border-accent-200 bg-accent-50 text-accent-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            >
              <span
                className={`dot ${
                  connected ? "bg-accent-500" : "bg-zinc-400"
                }`}
              />
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {connected
              ? email || `${label} account ready`
              : `Connect ${label} to scan real recruiter emails`}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!connected && (
            <Link
              href={`/api/auth/${provider}`}
              className="btn-secondary"
              title={`Connect ${label}`}
            >
              <Plug className="h-3.5 w-3.5" />
              Connect
            </Link>
          )}
          <button
            type="button"
            onClick={onScan}
            disabled={scanning}
            className="btn-primary"
          >
            {scanning ? "Scanning…" : `Scan ${label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
