"use client";

import React, { useState, useMemo } from "react";
import { Plus, Link as LinkIcon, Unlink, Clock, AlertCircle, GitPullRequest, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskFormModal } from "@/components/organisms/taskFormModal/task-form-modal";
import { ConfirmDialog } from "@/components/molecules/confirmDialog";
import {
  useLinkTaskToCR, useUnlinkTaskFromCR,
  type ChangeRequest,
} from "@/api/services/project-management/cr-service";
import { useGetProjectTasks, type Task, type TaskStatus } from "@/api/services/project-management/task-service";
import type { User } from "@/api/services/user-management/user-service";

// ── Style maps ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TaskStatus, string> = {
  "To Do":       "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Review":      "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Done":        "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_DOT: Record<TaskStatus, string> = {
  "To Do":       "bg-slate-400",
  "In Progress": "bg-yellow-400",
  "Review":      "bg-indigo-400",
  "Done":        "bg-emerald-500",
};

const PRIORITY_DOT: Record<string, string> = {
  Critical: "bg-red-500", High: "bg-orange-500", Medium: "bg-yellow-400", Low: "bg-green-500",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Progress Summary ──────────────────────────────────────────────────────────

function TaskProgressSummary({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "To Do").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const review = tasks.filter((t) => t.status === "Review").length;
  const done = tasks.filter((t) => t.status === "Done").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Implementation Progress</span>
        <span className="text-sm font-bold text-[var(--primary)]">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { label: "Total",       value: total,      color: "text-[var(--text-primary)]" },
          { label: "To Do",       value: todo,       color: "text-slate-500" },
          { label: "In Progress", value: inProgress, color: "text-yellow-600" },
          { label: "Review",      value: review,     color: "text-indigo-600" },
          { label: "Done",        value: done,       color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className={`text-base font-bold ${color}`}>{value}</p>
            <p className="text-[9px] text-[var(--text-tertiary)] font-medium leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Linked Task Row ───────────────────────────────────────────────────────────

function LinkedTaskRow({ task, onUnlink }: { task: Task; onUnlink: () => void }) {
  const overdue = task.endDate && task.status !== "Done" && new Date(task.endDate) < new Date();
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-[var(--surface-hover)] transition-colors group">
      <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[task.status]}`} />
      <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{task.name}</span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[task.status]}`}>
        {task.status}
      </span>
      <span className="flex items-center gap-0.5 shrink-0">
        <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        <span className="text-[10px] text-[var(--text-secondary)]">{task.priority}</span>
      </span>
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
      <span className={`text-[10px] shrink-0 hidden sm:flex items-center gap-0.5 ${overdue ? "text-red-500 font-semibold" : "text-[var(--text-tertiary)]"}`}>
        {overdue && <AlertCircle className="h-2.5 w-2.5" />}
        <Clock className="h-2.5 w-2.5" />{fmtDate(task.endDate)}
      </span>
      <button
        onClick={onUnlink}
        title="Unlink from CR"
        className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
      >
        <Unlink className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Link Picker ───────────────────────────────────────────────────────────────

function LinkTaskPicker({ allTasks, linkedIds, onLink, onClose }: {
  allTasks: Task[];
  linkedIds: Set<string>;
  onLink: (taskId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const available = allTasks.filter(
    (t) => !linkedIds.has(t._id) && (!search.trim() || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-[var(--border)]">
        <Search className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks to link..."
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto divide-y divide-[var(--border)]">
        {available.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No unlinked tasks found</p>
        ) : available.map((t) => (
          <button
            key={t._id}
            onClick={() => { onLink(t._id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors text-left"
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[t.status]}`} />
            <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{t.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[t.status]}`}>{t.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

interface CRTasksPanelProps {
  cr: ChangeRequest;
  projectId: string;
  members: User[];
}

export function CRTasksPanel({ cr, projectId, members }: CRTasksPanelProps) {
  // Derive linked tasks from the already-live project tasks cache (kept
  // real-time by useKanbanSocket in the parent kanban board). This means
  // newly-created tasks and status changes appear instantly without a
  // separate polling query.
  const { data: allTasks = [], isLoading } = useGetProjectTasks(projectId, true);
  const linkMutation = useLinkTaskToCR(projectId);
  const unlinkMutation = useUnlinkTaskFromCR(projectId);

  const linkedTasks = useMemo(
    () => allTasks.filter((t) => t.cr && (typeof t.cr === "object" ? t.cr._id : t.cr) === cr._id),
    [allTasks, cr._id]
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [taskToUnlink, setTaskToUnlink] = useState<Task | null>(null);

  const linkedIds = useMemo(() => new Set(linkedTasks.map((t) => t._id)), [linkedTasks]);

  const handleLink = async (taskId: string) => {
    try {
      await linkMutation.mutateAsync({ crId: cr._id, taskId });
      toast.success("Task linked to CR");
    } catch { toast.error("Failed to link task"); }
  };

  const handleUnlink = async () => {
    if (!taskToUnlink) return;
    try {
      await unlinkMutation.mutateAsync({ crId: cr._id, taskId: taskToUnlink._id });
      toast.success("Task unlinked");
      setTaskToUnlink(null);
    } catch { toast.error("Failed to unlink task"); }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={() => setShowCreateForm(true)}
          className="gap-1.5 h-8 text-xs bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
          <Plus className="h-3.5 w-3.5" /> Create Task
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowPicker((v) => !v)}
          className="gap-1.5 h-8 text-xs border-[var(--border)]">
          <LinkIcon className="h-3.5 w-3.5" /> Link Existing
        </Button>
      </div>

      {showPicker && (
        <LinkTaskPicker allTasks={allTasks} linkedIds={linkedIds} onLink={handleLink} onClose={() => setShowPicker(false)} />
      )}

      {linkedTasks.length > 0 && <TaskProgressSummary tasks={linkedTasks} />}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-xl bg-[var(--surface-hover)] animate-pulse" />)}
        </div>
      ) : linkedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[var(--border)] rounded-xl text-center">
          <GitPullRequest className="h-8 w-8 text-[var(--text-tertiary)] mb-2" />
          <p className="text-xs font-semibold text-[var(--text-primary)]">No tasks linked yet</p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Create a new task or link an existing one.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
          {linkedTasks.map((task) => (
            <LinkedTaskRow key={task._id} task={task} onUnlink={() => setTaskToUnlink(task)} />
          ))}
        </div>
      )}

      <TaskFormModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        projectId={projectId}
        availableMembers={members}
        crId={cr._id}
        crNumber={cr.crNumber}
      />

      {taskToUnlink && (
        <ConfirmDialog
          open={!!taskToUnlink}
          onOpenChange={(v) => { if (!v) setTaskToUnlink(null); }}
          title="Unlink Task"
          description={`Remove "${taskToUnlink?.name}" from this CR? The task will not be deleted.`}
          confirmLabel="Unlink"
          variant="destructive"
          onConfirm={handleUnlink}
          loading={unlinkMutation.isPending}
        />
      )}
    </div>
  );
}
