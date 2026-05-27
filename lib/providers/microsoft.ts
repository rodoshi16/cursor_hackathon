import type {
  CalendarEventInput,
  CalendarEventResult,
  ConnectedAccount,
  NormalizedEmailMessage,
  ProviderClient,
} from "@/types/provider";
import { generateId, stripHtml } from "@/lib/utils";

const SCOPES =
  "openid profile email offline_access User.Read Mail.Read Calendars.ReadWrite";

function hasMicrosoftEnv(): boolean {
  return Boolean(
    process.env.MICROSOFT_CLIENT_ID &&
      process.env.MICROSOFT_CLIENT_SECRET &&
      process.env.MICROSOFT_REDIRECT_URI
  );
}

function tenant(): string {
  return process.env.MICROSOFT_TENANT_ID || "common";
}

function authBaseUrl(): string {
  return `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0`;
}

export const microsoftProvider: ProviderClient = {
  provider: "microsoft",
  getAuthUrl() {
    if (!hasMicrosoftEnv()) {
      throw new Error(
        "Microsoft OAuth is not configured. Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI."
      );
    }
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      response_type: "code",
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
      response_mode: "query",
      scope: SCOPES,
      prompt: "select_account",
    });
    return `${authBaseUrl()}/authorize?${params.toString()}`;
  },
  async exchangeCodeForTokens(code: string): Promise<ConnectedAccount> {
    if (!hasMicrosoftEnv()) {
      throw new Error("Microsoft OAuth is not configured.");
    }
    const tokenRes = await fetch(`${authBaseUrl()}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: "authorization_code",
        scope: SCOPES,
      }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Microsoft token exchange failed: ${text}`);
    }
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    let email: string | undefined;
    try {
      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (meRes.ok) {
        const me = (await meRes.json()) as {
          mail?: string;
          userPrincipalName?: string;
        };
        email = me.mail || me.userPrincipalName;
      }
    } catch {
      email = undefined;
    }

    return {
      id: generateId("acct"),
      provider: "microsoft",
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : undefined,
      createdAt: new Date().toISOString(),
    };
  },
  async searchRecentEmails(
    account: ConnectedAccount
  ): Promise<NormalizedEmailMessage[]> {
    const params = new URLSearchParams({
      $top: "25",
      $orderby: "receivedDateTime desc",
      $select:
        "id,subject,from,bodyPreview,body,receivedDateTime,conversationId",
    });
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${account.accessToken}` },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft Graph mail fetch failed: ${text}`);
    }
    const data = (await res.json()) as {
      value: Array<{
        id: string;
        subject?: string;
        from?: { emailAddress?: { address?: string; name?: string } };
        bodyPreview?: string;
        body?: { content?: string; contentType?: string };
        receivedDateTime?: string;
        conversationId?: string;
      }>;
    };

    return (data.value || []).map((m): NormalizedEmailMessage => {
      const fromAddress = m.from?.emailAddress?.address;
      const fromName = m.from?.emailAddress?.name;
      const from =
        fromName && fromAddress
          ? `${fromName} <${fromAddress}>`
          : fromAddress || fromName;
      const rawBody = m.body?.content || "";
      const body =
        m.body?.contentType?.toLowerCase() === "html"
          ? stripHtml(rawBody)
          : rawBody;
      return {
        id: m.id,
        threadId: m.conversationId,
        provider: "microsoft",
        subject: m.subject || "",
        from,
        snippet: m.bodyPreview,
        body,
        receivedAt: m.receivedDateTime,
      };
    });
  },
  async createCalendarEvent(
    account: ConnectedAccount,
    event: CalendarEventInput
  ): Promise<CalendarEventResult> {
    const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: event.summary,
        body: { contentType: "Text", content: event.description },
        start: { dateTime: event.startDateTime, timeZone: event.timezone },
        end: { dateTime: event.endDateTime, timeZone: event.timezone },
        location: event.location ? { displayName: event.location } : undefined,
        isOnlineMeeting: !!event.meetingLink,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft Graph calendar create failed: ${text}`);
    }
    const data = (await res.json()) as { id: string; webLink?: string };
    return {
      provider: "microsoft",
      eventId: data.id,
      eventUrl: data.webLink,
    };
  },
};
