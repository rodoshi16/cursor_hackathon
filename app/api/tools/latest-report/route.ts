import { getLatestReport } from "@/lib/store";
import { safeJsonResponse } from "@/lib/utils";

export async function GET() {
  const report = getLatestReport();
  if (!report) {
    return safeJsonResponse({ report: null });
  }
  return safeJsonResponse({ report });
}
