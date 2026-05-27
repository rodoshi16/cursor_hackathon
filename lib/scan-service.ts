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

      // Default: save now and possibly update
      let saved: InterviewEmail = saveInterview(classified);

      if (classified.status === "ignored" && !classified.isInterview) {
        result.ignoredCount++;
        result.results.push(saved);
        continue;
      }

      result.interviewsFound++;

      // Generate evidence-based report for interview-like emails.
      const report = generateInterviewReport(saved);
      saveReport(report);
      result.reportsGenerated++;
      saved = saveInterview({ ...saved, reportId: report.id });

      // Try to create a calendar event when we have high confidence + date.
      if (
        saved.status === "added_to_calendar" &&
        saved.startDateTime &&
        saved.endDateTime
      ) {
        if (hasCalendarEventForEmail(saved.provider, saved.emailId)) {
          result.results.push(saved);
          continue;
        }

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
            result.needsReview++;
            result.results.push(saved);
            continue;
          }
          try {
            const client = getProviderClient(saved.provider);
            const description = buildCalendarDescription(saved, report);
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
      } else if (saved.status === "needs_review") {
        result.needsReview++;
      }

      result.results.push(saved);
    }
  }

  return result;
}
