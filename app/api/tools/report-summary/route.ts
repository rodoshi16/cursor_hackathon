import { getReportById } from "@/lib/store";
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
  const report = getReportById(reportId);
  if (!report) {
    return safeJsonResponse(
      { ok: false, error: "Report not found." },
      { status: 404 }
    );
  }

  const lines: string[] = [];
  if (report.company || report.role) {
    lines.push(
      `Interview${report.company ? ` with ${report.company}` : ""}${
        report.role ? ` for the ${report.role} role` : ""
      }.`
    );
  }
  if (report.interviewType) {
    lines.push(`Type: ${report.interviewType}.`);
  }
  if (report.startDateTime) {
    lines.push(`When: ${formatDateTime(report.startDateTime)}.`);
  } else {
    lines.push("No exact date or time was found.");
  }
  if (report.evidenceFound.length) {
    lines.push(
      `Evidence from the email: ${report.evidenceFound
        .map((e) => `"${e}"`)
        .join(", ")}.`
    );
  }
  if (report.whatToPrepare.length) {
    lines.push("What to prepare:");
    for (const it of report.whatToPrepare) {
      lines.push(`- ${it.item} (Based on: "${it.evidence}")`);
    }
  } else {
    lines.push(
      "The email does not include enough detail to create a specific prep plan."
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
