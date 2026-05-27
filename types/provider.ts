export type EmailCalendarProvider = "google" | "microsoft";

export type ConnectedAccount = {
  id: string;
  provider: EmailCalendarProvider;
  email?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  createdAt: string;
};

export type NormalizedEmailMessage = {
  id: string;
  threadId?: string;
  provider: EmailCalendarProvider;
  subject: string;
  from?: string;
  snippet?: string;
  body?: string;
  receivedAt?: string;
};

export type CalendarEventInput = {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  location?: string;
  meetingLink?: string;
};

export type CalendarEventResult = {
  provider: EmailCalendarProvider;
  eventId: string;
  eventUrl?: string;
};

export type ProviderClient = {
  provider: EmailCalendarProvider;
  getAuthUrl: () => string;
  exchangeCodeForTokens: (code: string) => Promise<ConnectedAccount>;
  searchRecentEmails: (
    account: ConnectedAccount
  ) => Promise<NormalizedEmailMessage[]>;
  createCalendarEvent: (
    account: ConnectedAccount,
    event: CalendarEventInput
  ) => Promise<CalendarEventResult>;
};
