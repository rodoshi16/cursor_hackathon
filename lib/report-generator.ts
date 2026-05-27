import type { InterviewEmail } from "@/types/interview";
import type {
  ActionTaken,
  ConfirmedDetail,
  DecisionExplanation,
  DecisionReport,
  EvidenceBasedPrepItem,
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
      prepItems: [
        "Prepare leadership examples because the email mentions leadership.",
      ],
    }),
  },
  {
    key: "teamwork",
    label: "Teamwork",
    regex: /\bteamwork\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare teamwork examples because the email mentions teamwork.",
      ],
    }),
  },
  {
    key: "competency",
    label: "Competency",
    regex: /\bcompetenc(?:y|ies)\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare competency-based answers because the email mentions competencies.",
      ],
    }),
  },
  {
    key: "system_design",
    label: "System design",
    regex: /\bsystem design\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare a system design walkthrough because the email mentions system design.",
      ],
    }),
  },
  {
    key: "architecture",
    label: "Architecture",
    regex: /\barchitecture\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Prepare to discuss architecture because the email mentions architecture.",
      ],
    }),
  },
  {
    key: "take_home",
    label: "Take-home",
    regex: /\btake[-\s]?home\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Review your take-home submission because the email mentions a take-home.",
      ],
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
      prepItems: [
        "Prepare for a panel format because the email mentions a panel interview.",
      ],
    }),
  },
  {
    key: "onsite",
    label: "Onsite",
    regex: /\bonsite\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Plan logistics for an onsite because the email mentions onsite.",
      ],
    }),
  },
  {
    key: "virtual",
    label: "Virtual",
    regex: /\bvirtual\b/i,
    build: (m) => ({
      evidence: trimMatch(m),
      prepItems: [
        "Test your video and audio setup because the email mentions a virtual interview.",
      ],
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
      prepItems: [
        "Be ready for HR logistics questions because the email mentions HR.",
      ],
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

// Extract a literal phrase from the body (preserves casing/order). Useful for
// surfacing the exact recruiter wording on the Decision Report.
function findExactPhrase(body: string, needle: RegExp): string | null {
  const m = body.match(needle);
  return m ? trimMatch(m[0]) : null;
}

function buildIgnoredEvidence(body: string): string[] {
  const phrases: string[] = [];
  const patterns: RegExp[] = [
    /thank you for applying/i,
    /we (?:have )?received your application/i,
    /your application (?:was|has been) (?:received|submitted)/i,
    /will be in touch/i,
    /we'll be in touch/i,
    /unfortunately/i,
    /not moving forward/i,
    /we regret to inform you/i,
    /confirm your application/i,
    /no[-\s]?reply/i,
    /do not reply/i,
    /job alert/i,
  ];
  for (const p of patterns) {
    const v = findExactPhrase(body, p);
    if (v && !phrases.some((x) => x.toLowerCase() === v.toLowerCase())) {
      phrases.push(v);
    }
  }
  return phrases;
}

function buildOutcomeEvidence(
  interview: InterviewEmail,
  signalEvidence: string[]
): string[] {
  const body = interview.body || interview.snippet || "";
  const phrases: string[] = [];

  if (interview.status === "ignored") {
    return buildIgnoredEvidence(body);
  }

  // Date phrase
  const datePhrase = findExactPhrase(
    body,
    /(?:(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\w*,?\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i
  );
  if (datePhrase) phrases.push(datePhrase);

  // Meeting link/keyword
  if (interview.meetingLink) {
    const meetMatch = findExactPhrase(body, /google meet|zoom|microsoft teams|calendly/i);
    if (meetMatch) phrases.push(meetMatch);
  }

  // Signal evidence (project showcase, recruiter screen, etc.)
  for (const e of signalEvidence) {
    if (!phrases.some((x) => x.toLowerCase() === e.toLowerCase())) {
      phrases.push(e);
    }
  }

  // Interview-type evidence keywords
  const typeKeywords: RegExp[] = [
    /final interview/i,
    /recruiter screen/i,
    /technical interview/i,
    /phone screen/i,
    /onsite/i,
    /virtual interview/i,
    /behavioral interview/i,
  ];
  for (const re of typeKeywords) {
    const v = findExactPhrase(body, re);
    if (v && !phrases.some((x) => x.toLowerCase() === v.toLowerCase())) {
      phrases.unshift(v);
    }
  }

  // Cap at 6 to keep cards/chips clean
  return phrases.slice(0, 6);
}

function buildDecision(
  interview: InterviewEmail,
  prepSignals: PrepSignal[],
  whatToPrepare: EvidenceBasedPrepItem[],
  evidence: string[]
): DecisionExplanation {
  const hasProjectShowcase = prepSignals.some(
    (s) => s.signal === "project_showcase"
  );
  const body = interview.body || interview.snippet || "";
  const mentionsCoding = /\bcoding\b/i.test(body);
  const hasMeeting =
    !!interview.meetingLink ||
    hasAny(body, ["zoom", "google meet", "microsoft teams", "calendly"]);

  if (interview.status === "added_to_calendar") {
    const actionsTaken: ActionTaken[] = [
      {
        label: "Created calendar event",
        description:
          "Added the interview to your calendar with the recruiter's date and time.",
      },
      {
        label: "Generated Decision Report",
        description:
          "Recorded why this email was treated as a real interview.",
      },
    ];
    if (whatToPrepare.length) {
      actionsTaken.push({
        label: "Added evidence-based prep plan",
        description:
          "Listed only preparation items that are supported by the recruiter email.",
      });
    }
    actionsTaken.push({
      label: "Added report link to calendar description",
      description:
        "Pasted a link back to this Decision Report so the prep is one tap away.",
    });

    const actionsNotTaken: ActionTaken[] = [];
    if (!interview.interviewerName) {
      actionsNotTaken.push({
        label: "Did not infer the interviewer name",
        description:
          "The email did not specify who you'll meet with, so no name was guessed.",
      });
    }
    if (hasProjectShowcase && !mentionsCoding) {
      actionsNotTaken.push({
        label: "Did not add live coding prep",
        description:
          "The email talks about a project showcase but never mentions live coding.",
      });
    }
    actionsNotTaken.push({
      label: "Did not invent extra interview topics",
      description:
        "Only prep items directly supported by the email were included.",
    });

    return {
      summary: `Added to calendar because this email includes a ${
        interview.interviewType?.toLowerCase() || "confirmed interview"
      } with a clear date, time${hasMeeting ? ", and meeting location" : ""}.`,
      why:
        "This email contains interview-specific language and enough scheduling information to safely create a calendar event.",
      evidence,
      actionsTaken,
      actionsNotTaken,
      nextSteps: [
        "Review the evidence-based prep plan.",
        "Confirm anything listed under Needs Clarification with the recruiter.",
        hasMeeting
          ? "Join using the meeting link at the scheduled time."
          : "Confirm the meeting link or location with the recruiter.",
      ],
    };
  }

  if (interview.status === "needs_review") {
    const actionsTaken: ActionTaken[] = [
      {
        label: "Flagged email as needs review",
        description:
          "Marked the email so it shows up in the Needs Review queue.",
      },
      {
        label: "Generated Decision Report",
        description:
          "Recorded the evidence found and what still needs to be confirmed.",
      },
      {
        label: "Did not add to calendar",
        description:
          "No exact date or time was found in the email, so no event was created.",
      },
    ];
    const actionsNotTaken: ActionTaken[] = [
      {
        label: "Did not create a calendar event",
        description:
          "Calendar events are only created when the email includes a clear date and time.",
      },
      {
        label: "Did not invent an interview format",
        description:
          "The email did not specify whether this is technical, behavioral, or logistical.",
      },
    ];

    const nextSteps: string[] = [];
    if (
      prepSignals.some((s) => s.signal === "availability") ||
      /availability/i.test(body)
    ) {
      nextSteps.push("Reply with available time slots.");
    }
    nextSteps.push("Ask the recruiter to confirm the interview format.");
    nextSteps.push("Ask whether anything specific should be prepared.");

    const isRecruiterScreen = (interview.interviewType || "")
      .toLowerCase()
      .includes("recruiter");
    const summary = isRecruiterScreen
      ? "Needs review because this looks like a recruiter screen, but no exact date or time was included."
      : "Needs review because this email looks interview-related but does not include a confirmed date or time.";

    return {
      summary,
      why:
        "This email includes recruiting or scheduling language, but there is not enough information to create a calendar event yet.",
      evidence,
      actionsTaken,
      actionsNotTaken,
      nextSteps,
    };
  }

  // Default: ignored or error
  return {
    summary:
      "Ignored because this email looks like a generic application confirmation, not an interview request.",
    why:
      "This email confirms an application was received, but it does not include an interview invitation, scheduling request, date, time, meeting link, or prep instructions.",
    evidence,
    actionsTaken: [
      {
        label: "Marked email as ignored",
        description:
          "Filtered out so it doesn't crowd your interview queue.",
      },
      {
        label: "Did not create a calendar event",
        description: "No interview date or time was present.",
      },
      {
        label: "Did not create a prep plan",
        description:
          "No interview format or preparation instructions were mentioned.",
      },
    ],
    actionsNotTaken: [
      {
        label: "Did not generate a prep plan",
        description:
          "No interview or prep instructions were found, so nothing would be evidence-based.",
      },
      {
        label: "Did not infer an interview",
        description:
          "Generic 'we received your application' language is not enough to claim there's an interview.",
      },
    ],
    nextSteps: [
      "No action needed.",
      "Continue monitoring future recruiter emails for an interview invitation.",
    ],
  };
}

export function generateDecisionReport(
  interview: InterviewEmail
): DecisionReport {
  const body = interview.body || interview.snippet || "";
  const subject = interview.subject || "";

  const isInterviewLike =
    interview.status === "added_to_calendar" ||
    interview.status === "needs_review";

  const prepSignals = isInterviewLike ? extractPrepSignals(body, subject) : [];

  const whatToPrepareRaw: EvidenceBasedPrepItem[] = [];
  for (const sig of prepSignals) {
    for (const item of sig.prepItems) {
      whatToPrepareRaw.push({ item, evidence: sig.evidence });
    }
  }
  const whatToPrepare = dedupe(whatToPrepareRaw, (v) => v.item);

  const evidenceFound = buildOutcomeEvidence(
    interview,
    prepSignals.map((s) => s.evidence)
  );

  // Confirmed details
  const confirmedDetails: ConfirmedDetail[] = [];
  if (interview.company)
    confirmedDetails.push({ label: "Company", value: interview.company });
  if (interview.role)
    confirmedDetails.push({ label: "Role", value: interview.role });
  if (interview.interviewType)
    confirmedDetails.push({
      label: "Interview type",
      value: interview.interviewType,
    });
  if (interview.startDateTime)
    confirmedDetails.push({
      label: "Date / time",
      value: formatDateTime(interview.startDateTime),
    });
  if (interview.meetingLink)
    confirmedDetails.push({ label: "Meeting", value: interview.meetingLink });
  if (interview.location)
    confirmedDetails.push({ label: "Location", value: interview.location });
  confirmedDetails.push({
    label: "Source email",
    value: interview.subject || "(no subject)",
  });

  // Unknowns
  const unknowns: string[] = [];
  if (interview.status === "ignored") {
    if (!interview.startDateTime) unknowns.push("No date or time found.");
    if (!interview.meetingLink && !hasAny(body, ["zoom", "google meet", "microsoft teams", "calendly"]))
      unknowns.push("No meeting link found.");
    if (prepSignals.length === 0) unknowns.push("No prep instructions found.");
    if (!isInterviewLike) unknowns.push("No interview request found.");
  } else {
    if (!interview.startDateTime)
      unknowns.push("Exact date and time are missing.");
    if (!interview.interviewerName)
      unknowns.push("Interviewer name is not specified.");
    const durationKnown =
      /\binterview\s+will\s+(?:last|run)\s+(?:about\s+)?\d+/i.test(body) ||
      /\b\d+[-\s]?(?:hour|hr|minute|min)s?\s+(?:long\s+)?interview\b/i.test(body) ||
      /\binterview\b[^.]{0,40}\b\d+\s*(?:hour|hr|minute|min)s?\b/i.test(body) ||
      /\btotal\b[^.]{0,30}\b\d+\s*(?:hour|hr|minute|min)s?\b/i.test(body);
    if (!durationKnown) {
      unknowns.push(
        interview.startDateTime
          ? "Exact total interview duration is not specified."
          : "Interview duration is not specified."
      );
    }
    const meetingMentioned =
      !!interview.meetingLink ||
      hasAny(body, ["zoom", "google meet", "microsoft teams", "calendly"]);
    if (!meetingMentioned) unknowns.push("Meeting link is missing.");
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
  }

  // Follow-up questions
  const followUps: string[] = [];
  if (interview.status !== "ignored") {
    const isRecruiterScreen = (interview.interviewType || "")
      .toLowerCase()
      .includes("recruiter");
    const hasProjectShowcase = prepSignals.some(
      (s) => s.signal === "project_showcase"
    );
    if (!interview.startDateTime) {
      followUps.push("Could you confirm the available interview times?");
    }
    if (isRecruiterScreen) {
      followUps.push("How long will the recruiter screen be?");
    } else if (
      !/\binterview\s+will\s+(?:last|run)/i.test(body) &&
      !/\b\d+[-\s]?(?:hour|hr|minute|min)s?\s+(?:long\s+)?interview\b/i.test(body)
    ) {
      followUps.push("Could you confirm the total interview length?");
    }
    if (hasProjectShowcase) {
      if (!/\bcoding\b/i.test(body)) {
        followUps.push("Will there be a live coding portion?");
      }
      followUps.push("Is there a preferred format for the project showcase?");
    }
    if (
      isRecruiterScreen &&
      prepSignals.filter((s) => s.prepItems.length).length <= 2
    ) {
      followUps.push("Is there anything specific I should prepare?");
    }
  }

  // Confidence explanation
  let confidenceExplanation = "";
  if (interview.status === "added_to_calendar" && interview.startDateTime) {
    confidenceExplanation =
      "The email contains strong interview language with a clear date and time, so it was added to your calendar.";
  } else if (interview.status === "needs_review") {
    confidenceExplanation =
      "The email reads like a real recruiter outreach, but no exact date or time was found. It is marked needs review.";
  } else {
    confidenceExplanation =
      "The email did not contain enough interview signals to be added to your calendar.";
  }

  const decision = buildDecision(
    interview,
    prepSignals,
    whatToPrepare,
    evidenceFound
  );

  return {
    id: generateId("rep"),
    provider: interview.provider,
    emailId: interview.emailId,
    interviewId: interview.id,

    outcome: interview.status,
    confidence: interview.confidence,

    company: interview.company,
    role: interview.role,
    interviewType: interview.interviewType,
    interviewerName: interview.interviewerName,

    startDateTime: interview.startDateTime,
    endDateTime: interview.endDateTime,
    timezone: interview.timezone,

    meetingLink: interview.meetingLink,
    location: interview.location,

    emailSubject: interview.subject,
    emailSnippet: interview.snippet,
    sourceEmailBody: interview.body,

    confirmedDetails,
    decision,
    evidenceFound,
    prepSignals,
    whatToPrepare,
    unknowns: dedupe(unknowns, (u) => u),
    suggestedFollowUpQuestions: dedupe(followUps, (q) => q),

    confidenceExplanation,

    calendarEventId: interview.calendarEventId,
    calendarEventUrl: interview.calendarEventUrl,

    createdAt: new Date().toISOString(),
  };
}

// Backwards-compatible alias
export const generateInterviewReport = generateDecisionReport;
