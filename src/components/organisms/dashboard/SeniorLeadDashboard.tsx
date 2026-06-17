"use client";

import React, { useMemo } from "react";
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
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatCard } from "@/components/atoms/statCard";
import { useUpdateIssue, type Issue } from "@/api/services/issue-management/issue-service";
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

interface SeniorLeadDashboardProps {
  issues: Issue[];
  users: UserInfo[];
  currentUserId: string;
}

export function SeniorLeadDashboard({ issues, users, currentUserId }: SeniorLeadDashboardProps) {
  const updateIssueMutation = useUpdateIssue();

  // Filter staff engineers
  const engineersList = useMemo(() => {
    return users.filter((u) => u.role === "engineer" || u.role === "senior_engineer" || u.role === "intern");
  }, [users]);

  // ──────────────────────────────────────────────────────────────
  // Metrics & Calculations
  // ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const activeIssues = issues.filter(
      (i) => i.status !== "Resolved" && i.status !== "Closed"
    );

    const unassigned = activeIssues.filter((i) => !i.assignedTo).length;

    const escalations = activeIssues.filter(
      (i) => i.priority === "Critical"
    ).length;

    const testingQueue = activeIssues.filter(
      (i) => i.status === "Testing"
    ).length;

    const myAssigned = activeIssues.filter((i) => {
      if (typeof i.assignedTo === "object" && i.assignedTo !== null) {
        return i.assignedTo._id === currentUserId;
      }
      return i.assignedTo === currentUserId;
    }).length;

    return {
      unassigned,
      escalations,
      testingQueue,
      myAssigned,
    };
  }, [issues, currentUserId]);

  // ──────────────────────────────────────────────────────────────
  // Triage: Oldest Unassigned Issues
  // ──────────────────────────────────────────────────────────────
  const triageQueue = useMemo(() => {
    return issues
      .filter((i) => !i.assignedTo && !["Resolved", "Closed"].includes(i.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5);
  }, [issues]);

  // ──────────────────────────────────────────────────────────────
  // Verification Queue: Issues in Testing Status
  // ──────────────────────────────────────────────────────────────
  const testingQueueList = useMemo(() => {
    return issues.filter(
      (i) => i.status === "Testing"
    ).slice(0, 5);
  }, [issues]);

  const resolvedIssues = useMemo(() => {
    return issues
      .filter((i) => i.status === "Resolved" || i.status === "Closed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [issues]);

  // ──────────────────────────────────────────────────────────────
  // Workload Balance Data
  // ──────────────────────────────────────────────────────────────
  const workloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    // Initialize
    engineersList.forEach((e) => {
      counts[e.name] = 0;
    });

    issues.forEach((issue) => {
      if (!["Resolved", "Closed"].includes(issue.status) && issue.assignedTo) {
        const name = typeof issue.assignedTo === "object" ? issue.assignedTo.name : issue.assignedTo;
        const matchedUser = users.find(u => u._id === name || u.name === name || u._id === (issue.assignedTo as any)._id);
        if (matchedUser) {
          counts[matchedUser.name] = (counts[matchedUser.name] || 0) + 1;
        }
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [issues, engineersList, users]);

  // ──────────────────────────────────────────────────────────────
  // Action Handlers
  // ──────────────────────────────────────────────────────────────
  const handleAssign = (issueId: string, userId: string) => {
    if (!userId) return;
    updateIssueMutation.mutate(
      { id: issueId, data: { assignedTo: userId, status: "Assigned" } },
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

  const handleUpdateStatus = (issueId: string, status: string, feedback: string) => {
    updateIssueMutation.mutate(
      { id: issueId, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Ticket status updated to ${status}.`);
        },
        onError: () => {
          toast.error("Failed to update ticket status.");
        },
      }
    );
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
          value={metrics.testingQueue}
          trend="Tickets awaiting review"
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

      {/* Row 3: Testing Queue Reviews */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <ClipboardCheck className="h-4.5 w-4.5 text-[var(--success)]" />
            Testing / Verification Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testingQueueList.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
              No tickets awaiting validation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testingQueueList.map((issue) => {
                const assignee = typeof issue.assignedTo === "object" ? issue.assignedTo : null;
                return (
                  <div
                    key={issue._id}
                    className="flex flex-col justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-xs transition-all gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">
                            {issue.issueId}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">•</span>
                          <Badge variant="outline" className="text-[9px] text-[var(--accent)] border-[var(--accent)] bg-[rgba(6,182,212,0.02)] uppercase">
                            Testing
                          </Badge>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          Assignee: <span className="font-semibold text-[var(--text-primary)]">{assignee?.name ?? "Unassigned"}</span>
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-2">
                        {issue.title}
                      </p>
                      {issue.technicalApproach && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 italic bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)]">
                          "Approach: {issue.technicalApproach}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(issue._id, "Resolved", "")}
                        className="flex-1 bg-[var(--success)] hover:bg-[var(--success)]/90 text-white text-xs gap-1.5 h-8.5 rounded-lg"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve / Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(issue._id, "Reopened", "")}
                        className="flex-1 border-amber-500 text-amber-500 hover:bg-amber-500/5 text-xs gap-1.5 h-8.5 rounded-lg"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        Reject / Reopen
                      </Button>
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
}
