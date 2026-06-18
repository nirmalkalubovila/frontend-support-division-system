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

  // Fetch active time logs for current user to track concurrent timers
  const { data: activeLogsData } = useGetTimeLogs({
    user: currentUserId,
    active: true,
  });
  const activeLogs = useMemo(() => activeLogsData?.data ?? [], [activeLogsData]);

  // ──────────────────────────────────────────────────────────────
  // Stopwatch Engine State (Concurrent Multi-timer support)
  // ──────────────────────────────────────────────────────────────
  interface ActiveTimer {
    itemId: string;
    logId: string;
    type: 'issue' | 'task' | 'cr';
    itemObj: any;
    workType: WorkType;
    time: number;
    isTicking: boolean;
  }

  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [itemBeingStopped, setItemBeingStopped] = useState<ActiveTimer | null>(null);

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
      (i) => i.status !== "Resolved" && i.status !== "Closed"
    );
  }, [myAssignedIssues]);

  const myResolvedIssues = useMemo(() => {
    return myAssignedIssues
      .filter((i) => i.status === "Resolved" || i.status === "Closed")
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
    return assignedCRs.filter((c) => c.status !== "Completed" && c.status !== "Closed" && c.status !== "Rejected");
  }, [assignedCRs]);

  const myResolvedCRs = useMemo(() => {
    return assignedCRs.filter((c) => c.status === "Completed" || c.status === "Closed" || c.status === "Rejected");
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
    if (!activeLogs) return;

    const localItemsMap = new Map<string, ActiveTimer>();

    // 1. Populate from activeLogs (database active timers)
    activeLogs.forEach((log) => {
      let itemId = "";
      let type: 'issue' | 'task' | 'cr' = 'issue';
      let itemObj: any = null;

      if (log.issue) {
        itemId = typeof log.issue === 'object' ? log.issue._id : log.issue;
        type = 'issue';
        itemObj = issues.find(i => i._id === itemId) || log.issue;
      } else if (log.task) {
        itemId = typeof log.task === 'object' ? log.task._id : log.task;
        type = 'task';
        itemObj = assignedTasks.find(t => t._id === itemId) || log.task;
      } else if (log.cr) {
        itemId = typeof log.cr === 'object' ? log.cr._id : log.cr;
        type = 'cr';
        itemObj = assignedCRs.find(c => c._id === itemId) || log.cr;
      }

      if (!itemId) return;

      const savedTimeStr = localStorage.getItem(`timer_time_${itemId}`);
      const savedTickingStr = localStorage.getItem(`timer_ticking_${itemId}`);
      const savedTimestampStr = localStorage.getItem(`timer_timestamp_${itemId}`);
      const savedWorkType = (localStorage.getItem(`timer_worktype_${itemId}`) || log.workType) as WorkType;

      let currentTime = 0;
      let isTicking = true;

      if (savedTickingStr === "false") {
        isTicking = false;
        currentTime = savedTimeStr ? parseInt(savedTimeStr, 10) : 0;
      } else if (savedTimestampStr) {
        const elapsed = Math.floor((Date.now() - parseInt(savedTimestampStr, 10)) / 1000);
        currentTime = (savedTimeStr ? parseInt(savedTimeStr, 10) : 0) + elapsed;
      } else {
        const dbStart = new Date(log.startTime).getTime();
        currentTime = Math.floor((Date.now() - dbStart) / 1000);
        if (currentTime < 0) currentTime = 0;
        localStorage.setItem(`timer_time_${itemId}`, String(currentTime));
        localStorage.setItem(`timer_ticking_${itemId}`, "true");
        localStorage.setItem(`timer_timestamp_${itemId}`, String(Date.now()));
        localStorage.setItem(`timer_worktype_${itemId}`, log.workType);
      }

      localItemsMap.set(itemId, {
        itemId,
        logId: log._id,
        type,
        itemObj,
        workType: savedWorkType,
        time: currentTime,
        isTicking,
      });
    });

    // 2. Scan localStorage for any other timers (paused locally)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("timer_time_")) {
        const itemId = key.replace("timer_time_", "");
        if (localItemsMap.has(itemId)) continue; // already added from activeLogs

        let type: 'issue' | 'task' | 'cr' = 'issue';
        let itemObj: any = issues.find(x => x._id === itemId);
        if (!itemObj) {
          itemObj = assignedTasks.find(x => x._id === itemId);
          type = 'task';
        }
        if (!itemObj) {
          itemObj = assignedCRs.find(x => x._id === itemId);
          type = 'cr';
        }

        if (itemObj) {
          const savedTimeStr = localStorage.getItem(`timer_time_${itemId}`);
          const savedTickingStr = localStorage.getItem(`timer_ticking_${itemId}`);
          const savedTimestampStr = localStorage.getItem(`timer_timestamp_${itemId}`);
          const savedWorkType = (localStorage.getItem(`timer_worktype_${itemId}`) || 
            (type === 'cr' ? 'In Development' : 'In Progress')) as WorkType;

          let currentTime = savedTimeStr ? parseInt(savedTimeStr, 10) : 0;
          let isTicking = savedTickingStr === "true";

          if (isTicking && savedTimestampStr) {
            const elapsed = Math.floor((Date.now() - parseInt(savedTimestampStr, 10)) / 1000);
            currentTime += elapsed;
          }

          localItemsMap.set(itemId, {
            itemId,
            logId: `local-${itemId}`,
            type,
            itemObj,
            workType: savedWorkType,
            time: currentTime,
            isTicking,
          });
        }
      }
    }

    setActiveTimers(Array.from(localItemsMap.values()));
  }, [activeLogs, issues, assignedTasks, assignedCRs]);

  // Concurrent ticking for active timers
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const hasTicking = activeTimers.some((t) => t.isTicking);

    if (hasTicking) {
      interval = setInterval(() => {
        setActiveTimers((prevTimers) =>
          prevTimers.map((t) => {
            if (!t.isTicking) return t;

            const newTime = t.time + 1;
            localStorage.setItem(`timer_time_${t.itemId}`, String(newTime));
            localStorage.setItem(`timer_timestamp_${t.itemId}`, String(Date.now()));

            if (t.type === 'issue' && newTime % 10 === 0 && t.itemObj) {
              const estH = t.itemObj.estimatedHours || 0;
              if (estH > 0 && newTime > estH * 3600) {
                const notifiedKey = `timer_exceeded_notified_${t.itemId}`;
                if (!localStorage.getItem(notifiedKey)) {
                  localStorage.setItem(notifiedKey, "true");
                  notifyTimeExceededMutation.mutate({
                    issueId: t.itemId,
                    activeDuration: newTime,
                  });
                }
              }
            }

            return { ...t, time: newTime };
          })
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimers.some((t) => t.isTicking), notifyTimeExceededMutation]);

  // Synchronize state from websocket events (stored in localStorage)
  useEffect(() => {
    const handleTimerSync = () => {
      setActiveTimers((prev) =>
        prev.map((t) => {
          const savedTimeStr = localStorage.getItem(`timer_time_${t.itemId}`);
          const savedTickingStr = localStorage.getItem(`timer_ticking_${t.itemId}`);
          const savedTimestampStr = localStorage.getItem(`timer_timestamp_${t.itemId}`);
          const savedWorkType = (localStorage.getItem(`timer_worktype_${t.itemId}`) || t.workType) as WorkType;

          let currentTime = t.time;
          let isTicking = t.isTicking;

          if (savedTickingStr === "false") {
            isTicking = false;
            currentTime = savedTimeStr ? parseInt(savedTimeStr, 10) : 0;
          } else if (savedTimestampStr) {
            isTicking = true;
            const elapsed = Math.floor((Date.now() - parseInt(savedTimestampStr, 10)) / 1000);
            currentTime = (savedTimeStr ? parseInt(savedTimeStr, 10) : 0) + elapsed;
          }

          return {
            ...t,
            workType: savedWorkType,
            time: currentTime,
            isTicking,
          };
        })
      );
    };

    window.addEventListener("local-timer-update", handleTimerSync);
    return () => {
      window.removeEventListener("local-timer-update", handleTimerSync);
    };
  }, []);

  // Filter out issues/tasks/CRs that already have active timers from the dropdown selectors
  const filteredActiveIssues = useMemo(() => {
    return myActiveIssues.filter(
      (issue) => !activeTimers.some((t) => t.itemId === issue._id)
    );
  }, [myActiveIssues, activeTimers]);

  const filteredActiveTasks = useMemo(() => {
    return myActiveTasks.filter(
      (task) => !activeTimers.some((t) => t.itemId === task._id)
    );
  }, [myActiveTasks, activeTimers]);

  const filteredActiveCRs = useMemo(() => {
    return myActiveCRs.filter(
      (cr) => !activeTimers.some((t) => t.itemId === cr._id)
    );
  }, [myActiveCRs, activeTimers]);

  // Auto-select active item when category changes
  useEffect(() => {
    if (trackingType === 'issue') {
      if (filteredActiveIssues.length > 0 && !filteredActiveIssues.some(i => i._id === selectedItemId)) {
        setSelectedItemId(filteredActiveIssues[0]._id);
      } else if (filteredActiveIssues.length === 0) {
        setSelectedItemId("");
      }
    } else if (trackingType === 'task') {
      if (filteredActiveTasks.length > 0 && !filteredActiveTasks.some(t => t._id === selectedItemId)) {
        setSelectedItemId(filteredActiveTasks[0]._id);
      } else if (filteredActiveTasks.length === 0) {
        setSelectedItemId("");
      }
    } else if (trackingType === 'cr') {
      if (filteredActiveCRs.length > 0 && !filteredActiveCRs.some(c => c._id === selectedItemId)) {
        setSelectedItemId(filteredActiveCRs[0]._id);
      } else if (filteredActiveCRs.length === 0) {
        setSelectedItemId("");
      }
    }
  }, [trackingType, filteredActiveIssues, filteredActiveTasks, filteredActiveCRs]);

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

  const handlePauseTimerForItem = (itemId: string) => {
    localStorage.setItem(`timer_ticking_${itemId}`, "false");
    localStorage.removeItem(`timer_timestamp_${itemId}`);
    window.dispatchEvent(new Event("storage"));

    setActiveTimers((prev) =>
      prev.map((t) => (t.itemId === itemId ? { ...t, isTicking: false } : t))
    );

    // Broadcast via WebSockets
    if ((window as any).globalSocket) {
      (window as any).globalSocket.emit("timer:pause", {
        itemId,
        time: localStorage.getItem(`timer_time_${itemId}`) ? parseInt(localStorage.getItem(`timer_time_${itemId}`)!, 10) : 0
      });
    }

    toast.info("Timer paused locally.");
  };

  const handleResumeTimerForItem = (itemId: string, type: 'issue' | 'task' | 'cr', workType: WorkType) => {
    localStorage.setItem(`timer_ticking_${itemId}`, "true");
    localStorage.setItem(`timer_timestamp_${itemId}`, String(Date.now()));
    window.dispatchEvent(new Event("storage"));

    setActiveTimers((prev) =>
      prev.map((t) => (t.itemId === itemId ? { ...t, isTicking: true } : t))
    );

    // Broadcast via WebSockets
    if ((window as any).globalSocket) {
      (window as any).globalSocket.emit("timer:resume", { itemId, timestamp: Date.now() });
    }

    toast.success("Timer resumed locally.");
  };

  const handleStopTimerForItem = (t: ActiveTimer) => {
    setItemBeingStopped(t);
    setSubmitNote("");

    // If it's a local-only paused timer (no active log on the backend)
    if (t.logId.startsWith("local-")) {
      const itemId = t.itemId;
      localStorage.removeItem(`timer_time_${itemId}`);
      localStorage.removeItem(`timer_ticking_${itemId}`);
      localStorage.removeItem(`timer_timestamp_${itemId}`);
      localStorage.removeItem(`timer_worktype_${itemId}`);
      localStorage.removeItem(`timer_exceeded_notified_${itemId}`);
      window.dispatchEvent(new Event("storage"));
      setActiveTimers((prev) => prev.filter((x) => x.itemId !== itemId));
      toast.info("Tracker closed. Session time was already saved.");
      setItemBeingStopped(null);
      return;
    }

    setIsSubmitOpen(true);
  };

  const handleResetTimerForItem = (itemId: string) => {
    localStorage.setItem(`timer_time_${itemId}`, "0");
    localStorage.setItem(`timer_ticking_${itemId}`, "false");
    localStorage.removeItem(`timer_timestamp_${itemId}`);
    localStorage.removeItem(`timer_exceeded_notified_${itemId}`);
    window.dispatchEvent(new Event("storage"));

    setActiveTimers((prev) =>
      prev.map((t) => (t.itemId === itemId ? { ...t, time: 0, isTicking: false } : t))
    );
    toast.info("Timer reset.");
  };

  const handleSaveTimeLog = () => {
    if (!itemBeingStopped) return;

    const itemId = itemBeingStopped.itemId;
    const savedTimeStr = localStorage.getItem(`timer_time_${itemId}`);
    let activeDuration = savedTimeStr ? parseInt(savedTimeStr, 10) : 0;

    const savedTickingStr = localStorage.getItem(`timer_ticking_${itemId}`);
    const savedTimestampStr = localStorage.getItem(`timer_timestamp_${itemId}`);
    if (savedTickingStr === "true" && savedTimestampStr) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestampStr, 10)) / 1000);
      activeDuration += elapsed;
    }

    const stopPayload = {
      issueId: itemBeingStopped.type === 'issue' ? itemId : null,
      taskId: itemBeingStopped.type === 'task' ? itemId : null,
      crId: itemBeingStopped.type === 'cr' ? itemId : null,
      note: submitNote,
      activeDuration,
    };

    stopTimerMutation.mutate(
      stopPayload,
      {
        onSuccess: () => {
          const itemId = itemBeingStopped.itemId;
          localStorage.removeItem(`timer_time_${itemId}`);
          localStorage.removeItem(`timer_ticking_${itemId}`);
          localStorage.removeItem(`timer_timestamp_${itemId}`);
          localStorage.removeItem(`timer_worktype_${itemId}`);
          localStorage.removeItem(`timer_exceeded_notified_${itemId}`);
          window.dispatchEvent(new Event("storage"));
          setIsSubmitOpen(false);
          setItemBeingStopped(null);
          refetchLogs();
          toast.success("Time log submitted successfully.");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to stop timer on server.";
          toast.error(msg);
          if (err?.response?.status === 400 && msg.includes("discarded")) {
            const itemId = itemBeingStopped.itemId;
            localStorage.removeItem(`timer_time_${itemId}`);
            localStorage.removeItem(`timer_ticking_${itemId}`);
            localStorage.removeItem(`timer_timestamp_${itemId}`);
            localStorage.removeItem(`timer_worktype_${itemId}`);
            localStorage.removeItem(`timer_exceeded_notified_${itemId}`);
            window.dispatchEvent(new Event("storage"));
            setIsSubmitOpen(false);
            setItemBeingStopped(null);
          }
        },
      }
    );
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
        ["Resolved", "Closed"].includes(i.status) &&
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
                    const activeTimer = activeTimers.find(t => t.itemId === issue._id);
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
                            {activeTimer && (
                              <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ml-1 animate-pulse-soft">
                                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                                {formatStopwatchTime(activeTimer.time)}
                              </div>
                            )}
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
                              onClick={() => handleUpdateStatus(issue._id, "Testing")}
                              className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-[10px] h-8 px-2.5 rounded-lg"
                              title="Submit this ticket to your manager for review"
                            >
                              Send to Testing
                            </Button>
                          )}
                          {issue.status !== "Resolved" && issue.status !== "Testing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(issue._id, "Resolved")}
                              className="text-[10px] h-8 px-2.5 border-[var(--success)] text-[var(--success)] hover:bg-[rgba(34,197,94,0.05)] rounded-lg"
                              title="Mark this ticket as successfully resolved"
                            >
                              Mark Resolved
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
                    const activeTimer = activeTimers.find(t => t.itemId === task._id);
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
                            {activeTimer && (
                              <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ml-1 animate-pulse-soft">
                                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                                {formatStopwatchTime(activeTimer.time)}
                              </div>
                            )}
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
                    const activeTimer = activeTimers.find(t => t.itemId === cr._id);
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
                            {activeTimer && (
                              <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ml-1 animate-pulse-soft">
                                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                                {formatStopwatchTime(activeTimer.time)}
                              </div>
                            )}
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
                          {cr.status !== "In Development" && (
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
                                  data: { status: "In Development" }
                                }, {
                                  onSuccess: () => {
                                    // Use itemId directly — do NOT rely on selectedItemId state (it's async)
                                    startTimerMutation.mutate(
                                      { crId: itemId, workType: "In Development" },
                                      {
                                        onSuccess: () => {
                                          setTime(0);
                                          setIsTicking(true);
                                          localStorage.setItem(`timer_time_${itemId}`, "0");
                                          localStorage.setItem(`timer_ticking_${itemId}`, "true");
                                          localStorage.setItem(`timer_timestamp_${itemId}`, String(Date.now()));
                                          localStorage.setItem(`timer_worktype_${itemId}`, "In Development");
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
                          {cr.status !== "Completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const projId = typeof cr.project === 'object' ? (cr.project as any)._id : cr.project;
                                updateCRMutation.mutate({
                                  projectId: projId,
                                  crId: cr._id,
                                  data: { status: "Completed" }
                                }, {
                                  onSuccess: () => {
                                    toast.success("CR marked as Completed");
                                  }
                                });
                              }}
                              className="text-[10px] h-8 px-2.5 border-[var(--success)] text-[var(--success)] hover:bg-[rgba(34,197,94,0.05)] rounded-lg"
                            >
                              Mark Completed
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
              Live Stopwatch Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Active Sessions List */}
            <div className="space-y-2.5">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Active Tracking Sessions ({activeTimers.length})
              </Label>
              {activeTimers.length === 0 ? (
                <div className="text-center py-4 bg-[var(--background)] rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--text-tertiary)]">
                  No active running timers.
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {activeTimers.map((t) => {
                    let code = "Task";
                    let title = "Task";
                    if (t.type === 'issue' && t.itemObj) {
                      code = t.itemObj.issueId || "Issue";
                      title = t.itemObj.title || "";
                    } else if (t.type === 'task' && t.itemObj) {
                      code = "Task";
                      title = t.itemObj.name || "";
                    } else if (t.type === 'cr' && t.itemObj) {
                      code = t.itemObj.crNumber || "CR";
                      title = t.itemObj.title || "";
                    }

                    return (
                      <div key={t.logId} className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border)] shadow-xs relative overflow-hidden transition-all hover:border-[var(--border-hover)]">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {t.isTicking ? (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                              )}
                              <span className="text-xs font-mono font-bold text-[var(--primary-text)] uppercase tracking-wide truncate">
                                {code}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[var(--text-primary)] truncate mt-0.5" title={title}>
                              {title}
                            </p>
                            <p className="text-[10px] text-[var(--text-secondary)]">
                              Status: <span className="font-semibold text-[var(--primary-text)]">{t.workType}</span>
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-mono font-bold text-[var(--text-primary)] tracking-wider">
                              {formatStopwatchTime(t.time)}
                            </p>
                            <div className="flex gap-1.5 mt-1 justify-end">
                              {t.isTicking ? (
                                <Button
                                  size="sm"
                                  onClick={() => handlePauseTimerForItem(t.itemId)}
                                  className="h-6 w-6 p-0 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center"
                                  title="Pause timer locally"
                                >
                                  <Pause className="h-3 w-3 fill-current" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleResumeTimerForItem(t.itemId, t.type, t.workType)}
                                  className="h-6 w-6 p-0 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
                                  title="Resume timer"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleStopTimerForItem(t)}
                                className="h-6 w-6 p-0 rounded-md bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center"
                                title="Stop and Submit Log"
                              >
                                <Square className="h-2.5 w-2.5 fill-current" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetTimerForItem(t.itemId)}
                                className="h-6 w-6 p-0 rounded-md border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] flex items-center justify-center"
                                title="Reset timer value"
                              >
                                <Undo className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr className="border-[var(--border)] my-2" />

            {/* Start a New Tracker */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                Start a New Tracker
              </Label>
              
              {/* Select Type Selector */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Select Work Category
                </Label>
                <select
                  value={trackingType}
                  onChange={(e) => setTrackingType(e.target.value as 'issue' | 'task' | 'cr')}
                  className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
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
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                >
                  <option value="">-- Choose active {trackingType} --</option>
                  {trackingType === 'issue' && filteredActiveIssues.map((issue) => (
                    <option key={issue._id} value={issue._id}>
                      [{issue.issueId}] {issue.title}
                    </option>
                  ))}
                  {trackingType === 'task' && filteredActiveTasks.map((task) => (
                    <option key={task._id} value={task._id}>
                      {task.name}
                    </option>
                  ))}
                  {trackingType === 'cr' && filteredActiveCRs.map((cr) => (
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
                  onChange={(e) => {
                    const newStatus = e.target.value as WorkType;
                    setSelectedWorkType(newStatus);
                  }}
                  className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                >
                  {trackingType === 'issue' ? (
                    <>
                      <option value="Backlog">Backlog</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Planned Solution">Planned Solution</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Testing">Testing</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Reopened">Reopened</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Pending Client">Pending Client</option>
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
                      <option value="Submitted">Submitted</option>
                      <option value="In Development">In Development</option>
                      <option value="Testing">Testing</option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                    </>
                  )}
                </select>
              </div>

              <Button
                onClick={handleStartTimer}
                disabled={!selectedItemId || startTimerMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 h-10 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Start counting work hours for this ticket"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {startTimerMutation.isPending ? "Starting..." : "Start Tracker"}
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
      <Dialog open={isSubmitOpen} onOpenChange={(open) => {
        setIsSubmitOpen(open);
        if (!open) setItemBeingStopped(null);
      }}>
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
                {itemBeingStopped ? (
                  <>
                    [{itemBeingStopped.type === 'issue' && itemBeingStopped.itemObj
                      ? itemBeingStopped.itemObj.issueId
                      : itemBeingStopped.type === 'cr' && itemBeingStopped.itemObj
                      ? itemBeingStopped.itemObj.crNumber
                      : "Task"}] {itemBeingStopped.itemObj
                      ? (itemBeingStopped.itemObj.title || itemBeingStopped.itemObj.name)
                      : ""}
                  </>
                ) : ""}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--text-secondary)]">Work Type</Label>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {itemBeingStopped?.workType}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--text-secondary)]">Tracked Time</Label>
              <p className="text-sm font-mono font-bold text-[var(--primary-text)]">
                {itemBeingStopped ? (
                  <>
                    {formatStopwatchTime(itemBeingStopped.time)} ({parseFloat((itemBeingStopped.time / 3600).toFixed(2))} hrs)
                  </>
                ) : ""}
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
              onClick={() => {
                setIsSubmitOpen(false);
                setItemBeingStopped(null);
              }}
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
