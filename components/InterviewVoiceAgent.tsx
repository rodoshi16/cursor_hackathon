"use client";

import {
  Headphones,
  Loader2,
  Mic,
  MicOff,
  PauseCircle,
  PhoneOff,
  PlayCircle,
  Sparkle,
  Volume2,
  Waves,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type AgentState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | "error";

type ConfigResponse = {
  agentId: string | null;
  configured: boolean;
  message?: string;
  signedUrl?: string | null;
};

type ToolAction = {
  id: string;
  label: string;
  detail?: string;
  at: string;
};

type TranscriptEntry = {
  id: string;
  speaker: "user" | "agent";
  text: string;
};

const HELPFUL_PROMPTS = [
  "Can you check if I have any interview emails?",
  "Scan my Gmail.",
  "Scan everything.",
  "What interviews do I have coming up?",
  "Read me my prep report.",
  "Which emails need review?",
  "What should I prepare for my next interview?",
];

const SEED_TRANSCRIPT: TranscriptEntry[] = [
  {
    id: "u1",
    speaker: "user",
    text: "Can you scan my inbox for interviews?",
  },
  {
    id: "a1",
    speaker: "agent",
    text:
      "I found two interview-related emails. One Shopify final interview was added to your calendar. One Wealthsimple recruiter screen needs review because the email asks for availability but does not include a specific time.",
  },
  {
    id: "u2",
    speaker: "user",
    text: "What should I prepare for Shopify?",
  },
  {
    id: "a2",
    speaker: "agent",
    text:
      "Based on the email, prepare a 10-minute project showcase. The email also says to discuss implementation decisions, challenges, and technical tradeoffs. It does not mention live coding.",
  },
];

const SEED_TOOL_ACTIONS: ToolAction[] = [
  {
    id: "t1",
    label: "Scanned Gmail",
    detail: "3 emails reviewed",
    at: "just now",
  },
  {
    id: "t2",
    label: "Ignored Google application confirmation",
    at: "just now",
  },
  {
    id: "t3",
    label: "Added Shopify interview to calendar",
    detail: "Friday, May 29 · 2:00 PM",
    at: "just now",
  },
  {
    id: "t4",
    label: "Generated evidence-based prep report",
    detail: "Shopify · Project Showcase",
    at: "just now",
  },
  {
    id: "t5",
    label: "Flagged Wealthsimple email as needs review",
    detail: "Asked for availability — no exact time",
    at: "just now",
  },
];

function StateDot({ state }: { state: AgentState }) {
  const map: Record<AgentState, { color: string; label: string }> = {
    idle: { color: "bg-zinc-300", label: "Idle" },
    connecting: { color: "bg-amber-400 animate-pulseDot", label: "Connecting" },
    listening: { color: "bg-accent-500 animate-pulseDot", label: "Listening" },
    thinking: { color: "bg-sky-500 animate-pulseDot", label: "Thinking" },
    speaking: { color: "bg-accent-600 animate-pulseDot", label: "Speaking" },
    disconnected: { color: "bg-zinc-400", label: "Disconnected" },
    error: { color: "bg-red-500", label: "Error" },
  };
  const meta = map[state];
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-600">
      <span className={`dot ${meta.color}`} />
      {meta.label}
    </span>
  );
}

export function InterviewVoiceAgent() {
  const [state, setState] = useState<AgentState>("idle");
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [toolActions, setToolActions] = useState<ToolAction[]>([]);
  const [lastAgentText, setLastAgentText] = useState<string | null>(null);
  const [scriptFallback, setScriptFallback] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptIdxRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/voice/agent-token")
      .then((r) => r.json())
      .then((c) => {
        if (!cancelled) setConfig(c);
      })
      .catch(() => {
        if (!cancelled)
          setConfig({
            agentId: null,
            configured: false,
            message: "Could not reach agent endpoint.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  function startSession() {
    setState("connecting");
    setTranscript([]);
    setToolActions([]);
    setLastAgentText(null);
    setScriptFallback(null);
    transcriptIdxRef.current = 0;

    // Real ElevenLabs Conversational AI WebSocket integration would go here,
    // using the signedUrl from /api/voice/agent-token plus the official
    // @11labs/client SDK. We keep the polished UI fallback for the demo so the
    // app works without credentials.
    setTimeout(() => {
      setState("listening");
      stepTranscript();
    }, 700);
  }

  function endSession() {
    stopAudio();
    setState("disconnected");
  }

  const stepTranscript = useCallback(() => {
    if (transcriptIdxRef.current >= SEED_TRANSCRIPT.length) {
      setState("listening");
      return;
    }
    const next = SEED_TRANSCRIPT[transcriptIdxRef.current];
    transcriptIdxRef.current += 1;

    if (next.speaker === "user") {
      setTranscript((t) => [...t, next]);
      setState("thinking");
      setTimeout(() => stepTranscript(), 900);
    } else {
      setLastAgentText(next.text);
      setTranscript((t) => [...t, next]);
      setState("speaking");
      setTimeout(() => {
        setState(
          transcriptIdxRef.current >= SEED_TRANSCRIPT.length
            ? "listening"
            : "listening"
        );
        setTimeout(() => stepTranscript(), 400);
      }, 1800);
    }
  }, []);

  async function runDemoScan() {
    setTranscript((t) => [
      ...t,
      {
        id: `u_${Date.now()}`,
        speaker: "user",
        text: "Scan my inbox.",
      },
    ]);
    setState("thinking");
    try {
      const res = await fetch("/api/tools/scan-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "all" }),
      });
      const data = await res.json();
      const message =
        data.message || "Inbox scanned. See your dashboard for details.";
      setLastAgentText(message);
      setTranscript((t) => [
        ...t,
        { id: `a_${Date.now()}`, speaker: "agent", text: message },
      ]);
      setToolActions((acts) => [
        ...acts,
        {
          id: `act_${Date.now()}`,
          label: "Called scan-inbox tool",
          detail: `${data.scanResult?.scannedCount ?? 0} emails reviewed`,
          at: "just now",
        },
      ]);
      await speak(message);
    } catch {
      setState("error");
    }
  }

  async function readLatestReport() {
    setTranscript((t) => [
      ...t,
      {
        id: `u_${Date.now()}`,
        speaker: "user",
        text: "Read me my latest prep report.",
      },
    ]);
    setState("thinking");
    try {
      const res = await fetch("/api/tools/latest-report");
      const data = await res.json();
      if (!data.report) {
        const msg =
          "There is no prep report yet. Try running a scan from the dashboard or asking me to scan your inbox.";
        setLastAgentText(msg);
        setTranscript((t) => [
          ...t,
          { id: `a_${Date.now()}`, speaker: "agent", text: msg },
        ]);
        await speak(msg);
        return;
      }
      setToolActions((acts) => [
        ...acts,
        {
          id: `act_${Date.now()}`,
          label: "Loaded latest evidence-based report",
          detail: `${data.report.company || "Unknown"} · ${
            data.report.interviewType || "Interview"
          }`,
          at: "just now",
        },
      ]);
      const summaryRes = await fetch(
        `/api/tools/report-summary?reportId=${encodeURIComponent(
          data.report.id
        )}`
      );
      const summary = await summaryRes.json();
      const introMsg =
        summary.summary || "Reading your latest evidence-based briefing.";
      setLastAgentText(introMsg);
      setTranscript((t) => [
        ...t,
        { id: `a_${Date.now()}`, speaker: "agent", text: introMsg },
      ]);
      await speakReport(data.report.id);
    } catch {
      setState("error");
    }
  }

  async function speak(text: string) {
    setState("speaking");
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const ct = res.headers.get("Content-Type") || "";
      if (ct.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setState("listening");
      } else {
        const data = await res.json();
        setScriptFallback(data.script || text);
        setState("listening");
      }
    } catch {
      setState("error");
    }
  }

  async function speakReport(reportId: string) {
    setState("speaking");
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const ct = res.headers.get("Content-Type") || "";
      if (ct.includes("audio/mpeg")) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setState("listening");
      } else {
        const data = await res.json();
        setScriptFallback(data.script || "No briefing available.");
        setState("listening");
      }
    } catch {
      setState("error");
    }
  }

  const live = state !== "idle" && state !== "disconnected" && state !== "error";

  return (
    <div className="surface overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-zinc-900 text-white">
            <Headphones className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
              Talk to Interview Agent
            </h3>
            <p className="mt-0.5 max-w-xl text-xs text-zinc-600">
              Ask InterviewRadar to scan your inbox, find interviews, add
              confirmed events to your calendar, and read evidence-based prep
              reports out loud.
            </p>
          </div>
        </div>
        <div className="hidden sm:block">
          <StateDot state={state} />
        </div>
      </header>

      <div className="grid gap-0 md:grid-cols-[1.15fr_1fr]">
        <div className="p-4 md:border-r md:border-zinc-100">
          <div className="flex flex-wrap items-center gap-2">
            {!live ? (
              <button
                type="button"
                onClick={startSession}
                className="btn-accent"
              >
                <Mic className="h-3.5 w-3.5" />
                Start voice agent
              </button>
            ) : (
              <button
                type="button"
                onClick={endSession}
                className="btn-secondary"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                End call
              </button>
            )}
            <button
              type="button"
              onClick={runDemoScan}
              className="btn-secondary"
            >
              <Sparkle className="h-3.5 w-3.5" />
              Demo: scan inbox
            </button>
            <button
              type="button"
              onClick={readLatestReport}
              className="btn-secondary"
            >
              <Waves className="h-3.5 w-3.5" />
              Demo: read latest report
            </button>
            <span className="ml-auto sm:hidden">
              <StateDot state={state} />
            </span>
          </div>

          {config && !config.configured && (
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600">
              {config.message}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
            <div className="section-title">Transcript</div>
            <div className="mt-2 max-h-64 space-y-2.5 overflow-y-auto scrollbar-thin pr-1">
              {transcript.length === 0 ? (
                <div className="text-xs text-zinc-500">
                  Press <span className="kbd">Start voice agent</span> to begin
                  a conversation, or try one of the demo buttons above.
                </div>
              ) : (
                transcript.map((entry) => (
                  <div key={entry.id} className="text-sm">
                    <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                      {entry.speaker === "user" ? "You" : "Agent"}
                    </div>
                    <div
                      className={
                        entry.speaker === "user"
                          ? "text-zinc-800"
                          : "text-zinc-900"
                      }
                    >
                      {entry.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {lastAgentText && (
            <div className="mt-3 rounded-md border border-accent-200 bg-accent-50/50 p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-800">
                <Volume2 className="h-3 w-3" /> Last agent response
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-800">
                {lastAgentText}
              </p>
            </div>
          )}

          {scriptFallback && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
              <div className="mb-1 font-semibold">
                ElevenLabs not configured — script that would be spoken:
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">
                {scriptFallback}
              </p>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="section-title">Helpful prompts</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HELPFUL_PROMPTS.map((p) => (
              <span
                key={p}
                className="chip border-zinc-200 bg-white text-zinc-700"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="mt-4 section-title">Tool actions</div>
          <ul className="mt-2 space-y-1.5">
            {(toolActions.length ? toolActions : SEED_TOOL_ACTIONS).map(
              (act) => (
                <li
                  key={act.id}
                  className="flex items-start gap-2 rounded-md border border-zinc-100 bg-white px-2.5 py-1.5 text-xs text-zinc-700"
                >
                  <span className="mt-0.5 dot bg-accent-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-zinc-900">
                      {act.label}
                    </div>
                    {act.detail && (
                      <div className="truncate text-zinc-500">
                        {act.detail}
                      </div>
                    )}
                  </div>
                  <span className="text-zinc-400">{act.at}</span>
                </li>
              )
            )}
          </ul>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500">
            {state === "speaking" ? (
              <PauseCircle className="h-3.5 w-3.5" />
            ) : state === "listening" ? (
              <Mic className="h-3.5 w-3.5" />
            ) : state === "thinking" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PlayCircle className="h-3.5 w-3.5" />
            )}
            <span>
              Voice replies use ElevenLabs TTS when{" "}
              <span className="kbd">ELEVENLABS_API_KEY</span> is set. Otherwise
              the script that would be spoken is displayed.
            </span>
          </div>
        </div>
      </div>

      {/*
        Note: The full ElevenLabs Conversational AI experience uses a WebSocket
        connection through @11labs/client to drive turn-by-turn audio with tool
        calls hitting /api/tools/*. The fetch to /api/voice/agent-token above
        returns the signed URL needed for that. When ELEVENLABS_AGENT_ID is set,
        wire up the SDK here. The simulated transcript keeps the demo polished
        regardless of credentials.
      */}
      <noscript>
        <span className="hidden">
          <MicOff />
        </span>
      </noscript>
    </div>
  );
}
