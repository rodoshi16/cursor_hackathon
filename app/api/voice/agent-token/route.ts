import {
  getAgentSignedUrl,
  hasElevenLabsAgentConfigured,
} from "@/lib/elevenlabs";
import { safeJsonResponse } from "@/lib/utils";

export async function GET() {
  const agentId = process.env.ELEVENLABS_AGENT_ID || null;
  const configured = hasElevenLabsAgentConfigured();

  if (!configured) {
    return safeJsonResponse({
      agentId,
      configured: false,
      message:
        "ElevenLabs agent not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID to enable the live voice agent. The simulated voice panel still works for the demo.",
    });
  }

  const signedUrl = await getAgentSignedUrl();
  return safeJsonResponse({
    agentId,
    configured: true,
    signedUrl,
    message:
      "ElevenLabs agent ready. Use the signedUrl with the Conversational AI WebSocket SDK.",
  });
}
