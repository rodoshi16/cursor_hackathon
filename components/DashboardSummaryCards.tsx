import type { ScanResult } from "@/types/interview";
import { MetricCard } from "./MetricCard";

export function DashboardSummaryCards({ scan }: { scan: ScanResult | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard label="Scanned" value={scan?.scannedCount ?? 0} />
      <MetricCard
        label="Found"
        value={scan?.interviewsFound ?? 0}
        tone="green"
      />
      <MetricCard
        label="Calendared"
        value={scan?.eventsCreated ?? 0}
        tone="blue"
      />
      <MetricCard
        label="Review"
        value={scan?.needsReview ?? 0}
        tone="orange"
      />
    </div>
  );
}
