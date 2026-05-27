import type { ConnectedAccount, EmailCalendarProvider } from "@/types/provider";
import type { InterviewEmail } from "@/types/interview";
import type { DecisionReport, InterviewReport } from "@/types/report";

type CalendarEventRecord = {
  provider: EmailCalendarProvider;
  emailId: string;
  eventId: string;
  eventUrl?: string;
  createdAt: string;
};

type Store = {
  connectedAccounts: Map<EmailCalendarProvider, ConnectedAccount>;
  interviews: InterviewEmail[];
  reports: DecisionReport[];
  calendarEvents: CalendarEventRecord[];
};

const globalAny = globalThis as unknown as { __interviewRadarStore?: Store };

function getStore(): Store {
  if (!globalAny.__interviewRadarStore) {
    globalAny.__interviewRadarStore = {
      connectedAccounts: new Map(),
      interviews: [],
      reports: [],
      calendarEvents: [],
    };
  }
  return globalAny.__interviewRadarStore;
}

export function saveConnectedAccount(account: ConnectedAccount): void {
  getStore().connectedAccounts.set(account.provider, account);
}

export function getConnectedAccount(
  provider: EmailCalendarProvider
): ConnectedAccount | undefined {
  return getStore().connectedAccounts.get(provider);
}

export function getAllConnectedAccounts(): ConnectedAccount[] {
  return Array.from(getStore().connectedAccounts.values());
}

export function removeConnectedAccount(provider: EmailCalendarProvider): void {
  getStore().connectedAccounts.delete(provider);
}

export function saveInterview(interview: InterviewEmail): InterviewEmail {
  const store = getStore();
  const existingIdx = store.interviews.findIndex(
    (i) => i.provider === interview.provider && i.emailId === interview.emailId
  );
  if (existingIdx >= 0) {
    store.interviews[existingIdx] = interview;
  } else {
    store.interviews.unshift(interview);
  }
  return interview;
}

export function getInterviews(): InterviewEmail[] {
  return [...getStore().interviews];
}

export function getInterviewById(id: string): InterviewEmail | undefined {
  return getStore().interviews.find((i) => i.id === id);
}

export function saveDecisionReport(report: DecisionReport): DecisionReport {
  const store = getStore();
  // De-duplicate by provider + emailId so re-scanning the same email replaces
  // its prior report instead of stacking.
  const dupIdx = store.reports.findIndex(
    (r) =>
      r.id === report.id ||
      (r.provider === report.provider && r.emailId === report.emailId)
  );
  if (dupIdx >= 0) {
    store.reports[dupIdx] = report;
  } else {
    store.reports.unshift(report);
  }
  return report;
}

export function getDecisionReportById(id: string): DecisionReport | undefined {
  return getStore().reports.find((r) => r.id === id);
}

export function getDecisionReports(): DecisionReport[] {
  return [...getStore().reports];
}

export function getLatestDecisionReport(): DecisionReport | undefined {
  return getStore().reports[0];
}

// Backwards-compatible aliases — older code uses these names.
export const saveReport = saveDecisionReport;
export const getReportById = getDecisionReportById;
export const getReports = getDecisionReports;
export const getLatestReport = getLatestDecisionReport;

// Eslint helper: keep the alias import alive even if unused.
export type { InterviewReport };

export function getUpcomingInterviews(): InterviewEmail[] {
  const now = Date.now();
  return getStore()
    .interviews.filter(
      (i) =>
        (i.status === "added_to_calendar" || i.status === "needs_review") &&
        i.startDateTime &&
        new Date(i.startDateTime).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.startDateTime!).getTime() -
        new Date(b.startDateTime!).getTime()
    );
}

export function hasCalendarEventForEmail(
  provider: EmailCalendarProvider,
  emailId: string
): boolean {
  return getStore().calendarEvents.some(
    (e) => e.provider === provider && e.emailId === emailId
  );
}

export function saveCalendarEvent(
  provider: EmailCalendarProvider,
  emailId: string,
  eventId: string,
  eventUrl?: string
): void {
  getStore().calendarEvents.push({
    provider,
    emailId,
    eventId,
    eventUrl,
    createdAt: new Date().toISOString(),
  });
}

export function resetStore(): void {
  globalAny.__interviewRadarStore = {
    connectedAccounts: new Map(),
    interviews: [],
    reports: [],
    calendarEvents: [],
  };
}
