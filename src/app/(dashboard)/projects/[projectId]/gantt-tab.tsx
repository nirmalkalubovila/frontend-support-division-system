"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Calendar, Search, ChevronRight, ChevronDown, GitPullRequest,
  CheckSquare, Clock, AlertCircle, Plus, ZoomIn, ZoomOut, User as UserIcon, AlertTriangle
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/molecules/confirmDialog";

import {
  useGetProjectTasks, useUpdateTask, useDeleteTask,
  type Task, type TaskStatus, type TaskPriority
} from "@/api/services/project-management/task-service";
import { useGetProjectCRs, type ChangeRequest } from "@/api/services/project-management/cr-service";
import { useGetProjectById } from "@/api/services/project-management/project-service";
import { TaskFormModal } from "@/components/organisms/taskFormModal/task-form-modal";
import { TaskDetailDrawer } from "@/components/organisms/kanbanBoard/kanban-board";
import { CRDetailDrawer } from "@/components/organisms/crDetailDrawer/cr-detail-drawer";
import type { User } from "@/api/services/user-management/user-service";
import { useKanbanSocket } from "@/hooks/use-kanban-socket";
import { PRIORITIES } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────
// Constants & style helpers
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<TaskStatus, string> = {
  "To Do": "bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
  "In Progress": "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-400",
  "Review": "bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400",
  "Done": "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400",
};

const STATUS_STYLES: Record<TaskStatus, { dot: string; badge: string }> = {
  "To Do": {
    dot: "bg-slate-400",
    badge: "bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)]"
  },
  "In Progress": {
    dot: "bg-yellow-400",
    badge: "bg-yellow-50 text-yellow-700 border border-yellow-200"
  },
  "Review": {
    dot: "bg-[var(--primary)]",
    badge: "bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]"
  },
  "Done": {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border border-green-200"
  },
};

const PRIORITY_DOT: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-yellow-400",
  Low: "bg-green-500",
};

interface GanttRow {
  id: string;
  type: "cr" | "standalone-header" | "task";
  name: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  task?: Task;
  cr?: ChangeRequest;
}

interface DragState {
  taskId: string;
  type: "move" | "resize-left" | "resize-right";
  initialX: number;
  initialStartDate: Date;
  initialEndDate: Date;
}

function snapToDay(date: Date): Date {
  const snapped = new Date(date);
  snapped.setHours(0, 0, 0, 0);
  return snapped;
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function GanttTab({ projectId, members }: { projectId: string; members: User[] }) {
  const qc = useQueryClient();
  const [zoom, setZoom] = useState<"day" | "week" | "month" | "quarter" | "year">("month");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterCR, setFilterCR] = useState("");

  // Modal / Drawer States
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerCR, setDrawerCR] = useState<ChangeRequest | null>(null);

  // Drag and Resize State
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [draggedDates, setDraggedDates] = useState<Record<string, { startDate: Date; endDate: Date }>>({});

  // Scroll-sync refs: left panel (names) and right panel (timeline) share vertical scroll
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const syncScrollLeft = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (rightScrollRef.current) rightScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    isSyncingScroll.current = false;
  };

  const syncScrollRight = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (leftScrollRef.current) leftScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    isSyncingScroll.current = false;
  };

  // Fetch data
  const { data: project } = useGetProjectById(projectId);
  const { data: tasks = [], isLoading: tasksLoading } = useGetProjectTasks(projectId);
  const { data: crsData, isLoading: crsLoading } = useGetProjectCRs(projectId);
  const crs = crsData?.data ?? [];

  // Enable live WebSocket updates for this tab
  useKanbanSocket(projectId);

  const updateMutation = useUpdateTask(projectId);
  const deleteMutation = useDeleteTask(projectId);

  const currentDrawerTask = useMemo(
    () => drawerTask ? tasks.find((t) => t._id === drawerTask._id) ?? drawerTask : null,
    [drawerTask, tasks]
  );

  const currentDrawerCR = useMemo(
    () => drawerCR ? crs.find((c) => c._id === drawerCR._id) ?? drawerCR : null,
    [drawerCR, crs]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  // Date boundary calculations
  const timelineDates = useMemo(() => {
    let minDate = new Date();
    let maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);

    if (project?.startDate) minDate = new Date(project.startDate);
    if (project?.endDate) maxDate = new Date(project.endDate);

    tasks.forEach((t) => {
      if (t.startDate) {
        const d = new Date(t.startDate);
        if (d < minDate) minDate = d;
      }
      if (t.endDate) {
        const d = new Date(t.endDate);
        if (d > maxDate) maxDate = d;
      }
    });

    const start = new Date(minDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 14);

    return { start, end };
  }, [project, tasks]);

  // Generate grid columns based on zoom level
  const { columns, totalGridWidth } = useMemo(() => {
    const cols: { date: Date; label: string; subLabel: string; width: number }[] = [];
    const pStart = timelineDates.start;
    const pEnd = timelineDates.end;
    let curr = new Date(pStart);
    curr.setHours(0, 0, 0, 0);

    if (zoom === "day") {
      while (curr <= pEnd) {
        cols.push({
          date: new Date(curr),
          label: curr.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          subLabel: curr.toLocaleDateString("en-US", { weekday: "short" }),
          width: 50,
        });
        curr.setDate(curr.getDate() + 1);
      }
    } else if (zoom === "week") {
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
      curr.setDate(diff);
      while (curr <= pEnd) {
        cols.push({
          date: new Date(curr),
          label: curr.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          subLabel: `W${getWeekNumber(curr)}`,
          width: 90,
        });
        curr.setDate(curr.getDate() + 7);
      }
    } else if (zoom === "month") {
      curr.setDate(1);
      while (curr <= pEnd) {
        cols.push({
          date: new Date(curr),
          label: curr.toLocaleDateString("en-US", { year: "numeric" }),
          subLabel: curr.toLocaleDateString("en-US", { month: "short" }),
          width: 140,
        });
        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (zoom === "quarter") {
      const qMonth = Math.floor(curr.getMonth() / 3) * 3;
      curr.setMonth(qMonth, 1);
      while (curr <= pEnd) {
        const qNum = Math.floor(curr.getMonth() / 3) + 1;
        cols.push({
          date: new Date(curr),
          label: curr.getFullYear().toString(),
          subLabel: `Q${qNum}`,
          width: 180,
        });
        curr.setMonth(curr.getMonth() + 3);
      }
    } else if (zoom === "year") {
      curr.setMonth(0, 1);
      while (curr <= pEnd) {
        cols.push({
          date: new Date(curr),
          label: "Year",
          subLabel: curr.getFullYear().toString(),
          width: 260,
        });
        curr.setFullYear(curr.getFullYear() + 1);
      }
    }

    const totalWidth = cols.reduce((sum, col) => sum + col.width, 0);
    return { columns: cols, totalGridWidth: totalWidth };
  }, [zoom, timelineDates]);

  // Date-to-Pixel mappings
  const dateToX = useCallback((date: Date) => {
    const startMs = timelineDates.start.getTime();
    const endMs = timelineDates.end.getTime();
    const dateMs = date.getTime();
    if (dateMs <= startMs) return 0;
    if (dateMs >= endMs) return totalGridWidth;
    const pct = (dateMs - startMs) / (endMs - startMs);
    return pct * totalGridWidth;
  }, [timelineDates, totalGridWidth]);

  const todayX = useMemo(() => {
    const today = new Date();
    if (today >= timelineDates.start && today <= timelineDates.end) {
      return dateToX(today);
    }
    return null;
  }, [timelineDates, dateToX]);

  // Direct and recursive tree filters
  const matchesTaskDirectly = useCallback((t: Task) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && !t.assignees.some((a) => a._id === filterAssignee)) return false;
    if (filterCR && t.cr?._id !== filterCR) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }, [filterStatus, filterPriority, filterAssignee, filterCR, searchQuery]);

  const matchesFilterTree = useCallback((t: Task): boolean => {
    if (matchesTaskDirectly(t)) return true;
    const children = tasks.filter((child) => {
      const pId = typeof child.parent === "object" ? (child.parent as any)?._id : child.parent;
      return pId === t._id;
    });
    return children.some((child) => matchesFilterTree(child));
  }, [tasks, matchesTaskDirectly]);

  // Flat rows list building
  const flatRows = useMemo(() => {
    const list: GanttRow[] = [];

    const pushTaskBranch = (t: Task, depth: number) => {
      const isExpanded = expandedIds[t._id] !== false;
      const children = tasks.filter((child) => {
        const pId = typeof child.parent === "object" ? (child.parent as any)?._id : child.parent;
        return pId === t._id;
      });
      const visibleChildren = children.filter(matchesFilterTree);
      const hasChildren = visibleChildren.length > 0;

      list.push({
        id: t._id,
        type: "task",
        name: t.name,
        depth,
        hasChildren,
        isExpanded,
        task: t,
      });

      if (isExpanded && hasChildren) {
        visibleChildren.forEach((child) => pushTaskBranch(child, depth + 1));
      }
    };

    // 1. CR Groups
    crs.forEach((cr) => {
      if (filterCR && filterCR !== cr._id) return;

      const crTasks = tasks.filter((t) => t.cr?._id === cr._id);
      const filteredCRTasks = crTasks.filter(matchesFilterTree);

      const rootCRTasks = filteredCRTasks.filter((t) => {
        const pId = typeof t.parent === "object" ? (t.parent as any)?._id : t.parent;
        return !pId;
      });

      const hasMatchingTasks = filteredCRTasks.length > 0;
      const hasActiveFilters = !!(filterStatus || filterPriority || filterAssignee || searchQuery);
      if (hasActiveFilters && !hasMatchingTasks) return;

      const isExpanded = expandedIds[cr._id] !== false;
      list.push({
        id: cr._id,
        type: "cr",
        name: cr.title,
        depth: 0,
        hasChildren: rootCRTasks.length > 0,
        isExpanded,
        cr,
      });

      if (isExpanded) {
        rootCRTasks.forEach((t) => pushTaskBranch(t, 1));
      }
    });

    // 2. Standalone Tasks
    const standaloneTasks = tasks.filter((t) => !t.cr);
    const filteredStandalone = standaloneTasks.filter(matchesFilterTree);
    const rootStandalone = filteredStandalone.filter((t) => {
      const pId = typeof t.parent === "object" ? (t.parent as any)?._id : t.parent;
      return !pId;
    });

    if (rootStandalone.length > 0) {
      const isExpanded = expandedIds["standalone-header"] !== false;
      list.push({
        id: "standalone-header",
        type: "standalone-header",
        name: "Standalone Tasks",
        depth: 0,
        hasChildren: true,
        isExpanded,
      });

      if (isExpanded) {
        rootStandalone.forEach((t) => pushTaskBranch(t, 1));
      }
    }

    return list;
  }, [crs, tasks, expandedIds, filterCR, matchesFilterTree, filterStatus, filterPriority, filterAssignee, searchQuery]);

  // Pre-calculate visual rows indexing for SVG lines drawing
  const rowPositionsMap = useMemo(() => {
    const map: Record<string, number> = {};
    flatRows.forEach((row, idx) => {
      if (row.type === "task") {
        map[row.id] = idx;
      }
    });
    return map;
  }, [flatRows]);

  // Pointer Interaction Logic (Drag & Resize)
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    taskId: string,
    type: "move" | "resize-left" | "resize-right",
    currentStart: Date,
    currentEnd: Date
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return; // only left click
    e.currentTarget.setPointerCapture(e.pointerId);

    setDragState({
      taskId,
      type,
      initialX: e.clientX,
      initialStartDate: currentStart,
      initialEndDate: currentEnd,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const deltaX = e.clientX - dragState.initialX;
    const msPerPx = (timelineDates.end.getTime() - timelineDates.start.getTime()) / totalGridWidth;
    const deltaMs = deltaX * msPerPx;

    const { type, initialStartDate, initialEndDate, taskId } = dragState;
    let newStart = new Date(initialStartDate);
    let newEnd = new Date(initialEndDate);

    if (type === "move") {
      newStart = new Date(initialStartDate.getTime() + deltaMs);
      newEnd = new Date(initialEndDate.getTime() + deltaMs);
    } else if (type === "resize-left") {
      newStart = new Date(initialStartDate.getTime() + deltaMs);
      if (newStart >= newEnd) {
        newStart = new Date(newEnd);
        newStart.setDate(newStart.getDate() - 1);
      }
    } else if (type === "resize-right") {
      newEnd = new Date(initialEndDate.getTime() + deltaMs);
      if (newEnd <= newStart) {
        newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + 1);
      }
    }

    setDraggedDates((prev) => ({
      ...prev,
      [taskId]: { startDate: newStart, endDate: newEnd },
    }));
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const { taskId } = dragState;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalDragged = draggedDates[taskId];
    setDragState(null);
    setDraggedDates((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });

    if (!finalDragged) return;

    const snappedStart = snapToDay(finalDragged.startDate);
    const snappedEnd = snapToDay(finalDragged.endDate);

    try {
      await updateMutation.mutateAsync({
        taskId,
        data: {
          startDate: snappedStart.toISOString(),
          endDate: snappedEnd.toISOString(),
        },
      });
      toast.success("Task schedule updated.");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update task schedule.";
      toast.error(msg);
    }
  };

  // SVGs Dependency Curves Generator
  const dependencyLines = useMemo(() => {
    const lines: React.ReactNode[] = [];

    flatRows.forEach((row, rowIdx) => {
      if (row.type !== "task" || !row.task) return;
      const task = row.task;

      // Ensure task has dates
      if (!task.startDate || !task.endDate) return;

      const taskStart = draggedDates[task._id]?.startDate || new Date(task.startDate);
      const taskEnd = draggedDates[task._id]?.endDate || new Date(task.endDate);

      // Check predecessor tasks
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((pred: any) => {
          const predId = typeof pred === "object" ? pred._id : pred;
          const predRowIdx = rowPositionsMap[predId];

          if (predRowIdx === undefined) return; // Predecessor is not visible/rendered

          const predTask = tasks.find((t) => t._id === predId);
          if (!predTask || !predTask.startDate || !predTask.endDate) return;

          const predStart = draggedDates[predId]?.startDate || new Date(predTask.startDate);
          const predEnd = draggedDates[predId]?.endDate || new Date(predTask.endDate);

          // Calculate coordinates relative to the timeline grid
          const xB_end = dateToX(predEnd);
          const yB = predRowIdx * 44 + 22; // vertical center of predecessor row
          const xA_start = dateToX(taskStart);
          const yA = rowIdx * 44 + 22; // vertical center of successor row

          const isConflict = xA_start < xB_end;

          // Stepper orthogonal routing
          let dPath = "";
          if (isConflict) {
            const loopX1 = xB_end + 8;
            const loopX2 = xA_start - 8;
            const midY = (yB + yA) / 2;
            dPath = `M ${xB_end} ${yB} L ${loopX1} ${yB} L ${loopX1} ${midY} L ${loopX2} ${midY} L ${loopX2} ${yA} L ${xA_start} ${yA}`;
          } else {
            const halfX = (xB_end + xA_start) / 2;
            dPath = `M ${xB_end} ${yB} L ${halfX} ${yB} L ${halfX} ${yA} L ${xA_start} ${yA}`;
          }

          lines.push(
            <path
              key={`${predId}-${task._id}`}
              d={dPath}
              fill="none"
              stroke={isConflict ? "var(--destructive)" : "rgba(99, 102, 241, 0.4)"}
              strokeWidth={isConflict ? 2 : 1.5}
              strokeDasharray={isConflict ? "3 3" : undefined}
              markerEnd={isConflict ? "url(#arrow-conflict)" : "url(#arrow)"}
            />
          );
        });
      }
    });

    return lines;
  }, [flatRows, tasks, rowPositionsMap, dateToX, draggedDates]);

  // Statistics Summary counts
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "Done").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress" || t.status === "Review").length;
    const overdue = tasks.filter(
      (t) => t.status !== "Done" && t.endDate && new Date(t.endDate) < new Date()
    ).length;

    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const handleEdit = (t: Task) => {
    setEditingTask(t);
    setParentTask(null);
    setDrawerTask(null);
    setShowForm(true);
  };

  const handleAddChild = (t: Task) => {
    setEditingTask(null);
    setParentTask(t);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await deleteMutation.mutateAsync(taskToDelete._id);
      toast.success("Task deleted.");
      setTaskToDelete(null);
      setDrawerTask(null);
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Stat Summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Total Tasks</p>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">{stats.total}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-[var(--primary-light)]/20 flex items-center justify-center text-[var(--primary)]">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Completed</p>
              <h3 className="text-xl font-bold text-[var(--success)] mt-1 font-mono">{stats.completed}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">In Progress</p>
              <h3 className="text-xl font-bold text-yellow-500 mt-1 font-mono">{stats.inProgress}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--surface)] border-[var(--border)] text-red-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Overdue Tasks</p>
              <h3 className="text-xl font-bold text-[var(--destructive)] mt-1 font-mono">{stats.overdue}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center text-[var(--destructive)]">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Zoom Toolbar */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 h-9 bg-[var(--background)] border-[var(--border)] text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            placeholder="All Statuses"
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={[
              { label: "All Statuses", value: "" },
              { label: "To Do", value: "To Do" },
              { label: "In Progress", value: "In Progress" },
              { label: "Review", value: "Review" },
              { label: "Done", value: "Done" },
            ]}
            className="w-40 h-9 bg-[var(--background)]"
          />

          <Select
            placeholder="All Priorities"
            value={filterPriority}
            onChange={(v) => setFilterPriority(v)}
            options={[
              { label: "All Priorities", value: "" },
              ...PRIORITIES.map((p) => ({ label: p, value: p })),
            ]}
            className="w-40 h-9 bg-[var(--background)]"
          />

          <Select
            placeholder="All Assignees"
            value={filterAssignee}
            onChange={(v) => setFilterAssignee(v)}
            options={[
              { label: "All Assignees", value: "" },
              ...members.map((m) => ({ label: m.name, value: m._id })),
            ]}
            className="w-44 h-9 bg-[var(--background)]"
          />

          <Select
            placeholder="All CRs"
            value={filterCR}
            onChange={(v) => setFilterCR(v)}
            options={[
              { label: "All CRs", value: "" },
              ...crs.map((cr) => ({ label: cr.crNumber, value: cr._id })),
            ]}
            className="w-40 h-9 bg-[var(--background)]"
          />
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 flex-wrap gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
            {(["day", "week", "month", "quarter", "year"] as const).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  zoom === z
                    ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setParentTask(null);
              setShowForm(true);
            }}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white h-8"
          >
            <Plus className="h-3.5 w-3.5" /> New Task
          </Button>
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      {tasksLoading || crsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : flatRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <Calendar className="h-10 w-10 text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">No matching rows found</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Try resetting your filters or add a new task.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden flex flex-col h-[550px] shadow-sm select-none">
          {/* ── Split-panel layout: fixed left names column + scrollable right timeline ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* ── LEFT PANEL: fixed width, no horizontal scroll ── */}
            <div className="flex flex-col w-[320px] shrink-0 border-r border-[var(--border)] z-20 bg-[var(--surface)]">
              {/* Left Header */}
              <div className="h-[48px] shrink-0 border-b border-[var(--border)] bg-[var(--background)] flex items-center px-4 font-bold text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                Task / Change Request
              </div>
              {/* Left Rows — scrolls vertically only */}
              <div
                ref={leftScrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                onScroll={syncScrollLeft}
                style={{ height: 0 }}
              >
                <div style={{ height: flatRows.length * 44 }}>
                  {flatRows.map((row) => {
                    const isCR = row.type === "cr";
                    const isHeader = row.type === "standalone-header";
                    const isTask = row.type === "task";
                    return (
                      <div
                        key={row.id}
                        className="flex h-[44px] border-b border-[var(--border)]/30 group hover:bg-[var(--surface-hover)] transition-colors cursor-pointer overflow-hidden"
                        style={{ paddingLeft: `${row.depth * 16 + 12}px` }}
                        onClick={() => {
                          if (isCR && row.cr) setDrawerCR(row.cr);
                          else if (isTask && row.task) setDrawerTask(row.task);
                          else if (isHeader) toggleExpand("standalone-header");
                        }}
                      >
                        {/* Collapse Toggle */}
                        {row.hasChildren ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }}
                            className="p-1 rounded hover:bg-[var(--surface-hover)] mr-1 text-[var(--text-tertiary)] shrink-0 self-center"
                          >
                            {row.isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}
                        {/* Icon */}
                        {isCR && <GitPullRequest className="h-3.5 w-3.5 text-indigo-500 shrink-0 mr-1.5 self-center" />}
                        {isTask && row.task && (
                          <span className={`h-2 w-2 rounded-full shrink-0 mr-2 self-center ${STATUS_STYLES[row.task.status]?.dot || "bg-slate-400"}`} />
                        )}
                        {/* Name */}
                        <span className={`truncate text-xs self-center flex-1 ${isCR || isHeader ? "font-bold text-[var(--text-primary)]" : "font-medium text-[var(--text-secondary)]"}`}>
                          {row.name}
                        </span>
                        {/* Quick actions */}
                        {isTask && row.task && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-2 self-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => row.task && handleAddChild(row.task)} className="p-0.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)]" title="Add sub-task">
                              <Plus className="h-3 w-3" />
                            </button>
                            <button onClick={() => row.task && handleEdit(row.task)} className="p-0.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)]" title="Edit task">
                              <Plus className="h-3 w-3 rotate-45" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL: scrolls both horizontally and vertically ── */}
            <div
              ref={rightScrollRef}
              className="flex-1 overflow-auto"
              onScroll={syncScrollRight}
              onPointerMove={handlePointerMove}
            >
              <div style={{ width: totalGridWidth, minWidth: totalGridWidth }}>
                {/* Right Header — dates */}
                <div className="flex h-[48px] sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
                  {columns.map((col, idx) => (
                    <div
                      key={idx}
                      className="border-r border-[var(--border)]/30 h-full shrink-0 flex flex-col justify-center px-1 text-[9px] text-[var(--text-secondary)] select-none"
                      style={{ width: col.width }}
                    >
                      <span className="font-semibold truncate opacity-60 uppercase">{col.label}</span>
                      <span className="font-bold text-[var(--text-primary)] truncate mt-0.5">{col.subLabel}</span>
                    </div>
                  ))}
                </div>

                {/* Right Grid Body */}
                <div
                  className="relative"
                  style={{ width: totalGridWidth, height: flatRows.length * 44 }}
                >
                  {/* Vertical column lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {columns.map((col, idx) => (
                      <div key={idx} className="border-r border-[var(--border)]/10 h-full shrink-0" style={{ width: col.width }} />
                    ))}
                  </div>

                  {/* Today's marker line */}
                  {todayX !== null && (
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-400 z-10 pointer-events-none"
                      style={{ left: todayX }}
                    >
                      <div className="absolute top-1 -translate-x-1/2 bg-red-400 text-white text-[8px] font-bold px-1 py-0.5 rounded shadow whitespace-nowrap uppercase tracking-wider z-20">
                        Today
                      </div>
                    </div>
                  )}

                  {/* SVG Dependency Lines */}
                  <svg
                    className="absolute top-0 pointer-events-none z-10"
                    style={{ left: 0, width: totalGridWidth, height: flatRows.length * 44 }}
                  >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="rgba(99, 102, 241, 0.7)" />
                    </marker>
                    <marker
                      id="arrow-conflict"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="var(--destructive)" />
                    </marker>
                  </defs>
                  {dependencyLines}
                </svg>

                  {/* Right-panel timeline rows — one row per flatRow, bars only */}
                  {flatRows.map((row, rowIdx) => {
                    const isCR = row.type === "cr";
                    const isTask = row.type === "task";

                    return (
                      <div
                        key={row.id}
                        className={`absolute w-full h-[44px] border-b border-[var(--border)]/30 ${isCR ? "bg-[var(--surface-hover)]/10" : ""}`}
                        style={{ top: rowIdx * 44 }}
                      >
                        {/* ── Render Group Summary (CR Bracket) ── */}
                        {isCR && (() => {
                          const crTasks = tasks.filter((t) => t.cr?._id === row.id);
                          const dates = crTasks
                            .filter((t) => t.startDate && t.endDate)
                            .map((t) => ({
                              start: new Date(t.startDate!),
                              end: new Date(t.endDate!),
                            }));

                          if (dates.length === 0) return null;

                          const minStart = new Date(Math.min(...dates.map((d) => d.start.getTime())));
                          const maxEnd = new Date(Math.max(...dates.map((d) => d.end.getTime())));

                          const left = dateToX(minStart);
                          const width = dateToX(maxEnd) - left;

                          return (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-slate-400 dark:bg-slate-600 rounded flex justify-between pointer-events-none"
                              style={{ left, width }}
                            >
                              {/* Summary left/right bracket tips */}
                              <div className="w-1.5 h-3 bg-slate-400 dark:bg-slate-600 rounded-bl -mt-0.5" />
                              <div className="w-1.5 h-3 bg-slate-400 dark:bg-slate-600 rounded-br -mt-0.5" />
                            </div>
                          );
                        })()}

                        {/* ── Render Task Bar / Milestone ── */}
                        {isTask && row.task && (() => {
                          const t = row.task;
                          const isUnscheduled = !t.startDate || !t.endDate;

                          // Resolve active dates (possibly current drag values)
                          let currentStart = new Date();
                          let currentEnd = new Date();

                          if (draggedDates[t._id]) {
                            currentStart = draggedDates[t._id].startDate;
                            currentEnd = draggedDates[t._id].endDate;
                          } else if (!isUnscheduled) {
                            currentStart = new Date(t.startDate!);
                            currentEnd = new Date(t.endDate!);
                          } else {
                            // Default placement for unscheduled task
                            const defDate = new Date();
                            currentStart = snapToDay(defDate);
                            currentEnd = new Date(currentStart);
                            currentEnd.setDate(currentEnd.getDate() + 1);
                          }

                          const left = dateToX(currentStart);
                          const width = Math.max(16, dateToX(currentEnd) - left);

                          // Check if dates are same -> Milestone
                          const isMilestone =
                            !isUnscheduled &&
                            snapToDay(currentStart).getTime() === snapToDay(currentEnd).getTime();

                          // Overdue styling
                          const overdue =
                            t.status !== "Done" &&
                            currentEnd < new Date();

                          // Predecessor dependency validations checks
                          let hasConflict = false;
                          if (t.dependencies && t.dependencies.length > 0) {
                            hasConflict = t.dependencies.some((pred: any) => {
                              const predId = typeof pred === "object" ? pred._id : pred;
                              const predTask = tasks.find((tk) => tk._id === predId);
                              if (predTask && predTask.endDate) {
                                const predEnd = draggedDates[predId]?.endDate || new Date(predTask.endDate);
                                return currentStart < predEnd;
                              }
                              return false;
                            });
                          }

                          if (isMilestone) {
                            return (
                              <div
                                key={t._id}
                                className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rotate-45 border-2 flex items-center justify-center shadow transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing z-20 ${
                                  STATUS_COLORS[t.status]
                                } ${
                                  hasConflict || overdue
                                    ? "border-red-500 animate-pulse-soft"
                                    : ""
                                }`}
                                style={{ left: left - 10 }}
                                onPointerDown={(e) =>
                                  handlePointerDown(
                                    e,
                                    t._id,
                                    "move",
                                    currentStart,
                                    currentEnd
                                  )
                                }
                                onPointerUp={handlePointerUp}
                                onDoubleClick={() => setDrawerTask(t)}
                                title={`${t.name} (Milestone)\nDate: ${currentStart.toLocaleDateString()}`}
                              />
                            );
                          }

                          return (
                            <div
                              key={t._id}
                              className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-lg border flex items-center px-2 select-none z-20 transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing group/bar ${
                                isUnscheduled
                                  ? "border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-100/40 dark:bg-slate-800/40 text-slate-400"
                                  : STATUS_COLORS[t.status]
                              } ${
                                hasConflict
                                  ? "border-red-500 shadow-sm shadow-red-200 dark:shadow-none ring-1 ring-red-400"
                                  : ""
                              } ${
                                overdue && t.status !== "Done"
                                  ? "border-red-400 animate-pulse-soft"
                                  : ""
                              }`}
                              style={{ left, width }}
                              onPointerDown={(e) =>
                                handlePointerDown(
                                  e,
                                  t._id,
                                  "move",
                                  currentStart,
                                  currentEnd
                                )
                              }
                              onPointerUp={handlePointerUp}
                              onDoubleClick={() => setDrawerTask(t)}
                            >
                              {/* Left Resize Handle */}
                              {!isUnscheduled && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/10 rounded-l-lg z-30"
                                  onPointerDown={(e) =>
                                    handlePointerDown(
                                      e,
                                      t._id,
                                      "resize-left",
                                      currentStart,
                                      currentEnd
                                    )
                                  }
                                />
                              )}

                              {/* Task Title inside bar */}
                              <span className="text-[10px] font-bold truncate pointer-events-none select-none">
                                {isUnscheduled ? `⚠️ Unscheduled: ${t.name}` : t.name}
                              </span>

                              {/* Right Resize Handle */}
                              {!isUnscheduled && (
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/10 rounded-r-lg z-30"
                                  onPointerDown={(e) =>
                                    handlePointerDown(
                                      e,
                                      t._id,
                                      "resize-right",
                                      currentStart,
                                      currentEnd
                                    )
                                  }
                                />
                              )}

                              {/* Task Dates Drag Preview Tooltip */}
                              {dragState?.taskId === t._id && (
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                                  {currentStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  {" → "}
                                  {currentEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  {` (${Math.round((currentEnd.getTime() - currentStart.getTime()) / 86400000)}d)`}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Drawers & Form Modals */}
      {currentDrawerTask && (
        <TaskDetailDrawer
          task={currentDrawerTask}
          projectId={projectId}
          members={members}
          onClose={() => setDrawerTask(null)}
          onEdit={(t) => {
            setDrawerTask(null);
            handleEdit(t);
          }}
          onDelete={(t) => {
            setDrawerTask(null);
            setTaskToDelete(t);
          }}
        />
      )}

      {currentDrawerCR && (
        <CRDetailDrawer
          cr={currentDrawerCR}
          projectId={projectId}
          members={members}
          onClose={() => setDrawerCR(null)}
          onEdit={() => {}} // handled externally inside CR tab or read-only
          onDelete={() => {}}
        />
      )}

      {showForm && (
        <TaskFormModal
          open={showForm}
          onOpenChange={(v) => {
            setShowForm(v);
            if (!v) {
              setEditingTask(null);
              setParentTask(null);
            }
          }}
          projectId={projectId}
          task={editingTask}
          parentTask={parentTask}
          availableMembers={members}
        />
      )}

      <ConfirmDialog
        open={!!taskToDelete}
        onOpenChange={(v) => {
          if (!v) setTaskToDelete(null);
        }}
        title="Delete Task"
        description={`Delete "${taskToDelete?.name}"? Sub-tasks will also be removed.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
