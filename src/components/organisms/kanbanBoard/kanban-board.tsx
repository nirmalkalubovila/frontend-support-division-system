"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Plus, Search, X, Pencil, Trash2, Eye, Clock,
  ChevronDown, Link as LinkIcon, Paperclip, MessageSquare,
  CheckSquare, AlertCircle, CheckCircle2,
  FileText, Image as ImageIcon, ExternalLink, RefreshCw, Wifi, WifiOff, ShieldAlert, GitPullRequest,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/molecules/confirmDialog";
import { TaskFormModal } from "@/components/organisms/taskFormModal/task-form-modal";
import { WorkflowRejectionDialog } from "./workflow-rejection-dialog";
import {
  useGetProjectTasks, useUpdateTask, useDeleteTask, useUploadTaskAttachments, useDeleteTaskAttachment,
  type Task, type TaskStatus, type TaskPriority, type TaskAssignee,
} from "@/api/services/project-management/task-service";
import type { User } from "@/api/services/user-management/user-service";
import useSessionStore from "@/store/session-store";
import { useKanbanSocket } from "@/hooks/use-kanban-socket";
import { validateTaskTransition, WORKFLOW_TRANSITIONS } from "@/lib/task-workflow";

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

export const KANBAN_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Review", "Done"];
const PRIORITIES: TaskPriority[] = ["Critical", "High", "Medium", "Low"];

const COL_CONFIG: Record<TaskStatus, { dot: string; header: string; addBtn: string; card: string; badge: string; glow: string }> = {
  "To Do":       { dot: "bg-slate-400",   header: "bg-slate-50 dark:bg-slate-900/30",    addBtn: "hover:bg-slate-100",   card: "border-slate-200 hover:border-slate-300",   badge: "bg-slate-100 text-slate-600 border-slate-200",    glow: "shadow-slate-200" },
  "In Progress": { dot: "bg-yellow-400",  header: "bg-yellow-50 dark:bg-yellow-900/20",  addBtn: "hover:bg-yellow-100",  card: "border-yellow-200 hover:border-yellow-400",  badge: "bg-yellow-50 text-yellow-700 border-yellow-200",  glow: "shadow-yellow-200" },
  "Review":      { dot: "bg-indigo-400",  header: "bg-indigo-50 dark:bg-indigo-900/20",  addBtn: "hover:bg-indigo-100",  card: "border-indigo-200 hover:border-indigo-400",  badge: "bg-indigo-50 text-indigo-700 border-indigo-200",  glow: "shadow-indigo-200" },
  "Done":        { dot: "bg-emerald-400", header: "bg-emerald-50 dark:bg-emerald-900/20", addBtn: "hover:bg-emerald-100", card: "border-emerald-200 hover:border-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", glow: "shadow-emerald-200" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { dot: string; badge: string }> = {
  Critical: { dot: "bg-red-500",    badge: "bg-red-50 text-red-600 border-red-200" },
  High:     { dot: "bg-orange-500", badge: "bg-orange-50 text-orange-600 border-orange-200" },
  Medium:   { dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  Low:      { dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200" },
};

function fmtDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(endDate?: string | null, status?: TaskStatus) {
  if (!endDate || status === "Done") return false;
  return new Date(endDate) < new Date();
}

// ──────────────────────────────────────────────────────────────
// Connection indicator
// ──────────────────────────────────────────────────────────────
function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${connected ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-slate-400 bg-slate-50 border-slate-200"}`}>
      {connected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
      {connected ? "Live" : "Polling"}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// Role permission helper
// ──────────────────────────────────────────────────────────────
function useCanEditTask(task: Task) {
  const userInfo = useSessionStore((s) => s.userInfo);
  if (!userInfo) return false;
  // Admins and managers can always edit
  if (["super_admin", "manager"].includes(userInfo.role)) return true;
  // Interns can never edit
  if (userInfo.role === "intern") return false;
  // senior_engineer and engineer can edit any task (not just their assigned ones)
  // so that assignees and team members can move tasks freely
  return true;
}

// ──────────────────────────────────────────────────────────────
// Assignee Avatars
// ──────────────────────────────────────────────────────────────
function AssigneeAvatars({ assignees, max = 3 }: { assignees: TaskAssignee[]; max?: number }) {
  if (!assignees.length) return null;
  const visible = assignees.slice(0, max);
  const rest = assignees.length - max;
  return (
    <div className="flex -space-x-1.5">
      {visible.map((a) => (
        <div key={a._id} title={a.name}
          className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] border-2 border-[var(--surface)] flex items-center justify-center text-white text-[8px] font-bold shrink-0">
          {a.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {rest > 0 && (
        <div className="h-6 w-6 rounded-full bg-[var(--background)] border-2 border-[var(--surface)] flex items-center justify-center text-[8px] font-semibold text-[var(--text-tertiary)]">
          +{rest}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Task Detail Drawer
// ──────────────────────────────────────────────────────────────
interface DrawerProps {
  task: Task | null;
  projectId: string;
  members: User[];
  onClose: () => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}

function TaskDetailDrawer({ task, projectId, members, onClose, onEdit, onDelete }: DrawerProps) {
  const canEdit = useCanEditTask(task ?? ({} as Task));
  const updateMutation = useUpdateTask(projectId);
  const uploadMutation = useUploadTaskAttachments(projectId);
  const deleteAttachMutation = useDeleteTaskAttachment(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userInfo = useSessionStore((s) => s.userInfo);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Array<{ id: string; text: string; author: string; time: string }>>([]);

  // Workflow rejection state
  const [rejection, setRejection] = useState<{ fromStatus: TaskStatus; toStatus: TaskStatus; reason: string } | null>(null);

  const handleStatusChange = async (toStatus: TaskStatus) => {
    if (!task || !canEdit) return;
    const result = validateTaskTransition(task, toStatus, userInfo);
    if (!result.valid) {
      setRejection({ fromStatus: task.status, toStatus, reason: result.reason! });
      return;
    }
    // Show soft hints as a toast but still allow the move
    if (result.hints.length > 0) {
      result.hints.forEach((h) => toast.warning(h, { duration: 4000 }));
    }
    try {
      await updateMutation.mutateAsync({ taskId: task._id, data: { status: toStatus } });
      toast.success(`Moved to ${toStatus}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to update status");
    }
  };

  const handlePriorityChange = async (priority: TaskPriority) => {
    if (!task || !canEdit) return;
    try {
      await updateMutation.mutateAsync({ taskId: task._id, data: { priority } });
      toast.success("Priority updated");
    } catch { toast.error("Failed to update priority"); }
  };

  const handleToggleAssignee = async (userId: string) => {
    if (!task || !canEdit) return;
    const current = task.assignees.map((a) => a._id);
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    try {
      await updateMutation.mutateAsync({ taskId: task._id, data: { assignees: next } });
    } catch { toast.error("Failed to update assignees"); }
  };

  const handleDateChange = async (field: "startDate" | "endDate", value: string) => {
    if (!task || !canEdit) return;
    try {
      await updateMutation.mutateAsync({ taskId: task._id, data: { [field]: value || null } });
    } catch { toast.error("Failed to update date"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files?.length) return;
    try {
      await uploadMutation.mutateAsync({ taskId: task._id, files: Array.from(e.target.files) });
      toast.success("File uploaded");
    } catch { toast.error("Failed to upload file"); }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;
    try {
      await deleteAttachMutation.mutateAsync({ taskId: task._id, attachmentId });
      toast.success("Attachment removed");
    } catch { toast.error("Failed to remove attachment"); }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !userInfo) return;
    setComments((prev) => [...prev, {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: userInfo.name,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setNewComment("");
  };

  if (!task) return null;

  const overdue = isOverdue(task.endDate, task.status);

  const drawer = (
    <>
      <div className="fixed inset-0 top-14 z-[9999] flex justify-end pointer-events-none">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] cursor-pointer pointer-events-auto" onClick={onClose} aria-hidden="true" />
        <div
          className="relative w-full max-w-md h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5 border-b border-[var(--border)] shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${COL_CONFIG[task.status].badge}`}>{task.status}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${PRIORITY_CONFIG[task.priority].badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[task.priority].dot}`} />{task.priority}
                </span>
                {overdue && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Overdue</span>}
                {task.cr && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1">
                    <GitPullRequest className="h-3 w-3" />{task.cr.crNumber}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight">{task.name}</h2>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canEdit && (
                <>
                  <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Workflow: allowed transitions */}
            {canEdit && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Move to</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {KANBAN_STATUSES.map((s) => {
                    const isCurrent = task.status === s;
                    const { valid, hints } = validateTaskTransition(task, s, userInfo);
                    return (
                      <button key={s} onClick={() => handleStatusChange(s)} disabled={isCurrent}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isCurrent
                            ? COL_CONFIG[s].badge + " ring-1 ring-current cursor-default"
                            : valid
                              ? "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                              : "bg-[var(--background)] border-[var(--border)] text-[var(--text-tertiary)] opacity-40 cursor-not-allowed"
                        }`}>
                        {s}
                        {!valid && !isCurrent && <ShieldAlert className="inline h-2.5 w-2.5 ml-1 opacity-60" />}
                        {valid && !isCurrent && hints.length > 0 && <span className="inline ml-1 text-yellow-400 text-[10px]" title={hints.join(' ')}>⚠</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  Greyed steps are blocked by workflow rules. ⚠ = advisory hints.
                </p>
              </div>
            )}

            {/* Priority */}
            {canEdit && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Priority</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRIORITIES.map((p) => (
                    <button key={p} onClick={() => handlePriorityChange(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                        task.priority === p
                          ? PRIORITY_CONFIG[p].badge + " ring-1 ring-current"
                          : "bg-[var(--background)] border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]"
                      }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />{p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-[var(--border)]" />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              {(["startDate", "endDate"] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{field === "startDate" ? "Start Date" : "End Date"}</Label>
                  {canEdit ? (
                    <Input type="date"
                      defaultValue={task[field] ? (task[field] as string).split("T")[0] : ""}
                      onBlur={(e) => handleDateChange(field, e.target.value)}
                      className={`h-9 bg-[var(--background)] border-[var(--border)] text-xs ${field === "endDate" && overdue ? "border-red-300 text-red-600" : ""}`} />
                  ) : (
                    <p className={`text-sm font-medium ${field === "endDate" && overdue ? "text-red-500" : "text-[var(--text-primary)]"}`}>{fmtDate(task[field]) || "—"}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Description */}
            {task.description && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Description</Label>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap bg-[var(--background)] rounded-lg p-3 border border-[var(--border)]">{task.description}</p>
              </div>
            )}

            {/* Assignees */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Assignees</Label>
              {task.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((a) => (
                    <div key={a._id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[8px] font-bold shrink-0">{a.name.charAt(0).toUpperCase()}</div>
                      <span className="text-xs font-medium text-[var(--text-primary)]">{a.name}</span>
                      {canEdit && <button onClick={() => handleToggleAssignee(a._id)} className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-[var(--text-tertiary)]">No assignees</p>}
              {canEdit && members.filter((m) => !task.assignees.find((a) => a._id === m._id)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {members.filter((m) => !task.assignees.find((a) => a._id === m._id)).map((m) => (
                    <button key={m._id} onClick={() => handleToggleAssignee(m._id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                      <Plus className="h-3 w-3" />{m.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Related Links */}
            {task.relatedLinks?.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Related Links</Label>
                <div className="space-y-1.5">
                  {task.relatedLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] group transition-all">
                      <LinkIcon className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                      <span className="text-xs text-[var(--primary)] truncate flex-1">{link.label || link.url}</span>
                      <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Attachments {task.attachments?.length > 0 && `(${task.attachments.length})`}
                </Label>
                {canEdit && (
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline">
                    <Paperclip className="h-3 w-3" /> Attach
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
              {task.attachments?.length > 0 ? (
                <div className="space-y-1.5">
                  {task.attachments.map((att) => {
                    const isImg = att.mimetype.startsWith("image/");
                    const url = `http://localhost:5001${att.path}`;
                    return (
                      <div key={att._id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] group">
                        {isImg ? <ImageIcon className="h-4 w-4 text-orange-500 shrink-0" /> : <FileText className="h-4 w-4 text-blue-500 shrink-0" />}
                        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-[var(--text-primary)] hover:text-[var(--primary)] flex-1 truncate">{att.originalName}</a>
                        <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{(att.size / 1024).toFixed(0)}KB</span>
                        {canEdit && (
                          <button onClick={() => handleDeleteAttachment(att._id)} className="text-[var(--text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-xs text-[var(--text-tertiary)]">No attachments</p>}
            </div>

            {/* Comments */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Comments {comments.length > 0 && `(${comments.length})`}
              </Label>
              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">{c.author.charAt(0).toUpperCase()}</div>
                      <div className="flex-1 bg-[var(--background)] rounded-xl p-2.5 border border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">{c.author}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">{c.time}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                className="bg-[var(--background)] border-[var(--border)] text-sm min-h-[64px] resize-none" />
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white w-full">
                <MessageSquare className="h-3.5 w-3.5" /> Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow rejection dialog */}
      <WorkflowRejectionDialog
        open={!!rejection}
        fromStatus={rejection?.fromStatus ?? null}
        toStatus={rejection?.toStatus ?? null}
        reason={rejection?.reason ?? null}
        onClose={() => setRejection(null)}
      />
    </>
  );

  return typeof document !== "undefined" ? createPortal(drawer, document.body) : null;
}

// ──────────────────────────────────────────────────────────────
// Kanban Task Card
// ──────────────────────────────────────────────────────────────
interface KanbanCardProps {
  task: Task;
  isDragging: boolean;
  isValidDropTarget: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuickAdd: () => void;
}

function KanbanCard({ task, isDragging, isValidDropTarget, onDragStart, onDragEnd, onClick, onEdit, onDelete, onQuickAdd }: KanbanCardProps) {
  const canEdit = useCanEditTask(task);
  const overdue = isOverdue(task.endDate, task.status);
  const cfg = COL_CONFIG[task.status];

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => canEdit && onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative bg-[var(--surface)] rounded-xl border ${cfg.card} p-3.5 space-y-3 transition-all select-none
        ${isDragging ? "opacity-40 scale-95 rotate-1 shadow-2xl" : "hover:shadow-md"}
        ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
      `}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold text-[var(--text-primary)] leading-snug pr-1 group-hover:text-[var(--primary)] transition-colors">{task.name}</p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          {canEdit && <button onClick={onQuickAdd} title="Add sub-task" className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"><Plus className="h-3 w-3" /></button>}
          <button onClick={onClick} className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"><Eye className="h-3 w-3" /></button>
          {canEdit && (
            <>
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"><Pencil className="h-3 w-3" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-red-500 transition-colors"><Trash2 className="h-3 w-3" /></button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${PRIORITY_CONFIG[task.priority].badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[task.priority].dot}`} />{task.priority}
        </span>
        {task.endDate && (
          <span className={`text-[10px] flex items-center gap-0.5 font-medium ${overdue ? "text-red-500" : "text-[var(--text-tertiary)]"}`}>
            <Clock className="h-2.5 w-2.5" />{fmtDate(task.endDate)}{overdue && " ●"}
          </span>
        )}
        {task.attachments?.length > 0 && <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5"><Paperclip className="h-2.5 w-2.5" />{task.attachments.length}</span>}
        {task.relatedLinks?.length > 0 && <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5"><LinkIcon className="h-2.5 w-2.5" />{task.relatedLinks.length}</span>}
        {task.cr && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-0.5">
            <GitPullRequest className="h-2.5 w-2.5" />{task.cr.crNumber}
          </span>
        )}
      </div>

      {task.assignees.length > 0 && (
        <div className="flex items-center justify-between">
          <AssigneeAvatars assignees={task.assignees} />
          {task.startDate && <span className="text-[9px] text-[var(--text-tertiary)]">{fmtDate(task.startDate)} →</span>}
        </div>
      )}

      {canEdit && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">{[0,1,2].map((i) => <div key={i} className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />)}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Kanban Column
// ──────────────────────────────────────────────────────────────
interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  dragOverStatus: TaskStatus | null;
  draggingTask: Task | null;
  isValidDropTarget: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onAddSubTask: (parent: Task) => void;
}

function KanbanColumn({ status, tasks, dragOverStatus, draggingTask, isValidDropTarget, onDragStart, onDragEnd, onDragOver, onDrop, onTaskClick, onEdit, onDelete, onAddTask, onAddSubTask }: ColumnProps) {
  const cfg = COL_CONFIG[status];
  const isOver = dragOverStatus === status;
  const userInfo = useSessionStore((s) => s.userInfo);
  const canAddTask = userInfo && ["super_admin", "manager", "senior_engineer", "engineer"].includes(userInfo.role);

  return (
    <div
      onDragOver={(e) => onDragOver(e, status)}
      onDrop={(e) => onDrop(e, status)}
      className={`flex flex-col rounded-xl border transition-all duration-200 min-h-[520px] ${
        isOver && isValidDropTarget
          ? `border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10 bg-[rgba(99,102,241,0.03)]`
          : isOver && !isValidDropTarget
            ? "border-red-300 shadow-lg shadow-red-100 bg-red-50/30"
            : "border-[var(--border)] bg-[var(--background)]"
      }`}
    >
      {/* Column Header */}
      <div className={`px-3 pt-3 pb-2 rounded-t-xl ${cfg.header}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
            <span className="text-sm font-bold text-[var(--text-primary)]">{status}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{tasks.length}</span>
            {canAddTask && (
              <button onClick={() => onAddTask(status)} className={`h-6 w-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--primary)] ${cfg.addBtn} transition-colors`} title={`Add task to ${status}`}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {status === "Done" && tasks.length > 0 && <Progress value={100} className="h-0.5 mt-1" />}
      </div>

      {/* Drop feedback */}
      {isOver && (
        <div className={`mx-3 mt-2 h-1.5 rounded-full animate-pulse ${isValidDropTarget ? "bg-[var(--primary)]" : "bg-red-400"} opacity-60`} />
      )}

      {/* Cards */}
      <div className="flex-1 px-3 py-2 space-y-2.5 overflow-y-auto min-h-[120px]">
        {tasks.length === 0 && !isOver ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
            <CheckSquare className="h-6 w-6 text-[var(--text-tertiary)] mb-1.5" />
            <p className="text-xs text-[var(--text-tertiary)] font-medium">No tasks</p>
            {canAddTask && <button onClick={() => onAddTask(status)} className="mt-2 text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add first task</button>}
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task._id} task={task}
              isDragging={draggingTask?._id === task._id}
              isValidDropTarget={isValidDropTarget}
              onDragStart={onDragStart} onDragEnd={onDragEnd}
              onClick={() => onTaskClick(task)}
              onEdit={() => onEdit(task)} onDelete={() => onDelete(task)}
              onQuickAdd={() => onAddSubTask(task)}
            />
          ))
        )}
        {isOver && draggingTask && (
          <div className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 ${
            isValidDropTarget
              ? "border-[var(--primary)] bg-[rgba(99,102,241,0.05)]"
              : "border-red-300 bg-red-50/50"
          }`}>
            {isValidDropTarget
              ? <span className="text-xs font-semibold text-[var(--primary)]">Drop here</span>
              : <><ShieldAlert className="h-3.5 w-3.5 text-red-400" /><span className="text-xs font-semibold text-red-500">Blocked by workflow</span></>
            }
          </div>
        )}
      </div>

      {canAddTask && tasks.length > 0 && (
        <button onClick={() => onAddTask(status)} className={`mx-3 mb-3 mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] ${cfg.addBtn} transition-all`}>
          <Plus className="h-3.5 w-3.5" /> Add task
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Filter Bar
// ──────────────────────────────────────────────────────────────
interface FilterBarProps {
  search: string; setSearch: (v: string) => void;
  filterPriority: string; setFilterPriority: (v: string) => void;
  filterAssignee: string; setFilterAssignee: (v: string) => void;
  members: User[];
  onClear: () => void;
  hasFilters: boolean;
  isRefetching: boolean;
  onRefetch: () => void;
  connected: boolean;
}

function FilterBar({ search, setSearch, filterPriority, setFilterPriority, filterAssignee, setFilterAssignee, members, onClear, hasFilters, isRefetching, onRefetch, connected }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..."
          className="pl-8 h-9 bg-[var(--surface)] border-[var(--border)] text-sm" />
        {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X className="h-3 w-3" /></button>}
      </div>
      <div className="relative">
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          className="h-9 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 pr-7 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] cursor-pointer">
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)] pointer-events-none" />
      </div>
      {members.length > 0 && (
        <div className="relative">
          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 pr-7 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] cursor-pointer">
            <option value="">All Assignees</option>
            {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)] pointer-events-none" />
        </div>
      )}
      {hasFilters && <Button variant="ghost" size="sm" onClick={onClear} className="h-9 gap-1.5 text-xs text-[var(--text-secondary)]"><X className="h-3.5 w-3.5" /> Clear</Button>}
      <button onClick={onRefetch} className={`h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all ${isRefetching ? "animate-spin" : ""}`} title="Refresh board">
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
      {/* <ConnectionBadge connected={connected} /> */}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main KanbanBoard Export
// ──────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  projectId: string;
  members: User[];
}

export function KanbanBoard({ projectId, members }: KanbanBoardProps) {
  const { data: tasks = [], isLoading, isRefetching, refetch } = useGetProjectTasks(projectId, true);
  const updateMutation = useUpdateTask(projectId);
  const deleteMutation = useDeleteTask(projectId);
  const userInfo = useSessionStore((s) => s.userInfo);

  // ── Real-time socket ──
  const { socketRef, connected } = useKanbanSocket(projectId);

  // ── Drag state ──
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [isDragTargetValid, setIsDragTargetValid] = useState(true);

  // ── Modal / drawer state ──
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("To Do");
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // ── Workflow rejection state ──
  const [rejection, setRejection] = useState<{ fromStatus: TaskStatus; toStatus: TaskStatus; reason: string } | null>(null);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  const currentDrawerTask = useMemo(
    () => drawerTask ? tasks.find((t) => t._id === drawerTask._id) ?? drawerTask : null,
    [drawerTask, tasks]
  );

  const filteredTasks = useMemo(() => {
    let r = tasks;
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter((t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)); }
    if (filterPriority) r = r.filter((t) => t.priority === filterPriority);
    if (filterAssignee) r = r.filter((t) => t.assignees.some((a) => a._id === filterAssignee));
    return r;
  }, [tasks, search, filterPriority, filterAssignee]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { "To Do": [], "In Progress": [], "Review": [], "Done": [] };
    filteredTasks.forEach((t) => { if (map[t.status]) map[t.status].push(t); });
    return map;
  }, [filteredTasks]);

  const hasFilters = !!(search || filterPriority || filterAssignee);

  // ── Drag handlers ──
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task._id);
    setDraggingTask(task);
  }, []);

  const handleDragEnd = useCallback(() => { setDraggingTask(null); setDragOverStatus(null); setIsDragTargetValid(true); }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(status);
    if (draggingTask) {
      // If userInfo not yet loaded, allow the move optimistically — server will re-validate
      const { valid } = validateTaskTransition(draggingTask, status, userInfo);
      setIsDragTargetValid(valid);
      e.dataTransfer.dropEffect = valid ? "move" : "none";
    }
  }, [draggingTask, userInfo]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    setIsDragTargetValid(false);
    if (!draggingTask || draggingTask.status === targetStatus) { setDraggingTask(null); return; }

    // Client-side validation before any network call
    const result = validateTaskTransition(draggingTask, targetStatus, userInfo);
    if (!result.valid) {
      setRejection({ fromStatus: draggingTask.status, toStatus: targetStatus, reason: result.reason! });
      setDraggingTask(null);
      return;
    }
    // Non-blocking hints
    if (result.hints.length > 0) {
      result.hints.forEach((h) => toast.warning(h, { duration: 4000 }));
    }
    try {
      await updateMutation.mutateAsync({ taskId: draggingTask._id, data: { status: targetStatus } });
      toast.success(`Moved to ${targetStatus}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRejection({ fromStatus: draggingTask.status, toStatus: targetStatus, reason: msg || "Server rejected the transition." });
    }
    setDraggingTask(null);
  }, [draggingTask, updateMutation, userInfo]);

  const handleAddTask = (status: TaskStatus) => { setDefaultStatus(status); setEditingTask(null); setParentTask(null); setShowForm(true); };
  const handleEdit = (task: Task) => { setEditingTask(task); setParentTask(null); setDrawerTask(null); setShowForm(true); };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await deleteMutation.mutateAsync(taskToDelete._id);
      toast.success("Task deleted");
      setTaskToDelete(null);
      if (drawerTask?._id === taskToDelete._id) setDrawerTask(null);
    } catch { toast.error("Failed to delete task"); }
  };

  const stats = useMemo(() => ({
    total: filteredTasks.length,
    done: filteredTasks.filter((t) => t.status === "Done").length,
    overdue: filteredTasks.filter((t) => isOverdue(t.endDate, t.status)).length,
  }), [filteredTasks]);

  if (isLoading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${KANBAN_STATUSES.length}, minmax(0, 1fr))` }}>
        {KANBAN_STATUSES.map((s) => <div key={s} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] h-64 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <FilterBar
          search={search} setSearch={setSearch}
          filterPriority={filterPriority} setFilterPriority={setFilterPriority}
          filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee}
          members={members} hasFilters={hasFilters}
          onClear={() => { setSearch(""); setFilterPriority(""); setFilterAssignee(""); }}
          isRefetching={isRefetching} onRefetch={() => refetch()}
          connected={connected}
        />
        <Button size="sm" onClick={() => handleAddTask("To Do")}
          className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white h-9 shrink-0">
          <Plus className="h-3.5 w-3.5" /> New Task
        </Button>
      </div>

      {/* Board stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">{stats.total} task{stats.total !== 1 ? "s" : ""}</span>
        {hasFilters && <span className="text-[var(--primary)] font-medium">(filtered)</span>}
        <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{stats.done} done</span>
        {stats.overdue > 0 && <span className="flex items-center gap-1 text-red-500 font-semibold"><AlertCircle className="h-3.5 w-3.5" />{stats.overdue} overdue</span>}
        {isRefetching && <span className="text-[var(--text-tertiary)]">Syncing…</span>}
      </div>

      {/* Board */}
      <div className="grid gap-4 pb-6" style={{ gridTemplateColumns: `repeat(${KANBAN_STATUSES.length}, minmax(0, 1fr))` }}>
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tasks={tasksByStatus[status]}
            dragOverStatus={dragOverStatus} draggingTask={draggingTask}
            isValidDropTarget={dragOverStatus === status ? isDragTargetValid : true}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}
            onDragOver={handleDragOver} onDrop={handleDrop}
            onTaskClick={(t) => setDrawerTask(t)}
            onEdit={handleEdit} onDelete={(t) => setTaskToDelete(t)}
            onAddTask={handleAddTask}
            onAddSubTask={(parent) => { setEditingTask(null); setParentTask(parent); setDefaultStatus(parent.status); setShowForm(true); }}
          />
        ))}
      </div>

      {/* Task Form Modal */}
      <TaskFormModal open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingTask(null); setParentTask(null); } }}
        projectId={projectId} task={editingTask} parentTask={parentTask}
        availableMembers={members} defaultStatus={defaultStatus}
      />

      {/* Task Detail Drawer */}
      {currentDrawerTask && (
        <TaskDetailDrawer task={currentDrawerTask} projectId={projectId} members={members}
          onClose={() => setDrawerTask(null)}
          onEdit={(t) => { setDrawerTask(null); handleEdit(t); }}
          onDelete={(t) => { setDrawerTask(null); setTaskToDelete(t); }}
        />
      )}

      {/* Workflow Rejection Dialog */}
      <WorkflowRejectionDialog
        open={!!rejection}
        fromStatus={rejection?.fromStatus ?? null}
        toStatus={rejection?.toStatus ?? null}
        reason={rejection?.reason ?? null}
        onClose={() => setRejection(null)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog open={!!taskToDelete}
        onOpenChange={(v) => { if (!v) setTaskToDelete(null); }}
        title="Delete Task"
        description={`Delete "${taskToDelete?.name}"? Sub-tasks will also be removed.`}
        confirmLabel="Delete Task" variant="destructive"
        onConfirm={handleDeleteConfirm} loading={deleteMutation.isPending}
      />
    </div>
  );
}
