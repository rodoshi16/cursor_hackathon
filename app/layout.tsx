import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewRadar — Never miss the interview email in your inbox",
  description:
    "Voice-first interview assistant. Connects to Gmail or Outlook, finds real recruiter emails, adds confirmed interviews to your calendar, and generates evidence-based prep reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
