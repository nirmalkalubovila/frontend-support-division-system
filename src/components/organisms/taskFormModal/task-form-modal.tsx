"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckSquare, Plus, X, Link as LinkIcon, GitPullRequest } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateTask, useUpdateTask,
  type Task, type CreateTaskPayload, type TaskStatus, type TaskPriority,
} from "@/api/services/project-management/task-service";
import type { User } from "@/api/services/user-management/user-service";

const STATUSES: TaskStatus[] = ["To Do", "In Progress", "Review", "Done"];
const PRIORITIES: TaskPriority[] = ["Critical", "High", "Medium", "Low"];

const STATUS_STYLES: Record<TaskStatus, string> = {
  "To Do": "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]",
  "In Progress": "bg-yellow-50 border-yellow-300 text-yellow-700",
  "Review": "bg-[rgba(99,102,241,0.08)] border-[rgba(99,102,241,0.3)] text-[var(--primary)]",
  "Done": "bg-green-50 border-green-300 text-green-700",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Critical: "bg-red-50 border-red-300 text-red-600",
  High: "bg-orange-50 border-orange-300 text-orange-600",
  Medium: "bg-yellow-50 border-yellow-300 text-yellow-700",
  Low: "bg-green-50 border-green-300 text-green-700",
};

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task | null;
  parentTask?: Task | null;
  availableMembers?: User[];
  defaultStatus?: TaskStatus;
  crId?: string | null;
  crNumber?: string | null;
}

const makeEmpty = (defaultStatus: TaskStatus = "To Do"): CreateTaskPayload => ({
  name: "",
  description: "",
  status: defaultStatus,
  priority: "Medium",
  startDate: null,
  endDate: null,
  assignees: [],
  relatedLinks: [],
  parent: null,
  cr: null,
});

export function TaskFormModal({ open, onOpenChange, projectId, task, parentTask, availableMembers = [], defaultStatus = "To Do", crId, crNumber }: TaskFormModalProps) {
  const isEdit = !!task;
  const createMutation = useCreateTask(projectId);
  const updateMutation = useUpdateTask(projectId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<CreateTaskPayload>(makeEmpty());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        name: task.name,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        startDate: task.startDate ? task.startDate.split("T")[0] : null,
        endDate: task.endDate ? task.endDate.split("T")[0] : null,
        assignees: task.assignees.map((a) => a._id),
        relatedLinks: task.relatedLinks || [],
        parent: typeof task.parent === "string" ? task.parent : null,
      });
    } else {
      setForm({ ...makeEmpty(defaultStatus), parent: parentTask?._id || null, cr: crId || null });
    }
    setValidationError(null);
    setLinkLabel("");
    setLinkUrl("");
  }, [open, task, parentTask]);

  const toggleAssignee = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees?.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...(prev.assignees || []), userId],
    }));
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      relatedLinks: [...(prev.relatedLinks || []), { label: linkLabel.trim() || linkUrl.trim(), url: linkUrl.trim() }],
    }));
    setLinkLabel("");
    setLinkUrl("");
  };

  const removeLink = (idx: number) => {
    setForm((prev) => ({ ...prev, relatedLinks: (prev.relatedLinks || []).filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!form.name?.trim()) { setValidationError("Task name is required."); return; }
    const payload: CreateTaskPayload = { ...form, name: form.name.trim(), description: form.description || null, startDate: form.startDate || null, endDate: form.endDate || null };
    try {
      if (isEdit && task) {
        await updateMutation.mutateAsync({ taskId: task._id, data: payload });
        toast.success("Task updated!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Task created!");
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save task.";
      setValidationError(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
        <DialogHeader className="space-y-1 border-b border-[var(--border)] pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[var(--primary)]" />
            {isEdit ? "Edit Task" : parentTask ? `Sub-task of "${parentTask.name}"` : "New Task"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-secondary)]">
            {isEdit ? "Update task details below." : "Fill in the details to create a task."}
          </DialogDescription>
          {(crId || task?.cr) && (
            <div className="flex items-center gap-1.5 mt-1">
              <GitPullRequest className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {crNumber || (typeof task?.cr === "object" && task?.cr?.crNumber) || "Linked to CR"}
              </span>
            </div>
          )}
        </DialogHeader>

        {validationError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[var(--error)] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Task Name *</Label>
            <Input
              placeholder="e.g. Set up authentication module"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} type="button" onClick={() => setForm((p) => ({ ...p, status: s }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${form.status === s ? STATUS_STYLES[s] + " ring-1 ring-current" : "bg-[var(--background)] border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Priority</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button key={p} type="button" onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${form.priority === p ? PRIORITY_STYLES[p] + " ring-1 ring-current" : "bg-[var(--background)] border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Start Date</Label>
              <Input type="date" value={form.startDate || ""} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value || null }))}
                className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">End Date</Label>
              <Input type="date" value={form.endDate || ""} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value || null }))}
                className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm" />
            </div>
          </div>

          {/* Assignees */}
          {availableMembers.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Assign Developers</Label>
              <div className="flex flex-wrap gap-2">
                {availableMembers.map((u) => {
                  const selected = form.assignees?.includes(u._id);
                  return (
                    <button key={u._id} type="button" onClick={() => toggleAssignee(u._id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selected ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"}`}>
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${selected ? "bg-white/20 text-white" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      {u.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Description</Label>
            <Textarea placeholder="Describe the task in detail..." value={form.description || ""}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm min-h-[80px]" />
          </div>

          {/* Related Links */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Related Links</Label>
            <div className="flex gap-2">
              <Input placeholder="Label" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)}
                className="h-9 bg-[var(--background)] border-[var(--border)] text-sm flex-1" />
              <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                className="h-9 bg-[var(--background)] border-[var(--border)] text-sm flex-[2]" />
              <Button type="button" variant="outline" size="sm" onClick={addLink} className="h-9 px-3 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(form.relatedLinks || []).length > 0 && (
              <div className="space-y-1.5 mt-1">
                {(form.relatedLinks || []).map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <LinkIcon className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--primary)] hover:underline flex-1 truncate">{link.label || link.url}</a>
                    <button type="button" onClick={() => removeLink(idx)} className="text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 gap-2 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}
              className="h-10 text-sm font-semibold border-[var(--border)] hover:bg-[var(--surface-hover)]">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}
              className="h-10 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow hover:opacity-90">
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />{isEdit ? "Saving..." : "Creating..."}</> : isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
