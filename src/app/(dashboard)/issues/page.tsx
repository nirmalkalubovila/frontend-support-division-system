"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Calendar,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Button, Badge, Input, Select, Card, CardContent } from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { CreateIssueModal, IssueDetailsModal } from "@/components";
import { KANBAN_COLUMNS, PRIORITIES, ISSUE_TYPES } from "@/lib/constants";
import { useGetIssues, type Issue } from "@/api/services/issue-management/issue-service";

// ──────────────────────────────────────────────────────────────
// Priority color mapping
// ──────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "var(--priority-critical)",
  High: "var(--priority-high)",
  Medium: "var(--priority-medium)",
  Low: "var(--priority-low)",
};

const PRIORITY_BG: Record<string, string> = {
  Critical: "rgba(239, 68, 68, 0.12)",
  High: "rgba(249, 115, 22, 0.12)",
  Medium: "rgba(234, 179, 8, 0.12)",
  Low: "rgba(107, 114, 128, 0.12)",
};

const PRIORITY_BORDER_CLASSES: Record<string, string> = {
  Critical: "border-l-4 border-l-[var(--priority-critical)] bg-gradient-to-r from-red-500/[0.03] to-transparent",
  High: "border-l-4 border-l-[var(--priority-high)] bg-gradient-to-r from-orange-500/[0.03] to-transparent",
  Medium: "border-l-4 border-l-[var(--priority-medium)] bg-gradient-to-r from-yellow-500/[0.03] to-transparent",
  Low: "border-l-4 border-l-[var(--priority-low)] bg-gradient-to-r from-gray-500/[0.03] to-transparent",
};

// ──────────────────────────────────────────────────────────────
// Issue Type Pill Styling
// ──────────────────────────────────────────────────────────────
const getIssueTypeStyle = (type: string) => {
  switch (type) {
    case "Bug":
      return "bg-[var(--destructive-light)] text-[var(--destructive)] border border-[var(--destructive)]/10";
    case "Feature Request":
      return "bg-[var(--primary-light)] text-[var(--primary-text)] border border-[var(--primary)]/10";
    case "Access Issue":
      return "bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20";
    case "Data Correction":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    case "Performance":
      return "bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20";
    case "Consultation":
      return "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20";
    default:
      return "bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]";
  }
};

// ──────────────────────────────────────────────────────────────
// Issue Card Component
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
      className={`group relative rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
        PRIORITY_BORDER_CLASSES[issue.priority] || "bg-[var(--surface)]"
      }`}
      style={{ backgroundColor: "var(--surface)" }}
    >
      {/* Issue ID & Priority */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-mono font-medium text-[var(--text-tertiary)] group-hover:text-[var(--primary-text)] transition-colors">
          {issue.issueId}
        </span>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm"
          style={{
            color: PRIORITY_COLORS[issue.priority],
            backgroundColor: PRIORITY_BG[issue.priority],
            border: `1px solid ${PRIORITY_COLORS[issue.priority]}20`,
          }}
        >
          {issue.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors leading-snug">
        {issue.title}
      </h4>

      {/* Type Badge */}
      <div className="mb-3">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getIssueTypeStyle(issue.type)}`}>
          {issue.type}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)] my-2.5 opacity-60" />

      {/* Meta Row */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] pt-0.5">
        {/* Client / Project */}
        <span className="truncate max-w-[125px] font-medium" title={project?.name ?? ""}>
          <span className="text-[var(--text-secondary)]">{client?.code ?? "—"}</span>
          <span className="mx-1 text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)] font-semibold">{project?.name ?? "—"}</span>
        </span>

        <div className="flex items-center gap-2">
          {/* Due Date */}
          <span
            className={`flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-md bg-[var(--background)] ${
              isOverdue ? "text-[var(--destructive)] bg-[var(--destructive-light)] font-semibold animate-pulse-soft" : ""
            }`}
          >
            {isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
            <Clock className="h-2.5 w-2.5" />
            {dueDateStr}
          </span>

          {/* Assignee Avatar */}
          {assignee ? (
            <div
              className="h-5.5 w-5.5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[9px] font-bold shadow-sm ring-1 ring-[var(--border)]"
              title={`Assigned to: ${assignee.name}`}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="h-5.5 w-5.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center" title="Unassigned">
              <UserIcon className="h-2.5 w-2.5 text-[var(--text-tertiary)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Project Card & Grouping Types
// ──────────────────────────────────────────────────────────────
interface ProjectGroup {
  id: string;
  name: string;
  clientCode: string;
  clientName: string;
  issues: Issue[];
}

function ProjectCard({
  group,
  viewMode,
  isExpanded,
  onToggle,
  onIssueClick,
}: {
  group: ProjectGroup;
  viewMode: "board" | "list";
  isExpanded: boolean;
  onToggle: () => void;
  onIssueClick: (issue: Issue) => void;
}) {
  const issues = group.issues;

  // Calculate project specific stats
  const total = issues.length;
  const critical = issues.filter((i) => i.priority === "Critical" || i.priority === "High").length;
  const active = issues.filter((i) => ["Assigned", "In Progress", "Testing", "Planned Solution"].includes(i.status)).length;
  const resolved = issues.filter((i) => ["Resolved", "Closed"].includes(i.status)).length;
  const completionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Group issues by status for this project's Kanban board
  const projectIssuesByStatus = useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    for (const col of KANBAN_COLUMNS) {
      grouped[col] = [];
    }
    for (const issue of issues) {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      } else {
        if (grouped["Backlog"]) {
          grouped["Backlog"].push(issue);
        }
      }
    }
    return grouped;
  }, [issues]);

  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden shadow-sm transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-md">
      {/* Card Header (clickable) */}
      <div
        onClick={onToggle}
        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-[var(--surface-hover)]/20 hover:bg-[var(--surface-hover)]/40 transition-colors"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* Client badge */}
          {group.clientCode ? (
            <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded bg-[var(--primary-light)] text-[var(--primary-text)] uppercase tracking-wider shadow-sm">
              {group.clientCode}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded bg-[var(--surface-hover)] text-[var(--text-tertiary)] uppercase tracking-wider shadow-sm">
              GEN
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[var(--text-primary)] truncate" title={group.name}>
              {group.name}
            </h3>
            {group.clientName && (
              <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{group.clientName}</p>
            )}
          </div>
        </div>

        {/* Stats & Progress Bar */}
        <div className="flex flex-wrap items-center gap-6 md:gap-8 shrink-0">
          {/* Stats Badges */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total</span>
              <span className="font-bold text-[var(--text-secondary)] mt-0.5">{total}</span>
            </div>

            <div className="h-6 w-px bg-[var(--border)]" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Breach Risk</span>
              <span className={`font-bold mt-0.5 flex items-center gap-1 ${critical > 0 ? "text-[var(--destructive)] font-extrabold animate-pulse-soft" : "text-[var(--text-secondary)]"}`}>
                {critical}
                {critical > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[var(--destructive)] animate-ping" />}
              </span>
            </div>

            <div className="h-6 w-px bg-[var(--border)]" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Active</span>
              <span className="font-bold text-[var(--warning)] mt-0.5">{active}</span>
            </div>

            <div className="h-6 w-px bg-[var(--border)]" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Resolved</span>
              <span className="font-bold text-[var(--success)] mt-0.5">{resolved}</span>
            </div>
          </div>

          {/* Completion Progress Bar */}
          <div className="w-28 md:w-36 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-[var(--text-tertiary)]">Resolved Rate</span>
              <span className="font-bold text-[var(--success)]">{completionRate}%</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden border border-[var(--border)]/20">
              <div
                className="h-full bg-gradient-to-r from-[var(--success)] to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Expand Chevron */}
          <button className="h-8 w-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors">
            <ChevronDown
              className={`h-5 w-5 text-[var(--text-tertiary)] transition-transform duration-300 ${
                isExpanded ? "rotate-180 text-[var(--primary)]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Issues View Container */}
      {isExpanded && (
        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface)]/40 dark:bg-[var(--surface)]/5">
          {viewMode === "list" ? (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Title</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Assignee</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {issues.map((issue) => {
                    const assignee = typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo : null;
                    const dueDate = new Date(issue.dueDate);
                    const isOverdue = dueDate < new Date() && !["Resolved", "Closed"].includes(issue.status);

                    return (
                      <tr
                        key={issue._id}
                        className="hover:bg-[var(--surface-hover)]/40 transition-colors cursor-pointer group"
                        onClick={() => onIssueClick(issue)}
                      >
                        <td className="py-3 px-4 font-mono text-[var(--text-secondary)] font-semibold whitespace-nowrap">
                          {issue.issueId}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors max-w-sm truncate">
                          {issue.title}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${getIssueTypeStyle(issue.type)}`}>
                            {issue.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider"
                            style={{
                              color: PRIORITY_COLORS[issue.priority],
                              backgroundColor: PRIORITY_BG[issue.priority],
                            }}
                          >
                            {issue.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                            <span
                              className="h-2 w-2 rounded-full shadow-sm"
                              style={{ backgroundColor: `var(--status-${issue.status.toLowerCase().replace(/ /g, "-")})` }}
                            />
                            {issue.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-5.5 w-5.5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                                {assignee.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-[var(--text-secondary)] hidden md:inline truncate max-w-[80px]">
                                {assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--text-tertiary)] font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              isOverdue ? "text-[var(--destructive)] font-semibold animate-pulse-soft" : "text-[var(--text-secondary)]"
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onIssueClick(issue)}
                            className="h-7 w-7 p-0 rounded-full hover:bg-[var(--surface-hover)]"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="kanban-scroll flex gap-4 pb-2 overflow-x-auto min-h-[420px]">
              {KANBAN_COLUMNS.map((column) => {
                const columnIssues = projectIssuesByStatus[column] ?? [];
                return (
                  <div
                    key={column}
                    className="flex-shrink-0 w-72 bg-[var(--surface)]/30 dark:bg-[var(--surface)]/5 backdrop-blur-sm rounded-xl border border-[var(--border)] p-3.5 flex flex-col h-[420px] shadow-sm"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[var(--border)] shrink-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shadow-sm"
                          style={{
                            backgroundColor: `var(--status-${column.toLowerCase().replace(/ /g, "-")})`,
                            boxShadow: `0 0 8px var(--status-${column.toLowerCase().replace(/ /g, "-")})80`,
                          }}
                        />
                        <h4 className="text-xs font-bold text-[var(--text-primary)] tracking-wide">{column}</h4>
                      </div>
                      <span className="text-[9px] font-bold bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] px-1.5 py-0.2 rounded-full">
                        {columnIssues.length}
                      </span>
                    </div>

                    {/* Column Issues Cards */}
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1 -mr-1">
                      {columnIssues.length > 0 ? (
                        columnIssues.map((issue) => (
                          <IssueCard
                            key={issue._id}
                            issue={issue}
                            onClick={() => onIssueClick(issue)}
                          />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--text-tertiary)] bg-[var(--surface)]/10 p-3 select-none">
                          No issues
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
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
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [mounted, setMounted] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all issues
  const { data: issuesData, isLoading } = useGetIssues({
    limit: 200,
    search: search || undefined,
    priority: filterPriority || undefined,
    type: filterType || undefined,
    sortBy: "createdAt:desc",
  });

  const issues: Issue[] = issuesData?.data ?? [];

  // Group issues by project for project cards representation
  const groupedByProject = useMemo(() => {
    const groups: Record<string, ProjectGroup> = {};

    issues.forEach((issue) => {
      const projectObj = typeof issue.project === "object" && issue.project ? issue.project : null;
      const clientObj = typeof issue.client === "object" && issue.client ? issue.client : null;

      const projectId = projectObj?._id || "unassigned";
      const projectName = projectObj?.name || "General Support / Unassigned";
      const clientCode = clientObj?.code || "";
      const clientName = clientObj?.name || "";

      if (!groups[projectId]) {
        groups[projectId] = {
          id: projectId,
          name: projectName,
          clientCode,
          clientName,
          issues: [],
        };
      }
      groups[projectId].issues.push(issue);
    });

    return Object.values(groups);
  }, [issues]);

  // Expand matching project cards on search/filtering
  useEffect(() => {
    if (search || filterPriority || filterType) {
      const nextExpanded: Record<string, boolean> = {};
      groupedByProject.forEach((group) => {
        nextExpanded[group.id] = true;
      });
      setExpandedProjects(nextExpanded);
    }
  }, [search, filterPriority, filterType, groupedByProject]);

  const allProjectIds = useMemo(() => groupedByProject.map((g) => g.id), [groupedByProject]);
  const isAllExpanded = allProjectIds.length > 0 && allProjectIds.every((id) => expandedProjects[id]);

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedProjects({});
    } else {
      const nextExpanded: Record<string, boolean> = {};
      allProjectIds.forEach((id) => {
        nextExpanded[id] = true;
      });
      setExpandedProjects(nextExpanded);
    }
  };

  const handleToggleProject = (id: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };

  // KPI Calculations in memory
  const kpis = useMemo(() => {
    const total = issues.length;
    const critical = issues.filter((i) => i.priority === "Critical" || i.priority === "High").length;
    const active = issues.filter((i) => ["Assigned", "In Progress", "Testing", "Planned Solution"].includes(i.status)).length;
    const resolved = issues.filter((i) => ["Resolved", "Closed"].includes(i.status)).length;
    return { total, critical, active, resolved };
  }, [issues]);

  const hasActiveFilters = !!filterPriority || !!filterType || !!search;

  const clearFilters = () => {
    setFilterPriority("");
    setFilterType("");
    setSearch("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 tracking-tight">
            <Ticket className="h-6 w-6 text-[var(--primary)]" />
            Issues Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track, prioritize, and resolve customer issues and technical tasks
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* View Switcher Toggle */}
          <div className="flex items-center rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] p-1 mr-1.5 shadow-sm">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "board"
                  ? "bg-[var(--surface)] text-[var(--primary-text)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--primary-text)]"
              }`}
              title="Board View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-[var(--surface)] text-[var(--primary-text)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--primary-text)]"
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {/* Expand All / Collapse All button */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 font-medium border border-[var(--border)] hover:bg-[var(--surface-hover)] shadow-sm"
            onClick={toggleExpandAll}
            disabled={groupedByProject.length === 0}
          >
            {isAllExpanded ? "Collapse All" : "Expand All"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 font-medium shadow-sm transition-all ${
              hasActiveFilters ? "border-[var(--primary)] text-[var(--primary-text)] bg-[var(--primary-light)]/20" : ""
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
            )}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <ValidatePermission permission="issues.issue.create">
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all font-semibold"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Issue
            </Button>
          </ValidatePermission>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="bg-[var(--surface)] border-[var(--border)] transition-all duration-300 hover:shadow-md hover:border-[var(--border-hover)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Total Issues</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">{isLoading ? "—" : kpis.total}</h2>
              <p className="text-[10px] text-[var(--text-tertiary)]">All registered issues</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--primary-light)] text-[var(--primary-text)]">
              <Ticket className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="bg-[var(--surface)] border-[var(--border)] transition-all duration-300 hover:shadow-md hover:border-[var(--border-hover)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">SLA Breach Risk</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--destructive)] flex items-center gap-1.5">
                {isLoading ? "—" : kpis.critical}
                {kpis.critical > 0 && <span className="h-2 w-2 rounded-full bg-[var(--destructive)] animate-pulse" />}
              </h2>
              <p className="text-[10px] text-[var(--text-tertiary)]">Critical / High priority</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--destructive-light)] text-[var(--destructive)]">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="bg-[var(--surface)] border-[var(--border)] transition-all duration-300 hover:shadow-md hover:border-[var(--border-hover)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Active Progress</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--warning)]">{isLoading ? "—" : kpis.active}</h2>
              <p className="text-[10px] text-[var(--text-tertiary)]">In development or testing</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--warning-light)] text-[var(--warning)]">
              <PlayCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="bg-[var(--surface)] border-[var(--border)] transition-all duration-300 hover:shadow-md hover:border-[var(--border-hover)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Resolved Rate</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--success)]">
                {isLoading ? "—" : `${kpis.total > 0 ? Math.round((kpis.resolved / kpis.total) * 100) : 0}%`}
              </h2>
              <p className="text-[10px] text-[var(--text-tertiary)]">{kpis.resolved} tickets completed</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--success-light)] text-[var(--success)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search by title or issue ID..."
              className="pl-9 h-9.5 bg-[var(--background)] border-[var(--border)]"
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
            className="w-44 h-9.5 bg-[var(--background)]"
          />
          <Select
            placeholder="All Types"
            value={filterType}
            onChange={(v) => setFilterType(v)}
            options={[
              { label: "All Types", value: "" },
              ...ISSUE_TYPES.map((t) => ({ label: t, value: t })),
            ]}
            className="w-48 h-9.5 bg-[var(--background)]"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs hover:bg-[var(--surface-hover)]">
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Projects and Issues list */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loader cards
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-5 animate-pulse space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="h-6 w-12 bg-[var(--surface-hover)] rounded shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-48 bg-[var(--surface-hover)] rounded" />
                      <div className="h-3 w-32 bg-[var(--surface-hover)] rounded" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 shrink-0">
                    <div className="h-8 w-48 bg-[var(--surface-hover)] rounded" />
                    <div className="h-8 w-24 bg-[var(--surface-hover)] rounded" />
                    <div className="h-8 w-8 bg-[var(--surface-hover)] rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : groupedByProject.length > 0 ? (
          groupedByProject.map((group) => (
            <ProjectCard
              key={group.id}
              group={group}
              viewMode={viewMode}
              isExpanded={!!expandedProjects[group.id]}
              onToggle={() => handleToggleProject(group.id)}
              onIssueClick={handleIssueClick}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-secondary)] shadow-sm">
            <Ticket className="h-10 w-10 text-[var(--text-tertiary)] opacity-40 mb-3" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No issues found</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Try resetting your filters or search query.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1 text-xs">
                <X className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            )}
          </div>
        )}
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
