import {
  getConnectedAccount,
  getInterviewById,
  getReportById,
  hasCalendarEventForEmail,
  saveCalendarEvent,
  saveInterview,
} from "@/lib/store";
import { getProviderClient } from "@/lib/providers";
import { buildCalendarDescription } from "@/lib/calendar-description";
import { isDemoMode, generateId, safeJsonResponse } from "@/lib/utils";

type Body = {
  interviewId?: string;
  startDateTime?: string;
  endDateTime?: string;
  timezone?: string;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  if (!body.interviewId) {
    return safeJsonResponse(
      { ok: false, error: "interviewId is required" },
      { status: 400 }
    );
  }

  const interview = getInterviewById(body.interviewId);
  if (!interview) {
    return safeJsonResponse(
      { ok: false, error: "Interview not found" },
      { status: 404 }
    );
  }

  const startDateTime = body.startDateTime || interview.startDateTime;
  const endDateTime = body.endDateTime || interview.endDateTime;
  const timezone = body.timezone || interview.timezone || "America/Toronto";

  if (!startDateTime || !endDateTime) {
    return safeJsonResponse(
      {
        ok: false,
        error:
          "A clear date and time are required to add this interview to the calendar.",
      },
      { status: 400 }
    );
  }

  if (hasCalendarEventForEmail(interview.provider, interview.emailId)) {
    return safeJsonResponse({
      ok: true,
      duplicate: true,
      interview,
    });
  }

  const report = interview.reportId
    ? getReportById(interview.reportId)
    : undefined;
  const description = report
    ? buildCalendarDescription(interview, report)
    : `Detected by InterviewRadar\n\nOriginal email subject: ${interview.subject}`;

  try {
    if (isDemoMode()) {
      const eventId = `demo_evt_${generateId()}`;
      const eventUrl = `https://calendar.google.com/calendar/u/0/r?demo=${eventId}`;
      saveCalendarEvent(interview.provider, interview.emailId, eventId, eventUrl);
      const updated = saveInterview({
        ...interview,
        startDateTime,
        endDateTime,
        timezone,
        status: "added_to_calendar",
        calendarEventId: eventId,
        calendarEventUrl: eventUrl,
      });
      return safeJsonResponse({ ok: true, interview: updated, eventId, eventUrl });
    }

    const account = getConnectedAccount(interview.provider);
    if (!account) {
      return safeJsonResponse(
        {
          ok: false,
          error: `No connected ${interview.provider} account.`,
        },
        { status: 400 }
      );
    }
    const client = getProviderClient(interview.provider);
    const eventRes = await client.createCalendarEvent(account, {
      summary: `${interview.company || "Interview"} — ${
        interview.interviewType || "Interview"
      }`,
      description,
      startDateTime,
      endDateTime,
      timezone,
      location: interview.location,
      meetingLink: interview.meetingLink,
    });
    saveCalendarEvent(
      interview.provider,
      interview.emailId,
      eventRes.eventId,
      eventRes.eventUrl
    );
    const updated = saveInterview({
      ...interview,
      startDateTime,
      endDateTime,
      timezone,
      status: "added_to_calendar",
      calendarEventId: eventRes.eventId,
      calendarEventUrl: eventRes.eventUrl,
    });
    return safeJsonResponse({
      ok: true,
      interview: updated,
      eventId: eventRes.eventId,
      eventUrl: eventRes.eventUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Calendar event creation failed.";
    return safeJsonResponse({ ok: false, error: message }, { status: 500 });
  }
}
