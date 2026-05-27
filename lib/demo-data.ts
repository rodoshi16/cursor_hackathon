import type { NormalizedEmailMessage } from "@/types/provider";

export const DEMO_EMAILS: NormalizedEmailMessage[] = [
  {
    id: "demo-google-1",
    threadId: "demo-google-thread-1",
    provider: "google",
    subject: "Your application was received",
    from: "no-reply@google.com",
    snippet:
      "Thank you for applying. We received your application and will be in touch.",
    body: "Thank you for applying. We received your application and will be in touch.",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "demo-google-2",
    threadId: "demo-google-thread-2",
    provider: "google",
    subject: "Final interview invitation for Software Developer Intern",
    from: "talent@shopify.com",
    snippet:
      "Hi Sarah, we would like to invite you to a final interview for the Software Developer Intern role at Shopify...",
    body:
      "Hi Sarah, we would like to invite you to a final interview for the Software Developer Intern role at Shopify on Friday, May 29, 2026 at 2:00 PM. " +
      "Please prepare a 10-minute project showcase and be ready to discuss your implementation decisions, challenges, and technical tradeoffs. " +
      "The interview will be held on Google Meet.",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "demo-microsoft-1",
    threadId: "demo-microsoft-thread-1",
    provider: "microsoft",
    subject: "Next steps for Product Engineering Intern",
    from: "recruiting@wealthsimple.com",
    snippet:
      "Hi Sarah, we were impressed by your application and would like to schedule a recruiter screen...",
    body:
      "Hi Sarah, we were impressed by your application and would like to schedule a recruiter screen. " +
      "Please send over your availability for next week.",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export function getDemoEmailsForProvider(
  provider: "google" | "microsoft" | "all"
): NormalizedEmailMessage[] {
  if (provider === "all") return DEMO_EMAILS;
  return DEMO_EMAILS.filter((e) => e.provider === provider);
}
