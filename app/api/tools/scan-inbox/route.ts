import { runScan } from "@/lib/scan-service";
import { safeJsonResponse } from "@/lib/utils";

type Body = { provider?: "google" | "microsoft" | "all" };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const provider = body.provider || "all";
  try {
    const scanResult = await runScan(provider);
    const addedToCalendar = scanResult.results.filter(
      (r) => r.status === "added_to_calendar"
    );
    const needsReview = scanResult.results.filter(
      (r) => r.status === "needs_review"
    );
    const summaryParts: string[] = [];
    summaryParts.push(
      `Scanned ${scanResult.scannedCount} email${
        scanResult.scannedCount === 1 ? "" : "s"
      }.`
    );
    if (addedToCalendar.length) {
      summaryParts.push(
        `Added ${addedToCalendar.length} interview${
          addedToCalendar.length === 1 ? "" : "s"
        } to your calendar: ${addedToCalendar
          .map((i) => i.company || i.subject)
          .join(", ")}.`
      );
    }
    if (needsReview.length) {
      summaryParts.push(
        `${needsReview.length} email${
          needsReview.length === 1 ? "" : "s"
        } need${needsReview.length === 1 ? "s" : ""} review: ${needsReview
          .map((i) => i.company || i.subject)
          .join(", ")}.`
      );
    }
    if (scanResult.ignoredCount) {
      summaryParts.push(
        `Ignored ${scanResult.ignoredCount} non-interview email${
          scanResult.ignoredCount === 1 ? "" : "s"
        }.`
      );
    }
    return safeJsonResponse({
      message: summaryParts.join(" "),
      scanResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    return safeJsonResponse({ message, error: message }, { status: 500 });
  }
}
