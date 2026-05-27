import type { DecisionReport, InterviewReport } from "@/types/report";
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

export function createDecisionBriefingScript(report: DecisionReport): string {
  const parts: string[] = [];
  const subjectName = report.company || "this email";

  if (report.outcome === "added_to_calendar") {
    parts.push(
      `Based on the email, InterviewRadar added ${subjectName} to your calendar because it found a clear interview signal and a confirmed date and time.`
    );
    if (report.startDateTime) {
      parts.push(
        `The interview is scheduled for ${formatDateTime(
          report.startDateTime
        )}.`
      );
    }
    if (report.decision.evidence.length) {
      parts.push(
        `The email specifically mentions: ${report.decision.evidence
          .map((e) => `"${e}"`)
          .join(", ")}.`
      );
    }
    if (report.whatToPrepare.length) {
      parts.push("For preparation, the email asks you to:");
      for (const item of report.whatToPrepare) {
        parts.push(`${item.item} Based on "${item.evidence}".`);
      }
    } else {
      parts.push(
        "The email does not include enough detail to create a specific prep plan."
      );
    }
    if (report.unknowns.length) {
      parts.push("What is still unclear:");
      for (const u of report.unknowns) parts.push(u);
    }
  } else if (report.outcome === "needs_review") {
    parts.push(
      `InterviewRadar marked ${subjectName} as needs review. It looks interview-related because the email says ${
        report.decision.evidence.length
          ? report.decision.evidence.map((e) => `"${e}"`).join(", ")
          : "it is from a recruiter"
      }, but it does not include a confirmed date or time.`
    );
    if (report.whatToPrepare.length) {
      parts.push("Based only on what the email says, you can already:");
      for (const item of report.whatToPrepare) {
        parts.push(`${item.item} Based on "${item.evidence}".`);
      }
    }
    if (report.decision.nextSteps.length) {
      parts.push("The next steps are:");
      for (const s of report.decision.nextSteps) parts.push(s);
    }
  } else {
    parts.push(
      `InterviewRadar ignored ${subjectName} because it looks like an application confirmation, not an interview request.`
    );
    if (report.decision.evidence.length) {
      parts.push(
        `The email says ${report.decision.evidence
          .map((e) => `"${e}"`)
          .join(", ")}, but it does not include an interview request, date, time, or meeting link.`
      );
    }
    parts.push("No action is needed.");
  }

  parts.push(
    "InterviewRadar only includes information directly supported by the email."
  );

  return parts.join(" ");
}

// Backwards-compatible name used by older callers.
export function createBriefingScript(report: InterviewReport): string {
  return createDecisionBriefingScript(report);
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
