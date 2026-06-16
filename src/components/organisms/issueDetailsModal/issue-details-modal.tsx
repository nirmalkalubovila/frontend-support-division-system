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
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, Badge, Textarea, Input, Label, Card, CardHeader, CardTitle, CardContent, Separator } from "@/components";
import {
  useUpdateIssue,
  useUploadAttachments,
  useDeleteAttachment,
  useDeleteIssue,
  type Issue,
} from "@/api/services/issue-management/issue-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import { KANBAN_COLUMNS, ISSUE_STATUSES, PRIORITIES, ISSUE_TYPES, ROLE_LABELS } from "@/lib/constants";
import useSessionStore from "@/store/session-store";

const STATUS_SELECT_COLORS: Record<string, string> = {
  "Backlog":          "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-slate-700 dark:text-slate-300 focus:border-slate-400 focus:ring-slate-400/20",
  "Assigned":         "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 focus:border-blue-400 focus:ring-blue-400/20",
  "Planned Solution": "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 focus:border-amber-400 focus:ring-amber-400/20",
  "In Progress":      "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-300 focus:border-indigo-400 focus:ring-indigo-400/20",
  "Testing":          "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 focus:border-purple-400 focus:ring-purple-400/20",
  "Resolved":         "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-300 focus:border-green-400 focus:ring-green-400/20",
  "Closed":           "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-300 focus:border-rose-400 focus:ring-rose-400/20",
};

interface IssueDetailsModalProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueDetailsModal({ issue, open, onOpenChange }: IssueDetailsModalProps) {
  const userInfo = useSessionStore((s) => s.userInfo);
  const isManager = userInfo?.role === "super_admin" || userInfo?.role === "manager";

  const currentAssigneeId = issue && typeof issue.assignedTo === "object" && issue.assignedTo
    ? issue.assignedTo._id
    : issue ? (issue.assignedTo as string) || "" : "";

  const canHandover = isManager || (userInfo && userInfo._id === currentAssigneeId);
  
  const updateIssueMutation = useUpdateIssue();
  const uploadAttachmentsMutation = useUploadAttachments();
  const deleteAttachmentMutation = useDeleteAttachment();
  const deleteIssueMutation = useDeleteIssue();
  const { data: users = [] } = useGetAllUsers();
  
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals and custom dialog prompts state
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [expandHoursInput, setExpandHoursInput] = useState("1");
  
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestHoursInput, setRequestHoursInput] = useState("1");
  const [requestReasonInput, setRequestReasonInput] = useState("");
  
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [handoverReasonInput, setHandoverReasonInput] = useState("");
  const [pendingAssigneeId, setPendingAssigneeId] = useState("");
  const [pendingAssigneeName, setPendingAssigneeName] = useState("");

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

  const handleDelete = async () => {
    if (!issue) return;
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    setIsDeleting(true);
    try {
      await deleteIssueMutation.mutateAsync(issue._id);
      toast.success("Issue deleted successfully!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete issue.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExpandSubmit = () => {
    if (!expandHoursInput || isNaN(Number(expandHoursInput)) || Number(expandHoursInput) <= 0) {
      toast.error("Please enter a valid number of hours.");
      return;
    }
    const newHours = (Number(estimatedHours || 0) + Number(expandHoursInput)).toFixed(2);
    setEstimatedHours(String(Number(newHours)));
    setShowExpandDialog(false);
    toast.success(`Estimate expanded by ${expandHoursInput} hours! Remember to save changes.`);
  };

  const handleRequestSubmit = () => {
    if (!requestHoursInput || isNaN(Number(requestHoursInput)) || Number(requestHoursInput) <= 0) {
      toast.error("Please enter a valid number of hours.");
      return;
    }
    const reason = requestReasonInput.trim() || "Time extension needed to complete task";
    const structNote = `${technicalApproach ? technicalApproach + "\n\n" : ""}[Time Request] Requested +${requestHoursInput} hours: ${reason} (Requested by ${userInfo?.name})`;
    setTechnicalApproach(structNote);
    setShowRequestDialog(false);
    toast.success(`Time request for +${requestHoursInput} hours added to notes! Click Save Changes to submit.`);
  };

  const handleHandoverSubmit = () => {
    const oldAssigneeName = issue && typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo.name : "Unassigned";
    const reason = handoverReasonInput.trim() || "Engineer handover";
    const handoverNote = `\n\n[Handover] Issue handed over from ${oldAssigneeName} to ${pendingAssigneeName} by ${userInfo?.name || "System"}. Reason: ${reason}`;
    setTechnicalApproach((prev) => `${prev}${handoverNote}`);
    setAssignedTo(pendingAssigneeId);
    setShowHandoverDialog(false);
    toast.success(`Handover to ${pendingAssigneeName} set! Please save changes to apply.`);
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

        {/* Warning Banner if Time Exceeded */}
        {Number(estimatedHours || 0) > 0 && time > Number(estimatedHours || 0) * 3600 && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold animate-pulse-soft mt-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Warning: Tracked time ({Math.floor(time / 60)} minutes) has exceeded the estimate of {Number(estimatedHours) * 60} minutes!
            </span>
          </div>
        )}

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
            
            {/* Time & Status Panel Card */}
            <Card className="bg-[var(--background)] border-[var(--border)] shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-[var(--border)]/50 bg-[var(--surface-hover)]/10 p-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--primary)]" />
                    Status & Time Tracker
                  </span>
                  {isTicking && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold capitalize">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Ticking
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 space-y-4">
                {/* Status Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Issue Status
                  </Label>
                  <div className="relative">
                    <select
                      id="status"
                      value={status}
                      disabled={issue.status === "Closed" && userInfo?.role !== "super_admin"}
                      onChange={(e) => setStatus(e.target.value)}
                      className={`w-full h-9 appearance-none rounded-lg border px-3 pr-10 text-xs font-bold focus:outline-none transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed ${
                        STATUS_SELECT_COLORS[status] || "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                      }`}
                    >
                      {ISSUE_STATUSES.map((col) => {
                        if (col === "Closed" && userInfo?.role !== "super_admin" && issue.status !== "Closed") {
                          return null;
                        }
                        return (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                  </div>
                </div>

                <Separator className="bg-[var(--border)]/50" />

                {/* Digital Clock */}
                <div className="bg-[var(--surface-hover)]/30 dark:bg-black/10 rounded-xl p-3 text-center border border-[var(--border)]/30">
                  <p className="text-3xl font-mono font-bold text-[var(--text-primary)] tracking-wider">
                    {formatStopwatchTime(time)}
                  </p>
                  <p className="text-[9px] text-[var(--text-tertiary)] font-medium mt-1 uppercase tracking-wider">Tracked Duration</p>
                </div>

                {/* Timer Controls */}
                <div className="flex gap-2">
                  {!isTicking ? (
                    <button
                      onClick={handleStartTimer}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold hover:brightness-105 transition-all shadow-sm cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Start Work
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseTimer}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Pause className="h-3.5 w-3.5 fill-current" />
                      Pause Timer
                    </button>
                  )}
                  <button
                    onClick={handleStopTimer}
                    disabled={time === 0}
                    title="Reset timer"
                    className="flex items-center justify-center h-9 w-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>

                {/* Estimate Progress Bar */}
                {Number(estimatedHours || 0) > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-semibold text-[var(--text-secondary)]">Estimate Used</span>
                      <span className={`font-bold ${time > Number(estimatedHours) * 3600 ? "text-red-500 animate-pulse-soft" : "text-[var(--primary)]"}`}>
                        {Math.min(100, Math.round((time / (Number(estimatedHours) * 3600)) * 100))}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden border border-[var(--border)]/20">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          time > Number(estimatedHours) * 3600
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                        }`}
                        style={{ width: `${Math.min(100, (time / (Number(estimatedHours) * 3600)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] pt-0.5">
                      <span>{Math.floor(time / 60)} mins logged</span>
                      <span>{Number(estimatedHours) * 60} mins estimated</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details Summary Card */}
            <Card className="bg-[var(--background)] border-[var(--border)] shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-[var(--border)]/50 bg-[var(--surface-hover)]/10 p-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Issue Metadata & SLA
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 space-y-4">
                {/* Client & Project */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Client & Project</span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {client?.code ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary-text)] uppercase tracking-wider">
                          {client.code}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-tertiary)] uppercase tracking-wider">
                          GEN
                        </span>
                      )}
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {project?.name || "General"}
                      </span>
                    </div>
                    {client?.name && (
                      <p className="text-[10px] text-[var(--text-tertiary)]">{client.name}</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-[var(--border)]/50" />

                {/* Due Date SLA */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> Due Date SLA
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${
                      new Date(issue.dueDate) < new Date() && !["Resolved", "Closed"].includes(issue.status)
                        ? "text-red-500"
                        : "text-[var(--text-primary)]"
                    }`}>
                      {new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {new Date(issue.dueDate) < new Date() && !["Resolved", "Closed"].includes(issue.status) && (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider shrink-0 animate-pulse-soft">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="bg-[var(--border)]/50" />

                {/* Estimated Hours Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="estimatedHours" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Est. Hours
                    </Label>
                    {estimatedHours && (
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)]">
                        ({Number(estimatedHours) * 60} mins)
                      </span>
                    )}
                  </div>
                  <Input
                    id="estimatedHours"
                    type="number"
                    placeholder="e.g. 4.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="h-8.5 bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-xs font-bold"
                  />
                </div>

                {/* Adjust / Expand Time Actions */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExpandHoursInput("1");
                      setShowExpandDialog(true);
                    }}
                    className="flex-1 h-7.5 text-[10px] font-bold py-0 border-[var(--border)] hover:bg-[var(--surface-hover)] bg-[var(--surface)]"
                  >
                    + Expand Time
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRequestHoursInput("1");
                      setRequestReasonInput("");
                      setShowRequestDialog(true);
                    }}
                    className="flex-1 h-7.5 text-[10px] font-bold py-0 border-[var(--border)] hover:bg-[var(--surface-hover)] bg-[var(--surface)]"
                  >
                    ✉ Request Time
                  </Button>
                </div>

                <Separator className="bg-[var(--border)]/50" />

                {/* Assignment & Handover */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="assignedTo" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Assigned Engineer
                    </Label>
                    {canHandover && !isManager && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-extrabold uppercase tracking-wide border border-emerald-200 dark:border-emerald-900/30">
                        Handover Enabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {issue.assignedTo ? (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0">
                        {typeof issue.assignedTo === "object" ? issue.assignedTo.name.charAt(0).toUpperCase() : "E"}
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <UserIcon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      </div>
                    )}
                    <div className="relative flex-1">
                      <select
                        id="assignedTo"
                        value={assignedTo}
                        disabled={!canHandover}
                        onChange={(e) => {
                          const newAssigneeId = e.target.value;
                          const oldAssigneeName = issue && typeof issue.assignedTo === "object" && issue.assignedTo ? issue.assignedTo.name : "Unassigned";
                          const newAssigneeName = users.find((u) => u._id === newAssigneeId)?.name || "Unassigned";
                          
                          if (newAssigneeId !== currentAssigneeId) {
                            setPendingAssigneeId(newAssigneeId);
                            setPendingAssigneeName(newAssigneeName);
                            setHandoverReasonInput("");
                            setShowHandoverDialog(true);
                          } else {
                            setAssignedTo(newAssigneeId);
                          }
                        }}
                        className="w-full h-8.5 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-2 pr-8 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({ROLE_LABELS[u.role] || u.role})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-4 gap-2 border-t border-[var(--border)] flex items-center justify-between">
          {userInfo?.role === "super_admin" && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || updateIssueMutation.isPending}
              className="mr-auto h-10 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete Issue"
              )}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateIssueMutation.isPending || isDeleting}
              className="h-10 text-sm font-semibold border-[var(--border)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateIssueMutation.isPending || isDeleting}
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
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Expand Time Custom Dialog */}
      <Dialog open={showExpandDialog} onOpenChange={setShowExpandDialog}>
        <DialogContent className="max-w-md bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Expand Estimated Time</DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-secondary)]">
              Directly adjust the estimate by adding additional hours.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="expandHours" className="text-xs font-semibold">Additional Hours</Label>
            <Input
              id="expandHours"
              type="number"
              min="0.1"
              step="0.1"
              value={expandHoursInput}
              onChange={(e) => setExpandHoursInput(e.target.value)}
              className="h-10 text-sm"
              placeholder="e.g. 1 or 0.5"
            />
            {expandHoursInput && !isNaN(Number(expandHoursInput)) && (
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Equivalent to {Number(expandHoursInput) * 60} minutes
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExpandDialog(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button onClick={handleExpandSubmit} className="h-9 text-xs bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
              Expand Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Time Custom Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Request More Time</DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-secondary)]">
              Submit a formal request for manager approval.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="requestHours" className="text-xs font-semibold">Additional Hours Needed</Label>
              <Input
                id="requestHours"
                type="number"
                min="0.1"
                step="0.1"
                value={requestHoursInput}
                onChange={(e) => setRequestHoursInput(e.target.value)}
                className="h-10 text-sm"
                placeholder="e.g. 1.5"
              />
              {requestHoursInput && !isNaN(Number(requestHoursInput)) && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Equivalent to {Number(requestHoursInput) * 60} minutes
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="requestReason" className="text-xs font-semibold">Reason for Request</Label>
              <Textarea
                id="requestReason"
                rows={3}
                value={requestReasonInput}
                onChange={(e) => setRequestReasonInput(e.target.value)}
                className="text-sm bg-[var(--background)] border-[var(--border)]"
                placeholder="Brief explanation for the extension..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button onClick={handleRequestSubmit} className="h-9 text-xs bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Handover Custom Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent className="max-w-md bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Handover Issue</DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-secondary)]">
              Specify the reason for handing this issue over to {pendingAssigneeName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="handoverReason" className="text-xs font-semibold">Reason for Handover</Label>
            <Textarea
              id="handoverReason"
              rows={3}
              value={handoverReasonInput}
              onChange={(e) => setHandoverReasonInput(e.target.value)}
              className="text-sm bg-[var(--background)] border-[var(--border)]"
              placeholder="e.g., Cannot continue working on this due to scheduling, shift end, etc."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowHandoverDialog(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button onClick={handleHandoverSubmit} className="h-9 text-xs bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
              Confirm Handover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
