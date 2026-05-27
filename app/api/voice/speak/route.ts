import {
  createDecisionBriefingScript,
  hasElevenLabsTtsConfigured,
  textToSpeech,
} from "@/lib/elevenlabs";
import { getDecisionReportById } from "@/lib/store";
import { safeJsonResponse } from "@/lib/utils";

type Body = {
  text?: string;
  reportId?: string;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  let script = body.text?.trim() || "";
  let usedReportScript = false;

  if (body.reportId) {
    const report = getDecisionReportById(body.reportId);
    if (!report) {
      return safeJsonResponse(
        { ok: false, error: "Decision report not found." },
        { status: 404 }
      );
    }
    script = createDecisionBriefingScript(report);
    usedReportScript = true;
  }

  if (!script) {
    return safeJsonResponse(
      { ok: false, error: "Provide either text or reportId." },
      { status: 400 }
    );
  }

  if (!hasElevenLabsTtsConfigured()) {
    return safeJsonResponse(
      {
        ok: false,
        configured: false,
        message:
          "ElevenLabs credentials are not configured. Showing the script that would be spoken.",
        script,
        usedReportScript,
      },
      { status: 200 }
    );
  }

  try {
    const audio = await textToSpeech(script);
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "ElevenLabs request failed.";
    return safeJsonResponse(
      {
        ok: false,
        configured: true,
        error: message,
        script,
      },
      { status: 500 }
    );
  }
}
