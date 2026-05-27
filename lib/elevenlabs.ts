import type { InterviewReport } from "@/types/report";
import { formatDateTime } from "./utils";

export function hasElevenLabsTtsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
}

export function hasElevenLabsAgentConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID);
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  if (!hasElevenLabsTtsConfigured()) {
    throw new Error("ElevenLabs TTS is not configured.");
  }
  const voiceId = process.env.ELEVENLABS_VOICE_ID!;
  const apiKey = process.env.ELEVENLABS_API_KEY!;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.7,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${errText}`);
  }

  return res.arrayBuffer();
}

export function createBriefingScript(report: InterviewReport): string {
  const parts: string[] = [];

  const intro = report.company
    ? `Here's your evidence-based briefing for ${report.company}.`
    : "Here's your evidence-based briefing.";
  parts.push(intro);

  parts.push("Based on the email, here is what we know.");

  if (report.confirmedDetails.length) {
    const confirmed = report.confirmedDetails
      .filter((d) =>
        ["Company", "Role", "Interview type", "Date / time"].includes(d.label)
      )
      .map((d) => `${d.label.toLowerCase()}: ${d.value}`)
      .join(", ");
    if (confirmed) parts.push(`The confirmed details are ${confirmed}.`);
  }

  if (report.startDateTime) {
    parts.push(`The interview is scheduled for ${formatDateTime(report.startDateTime)}.`);
  }

  if (report.evidenceFound.length) {
    parts.push(
      `The email specifically mentions: ${report.evidenceFound
        .map((e) => `"${e}"`)
        .join(", ")}.`
    );
  }

  if (report.whatToPrepare.length) {
    parts.push("What you should prepare is the following.");
    for (const item of report.whatToPrepare) {
      parts.push(`${item.item} Based on the phrase "${item.evidence}".`);
    }
  } else {
    parts.push(
      "The email does not include enough detail to create a specific prep plan. The safest next step is to confirm the interview format and whether anything should be prepared."
    );
  }

  if (report.unknowns.length) {
    parts.push("What is unclear:");
    for (const u of report.unknowns) parts.push(u);
  }

  if (report.suggestedFollowUpQuestions.length) {
    parts.push("Here are useful follow-up questions:");
    for (const q of report.suggestedFollowUpQuestions) parts.push(q);
  }

  parts.push(
    "InterviewRadar only recommends preparation directly supported by the email."
  );

  return parts.join(" ");
}

export function createToolResponseScript(message: string): string {
  return message;
}

// Returns a signed URL for the ElevenLabs Conversational AI agent when an
// agent is configured. Useful for browser SDKs that need a short-lived URL.
export async function getAgentSignedUrl(): Promise<string | null> {
  if (!hasElevenLabsAgentConfigured()) return null;
  const apiKey = process.env.ELEVENLABS_API_KEY!;
  const agentId = process.env.ELEVENLABS_AGENT_ID!;
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(
        agentId
      )}`,
      { headers: { "xi-api-key": apiKey } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { signed_url?: string };
    return data.signed_url || null;
  } catch {
    return null;
  }
}
