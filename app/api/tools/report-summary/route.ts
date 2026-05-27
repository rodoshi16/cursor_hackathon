import { getDecisionReportById } from "@/lib/store";
import { formatDateTime, safeJsonResponse } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reportId = url.searchParams.get("reportId");
  if (!reportId) {
    return safeJsonResponse(
      { ok: false, error: "reportId query param required." },
      { status: 400 }
    );
  }
  const report = getDecisionReportById(reportId);
  if (!report) {
    return safeJsonResponse(
      { ok: false, error: "Decision report not found." },
      { status: 404 }
    );
  }

  const lines: string[] = [];
  lines.push(`Decision: ${report.outcome.replace(/_/g, " ")}.`);
  if (report.company || report.role) {
    lines.push(
      `${report.company ? report.company : "Unknown company"}${
        report.role ? ` — ${report.role}` : ""
      }.`
    );
  }
  lines.push(report.decision.summary);
  if (report.startDateTime) {
    lines.push(`When: ${formatDateTime(report.startDateTime)}.`);
  }
  if (report.decision.evidence.length) {
    lines.push(
      `Evidence from the email: ${report.decision.evidence
        .map((e) => `"${e}"`)
        .join(", ")}.`
    );
  }
  if (report.decision.actionsTaken.length) {
    lines.push("Actions taken:");
    for (const a of report.decision.actionsTaken) lines.push(`- ${a.label}`);
  }
  if (report.whatToPrepare.length) {
    lines.push("Prep (evidence-based):");
    for (const it of report.whatToPrepare) {
      lines.push(`- ${it.item} (Based on: "${it.evidence}")`);
    }
  } else if (
    report.outcome === "added_to_calendar" ||
    report.outcome === "needs_review"
  ) {
    lines.push(
      "No prep plan was created because the email did not include specific preparation instructions."
    );
  }
  if (report.unknowns.length) {
    lines.push("Unclear: " + report.unknowns.join(" "));
  }

  return safeJsonResponse({
    ok: true,
    reportId: report.id,
    summary: lines.join("\n"),
    report,
  });
}
