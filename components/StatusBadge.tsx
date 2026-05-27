import type { InterviewStatus } from "@/types/interview";
import { Check, AlertTriangle, Slash, XOctagon } from "lucide-react";

const META: Record<
  InterviewStatus,
  { label: string; classes: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  added_to_calendar: {
    label: "Added to calendar",
    classes: "border-accent-200 bg-accent-50 text-accent-800",
    Icon: Check,
  },
  needs_review: {
    label: "Needs review",
    classes: "border-amber-200 bg-amber-50 text-amber-800",
    Icon: AlertTriangle,
  },
  ignored: {
    label: "Ignored",
    classes: "border-zinc-200 bg-zinc-50 text-zinc-600",
    Icon: Slash,
  },
  error: {
    label: "Error",
    classes: "border-red-200 bg-red-50 text-red-700",
    Icon: XOctagon,
  },
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: InterviewStatus;
  className?: string;
}) {
  const meta = META[status];
  const Icon = meta.Icon;
  return (
    <span className={`chip ${meta.classes} ${className}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
