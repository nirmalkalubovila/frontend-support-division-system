"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
  ArrowLeft,
  History,
} from "lucide-react";
import { Button, Badge, Input, Select, Card, CardContent } from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { CreateIssueModal, IssueDetailsModal } from "@/components";
import { KANBAN_COLUMNS, PRIORITIES, ISSUE_TYPES } from "@/lib/constants";
import { useGetIssues, useUpdateIssue, type Issue } from "@/api/services/issue-management/issue-service";
import { useGetAllProjects, type Project } from "@/api/services/project-management/project-service";
import { useGetCategories } from "@/api/services/system/settings-service";
import { useIssuesSocket } from "@/hooks/use-issues-socket";

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

const COL_CONFIG: Record<string, { dot: string; header: string; addBtn: string; card: string; badge: string }> = {
  "Backlog": { dot: "bg-slate-400", header: "bg-slate-50 dark:bg-slate-900/30", addBtn: "hover:bg-slate-100", card: "border-slate-200 hover:border-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  "Assigned": { dot: "bg-blue-400", header: "bg-blue-50 dark:bg-blue-900/20", addBtn: "hover:bg-blue-100", card: "border-blue-200 hover:border-blue-400", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  "Planned Solution": { dot: "bg-amber-400", header: "bg-amber-50 dark:bg-amber-900/20", addBtn: "hover:bg-amber-100", card: "border-amber-200 hover:border-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  "In Progress": { dot: "bg-indigo-400", header: "bg-indigo-50 dark:bg-indigo-900/20", addBtn: "hover:bg-indigo-100", card: "border-indigo-200 hover:border-indigo-400", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "Testing": { dot: "bg-purple-400", header: "bg-purple-50 dark:bg-purple-900/20", addBtn: "hover:bg-purple-100", card: "border-purple-200 hover:border-purple-400", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  "Resolved": { dot: "bg-green-400", header: "bg-green-50 dark:bg-green-900/20", addBtn: "hover:bg-green-100", card: "border-green-200 hover:border-green-400", badge: "bg-green-50 text-green-700 border-green-200" },
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

function fmtDuration(hours: number): string {
  const totalSecs = Math.round(hours * 3600);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  if (s > 0 || parts.length === 0) parts.push(`${s} sec`);
  return parts.join(", ");
}

// ──────────────────────────────────────────────────────────────
// Issue Card Component
// ──────────────────────────────────────────────────────────────
function IssueCard({
  issue,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  issue: Issue;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDragEnd: () => void;
  onClick?: () => void;
}) {
  const client = typeof issue.client === "object" ? issue.client : null;
  const project = typeof issue.project === "object" ? issue.project : null;
  const assignee = typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo : null;

  const dueDate = new Date(issue.dueDate);
  const isOverdue = dueDate < new Date() && !["Resolved", "Closed"].includes(issue.status);
  const dueDateStr = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:shadow-lg transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${PRIORITY_BORDER_CLASSES[issue.priority] || "bg-[var(--surface)]"
        } ${isDragging ? "opacity-40 scale-95 rotate-1 shadow-2xl" : "hover:-translate-y-1"}`}
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
            className={`flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-md bg-[var(--background)] ${isOverdue ? "text-[var(--destructive)] bg-[var(--destructive-light)] font-semibold animate-pulse-soft" : ""
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
  onBack,
  onAddIssue,
}: {
  group: ProjectGroup;
  viewMode: "board" | "list";
  isExpanded: boolean;
  onToggle: () => void;
  onIssueClick: (issue: Issue) => void;
  onBack?: () => void;
  onAddIssue: () => void;
}) {
  const updateMutation = useUpdateIssue();
  const [draggingIssue, setDraggingIssue] = useState<Issue | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"active" | "history">("active");

  const handleDragStart = useCallback((e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("issueId", issue._id);
    setDraggingIssue(issue);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingIssue(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, column: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(column);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggingIssue || draggingIssue.status === targetStatus) { setDraggingIssue(null); return; }
    try {
      await updateMutation.mutateAsync({ id: draggingIssue._id, data: { status: targetStatus } });
      toast.success(`Moved to ${targetStatus}`);
    } catch {
      toast.error("Failed to update issue status");
    }
    setDraggingIssue(null);
  }, [draggingIssue, updateMutation]);
  const issues = group.issues;

  const activeIssues = useMemo(() => issues.filter((i) => i.status !== "Closed"), [issues]);
  const historyIssues = useMemo(() => issues.filter((i) => ["Resolved", "Closed"].includes(i.status)), [issues]);

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
    for (const issue of activeIssues) {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      } else {
        if (grouped["Backlog"]) {
          grouped["Backlog"].push(issue);
        }
      }
    }
    return grouped;
  }, [activeIssues]);

  if (isExpanded) {
    return (
      <div className="col-span-full border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden shadow-sm transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-md">
        {/* Card Header (clickable to collapse) */}
        <div
          onClick={onToggle}
          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-[var(--surface-hover)]/20 hover:bg-[var(--surface-hover)]/40 transition-colors"
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Back Icon Button */}
            {onBack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                className="shrink-0 h-8 w-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors text-[var(--text-secondary)] hover:text-[var(--primary-text)] mr-1"
                title="Back to Projects"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

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
                className="h-5 w-5 text-[var(--text-tertiary)] transition-transform duration-300 rotate-180 text-[var(--primary)]"
              />
            </button>
          </div>
        </div>

        {/* Expanded Issues View Container */}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface)]/40 dark:bg-[var(--surface)]/5 animate-fade-in">
          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setSubTab("active")}
                className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                  subTab === "active"
                    ? "border-[var(--primary)] text-[var(--primary-text)] border-b-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setSubTab("history")}
                className={`pb-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  subTab === "history"
                    ? "border-[var(--primary)] text-[var(--primary-text)] border-b-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <History className="h-4 w-4" />
                Completed History
              </button>
            </div>
          </div>

          {subTab === "active" ? (
            viewMode === "list" ? (
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
                    {activeIssues.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[var(--text-tertiary)] font-medium bg-[var(--surface)]/10">
                          <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)] mx-auto mb-1.5" />
                          No active issues found.
                        </td>
                      </tr>
                    ) : (
                      activeIssues.map((issue) => {
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
                                className={`flex items-center gap-1 font-medium ${isOverdue ? "text-[var(--destructive)] font-semibold animate-pulse-soft" : "text-[var(--text-secondary)]"
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 w-full min-h-[550px]">
                {KANBAN_COLUMNS.map((column) => {
                  const columnIssues = projectIssuesByStatus[column] ?? [];
                  const cfg = COL_CONFIG[column] ?? COL_CONFIG["Backlog"];
                  const isOver = dragOverColumn === column;
                  return (
                    <div
                      key={column}
                      onDragOver={(e) => handleDragOver(e, column)}
                      onDrop={(e) => handleDrop(e, column)}
                      onDragLeave={() => setDragOverColumn(null)}
                      className={`flex flex-col rounded-xl border bg-[var(--background)] min-h-[550px] shadow-sm overflow-hidden transition-all duration-200 ${isOver
                          ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10 bg-[rgba(99,102,241,0.03)]"
                          : "border-[var(--border)]"
                        }`}
                    >
                      {/* Column Header */}
                      <div className={`px-3 pt-3 pb-2 rounded-t-xl ${cfg.header}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                            <span className="text-xs font-bold text-[var(--text-primary)]">{column}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                              {columnIssues.length}
                            </span>
                            <button
                              onClick={onAddIssue}
                              className={`h-6 w-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--primary)] ${cfg.addBtn} transition-colors`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Drop indicator */}
                      {isOver && draggingIssue && (
                        <div className="mx-3 mt-2 h-1.5 rounded-full animate-pulse bg-[var(--primary)] opacity-60" />
                      )}

                      {/* Column Issues Cards */}
                      <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto min-h-[120px]">
                        {columnIssues.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]/10 p-3 select-none">
                            <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)] mb-1.5" />
                            <p className="text-xs text-[var(--text-tertiary)] font-medium">No issues</p>
                            <button
                              onClick={onAddIssue}
                              className="mt-2 text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Add Issue
                            </button>
                          </div>
                        ) : (
                          columnIssues.map((issue) => (
                            <IssueCard
                              key={issue._id}
                              issue={issue}
                              isDragging={draggingIssue?._id === issue._id}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onClick={() => onIssueClick(issue)}
                            />
                          ))
                        )}
                        {isOver && draggingIssue && (
                          <div className="h-16 rounded-xl border-2 border-dashed border-[var(--primary)] bg-[rgba(99,102,241,0.05)] flex items-center justify-center">
                            <span className="text-xs font-semibold text-[var(--primary)]">Drop here</span>
                          </div>
                        )}
                      </div>

                      {columnIssues.length > 0 && (
                        <button
                          onClick={onAddIssue}
                          className={`mx-3 mb-3 mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] ${cfg.addBtn} transition-all`}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Issue
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
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
                    <th className="py-3 px-4 font-semibold">Time Spent</th>
                    <th className="py-3 px-4 font-semibold">Completed Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {historyIssues.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[var(--text-tertiary)] font-medium bg-[var(--surface)]/10">
                        <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)] mx-auto mb-1.5" />
                        No completed tasks in history yet.
                      </td>
                    </tr>
                  ) : (
                    historyIssues.map((issue) => {
                      const assignee = typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo : null;
                      const completedDate = new Date(issue.updatedAt);

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
                                className="h-2 w-2 rounded-full shadow-sm animate-pulse-soft"
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
                          <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                            <Clock className="h-3.5 w-3.5 inline mr-1 text-[var(--text-tertiary)]" />
                            {issue.totalTimeSpent !== undefined ? fmtDuration(issue.totalTimeSpent) : "0 sec"}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                            <Calendar className="h-3.5 w-3.5 inline mr-1 text-[var(--text-tertiary)]" />
                            {completedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Collapsed Vertical Card View
  return (
    <div
      onClick={onToggle}
      className="col-span-1 border border-[var(--border)] rounded-2xl bg-[var(--surface)] hover:border-[var(--border-hover)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col p-5 h-full min-h-[220px] cursor-pointer select-none"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        {group.clientCode ? (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary-text)] uppercase tracking-wider shadow-sm">
            {group.clientCode}
          </span>
        ) : (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-tertiary)] uppercase tracking-wider shadow-sm">
            GEN
          </span>
        )}

        <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
      </div>

      {/* Title & Description */}
      <div className="flex-1 mt-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight line-clamp-2" title={group.name}>
          {group.name}
        </h3>
        {group.clientName && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 truncate">{group.clientName}</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)] my-3.5 opacity-50" />

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs text-[var(--text-tertiary)] mb-3">
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Total</span>
          <span className="font-bold text-[var(--text-secondary)] mt-0.5">{total}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Risk</span>
          <span className={`font-bold mt-0.5 flex items-center justify-center gap-0.5 ${critical > 0 ? "text-[var(--destructive)] font-extrabold animate-pulse-soft" : "text-[var(--text-secondary)]"}`}>
            {critical}
            {critical > 0 && <span className="h-1 w-1 rounded-full bg-[var(--destructive)]" />}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Active</span>
          <span className="font-bold text-[var(--warning)] mt-0.5">{active}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Done</span>
          <span className="font-bold text-[var(--success)] mt-0.5">{resolved}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
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
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Issues Page Content
// ──────────────────────────────────────────────────────────────
function IssuesPageContent() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [mounted, setMounted] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const { data: categories = [] } = useGetCategories();
  const issueTypes = categories.length > 0 ? categories : ISSUE_TYPES;
  const searchParams = useSearchParams();
  const projectQuery = searchParams.get("project") || searchParams.get("projectId");

  useEffect(() => {
    if (projectQuery) {
      setActiveProjectId(projectQuery);
    }
  }, [projectQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all issues
  const { data: issuesData, isLoading: isLoadingIssues } = useGetIssues({
    limit: 200,
    search: search || undefined,
    priority: filterPriority || undefined,
    type: filterType || undefined,
    sortBy: "createdAt:desc",
  });

  // Fetch all projects
  const { data: projectsData, isLoading: isLoadingProjects } = useGetAllProjects();

  const issues: Issue[] = issuesData?.data ?? [];
  const projects: Project[] = projectsData?.data ?? [];

  const isLoading = isLoadingIssues || isLoadingProjects;

  // ── Real-time socket ──
  const projectIdsForSocket = useMemo(
    () => projects.map((p) => p._id).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects.map((p) => p._id).join(",")]
  );
  useIssuesSocket(projectIdsForSocket);

  // Group issues by project for project cards representation
  const groupedByProject = useMemo(() => {
    const groups: Record<string, ProjectGroup> = {};

    // Initialize groups for all projects in database
    projects.forEach((proj) => {
      const clientObj = typeof proj.client === "object" ? proj.client : null;
      const clientCode = clientObj?.code || "";
      const clientName = clientObj?.name || "";

      groups[proj._id] = {
        id: proj._id,
        name: proj.name,
        clientCode,
        clientName,
        issues: [],
      };
    });

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
  }, [projects, issues]);

  // Active Project Group Lookup
  const activeGroup = useMemo(() => {
    if (!activeProjectId) return null;
    return groupedByProject.find((g) => g.id === activeProjectId) || null;
  }, [activeProjectId, groupedByProject]);

  // Clear active project if it's filtered out of the current issues dataset
  useEffect(() => {
    if (activeProjectId && activeProjectId !== "unassigned" && !groupedByProject.some((g) => g.id === activeProjectId)) {
      if (!isLoading && issues.length > 0) {
        setActiveProjectId(null);
      }
    }
  }, [groupedByProject, activeProjectId, isLoading, issues.length]);

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };

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
            {activeGroup ? (
              <span className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)] font-normal">Issues</span>
                <span className="text-sm font-medium text-[var(--text-tertiary)]">/</span>
                <span>{activeGroup.name}</span>
              </span>
            ) : (
              "Issues Management"
            )}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {activeGroup ? `Viewing active issues for ${activeGroup.name}` : "Track, prioritize, and resolve customer issues and technical tasks"}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* View Switcher Toggle */}
          <div className="flex items-center rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] p-1 mr-1.5 shadow-sm">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === "board"
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
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === "list"
                  ? "bg-[var(--surface)] text-[var(--primary-text)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--primary-text)]"
                }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 font-medium shadow-sm transition-all ${hasActiveFilters ? "border-[var(--primary)] text-[var(--primary-text)] bg-[var(--primary-light)]/20" : ""
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

      {/* KPI Overview Cards removed */}

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
              ...issueTypes.map((t) => ({ label: t, value: t })),
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton loader cards
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-5 space-y-4 min-h-[220px] animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-12 bg-[var(--surface-hover)] rounded shrink-0" />
                  <div className="h-4 w-4 bg-[var(--surface-hover)] rounded-full shrink-0" />
                </div>
                <div className="space-y-2 flex-1 mt-4">
                  <div className="h-5 w-48 bg-[var(--surface-hover)] rounded" />
                  <div className="h-3.5 w-32 bg-[var(--surface-hover)] rounded" />
                </div>
                <div className="border-t border-[var(--border)] my-3.5 opacity-50" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-8 bg-[var(--surface-hover)] rounded" />
                  ))}
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="h-3 w-16 bg-[var(--surface-hover)] rounded" />
                  <div className="h-1.5 w-full bg-[var(--surface-hover)] rounded-full" />
                </div>
              </div>
            ))}
          </>
        ) : activeGroup ? (
          <ProjectCard
            key={activeGroup.id}
            group={activeGroup}
            viewMode={viewMode}
            isExpanded={true}
            onToggle={() => setActiveProjectId(null)}
            onIssueClick={handleIssueClick}
            onBack={() => setActiveProjectId(null)}
            onAddIssue={() => setShowCreateModal(true)}
          />
        ) : groupedByProject.length > 0 ? (
          groupedByProject.map((group) => (
            <ProjectCard
              key={group.id}
              group={group}
              viewMode={viewMode}
              isExpanded={false}
              onToggle={() => setActiveProjectId(group.id)}
              onIssueClick={handleIssueClick}
              onAddIssue={() => setShowCreateModal(true)}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-secondary)] shadow-sm">
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
      <CreateIssueModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        defaultProjectId={activeProjectId || undefined}
      />

      {/* Issue Details Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[50vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    }>
      <IssuesPageContent />
    </Suspense>
  );
}
