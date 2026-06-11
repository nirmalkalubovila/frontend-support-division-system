"use client";

import { Badge } from "@/components/ui/badge";
import type { IssueStatus } from "@/types/global-types";

const statusConfig: Record<
  IssueStatus,
  { label: string; variant: "backlog" | "assigned" | "planned" | "in_progress" | "testing" | "on_hold" | "pending_client" | "resolved" | "closed" | "reopened" }
> = {
  backlog: { label: "Backlog", variant: "backlog" },
  assigned: { label: "Assigned", variant: "assigned" },
  planned: { label: "Planned", variant: "planned" },
  in_progress: { label: "Working On It", variant: "in_progress" },
  testing: { label: "Testing", variant: "testing" },
  on_hold: { label: "On Hold", variant: "on_hold" },
  pending_client: { label: "Pending Client", variant: "pending_client" },
  resolved: { label: "Resolved", variant: "resolved" },
  closed: { label: "Closed", variant: "closed" },
  reopened: { label: "Reopened", variant: "reopened" },
};

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <Badge variant={config.variant} className={className}>
      {status === "in_progress" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />
      )}
      {config.label}
    </Badge>
  );
}

export default StatusBadge;
