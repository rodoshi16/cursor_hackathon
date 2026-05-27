import type { EmailCalendarProvider } from "@/types/provider";
import type { InterviewEmail, ScanResult } from "@/types/interview";
import { isDemoMode, generateId } from "./utils";
import { getDemoEmailsForProvider } from "./demo-data";
import {
  getAllConnectedAccounts,
  getConnectedAccount,
  hasCalendarEventForEmail,
  saveCalendarEvent,
  saveInterview,
  saveReport,
} from "./store";
import { classifyInterviewEmail } from "./interview-detector";
import { generateInterviewReport } from "./report-generator";
import { getProviderClient } from "./providers";
import { buildCalendarDescription } from "./calendar-description";

type ScanScope = EmailCalendarProvider | "all";

export async function runScan(provider: ScanScope): Promise<ScanResult> {
  const result: ScanResult = {
    scannedCount: 0,
    interviewsFound: 0,
    eventsCreated: 0,
    reportsGenerated: 0,
    needsReview: 0,
    ignoredCount: 0,
    results: [],
  };

  const isDemo = isDemoMode();

  // Decide where emails come from
  const providersToScan: EmailCalendarProvider[] = isDemo
    ? provider === "all"
      ? ["google", "microsoft"]
      : [provider]
    : provider === "all"
    ? getAllConnectedAccounts().map((a) => a.provider)
    : getConnectedAccount(provider)
    ? [provider]
    : [];

  for (const p of providersToScan) {
    let emails;
    if (isDemo) {
      emails = getDemoEmailsForProvider(p);
    } else {
      const account = getConnectedAccount(p);
      if (!account) continue;
      try {
        emails = await getProviderClient(p).searchRecentEmails(account);
      } catch (err) {
        console.error("Provider search failed", p, err);
        continue;
      }
    }

    for (const email of emails) {
      result.scannedCount++;
      const classified: InterviewEmail = classifyInterviewEmail(email);
      let saved: InterviewEmail = saveInterview(classified);

      // Calendar event creation happens BEFORE report generation so that the
      // report's "actions taken" list and the calendar link are accurate.
      if (
        saved.status === "added_to_calendar" &&
        saved.startDateTime &&
        saved.endDateTime
      ) {
        const alreadyExists = hasCalendarEventForEmail(
          saved.provider,
          saved.emailId
        );
        if (!alreadyExists) {
          if (isDemo) {
            const eventId = `demo_evt_${generateId()}`;
            const eventUrl = `https://calendar.google.com/calendar/u/0/r?demo=${eventId}`;
            saveCalendarEvent(saved.provider, saved.emailId, eventId, eventUrl);
            saved = saveInterview({
              ...saved,
              calendarEventId: eventId,
              calendarEventUrl: eventUrl,
            });
            result.eventsCreated++;
          } else {
            const account = getConnectedAccount(saved.provider);
            if (!account) {
              saved = saveInterview({
                ...saved,
                status: "needs_review",
                reason:
                  "Detected an interview but the calendar account is not connected.",
              });
            } else {
              try {
                const client = getProviderClient(saved.provider);
                // We need a preliminary report to build the calendar description,
                // so generate it now. It will be saved (and possibly updated with
                // the calendar IDs) below.
                const preliminary = generateInterviewReport(saved);
                const description = buildCalendarDescription(saved, preliminary);
                const eventRes = await client.createCalendarEvent(account, {
                  summary: `${saved.company || "Interview"} — ${
                    saved.interviewType || "Interview"
                  }`,
                  description,
                  startDateTime: saved.startDateTime,
                  endDateTime: saved.endDateTime,
                  timezone: saved.timezone || "America/Toronto",
                  location: saved.location,
                  meetingLink: saved.meetingLink,
                });
                saveCalendarEvent(
                  saved.provider,
                  saved.emailId,
                  eventRes.eventId,
                  eventRes.eventUrl
                );
                saved = saveInterview({
                  ...saved,
                  calendarEventId: eventRes.eventId,
                  calendarEventUrl: eventRes.eventUrl,
                });
                result.eventsCreated++;
              } catch (err) {
                console.error("Calendar event creation failed", err);
                saved = saveInterview({
                  ...saved,
                  status: "error",
                  reason: "Failed to create calendar event.",
                });
              }
            }
          }
        }
      }

      // Every email — including ignored ones — gets a Decision Report.
      const report = generateInterviewReport(saved);
      saveReport(report);
      result.reportsGenerated++;
      saved = saveInterview({ ...saved, reportId: report.id });

      // Tally
      if (saved.status === "ignored") {
        result.ignoredCount++;
      } else if (saved.status === "needs_review") {
        result.needsReview++;
        result.interviewsFound++;
      } else if (saved.status === "added_to_calendar") {
        result.interviewsFound++;
      }

      result.results.push(saved);
    }
  }

  return result;
}
