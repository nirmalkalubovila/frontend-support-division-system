"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Pencil, Trash2, Paperclip, MessageSquare, Clock,
  FileText, Image as ImageIcon, ExternalLink, Link as LinkIcon, CheckSquare,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useUpdateCR, useUploadCRAttachments, useDeleteCRAttachment,
  type ChangeRequest, type CRStatus, type CRPriority,
} from "@/api/services/project-management/cr-service";
import type { User } from "@/api/services/user-management/user-service";
import useSessionStore from "@/store/session-store";
import { CRTasksPanel } from "@/components/organisms/crTasksPanel/cr-tasks-panel";

// ── Config ──────────────────────────────────────────────────────
const CR_STATUSES: CRStatus[] = ["To Do", "In Progress", "Review", "Done"];
const CR_PRIORITIES: CRPriority[] = ["Critical", "High", "Medium", "Low"];

const STATUS_BADGE: Record<string, string> = {
  "To Do": "bg-blue-100 text-blue-700 border-blue-300",
  "In Progress": "bg-indigo-100 text-indigo-700 border-indigo-300",
  "Review": "bg-purple-100 text-purple-700 border-purple-300",
  "Done": "bg-green-100 text-green-700 border-green-300",
};

const PRIORITY_CONFIG: Record<string, { dot: string; badge: string }> = {
  Critical: { dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-300" },
  High:     { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700 border-orange-300" },
  Medium:   { dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  Low:      { dot: "bg-green-500", badge: "bg-green-100 text-green-700 border-green-300" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Role permission helper ──────────────────────────────────────
function useCanEditCR(cr: ChangeRequest) {
  const userInfo = useSessionStore((s) => s.userInfo);
  if (!userInfo) return false;
  if (["super_admin", "manager", "senior_engineer"].includes(userInfo.role)) return true;
  if (userInfo.role === "intern") return false;
  return cr.assignedDevelopers?.some((d) => (typeof d === "object" ? d._id : d) === userInfo._id) ?? false;
}

// ── Props ────────────────────────────────────────────────────────
interface Props {
  cr: ChangeRequest;
  projectId: string;
  members: User[];
  onClose: () => void;
  onEdit: (cr: ChangeRequest) => void;
  onDelete: (cr: ChangeRequest) => void;
}

type DrawerTab = "overview" | "tasks" | "attachments" | "comments";

export function CRDetailDrawer({ cr, projectId, members, onClose, onEdit, onDelete }: Props) {
  const canEdit = useCanEditCR(cr);
  const updateMutation = useUpdateCR(projectId);
  const uploadMutation = useUploadCRAttachments(projectId);
  const deleteAttachMutation = useDeleteCRAttachment(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userInfo = useSessionStore((s) => s.userInfo);

  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<{ id: string; text: string; author: string; time: string }[]>([]);

  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  const handleApprovalSubmit = async () => {
    if (!confirmCheckbox) {
      toast.error("You must confirm the checkbox before submitting.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        crId: cr._id,
        data: { submittedForReview: true }
      });
      setShowApprovalDialog(false);
      setConfirmCheckbox(false);
      toast.success("Submitted for Senior SE review.");
      onClose();
    } catch {
      toast.error("Failed to submit for review");
    }
  };

  const handleStatusChange = async (status: CRStatus) => {
    if (!canEdit) return;
    try {
      await updateMutation.mutateAsync({ crId: cr._id, data: { status } });
      toast.success(`Status → ${status}`);
    } catch { toast.error("Failed to update status"); }
  };

  const handlePriorityChange = async (priority: CRPriority) => {
    if (!canEdit) return;
    try {
      await updateMutation.mutateAsync({ crId: cr._id, data: { priority } });
      toast.success("Priority updated");
    } catch { toast.error("Failed to update priority"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    try {
      await uploadMutation.mutateAsync({ crId: cr._id, files: Array.from(e.target.files) });
      toast.success("File uploaded");
    } catch { toast.error("Failed to upload file"); }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachMutation.mutateAsync({ crId: cr._id, attachmentId });
      toast.success("Attachment removed");
    } catch { toast.error("Failed to remove attachment"); }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !userInfo) return;
    setComments((p) => [...p, {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: userInfo.name,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setNewComment("");
  };

  const tabs: { key: DrawerTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: `Tasks${cr.taskProgress?.total ? ` (${cr.taskProgress.total})` : ""}` },
    { key: "attachments", label: `Attachments${cr.attachments?.length ? ` (${cr.attachments.length})` : ""}` },
    { key: "comments", label: `Comments${comments.length ? ` (${comments.length})` : ""}` },
  ];

  const pmName = typeof cr.assignedProjectManager === "object" ? cr.assignedProjectManager?.name : null;
  const devNames = cr.assignedDevelopers?.map((d) => (typeof d === "object" ? d.name : d)) ?? [];

  return (
    <Dialog open={!!cr} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6 overflow-y-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="space-y-2.5 border-b border-[var(--border)] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] font-mono">{cr.crNumber}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[cr.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{cr.status}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${PRIORITY_CONFIG[cr.priority]?.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[cr.priority]?.dot}`} />{cr.priority} Priority
              </span>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && (
                <>
                  <button onClick={() => onEdit(cr)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(cr)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </>
              )}
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-[var(--text-primary)] leading-snug">
            {cr.title}
          </DialogTitle>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">{cr.crType}</p>
        </DialogHeader>

        {/* Tab nav */}
        <div className="flex border-b border-[var(--border)] px-1 shrink-0 overflow-x-auto mb-4">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`py-2 px-3 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-all ${
                activeTab === t.key ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <>
              {/* Status transitions */}
              {canEdit && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Move to Status</Label>
                  {cr.submittedForReview ? (
                    <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs font-semibold text-center">
                      Submitted for Senior SE review. Status locked.
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1.5 flex-wrap">
                        {CR_STATUSES.map((s) => {
                          const isDevOrIntern = userInfo?.role === "engineer" || userInfo?.role === "intern";
                          if (isDevOrIntern) {
                            if (s === "Done") return null;
                            if (s === "To Do" && cr.status !== "To Do") return null;
                          }
                          return (
                            <button key={s} onClick={() => handleStatusChange(s)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                cr.status === s
                                  ? (STATUS_BADGE[s] ?? "") + " ring-1 ring-current"
                                  : "bg-transparent border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]"
                              }`}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      {cr.status === "Review" && (
                        <Button
                          onClick={() => {
                            setConfirmCheckbox(false);
                            setShowApprovalDialog(true);
                          }}
                          className="w-full text-xs h-8 bg-[var(--accent)] hover:opacity-90 text-white font-bold transition-all shadow-sm mt-2"
                        >
                          Send for Senior SE Approval
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Priority */}
              {canEdit && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Priority</Label>
                  <div className="flex gap-1.5">
                    {CR_PRIORITIES.map((p) => (
                      <button key={p} onClick={() => handlePriorityChange(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all ${
                          cr.priority === p
                            ? PRIORITY_CONFIG[p].badge + " ring-1 ring-current"
                            : "bg-transparent border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]"
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />{p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="bg-[var(--border)]" />

              {/* Task progress quick view */}
              {(cr.taskProgress?.total ?? 0) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" /> Task Progress
                    </Label>
                    <button onClick={() => setActiveTab("tasks")}
                      className="text-[10px] text-[var(--primary)] font-semibold hover:underline">
                      View Tasks →
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden border border-[var(--border)]/30">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${cr.taskProgress?.completionPercentage ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[var(--primary)] shrink-0">
                      {cr.taskProgress?.done}/{cr.taskProgress?.total} done
                    </span>
                  </div>
                </div>
              )}

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Description", value: cr.description },
                  { label: "Business Justification", value: cr.businessJustification },
                  { label: "Technical Approach", value: cr.technicalApproach },
                  { label: "Impact Analysis", value: cr.impactAnalysis },
                  { label: "Dependencies", value: cr.dependencies },
                  { label: "Risks", value: cr.risks },
                ].filter((f) => f.value).map(({ label, value }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</Label>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap bg-[var(--background)] rounded-xl p-4 border border-[var(--border)]">{value}</p>
                  </div>
                ))}

                {/* Related Links */}
                {cr.relatedLinks?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Related Links</Label>
                    {cr.relatedLinks.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] group transition-all">
                        <LinkIcon className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                        <span className="text-xs text-[var(--primary)] truncate flex-1">{l.label || l.url}</span>
                        <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
                {/* Status transitions */}
                {canEdit && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Move to Status</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CR_STATUSES.map((s) => (
                        <button key={s} onClick={() => handleStatusChange(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            cr.status === s
                              ? (STATUS_BADGE[s] ?? "") + " ring-1 ring-current"
                              : "bg-transparent border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority */}
                {canEdit && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Priority</Label>
                    <div className="flex gap-1.5">
                      {CR_PRIORITIES.map((p) => (
                        <button key={p} onClick={() => handlePriorityChange(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all ${
                            cr.priority === p
                              ? PRIORITY_CONFIG[p].badge + " ring-1 ring-current"
                              : "bg-transparent border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]"
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />{p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task progress quick view */}
                {(cr.taskProgress?.total ?? 0) > 0 && (
                  <div className="space-y-2 bg-[var(--background)] rounded-xl p-3.5 border border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" /> Task Progress
                      </Label>
                      <button onClick={() => setActiveTab("tasks")}
                        className="text-[10px] text-[var(--primary)] font-semibold hover:underline">
                        View Tasks →
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden border border-[var(--border)]/30">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 transition-all duration-500 rounded-full"
                          style={{ width: `${cr.taskProgress?.completionPercentage ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--primary)] shrink-0">
                        {cr.taskProgress?.done}/{cr.taskProgress?.total} done
                      </span>
                    </div>
                  </div>
                )}

                {/* Key info grid */}
                <div className="grid grid-cols-2 gap-3 bg-[var(--background)] rounded-xl p-3.5 border border-[var(--border)]">
                  {[
                    { label: "Requested By", value: cr.requestedBy || "—" },
                    { label: "Requested Date", value: fmtDate(cr.requestedDate) },
                    { label: "Target Release", value: fmtDate(cr.targetReleaseDate) },
                    { label: "Est. Hours", value: cr.estimatedHours != null ? `${cr.estimatedHours}h` : "—" },
                    { label: "Actual Hours", value: cr.actualHours != null ? `${cr.actualHours}h` : "—" },
                    { label: "Est. Cost", value: cr.estimatedCost != null ? `$${cr.estimatedCost.toLocaleString()}` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Team */}
                {(pmName || devNames.length > 0) && (
                  <div className="space-y-2 bg-[var(--background)] rounded-xl p-3.5 border border-[var(--border)]">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Team</Label>
                    {pmName && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">{pmName.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{pmName}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">Project Manager</p>
                        </div>
                      </div>
                    )}
                    {devNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {devNames.map((n, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />{n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tasks ── */}
          {activeTab === "tasks" && (
            <CRTasksPanel cr={cr} projectId={projectId} members={members} />
          )}

          {/* ── Attachments ── */}
          {activeTab === "attachments" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Files & Documents</Label>
                {canEdit && (
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline">
                    <Paperclip className="h-3 w-3" /> Attach
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
              {cr.attachments?.length > 0 ? (
                <div className="space-y-2">
                  {cr.attachments.map((att) => {
                    const isImg = att.mimetype.startsWith("image/");
                    const url = `http://localhost:5001${att.path}`;
                    return (
                      <div key={att._id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] group">
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
              ) : (
                <div className="flex flex-col items-center py-8 border-2 border-dashed border-[var(--border)] rounded-xl text-center">
                  <Paperclip className="h-8 w-8 text-[var(--text-tertiary)] mb-2" />
                  <p className="text-xs text-[var(--text-tertiary)]">No attachments yet</p>
                  {canEdit && <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-[var(--primary)] font-semibold hover:underline">Upload files</button>}
                </div>
              )}
            </div>
          )}

          {/* ── Comments ── */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {c.author.charAt(0).toUpperCase()}
                      </div>
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
              {comments.length === 0 && (
                <div className="flex flex-col items-center py-8 border-2 border-dashed border-[var(--border)] rounded-xl text-center">
                  <MessageSquare className="h-8 w-8 text-[var(--text-tertiary)] mb-2" />
                  <p className="text-xs text-[var(--text-tertiary)]">No comments yet</p>
                </div>
              )}
              <div className="space-y-2">
                <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  className="bg-[var(--background)] border-[var(--border)] text-sm min-h-[64px] resize-none" />
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}
                  className="h-8 text-xs gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white w-full">
                  <MessageSquare className="h-3.5 w-3.5" /> Post Comment
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const approvalDialog = (
    <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] z-[99999]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Send for Senior SE Approval
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Before submitting this work item for verification by a Senior Engineer, please confirm that you have completed and thoroughly tested the implementation.
          </p>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
            <input
              type="checkbox"
              id="confirmCheckboxCR"
              checked={confirmCheckbox}
              onChange={(e) => setConfirmCheckbox(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <Label htmlFor="confirmCheckboxCR" className="text-xs text-[var(--text-primary)] font-medium leading-tight cursor-pointer select-none">
              I confirm task/cr/issue implemented and reviewed to check by senior SE
            </Label>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setShowApprovalDialog(false);
              setConfirmCheckbox(false);
            }}
            className="text-xs h-9 rounded-lg border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprovalSubmit}
            disabled={!confirmCheckbox || updateMutation.isPending}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/95 text-white text-xs h-9 rounded-lg"
          >
            Confirm & Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return typeof document !== "undefined" ? (
    <>
      {createPortal(drawer, document.body)}
      {approvalDialog}
    </>
  ) : null;
}
