import type { EmailCalendarProvider } from "./provider";

export type InterviewStatus =
  | "added_to_calendar"
  | "needs_review"
  | "ignored"
  | "error";

export type InterviewEmail = {
  id: string;
  provider: EmailCalendarProvider;
  emailId: string;
  threadId?: string;

  subject: string;
  from?: string;
  snippet?: string;
  body?: string;
  receivedAt?: string;

  isInterview: boolean;
  confidence: number;
  status: InterviewStatus;

  company?: string;
  role?: string;
  interviewType?: string;
  interviewerName?: string;

  startDateTime?: string;
  endDateTime?: string;
  timezone?: string;

  location?: string;
  meetingLink?: string;

  reason: string;
  riskFlags: string[];

  calendarEventId?: string;
  calendarEventUrl?: string;
  reportId?: string;

  createdAt: string;
};

export type ScanResult = {
  scannedCount: number;
  interviewsFound: number;
  eventsCreated: number;
  reportsGenerated: number;
  needsReview: number;
  ignoredCount: number;
  results: InterviewEmail[];
};
