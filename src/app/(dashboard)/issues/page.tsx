"use client";

import { Ticket, Plus, Filter } from "lucide-react";
import { Button, Badge } from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { KANBAN_COLUMNS } from "@/lib/constants";

export default function IssuesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Ticket className="h-6 w-6 text-[var(--primary)]" />
            Issues
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage and track all support issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <ValidatePermission permission="issues.issue.create">
            <Button size="sm" className="gap-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
              <Plus className="h-3.5 w-3.5" />
              New Issue
            </Button>
          </ValidatePermission>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-scroll flex gap-4 pb-4 min-h-[calc(100vh-220px)]">
        {KANBAN_COLUMNS.map((column) => (
          <div
            key={column}
            className="flex-shrink-0 w-72 bg-[var(--background)] rounded-xl border border-[var(--border)] p-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: `var(--status-${column.toLowerCase().replace(/ /g, "-")})`,
                  }}
                />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {column}
                </h3>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                0
              </Badge>
            </div>

            {/* Empty State */}
            <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--text-tertiary)]">
              No issues
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
