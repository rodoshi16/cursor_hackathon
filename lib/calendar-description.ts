import type { InterviewEmail } from "@/types/interview";
import type { InterviewReport } from "@/types/report";
import { appUrl, formatDateTime } from "./utils";

export function buildCalendarDescription(
  interview: InterviewEmail,
  report: InterviewReport
): string {
  const lines: string[] = [];
  lines.push("Detected by InterviewRadar");
  lines.push("");

  if (interview.company) lines.push(`Company: ${interview.company}`);
  if (interview.role) lines.push(`Role: ${interview.role}`);
  if (interview.interviewType)
    lines.push(`Interview type: ${interview.interviewType}`);
  if (interview.interviewerName)
    lines.push(`Interviewer: ${interview.interviewerName}`);
  if (interview.startDateTime)
    lines.push(`When: ${formatDateTime(interview.startDateTime)}`);
  if (interview.meetingLink) lines.push(`Meeting: ${interview.meetingLink}`);
  if (interview.location) lines.push(`Location: ${interview.location}`);

  lines.push("");
  lines.push(`Original email subject: ${interview.subject}`);

  lines.push("");
  lines.push("— Evidence-Based Prep Summary —");
  lines.push(
    "InterviewRadar only recommends preparation backed by the original email."
  );

  if (report.evidenceFound.length) {
    lines.push("");
    lines.push("Evidence found:");
    for (const e of report.evidenceFound) {
      lines.push(`• "${e}"`);
    }
  }

  if (report.whatToPrepare.length) {
    lines.push("");
    lines.push("What to prepare:");
    for (const item of report.whatToPrepare) {
      lines.push(`• ${item.item}`);
      lines.push(`   Based on: "${item.evidence}"`);
    }
  }

  if (report.unknowns.length) {
    lines.push("");
    lines.push("Unknowns / Needs Clarification:");
    for (const u of report.unknowns) {
      lines.push(`• ${u}`);
    }
  }

  lines.push("");
  lines.push(`Full prep report: ${appUrl()}/reports/${report.id}`);

  return lines.join("\n");
}
