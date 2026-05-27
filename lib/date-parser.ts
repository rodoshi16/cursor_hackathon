const DEFAULT_TIMEZONE = "America/Toronto";

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

export type ExtractedDateTime = {
  startDateTime?: string;
  endDateTime?: string;
  timezone: string;
  riskFlags: string[];
};

function buildIsoFromParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  // Produce an ISO string that *looks* like the local time the user typed.
  // We don't try to convert across timezones for the MVP — the timezone string
  // is attached separately so calendar APIs use the right zone.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
}

function parseTime(
  raw: string | undefined
): { hour: number; minute: number } | null {
  if (!raw) return null;
  const m = raw
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function rollYearIfPast(year: number, month: number, day: number): number {
  const candidate = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (candidate.getTime() < today.getTime()) return year + 1;
  return year;
}

export function extractDateTimeFromText(text: string): ExtractedDateTime {
  const riskFlags: string[] = [];
  if (!text || !text.trim()) {
    riskFlags.push("Could not confidently detect interview date or time.");
    return { timezone: DEFAULT_TIMEZONE, riskFlags };
  }

  const cleaned = text.replace(/\s+/g, " ");
  const now = new Date();
  const currentYear = now.getFullYear();

  let startDateTime: string | undefined;

  // 1. Explicit ISO date: 2026-06-03 [at] HH:MM
  const isoRe =
    /(\d{4})-(\d{2})-(\d{2})(?:\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i;
  const isoMatch = cleaned.match(isoRe);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const time = parseTime(isoMatch[4]);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const h = time?.hour ?? 9;
      const m = time?.minute ?? 0;
      startDateTime = buildIsoFromParts(year, month, day, h, m);
    }
  }

  // 2. Month-name date: "Friday, May 29, 2026 at 2:00 PM" or "May 29 at 2 PM"
  if (!startDateTime) {
    const monthRe = new RegExp(
      String.raw`(?:(?:(?:sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\w*)[,\s]+)?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?(?:\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?`,
      "i"
    );
    const mn = cleaned.match(monthRe);
    if (mn) {
      const monthKey = mn[1].toLowerCase();
      const month = MONTHS[monthKey];
      const day = parseInt(mn[2], 10);
      let year = mn[3] ? parseInt(mn[3], 10) : currentYear;
      if (!mn[3]) year = rollYearIfPast(year, month, day);
      const time = parseTime(mn[4]);
      const h = time?.hour ?? 9;
      const m = time?.minute ?? 0;
      if (!isNaN(month) && !isNaN(day)) {
        startDateTime = buildIsoFromParts(year, month, day, h, m);
      }
    }
  }

  // 3. "Tomorrow at 3 PM"
  if (!startDateTime) {
    const tom = cleaned.match(
      /tomorrow(?:\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i
    );
    if (tom) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const time = parseTime(tom[1]);
      const h = time?.hour ?? 9;
      const m = time?.minute ?? 0;
      startDateTime = buildIsoFromParts(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        h,
        m
      );
    }
  }

  // 4. "Friday at 10 AM" — next weekday
  if (!startDateTime) {
    const wd = cleaned.match(
      /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b(?:\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i
    );
    if (wd) {
      const target = WEEKDAYS[wd[1].toLowerCase()];
      if (target !== undefined) {
        const cursor = new Date(now);
        const diff = (target - cursor.getDay() + 7) % 7 || 7;
        cursor.setDate(cursor.getDate() + diff);
        const time = parseTime(wd[2]);
        const h = time?.hour ?? 9;
        const m = time?.minute ?? 0;
        startDateTime = buildIsoFromParts(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate(),
          h,
          m
        );
      }
    }
  }

  if (!startDateTime) {
    riskFlags.push("Could not confidently detect interview date or time.");
    return { timezone: DEFAULT_TIMEZONE, riskFlags };
  }

  // Default 30 minute end
  const start = new Date(startDateTime);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  const pad = (n: number) => String(n).padStart(2, "0");
  const endDateTime = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(
    end.getDate()
  )}T${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

  return {
    startDateTime,
    endDateTime,
    timezone: DEFAULT_TIMEZONE,
    riskFlags,
  };
}
