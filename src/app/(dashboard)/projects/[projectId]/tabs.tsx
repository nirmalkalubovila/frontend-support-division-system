"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CheckSquare, Plus, Clock, GitBranch, Kanban, Pencil, Trash2,
  ChevronRight, ChevronDown, GitPullRequest, List,
  Ticket, LayoutGrid, Search, SlidersHorizontal, ChevronUp, Calendar, Eye, AlertCircle, X, AlertTriangle, User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/molecules/confirmDialog";
import { TaskFormModal } from "@/components/organisms/taskFormModal/task-form-modal";
import { KanbanBoard, TaskDetailDrawer } from "@/components/organisms/kanbanBoard/kanban-board";
import { CRFormModal } from "@/components/organisms/crFormModal/cr-form-modal";
import { CRDetailDrawer } from "@/components/organisms/crDetailDrawer/cr-detail-drawer";
import { CRKanbanBoard } from "@/components/organisms/crKanbanBoard/cr-kanban-board";
import { CreateIssueModal, IssueDetailsModal, Input, Select, Badge, Card, CardContent } from "@/components";
import {
  useGetProjectTasks, useDeleteTask,
  type Task, type TaskStatus,
} from "@/api/services/project-management/task-service";
import {
  useGetProjectCRs, useDeleteCR,
  type ChangeRequest, type CRStatus,
} from "@/api/services/project-management/cr-service";
import { useGetIssues, type Issue } from "@/api/services/issue-management/issue-service";
import { useGetCategories } from "@/api/services/system/settings-service";
import type { User } from "@/api/services/user-management/user-service";
import { KANBAN_COLUMNS, PRIORITIES, ISSUE_TYPES } from "@/lib/constants";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TaskStatus, { card: string; dot: string; badge: string }> = {
  "To Do":       { card: "border-[var(--border)]",           dot: "bg-[var(--text-tertiary)]",  badge: "bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)]" },
  "In Progress": { card: "border-yellow-300",                dot: "bg-yellow-400",               badge: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  "Review":      { card: "border-[rgba(99,102,241,0.4)]",   dot: "bg-[var(--primary)]",         badge: "bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]" },
  "Done":        { card: "border-green-300",                 dot: "bg-green-500",                badge: "bg-green-50 text-green-700 border border-green-200" },
};

const PRIORITY_DOT: Record<string, string> = {
  Critical: "bg-red-500", High: "bg-orange-500", Medium: "bg-yellow-400", Low: "bg-green-500",
};

const CR_STATUS_BADGE: Record<string, string> = {
  "Submitted": "bg-blue-50 text-blue-700 border-blue-200",
  "Rejected": "bg-red-50 text-red-600 border-red-200",
  "In Development": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Testing": "bg-purple-50 text-purple-700 border-purple-200",
  "Completed": "bg-green-50 text-green-700 border-green-200",
  "Closed": "bg-gray-100 text-gray-500 border-gray-200",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getParentId(t: Task): string | null {
  if (!t.parent) return null;
  return typeof t.parent === "object" ? (t.parent as { _id: string })._id : t.parent;
}

// ─────────────────────────────────────────────────────────────
// Task Kanban Card
// ─────────────────────────────────────────────────────────────
function KanbanTaskCard({
  task, onEdit, onDelete, onAddChild,
}: { task: Task; onEdit: () => void; onDelete: () => void; onAddChild: () => void }) {
  return (
    <div className={`bg-[var(--surface)] rounded-xl border ${STATUS_STYLES[task.status].card} p-3 space-y-2.5 hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)] leading-snug">{task.name}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onAddChild} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)]" title="Add sub-task"><Plus className="h-3 w-3" /></button>
          <button onClick={onEdit} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)]"><Pencil className="h-3 w-3" /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${PRIORITY_DOT[task.priority] ? "" : ""}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
          <span className="text-[var(--text-secondary)]">{task.priority}</span>
        </span>
        {task.endDate && (
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />{fmtDate(task.endDate)}
          </span>
        )}
      </div>

      {task.assignees.length > 0 && (
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 4).map((a) => (
            <div key={a._id} title={a.name}
              className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] border-2 border-[var(--surface)] flex items-center justify-center text-white text-[9px] font-bold">
              {a.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {task.assignees.length > 4 && (
            <div className="h-6 w-6 rounded-full bg-[var(--background)] border-2 border-[var(--surface)] flex items-center justify-center text-[9px] font-semibold text-[var(--text-tertiary)]">
              +{task.assignees.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Task Hierarchy Row
// ─────────────────────────────────────────────────────────────
function HierarchyRow({
  task, depth, children, allTasks, onEdit, onDelete, onAddChild, onView,
}: {
  task: Task; depth: number; children: Task[]; allTasks: Task[];
  onEdit: (t: Task) => void; onDelete: (t: Task) => void; onAddChild: (t: Task) => void; onView: (t: Task) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        onClick={() => onView(task)}
        className="grid grid-cols-[1fr_120px_100px_80px_110px_88px] items-center py-2 px-3 hover:bg-[var(--surface-hover)] transition-colors group cursor-pointer"
      >
        {/* Task Name cell — indented by depth */}
        <div className="flex items-center gap-1.5 min-w-0" style={{ paddingLeft: `${depth * 20}px` }}>
          <button onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }} className={`shrink-0 text-[var(--text-tertiary)] ${!hasChildren ? "invisible" : ""}`}>
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_STYLES[task.status].dot}`} />
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{task.name}</span>
        </div>

        {/* Status */}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_STYLES[task.status].badge}`}>{task.status}</span>

        {/* Priority */}
        <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />{task.priority}
        </span>

        {/* Assignees */}
        <div className="flex -space-x-1 hidden sm:flex">
          {task.assignees.slice(0, 3).map((a) => (
            <div key={a._id} title={a.name}
              className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] border border-[var(--surface)] flex items-center justify-center text-white text-[8px] font-bold shrink-0">
              {a.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {task.assignees.length === 0 && <span className="text-[10px] text-[var(--text-tertiary)]">—</span>}
        </div>

        {/* Due Date */}
        <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:block">{fmtDate(task.endDate)}</span>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAddChild(task)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--primary)]" title="Add sub-task"><Plus className="h-3 w-3" /></button>
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--primary)]"><Pencil className="h-3 w-3" /></button>
          <button onClick={() => onDelete(task)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>

      {expanded && hasChildren && children.map((child) => (
        <HierarchyRow
          key={child._id} task={child} depth={depth + 1}
          children={allTasks.filter((t) => getParentId(t) === child._id)}
          allTasks={allTasks} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onView={onView}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tasks Tab
// ─────────────────────────────────────────────────────────────
export function TasksTab({ projectId, members, externalViewMode, showAddTaskExternal, filterSearch, filterPriority, filterAssignee }: { projectId: string; members: User[]; externalViewMode?: "kanban" | "list"; showAddTaskExternal?: boolean; filterSearch?: string; filterPriority?: string; filterAssignee?: string }) {
  const [taskView, setTaskView] = useState<"hierarchy" | "kanban">(externalViewMode === "list" ? "hierarchy" : "kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useGetProjectTasks(projectId);

  const currentDrawerTask = useMemo(
    () => drawerTask ? tasks.find((t) => t._id === drawerTask._id) ?? drawerTask : null,
    [drawerTask, tasks]
  );
  const deleteMutation = useDeleteTask(projectId);

  const rootTasks = useMemo(() => {
    let filtered = tasks.filter((t) => !getParentId(t));
    if (filterSearch) filtered = filtered.filter((t) => t.name.toLowerCase().includes(filterSearch.toLowerCase()));
    if (filterPriority) filtered = filtered.filter((t) => t.priority === filterPriority);
    if (filterAssignee) filtered = filtered.filter((t) => t.assignees.some((a) => a._id === filterAssignee));
    return filtered;
  }, [tasks, filterSearch, filterPriority, filterAssignee]);

  const handleEdit = (t: Task) => { setEditingTask(t); setParentTask(null); setDrawerTask(null); setShowForm(true); };
  const handleAddChild = (t: Task) => { setEditingTask(null); setParentTask(t); setShowForm(true); };
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await deleteMutation.mutateAsync(taskToDelete._id);
      toast.success("Task deleted.");
      setTaskToDelete(null);
    } catch { toast.error("Failed to delete task."); }
  };

  // Sync external view mode
  React.useEffect(() => {
    if (externalViewMode === "list") setTaskView("hierarchy");
    else if (externalViewMode === "kanban") setTaskView("kanban");
  }, [externalViewMode]);

  // Open form when triggered externally
  React.useEffect(() => {
    if (showAddTaskExternal) { setEditingTask(null); setParentTask(null); setShowForm(true); }
  }, [showAddTaskExternal]);



  return (
    <div className="space-y-4">
      {!externalViewMode && (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
          <button onClick={() => setTaskView("hierarchy")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              taskView === "hierarchy" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}>
            <GitBranch className="h-3.5 w-3.5" /> Hierarchy
          </button>
          <button onClick={() => setTaskView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              taskView === "kanban" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}>
            <Kanban className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>

        {taskView === "hierarchy" && (
          <Button size="sm" onClick={() => { setEditingTask(null); setParentTask(null); setShowForm(true); }}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white h-8">
            <Plus className="h-3.5 w-3.5" /> New Task
          </Button>
        )}
      </div>
      )}

      {taskView === "kanban" ? (
        <KanbanBoard projectId={projectId} members={members} hideToolbar={!!externalViewMode} />
      ) : isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckSquare className="h-10 w-10 text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">No tasks yet</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Create your first task to get started.</p>
          <Button size="sm" onClick={() => { setEditingTask(null); setParentTask(null); setShowForm(true); }}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
            <Plus className="h-3.5 w-3.5" /> New Task
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_100px_80px_110px_88px] items-center px-3 py-2 border-b border-[var(--border)] bg-[var(--background)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pl-10">Task Name</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Priority</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hidden sm:block">Assignees</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hidden sm:block">Due Date</span>
            <span />
          </div>
          <div className="divide-y divide-[var(--border)]">
            {rootTasks.map((t) => (
              <HierarchyRow key={t._id} task={t} depth={0}
                children={tasks.filter((c) => getParentId(c) === t._id)}
                allTasks={tasks}
                onEdit={handleEdit}
                onDelete={(t) => setTaskToDelete(t)}
                onAddChild={handleAddChild}
                onView={(t) => setDrawerTask(t)}
              />
            ))}
          </div>
        </div>
      )}

      {taskView === "hierarchy" && currentDrawerTask && (
        <TaskDetailDrawer
          task={currentDrawerTask}
          projectId={projectId}
          members={members}
          onClose={() => setDrawerTask(null)}
          onEdit={(t) => { setDrawerTask(null); handleEdit(t); }}
          onDelete={(t) => { setDrawerTask(null); setTaskToDelete(t); }}
        />
      )}

      {taskView === "hierarchy" && (
        <>
          {showForm && (
            <TaskFormModal
              open={showForm}
              onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingTask(null); setParentTask(null); } }}
              projectId={projectId}
              task={editingTask}
              parentTask={parentTask}
              availableMembers={members}
            />
          )}
          <ConfirmDialog
            open={!!taskToDelete}
            onOpenChange={(v) => { if (!v) setTaskToDelete(null); }}
            title="Delete Task"
            description={`Delete "${taskToDelete?.name}"? Sub-tasks will also be removed.`}
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={handleDeleteConfirm}
            loading={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CR Tab
// ─────────────────────────────────────────────────────────────
export function CRTab({
  projectId,
  members,
  viewMode: controlledViewMode,
  onNewCR,
  openFormTrigger,
  filterPriority,
  filterStatus,
  filterSearch,
}: {
  projectId: string;
  members: User[];
  /** When provided (from the CR page), the view toggle is controlled externally */
  viewMode?: "list" | "kanban";
  /** Kept for backward compat but not used; use openFormTrigger instead */
  onNewCR?: () => void;
  /** Increment this number to open the new CR form from a parent component */
  openFormTrigger?: number;
  filterPriority?: string;
  filterStatus?: string;
  filterSearch?: string;
}) {
  const [internalCRView, setInternalCRView] = useState<"list" | "kanban">("kanban");
  const crView = controlledViewMode ?? internalCRView;
  const setCRView = controlledViewMode !== undefined ? () => {} : setInternalCRView;

  const [showForm, setShowForm] = useState(false);
  const [editingCR, setEditingCR] = useState<ChangeRequest | null>(null);
  const [drawerCR, setDrawerCR] = useState<ChangeRequest | null>(null);
  const [crToDelete, setCRToDelete] = useState<ChangeRequest | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<CRStatus>("To Do");

  // Open the new CR form whenever the parent increments openFormTrigger
  React.useEffect(() => {
    if (openFormTrigger && openFormTrigger > 0) {
      setEditingCR(null);
      setShowForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFormTrigger]);

  const { data: crsData, isLoading: crsLoading } = useGetProjectCRs(projectId);
  const deleteMutation = useDeleteCR(projectId);

  const crs = crsData?.data ?? [];

  // Apply filters when controlled from outside (CR page)
  const filteredCRs = useMemo(() => {
    if (!controlledViewMode) return crs; // no external filters on project-page tab
    return crs.filter((cr) => {
      if (filterPriority && cr.priority !== filterPriority) return false;
      if (filterStatus && cr.status !== filterStatus) return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        if (
          !cr.title.toLowerCase().includes(q) &&
          !(cr.crNumber ?? "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [crs, controlledViewMode, filterPriority, filterStatus, filterSearch]);

  // Keep drawer CR in sync with latest data
  const currentDrawerCR = useMemo(
    () => drawerCR ? crs.find((c) => c._id === drawerCR._id) ?? drawerCR : null,
    [drawerCR, crs]
  );

  const handleDeleteConfirm = async () => {
    if (!crToDelete) return;
    try {
      await deleteMutation.mutateAsync(crToDelete._id);
      toast.success("Change request deleted.");
      setCRToDelete(null);
      if (drawerCR?._id === crToDelete._id) setDrawerCR(null);
    } catch { toast.error("Failed to delete CR."); }
  };

  // Wire external "New CR" trigger to open the form
  const handleNewCR = () => { setEditingCR(null); setShowForm(true); };

  return (
    <div className="space-y-5">
      {/* Toolbar — only shown when NOT controlled from outside (i.e. on the project page) */}
      {controlledViewMode === undefined && (
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
          <button onClick={() => setCRView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              crView === "list" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}>
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button onClick={() => setCRView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              crView === "kanban" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}>
            <Kanban className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>

        {crView === "list" && (
          <Button size="sm" onClick={handleNewCR}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white h-9">
            <Plus className="h-3.5 w-3.5" /> New Change Request
          </Button>
        )}
      </div>
      )}

      {/* Kanban View */}
      {crView === "kanban" && (
        <CRKanbanBoard
          projectId={projectId}
          members={members}
          onCRClick={(cr) => setDrawerCR(cr)}
          onEdit={(cr) => { setEditingCR(cr); setShowForm(true); }}
          onDelete={(cr) => setCRToDelete(cr)}
          onAdd={(status) => { setEditingCR(null); setDefaultStatus(status ?? "To Do"); setShowForm(true); }}
        />
      )}

      {/* List View */}
      {crView === "list" && (
        crsLoading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}</div>
        ) : filteredCRs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GitPullRequest className="h-10 w-10 text-[var(--text-tertiary)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {crs.length === 0 ? "No change requests yet" : "No CRs match the current filters"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
              {crs.length === 0 ? "Create your first CR to start tracking changes." : "Try adjusting your filters."}
            </p>
            {crs.length === 0 && (
              <Button size="sm" onClick={handleNewCR}
                className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
                <Plus className="h-3.5 w-3.5" /> New Change Request
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background)]">
              {["CR #", "Title", "Type", "Priority", "Status", "Requested By", "Est. Hrs", "Target Date"].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {filteredCRs.map((cr) => {
                return (
                  <div
                    key={cr._id}
                    onClick={() => setDrawerCR(cr)}
                    className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer items-center group"
                  >
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] truncate">{cr.crNumber}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">{cr.title}</span>
                    <span className="text-xs text-[var(--text-secondary)] truncate">{cr.crType}</span>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[cr.priority]}`} />{cr.priority}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border w-fit ${CR_STATUS_BADGE[cr.status] ?? ""}`}>{cr.status}</span>
                    <span className="text-xs text-[var(--text-secondary)] truncate">{cr.requestedBy || "—"}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{cr.estimatedHours != null ? `${cr.estimatedHours}h` : "—"}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{fmtDate(cr.targetReleaseDate)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* CR Form Modal */}
      {showForm && (
        <CRFormModal
          open={showForm}
          onOpenChange={(v) => { setShowForm(v); if (!v) setEditingCR(null); }}
          projectId={projectId}
          cr={editingCR}
          availableMembers={members}
        />
      )}

      {/* CR Detail Drawer */}
      {currentDrawerCR && (
        <CRDetailDrawer
          cr={currentDrawerCR}
          projectId={projectId}
          members={members}
          onClose={() => setDrawerCR(null)}
          onEdit={(cr) => { setDrawerCR(null); setEditingCR(cr); setShowForm(true); }}
          onDelete={(cr) => { setDrawerCR(null); setCRToDelete(cr); }}
        />
      )}



      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!crToDelete}
        onOpenChange={(v) => { if (!v) setCRToDelete(null); }}
        title="Delete Change Request"
        description={`Delete "${crToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete CR"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Priority constants & style helpers for Issues
// ─────────────────────────────────────────────────────────────
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
  "To Do":            { dot: "bg-slate-400",   header: "bg-slate-50 dark:bg-slate-900/30",     addBtn: "hover:bg-slate-100",   card: "border-slate-200 hover:border-slate-300",   badge: "bg-slate-100 text-slate-600 border-slate-200" },
  "In Progress":      { dot: "bg-indigo-400",  header: "bg-indigo-50 dark:bg-indigo-900/20",    addBtn: "hover:bg-indigo-100",  card: "border-indigo-200 hover:border-indigo-400",  badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "Review":          { dot: "bg-purple-400",  header: "bg-purple-50 dark:bg-purple-900/20",    addBtn: "hover:bg-purple-100",  card: "border-purple-200 hover:border-purple-400",  badge: "bg-purple-50 text-purple-700 border-purple-200" },
  "Done":         { dot: "bg-green-400",   header: "bg-green-50 dark:bg-green-900/20",      addBtn: "hover:bg-green-100",   card: "border-green-200 hover:border-green-400",    badge: "bg-green-50 text-green-700 border-green-200" },
};

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

// ─────────────────────────────────────────────────────────────
// Issue Card Component
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Issues Tab Component
// ─────────────────────────────────────────────────────────────
export function IssuesTab({ projectId, members }: { projectId: string; members: User[] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  const { data: categories = [] } = useGetCategories();
  const issueTypes = categories.length > 0 ? categories : ISSUE_TYPES;

  // Fetch project-specific issues
  const { data: issuesData, isLoading } = useGetIssues({
    project: projectId,
    limit: 200,
    search: search || undefined,
    priority: filterPriority || undefined,
    type: filterType || undefined,
    sortBy: "createdAt:desc",
  });

  const issues: Issue[] = issuesData?.data ?? [];

  // Group issues by status for Kanban board
  const projectIssuesByStatus = useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    for (const col of KANBAN_COLUMNS) {
      grouped[col] = [];
    }
    for (const issue of issues) {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      } else {
        if (grouped["To Do"]) {
          grouped["To Do"].push(issue);
        }
      }
    }
    return grouped;
  }, [issues]);

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
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--background)] border border-[var(--border)] w-fit shrink-0">
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "board"
                ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 font-medium shadow-sm transition-all h-8 text-xs ${
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
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all font-semibold h-8 text-xs"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Issue
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search by title or issue ID..."
              className="pl-9 h-9 bg-[var(--background)] border-[var(--border)] text-xs"
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
            className="w-44 h-9 bg-[var(--background)] text-xs"
          />
          <Select
            placeholder="All Types"
            value={filterType}
            onChange={(v) => setFilterType(v)}
            options={[
              { label: "All Types", value: "" },
              ...issueTypes.map((t) => ({ label: t, value: t })),
            ]}
            className="w-48 h-9 bg-[var(--background)] text-xs"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs hover:bg-[var(--surface-hover)] h-8">
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-5 space-y-4 min-h-[220px] animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-secondary)] shadow-sm">
          <Ticket className="h-10 w-10 text-[var(--text-tertiary)] opacity-40 mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No issues found</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Try resetting your filters or create a new issue.</p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1 text-xs h-8">
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      ) : viewMode === "list" ? (
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
                    onClick={() => handleIssueClick(issue)}
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
                        onClick={() => handleIssueClick(issue)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full min-h-[500px]">
          {KANBAN_COLUMNS.map((column) => {
            const columnIssues = projectIssuesByStatus[column] ?? [];
            const cfg = COL_CONFIG[column] ?? COL_CONFIG["To Do"];
            return (
              <div
                key={column}
                className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--background)] min-h-[500px] shadow-sm overflow-hidden"
              >
                {/* Column Header */}
                <div className={`px-3 pt-3 pb-2 border-b border-[var(--border)] ${cfg.header}`}>
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
                        onClick={() => setShowCreateModal(true)}
                        className={`h-6 w-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--primary)] ${cfg.addBtn} transition-colors`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column Issues Cards */}
                <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto min-h-[120px]">
                  {columnIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]/10 p-3 select-none">
                      <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)] mb-1.5" />
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium">No issues</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-2 text-[10px] text-[var(--primary)] font-semibold hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Issue
                      </button>
                    </div>
                  ) : (
                    columnIssues.map((issue) => (
                      <IssueCard
                        key={issue._id}
                        issue={issue}
                        onClick={() => handleIssueClick(issue)}
                      />
                    ))
                  )}
                </div>

                {columnIssues.length > 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`mx-3 mb-3 mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] ${cfg.addBtn} transition-all`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Issue
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          defaultProjectId={projectId}
        />
      )}

      {/* Issue Details Modal */}
      {showDetailsModal && selectedIssue && (
        <IssueDetailsModal
          issue={selectedIssue}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
        />
      )}
    </div>
  );
}
