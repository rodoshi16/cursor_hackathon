import { runScan } from "@/lib/scan-service";
import { safeJsonResponse } from "@/lib/utils";

type ScanBody = { provider?: "google" | "microsoft" | "all" };

export async function POST(req: Request) {
  let body: ScanBody = {};
  try {
    body = (await req.json()) as ScanBody;
  } catch {
    body = {};
  }
  const provider = body.provider || "all";
  try {
    const result = await runScan(provider);
    return safeJsonResponse({ ok: true, scanResult: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    return safeJsonResponse({ ok: false, error: message }, { status: 500 });
  }
}
