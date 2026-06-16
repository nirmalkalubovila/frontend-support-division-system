"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatCard } from "@/components/atoms/statCard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  useGetTimeLogs,
  useStartTimer,
  useStopTimer,
  useCreateManualLog,
  type WorkType,
} from "@/api/services/time-tracking/time-log-service";
import { useUpdateIssue, type Issue } from "@/api/services/issue-management/issue-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_COLOR_CLASSES: Record<string, string> = {
  Backlog: "text-[var(--status-backlog)]",
  Assigned: "text-[var(--status-assigned)]",
  "Planned Solution": "text-[var(--status-planned)]",
  "In Progress": "text-[var(--status-in-progress)]",
  Testing: "text-[var(--status-testing)]",
  "On Hold": "text-[var(--status-on-hold)]",
  "Pending Client": "text-[var(--status-pending-client)]",
  Resolved: "text-[var(--status-resolved)]",
  Closed: "text-[var(--status-closed)]",
  Reopened: "text-[var(--status-reopened)]",
};

interface EngineerDashboardProps {
  issues: Issue[];
  currentUserId: string;
}

export function EngineerDashboard({ issues, currentUserId }: EngineerDashboardProps) {
  const updateIssueMutation = useUpdateIssue();
  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();

  // Fetch recent time logs for current user
  const { data: logsData, refetch: refetchLogs } = useGetTimeLogs({
    user: currentUserId,
    limit: 10,
    sortBy: "createdAt:desc",
  });

  const recentLogs = useMemo(() => logsData?.data ?? [], [logsData]);

  // ──────────────────────────────────────────────────────────────
  // Stopwatch Engine State
  // ──────────────────────────────────────────────────────────────
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType>("Development");
  const [time, setTime] = useState<number>(0);
  const [isTicking, setIsTicking] = useState<boolean>(false);
  
  // Submit modal state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitNote, setSubmitNote] = useState("");

  // Filter issues assigned to this engineer
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

  const selectedIssueObj = useMemo(() => {
    return issues.find((i) => i._id === selectedIssueId);
  }, [issues, selectedIssueId]);

  // Sync timer state on select issue change or storage event
  useEffect(() => {
    const syncTimer = () => {
      if (!selectedIssueId) {
        setTime(0);
        setIsTicking(false);
        return;
      }

      const savedTime = localStorage.getItem(`issue_timer_${selectedIssueId}`);
      const savedTicking = localStorage.getItem(`issue_timer_ticking_${selectedIssueId}`);
      const savedTimestamp = localStorage.getItem(`issue_timer_timestamp_${selectedIssueId}`);
      const savedWorkType = localStorage.getItem(`issue_timer_worktype_${selectedIssueId}`) as WorkType;

      if (savedWorkType) {
        setSelectedWorkType(savedWorkType);
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
  }, [selectedIssueId]);

  // Tick the timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTicking && selectedIssueId) {
      interval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(`issue_timer_${selectedIssueId}`, String(newTime));
          localStorage.setItem(`issue_timer_timestamp_${selectedIssueId}`, String(Date.now()));
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTicking, selectedIssueId]);

  // Auto-select first active issue if not selected
  useEffect(() => {
    if (myActiveIssues.length > 0 && !selectedIssueId) {
      setSelectedIssueId(myActiveIssues[0]._id);
    }
  }, [myActiveIssues, selectedIssueId]);

  // ──────────────────────────────────────────────────────────────
  // Stopwatch Actions
  // ──────────────────────────────────────────────────────────────
  const handleStartTimer = () => {
    if (!selectedIssueId) return;

    // Trigger backend start
    startTimerMutation.mutate(
      {
        issueId: selectedIssueId,
        workType: selectedWorkType,
      },
      {
        onSuccess: () => {
          setIsTicking(true);
          localStorage.setItem(`issue_timer_ticking_${selectedIssueId}`, "true");
          localStorage.setItem(`issue_timer_timestamp_${selectedIssueId}`, String(Date.now()));
          localStorage.setItem(`issue_timer_worktype_${selectedIssueId}`, selectedWorkType);
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
    if (!selectedIssueId) return;
    setIsTicking(false);
    localStorage.setItem(`issue_timer_ticking_${selectedIssueId}`, "false");
    localStorage.removeItem(`issue_timer_timestamp_${selectedIssueId}`);
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
    if (!selectedIssueId) return;

    stopTimerMutation.mutate(
      {
        issueId: selectedIssueId,
        note: submitNote,
      },
      {
        onSuccess: () => {
          setIsTicking(false);
          setTime(0);
          localStorage.removeItem(`issue_timer_${selectedIssueId}`);
          localStorage.removeItem(`issue_timer_ticking_${selectedIssueId}`);
          localStorage.removeItem(`issue_timer_timestamp_${selectedIssueId}`);
          localStorage.removeItem(`issue_timer_worktype_${selectedIssueId}`);
          window.dispatchEvent(new Event("storage"));
          setIsSubmitOpen(false);
          refetchLogs();
          toast.success("Time log submitted successfully.");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to stop timer on server.";
          toast.error(msg);
          // If the backend threw an error (e.g. less than 5 mins and discarded), clear locally
          if (err?.response?.status === 400 && msg.includes("discarded")) {
            setIsTicking(false);
            setTime(0);
            localStorage.removeItem(`issue_timer_${selectedIssueId}`);
            localStorage.removeItem(`issue_timer_ticking_${selectedIssueId}`);
            localStorage.removeItem(`issue_timer_timestamp_${selectedIssueId}`);
            localStorage.removeItem(`issue_timer_worktype_${selectedIssueId}`);
            window.dispatchEvent(new Event("storage"));
            setIsSubmitOpen(false);
          }
        },
      }
    );
  };

  const handleResetTimer = () => {
    if (!selectedIssueId) return;
    setIsTicking(false);
    setTime(0);
    localStorage.removeItem(`issue_timer_${selectedIssueId}`);
    localStorage.removeItem(`issue_timer_ticking_${selectedIssueId}`);
    localStorage.removeItem(`issue_timer_timestamp_${selectedIssueId}`);
    localStorage.removeItem(`issue_timer_worktype_${selectedIssueId}`);
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

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="My Open Issues"
          value={kpis.openCount}
          trend="Currently active"
          trendClassName="text-[var(--flat-peter-river)]"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={Clock}
          label="Hours Logged Today"
          value={kpis.hoursToday}
          trend="Target: 8.0h"
          trendClassName="text-[var(--flat-emerald)]"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved (7d)"
          value={kpis.resolvedThisWeek}
          trend="Resolved tickets"
          trendClassName="text-[var(--flat-emerald)]"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={AlertTriangle}
          label="Next SLA Deadline"
          value={kpis.nextDeadlineStr}
          trend="Earliest due task"
          trendClassName={kpis.nextDeadlineStr.includes("Overdue") ? "text-[var(--flat-alizarin)]" : "text-[var(--flat-carrot)]"}
          className="hover:scale-[1.01] transition-transform duration-200"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Queue */}
        <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-[var(--primary-text)] animate-pulse-soft" />
              Focus Queue (Priority & Urgency Sorted)
            </CardTitle>
            <Link href="/issues" className="text-xs text-[var(--primary-text)] hover:underline flex items-center gap-0.5">
              Board View <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {myActiveIssues.length === 0 ? (
              <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
                You have no active issues assigned. Good job!
              </div>
            ) : (
              <div className="space-y-3">
                {myActiveIssues
                  .sort((a, b) => {
                    const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
                    return (
                      (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
                    );
                  })
                  .map((issue) => {
                    const client = typeof issue.client === "object" ? issue.client : null;
                    return (
                      <div
                        key={issue._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-xs transition-all gap-3"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
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
                            <span className={cn("font-bold", STATUS_COLOR_CLASSES[issue.status] || "text-[var(--text-primary)]")}>
                              {issue.status}
                            </span>
                          </p>
                        </div>
                        {/* Quick Action transitions */}
                        <div className="flex gap-1.5 shrink-0">
                          {issue.status !== "In Progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(issue._id, "In Progress")}
                              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[10px] h-8 px-2.5 rounded-lg"
                              title="Set ticket status to In Progress (signals you are working on this, but does NOT start stopwatch hours)"
                            >
                              Start Work
                            </Button>
                          )}
                          {issue.status === "In Progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(issue._id, "Testing")}
                              className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-[10px] h-8 px-2.5 rounded-lg"
                              title="Submit this ticket to your manager for quality review/testing"
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
              {selectedIssueObj ? (
                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1.5 truncate max-w-full px-2" title={selectedIssueObj.title}>
                  Tracking: <span className="font-mono text-[var(--flat-wisteria)]">{selectedIssueObj.issueId}</span>
                </p>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
                  No active task selected
                </p>
              )}
            </div>

            {/* Select ticket */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Select Active Ticket
              </Label>
              <select
                value={selectedIssueId}
                disabled={isTicking}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-60 transition-colors"
              >
                <option value="">-- Choose active issue --</option>
                {myActiveIssues.map((issue) => (
                  <option key={issue._id} value={issue._id}>
                    [{issue.issueId}] {issue.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Work Type */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Work Type
              </Label>
              <select
                value={selectedWorkType}
                disabled={isTicking}
                onChange={(e) => setSelectedWorkType(e.target.value as WorkType)}
                className="w-full text-xs h-9.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-60 transition-colors"
              >
                <option value="Investigation">Investigation</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Communication">Communication</option>
                <option value="Documentation">Documentation</option>
                <option value="Deployment">Deployment</option>
              </select>
            </div>

            {/* Stopwatch Actions */}
            <div className="flex gap-2">
              {!isTicking ? (
                <Button
                  onClick={handleStartTimer}
                  disabled={!selectedIssueId}
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
                    <th className="py-2.5 px-3">Issue ID</th>
                    <th className="py-2.5 px-3">Work Type</th>
                    <th className="py-2.5 px-3">Duration (hrs)</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => {
                    const issueCode = typeof log.issue === "object" && log.issue !== null
                      ? log.issue.issueId
                      : "N/A";
                    return (
                      <tr key={log._id} className="border-b border-[var(--border)] hover:bg-[var(--background)]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                          {issueCode}
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
              <Label className="text-xs font-medium text-[var(--text-secondary)]">Ticket</Label>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                [{selectedIssueObj?.issueId}] {selectedIssueObj?.title}
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
              <p className="text-sm font-mono font-bold text-[var(--flat-wisteria)]">
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
    </div>
  );
}
