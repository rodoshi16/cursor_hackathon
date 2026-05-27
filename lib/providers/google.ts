import { google } from "googleapis";
import type {
  CalendarEventInput,
  CalendarEventResult,
  ConnectedAccount,
  NormalizedEmailMessage,
  ProviderClient,
} from "@/types/provider";
import { generateId, stripHtml } from "@/lib/utils";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
];

const GMAIL_QUERY =
  'newer_than:30d (interview OR "schedule a call" OR "phone screen" OR "technical interview" OR "final round" OR "availability" OR "recruiter" OR "hiring manager" OR "Google Meet" OR "Zoom" OR "Microsoft Teams" OR "next steps")';

function hasGoogleEnv(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

function buildOAuthClient() {
  if (!hasGoogleEnv()) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI."
    );
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

function decodeBase64Url(data: string): string {
  if (!data) return "";
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  try {
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractGmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    const raw = decodeBase64Url(payload.body.data);
    if (raw && payload.mimeType?.includes("html")) return stripHtml(raw);
    if (raw) return raw;
  }
  if (Array.isArray(payload.parts)) {
    // Prefer text/plain, then text/html
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html?.body?.data) return stripHtml(decodeBase64Url(html.body.data));
    for (const p of payload.parts) {
      const nested = extractGmailBody(p);
      if (nested) return nested;
    }
  }
  return "";
}

function getHeader(headers: any[], name: string): string | undefined {
  if (!Array.isArray(headers)) return undefined;
  const h = headers.find(
    (x: any) => (x.name || "").toLowerCase() === name.toLowerCase()
  );
  return h?.value;
}

export const googleProvider: ProviderClient = {
  provider: "google",
  getAuthUrl() {
    const client = buildOAuthClient();
    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
  },
  async exchangeCodeForTokens(code: string): Promise<ConnectedAccount> {
    const client = buildOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    let email: string | undefined;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const profile = await oauth2.userinfo.get();
      email = profile.data.email || undefined;
    } catch {
      email = undefined;
    }

    return {
      id: generateId("acct"),
      provider: "google",
      email,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : undefined,
      createdAt: new Date().toISOString(),
    };
  },
  async searchRecentEmails(
    account: ConnectedAccount
  ): Promise<NormalizedEmailMessage[]> {
    const client = buildOAuthClient();
    client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });
    const gmail = google.gmail({ version: "v1", auth: client });

    const list = await gmail.users.messages.list({
      userId: "me",
      q: GMAIL_QUERY,
      maxResults: 25,
    });

    const ids = (list.data.messages || []).map((m) => m.id!).filter(Boolean);
    const messages: NormalizedEmailMessage[] = [];

    for (const id of ids) {
      try {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id,
          format: "full",
        });
        const headers = msg.data.payload?.headers || [];
        const subject = getHeader(headers, "Subject") || "";
        const from = getHeader(headers, "From") || undefined;
        const dateHeader = getHeader(headers, "Date");
        const body = extractGmailBody(msg.data.payload);
        messages.push({
          id: msg.data.id || id,
          threadId: msg.data.threadId || undefined,
          provider: "google",
          subject,
          from,
          snippet: msg.data.snippet || undefined,
          body,
          receivedAt: dateHeader
            ? new Date(dateHeader).toISOString()
            : undefined,
        });
      } catch (err) {
        console.error("Failed to fetch Gmail message", id, err);
      }
    }

    return messages;
  },
  async createCalendarEvent(
    account: ConnectedAccount,
    event: CalendarEventInput
  ): Promise<CalendarEventResult> {
    const client = buildOAuthClient();
    client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });
    const calendar = google.calendar({ version: "v3", auth: client });

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startDateTime,
          timeZone: event.timezone,
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: event.timezone,
        },
        ...(event.meetingLink
          ? {
              source: { title: "Meeting link", url: event.meetingLink },
            }
          : {}),
      },
    });

    return {
      provider: "google",
      eventId: res.data.id || generateId("evt"),
      eventUrl: res.data.htmlLink || undefined,
    };
  },
};
