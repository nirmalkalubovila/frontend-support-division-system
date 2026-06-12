"use client";

import React, { useState, useMemo } from "react";
import {
  Ticket,
  Plus,
  Filter,
  Search,
  Clock,
  User as UserIcon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button, Badge, Input, Select } from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { CreateIssueModal, IssueDetailsModal } from "@/components";
import { KANBAN_COLUMNS, PRIORITIES, ISSUE_TYPES } from "@/lib/constants";
import { useGetIssues, type Issue } from "@/api/services/issue-management/issue-service";
import type { Client } from "@/api/services/project-management/client-service";
import type { Project } from "@/api/services/project-management/project-service";

// ──────────────────────────────────────────────────────────────
// Priority color mapping
// ──────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "var(--error)",
  High: "#f97316",
  Medium: "var(--warning)",
  Low: "var(--success)",
};

const PRIORITY_BG: Record<string, string> = {
  Critical: "rgba(239, 68, 68, 0.12)",
  High: "rgba(249, 115, 22, 0.12)",
  Medium: "rgba(234, 179, 8, 0.12)",
  Low: "rgba(34, 197, 94, 0.12)",
};

// ──────────────────────────────────────────────────────────────
// Issue Card
// ──────────────────────────────────────────────────────────────
function IssueCard({ issue, onClick }: { issue: Issue; onClick?: () => void }) {
  const client = typeof issue.client === "object" ? issue.client : null;
  const project = typeof issue.project === "object" ? issue.project : null;
  const assignee = typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo : null;

  const dueDate = new Date(issue.dueDate);
  const isOverdue = dueDate < new Date() && !["Resolved", "Closed"].includes(issue.status);
  const dueDateStr = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      onClick={onClick}
      className="group bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3.5 hover:border-[var(--border-hover)] hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Issue ID & Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-medium text-[var(--text-tertiary)]">
          {issue.issueId}
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
          style={{
            color: PRIORITY_COLORS[issue.priority],
            backgroundColor: PRIORITY_BG[issue.priority],
          }}
        >
          {issue.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors">
        {issue.title}
      </h4>

      {/* Type Badge */}
      <div className="mb-2.5">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {issue.type}
        </Badge>
      </div>

      {/* Meta Row */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
        {/* Client / Project */}
        <span className="truncate max-w-[120px]" title={project?.name ?? ""}>
          {client?.code ?? "—"} / {project?.name ?? "—"}
        </span>

        <div className="flex items-center gap-2">
          {/* Due Date */}
          <span
            className={`flex items-center gap-0.5 ${
              isOverdue ? "text-[var(--error)] font-medium" : ""
            }`}
          >
            {isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
            <Clock className="h-2.5 w-2.5" />
            {dueDateStr}
          </span>

          {/* Assignee Avatar */}
          {assignee ? (
            <div
              className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[9px] font-bold"
              title={assignee.name}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
              <UserIcon className="h-2.5 w-2.5 text-[var(--text-tertiary)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Issues Page
// ──────────────────────────────────────────────────────────────
export default function IssuesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");

  // Fetch all issues (large limit to get everything for kanban view)
  const { data: issuesData, isLoading } = useGetIssues({
    limit: 200,
    search: search || undefined,
    priority: filterPriority || undefined,
    type: filterType || undefined,
    sortBy: "createdAt:desc",
  });

  const issues: Issue[] = issuesData?.data ?? [];

  // Group issues by status for kanban columns
  const issuesByStatus = useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    for (const col of KANBAN_COLUMNS) {
      grouped[col] = [];
    }
    for (const issue of issues) {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      } else {
        // Issues with statuses not in Kanban columns (e.g. On Hold, Pending Client, Closed)
        // go into Backlog as a fallback display
        if (grouped["Backlog"]) {
          grouped["Backlog"].push(issue);
        }
      }
    }
    return grouped;
  }, [issues]);

  const totalIssues = issues.length;
  const hasActiveFilters = !!filterPriority || !!filterType;

  const clearFilters = () => {
    setFilterPriority("");
    setFilterType("");
    setSearch("");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Ticket className="h-6 w-6 text-[var(--primary)]" />
            Issues
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isLoading ? "Loading..." : `${totalIssues} issues across ${KANBAN_COLUMNS.length} columns`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`gap-1 ${hasActiveFilters ? "border-[var(--primary)] text-[var(--primary)]" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {hasActiveFilters && (
              <Badge variant="default" className="text-[9px] px-1 py-0 ml-1">
                !
              </Badge>
            )}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <ValidatePermission permission="issues.issue.create">
            <Button
              size="sm"
              className="gap-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Issue
            </Button>
          </ValidatePermission>
        </div>
      </div>

      {/* Search & Filters Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-fade-in">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search by title or issue ID..."
              className="pl-9 h-9 bg-[var(--background)]"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="All Priorities"
            value={filterPriority}
            onChange={(v) => setFilterPriority(v)}
            options={[
              { label: "All Priorities", value: "" },
              ...PRIORITIES.map((p) => ({ label: p, value: p })),
            ]}
            className="w-40 h-9"
          />
          <Select
            placeholder="All Types"
            value={filterType}
            onChange={(v) => setFilterType(v)}
            options={[
              { label: "All Types", value: "" },
              ...ISSUE_TYPES.map((t) => ({ label: t, value: t })),
            ]}
            className="w-44 h-9"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div className="kanban-scroll flex gap-4 pb-4 min-h-[calc(100vh-260px)] overflow-x-auto">
        {KANBAN_COLUMNS.map((column) => {
          const columnIssues = issuesByStatus[column] ?? [];
          return (
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
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{column}</h3>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {columnIssues.length}
                </Badge>
              </div>

              {/* Issue Cards */}
              <div className="space-y-2.5 max-h-[calc(100vh-340px)] overflow-y-auto pr-0.5">
                {isLoading ? (
                  // Skeleton loaders
                  <>
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3.5 animate-pulse"
                      >
                        <div className="flex justify-between mb-2">
                          <div className="h-3 w-16 bg-[var(--surface-hover)] rounded" />
                          <div className="h-3 w-12 bg-[var(--surface-hover)] rounded" />
                        </div>
                        <div className="h-4 w-full bg-[var(--surface-hover)] rounded mb-2" />
                        <div className="h-3 w-2/3 bg-[var(--surface-hover)] rounded mb-2" />
                        <div className="flex justify-between">
                          <div className="h-3 w-20 bg-[var(--surface-hover)] rounded" />
                          <div className="h-5 w-5 bg-[var(--surface-hover)] rounded-full" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : columnIssues.length > 0 ? (
                  columnIssues.map((issue) => (
                    <IssueCard
                      key={issue._id}
                      issue={issue}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setShowDetailsModal(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--text-tertiary)]">
                    No issues
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal open={showCreateModal} onOpenChange={setShowCreateModal} />

      {/* Issue Details Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </div>
  );
}
