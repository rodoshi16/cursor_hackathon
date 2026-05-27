import type { InterviewEmail } from "@/types/interview";
import type {
  ConfirmedDetail,
  EvidenceBasedPrepItem,
  InterviewReport,
  PrepSignal,
} from "@/types/report";
import { formatDateTime, generateId } from "./utils";

type PrepSignalDef = {
  key: string;
  label: string;
  regex: RegExp;
  build: (matchedText: string) => {
    evidence: string;
    prepItems: string[];
  };
};

function trimMatch(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Each signal defines:
//  - a regex that captures the longest natural phrase from the email
//  - a build() that produces evidence + prep items strictly from that phrase
const PREP_SIGNAL_DEFS: PrepSignalDef[] = [
  {
    key: "project_showcase",
    label: "Project showcase",
    regex:
      /(?:please\s+)?(?:prepare\s+(?:a|an)\s+)?(?:[\d]+[-\s]?minute\s+)?project showcase/i,
    build: (m) => {
      const txt = trimMatch(m);
      const duration = txt.match(/(\d+)\s*[-\s]?minute/i);
      const prefix = duration ? `Prepare a ${duration[1]}-minute` : "Prepare a";
      return {
        evidence: txt,
        prepItems: [
          `${prefix} project showcase.`,
          "Practice explaining the problem your project solves.",
        ],
      };
    },
  },
  {
    key: "implementation_decisions",
    label: "Implementation decisions",
    regex:
      /(?:(?:to\s+)?discuss(?:\s+(?:your|the))?\s+)?implementation decisions/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Walk through your implementation decisions."],
    }),
  },
  {
    key: "challenges",
    label: "Challenges",
    regex: /\bchallenges\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare to discuss challenges you faced."],
    }),
  },
  {
    key: "technical_tradeoffs",
    label: "Technical tradeoffs",
    regex: /\b(?:technical\s+)?tradeoffs\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare to explain technical tradeoffs."],
    }),
  },
  {
    key: "final_interview",
    label: "Final interview",
    regex: /\bfinal interview\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [],
    }),
  },
  {
    key: "final_round",
    label: "Final round",
    regex: /\bfinal round\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare a concise summary of past experience because the email mentions a final round.",
      ],
    }),
  },
  {
    key: "recruiter_screen",
    label: "Recruiter screen",
    regex: /(?:schedule\s+(?:a|an)\s+)?recruiter screen/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare a short resume walkthrough because the email mentions a recruiter screen.",
      ],
    }),
  },
  {
    key: "availability",
    label: "Availability",
    regex: /(?:send\s+(?:over|us)\s+your\s+)?availability/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare available time slots because the email asks for availability.",
      ],
    }),
  },
  {
    key: "presentation",
    label: "Presentation",
    // avoid double matching project showcase; this is a fallback
    regex: /\b(?:\d+[-\s]?minute\s+)?presentation\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare the presentation referenced in the email."],
    }),
  },
  {
    key: "portfolio",
    label: "Portfolio",
    regex: /\bportfolio\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Have your portfolio ready per the email."],
    }),
  },
  {
    key: "case_study",
    label: "Case study",
    regex: /\bcase study\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare for the case study mentioned in the email."],
    }),
  },
  {
    key: "demo",
    label: "Demo",
    regex: /\bdemo\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare a working demo per the email."],
    }),
  },
  {
    key: "technical_interview",
    label: "Technical interview",
    regex: /\btechnical interview\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare for a technical discussion because the email mentions a technical interview.",
      ],
    }),
  },
  {
    key: "behavioral_interview",
    label: "Behavioral interview",
    regex: /\bbehavioral interview\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare behavioral stories because the email mentions a behavioral interview.",
      ],
    }),
  },
  {
    key: "leadership",
    label: "Leadership",
    regex: /\bleadership\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare leadership examples because the email mentions leadership."],
    }),
  },
  {
    key: "teamwork",
    label: "Teamwork",
    regex: /\bteamwork\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare teamwork examples because the email mentions teamwork."],
    }),
  },
  {
    key: "competency",
    label: "Competency",
    regex: /\bcompetenc(?:y|ies)\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare competency-based answers because the email mentions competencies."],
    }),
  },
  {
    key: "system_design",
    label: "System design",
    regex: /\bsystem design\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare a system design walkthrough because the email mentions system design."],
    }),
  },
  {
    key: "architecture",
    label: "Architecture",
    regex: /\barchitecture\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare to discuss architecture because the email mentions architecture."],
    }),
  },
  {
    key: "take_home",
    label: "Take-home",
    regex: /\btake[-\s]?home\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Review your take-home submission because the email mentions a take-home."],
    }),
  },
  {
    key: "assessment",
    label: "Assessment",
    regex: /\bassessment\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Review for the assessment mentioned in the email."],
    }),
  },
  {
    key: "coding",
    label: "Coding",
    regex: /\bcoding\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Practice coding because the email mentions coding."],
    }),
  },
  {
    key: "debugging",
    label: "Debugging",
    regex: /\bdebugging\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Practice debugging because the email mentions debugging."],
    }),
  },
  {
    key: "panel_interview",
    label: "Panel interview",
    regex: /\bpanel interview\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare for a panel format because the email mentions a panel interview."],
    }),
  },
  {
    key: "onsite",
    label: "Onsite",
    regex: /\bonsite\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Plan logistics for an onsite because the email mentions onsite."],
    }),
  },
  {
    key: "virtual",
    label: "Virtual",
    regex: /\bvirtual\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Test your video and audio setup because the email mentions a virtual interview."],
    }),
  },
  {
    key: "initial_call",
    label: "Initial call",
    regex: /\binitial call\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Prepare a short intro and logistics for an initial call."],
    }),
  },
  {
    key: "hr",
    label: "HR",
    regex: /\bHR\b/,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Be ready for HR logistics questions because the email mentions HR."],
    }),
  },
  {
    key: "materials_required",
    label: "Materials required",
    regex: /\bmaterials required\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: ["Gather the materials required per the email."],
    }),
  },
];

// De-duplicate prep items while preserving insertion order.
function dedupe<T>(arr: T[], key: (v: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of arr) {
    const k = key(v);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out;
}

export function extractPrepSignals(
  emailBody: string,
  subject: string
): PrepSignal[] {
  const haystack = `${subject || ""}\n${emailBody || ""}`;
  const signals: PrepSignal[] = [];

  for (const def of PREP_SIGNAL_DEFS) {
    const match = haystack.match(def.regex);
    if (!match) continue;
    const { evidence, prepItems } = def.build(match[0]);
    signals.push({
      signal: def.key,
      label: def.label,
      evidence,
      prepItems,
    });
  }

  return signals;
}

function hasAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

export function generateInterviewReport(
  interview: InterviewEmail
): InterviewReport {
  const body = interview.body || interview.snippet || "";
  const subject = interview.subject || "";

  const prepSignals = extractPrepSignals(body, subject);

  // What to prepare (flatten and tie to evidence).
  const whatToPrepareRaw: EvidenceBasedPrepItem[] = [];
  for (const sig of prepSignals) {
    for (const item of sig.prepItems) {
      whatToPrepareRaw.push({ item, evidence: sig.evidence });
    }
  }

  // If recruiter_screen is present, prefer ordering it first; if project_showcase
  // is present, ensure showcase items come before tradeoffs/challenges/decisions.
  // Order is already insertion order from PREP_SIGNAL_DEFS, which puts
  // project_showcase, implementation_decisions, challenges, technical_tradeoffs
  // in that exact order — matching the expected demo output.

  const whatToPrepare = dedupe(whatToPrepareRaw, (v) => v.item);

  const evidenceFound = dedupe(
    prepSignals.map((s) => s.evidence),
    (e) => e.toLowerCase()
  );

  // Confirmed details
  const confirmedDetails: ConfirmedDetail[] = [];
  if (interview.company) {
    confirmedDetails.push({ label: "Company", value: interview.company });
  }
  if (interview.role) {
    confirmedDetails.push({ label: "Role", value: interview.role });
  }
  if (interview.interviewType) {
    confirmedDetails.push({
      label: "Interview type",
      value: interview.interviewType,
    });
  }
  if (interview.startDateTime) {
    confirmedDetails.push({
      label: "Date / time",
      value: formatDateTime(interview.startDateTime),
    });
  }
  if (interview.meetingLink) {
    confirmedDetails.push({
      label: "Meeting",
      value: interview.meetingLink,
    });
  }
  if (interview.location) {
    confirmedDetails.push({ label: "Location", value: interview.location });
  }

  // Build unknowns
  const unknowns: string[] = [];
  if (!interview.startDateTime) {
    unknowns.push("Exact date and time are missing.");
  }
  if (!interview.interviewerName) {
    unknowns.push("Interviewer name is not specified.");
  }
  // Total interview duration is only "known" if the email explicitly states
  // how long the interview itself runs. A 10-minute project showcase does not
  // tell us the total interview length.
  const durationKnown =
    /\binterview\s+will\s+(?:last|run)\s+(?:about\s+)?\d+/i.test(body) ||
    /\b\d+[-\s]?(?:hour|hr|minute|min)s?\s+(?:long\s+)?interview\b/i.test(body) ||
    /\binterview\b[^.]{0,40}\b\d+\s*(?:hour|hr|minute|min)s?\b/i.test(body) ||
    /\btotal\b[^.]{0,30}\b\d+\s*(?:hour|hr|minute|min)s?\b/i.test(body);
  if (!durationKnown) {
    if (interview.startDateTime) {
      unknowns.push("Exact total interview duration is not specified.");
    } else {
      unknowns.push("Interview duration is not specified.");
    }
  }
  const meetingMentioned =
    !!interview.meetingLink ||
    hasAny(body, ["zoom", "google meet", "microsoft teams", "calendly"]);
  if (!meetingMentioned) {
    unknowns.push("Meeting link is missing.");
  }
  const hasTechnical = hasAny(body, [
    "technical interview",
    "technical tradeoffs",
    "implementation decisions",
    "system design",
    "coding",
    "debugging",
    "architecture",
  ]);
  const hasBehavioral = hasAny(body, [
    "behavioral",
    "competency",
    "leadership",
    "teamwork",
  ]);
  if (!hasTechnical && !hasBehavioral) {
    unknowns.push(
      "The email does not specify whether this is technical or behavioral."
    );
  }
  const hasProjectShowcase = prepSignals.some(
    (s) => s.signal === "project_showcase"
  );
  if (hasProjectShowcase && !/\bcoding\b/i.test(body)) {
    unknowns.push("The email does not say whether there will be live coding.");
  }

  // Suggested follow-up questions
  const followUps: string[] = [];
  const interviewTypeLower = (interview.interviewType || "").toLowerCase();
  const isRecruiterScreen = interviewTypeLower.includes("recruiter");

  if (!interview.startDateTime) {
    followUps.push("Could you confirm the available interview times?");
  }
  if (isRecruiterScreen) {
    followUps.push("How long will the recruiter screen be?");
  } else if (!durationKnown) {
    followUps.push("Could you confirm the total interview length?");
  }
  if (hasProjectShowcase) {
    if (!/\bcoding\b/i.test(body)) {
      followUps.push("Will there be a live coding portion?");
    }
    followUps.push("Is there a preferred format for the project showcase?");
  }
  if (isRecruiterScreen && prepSignals.filter((s) => s.prepItems.length).length <= 2) {
    followUps.push("Is there anything specific I should prepare?");
  }

  // Confidence explanation
  let confidenceExplanation = "";
  if (interview.confidence >= 0.85 && interview.startDateTime) {
    confidenceExplanation =
      "The email contains strong interview language with a clear date and time, so it was added to your calendar.";
  } else if (interview.confidence >= 0.6 && !interview.startDateTime) {
    confidenceExplanation =
      "The email reads like a real recruiter outreach, but no exact date or time was found. It is marked needs review.";
  } else {
    confidenceExplanation =
      "The email did not contain enough interview signals to be added to your calendar.";
  }

  const report: InterviewReport = {
    id: generateId("rep"),
    provider: interview.provider,
    interviewId: interview.id,
    emailId: interview.emailId,

    company: interview.company,
    role: interview.role,
    interviewType: interview.interviewType,
    interviewerName: interview.interviewerName,

    startDateTime: interview.startDateTime,
    endDateTime: interview.endDateTime,
    timezone: interview.timezone,

    location: interview.location,
    meetingLink: interview.meetingLink,

    emailSubject: interview.subject,
    emailSnippet: interview.snippet,
    sourceEmailBody: interview.body,

    confirmedDetails,
    evidenceFound,
    prepSignals,
    whatToPrepare,
    unknowns: dedupe(unknowns, (u) => u),
    suggestedFollowUpQuestions: dedupe(followUps, (q) => q),
    confidenceExplanation,

    confidence: interview.confidence,
    createdAt: new Date().toISOString(),
  };

  return report;
}
