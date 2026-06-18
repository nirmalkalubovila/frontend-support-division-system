"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  useNotifyTimeExceeded,
  type Issue,
} from "@/api/services/issue-management/issue-service";
import { useStopTimer, useStartTimer } from "@/api/services/time-tracking/time-log-service";
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
  const notifyTimeExceededMutation = useNotifyTimeExceeded();
  const stopTimerMutation = useStopTimer();
  const startTimerMutation = useStartTimer();
  const { data: users = [] } = useGetAllUsers();
  
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals and custom dialog prompts state
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [expandHoursInput, setExpandHoursInput] = useState("1");
  const [expandReasonInput, setExpandReasonInput] = useState("");
  const [pendingExpandReason, setPendingExpandReason] = useState("");
  
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestHoursInput, setRequestHoursInput] = useState("1");
  const [requestReasonInput, setRequestReasonInput] = useState("");
  
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [handoverReasonInput, setHandoverReasonInput] = useState("");
  const [pendingAssigneeId, setPendingAssigneeId] = useState("");
  const [pendingAssigneeName, setPendingAssigneeName] = useState("");

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Form & Fields State
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [technicalApproach, setTechnicalApproach] = useState<string>("");
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Stopwatch State & Logic  (ref-based to avoid per-second re-renders)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [time, setTime] = useState<number>(0);
  const [isTicking, setIsTicking] = useState<boolean>(false);
  const timeRef = useRef<number>(0);
  const clockDisplayRef = useRef<HTMLParagraphElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressPctRef = useRef<HTMLSpanElement>(null);
  const loggedMinsRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatStopwatchTime = useCallback((sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  }, []);

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
      const savedTime = localStorage.getItem(`timer_time_${issue._id}`);
      let initialTime = savedTime ? parseInt(savedTime, 10) : 0;
      
      const savedTicking = localStorage.getItem(`timer_ticking_${issue._id}`);
      const savedTimestamp = localStorage.getItem(`timer_timestamp_${issue._id}`);
      
      if (savedTicking === "true" && savedTimestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
        initialTime = initialTime + elapsed;
        setIsTicking(true);
      } else {
        setIsTicking(false);
      }
      timeRef.current = initialTime;
      setTime(initialTime);
    }
  }, [open, issue]);

  // Ref-based interval: updates DOM directly, syncs React state only every 10 seconds
  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (isTicking && issue?._id) {
      let tickCount = 0;
      intervalRef.current = setInterval(() => {
        timeRef.current += 1;
        tickCount += 1;
        const newTime = timeRef.current;

        // Direct DOM update for the clock display (no React re-render)
        if (clockDisplayRef.current) clockDisplayRef.current.textContent = formatStopwatchTime(newTime);

        // Update progress bar directly
        const estH = parseFloat(estimatedHours) || 0;
        if (estH > 0) {
          const pct = Math.min(100, Math.round((newTime / (estH * 3600)) * 100));
          if (progressPctRef.current) progressPctRef.current.textContent = `${pct}%`;
          if (progressBarRef.current) progressBarRef.current.style.width = `${Math.min(100, (newTime / (estH * 3600)) * 100)}%`;
          if (loggedMinsRef.current) loggedMinsRef.current.textContent = `${Math.floor(newTime / 60)} mins logged`;
        }

        // Write to localStorage every 5 seconds instead of every second
        if (tickCount % 5 === 0) {
          localStorage.setItem(`timer_time_${issue._id}`, String(newTime));
          localStorage.setItem(`timer_timestamp_${issue._id}`, String(Date.now()));
        }

        // Sync React state every 10 seconds for warning banner etc
        if (tickCount % 10 === 0) {
          setTime(newTime);
          const estH = parseFloat(estimatedHours) || 0;
          if (estH > 0 && newTime > estH * 3600) {
            const notifiedKey = `timer_exceeded_notified_${issue._id}`;
            const alreadyNotified = localStorage.getItem(notifiedKey);
            if (!alreadyNotified) {
              localStorage.setItem(notifiedKey, "true");
              notifyTimeExceededMutation.mutate({
                issueId: issue._id,
                activeDuration: newTime,
              });
            }
          }
        }
      }, 1000);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTicking, issue?._id, formatStopwatchTime, estimatedHours, notifyTimeExceededMutation]);

  const handleStartTimer = useCallback(async () => {
    if (!issue?._id) return;
    try {
      await startTimerMutation.mutateAsync({
        issueId: issue._id,
        workType: 'In Progress', // Always 'In Progress' — issue.status may contain legacy DB values
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start timer.');
      return;
    }
    setIsTicking(true);
    localStorage.setItem(`timer_ticking_${issue._id}`, 'true');
    localStorage.setItem(`timer_timestamp_${issue._id}`, String(Date.now()));
    window.dispatchEvent(new Event('storage'));
  }, [issue?._id, startTimerMutation]);

  const handlePauseTimer = useCallback(() => {
    if (!issue?._id) return;
    // Persist current time before pausing
    localStorage.setItem(`timer_time_${issue._id}`, String(timeRef.current));
    setIsTicking(false);
    setTime(timeRef.current);
    localStorage.setItem(`timer_ticking_${issue._id}`, "false");
    localStorage.removeItem(`timer_timestamp_${issue._id}`);
    window.dispatchEvent(new Event("storage"));
  }, [issue?._id]);

  const handleEndWork = useCallback(async () => {
    if (!issue?._id) return;
    // Stop the local interval and capture current time before clearing
    setIsTicking(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    try {
      await stopTimerMutation.mutateAsync({ issueId: issue._id });
      toast.success("Work ended. Issue moved to Testing.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to end work session.");
    }
    // Always clear localStorage regardless of API result
    timeRef.current = 0;
    setTime(0);
    localStorage.removeItem(`timer_time_${issue._id}`);
    localStorage.removeItem(`timer_ticking_${issue._id}`);
    localStorage.removeItem(`timer_timestamp_${issue._id}`);
    localStorage.removeItem(`timer_exceeded_notified_${issue._id}`);
    window.dispatchEvent(new Event("storage"));
  }, [issue?._id, stopTimerMutation]);

  const handleStopTimer = useCallback(() => {
    if (!issue?._id) return;
    setIsTicking(false);
    timeRef.current = 0;
    setTime(0);
    localStorage.removeItem(`timer_time_${issue._id}`);
    localStorage.removeItem(`timer_ticking_${issue._id}`);
    localStorage.removeItem(`timer_timestamp_${issue._id}`);
    localStorage.removeItem(`timer_exceeded_notified_${issue._id}`);
    window.dispatchEvent(new Event("storage"));
  }, [issue?._id]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Handle Save
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          expandReason: pendingExpandReason || null,
        },
      });
      setPendingExpandReason("");
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
    const reason = expandReasonInput.trim();
    if (!reason) {
      toast.error("Please enter a reason for expansion.");
      return;
    }
    const hoursNum = Number(expandHoursInput);
    const newHours = (Number(estimatedHours || 0) + hoursNum).toFixed(2);
    setEstimatedHours(String(Number(newHours)));
    setPendingExpandReason(reason);
    
    const structNote = `${technicalApproach ? technicalApproach + "\n\n" : ""}[Time Expanded] Added +${hoursNum} hours: ${reason} (Expanded by ${userInfo?.name})`;
    setTechnicalApproach(structNote);
    setShowExpandDialog(false);
    toast.success(`Estimate expanded by ${expandHoursInput} hours! Remember to save changes.`);
  };

  const handleRequestSubmit = async () => {
    if (!issue) return;
    if (!requestHoursInput || isNaN(Number(requestHoursInput)) || Number(requestHoursInput) <= 0) {
      toast.error("Please enter a valid number of hours.");
      return;
    }
    const reason = requestReasonInput.trim();
    if (!reason) {
      toast.error("Please enter a reason for the request.");
      return;
    }
    const hoursNum = Number(requestHoursInput);
    const structNote = `${technicalApproach ? technicalApproach + "\n\n" : ""}[Time Request] Requested +${hoursNum} hours: ${reason} (Requested by ${userInfo?.name})`;
    
    try {
      await updateIssueMutation.mutateAsync({
        id: issue._id,
        data: {
          technicalApproach: structNote,
          timeRequest: {
            hours: hoursNum,
            reason: reason,
          },
        },
      });
      setTechnicalApproach(structNote);
      setShowRequestDialog(false);
      toast.success(`Time request for +${hoursNum} hours submitted successfully!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit time request.");
    }
  };

  const handleApproveTimeRequest = async () => {
    if (!issue || !issue.timeRequest) return;
    const hoursToAdd = issue.timeRequest.hours;
    const requesterName = typeof issue.timeRequest.requestedBy === "object" && issue.timeRequest.requestedBy
      ? issue.timeRequest.requestedBy.name
      : "Engineer";
    const reason = issue.timeRequest.reason;

    const newEstimatedHours = Number(estimatedHours || 0) + hoursToAdd;
    const structNote = `${technicalApproach ? technicalApproach + "\n\n" : ""}[Time Request Approved] Approved +${hoursToAdd} hours requested by ${requesterName}. Reason: ${reason} (Approved by ${userInfo?.name})`;

    try {
      await updateIssueMutation.mutateAsync({
        id: issue._id,
        data: {
          estimatedHours: newEstimatedHours,
          technicalApproach: structNote,
          timeRequest: null,
        },
      });
      setEstimatedHours(String(newEstimatedHours));
      setTechnicalApproach(structNote);
      toast.success("Time request approved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve time request.");
    }
  };

  const handleDeclineTimeRequest = async () => {
    if (!issue || !issue.timeRequest) return;
    const hoursRequested = issue.timeRequest.hours;
    const requesterName = typeof issue.timeRequest.requestedBy === "object" && issue.timeRequest.requestedBy
      ? issue.timeRequest.requestedBy.name
      : "Engineer";
    const reason = issue.timeRequest.reason;

    const structNote = `${technicalApproach ? technicalApproach + "\n\n" : ""}[Time Request Declined] Declined +${hoursRequested} hours requested by ${requesterName}. Reason: ${reason} (Declined by ${userInfo?.name})`;

    try {
      await updateIssueMutation.mutateAsync({
        id: issue._id,
        data: {
          technicalApproach: structNote,
          timeRequest: null,
        },
      });
      setTechnicalApproach(structNote);
      toast.success("Time request declined successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to decline time request.");
    }
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // File Upload Handlers
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 items-start">
          {/* Main Details Panel (Left / Col-Span-2) */}
          <div className="lg:col-span-7 space-y-6">
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
          {/* Quick Settings Panel (Right / Col-Span-5) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
            
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
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

                {/* Digital Clock â€“ uses ref for direct DOM updates */}
                <div className="bg-[var(--surface-hover)]/30 dark:bg-black/10 rounded-xl p-3 text-center border border-[var(--border)]/30">
                  <p ref={clockDisplayRef} className="text-3xl font-mono font-bold text-[var(--text-primary)] tracking-wider">
                    {formatStopwatchTime(time)}
                  </p>
                  <p className="text-[9px] text-[var(--text-tertiary)] font-medium mt-1 uppercase tracking-wider">Tracked Duration</p>
                </div>

                {/* Timer Controls */}
                <div className="flex gap-2">
                  {!isTicking ? (
                    <button
                      onClick={handleStartTimer}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#84cc16] hover:bg-[#76b813] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                    onClick={handleEndWork}
                    disabled={(time === 0 && !isTicking) || stopTimerMutation.isPending}
                    title="End Work"
                    className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-xs font-bold"
                  >
                    {stopTimerMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    )}
                    End Work
                  </button>
                </div>

                {/* Estimate Progress Bar */}
                {Number(estimatedHours || 0) > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-semibold text-[var(--text-secondary)]">Estimate Used</span>
                      <span ref={progressPctRef} className={`font-bold ${time > Number(estimatedHours) * 3600 ? "text-red-500" : "text-[var(--primary)]"}`}>
                        {Math.min(100, Math.round((time / (Number(estimatedHours) * 3600)) * 100))}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden border border-[var(--border)]/20">
                      <div
                        ref={progressBarRef}
                        className={`h-full rounded-full ${
                          time > Number(estimatedHours) * 3600
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                        }`}
                        style={{ width: `${Math.min(100, (time / (Number(estimatedHours) * 3600)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] pt-0.5">
                      <span ref={loggedMinsRef}>{Math.floor(time / 60)} mins logged</span>
                      <span>{Number(estimatedHours) * 60} mins estimated</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* â”€â”€ Full-Width Issue Metadata, SLA & Assignment Card (Horizontal Layout) â”€â”€ */}
        <Card className="bg-[var(--background)] border-[var(--border)] shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-[var(--border)]/50 bg-[var(--surface-hover)]/10 p-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Issue Metadata, SLA & Assignment
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4">
            {/* Horizontal grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Client & Project */}
              <div className="space-y-1.5 p-3 rounded-lg bg-[var(--surface-hover)]/20 border border-[var(--border)]/30">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Client & Project</span>
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
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate" title={project?.name || "General"}>
                    {project?.name || "General"}
                  </span>
                </div>
                {client?.name && (
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">{client.name}</p>
                )}
              </div>

              {/* Assigned Engineer & Handover */}
              <div className="space-y-1.5 p-3 rounded-lg bg-[var(--surface-hover)]/20 border border-[var(--border)]/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Assigned Engineer</span>
                  {canHandover && !isManager && (
                    <span className="px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-extrabold uppercase tracking-wide border border-emerald-200 dark:border-emerald-900/30">
                      Handover Enabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  {issue.assignedTo ? (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-[9px] font-bold shadow-sm shrink-0">
                      {typeof issue.assignedTo === "object" ? issue.assignedTo.name.charAt(0).toUpperCase() : "E"}
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <UserIcon className="h-3 w-3 text-[var(--text-tertiary)]" />
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
                      className="w-full h-8 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-2 pr-8 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({ROLE_LABELS[u.role] || u.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Due Date SLA */}
              <div className="space-y-1.5 p-3 rounded-lg bg-[var(--surface-hover)]/20 border border-[var(--border)]/30">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> Due Date SLA
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className={`text-sm font-bold ${
                    new Date(issue.dueDate) < new Date() && !["Resolved", "Closed"].includes(issue.status)
                      ? "text-red-500"
                      : "text-[var(--text-primary)]"
                  }`}>
                    {new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {new Date(issue.dueDate) < new Date() && !["Resolved", "Closed"].includes(issue.status) && (
                    <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider shrink-0">
                      Overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Estimated Hours */}
              <div className="space-y-1.5 p-3 rounded-lg bg-[var(--surface-hover)]/20 border border-[var(--border)]/30">
                <div className="flex items-center justify-between">
                  <Label htmlFor="estimatedHoursHoriz" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Est. Hours
                  </Label>
                  {estimatedHours && (
                    <span className="text-[10px] font-bold text-[var(--text-tertiary)]">
                      ({Number(estimatedHours) * 60} mins)
                    </span>
                  )}
                </div>
                <Input
                  id="estimatedHoursHoriz"
                  type="number"
                  placeholder="e.g. 4.5"
                  value={estimatedHours}
                  disabled={!isManager}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="h-8 bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-[11px] font-bold disabled:opacity-75 disabled:cursor-not-allowed mt-0.5"
                />
              </div>

              {/* Time Actions */}
              <div className="space-y-2 p-3 rounded-lg bg-[var(--surface-hover)]/20 border border-[var(--border)]/30">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Time Actions</span>
                <div className="flex gap-2 pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setExpandHoursInput("1");
                      setExpandReasonInput("");
                      setShowExpandDialog(true);
                    }}
                    className="flex-1 h-9 text-[11px] font-bold border-[var(--border)] hover:bg-[var(--surface-hover)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    + Expand
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRequestHoursInput("1");
                      setRequestReasonInput("");
                      setShowRequestDialog(true);
                    }}
                    className="flex-1 h-9 text-[11px] font-bold border-[var(--border)] hover:bg-[var(--surface-hover)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    âœ‰ Request
                  </Button>
                </div>
              </div>
            </div>

            {/* Pending Time Request Card â€“ full width below the grid */}
            {issue.timeRequest && issue.timeRequest.hours && (
              <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Pending Time Request
                      </p>
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse-soft" />
                    </div>
                    <p className="text-xs text-[var(--text-primary)] font-semibold">
                      Requested <span className="text-[var(--primary)] font-bold">+{issue.timeRequest.hours} hrs</span> by{" "}
                      <span className="text-[var(--text-primary)] font-bold">
                        {typeof issue.timeRequest.requestedBy === "object" && issue.timeRequest.requestedBy
                          ? issue.timeRequest.requestedBy.name
                          : "Engineer"}
                      </span>
                    </p>
                    {issue.timeRequest.reason && (
                      <p className="text-[11px] text-[var(--text-secondary)] italic">
                        "{issue.timeRequest.reason}"
                      </p>
                    )}
                  </div>
                  {isManager && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApproveTimeRequest}
                        className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDeclineTimeRequest}
                        className="h-9 px-5 text-xs font-bold border-red-200 dark:border-red-900/50 hover:bg-red-500/10 text-red-600 dark:text-red-400 bg-transparent"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
    </Dialog>

    {/* Expand Time Custom Dialog */}
    <Dialog open={showExpandDialog} onOpenChange={setShowExpandDialog}>
      <DialogContent className="max-w-md bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Expand Estimated Time</DialogTitle>
          <DialogDescription className="text-xs text-[var(--text-secondary)]">
            Directly adjust the estimate by adding additional hours.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-1">
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
          <div className="space-y-1">
            <Label htmlFor="expandReason" className="text-xs font-semibold">Reason for Expansion</Label>
            <Textarea
              id="expandReason"
              rows={3}
              value={expandReasonInput}
              onChange={(e) => setExpandReasonInput(e.target.value)}
              className="text-sm bg-[var(--background)] border-[var(--border)]"
              placeholder="Brief explanation for expanding the time..."
            />
          </div>
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
  </>
);
}
