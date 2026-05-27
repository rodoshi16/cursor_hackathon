import type { NormalizedEmailMessage } from "@/types/provider";
import type { InterviewEmail } from "@/types/interview";
import { extractDateTimeFromText } from "./date-parser";
import { clamp, extractUrls, generateId } from "./utils";

const POSITIVE_SIGNALS: string[] = [
  "interview",
  "phone screen",
  "technical interview",
  "final round",
  "final interview",
  "onsite",
  "virtual interview",
  "schedule a call",
  "schedule your interview",
  "select a time",
  "choose a time",
  "availability",
  "are you available",
  "recruiter",
  "hiring manager",
  "next steps",
  "zoom",
  "google meet",
  "microsoft teams",
  "calendly",
  "candidate portal",
  "interview invitation",
  "project showcase",
  "presentation",
  "portfolio",
  "demo",
  "case study",
];

const NEGATIVE_SIGNALS: string[] = [
  "application received",
  "thank you for applying",
  "we received your application",
  "your application has been submitted",
  "we'll be in touch",
  "we will be in touch",
  "no-reply",
  "do not reply",
  "unfortunately",
  "not moving forward",
  "we regret to inform you",
  "job alert",
  "new jobs matching",
  "confirm your application",
];

const REJECTION_SIGNALS = [
  "unfortunately",
  "not moving forward",
  "we regret to inform you",
];

const APPLICATION_CONFIRMATION_SIGNALS = [
  "application received",
  "thank you for applying",
  "we received your application",
  "your application has been submitted",
  "we'll be in touch",
  "we will be in touch",
  "confirm your application",
];

const EXPLICIT_INTERVIEW_PHRASES = [
  "interview",
  "phone screen",
  "technical interview",
  "final round",
  "final interview",
  "onsite",
  "virtual interview",
  "interview invitation",
  "recruiter screen",
];

const SCHEDULING_PHRASES = [
  "schedule a call",
  "schedule a",
  "schedule your interview",
  "schedule your",
  "select a time",
  "choose a time",
  "availability",
  "are you available",
  "next steps",
  "calendly",
  "invite you to",
  "would like to invite",
];

const RECRUITER_PHRASES = ["recruiter", "hiring manager"];

const PREP_INSTRUCTION_PHRASES = [
  "project showcase",
  "presentation",
  "assessment",
  "case study",
  "technical discussion",
  "implementation decisions",
  "challenges",
  "technical tradeoffs",
  "portfolio",
  "demo",
  "recruiter screen",
];

const MEETING_LINK_FRAGMENTS = [
  "zoom.us",
  "meet.google",
  "teams.microsoft",
  "calendly.com",
];

const MEETING_KEYWORDS = ["zoom", "google meet", "microsoft teams"];

const INTERVIEW_TYPES: { keyword: string; label: string }[] = [
  { keyword: "final interview", label: "Final Interview" },
  { keyword: "final round", label: "Final Round" },
  { keyword: "project showcase", label: "Project Showcase" },
  { keyword: "presentation", label: "Presentation" },
  { keyword: "case study", label: "Case Study" },
  { keyword: "technical interview", label: "Technical Interview" },
  { keyword: "phone screen", label: "Phone Screen" },
  { keyword: "recruiter screen", label: "Recruiter Screen" },
  { keyword: "onsite", label: "Onsite Interview" },
  { keyword: "virtual interview", label: "Virtual Interview" },
  { keyword: "behavioral interview", label: "Behavioral Interview" },
];

function lc(s?: string): string {
  return (s || "").toLowerCase();
}

function countHits(text: string, phrases: string[]): string[] {
  const hits: string[] = [];
  for (const p of phrases) {
    if (text.includes(p) && !hits.includes(p)) hits.push(p);
  }
  return hits;
}

function extractCompany(email: NormalizedEmailMessage): string | undefined {
  // Try sender domain first
  const from = email.from || "";
  const emailMatch = from.match(/[<\s]([^<\s>]+@[^>\s]+)/) || from.match(/([^\s<>]+@[^\s<>]+)/);
  const address = emailMatch ? emailMatch[1] : from;
  const domainMatch = address.match(/@([\w.-]+)/);
  if (domainMatch) {
    const domain = domainMatch[1].toLowerCase();
    const parts = domain.split(".").filter(Boolean);
    if (parts.length >= 2) {
      const tld = parts[parts.length - 1];
      const sld = parts[parts.length - 2];
      const ignored = new Set([
        "gmail",
        "googlemail",
        "outlook",
        "hotmail",
        "yahoo",
        "icloud",
        "proton",
        "protonmail",
      ]);
      if (!ignored.has(sld)) {
        if (sld === "google" && tld === "com") return "Google";
        return sld.charAt(0).toUpperCase() + sld.slice(1);
      }
    }
  }

  // Look in subject/body for "at <Company>"
  const text = `${email.subject || ""} ${email.body || ""}`;
  const atMatch = text.match(/\bat\s+([A-Z][A-Za-z0-9&.\- ]{1,40})\b/);
  if (atMatch) {
    return atMatch[1].trim().split(/[.!?]/)[0].trim();
  }

  return undefined;
}

function extractRole(text: string): string | undefined {
  const patterns: RegExp[] = [
    /for the\s+([A-Za-z][\w\s/+\-.]{2,60}?)\s+role/i,
    /interview for(?: the)?\s+([A-Za-z][\w\s/+\-.]{2,60}?)(?:\.|,|\son\b|\sat\b|$)/i,
    /\b(?:next steps|invitation|invite|opportunity|interview)\s+for\s+(?:the\s+)?([A-Z][\w\s/+\-.]{2,60}?)(?:\.|,|\son\b|\sat\b|$)/,
    /([A-Za-z][\w\s/+\-.]{2,60}?)\s+position/i,
    /([A-Za-z][\w\s/+\-.]{2,60}?)\s+role at\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      let role = m[1].trim().replace(/[.,;]+$/, "");
      role = role.replace(/\s+/g, " ");
      if (role.length > 3 && role.length < 80) return role;
    }
  }
  return undefined;
}

function extractInterviewType(text: string): string | undefined {
  const labels: string[] = [];
  for (const t of INTERVIEW_TYPES) {
    if (text.includes(t.keyword) && !labels.includes(t.label)) {
      labels.push(t.label);
    }
  }
  if (labels.length === 0) return undefined;
  if (labels.length === 1) return labels[0];
  // Combine final + showcase nicely
  return labels.slice(0, 2).join(" / ");
}

function extractMeetingLink(text: string): string | undefined {
  const urls = extractUrls(text);
  for (const u of urls) {
    const lower = u.toLowerCase();
    if (MEETING_LINK_FRAGMENTS.some((f) => lower.includes(f))) return u;
  }
  return undefined;
}

function extractInterviewerName(text: string): string | undefined {
  const patterns = [
    /\binterviewer:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /\brecruiter:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return undefined;
}

export function classifyInterviewEmail(
  email: NormalizedEmailMessage
): InterviewEmail {
  const combined = `${email.subject || ""}\n${email.snippet || ""}\n${
    email.body || ""
  }`;
  const text = combined.toLowerCase();

  const positiveHits = countHits(text, POSITIVE_SIGNALS);
  const negativeHits = countHits(text, NEGATIVE_SIGNALS);
  const explicitInterview = countHits(text, EXPLICIT_INTERVIEW_PHRASES);
  const schedulingHits = countHits(text, SCHEDULING_PHRASES);
  const recruiterHits = countHits(text, RECRUITER_PHRASES);
  const prepHits = countHits(text, PREP_INSTRUCTION_PHRASES);
  const appConfirmHits = countHits(text, APPLICATION_CONFIRMATION_SIGNALS);
  const rejectionHits = countHits(text, REJECTION_SIGNALS);
  const meetingKwHits = countHits(text, MEETING_KEYWORDS);

  let confidence = 0;
  if (explicitInterview.length > 0) confidence += 0.3;
  if (schedulingHits.length > 0) confidence += 0.2;
  if (recruiterHits.length > 0) confidence += 0.1;
  if (prepHits.length > 0) confidence += 0.15;

  const meetingLink = extractMeetingLink(combined);
  if (meetingLink) confidence += 0.15;
  else if (meetingKwHits.length > 0) confidence += 0.1;

  const { startDateTime, endDateTime, timezone, riskFlags } =
    extractDateTimeFromText(combined);
  if (startDateTime) confidence += 0.2;

  if (appConfirmHits.length > 0) confidence -= 0.4;
  if (rejectionHits.length > 0) confidence -= 0.3;

  confidence = clamp(confidence, 0, 1);
  confidence = Math.round(confidence * 100) / 100;

  const company = extractCompany(email);
  const role = extractRole(combined);
  const interviewType = extractInterviewType(text);
  const interviewerName = extractInterviewerName(combined);

  // Determine status
  let status: InterviewEmail["status"];
  let reason = "";
  const negativeDominant =
    appConfirmHits.length > 0 || rejectionHits.length > 0;

  if (negativeDominant && confidence < 0.6) {
    status = "ignored";
    if (appConfirmHits.length > 0) {
      reason = "Generic application confirmation";
    } else if (rejectionHits.length > 0) {
      reason = "Rejection or non-progress email";
    } else {
      reason = "No interview signals";
    }
  } else if (confidence >= 0.85 && startDateTime) {
    status = "added_to_calendar";
    reason = `Confirmed interview with clear date and time${
      meetingLink || meetingKwHits.length > 0 ? " and meeting link" : ""
    }.`;
  } else if (confidence >= 0.6 && !startDateTime) {
    status = "needs_review";
    if (schedulingHits.includes("availability") || schedulingHits.includes("are you available")) {
      reason =
        "Recruiter asked for availability but no exact time was found.";
    } else {
      reason =
        "Interview-like email but no clear date or time was found.";
    }
  } else if (confidence >= 0.85 && !startDateTime) {
    status = "needs_review";
    reason =
      "Strong interview signals but no date or time could be parsed.";
  } else if (confidence >= 0.6 && startDateTime) {
    status = "added_to_calendar";
    reason = "Interview detected with date and time.";
  } else {
    status = "ignored";
    reason = "No strong interview signals detected.";
  }

  const isInterview = status === "added_to_calendar" || status === "needs_review";

  const allRiskFlags = [...riskFlags];
  if (isInterview && !startDateTime) {
    if (!allRiskFlags.includes("Missing date/time")) {
      allRiskFlags.push("Missing date/time");
    }
  }
  if (isInterview && !meetingLink && meetingKwHits.length === 0) {
    allRiskFlags.push("Meeting link missing");
  }

  return {
    id: generateId("int"),
    provider: email.provider,
    emailId: email.id,
    threadId: email.threadId,

    subject: email.subject,
    from: email.from,
    snippet: email.snippet,
    body: email.body,
    receivedAt: email.receivedAt,

    isInterview,
    confidence,
    status,

    company,
    role,
    interviewType,
    interviewerName,

    startDateTime,
    endDateTime,
    timezone,

    location: undefined,
    meetingLink: meetingLink || (meetingKwHits.length > 0 ? meetingKwHits[0] : undefined),

    reason,
    riskFlags: allRiskFlags,

    createdAt: new Date().toISOString(),
  };
}

export const __testables = {
  POSITIVE_SIGNALS,
  NEGATIVE_SIGNALS,
};
