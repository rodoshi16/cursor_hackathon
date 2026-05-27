"use client";

import { InterviewVoiceAgent } from "@/components/InterviewVoiceAgent";

export default function AgentPage() {
  return (
    <main className="container-page space-y-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Voice agent
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Press start, then talk. Ask about your next interview, what to prep,
          why an email was ignored — the agent uses an ElevenLabs voice and
          pulls answers from your actual inbox decisions.
        </p>
      </header>

      <InterviewVoiceAgent />
    </main>
  );
}
