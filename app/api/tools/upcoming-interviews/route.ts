import { getUpcomingInterviews } from "@/lib/store";
import { formatDateTime, safeJsonResponse } from "@/lib/utils";

export async function GET() {
  const interviews = getUpcomingInterviews();
  return safeJsonResponse({
    count: interviews.length,
    interviews: interviews.map((i) => ({
      id: i.id,
      company: i.company,
      role: i.role,
      interviewType: i.interviewType,
      provider: i.provider,
      status: i.status,
      startDateTime: i.startDateTime,
      readableStart: formatDateTime(i.startDateTime),
      meetingLink: i.meetingLink,
      reportId: i.reportId,
      calendarEventUrl: i.calendarEventUrl,
    })),
  });
}
