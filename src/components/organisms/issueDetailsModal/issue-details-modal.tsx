"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Play,
  Pause,
  Square,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Upload,
  Calendar,
  Folder,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, Badge, Textarea, Input, Label, Card, CardHeader, CardTitle, CardContent } from "@/components";
import {
  useUpdateIssue,
  useUploadAttachments,
  useDeleteAttachment,
  type Issue,
} from "@/api/services/issue-management/issue-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import { KANBAN_COLUMNS, PRIORITIES, ISSUE_TYPES, ROLE_LABELS } from "@/lib/constants";
import useSessionStore from "@/store/session-store";

interface IssueDetailsModalProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueDetailsModal({ issue, open, onOpenChange }: IssueDetailsModalProps) {
  const userInfo = useSessionStore((s) => s.userInfo);
  const isManager = userInfo?.role === "super_admin" || userInfo?.role === "manager";
  
  const updateIssueMutation = useUpdateIssue();
  const uploadAttachmentsMutation = useUploadAttachments();
  const deleteAttachmentMutation = useDeleteAttachment();
  const { data: users = [] } = useGetAllUsers();

  // ──────────────────────────────────────────────────────────────
  // Form & Fields State
  // ──────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [technicalApproach, setTechnicalApproach] = useState<string>("");
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ──────────────────────────────────────────────────────────────
  // Stopwatch State & Logic (Per-Issue isolated stopwatch)
  // ──────────────────────────────────────────────────────────────
  const [time, setTime] = useState<number>(0);
  const [isTicking, setIsTicking] = useState<boolean>(false);

  useEffect(() => {
    if (open && issue) {
      // Sync form states
      setStatus(issue.status);
      setPriority(issue.priority);
      setAssignedTo(
        typeof issue.assignedTo === "object" && issue.assignedTo
          ? issue.assignedTo._id
          : (issue.assignedTo as string) || ""
      );
      setEstimatedHours(issue.estimatedHours ? String(issue.estimatedHours) : "");
      setTechnicalApproach(issue.technicalApproach || "");

      // Load time & ticking state specifically for this issue
      const savedTime = localStorage.getItem(`issue_timer_${issue._id}`);
      setTime(savedTime ? parseInt(savedTime, 10) : 0);
      
      const savedTicking = localStorage.getItem(`issue_timer_ticking_${issue._id}`);
      const savedTimestamp = localStorage.getItem(`issue_timer_timestamp_${issue._id}`);
      
      if (savedTicking === "true" && savedTimestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
        setTime((savedTime ? parseInt(savedTime, 10) : 0) + elapsed);
        setIsTicking(true);
      } else {
        setIsTicking(false);
      }
    }
  }, [open, issue]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTicking && issue?._id) {
      interval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(`issue_timer_${issue._id}`, String(newTime));
          localStorage.setItem(`issue_timer_timestamp_${issue._id}`, String(Date.now()));
          
          // Also dispatch event to notify the dashboard stopwatch if it's viewing the same issue
          window.dispatchEvent(new Event("storage"));
          
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTicking, issue?._id]);

  const handleStartTimer = () => {
    if (!issue?._id) return;
    setIsTicking(true);
    localStorage.setItem(`issue_timer_ticking_${issue._id}`, "true");
    localStorage.setItem(`issue_timer_timestamp_${issue._id}`, String(Date.now()));
    window.dispatchEvent(new Event("storage"));
  };

  const handlePauseTimer = () => {
    if (!issue?._id) return;
    setIsTicking(false);
    localStorage.setItem(`issue_timer_ticking_${issue._id}`, "false");
    localStorage.removeItem(`issue_timer_timestamp_${issue._id}`);
    window.dispatchEvent(new Event("storage"));
  };

  const handleStopTimer = () => {
    if (!issue?._id) return;
    setIsTicking(false);
    setTime(0);
    localStorage.removeItem(`issue_timer_${issue._id}`);
    localStorage.removeItem(`issue_timer_ticking_${issue._id}`);
    localStorage.removeItem(`issue_timer_timestamp_${issue._id}`);
    window.dispatchEvent(new Event("storage"));
  };

  const formatStopwatchTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  };

  // ──────────────────────────────────────────────────────────────
  // Handle Save
  // ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!issue) return;
    try {
      await updateIssueMutation.mutateAsync({
        id: issue._id,
        data: {
          status,
          priority: priority as any,
          assignedTo: assignedTo || null,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          technicalApproach: technicalApproach || null,
        },
      });
      toast.success("Issue updated successfully!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update issue.");
    }
  };

  // ──────────────────────────────────────────────────────────────
  // File Upload Handlers
  // ──────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!issue || !e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const filesArray = Array.from(e.target.files);
      await uploadAttachmentsMutation.mutateAsync({
        issueId: issue._id,
        files: filesArray,
      });
      toast.success("Attachment uploaded successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload attachments.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!issue) return;
    try {
      await deleteAttachmentMutation.mutateAsync({
        issueId: issue._id,
        attachmentId,
      });
      toast.success("Attachment deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete attachment.");
    }
  };

  // Format Date helpers
  const dueDateStr = useMemo(() => {
    if (!issue) return "";
    return new Date(issue.dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [issue]);

  const client = typeof issue?.client === "object" ? issue.client : null;
  const project = typeof issue?.project === "object" ? issue.project : null;
  const createdBy = typeof issue?.createdBy === "object" ? issue.createdBy : null;

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="space-y-2.5 border-b border-[var(--border)] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold text-[var(--primary-text)] tracking-wider">
              {issue.issueId}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold tracking-wide uppercase">
                {issue.type}
              </Badge>
              <Badge
                variant={
                  issue.priority === "Critical"
                    ? "destructive"
                    : issue.priority === "High"
                    ? "default"
                    : "secondary"
                }
                className="text-[10px] font-bold tracking-wide uppercase"
              >
                {issue.priority} Priority
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">
            {issue.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--text-secondary)]">
            Created by {createdBy?.name || "System"} on{" "}
            {new Date(issue.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          {/* Main Details Panel (Left / Col-Span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Description
              </h4>
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                {issue.description}
              </div>
            </div>

            {/* Technical Approach */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Technical Approach / Notes
              </h4>
              <Textarea
                placeholder="Document technical approach, system logs, or debugging notes..."
                value={technicalApproach}
                onChange={(e) => setTechnicalApproach(e.target.value)}
                className="bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium min-h-[100px]"
              />
            </div>

            {/* Attachments Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Screenshots & Documents
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-8 text-xs font-semibold border-[var(--border)]"
                >
                  <Paperclip className="h-3.5 w-3.5 mr-1" />
                  Attach File
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
              </div>

              {/* Uploading indicator */}
              {isUploading && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
                  <span>Uploading files...</span>
                </div>
              )}

              {/* Attachments List */}
              {issue.attachments && issue.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {issue.attachments.map((file) => {
                    const isImg = file.mimetype.startsWith("image/");
                    const fileUrl = `http://localhost:5001${file.path}`;

                    return (
                      <div
                        key={file._id}
                        className="group flex items-center justify-between p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                      >
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-[var(--primary)] transition-colors"
                        >
                          {isImg ? (
                            <ImageIcon className="h-4 w-4 text-orange-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
                              {file.originalName}
                            </p>
                            <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(file._id)}
                          className="text-[var(--text-tertiary)] hover:text-[var(--error)] p-1 rounded transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 border border-dashed border-[var(--border)] rounded-xl text-center bg-[var(--background)]">
                  <Upload className="h-7 w-7 text-[var(--text-tertiary)] mb-1.5" />
                  <span className="text-xs text-[var(--text-tertiary)] font-medium">
                    No attachments uploaded yet.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Settings Panel (Right / Col-Span-1) */}
          <div className="space-y-6">
            {/* Status Manager */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Issue Status
              </Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Stopwatch Timer Widget */}
            <Card className="bg-[var(--background)] border-[var(--border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[var(--primary)]" />
                  Stopwatch Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-1">
                  <p className="text-3xl font-mono font-bold text-[var(--text-primary)] tracking-wider">
                    {formatStopwatchTime(time)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isTicking ? (
                    <button
                      onClick={handleStartTimer}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseTimer}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      <Pause className="h-3.5 w-3.5 fill-current" />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={handleStopTimer}
                    disabled={time === 0}
                    className="flex items-center justify-center h-9 w-10 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Details Summary Info */}
            <div className="space-y-3 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs font-medium space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" /> Client / Project
                </span>
                <span className="text-[var(--text-primary)] font-semibold truncate max-w-[150px]">
                  {client?.code || "—"} / {project?.name || "—"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Due Date SLA
                </span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Estimated Hours */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                <Label htmlFor="estimatedHours" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Est. Hours
                </Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  placeholder="e.g. 4.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="h-8 bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-xs font-semibold"
                />
              </div>

              {/* Assignment (Admins/Managers only) */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="assignedTo" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Assigned Engineer
                </Label>
                <select
                  id="assignedTo"
                  value={assignedTo}
                  disabled={!isManager}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-70"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({ROLE_LABELS[u.role] || u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-4 gap-2 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateIssueMutation.isPending}
            className="h-10 text-sm font-semibold border-[var(--border)] hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateIssueMutation.isPending}
            className="h-10 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow hover:opacity-90 transition-opacity"
          >
            {updateIssueMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
