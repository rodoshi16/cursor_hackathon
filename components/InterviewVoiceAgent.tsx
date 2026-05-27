"use client";

import { Conversation } from "@elevenlabs/client";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ConversationInstance = Awaited<
  ReturnType<typeof Conversation.startSession>
>;

type AgentStatus =
  | "checking"
  | "needs_setup"
  | "ready"
  | "connecting"
  | "listening"
  | "speaking"
  | "disconnected"
  | "error";

type TokenResponse = {
  agentId: string | null;
  configured: boolean;
  signedUrl?: string | null;
  message?: string;
};

type TranscriptEntry = {
  id: string;
  role: "user" | "agent";
  text: string;
};

const STARTER_QUESTIONS = [
  "What's my next interview?",
  "What do I need to prep?",
  "Which emails need review?",
  "Why was the Google email ignored?",
];

const SYSTEM_PROMPT_TEMPLATE = `You are InterviewRadar's voice agent. You help Sarah understand and act on her recruiter emails.

Core rule (do not break): only repeat facts that exist in the data returned by your tools. Never invent interview times, formats, interviewers, prep items, or company names. If the email does not include something, say "the email doesn't mention that."

Tone: warm but concise. Speak in short, natural sentences (1-3 at a time), like a calm assistant. No lists when speaking — use "first… second… and finally…".

Use the available tools to answer:
- scan_inbox — re-scan Gmail/Outlook for recruiter emails.
- get_upcoming_interviews — list confirmed and review-needed interviews.
- get_latest_decision_report — load the most recent decision report.
- get_decision_report — fetch a specific decision report by id.

When the user asks about preparing, only mention prep items that come back from the report's "whatToPrepare" list, and include the phrase the recommendation is based on. Example: "Prepare a 10-minute project showcase, based on the phrase 'prepare a 10-minute project showcase'."

When asked why something was ignored, repeat the report's decision.summary and decision.why fields.

Always keep follow-up questions in mind so the conversation feels natural.`;

const TOOL_DEFINITIONS = [
  {
    name: "scan_inbox",
    description:
      "Scan Gmail and Outlook for recruiter emails and return a summary of the scan (scannedCount, interviewsFound, eventsCreated, needsReview, ignoredCount).",
    parameters: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          enum: ["google", "microsoft", "all"],
          description: "Which inbox to scan. Defaults to 'all'.",
        },
      },
    },
  },
  {
    name: "get_upcoming_interviews",
    description:
      "List upcoming interviews InterviewRadar has detected. Each entry includes company, role, status, date/time, meeting link, and a reportId for the full Decision Report.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_latest_decision_report",
    description:
      "Fetch the most recent Decision Report (any outcome). Contains decision.summary, decision.why, evidence, actionsTaken, actionsNotTaken, whatToPrepare, unknowns, and suggestedFollowUpQuestions.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_decision_report",
    description:
      "Fetch a specific Decision Report by id.",
    parameters: {
      type: "object",
      properties: {
        reportId: {
          type: "string",
          description: "The reportId returned by other tools.",
        },
      },
      required: ["reportId"],
    },
  },
];

function StatusPill({ status }: { status: AgentStatus }) {
  const map: Record<AgentStatus, { label: string; cls: string; dot: string }> = {
    checking: {
      label: "Checking setup…",
      cls: "bg-zinc-50 text-zinc-600 border-zinc-200",
      dot: "bg-zinc-400",
    },
    needs_setup: {
      label: "Setup required",
      cls: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
    },
    ready: {
      label: "Ready",
      cls: "bg-zinc-50 text-zinc-700 border-zinc-200",
      dot: "bg-zinc-400",
    },
    connecting: {
      label: "Connecting…",
      cls: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500 animate-pulseDot",
    },
    listening: {
      label: "Listening",
      cls: "bg-accent-50 text-accent-800 border-accent-200",
      dot: "bg-accent-500 animate-pulseDot",
    },
    speaking: {
      label: "Speaking",
      cls: "bg-accent-50 text-accent-800 border-accent-200",
      dot: "bg-accent-600 animate-pulseDot",
    },
    disconnected: {
      label: "Disconnected",
      cls: "bg-zinc-50 text-zinc-600 border-zinc-200",
      dot: "bg-zinc-400",
    },
    error: {
      label: "Error",
      cls: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    },
  };
  const m = map[status];
  return (
    <span className={`chip border ${m.cls}`}>
      <span className={`dot ${m.dot}`} />
      {m.label}
    </span>
  );
}

function Waveform({
  conversation,
  active,
}: {
  conversation: ConversationInstance | null;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!conversation || !active) {
      const c = canvasRef.current;
      if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      let data: Uint8Array;
      try {
        data =
          conversation && (conversation as any).getOutputByteFrequencyData
            ? (conversation as any).getOutputByteFrequencyData()
            : new Uint8Array(64);
      } catch {
        data = new Uint8Array(64);
      }
      // Pull input frequency too (when user is speaking).
      let input: Uint8Array;
      try {
        input =
          conversation && (conversation as any).getInputByteFrequencyData
            ? (conversation as any).getInputByteFrequencyData()
            : new Uint8Array(64);
      } catch {
        input = new Uint8Array(64);
      }

      const N = Math.min(48, data.length);
      const barWidth = rect.width / N;
      const midY = rect.height / 2;
      ctx.fillStyle = "#1d5b42";
      for (let i = 0; i < N; i++) {
        const v = Math.max(data[i] / 255, input[i] / 255);
        const h = Math.max(2, v * (rect.height * 0.8));
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        ctx.fillRect(x, midY - h / 2, w, h);
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [conversation, active]);

  return <canvas ref={canvasRef} className="h-16 w-full rounded-md" />;
}

export function InterviewVoiceAgent() {
  const [status, setStatus] = useState<AgentStatus>("checking");
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const conversationRef = useRef<ConversationInstance | null>(null);
  const transcriptIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/voice/agent-token")
      .then((r) => r.json())
      .then((t: TokenResponse) => {
        if (cancelled) return;
        setToken(t);
        setStatus(t.configured ? "ready" : "needs_setup");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("needs_setup");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      void conversationRef.current?.endSession();
    };
  }, []);

  const appendTranscript = useCallback(
    (role: "user" | "agent", text: string) => {
      const id = `t_${++transcriptIdRef.current}`;
      setTranscript((prev) => [...prev, { id, role, text }]);
    },
    []
  );

  const startConversation = useCallback(async () => {
    if (!token?.configured || !token.agentId) {
      setShowSetup(true);
      return;
    }
    setErrorMsg(null);
    setTranscript([]);
    setStatus("connecting");
    try {
      // The browser prompts for mic permission inside startSession.
      const sessionConfig: Parameters<typeof Conversation.startSession>[0] = {
        // Prefer signed URL when available (private agents).
        ...(token.signedUrl
          ? { signedUrl: token.signedUrl }
          : { agentId: token.agentId }),
        clientTools: {
          scan_inbox: async ({ provider }: { provider?: string }) => {
            const res = await fetch("/api/tools/scan-inbox", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider: provider || "all" }),
            });
            const data = await res.json();
            return JSON.stringify(data);
          },
          get_upcoming_interviews: async () => {
            const res = await fetch("/api/tools/upcoming-interviews");
            return JSON.stringify(await res.json());
          },
          get_latest_decision_report: async () => {
            const res = await fetch("/api/tools/latest-report");
            return JSON.stringify(await res.json());
          },
          get_decision_report: async ({ reportId }: { reportId: string }) => {
            const res = await fetch(
              `/api/tools/report-summary?reportId=${encodeURIComponent(
                reportId
              )}`
            );
            return JSON.stringify(await res.json());
          },
        },
        onConnect: () => setStatus("listening"),
        onDisconnect: () => setStatus("disconnected"),
        onError: (m) => {
          setErrorMsg(m);
          setStatus("error");
        },
        onModeChange: ({ mode }) => {
          if (mode === "speaking") setStatus("speaking");
          else if (mode === "listening") setStatus("listening");
        },
        onMessage: ({ message, source }) => {
          if (!message) return;
          appendTranscript(source === "ai" ? "agent" : "user", message);
        },
      };
      const conv = await Conversation.startSession(sessionConfig);
      conversationRef.current = conv;
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to start the agent."
      );
      setStatus("error");
    }
  }, [appendTranscript, token]);

  const endConversation = useCallback(async () => {
    try {
      await conversationRef.current?.endSession();
    } finally {
      conversationRef.current = null;
      setStatus(token?.configured ? "ready" : "needs_setup");
    }
  }, [token]);

  const toggleMute = useCallback(() => {
    const conv = conversationRef.current;
    if (!conv) return;
    const next = !muted;
    conv.setMicMuted(next);
    setMuted(next);
  }, [muted]);

  const sendQuickQuestion = useCallback(
    (q: string) => {
      const conv = conversationRef.current;
      if (!conv) {
        void startConversation();
        return;
      }
      conv.sendUserMessage(q);
      appendTranscript("user", q);
    },
    [appendTranscript, startConversation]
  );

  const live =
    status === "listening" || status === "speaking" || status === "connecting";

  return (
    <div className="surface overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Interview agent
            </div>
            <div className="text-[11px] text-zinc-500">
              ElevenLabs Conversational AI · grounded in your inbox.
            </div>
          </div>
        </div>
        <StatusPill status={status} />
      </header>

      <div className="px-5 py-6">
        {/* Main call surface */}
        <div className="grid place-items-center">
          <Waveform conversation={conversationRef.current} active={live} />

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {!live && status !== "needs_setup" && (
              <button
                type="button"
                onClick={startConversation}
                disabled={status === "checking"}
                className="btn-accent !px-5 !py-2.5"
              >
                <Mic className="h-4 w-4" />
                Start conversation
              </button>
            )}
            {live && (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="btn-secondary"
                >
                  {muted ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      Mute
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={endConversation}
                  className="btn-primary"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                  End call
                </button>
              </>
            )}
            {status === "needs_setup" && (
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="btn-primary"
              >
                <AlertTriangle className="h-4 w-4" />
                Configure ElevenLabs agent
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mt-4 max-w-md rounded-md border border-red-200 bg-red-50/70 p-2.5 text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          {/* Quick prompts */}
          {(status === "ready" || live) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuickQuestion(q)}
                  className="chip border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                  title={live ? "Send this to the agent" : "Start a call with this question"}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
            <div className="section-title px-1">Transcript</div>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto scrollbar-thin pr-1">
              {transcript.map((t) => (
                <div
                  key={t.id}
                  className={`flex ${
                    t.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      t.role === "user"
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 bg-white text-zinc-900"
                    }`}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 text-xs text-zinc-500 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-accent-700" />
            The agent only repeats facts from your scanned inbox. Prep advice
            is tied to phrases from the recruiter email — never invented.
          </div>
          <div className="flex items-start gap-2">
            <ScrollText className="mt-0.5 h-3.5 w-3.5 text-zinc-600" />
            Need more detail?{" "}
            <Link href="/reports" className="underline hover:text-zinc-800">
              Open the Decision Reports
            </Link>{" "}
            for the full evidence breakdown.
          </div>
        </div>
      </div>

      {showSetup && (
        <SetupOverlay
          token={token}
          onClose={() => setShowSetup(false)}
          onRetry={() => {
            setStatus("checking");
            fetch("/api/voice/agent-token")
              .then((r) => r.json())
              .then((t: TokenResponse) => {
                setToken(t);
                setStatus(t.configured ? "ready" : "needs_setup");
                if (t.configured) setShowSetup(false);
              })
              .catch(() => setStatus("needs_setup"));
          }}
        />
      )}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
      className="btn-secondary !py-1 text-xs"
    >
      <Copy className="h-3 w-3" />
      {copied ? "Copied" : label}
    </button>
  );
}

function SetupOverlay({
  token,
  onClose,
  onRetry,
}: {
  token: TokenResponse | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  const toolsJson = JSON.stringify(TOOL_DEFINITIONS, null, 2);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="surface w-full max-w-2xl overflow-hidden rounded-t-2xl border-zinc-200 shadow-card sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 p-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Connect your ElevenLabs agent
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              {token?.message ||
                "Set up a Conversational AI agent on ElevenLabs, paste the values below, then point this app at it."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !py-1 text-xs"
          >
            Close
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin px-4 py-4">
          <ol className="list-decimal space-y-4 pl-5 text-sm text-zinc-800">
            <li>
              Create a Conversational AI agent at{" "}
              <a
                href="https://elevenlabs.io/app/conversational-ai"
                target="_blank"
                rel="noreferrer"
                className="text-accent-700 underline"
              >
                elevenlabs.io/app/conversational-ai
              </a>
              .
            </li>
            <li>
              Paste this system prompt into the agent&apos;s{" "}
              <span className="font-medium">Prompt</span> field:
              <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-800">
                <div className="mb-2 flex justify-end">
                  <CopyButton text={SYSTEM_PROMPT_TEMPLATE} label="Copy prompt" />
                </div>
                <pre className="whitespace-pre-wrap">
                  {SYSTEM_PROMPT_TEMPLATE}
                </pre>
              </div>
            </li>
            <li>
              Add these <span className="font-medium">client tools</span> to
              the agent (name + parameters; leave the handler empty — the app
              runs them in the browser):
              <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-800">
                <div className="mb-2 flex justify-end">
                  <CopyButton text={toolsJson} label="Copy tools JSON" />
                </div>
                <pre className="whitespace-pre-wrap">{toolsJson}</pre>
              </div>
            </li>
            <li>
              Put these in your <span className="font-mono">.env.local</span>{" "}
              and restart{" "}
              <span className="font-mono">npm run dev</span>:
              <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-800">
                <pre className="whitespace-pre-wrap">
{`ELEVENLABS_API_KEY=sk-...
ELEVENLABS_AGENT_ID=agent_...`}
                </pre>
              </div>
            </li>
          </ol>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 p-3">
          <button type="button" onClick={onRetry} className="btn-primary">
            <Loader2 className="h-3.5 w-3.5" />
            Re-check setup
          </button>
        </footer>
      </div>
    </div>
  );
}
