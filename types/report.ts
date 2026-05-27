import type { EmailCalendarProvider } from "./provider";

export type DecisionOutcome =
  | "added_to_calendar"
  | "needs_review"
  | "ignored"
  | "error";

export type ActionTaken = {
  label: string;
  description: string;
};

export type DecisionExplanation = {
  summary: string;
  why: string;
  evidence: string[];
  actionsTaken: ActionTaken[];
  actionsNotTaken: ActionTaken[];
  nextSteps: string[];
};

export type PrepSignal = {
  signal: string;
  label: string;
  evidence: string;
  prepItems: string[];
};

export type EvidenceBasedPrepItem = {
  item: string;
  evidence: string;
};

export type ConfirmedDetail = {
  label: string;
  value: string;
};

export type DecisionReport = {
  id: string;
  provider: EmailCalendarProvider;
  emailId: string;
  interviewId?: string;

  outcome: DecisionOutcome;
  confidence: number;

  company?: string;
  role?: string;
  interviewType?: string;
  interviewerName?: string;

  startDateTime?: string;
  endDateTime?: string;
  timezone?: string;

  meetingLink?: string;
  location?: string;

  emailSubject: string;
  emailSnippet?: string;
  sourceEmailBody?: string;

  confirmedDetails: ConfirmedDetail[];

  decision: DecisionExplanation;

  // Kept for backwards compatibility with prior consumers.
  evidenceFound: string[];

  prepSignals: PrepSignal[];
  whatToPrepare: EvidenceBasedPrepItem[];
  unknowns: string[];
  suggestedFollowUpQuestions: string[];

  confidenceExplanation: string;

  calendarEventId?: string;
  calendarEventUrl?: string;

  createdAt: string;
};

// InterviewReport is kept as an alias so any existing imports continue to work.
export type InterviewReport = DecisionReport;
