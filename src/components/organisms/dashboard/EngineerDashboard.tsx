"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Square,
  Ticket,
  Timer,
  CheckCircle,
  Undo,
  ChevronRight,
  ClipboardList,
  History,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatCard } from "@/components/atoms/statCard";
import { Progress } from "@/components/ui/progress";
import {
  useGetTimeLogs,
  useStartTimer,
  useStopTimer,
  useCreateManualLog,
  useDeleteTimeLog,
  type WorkType,
} from "@/api/services/time-tracking/time-log-service";
import { useUpdateIssue, useNotifyTimeExceeded, type Issue } from "@/api/services/issue-management/issue-service";
import { useGetAssignedTasks, type Task } from "@/api/services/project-management/task-service";
import { useGetAssignedCRs, type ChangeRequest } from "@/api/services/project-management/cr-service";
import { useUpdateTask } from "@/api/services/project-management/task-service";
import { useUpdateCR } from "@/api/services/project-management/cr-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { IssueDetailsModal } from "../issueDetailsModal/issue-details-modal";

interface EngineerDashboardProps {
  issues: Issue[];
  currentUserId: string;
}

// All valid workType values accepted by the backend
const VALID_WORK_TYPES: WorkType[] = [
  'Backlog', 'Assigned', 'Planned Solution', 'In Progress', 'Testing',
  'Resolved', 'Closed', 'Reopened', 'On Hold', 'Pending Client',
  'To Do', 'Review', 'Done', 'Submitted', 'Rejected', 'In Development', 'Completed',
];

/** Returns wt if valid, otherwise falls back to a safe default. */
const sanitizeWorkType = (wt: string | undefined, fallback: WorkType = 'In Progress'): WorkType =>
  (VALID_WORK_TYPES as string[]).includes(wt ?? '') ? (wt as WorkType) : fallback;

export function EngineerDashboard({ issues, currentUserId }: EngineerDashboardProps) {
  const queryClient = useQueryClient();
  const updateIssueMutation = useUpdateIssue();
  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();
  const notifyTimeExceededMutation = useNotifyTimeExceeded();
  const deleteTimeLogMutation = useDeleteTimeLog();

  // Fetch assigned tasks & CRs
  const { data: tasksData, refetch: refetchTasks } = useGetAssignedTasks(currentUserId);
  const { data: crsData, refetch: refetchCRs } = useGetAssignedCRs(currentUserId);

  const assignedTasks = useMemo(() => tasksData ?? [], [tasksData]);
  const assignedCRs = useMemo(() => crsData ?? [], [crsData]);

  // Generic mutations for task and CR updates
  const updateTaskMutation = useMutation({
    mutationFn: async ({ projectId, taskId, data }: { projectId: string; taskId: string; data: any }) => {
      const res = await axiosInstance.patch(`/projects/${projectId}/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/tasks", variables.projectId] });
      refetchTasks();
    }
  });

  const updateCRMutation = useMutation({
    mutationFn: async ({ projectId, crId, data }: { projectId: string; crId: string; data: any }) => {
      const res = await axiosInstance.patch(`/projects/${projectId}/crs/${crId}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/crs"] });
      queryClient.invalidateQueries({ queryKey: ["/crs", variables.projectId] });
      refetchCRs();
    }
  });

  // Fetch recent time logs for current user
  const { data: logsData, refetch: refetchLogs } = useGetTimeLogs({
    user: currentUserId,
    limit: 10,
    sortBy: "createdAt:desc",
  });

  const recentLogs = useMemo(() => logsData?.data ?? [], [logsData]);

  // Tabs for the Focus Queue
  const [activeQueueTab, setActiveQueueTab] = useState<'issues' | 'tasks' | 'crs'>('issues');

  // ──────────────────────────────────────────────────────────────
  // Stopwatch Engine State
  // ──────────────────────────────────────────────────────────────
  const [trackingType, setTrackingType] = useState<'issue' | 'task' | 'cr'>('issue');
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType>("In Progress");
  const [time, setTime] = useState<number>(0);
  const [isTicking, setIsTicking] = useState<boolean>(false);
  const [activeLogId, setActiveLogId] = useState<string>("");
  
  // Submit modal state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitNote, setSubmitNote] = useState("");
  const [detailedIssue, setDetailedIssue] = useState<Issue | null>(null);

  // Issues filtering
  const myAssignedIssues = useMemo(() => {
    return issues.filter((issue) => {
      const assigneeId = typeof issue.assignedTo === "object" && issue.assignedTo !== null
        ? issue.assignedTo._id
        : issue.assignedTo;
      return assigneeId === currentUserId;
    });
  }, [issues, currentUserId]);

  const myActiveIssues = useMemo(() => {
    return myAssignedIssues.filter(
      (i) => i.status !== "Resolved" && i.status !== "Closed" && i.status !== "Done"
    );
  }, [myAssignedIssues]);

  const myResolvedIssues = useMemo(() => {
    return myAssignedIssues
      .filter((i) => i.status === "Resolved" || i.status === "Closed" || i.status === "Done")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [myAssignedIssues]);

  // Tasks filtering
  const myActiveTasks = useMemo(() => {
    return assignedTasks.filter((t) => t.status !== "Done");
  }, [assignedTasks]);

  const myResolvedTasks = useMemo(() => {
    return assignedTasks.filter((t) => t.status === "Done");
  }, [assignedTasks]);

  // CRs filtering
  const myActiveCRs = useMemo(() => {
    return assignedCRs.filter((c) => c.status !== "Done" && c.status !== "Closed" && c.status !== "Rejected");
  }, [assignedCRs]);

  const myResolvedCRs = useMemo(() => {
    return assignedCRs.filter((c) => c.status === "Done" || c.status === "Closed" || c.status === "Rejected");
  }, [assignedCRs]);

  // Focus queues
  const queueIssues = useMemo(() => {
    return [...myActiveIssues].sort((a, b) => {
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });
  }, [myActiveIssues]);

  const queueTasks = useMemo(() => {
    return [...myActiveTasks].sort((a, b) => {
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });
  }, [myActiveTasks]);

  const queueCRs = useMemo(() => {
    return [...myActiveCRs].sort((a, b) => {
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });
  }, [myActiveCRs]);

  const selectedItemObj = useMemo(() => {
    if (trackingType === 'issue') return issues.find((i) => i._id === selectedItemId);
    if (trackingType === 'task') return assignedTasks.find((t) => t._id === selectedItemId);
    if (trackingType === 'cr') return assignedCRs.find((c) => c._id === selectedItemId);
    return null;
  }, [trackingType, selectedItemId, issues, assignedTasks, assignedCRs]);

  // Sync active timer from backend database on load / query change
  useEffect(() => {
    if (!logsData?.data) return;
    
    // Find if there is an active running timer (endTime is null) in the user's logs
    const activeDbLog = logsData.data.find((log) => !log.endTime);
    
    if (activeDbLog) {
      const itemId = 
        typeof activeDbLog.issue === 'object' && activeDbLog.issue ? activeDbLog.issue._id :
        typeof activeDbLog.task === 'object' && activeDbLog.task ? activeDbLog.task._id :
        typeof activeDbLog.cr === 'object' && activeDbLog.cr ? activeDbLog.cr._id : 
        (activeDbLog.issue || activeDbLog.task || activeDbLog.cr || '');
        
      const itemType: 'issue' | 'task' | 'cr' = activeDbLog.issue ? 'issue' : activeDbLog.task ? 'task' : 'cr';
      
      if (itemId) {
        // Compute elapsed time from DB startTime
        const elapsed = Math.floor((Date.now() - new Date(activeDbLog.startTime).getTime()) / 1000);
        
        // Write to localStorage FIRST so syncTimer reads the right values
        localStorage.setItem(`timer_time_${itemId}`, String(elapsed));
        localStorage.setItem(`timer_ticking_${itemId}`, "true");
        localStorage.setItem(`timer_timestamp_${itemId}`, String(Date.now()));
        // Sanitize workType in case old DB data has a legacy/invalid value
        const safeWorkType = sanitizeWorkType(
          activeDbLog.workType,
          itemType === 'cr' ? 'In Development' : 'In Progress'
        );
        localStorage.setItem(`timer_worktype_${itemId}`, safeWorkType);
        
        // Only update React state if this is a newly detected active timer
        if (!isTicking || selectedItemId !== itemId) {
          setTrackingType(itemType);
          setSelectedItemId(itemId);
          setSelectedWorkType(safeWorkType);
          setActiveLogId(activeDbLog._id);
          setTime(elapsed);
          setIsTicking(true);
          // NOTE: Do NOT dispatch 'storage' event here.
          // Dispatching it would trigger syncTimer with a STALE selectedItemId
          // (React state is async), causing it to read the wrong localStorage key
          // and reset the timer to 0. State is set directly above instead.
        }
      }
    } else {
      setActiveLogId("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsData]);

  // Sync timer state on select item change or storage event
  useEffect(() => {
    const syncTimer = () => {
      if (!selectedItemId) {
        setTime(0);
        setIsTicking(false);
        return;
      }

      const savedTime = localStorage.getItem(`timer_time_${selectedItemId}`);
      const savedTicking = localStorage.getItem(`timer_ticking_${selectedItemId}`);
      const savedTimestamp = localStorage.getItem(`timer_timestamp_${selectedItemId}`);
      const savedWorkType = localStorage.getItem(`timer_worktype_${selectedItemId}`) as WorkType;

      if (savedTicking === "true" && savedWorkType) {
        setSelectedWorkType(savedWorkType);
      } else if (selectedItemObj) {
        setSelectedWorkType((selectedItemObj.status as WorkType) || "In Progress");
      }

      if (savedTicking === "true" && savedTimestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
        setTime((savedTime ? parseInt(savedTime, 10) : 0) + elapsed);
        setIsTicking(true);
      } else {
        setTime(savedTime ? parseInt(savedTime, 10) : 0);
        setIsTicking(false);
      }
    };

    syncTimer();
    window.addEventListener("storage", syncTimer);
    return () => {
      window.removeEventListener("storage", syncTimer);
    };
  }, [selectedItemId, selectedItemObj?.status]);

  // Tick the timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let tickCount = 0;
    if (isTicking && selectedItemId) {
      interval = setInterval(() => {
        tickCount += 1;
        setTime((prev) => {
          const newTime = prev + 1;
          
          // Check for auto-stop based on estimatedHours (only for issues, or task/cr if they have it)
          const estH = trackingType === 'issue' ? (selectedItemObj as any)?.estimatedHours || 0 : 0;
          if (estH > 0 && newTime >= estH * 3600) {
            setIsTicking(false);
            if (interval) clearInterval(interval);
            Promise.resolve().then(async () => {
              try {
                await stopTimerMutation.mutateAsync({
                  issueId: trackingType === 'issue' ? selectedItemId : null,
                  taskId: trackingType === 'task' ? selectedItemId : null,
                  crId: trackingType === 'cr' ? selectedItemId : null,
                  note: "[Ended automatically]"
                });
                toast.success("Work ended automatically (Allocated estimate reached).");
              } catch (err: any) {
                toast.error("Failed to stop timer: " + (err.response?.data?.message || err.message));
              }
              setTime(0);
              localStorage.removeItem(`timer_time_${selectedItemId}`);
              localStorage.removeItem(`timer_ticking_${selectedItemId}`);
              localStorage.removeItem(`timer_timestamp_${selectedItemId}`);
              localStorage.removeItem(`timer_worktype_${selectedItemId}`);
              localStorage.removeItem(`timer_exceeded_notified_${selectedItemId}`);
              window.dispatchEvent(new Event("storage"));
              refetchLogs();
            });
            return 0;
          }

          localStorage.setItem(`timer_time_${selectedItemId}`, String(newTime));
          localStorage.setItem(`timer_timestamp_${selectedItemId}`, String(Date.now()));

          // SLA estimate alert only for issues
          if (trackingType === 'issue' && tickCount % 10 === 0 && selectedItemObj) {
            const estHVal = (selectedItemObj as any).estimatedHours || 0;
            if (estHVal > 0 && newTime > estHVal * 3600) {
              const notifiedKey = `timer_exceeded_notified_${selectedItemId}`;
              const alreadyNotified = localStorage.getItem(notifiedKey);
              if (!alreadyNotified) {
                localStorage.setItem(notifiedKey, "true");
                notifyTimeExceededMutation.mutate({
                  issueId: selectedItemId,
                  activeDuration: newTime,
                });
              }
            }
          }

          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTicking, selectedItemId, selectedItemObj, trackingType, notifyTimeExceededMutation, stopTimerMutation, refetchLogs]);

  // Auto-select active item when category changes
  useEffect(() => {
    if (trackingType === 'issue') {
      if (myActiveIssues.length > 0 && !myActiveIssues.some(i => i._id === selectedItemId)) {
        setSelectedItemId(myActiveIssues[0]._id);
      }
    } else if (trackingType === 'task') {
      if (myActiveTasks.length > 0 && !myActiveTasks.some(t => t._id === selectedItemId)) {
        setSelectedItemId(myActiveTasks[0]._id);
      }
    } else if (trackingType === 'cr') {
      if (myActiveCRs.length > 0 && !myActiveCRs.some(c => c._id === selectedItemId)) {
        setSelectedItemId(myActiveCRs[0]._id);
      }
    }
  }, [trackingType, myActiveIssues, myActiveTasks, myActiveCRs]);

  // ──────────────────────────────────────────────────────────────
  // Stopwatch Actions
  // ──────────────────────────────────────────────────────────────
  const handleStartTimer = () => {
    if (!selectedItemId) return;
    const itemId = selectedItemId; // capture current value to avoid stale closure

    // Trigger backend start
    const startPayload = {
      issueId: trackingType === 'issue' ? itemId : null,
      taskId: trackingType === 'task' ? itemId : null,
      crId: trackingType === 'cr' ? itemId : null,
      workType: selectedWorkType,
    };

    startTimerMutation.mutate(
      startPayload,
      {
        onSuccess: () => {
          setTime(0);
          setIsTicking(true);
          // Initialise timer_time_ to "0" so syncTimer doesn't read null → 0 incorrectly
          localStorage.setItem(`timer_time_${itemId}`, "0");
          localStorage.setItem(`timer_ticking_${itemId}`, "true");
          localStorage.setItem(`timer_timestamp_${itemId}`, String(Date.now()));
          localStorage.setItem(`timer_worktype_${itemId}`, selectedWorkType);
          window.dispatchEvent(new Event("storage"));
          toast.success("Timer started on server.");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to start timer on server.";
          toast.error(msg);
        },
      }
    );
  };

  const handlePauseTimer = () => {
    if (!selectedItemId) return;
    setIsTicking(false);
    localStorage.setItem(`timer_ticking_${selectedItemId}`, "false");
    localStorage.removeItem(`timer_timestamp_${selectedItemId}`);
    window.dispatchEvent(new Event("storage"));
    toast.info("Timer paused locally.");
  };

  const handleStopTimerClick = () => {
    if (time < 300) { // less than 5 mins
      toast.warning("Duration is less than 5 minutes. The session will be discarded by the server.");
    }
    setSubmitNote("");
    setIsSubmitOpen(true);
  };

  const handleSaveTimeLog = () => {
    if (!selectedItemId) return;

    const stopPayload = {
      issueId: trackingType === 'issue' ? selectedItemId : null,
      taskId: trackingType === 'task' ? selectedItemId : null,
      crId: trackingType === 'cr' ? selectedItemId : null,
      note: submitNote,
    };

    stopTimerMutation.mutate(
      stopPayload,
      {
        onSuccess: () => {
          setIsTicking(false);
          setTime(0);
          localStorage.removeItem(`timer_time_${selectedItemId}`);
          localStorage.removeItem(`timer_ticking_${selectedItemId}`);
          localStorage.removeItem(`timer_timestamp_${selectedItemId}`);
          localStorage.removeItem(`timer_worktype_${selectedItemId}`);
          localStorage.removeItem(`timer_exceeded_notified_${selectedItemId}`);
          window.dispatchEvent(new Event("storage"));
          setIsSubmitOpen(false);
          refetchLogs();
          toast.success("Time log submitted successfully.");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to stop timer on server.";
          toast.error(msg);
          if (err?.response?.status === 400 && msg.includes("discarded")) {
            setIsTicking(false);
            setTime(0);
            localStorage.removeItem(`timer_time_${selectedItemId}`);
            localStorage.removeItem(`timer_ticking_${selectedItemId}`);
            localStorage.removeItem(`timer_timestamp_${selectedItemId}`);
            localStorage.removeItem(`timer_worktype_${selectedItemId}`);
            localStorage.removeItem(`timer_exceeded_notified_${selectedItemId}`);
            window.dispatchEvent(new Event("storage"));
            setIsSubmitOpen(false);
          }
        },
      }
    );
  };

  const handleResetTimer = () => {
    if (!selectedItemId) return;
    setIsTicking(false);
    setTime(0);
    localStorage.removeItem(`timer_time_${selectedItemId}`);
    localStorage.removeItem(`timer_ticking_${selectedItemId}`);
    localStorage.removeItem(`timer_timestamp_${selectedItemId}`);
    localStorage.removeItem(`timer_worktype_${selectedItemId}`);
    localStorage.removeItem(`timer_exceeded_notified_${selectedItemId}`);
    window.dispatchEvent(new Event("storage"));
    toast.info("Timer reset.");
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
  // personal KPIs
  // ──────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const openCount = myActiveIssues.length;

    // Hours logged today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const hoursToday = recentLogs
      .filter((log) => new Date(log.startTime) >= startOfToday)
      .reduce((acc, curr) => acc + curr.duration, 0);

    // Resolved this week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const resolvedThisWeek = myAssignedIssues.filter(
      (i) =>
        ["Resolved", "Closed", "Done"].includes(i.status) &&
        new Date(i.updatedAt) >= sevenDaysAgo
    ).length;

    // SLA Next Deadline (earliest due date among open)
    const activeWithDues = myActiveIssues.filter((i) => i.dueDate);
    let nextDeadlineStr = "No deadline";
    if (activeWithDues.length > 0) {
      const sorted = [...activeWithDues].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      const diffMs = new Date(sorted[0].dueDate).getTime() - Date.now();
      const diffHrs = Math.round(diffMs / (1000 * 60 * 60));

      if (diffHrs < 0) {
        nextDeadlineStr = `${Math.abs(diffHrs)}h Overdue`;
      } else if (diffHrs < 24) {
        nextDeadlineStr = `In ${diffHrs}h`;
      } else {
        nextDeadlineStr = `In ${Math.round(diffHrs / 24)}d`;
      }
    }

    return {
      openCount,
      hoursToday: hoursToday.toFixed(1) + "h",
      resolvedThisWeek,
      nextDeadlineStr,
    };
  }, [myActiveIssues, myAssignedIssues, recentLogs]);

  // ──────────────────────────────────────────────────────────────
  // Focus Queue updates
  // ──────────────────────────────────────────────────────────────
  const handleUpdateStatus = (issueId: string, status: string) => {
    updateIssueMutation.mutate(
      { id: issueId, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Ticket status updated to ${status}`);
        },
        onError: () => {
          toast.error("Failed to update status.");
        },
      }
    );
  };

  const handleStartWork = (issue: Issue) => {
    setSelectedItemId(issue._id);

    // 1. Update status to "In Progress"
    updateIssueMutation.mutate(
      { id: issue._id, data: { status: "In Progress" } },
      {
        onSuccess: () => {
          // 2. Start the timer on backend — always 'In Progress' as workType
          startTimerMutation.mutate(
            {
              issueId: issue._id,
              workType: "In Progress",
            },
            {
              onSuccess: () => {
                setIsTicking(true);
                localStorage.setItem(`timer_ticking_${issue._id}`, "true");
                localStorage.setItem(`timer_timestamp_${issue._id}`, String(Date.now()));
                localStorage.setItem(`timer_worktype_${issue._id}`, "In Progress");
                if (!localStorage.getItem(`timer_time_${issue._id}`)) {
                  localStorage.setItem(`timer_time_${issue._id}`, "0");
                }
                window.dispatchEvent(new Event("storage"));
                toast.success("Work started and timer active.");
                
                // 3. Open the issue details modal
                setDetailedIssue({ ...issue, status: "In Progress" });
              },
              onError: (err: any) => {
                const msg = err?.response?.data?.message || "Failed to start timer.";
                toast.error(msg);
                // Open modal anyway so they can see/start manually
                setDetailedIssue({ ...issue, status: "In Progress" });
              },
            }
          );
        },
        onError: () => {
          toast.error("Failed to update status to In Progress.");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="My Open Issues"
          value={kpis.openCount}
          trend="Currently active"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={Clock}
          label="Hours Logged Today"
          value={kpis.hoursToday}
          trend="Target: 8.0h"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved (7d)"
          value={kpis.resolvedThisWeek}
          trend="Resolved tickets"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={AlertTriangle}
          label="Next SLA Deadline"
          value={kpis.nextDeadlineStr}
          trend="Earliest due task"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Queue */}
        <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-[var(--primary-text)] animate-pulse-soft" />
                Focus Queue
              </CardTitle>
            </div>
            <div className="flex bg-[var(--background)] p-1 rounded-lg border border-[var(--border)]">
              <button
                onClick={() => setActiveQueueTab('issues')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeQueueTab === 'issues'
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Issues ({queueIssues.length})
              </button>
              <button
                onClick={() => setActiveQueueTab('tasks')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeQueueTab === 'tasks'
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Tasks ({queueTasks.length})
              </button>
              <button
                onClick={() => setActiveQueueTab('crs')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeQueueTab === 'crs'
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                CRs ({queueCRs.length})
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {activeQueueTab === 'issues' && (
              queueIssues.length === 0 ? (
                <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
                  You have no active issues assigned. Good job!
                </div>
              ) : (
                <div className="space-y-3">
                  {queueIssues.map((issue) => {
                    const client = typeof issue.client === "object" ? issue.client : null;
                    return (
                      <div
                        key={issue._id}
                        onClick={() => setDetailedIssue(issue)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-xs transition-all gap-3 cursor-pointer"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] uppercase tracking-wide scale-90">
                              Issue
                            </Badge>
                            <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">
                              {issue.issueId}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">•</span>
                            <Badge
                              variant={
                                issue.priority === "Critical"
                                  ? "destructive"
                                  : issue.priority === "High"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[9px] uppercase tracking-wide scale-90"
                            >
                              {issue.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-1">
                            {issue.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                            Client: <span className="font-semibold text-[var(--text-primary)]">{client?.name ?? "N/A"}</span> • Current Status:{" "}
                            <span className="font-bold text-[var(--primary-text)]">{issue.status}</span>
                          </p>
                        </div>
                        {/* Quick Action transitions */}
                        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailedIssue(issue)}
                            className="text-[10px] h-8 px-2.5 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg font-semibold"
                            title="View details of this ticket"
                          >
                            View
                          </Button>
                          {issue.status !== "In Progress" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedItemId(issue._id);
                                setTrackingType('issue');
                                handleStartWork(issue);
                              }}
                              className="bg-[#84cc16] hover:bg-[#76b813] text-white text-[10px] h-8 px-2.5 rounded-lg font-semibold shadow-sm animate-pulse-soft"
                              title="Start work on this ticket and open the details stopwatch modal"
                            >
                              Start Work
                            </Button>
                          )}
                          {issue.status === "In Progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(issue._id, "Review")}
                              className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-[10px] h-8 px-2.5 rounded-lg"
                              title="Submit this ticket to your manager for review"
                            >
                              Send to Review
                            </Button>
                          )}
                          {issue.status !== "Done" && issue.status !== "Review" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(issue._id, "Done")}
                              className="text-[10px] h-8 px-2.5 border-[var(--success)] text-[var(--success)] hover:bg-[rgba(34,197,94,0.05)] rounded-lg"
                              title="Mark this ticket as successfully resolved"
                            >
                              Mark Done
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
            {activeQueueTab === 'tasks' && (
              queueTasks.length === 0 ? (
                <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
                  You have no active tasks assigned. Good job!
                </div>
              ) : (
                <div className="space-y-3">
                  {queueTasks.map((task) => {
                    return (
                      <div
                        key={task._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-xs transition-all gap-3"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] uppercase tracking-wide scale-90">
                              Task
                            </Badge>
                            <span className="text-xs text-[var(--text-secondary)]">•</span>
                            <Badge
                              variant={
                                task.priority === "Critical"
                                  ? "destructive"
                                  : task.priority === "High"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[9px] uppercase tracking-wide scale-90"
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-1">
                            {task.name}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                            Project: <span className="font-semibold text-[var(--text-primary)]">{(task.project as any)?.name || "N/A"}</span> • Current Status:{" "}
                            <span className="font-bold text-[var(--primary-text)]">{task.status}</span>
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {task.status !== "In Progress" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const itemId = task._id; // capture before any async state change
                                setSelectedItemId(itemId);
                                setTrackingType('task');
                                const projId = typeof task.project === 'object' ? (task.project as any)._id : task.project;
                                updateTaskMutation.mutate({
                                  projectId: projId,
                                  taskId: itemId,
                                  data: { status: "In Progress" }
                                }, {
                                  onSuccess: () => {
                                    // Use itemId directly — do NOT rely on selectedItemId state (it's async)
                                    startTimerMutation.mutate(
                                      { taskId: itemId, workType: "In Progress" },
                                      {
                                        onSuccess: () => {
                                          setTime(0);
                                          setIsTicking(true);
                                          localStorage.setItem(`timer_time_${itemId}`, "0");
                                          localStorage.setItem(`timer_ticking_${itemId}`, "true");
                                          localStorage.setItem(`timer_timestamp_${itemId}`, String(Date.now()));
                                          localStorage.setItem(`timer_worktype_${itemId}`, "In Progress");
                                          window.dispatchEvent(new Event("storage"));
                                          toast.success("Timer started for task.");
                                        },
                                        onError: (err: any) => {
                                          toast.error(err?.response?.data?.message || "Failed to start timer.");
                                        },
                                      }
                                    );
                                  }
                                });
                              }}
                              className="bg-[#84cc16] hover:bg-[#76b813] text-white text-[10px] h-8 px-2.5 rounded-lg font-semibold shadow-sm animate-pulse-soft"
                            >
                              Start Work
                            </Button>
                          )}
                          {task.status !== "Done" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const projId = typeof task.project === 'object' ? (task.project as any)._id : task.project;
                                updateTaskMutation.mutate({
                                  projectId: projId,
                                  taskId: task._id,
                                  data: { status: "Done" }
                                }, {
                                  onSuccess: () => {
                                    toast.success("Task marked as Done");
                                  }
                                });
                              }}
                              className="text-[10px] h-8 px-2.5 border-[var(--success)] text-[var(--success)] hover:bg-[rgba(34,197,94,0.05)] rounded-lg"
                            >
                              Mark Done
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
            {activeQueueTab === 'crs' && (
              queueCRs.length === 0 ? (
                <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
                  You have no active CRs assigned. Good job!
                </div>
              ) : (
                <div className="space-y-3">
                  {queueCRs.map((cr) => {
                    return (
                      <div
                        key={cr._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-xs transition-all gap-3"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[9px] uppercase tracking-wide scale-90">
                              CR
                            </Badge>
                            <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">
                              {cr.crNumber}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">•</span>
                            <Badge
                              variant={
                                cr.priority === "Critical"
                                  ? "destructive"
                                  : cr.priority === "High"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[9px] uppercase tracking-wide scale-90"
                            >
                              {cr.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-1">
                            {cr.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                            Project: <span className="font-semibold text-[var(--text-primary)]">{(cr.project as any)?.name || "N/A"}</span> • Current Status:{" "}
                            <span className="font-bold text-[var(--primary-text)]">{cr.status}</span>
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {cr.status !== "In Progress" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const itemId = cr._id; // capture before any async state change
                                setSelectedItemId(itemId);
                                setTrackingType('cr');
                                const projId = typeof cr.project === 'object' ? (cr.project as any)._id : cr.project;
                                updateCRMutation.mutate({
                                  projectId: projId,
                                  crId: itemId,
                                  data: { status: "In Progress" }
                                }, {
                                  onSuccess: () => {
                                    // Use itemId directly — do NOT rely on selectedItemId state (it's async)
                                    startTimerMutation.mutate(
                                      { crId: itemId, workType: "In Progress" },
                                      {
                                        onSuccess: () => {
                                          setTime(0);
                                          setIsTicking(true);
                                          localStorage.setItem(`timer_time_${itemId}`, "0");
                                          localStorage.setItem(`timer_ticking_${itemId}`, "true");
                                          localStorage.setItem(`timer_timestamp_${itemId}`, String(Date.now()));
                                          localStorage.setItem(`timer_worktype_${itemId}`, "In Progress");
                                          window.dispatchEvent(new Event("storage"));
                                          toast.success("Timer started for CR.");
                                        },
                                        onError: (err: any) => {
                                          toast.error(err?.response?.data?.message || "Failed to start timer.");
                                        },
                                      }
                                    );
                                  }
                                });
                              }}
                              className="bg-[#84cc16] hover:bg-[#76b813] text-white text-[10px] h-8 px-2.5 rounded-lg font-semibold shadow-sm animate-pulse-soft"
                            >
                              Start Work
                            </Button>
                          )}
                          {cr.status !== "Done" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const projId = typeof cr.project === 'object' ? (cr.project as any)._id : cr.project;
                                updateCRMutation.mutate({
                                  projectId: projId,
                                  crId: cr._id,
                                  data: { status: "Done" }
                                }, {
                                  onSuccess: () => {
                                    toast.success("CR marked as Done");
                                  }
                                });
                              }}
                              className="text-[10px] h-8 px-2.5 border-[var(--success)] text-[var(--success)] hover:bg-[rgba(34,197,94,0.05)] rounded-lg"
                            >
                              Mark Done
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Stopwatch Engine Widget */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Timer className="h-4.5 w-4.5 text-[var(--primary-text)] animate-pulse-soft" />
              Live Stopwatch Widget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-[var(--background)] rounded-xl border border-[var(--border)] shadow-xs relative overflow-hidden">
              <p className="text-4xl font-mono font-bold text-[var(--text-primary)] tracking-wider">
                {formatStopwatchTime(time)}
              </p>
              {selectedItemObj ? (
                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1.5 truncate max-w-full px-2" title={(selectedItemObj as any).title || (selectedItemObj as any).name}>
                  Tracking: <span className="font-mono text-[var(--primary-text)]">{(selectedItemObj as any).issueId || (selectedItemObj as any).crNumber || "Task"}</span>
                </p>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
                  No active item selected
                </p>
              )}
            </div>

            {/* Select Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Select Work Category
              </Label>
              <select
                value={trackingType}
                disabled={isTicking}
                onChange={(e) => setTrackingType(e.target.value as 'issue' | 'task' | 'cr')}
                className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-60 transition-colors"
              >
                <option value="issue">Issues</option>
                <option value="task">Tasks</option>
                <option value="cr">Change Requests (CRs)</option>
              </select>
            </div>

            {/* Select item */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Select Active {trackingType === 'issue' ? 'Issue' : trackingType === 'task' ? 'Task' : 'CR'}
              </Label>
              <select
                value={selectedItemId}
                disabled={isTicking}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-60 transition-colors"
              >
                <option value="">-- Choose active {trackingType} --</option>
                {trackingType === 'issue' && myActiveIssues.map((issue) => (
                  <option key={issue._id} value={issue._id}>
                    [{issue.issueId}] {issue.title}
                  </option>
                ))}
                {trackingType === 'task' && myActiveTasks.map((task) => (
                  <option key={task._id} value={task._id}>
                    {task.name}
                  </option>
                ))}
                {trackingType === 'cr' && myActiveCRs.map((cr) => (
                  <option key={cr._id} value={cr._id}>
                    [{cr.crNumber}] {cr.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Work Type (Status) */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Status / Work Type
              </Label>
              <select
                value={selectedWorkType}
                disabled={isTicking}
                onChange={(e) => {
                  const newStatus = e.target.value as WorkType;
                  setSelectedWorkType(newStatus);
                  if (selectedItemId) {
                    localStorage.setItem(`timer_worktype_${selectedItemId}`, newStatus);
                    if (trackingType === 'issue') {
                      updateIssueMutation.mutate(
                        { id: selectedItemId, data: { status: newStatus } },
                        {
                          onSuccess: () => toast.success(`Issue status updated to ${newStatus}`),
                          onError: () => toast.error("Failed to update status on server.")
                        }
                      );
                    } else if (trackingType === 'task') {
                      const t = myActiveTasks.find(x => x._id === selectedItemId);
                      if (t) {
                        const projId = typeof t.project === 'object' ? (t.project as any)._id : t.project;
                        updateTaskMutation.mutate(
                          { projectId: projId, taskId: selectedItemId, data: { status: newStatus } },
                          {
                            onSuccess: () => toast.success(`Task status updated to ${newStatus}`),
                            onError: () => toast.error("Failed to update status on server.")
                          }
                        );
                      }
                    } else if (trackingType === 'cr') {
                      const c = myActiveCRs.find(x => x._id === selectedItemId);
                      if (c) {
                        const projId = typeof c.project === 'object' ? (c.project as any)._id : c.project;
                        updateCRMutation.mutate(
                          { projectId: projId, crId: selectedItemId, data: { status: newStatus } },
                          {
                            onSuccess: () => toast.success(`CR status updated to ${newStatus}`),
                            onError: () => toast.error("Failed to update status on server.")
                          }
                        );
                      }
                    }
                  }
                }}
                className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-60 transition-colors"
              >
                {trackingType === 'issue' ? (
                  <>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </>
                ) : trackingType === 'task' ? (
                  <>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </>
                ) : (
                  <>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                    <option value="Closed">Closed</option>
                    <option value="Rejected">Rejected</option>
                  </>
                )}
              </select>
            </div>

            {/* Stopwatch Actions */}
            <div className="flex gap-2">
              {!isTicking ? (
                <Button
                  onClick={handleStartTimer}
                  disabled={!selectedItemId}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Start counting work hours for this ticket (Auto-sets ticket status to In Progress on server)"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Tracker
                </Button>
              ) : (
                <Button
                  onClick={handlePauseTimer}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold transition-all"
                  title="Freeze the active timer clock locally"
                >
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  Pause Tracker
                </Button>
              )}
              <Button
                onClick={handleStopTimerClick}
                disabled={time === 0}
                className="flex items-center justify-center h-10 w-12 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Stop timer & Submit logged hours to timesheet"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
              <Button
                onClick={handleResetTimer}
                disabled={time === 0 || isTicking}
                className="flex items-center justify-center h-10 w-12 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Reset stopwatch and discard current session hours"
              >
                <Undo className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Recent Time Logs */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-[var(--primary-text)]" />
            My Recent Time Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
              No time logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                    <th className="py-2.5 px-3">Item / Ticket ID</th>
                    <th className="py-2.5 px-3">Work Type</th>
                    <th className="py-2.5 px-3">Started Time</th>
                    <th className="py-2.5 px-3">Ended Time</th>
                    <th className="py-2.5 px-3">Duration (hrs)</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => {
                    let code = "N/A";
                    if (log.issue && typeof log.issue === "object") {
                      code = (log.issue as any).issueId;
                    } else if (log.task && typeof log.task === "object") {
                      code = `Task: ${(log.task as any).name.substring(0, 15)}...`;
                    } else if (log.cr && typeof log.cr === "object") {
                      code = (log.cr as any).crNumber;
                    }
                    return (
                      <tr key={log._id} className="border-b border-[var(--border)] hover:bg-[var(--background)]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                          {code}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-[10px] scale-95 font-medium border-[var(--border)] text-[var(--text-secondary)]">
                            {log.workType}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {new Date(log.startTime).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {log.endTime ? new Date(log.endTime).toLocaleTimeString() : <span className="text-emerald-500 font-semibold animate-pulse">Running...</span>}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium">
                          {log.duration.toFixed(2)}h
                        </td>
                        <td className="py-3 px-3 truncate max-w-[180px]" title={log.note}>
                          {log.note || <span className="text-[var(--text-tertiary)] italic">No note</span>}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {new Date(log.startTime).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={log.approved ? "default" : "secondary"}
                            className={`text-[9px] font-bold py-0.5 px-2 ${
                              log.approved
                                ? "bg-[rgba(34,197,94,0.15)] text-[var(--success)] border border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.2)]"
                                : "bg-[rgba(245,158,11,0.15)] text-[var(--warning)] border border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.2)]"
                            }`}
                          >
                            {log.approved ? "Approved" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 4: Resolved Issues History */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-[var(--success)]" />
            Resolved Issues History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myResolvedIssues.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
              No resolved issues in history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                    <th className="py-2.5 px-3">Issue ID</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Time Spent</th>
                    <th className="py-2.5 px-3">Resolved Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myResolvedIssues.map((issue) => {
                    const client = typeof issue.client === "object" ? issue.client : null;
                    const project = typeof issue.project === "object" ? issue.project : null;
                    return (
                      <tr key={issue._id} className="border-b border-[var(--border)] hover:bg-[var(--background)]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[var(--text-primary)] font-mono">
                          {issue.issueId}
                        </td>
                        <td className="py-3 px-3 font-medium text-[var(--text-primary)] truncate max-w-[250px]" title={issue.title}>
                          {issue.title}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {project?.name ?? "N/A"} {client?.code ? `(${client.code})` : ""}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              issue.priority === "Critical"
                                ? "destructive"
                                : issue.priority === "High"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[9px] uppercase tracking-wide scale-90"
                          >
                            {issue.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                          <Clock className="h-3 w-3 inline mr-1 text-[var(--text-tertiary)]" />
                          {issue.totalTimeSpent !== undefined ? `${issue.totalTimeSpent.toFixed(2)}h` : "0.00h"}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {new Date(issue.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="default"
                            className="bg-[rgba(34,197,94,0.15)] text-[var(--success)] border border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.2)] text-[9px] font-bold py-0.5 px-2"
                          >
                            {issue.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stopwatch Submission Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[var(--surface)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
              Complete Time Log Submission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--text-secondary)]">Item</Label>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                [{selectedItemObj ? ((selectedItemObj as any).issueId || (selectedItemObj as any).crNumber || "Task") : ""}] {selectedItemObj ? ((selectedItemObj as any).title || (selectedItemObj as any).name) : ""}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--text-secondary)]">Work Type</Label>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {selectedWorkType}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--text-secondary)]">Tracked Time</Label>
              <p className="text-sm font-mono font-bold text-[var(--primary-text)]">
                {formatStopwatchTime(time)} ({parseFloat((time / 3600).toFixed(2))} hrs)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-medium text-[var(--text-secondary)]">Work Notes</Label>
              <Textarea
                id="note"
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                placeholder="Briefly describe what you worked on..."
                className="text-xs bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)]"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsSubmitOpen(false)}
              className="text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTimeLog}
              disabled={stopTimerMutation.isPending}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs h-9 rounded-lg"
            >
              {stopTimerMutation.isPending ? "Saving..." : "Submit Time Log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <IssueDetailsModal
        issue={detailedIssue}
        open={!!detailedIssue}
        onOpenChange={(open) => !open && setDetailedIssue(null)}
      />
    </div>
  );
}
