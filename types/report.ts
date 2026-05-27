import type { EmailCalendarProvider } from "./provider";

export type PrepSignal = {
  signal: string;
  label: string;
  evidence: string;
  prepItems: string[];
};

export type ConfirmedDetail = {
  label: string;
  value: string;
};

export type EvidenceBasedPrepItem = {
  item: string;
  evidence: string;
};

export type InterviewReport = {
  id: string;
  provider: EmailCalendarProvider;
  interviewId: string;
  emailId: string;

  company?: string;
  role?: string;
  interviewType?: string;
  interviewerName?: string;

  startDateTime?: string;
  endDateTime?: string;
  timezone?: string;

  location?: string;
  meetingLink?: string;

  emailSubject: string;
  emailSnippet?: string;
  sourceEmailBody?: string;

  confirmedDetails: ConfirmedDetail[];
  evidenceFound: string[];
  prepSignals: PrepSignal[];
  whatToPrepare: EvidenceBasedPrepItem[];
  unknowns: string[];
  suggestedFollowUpQuestions: string[];
  confidenceExplanation: string;

  confidence: number;
  createdAt: string;
};
