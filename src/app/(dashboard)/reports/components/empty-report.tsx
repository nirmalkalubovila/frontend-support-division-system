"use client";

import { FileText } from "lucide-react";

interface EmptyReportProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyReport({
  title = "No Report Available",
  description = "Generate a report to see your data here.",
  action,
}: EmptyReportProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-2xl bg-[var(--primary)]/5 mb-4">
        <FileText className="h-10 w-10 text-[var(--primary-text)] opacity-40" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] text-center max-w-xs mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
