"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Check, X, Edit2, Trash2, Calendar, Clock, User, 
  Briefcase, Search, Filter, RefreshCw, AlertCircle, FileText,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { 
  Card, CardContent, CardHeader, CardTitle, Badge, Button, 
  Input, Label, Textarea, Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogClose, Avatar, AvatarFallback
} from "@/components";
import { 
  useGetTimeLogs, 
  useUpdateTimeLog, 
  useDeleteTimeLog 
} from "@/api/services/time-tracking/time-log-service";
import { useGetAllProjects } from "@/api/services/project-management/project-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import { toast } from "sonner";

interface TimesheetApprovalViewProps {
  startDate: string;
  endDate: string;
  isManagerOrAdmin: boolean;
}

export function TimesheetApprovalView({
  startDate,
  endDate,
  isManagerOrAdmin
}: TimesheetApprovalViewProps) {
  // Query filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [selectedWorkType, setSelectedWorkType] = useState<string>("all");
  const [selectedProjectType, setSelectedProjectType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("all"); // default all search

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedProjectId,
    selectedDeveloperId,
    selectedStatus,
    selectedWorkType,
    selectedProjectType,
    searchQuery,
    startDate,
    endDate
  ]);

  // Editing state
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editDuration, setEditDuration] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [editBillable, setEditBillable] = useState<boolean>(true);

  // Queries
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useGetTimeLogs({
    limit: 1000,
    sortBy: "createdAt:desc"
  });

  const { data: projectsData } = useGetAllProjects();
  const { data: usersData } = useGetAllUsers();

  // Mutations
  const updateLogMutation = useUpdateTimeLog();
  const deleteLogMutation = useDeleteTimeLog();

  const projects = useMemo(() => projectsData?.data ?? [], [projectsData]);
  const developers = useMemo(() => {
    // List only senior software engineers, engineers, and interns as developers
    return (usersData ?? []).filter(u => 
      u.role === "senior_engineer" || 
      u.role === "engineer" || 
      u.role === "intern"
    );
  }, [usersData]);

  // Client-side filtering of logs based on dates and dropdown choices
  const logs = useMemo(() => {
    let list = logsData?.data ?? [];

    // Filter by completed sessions (endTime is not null)
    list = list.filter(log => log.endTime !== null);

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      list = list.filter(log => new Date(log.startTime) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(log => new Date(log.startTime) <= end);
    }

    // Project filter
    if (selectedProjectId && selectedProjectId !== "all") {
      list = list.filter(log => {
        const logProjId = typeof log.project === 'object' && log.project ? log.project._id : log.project;
        return logProjId === selectedProjectId;
      });
    }

    // Project Type filter
    if (selectedProjectType && selectedProjectType !== "all") {
      list = list.filter(log => {
        const projectObj = typeof log.project === 'object' ? log.project : null;
        if (!projectObj || !projectObj.projectType) return false;
        if (selectedProjectType === "Support") {
          return projectObj.projectType.includes("Support");
        } else if (selectedProjectType === "Development") {
          return projectObj.projectType.includes("Development");
        }
        return false;
      });
    }

    // Developer filter
    if (selectedDeveloperId && selectedDeveloperId !== "all") {
      list = list.filter(log => {
        const logUserId = typeof log.user === 'object' && log.user ? log.user._id : log.user;
        return logUserId === selectedDeveloperId;
      });
    }

    // Status filter
    if (selectedStatus && selectedStatus !== "all") {
      if (selectedStatus === "pending") {
        list = list.filter(log => !log.approved);
      } else if (selectedStatus === "approved") {
        list = list.filter(log => log.approved);
      }
    }

    // Work Item Type filter
    if (selectedWorkType && selectedWorkType !== "all") {
      if (selectedWorkType === "issue") {
        list = list.filter(log => log.issue);
      } else if (selectedWorkType === "cr") {
        list = list.filter(log => log.cr);
      } else if (selectedWorkType === "task") {
        list = list.filter(log => log.task);
      } else if (selectedWorkType === "general") {
        list = list.filter(log => !log.issue && !log.cr && !log.task);
      }
    }

    // Note Search filter
    if (searchQuery && searchQuery.trim() !== "" && searchQuery !== "all") {
      const q = searchQuery.toLowerCase();
      list = list.filter(log => log.note?.toLowerCase().includes(q));
    }

    return list;
  }, [logsData, startDate, endDate, selectedProjectId, selectedDeveloperId, selectedStatus, selectedWorkType, selectedProjectType, searchQuery]);

  // Paginate logs
  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage, pageSize]);

  // Adjust current page if it is out of range (e.g. after filters change or item deletions)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const pageNumbers = useMemo(() => {
    const range = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      range.push(1);
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      if (start > 2) {
        range.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      
      if (end < totalPages - 1) {
        range.push('...');
      }
      
      range.push(totalPages);
    }
    return range;
  }, [currentPage, totalPages]);

  // Totals calculations
  const summary = useMemo(() => {
    const allCompleted = (logsData?.data ?? []).filter(log => log.endTime !== null);
    
    // Filter today's date range or chosen range if applicable
    let filteredForSummary = allCompleted;
    if (startDate) {
      const start = new Date(startDate);
      filteredForSummary = filteredForSummary.filter(log => new Date(log.startTime) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredForSummary = filteredForSummary.filter(log => new Date(log.startTime) <= end);
    }

    const pending = filteredForSummary.filter(log => !log.approved);
    const approved = filteredForSummary.filter(log => log.approved);

    const pendingHours = pending.reduce((sum, log) => sum + (log.duration || 0), 0);
    const approvedHours = approved.reduce((sum, log) => sum + (log.duration || 0), 0);

    return {
      pendingCount: pending.length,
      pendingHours: parseFloat(pendingHours.toFixed(2)),
      approvedCount: approved.length,
      approvedHours: parseFloat(approvedHours.toFixed(2))
    };
  }, [logsData, startDate, endDate]);

  // Actions
  const handleApprove = (logId: string) => {
    updateLogMutation.mutate(
      { logId, data: { approved: true } },
      {
        onSuccess: () => {
          toast.success("Timesheet log approved!");
          refetchLogs();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to approve log.");
        }
      }
    );
  };

  const handleReject = (logId: string) => {
    if (confirm("Are you sure you want to reject and delete this time log? This will remove it from the project hours.")) {
      deleteLogMutation.mutate(logId, {
        onSuccess: () => {
          toast.success("Time log rejected and deleted.");
          refetchLogs();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to reject log.");
        }
      });
    }
  };

  const handleEditClick = (log: any) => {
    setEditingLog(log);
    setEditDuration(log.duration.toString());
    setEditNote(log.note || "");
    setEditBillable(log.isBillable !== false);
  };

  const handleSaveEdit = () => {
    if (!editingLog) return;
    const duration = parseFloat(editDuration);
    if (isNaN(duration) || duration <= 0) {
      toast.error("Please enter a valid duration greater than 0.");
      return;
    }

    updateLogMutation.mutate(
      { 
        logId: editingLog._id, 
        data: { 
          duration, 
          note: editNote,
          isBillable: editBillable
        } 
      },
      {
        onSuccess: () => {
          toast.success("Timesheet log updated successfully!");
          setEditingLog(null);
          refetchLogs();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to update log.");
        }
      }
    );
  };

  // Helper to format date
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + " " + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogReferenceCode = (log: any) => {
    if (log.issue) return typeof log.issue === 'object' ? log.issue.issueId : "Issue";
    if (log.task) return "Task";
    if (log.cr) return typeof log.cr === 'object' ? log.cr.crNumber : "CR";
    return "Project Work";
  };

  const getLogReferenceTitle = (log: any) => {
    if (log.issue) return typeof log.issue === 'object' ? log.issue.title : "";
    if (log.task) return typeof log.task === 'object' ? log.task.name : "";
    if (log.cr) return typeof log.cr === 'object' ? log.cr.title : "";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Pending Timesheets
            </CardTitle>
            <Clock className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-extrabold text-[var(--text-primary)]">
              {summary.pendingCount}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">
              Waiting for approval review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Pending Logged Hours
            </CardTitle>
            <Clock className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-extrabold text-[var(--text-primary)]">
              {summary.pendingHours}h
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">
              Total unapproved effort
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Approved Timesheets
            </CardTitle>
            <Check className="h-4.5 w-4.5 text-[var(--success)]" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-extrabold text-[var(--text-primary)]">
              {summary.approvedCount}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">
              Successfully processed logs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Approved Logged Hours
            </CardTitle>
            <Check className="h-4.5 w-4.5 text-[var(--success)]" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-extrabold text-[var(--text-primary)]">
              {summary.approvedHours}h
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">
              Approved billed contract time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Filter by Project */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Project</Label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="block w-48 text-xs h-9 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Project Type */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Project Type</Label>
              <select
                value={selectedProjectType}
                onChange={(e) => setSelectedProjectType(e.target.value)}
                className="block w-40 text-xs h-9 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Types</option>
                <option value="Support">Support</option>
                <option value="Development">Development</option>
              </select>
            </div>

            {/* Filter by Developer */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Developer</Label>
              <select
                value={selectedDeveloperId}
                onChange={(e) => setSelectedDeveloperId(e.target.value)}
                className="block w-48 text-xs h-9 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Developers</option>
                {developers.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Approval Status */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Approval Status</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-40 text-xs h-9 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            {/* Filter by Work Item Type */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Work Item Type</Label>
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="block w-40 text-xs h-9 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Items</option>
                <option value="issue">Issues</option>
                <option value="cr">CRs</option>
                <option value="task">Tasks</option>
                <option value="general">Project Work</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 lg:pt-0">
            {/* Search notes */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery === "all" ? "" : searchQuery}
                onChange={(e) => setSearchQuery(e.target.value || "all")}
                className="pl-8 text-xs h-9 w-48 bg-[var(--background)] border-[var(--border)]"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
              className="h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Timesheets Table */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">Loading timesheet records...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-tertiary)] font-medium border border-dashed border-[var(--border)] rounded-lg m-4 bg-[var(--background)] flex flex-col items-center justify-center gap-2">
              <AlertCircle className="h-8 w-8 text-[var(--text-tertiary)]" />
              <span>No timesheet records match the selected filters or range.</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] font-semibold">
                    <th className="p-3">Developer</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Logged Item</th>
                    <th className="p-3">Work details</th>
                    <th className="p-3 text-right">Duration</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log: any) => {
                    const devName = typeof log.user === 'object' && log.user ? log.user.name : "Developer";
                    const devEmail = typeof log.user === 'object' && log.user ? log.user.email : "";
                    const projName = typeof log.project === 'object' && log.project ? log.project.name : "N/A";

                    return (
                      <tr key={log._id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7 text-[10px] font-bold bg-[var(--primary-light)] text-[var(--primary-text)] border border-[var(--primary-hover)]">
                              <AvatarFallback>
                                {devName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[var(--text-primary)]">{devName}</span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">{devEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-[var(--text-primary)]">{projName}</span>
                            {typeof log.project === 'object' && log.project?.projectType && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {log.project.projectType.map((type: string) => {
                                  let typeColor = "bg-slate-500/10 text-slate-600 border-slate-500/20";
                                  if (type === "Support") typeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
                                  if (type === "Development") typeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
                                  return (
                                    <Badge key={type} variant="outline" className={`text-[8px] py-0 px-1 scale-90 origin-left font-bold ${typeColor}`}>
                                      {type}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {log.issue ? (
                              <Badge variant="outline" className="w-fit text-[9px] bg-sky-500/10 text-sky-600 border-sky-500/20 font-mono py-0 px-1 font-bold">
                                {typeof log.issue === 'object' ? log.issue.issueId : "Issue"}
                              </Badge>
                            ) : log.cr ? (
                              <Badge variant="outline" className="w-fit text-[9px] bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 font-mono py-0 px-1 font-bold">
                                {typeof log.cr === 'object' ? log.cr.crNumber : "CR"}
                              </Badge>
                            ) : log.task ? (
                              <Badge variant="outline" className="w-fit text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0 px-1 font-bold">
                                Task
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="w-fit text-[9px] bg-slate-500/10 text-slate-600 border-slate-500/20 py-0 px-1 font-bold">
                                Project Work
                              </Badge>
                            )}
                            <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[150px] mt-0.5" title={getLogReferenceTitle(log)}>
                              {getLogReferenceTitle(log)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 max-w-[280px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[var(--primary-text)] text-[10px] uppercase">
                              {log.workType}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)] break-words leading-relaxed" title={log.note}>
                              {log.note || <span className="italic text-[var(--text-tertiary)]">No notes provided</span>}
                            </span>
                            <span className="text-[9px] text-[var(--text-tertiary)] mt-0.5 font-medium">
                              Logged on: {formatDateTime(log.startTime)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-extrabold text-[var(--text-primary)] font-mono">
                              {log.duration.toFixed(2)}h
                            </span>
                            <Badge variant="outline" className={`text-[8px] scale-90 origin-right border-0 font-bold ${log.isBillable !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {log.isBillable !== false ? "Billable" : "Non-Billable"}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="default" 
                            className={`text-[9px] font-bold py-0.5 px-2 border ${
                              log.approved 
                                ? "bg-[rgba(34,197,94,0.15)] text-[var(--success)] border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.2)]" 
                                : "bg-[rgba(245,158,11,0.15)] text-amber-600 border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.2)]"
                            }`}
                          >
                            {log.approved ? "Approved" : "Pending Review"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!log.approved && isManagerOrAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(log._id)}
                                className="h-7 w-7 p-0 bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-600 rounded-md"
                                title="Approve Time Log"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {isManagerOrAdmin && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditClick(log)}
                                  className="h-7 w-7 p-0 bg-slate-500/10 hover:bg-slate-500/25 border-slate-500/20 hover:border-slate-500/40 text-slate-600 rounded-md"
                                  title="Edit Time Log"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(log._id)}
                                  className="h-7 w-7 p-0 bg-red-500/10 hover:bg-red-500/25 border-red-500/20 hover:border-red-500/40 text-red-600 rounded-md"
                                  title="Reject & Delete Log"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {logs.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--border)] bg-[var(--surface)]">
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  Showing <span className="font-semibold text-[var(--text-primary)]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{Math.min(currentPage * pageSize, logs.length)}</span> of{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{logs.length}</span> results
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-xs h-8 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {pageNumbers.map((num, idx) => {
                      if (num === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[var(--text-tertiary)]">
                            ...
                          </span>
                        );
                      }
                      return (
                        <Button
                          key={`page-${num}`}
                          variant={currentPage === num ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(num as number)}
                          className={`h-8 w-8 p-0 text-xs font-semibold ${
                            currentPage === num
                              ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                              : ""
                          }`}
                        >
                          {num}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Timesheet Modal Dialog */}
      <Dialog open={editingLog !== null} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent className="max-w-md bg-[var(--surface)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[var(--text-primary)]">
              Edit Timesheet Record
            </DialogTitle>
          </DialogHeader>

          {editingLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Developer</Label>
                  <Input 
                    type="text" 
                    value={typeof editingLog.user === 'object' && editingLog.user ? editingLog.user.name : "Developer"} 
                    disabled 
                    className="h-9.5 text-xs bg-[var(--background)] cursor-not-allowed opacity-75"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Project</Label>
                  <Input 
                    type="text" 
                    value={typeof editingLog.project === 'object' && editingLog.project ? editingLog.project.name : "N/A"} 
                    disabled 
                    className="h-9.5 text-xs bg-[var(--background)] cursor-not-allowed opacity-75"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Logged Hours</Label>
                  <Input 
                    type="number" 
                    step="0.05"
                    min="0"
                    max="12"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="h-9.5 text-xs bg-[var(--background)] text-[var(--text-primary)]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="editBillableCheck"
                    checked={editBillable}
                    onChange={(e) => setEditBillable(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] bg-[var(--background)]"
                  />
                  <Label htmlFor="editBillableCheck" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                    Billable Work
                  </Label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Work Notes</Label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="text-xs bg-[var(--background)] text-[var(--text-primary)] min-h-[80px]"
                  placeholder="Enter notes detailing work completed..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button size="sm" variant="outline" className="text-xs">
                Cancel
              </Button>
            </DialogClose>
            <Button size="sm" onClick={handleSaveEdit} className="text-xs bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
              Save Corrections
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
