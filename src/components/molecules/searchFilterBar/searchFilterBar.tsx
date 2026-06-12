"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
export type ElectionStatus = "draft" | "scheduled" | "open" | "closed" | "archived";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ElectionStatus | "all";
  onStatusFilterChange: (status: ElectionStatus | "all") => void;
}

const STATUS_OPTIONS: { value: ElectionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "open", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          placeholder="Search elections..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusFilterChange(option.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200
              ${
                statusFilter === option.value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
