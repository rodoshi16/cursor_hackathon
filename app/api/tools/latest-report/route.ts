import { getLatestDecisionReport } from "@/lib/store";
import { safeJsonResponse } from "@/lib/utils";

export async function GET() {
  const report = getLatestDecisionReport();
  if (!report) {
    return safeJsonResponse({
      report: null,
      message: "No decision reports yet. Run a scan first.",
    });
  }
  return safeJsonResponse({
    report,
    message: `Latest decision: ${report.outcome} for ${
      report.company || "an unknown sender"
    }.`,
  });
}
