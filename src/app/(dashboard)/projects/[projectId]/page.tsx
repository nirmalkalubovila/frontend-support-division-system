"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, FolderKanban, LayoutDashboard, CheckSquare, Plus,
  Calendar, Mail, Phone, Tag, Users, BarChart3,
  AlertCircle, CheckCircle2, GitPullRequest, Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/atoms/statCard";
import { ConfirmDialog } from "@/components/molecules/confirmDialog";
import { TaskFormModal } from "@/components/organisms/taskFormModal/task-form-modal";
import { KanbanBoard } from "@/components/organisms/kanbanBoard/kanban-board";
import { CRFormModal } from "@/components/organisms/crFormModal/cr-form-modal";
import { CRDetailDrawer } from "@/components/organisms/crDetailDrawer/cr-detail-drawer";
import { CRKanbanBoard } from "@/components/organisms/crKanbanBoard/cr-kanban-board";
import { CreateIssueModal } from "@/components/organisms/createIssueModal/create-issue-modal";
import { IssueDetailsModal } from "@/components/organisms/issueDetailsModal/issue-details-modal";
import { useKanbanSocket } from "@/hooks/use-kanban-socket";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { useGetProjectById } from "@/api/services/project-management/project-service";
import { useGetIssues } from "@/api/services/issue-management/issue-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import { useGetProjectTasks } from "@/api/services/project-management/task-service";
import type { User } from "@/api/services/user-management/user-service";
import { TasksTab, CRTab, IssuesTab } from "./tabs";

// ─────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
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
  task, depth, children, allTasks, onEdit, onDelete, onAddChild,
}: {
  task: Task; depth: number; children: Task[]; allTasks: Task[];
  onEdit: (t: Task) => void; onDelete: (t: Task) => void; onAddChild: (t: Task) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        <button onClick={() => setExpanded((v) => !v)} className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${!hasChildren ? "invisible" : ""}`}>
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_STYLES[task.status].dot}`} />

        <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{task.name}</span>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[task.status].badge}`}>{task.status}</span>

        <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />{task.priority}
        </span>

        {task.cr && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-0.5 shrink-0">
            <GitPullRequest className="h-2.5 w-2.5" />{typeof task.cr === "object" ? task.cr.crNumber : "CR"}
          </span>
        )}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1 shrink-0">
            {task.assignees.slice(0, 3).map((a) => (
              <div key={a._id} title={a.name}
                className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] border border-[var(--surface)] flex items-center justify-center text-white text-[8px] font-bold">
                {a.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 hidden sm:block">{fmtDate(task.endDate)}</span>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onAddChild(task)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--primary)]" title="Add sub-task"><Plus className="h-3 w-3" /></button>
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--primary)]"><Pencil className="h-3 w-3" /></button>
          <button onClick={() => onDelete(task)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>

      {expanded && hasChildren && children.map((child) => (
        <HierarchyRow
          key={child._id} task={child} depth={depth + 1}
          children={allTasks.filter((t) => getParentId(t) === child._id)}
          allTasks={allTasks} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tasks Tab
// ─────────────────────────────────────────────────────────────
export function TasksTab({ projectId, members }: { projectId: string; members: User[] }) {
  const [taskView, setTaskView] = useState<"hierarchy" | "kanban">("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useGetProjectTasks(projectId);
  const deleteMutation = useDeleteTask(projectId);

  const rootTasks = useMemo(() => tasks.filter((t) => !getParentId(t)), [tasks]);

  const handleEdit = (t: Task) => { setEditingTask(t); setParentTask(null); setShowForm(true); };
  const handleAddChild = (t: Task) => { setEditingTask(null); setParentTask(t); setShowForm(true); };
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await deleteMutation.mutateAsync(taskToDelete._id);
      toast.success("Task deleted.");
      setTaskToDelete(null);
    } catch { toast.error("Failed to delete task."); }
  };

  return (
    <div className="space-y-4">
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

      {taskView === "kanban" ? (
        <KanbanBoard projectId={projectId} members={members} />
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
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--background)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex-1 pl-10">Task Name</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-24 shrink-0">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-20 shrink-0">Priority</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-16 shrink-0 hidden sm:block">Assignees</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-24 shrink-0 hidden sm:block">Due Date</span>
            <span className="w-20 shrink-0" />
          </div>
          <div className="divide-y divide-[var(--border)]">
            {rootTasks.map((t) => (
              <HierarchyRow key={t._id} task={t} depth={0}
                children={tasks.filter((c) => getParentId(c) === t._id)}
                allTasks={tasks}
                onEdit={handleEdit}
                onDelete={(t) => setTaskToDelete(t)}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        </div>
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
export function CRTab({ projectId, members }: { projectId: string; members: User[] }) {
  const [crView, setCRView] = useState<"list" | "kanban">("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingCR, setEditingCR] = useState<ChangeRequest | null>(null);
  const [drawerCR, setDrawerCR] = useState<ChangeRequest | null>(null);
  const [crToDelete, setCRToDelete] = useState<ChangeRequest | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<CRStatus>("Draft");

  const { data: crsData, isLoading: crsLoading } = useGetProjectCRs(projectId);
  const { data: stats } = useGetCRStats(projectId);
  const deleteMutation = useDeleteCR(projectId);

  const crs = crsData?.data ?? [];

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

  const statItems = [
    { label: "Total CRs", value: stats?.total ?? 0, color: "text-[var(--primary)]" },
    { label: "Open", value: stats?.open ?? 0, color: "text-blue-600" },
    { label: "Approved", value: stats?.approved ?? 0, color: "text-emerald-600" },
    { label: "In Dev", value: stats?.inDevelopment ?? 0, color: "text-indigo-600" },
    { label: "Completed", value: stats?.completed ?? 0, color: "text-green-600" },
    { label: "Rejected", value: stats?.rejected ?? 0, color: "text-red-500" },
    { label: "Est. Hours", value: `${stats?.totalEstimatedHours ?? 0}h`, color: "text-[var(--text-primary)]" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {statItems.map(({ label, value, color }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
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
          <Button size="sm" onClick={() => { setEditingCR(null); setShowForm(true); }}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white h-9">
            <Plus className="h-3.5 w-3.5" /> New Change Request
          </Button>
        )}
      </div>

      {/* Kanban View */}
      {crView === "kanban" && (
        <CRKanbanBoard
          projectId={projectId}
          members={members}
          onCRClick={(cr) => setDrawerCR(cr)}
          onEdit={(cr) => { setEditingCR(cr); setShowForm(true); }}
          onDelete={(cr) => setCRToDelete(cr)}
          onAdd={(status) => { setEditingCR(null); setDefaultStatus(status ?? "Draft"); setShowForm(true); }}
        />
      )}

      {/* List View */}
      {crView === "list" && (
        crsLoading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}</div>
        ) : crs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GitPullRequest className="h-10 w-10 text-[var(--text-tertiary)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No change requests yet</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Create your first CR to start tracking changes.</p>
            <Button size="sm" onClick={() => { setEditingCR(null); setShowForm(true); }}
              className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
              <Plus className="h-3.5 w-3.5" /> New Change Request
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background)]">
              {["CR #", "Title", "Type", "Priority", "Status", "Requested By", "Est. Hrs", "Target Date", "Tasks"].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {crs.map((cr) => {
                const pmName = typeof cr.assignedProjectManager === "object" ? cr.assignedProjectManager?.name : null;
                const tp = cr.taskProgress;
                return (
                  <div
                    key={cr._id}
                    onClick={() => setDrawerCR(cr)}
                    className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer items-center group"
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
                    <div className="flex flex-col gap-1">
                      {(tp?.total ?? 0) > 0 ? (
                        <>
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium">{tp.done}/{tp.total}</span>
                          <div className="h-1 w-full rounded-full bg-[var(--surface-hover)] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 rounded-full transition-all" style={{ width: `${tp.completionPercentage}%` }} />
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-[var(--text-tertiary)]">No tasks</span>
                      )}
                    </div>
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
// Issues Tab
// ─────────────────────────────────────────────────────────────

const ISSUE_PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#6b7280",
};
const ISSUE_PRIORITY_BG: Record<string, string> = {
  Critical: "rgba(239,68,68,0.10)", High: "rgba(249,115,22,0.10)",
  Medium: "rgba(234,179,8,0.10)",   Low: "rgba(107,114,128,0.10)",
};
const ISSUE_TYPE_STYLE: Record<string, string> = {
  "Bug": "bg-red-50 text-red-600 border border-red-200",
  "Feature Request": "bg-indigo-50 text-indigo-600 border border-indigo-200",
  "Access Issue": "bg-purple-50 text-purple-600 border border-purple-200",
  "Data Correction": "bg-amber-50 text-amber-600 border border-amber-200",
  "Performance": "bg-cyan-50 text-cyan-600 border border-cyan-200",
  "Consultation": "bg-emerald-50 text-emerald-600 border border-emerald-200",
};

function IssuesTab({ projectId }: { projectId: string }) {
  // Socket for real-time issue updates
  useKanbanSocket(projectId);

  const { data: issuesData, isLoading } = useGetIssues({
    project: projectId, limit: 200, sortBy: "createdAt:desc",
  });
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");

  const issues = issuesData?.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return issues;
    const q = search.toLowerCase();
    return issues.filter((i) => i.title.toLowerCase().includes(q) || i.issueId.toLowerCase().includes(q));
  }, [issues, search]);

  const byStatus = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const col of KANBAN_COLUMNS) map[col] = [];
    for (const issue of filtered) {
      if (map[issue.status]) map[issue.status].push(issue);
      else if (map["Backlog"]) map["Backlog"].push(issue);
    }
    return map;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: issues.length,
    open: issues.filter((i) => !["Resolved", "Closed"].includes(i.status)).length,
    resolved: issues.filter((i) => ["Resolved", "Closed"].includes(i.status)).length,
    critical: issues.filter((i) => i.priority === "Critical").length,
  }), [issues]);

  return (
    <div className="space-y-5">
      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: "Total",    value: stats.total,    color: "text-[var(--text-primary)]" },
            { label: "Open",     value: stats.open,     color: "text-blue-600" },
            { label: "Resolved", value: stats.resolved, color: "text-emerald-600" },
            { label: "Critical", value: stats.critical, color: stats.critical > 0 ? "text-red-500 font-extrabold" : "text-[var(--text-primary)]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-center min-w-[64px]">
              <p className={`text-base font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
            <button onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "board" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
            <button onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "list" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}>
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues..."
              className="pl-8 pr-8 h-9 w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><XIcon className="h-3 w-3" /></button>}
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white h-9">
            <Plus className="h-3.5 w-3.5" /> New Issue
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-48 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl text-center">
          <Ticket className="h-10 w-10 text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">No issues yet</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Log the first issue for this project.</p>
          <Button size="sm" onClick={() => setShowCreate(true)}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
            <Plus className="h-3.5 w-3.5" /> New Issue
          </Button>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background)]">
            {["ID", "Title", "Type", "Priority", "Status", "Assignee"].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((issue) => {
              const assignee = typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo : null;
              return (
                <div key={issue._id} onClick={() => { setSelectedIssue(issue); setShowDetails(true); }}
                  className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 hover:bg-[var(--surface-hover)] cursor-pointer items-center group transition-colors">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{issue.issueId}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">{issue.title}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${ISSUE_TYPE_STYLE[issue.type] ?? "bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{issue.type}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit"
                    style={{ color: ISSUE_PRIORITY_COLORS[issue.priority], backgroundColor: ISSUE_PRIORITY_BG[issue.priority] }}>
                    {issue.priority}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]" />{issue.status}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] truncate">
                    {assignee ? assignee.name : <span className="text-[var(--text-tertiary)] italic">Unassigned</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Board View */
        <div className="overflow-x-auto pb-4">
          <div className="grid gap-3 min-w-max" style={{ gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, 200px)` }}>
            {KANBAN_COLUMNS.map((col) => {
              const colIssues = byStatus[col] ?? [];
              return (
                <div key={col} className="bg-[var(--background)] border border-[var(--border)] rounded-xl flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[var(--text-tertiary)]" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">{col}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">{colIssues.length}</span>
                  </div>
                  <div className="flex-1 px-2.5 pb-3 pt-2 space-y-2 overflow-y-auto">
                    {colIssues.length === 0 ? (
                      <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--text-tertiary)]">Empty</div>
                    ) : colIssues.map((issue) => {
                      const assignee = typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo : null;
                      const dueDate = new Date(issue.dueDate);
                      const overdue = dueDate < new Date() && !["Resolved","Closed"].includes(issue.status);
                      return (
                        <div key={issue._id} onClick={() => { setSelectedIssue(issue); setShowDetails(true); }}
                          className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3 space-y-2 hover:border-[var(--primary)] hover:shadow-md transition-all cursor-pointer group">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{issue.issueId}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ color: ISSUE_PRIORITY_COLORS[issue.priority], backgroundColor: ISSUE_PRIORITY_BG[issue.priority] }}>
                              {issue.priority}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors leading-snug">{issue.title}</p>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${ISSUE_TYPE_STYLE[issue.type] ?? "bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{issue.type}</span>
                            <span className={`text-[9px] font-medium flex items-center gap-0.5 ${overdue ? "text-red-500" : "text-[var(--text-tertiary)]"}`}>
                              {overdue && <AlertTriangle className="h-2.5 w-2.5" />}
                              <Clock className="h-2.5 w-2.5" />
                              {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                {assignee.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[10px] text-[var(--text-secondary)] truncate">{assignee.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreateIssueModal open={showCreate} onOpenChange={setShowCreate} />
      <IssueDetailsModal issue={selectedIssue} open={showDetails} onOpenChange={setShowDetails} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard Tab
// ─────────────────────────────────────────────────────────────
function DashboardTab({ projectId }: { projectId: string }) {
  const { data: project, isLoading } = useGetProjectById(projectId);
  const { data: issuesData } = useGetIssues({ project: projectId, limit: 200 });
  const { data: tasks = [] } = useGetProjectTasks(projectId);

  const issues = issuesData?.data ?? [];

  const issueStats = useMemo(() => ({
    total: issues.length,
    open: issues.filter((i) => !["Resolved", "Closed"].includes(i.status)).length,
    resolved: issues.filter((i) => ["Resolved", "Closed"].includes(i.status)).length,
    critical: issues.filter((i) => i.priority === "Critical").length,
  }), [issues]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === "Done").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
  }), [tasks]);

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map((i) => <div key={i} className="h-24 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}
    </div>
  );

  if (!project) return null;

  const photoUrl = project.photo ? `http://localhost:5001${project.photo}` : null;

  return (
    <div className="space-y-6">
      {/* Project Summary Card */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt={project.name} className="h-16 w-16 rounded-xl object-cover border border-[var(--border)] shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-2xl shrink-0">
                {project.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{project.name}</h2>
                <Badge variant={project.isActive ? "default" : "secondary"}
                  className={`text-[10px] font-bold ${project.isActive ? "bg-[var(--success)] text-white border-0" : ""}`}>
                  {project.isActive ? "Active" : "Inactive"}
                </Badge>
                {project.projectType?.map((t) => (
                  <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">{t}</span>
                ))}
              </div>

              {project.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">{project.description}</p>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Completion</span>
                  <span className="font-semibold text-[var(--primary)]">{project.completion ?? 0}%</span>
                </div>
                <Progress value={project.completion ?? 0} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={AlertCircle} label="Open Issues" value={issueStats.open} />
        <StatCard icon={CheckCircle2} label="Resolved Issues" value={issueStats.resolved} />
        <StatCard icon={CheckSquare} label="Total Tasks" value={taskStats.total} />
        <StatCard icon={BarChart3} label="Tasks Done" value={`${taskStats.done}/${taskStats.total}`} />
      </div>

      {/* Two-column: Info + Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Start Date</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtDate(project.startDate)}</span>
            </div>
            <Separator className="bg-[var(--border)]" />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">End Date</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtDate(project.endDate)}</span>
            </div>
            <Separator className="bg-[var(--border)]" />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Total Issues</span>
              <span className="font-semibold text-[var(--text-primary)]">{issueStats.total}</span>
            </div>
            <Separator className="bg-[var(--border)]" />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Critical Issues</span>
              <span className={`font-semibold ${issueStats.critical > 0 ? "text-red-500" : "text-[var(--text-primary)]"}`}>{issueStats.critical}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Users className="h-4 w-4" /> Main Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(project.mainContact?.name || project.mainContact?.email || project.mainContact?.phone) ? (
              <div className="space-y-3">
                {project.mainContact.name && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold shrink-0">
                      {project.mainContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{project.mainContact.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Primary Contact</p>
                    </div>
                  </div>
                )}
                {project.mainContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                    <a href={`mailto:${project.mainContact.email}`} className="text-[var(--primary)] hover:underline truncate">
                      {project.mainContact.email}
                    </a>
                  </div>
                )}
                {project.mainContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                    <span className="text-[var(--text-primary)]">{project.mainContact.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No contact information set.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack */}
      {project.techStack?.length > 0 && (
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span key={tech} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                  {tech}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Issues */}
      {issues.length > 0 && (
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {issues.slice(0, 5).map((issue) => (
              <div key={issue._id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${issue.priority === "Critical" ? "bg-red-500" : issue.priority === "High" ? "bg-orange-500" : issue.priority === "Medium" ? "bg-yellow-400" : "bg-green-500"}`} />
                  <span className="text-sm text-[var(--text-primary)] truncate">{issue.title}</span>
                </div>
                <span className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 ml-2">{issue.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project, isLoading } = useGetProjectById(projectId);
  const { data: allUsers = [] } = useGetAllUsers();

  const members = useMemo(() => {
    if (!project) return allUsers;
    if (Array.isArray(project.members) && project.members.length > 0 && typeof project.members[0] === "object") {
      return project.members as unknown as User[];
    }
    return allUsers;
  }, [project, allUsers]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-lg animate-pulse" />
        <div className="h-32 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderKanban className="h-12 w-12 text-[var(--text-tertiary)] mb-3" />
        <p className="text-base font-semibold text-[var(--text-primary)]">Project not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/projects")} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/projects")} className="gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] h-8 px-2">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Button>
        <span className="text-[var(--text-tertiary)]">/</span>
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</span>
          <Badge variant={project.isActive ? "default" : "secondary"}
            className={`text-[9px] font-bold ${project.isActive ? "bg-[var(--success)] text-white border-0" : ""}`}>
            {project.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Tabbed Layout */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="bg-[var(--background)] border border-[var(--border)] h-10">
          <TabsTrigger value="dashboard" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <CheckSquare className="h-4 w-4" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="crs" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <GitPullRequest className="h-4 w-4" /> CR
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <Ticket className="h-4 w-4" /> Issues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab projectId={projectId} members={members} />
        </TabsContent>

        <TabsContent value="crs">
          <CRTab projectId={projectId} members={members} />
        </TabsContent>

        <TabsContent value="issues">
          <IssuesTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
