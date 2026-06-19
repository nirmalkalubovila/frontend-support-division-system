"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardCheck,
  Plus,
  Ticket,
  UserCheck,
  Users,
  CheckCircle2,
  HelpCircle,
  History,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatCard } from "@/components/atoms/statCard";
import { useUpdateIssue, type Issue } from "@/api/services/issue-management/issue-service";
import { useGetAllTasks, type Task } from "@/api/services/project-management/task-service";
import { useGetAllCRs, type ChangeRequest } from "@/api/services/project-management/cr-service";
import type { UserInfo } from "@/types/global-types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SeniorLeadDashboardProps {
  issues: Issue[];
  users: UserInfo[];
  currentUserId: string;
}

export function SeniorLeadDashboard({ issues, users, currentUserId }: SeniorLeadDashboardProps) {
  const queryClient = useQueryClient();
  const updateIssueMutation = useUpdateIssue();

  // Fetch all tasks & CRs
  const { data: allTasksData, refetch: refetchAllTasks } = useGetAllTasks();
  const { data: allCRsData, refetch: refetchAllCRs } = useGetAllCRs();

  const allTasks = useMemo(() => allTasksData ?? [], [allTasksData]);
  const allCRs = useMemo(() => allCRsData ?? [], [allCRsData]);

  // Task & CR Update Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async ({ projectId, taskId, data }: { projectId: string; taskId: string; data: any }) => {
      const res = await axiosInstance.patch(`/projects/${projectId}/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/tasks/all"] });
      refetchAllTasks();
    }
  });

  const updateCRMutation = useMutation({
    mutationFn: async ({ projectId, crId, data }: { projectId: string; crId: string; data: any }) => {
      const res = await axiosInstance.patch(`/projects/${projectId}/crs/${crId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/crs/all"] });
      refetchAllCRs();
    }
  });

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [itemToReject, setItemToReject] = useState<{ id: string; type: 'issue' | 'task' | 'cr'; projectId?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Filter staff engineers
  const engineersList = useMemo(() => {
    return users.filter((u) => u.role === "engineer" || u.role === "senior_engineer" || u.role === "intern");
  }, [users]);

  // ──────────────────────────────────────────────────────────────
  // Metrics & Calculations
  // ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const activeIssues = issues.filter(
      (i) => i.status !== "Resolved" && i.status !== "Closed" && i.status !== "Done"
    );

    const unassigned = activeIssues.filter((i) => !i.assignedTo).length;

    const escalations = activeIssues.filter(
      (i) => i.priority === "Critical"
    ).length;

    // Unified verification queue count
    const issueReviewCount = issues.filter(
      (i) => i.status === "Review" && i.submittedForReview === true
    ).length;
    const taskReviewCount = allTasks.filter(
      (t) => t.status === "Review" && t.submittedForReview === true
    ).length;
    const crReviewCount = allCRs.filter(
      (c) => c.status === "Review" && c.submittedForReview === true
    ).length;
    const verificationQueueCount = issueReviewCount + taskReviewCount + crReviewCount;

    const myAssigned = activeIssues.filter((i) => {
      if (typeof i.assignedTo === "object" && i.assignedTo !== null) {
        return i.assignedTo._id === currentUserId;
      }
      return i.assignedTo === currentUserId;
    }).length;

    return {
      unassigned,
      escalations,
      verificationQueueCount,
      myAssigned,
    };
  }, [issues, allTasks, allCRs, currentUserId]);

  // ──────────────────────────────────────────────────────────────
  // Triage: Oldest Unassigned Issues
  // ──────────────────────────────────────────────────────────────
  const triageQueue = useMemo(() => {
    return issues
      .filter((i) => !i.assignedTo && !["Resolved", "Closed", "Done"].includes(i.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5);
  }, [issues]);

  // ──────────────────────────────────────────────────────────────
  // Unified Verification Queue: items with submittedForReview === true
  // ──────────────────────────────────────────────────────────────
  const verificationQueue = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'issue' | 'task' | 'cr';
      title: string;
      code: string;
      priority: string;
      projectId?: string;
      assigneeName: string;
      technicalApproach?: string | null;
      isReopened?: boolean;
    }> = [];

    // Issues
    issues.forEach((i) => {
      if (i.status === "Review" && i.submittedForReview === true) {
        const assignee = typeof i.assignedTo === "object" && i.assignedTo !== null ? i.assignedTo.name : "Unassigned";
        list.push({
          id: i._id,
          type: 'issue',
          title: i.title,
          code: i.issueId,
          priority: i.priority,
          assigneeName: assignee,
          technicalApproach: i.technicalApproach,
          isReopened: i.isReopened,
        });
      }
    });

    // Tasks
    allTasks.forEach((t) => {
      if (t.status === "Review" && t.submittedForReview === true) {
        const projId = typeof t.project === "object" && t.project ? (t.project as any)._id : t.project;
        const firstAssignee = t.assignees && t.assignees.length > 0 ? t.assignees[0].name : "Unassigned";
        list.push({
          id: t._id,
          type: 'task',
          title: t.name,
          code: "Task",
          priority: t.priority,
          projectId: projId,
          assigneeName: firstAssignee,
          isReopened: t.isReopened,
        });
      }
    });

    // CRs
    allCRs.forEach((c) => {
      if (c.status === "Review" && c.submittedForReview === true) {
        const projId = typeof c.project === "object" && c.project ? (c.project as any)._id : c.project;
        const firstDev = c.assignedDevelopers && c.assignedDevelopers.length > 0 ? c.assignedDevelopers[0].name : "Unassigned";
        list.push({
          id: c._id,
          type: 'cr',
          title: c.title,
          code: c.crNumber || "CR",
          priority: c.priority,
          projectId: projId,
          assigneeName: firstDev,
          technicalApproach: c.technicalApproach,
          isReopened: c.isReopened,
        });
      }
    });

    return list;
  }, [issues, allTasks, allCRs]);

  const resolvedIssues = useMemo(() => {
    return issues
      .filter((i) => i.status === "Resolved" || i.status === "Closed" || i.status === "Done")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [issues]);

  // ──────────────────────────────────────────────────────────────
  // Workload Balance Data (Issues + Tasks + CRs combined)
  // ──────────────────────────────────────────────────────────────
  const workloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    // Initialize
    engineersList.forEach((e) => {
      counts[e.name] = 0;
    });

    // Count Issues
    issues.forEach((issue) => {
      if (!["Resolved", "Closed", "Done"].includes(issue.status) && issue.assignedTo) {
        const assigneeObj = typeof issue.assignedTo === "object" ? issue.assignedTo : null;
        const matchedUser = assigneeObj ? users.find(u => u._id === assigneeObj._id) : null;
        if (matchedUser && counts[matchedUser.name] !== undefined) {
          counts[matchedUser.name] += 1;
        }
      }
    });

    // Count Tasks
    allTasks.forEach((task) => {
      if (task.status !== "Done" && task.assignees) {
        task.assignees.forEach((a) => {
          const userId = typeof a === "object" && a !== null ? a._id : a;
          const matchedUser = users.find(u => u._id === userId);
          if (matchedUser && counts[matchedUser.name] !== undefined) {
            counts[matchedUser.name] += 1;
          }
        });
      }
    });

    // Count CRs
    allCRs.forEach((cr) => {
      if (!["Done", "Closed", "Rejected"].includes(cr.status) && cr.assignedDevelopers) {
        cr.assignedDevelopers.forEach((d) => {
          const userId = typeof d === "object" && d !== null ? d._id : d;
          const matchedUser = users.find(u => u._id === userId);
          if (matchedUser && counts[matchedUser.name] !== undefined) {
            counts[matchedUser.name] += 1;
          }
        });
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [issues, allTasks, allCRs, engineersList, users]);

  // ──────────────────────────────────────────────────────────────
  // Action Handlers
  // ──────────────────────────────────────────────────────────────
  const handleAssign = (issueId: string, userId: string) => {
    if (!userId) return;
    updateIssueMutation.mutate(
      { id: issueId, data: { assignedTo: userId, status: "In Progress" } },
      {
        onSuccess: () => {
          toast.success("Ticket successfully assigned.");
        },
        onError: () => {
          toast.error("Failed to assign ticket.");
        },
      }
    );
  };

  // Approve/Done handler for verification queue
  const handleApproveDone = async (item: typeof verificationQueue[0]) => {
    try {
      if (item.type === 'issue') {
        await updateIssueMutation.mutateAsync({
          id: item.id,
          data: { status: 'Done', submittedForReview: false },
        });
        toast.success("Issue approved and marked as Done.");
        queryClient.invalidateQueries({ queryKey: ["/issues"] });
      } else if (item.type === 'task') {
        await updateTaskMutation.mutateAsync({
          projectId: item.projectId!,
          taskId: item.id,
          data: { status: 'Done', submittedForReview: false },
        });
        toast.success("Task approved and marked as Done.");
      } else if (item.type === 'cr') {
        await updateCRMutation.mutateAsync({
          projectId: item.projectId!,
          crId: item.id,
          data: { status: 'Done', submittedForReview: false },
        });
        toast.success("CR approved and marked as Done.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve item.");
    }
  };

  // Open rejection dialog
  const handleOpenRejectDialog = (item: typeof verificationQueue[0]) => {
    setItemToReject({ id: item.id, type: item.type, projectId: item.projectId });
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  // Submit rejection
  const handleRejectSubmit = async () => {
    if (!itemToReject) return;

    const data = {
      status: 'In Progress',
      isReopened: true,
      submittedForReview: false,
      reopenReason: rejectReason || "Rejected by Senior SE",
    };

    try {
      if (itemToReject.type === 'issue') {
        await updateIssueMutation.mutateAsync({
          id: itemToReject.id,
          data,
        });
        toast.success("Issue reopened and sent back to developer.");
        queryClient.invalidateQueries({ queryKey: ["/issues"] });
      } else if (itemToReject.type === 'task') {
        await updateTaskMutation.mutateAsync({
          projectId: itemToReject.projectId!,
          taskId: itemToReject.id,
          data,
        });
        toast.success("Task reopened and sent back to developer.");
      } else if (itemToReject.type === 'cr') {
        await updateCRMutation.mutateAsync({
          projectId: itemToReject.projectId!,
          crId: itemToReject.id,
          data,
        });
        toast.success("CR reopened and sent back to developer.");
      }
      setRejectDialogOpen(false);
      setItemToReject(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject/reopen item.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UserCheck}
          label="Unassigned Issues"
          value={metrics.unassigned}
          trend={metrics.unassigned > 0 ? "Requires triage" : "Clear queue"}
          className={`hover:scale-[1.01] transition-transform duration-200 ${
            metrics.unassigned > 0 ? "border-amber-500 bg-[rgba(245,158,11,0.02)]" : ""
          }`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Escalations"
          value={metrics.escalations}
          trend={metrics.escalations > 0 ? `${metrics.escalations} critical` : "No active escalations"}
          className={`hover:scale-[1.01] transition-transform duration-200 ${
            metrics.escalations > 0 ? "border-[var(--destructive)] bg-[rgba(239,68,68,0.02)]" : ""
          }`}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Verification Queue"
          value={metrics.verificationQueueCount}
          trend="Awaiting your review"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={Ticket}
          label="My Assigned Issues"
          value={metrics.myAssigned}
          trend="Active issues"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage & Assignment Widget */}
        <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-[var(--primary-text)]" />
              Triage Panel (Oldest Unassigned)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {triageQueue.length === 0 ? (
              <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
                All tickets have been successfully triage-assigned!
              </div>
            ) : (
              <div className="space-y-3.5">
                {triageQueue.map((issue) => {
                  const client = typeof issue.client === "object" ? issue.client : null;
                  return (
                    <div
                      key={issue._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-xs transition-all gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">
                            {issue.issueId}
                          </span>
                          <Badge
                            variant={issue.priority === "Critical" ? "destructive" : "default"}
                            className="text-[9px] uppercase tracking-wide px-1.5 py-0"
                          >
                            {issue.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-1">
                          {issue.title}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                          Client: <span className="font-semibold text-[var(--text-primary)]">{client?.name ?? "N/A"}</span> • Created: {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          defaultValue=""
                          onChange={(e) => handleAssign(issue._id, e.target.value)}
                          className="text-xs h-8.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                        >
                          <option value="" disabled>Assign Engineer...</option>
                          {engineersList.map((eng) => (
                            <option key={eng._id} value={eng._id}>
                              {eng.name} ({eng.designation || "Engineer"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workload Balance Chart */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-[var(--primary-text)]" />
              Workload Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {workloadData.length === 0 ? (
              <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
                No active engineer metrics
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" stroke="var(--text-tertiary)" fontSize={10} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--text-primary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={12}>
                    {workloadData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 5 ? "var(--destructive)" : entry.count > 3 ? "var(--warning)" : "var(--primary)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Unified Verification Queue */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <ClipboardCheck className="h-4.5 w-4.5 text-[var(--success)]" />
            Verification Queue ({verificationQueue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verificationQueue.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
              No items awaiting verification.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verificationQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-xs transition-all gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          className={`text-[9px] uppercase tracking-wide py-0.5 ${
                            item.type === "issue"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              : item.type === "task"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                          }`}
                        >
                          {item.type}
                        </Badge>
                        <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">
                          {item.code}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">•</span>
                        <Badge
                          variant={item.priority === "Critical" ? "destructive" : "default"}
                          className="text-[9px] uppercase tracking-wide"
                        >
                          {item.priority}
                        </Badge>
                        {item.isReopened && (
                          <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] uppercase tracking-wide">
                            Reopened
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                        Dev: <span className="font-semibold text-[var(--text-primary)]">{item.assigneeName}</span>
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-2">
                      {item.title}
                    </p>
                    {item.technicalApproach && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 italic bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)]">
                        Approach: {item.technicalApproach}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveDone(item)}
                      disabled={updateIssueMutation.isPending || updateTaskMutation.isPending || updateCRMutation.isPending}
                      className="flex-1 bg-[var(--success)] hover:bg-[var(--success)]/90 text-white text-xs gap-1.5 h-8.5 rounded-lg"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve / Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenRejectDialog(item)}
                      disabled={updateIssueMutation.isPending || updateTaskMutation.isPending || updateCRMutation.isPending}
                      className="flex-1 border-amber-500 text-amber-500 hover:bg-amber-500/5 text-xs gap-1.5 h-8.5 rounded-lg"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reject / Reopen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 4: Resolved Issues History */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-[var(--success)]" />
            Resolved Issues History (Division-wide)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resolvedIssues.length === 0 ? (
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
                    <th className="py-2.5 px-3">Assignee</th>
                    <th className="py-2.5 px-3">Time Spent</th>
                    <th className="py-2.5 px-3">Resolved Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedIssues.map((issue) => {
                    const client = typeof issue.client === "object" ? issue.client : null;
                    const project = typeof issue.project === "object" ? issue.project : null;
                    const assignee = typeof issue.assignedTo === "object" ? issue.assignedTo : null;
                    return (
                      <tr key={issue._id} className="border-b border-[var(--border)] hover:bg-[var(--background)]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[var(--text-primary)] font-mono">
                          {issue.issueId}
                        </td>
                        <td className="py-3 px-3 font-medium text-[var(--text-primary)] truncate max-w-[220px]" title={issue.title}>
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
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {assignee?.name ?? <span className="italic text-[var(--text-tertiary)]">Unassigned</span>}
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

      {/* Reject / Reopen Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => {
        setRejectDialogOpen(open);
        if (!open) {
          setItemToReject(null);
          setRejectReason("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-[var(--surface)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
              Reject / Reopen Work Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This will reopen the item and send it back to the developer as &quot;Reopened&quot;. 
              The status will be set to &quot;In Progress&quot; so they can continue work.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="rejectReason" className="text-xs font-medium text-[var(--text-secondary)]">
                Rejection Feedback / Reason
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what needs to be fixed or improved..."
                className="text-xs bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)]"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setItemToReject(null);
                setRejectReason("");
              }}
              className="text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={updateIssueMutation.isPending || updateTaskMutation.isPending || updateCRMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-9 rounded-lg"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

