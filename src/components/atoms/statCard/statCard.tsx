import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)]">
        <Icon className="h-5 w-5 text-[var(--primary)]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[var(--text-secondary)] truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-semibold text-[var(--text-primary)]">{value}</p>
          {trend && (
            <span className="text-xs text-[var(--secondary)]">{trend}</span>
          )}
        </div>
      </div>
    </div>
  );
}
