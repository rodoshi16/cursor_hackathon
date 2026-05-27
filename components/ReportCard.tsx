import Link from "next/link";
import type { InterviewReport } from "@/types/report";
import { formatDateTime } from "@/lib/utils";

export function ReportCard({ report }: { report: InterviewReport }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="surface block p-4 transition-colors hover:border-zinc-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">
            {report.company || "Unknown company"} —{" "}
            {report.role || report.emailSubject}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {report.interviewType || "Interview"} ·{" "}
            {report.startDateTime
              ? formatDateTime(report.startDateTime)
              : "No date"}
          </div>
        </div>
        <div className="shrink-0 text-xs text-zinc-500">View →</div>
      </div>
    </Link>
  );
}
