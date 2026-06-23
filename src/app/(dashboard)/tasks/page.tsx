"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckSquare,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  FolderKanban,
  ArrowLeft,
  History,
  Clock,
  Calendar,
  Eye,
  AlertCircle,
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { Button, Input, Select } from "@/components";
import useSessionStore from "@/store/session-store";
import { useGetAllProjects, type Project } from "@/api/services/project-management/project-service";
import { useGetAllUsers, type User } from "@/api/services/user-management/user-service";
import { useGetProjectTasks, useGetAssignedTasks, type Task } from "@/api/services/project-management/task-service";
import { TasksTab } from "../projects/[projectId]/tabs";
import { TaskDetailDrawer } from "@/components/organisms/kanbanBoard/kanban-board";

interface ProjectGroup {
  id: string;
  name: string;
  clientCode: string;
  clientName: string;
}

function fmtDuration(hours: number): string {
  const totalSecs = Math.round(hours * 3600);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  if (s > 0 || parts.length === 0) parts.push(`${s} sec`);
  return parts.join(", ");
}

function CompletedTasksHistory({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "Done"), [tasks]);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
            <th className="py-3 px-4 font-semibold">Task Name</th>
            <th className="py-3 px-4 font-semibold">Priority</th>
            <th className="py-3 px-4 font-semibold">Status</th>
            <th className="py-3 px-4 font-semibold">Assignees</th>
            <th className="py-3 px-4 font-semibold">Time Spent</th>
            <th className="py-3 px-4 font-semibold">Completed Date</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] text-xs">
          {completedTasks.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-[var(--text-tertiary)] font-medium bg-[var(--surface)]/10">
                <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)] mx-auto mb-1.5" />
                No completed tasks found.
              </td>
            </tr>
          ) : (
            completedTasks.map((task) => {
              const completedDate = new Date(task.updatedAt);
              return (
                <tr
                  key={task._id}
                  className="hover:bg-[var(--surface-hover)]/40 transition-colors cursor-pointer group"
                  onClick={() => onTaskClick(task)}
                >
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors max-w-sm truncate">
                    {task.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex items-center gap-1 w-fit bg-slate-50 text-slate-700 border-slate-200">
                      <span className={`h-1.5 w-1.5 rounded-full ${task.priority === 'Critical' ? 'bg-red-500' : task.priority === 'High' ? 'bg-orange-500' : task.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm" />
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex -space-x-1">
                      {task.assignees.map((a) => (
                        <div key={a._id} title={a.name}
                          className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] border border-[var(--surface)] flex items-center justify-center text-white text-[8px] font-bold">
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {task.assignees.length === 0 && <span className="text-[10px] text-[var(--text-tertiary)]">—</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                    <Clock className="h-3.5 w-3.5 inline mr-1 text-[var(--text-tertiary)]" />
                    {task.totalTimeSpent !== undefined ? fmtDuration(task.totalTimeSpent) : "0 sec"}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                    <Calendar className="h-3.5 w-3.5 inline mr-1 text-[var(--text-tertiary)]" />
                    {completedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTaskClick(task)}
                      className="h-7 w-7 p-0 rounded-full hover:bg-[var(--surface-hover)]"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProjectTasksCard({
  group,
  isExpanded,
  onToggle,
  onBack,
  allUsers,
  viewMode,
  showAddTask,
  filterSearch,
  filterPriority,
  filterAssignee,
}: {
  group: ProjectGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onBack?: () => void;
  allUsers: User[];
  viewMode?: "kanban" | "list";
  showAddTask?: boolean;
  filterSearch?: string;
  filterPriority?: string;
  filterAssignee?: string;
}) {
  const { data: tasks = [], isLoading } = useGetProjectTasks(group.id);
  const userInfo = useSessionStore((s) => s.userInfo);
  const { data: assignedTasks = [] } = useGetAssignedTasks(userInfo?._id);

  const hasNewAssignment = useMemo(() => {
    return ((assignedTasks || []) as Task[]).some((t) => {
      const proj = t.project as any;
      const projId = typeof proj === "object" && proj ? proj._id : proj;
      return String(projId) === String(group.id) && t.status === "To Do";
    });
  }, [assignedTasks, group.id]);

  const [subTab, setSubTab] = useState<"active" | "history">("active");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const currentDrawerTask = useMemo(
    () => selectedTask ? tasks.find((t) => t._id === selectedTask._id) ?? selectedTask : null,
    [selectedTask, tasks]
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Done").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const todo = tasks.filter((t) => t.status === "To Do").length;

  if (isExpanded) {
    return (
      <div className="col-span-full border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden shadow-sm transition-all duration-300">
        <div
          onClick={onToggle}
          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-[var(--surface-hover)]/20 hover:bg-[var(--surface-hover)]/40 transition-colors"
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {onBack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                className="shrink-0 h-8 w-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors text-[var(--text-secondary)] hover:text-[var(--primary-text)] mr-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded bg-[var(--primary-light)] text-[var(--primary-text)] uppercase tracking-wider shadow-sm">
              {group.clientCode || "GEN"}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                {group.name}
              </h3>
              {group.clientName && (
                <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{group.clientName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 md:gap-8 shrink-0">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total</span>
                <span className="font-bold text-[var(--text-secondary)] mt-0.5">{total}</span>
              </div>
              <div className="h-6 w-px bg-[var(--border)]" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Done</span>
                <span className="font-bold text-[var(--success)] mt-0.5">{done}</span>
              </div>
            </div>

            <button className="h-8 w-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors">
              <ChevronDown className="h-5 w-5 text-[var(--text-tertiary)] transition-transform duration-300 rotate-180 text-[var(--primary)]" />
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface)]/40 dark:bg-[var(--surface)]/5">
          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setSubTab("active")}
                className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                  subTab === "active"
                    ? "border-[var(--primary)] text-[var(--primary-text)] border-b-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setSubTab("history")}
                className={`pb-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  subTab === "history"
                    ? "border-[var(--primary)] text-[var(--primary-text)] border-b-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <History className="h-4 w-4" />
                Completed History
              </button>
            </div>
          </div>

          {subTab === "active" ? (
            <TasksTab projectId={group.id} members={allUsers} externalViewMode={viewMode} showAddTaskExternal={showAddTask} filterSearch={filterSearch} filterPriority={filterPriority} filterAssignee={filterAssignee} />
          ) : (
            <CompletedTasksHistory tasks={tasks} onTaskClick={(t) => setSelectedTask(t)} />
          )}
        </div>

        {currentDrawerTask && (
          <TaskDetailDrawer
            task={currentDrawerTask}
            projectId={group.id}
            members={allUsers}
            onClose={() => setSelectedTask(null)}
            onEdit={() => setSelectedTask(null)}
            onDelete={() => setSelectedTask(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onToggle}
      className="col-span-1 border border-[var(--border)] rounded-2xl bg-[var(--surface)] hover:border-[var(--border-hover)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col p-5 h-full min-h-[180px] cursor-pointer select-none"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary-text)] uppercase tracking-wider shadow-sm">
            {group.clientCode || "GEN"}
          </span>
          {hasNewAssignment && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase tracking-wider animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
              New
            </span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
      </div>

      <div className="flex-1 mt-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2">
          {group.name}
        </h3>
        {group.clientName && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 truncate">{group.clientName}</p>
        )}
      </div>

      <div className="border-t border-[var(--border)] my-3.5 opacity-50" />

      <div className="grid grid-cols-4 gap-2 text-center text-xs text-[var(--text-tertiary)]">
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Total</span>
          <span className="font-bold text-[var(--text-secondary)] mt-0.5">{total}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Todo</span>
          <span className="font-bold text-[var(--text-secondary)] mt-0.5">{todo}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">In Dev</span>
          <span className="font-bold text-[var(--warning)] mt-0.5">{inProgress}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Done</span>
          <span className="font-bold text-[var(--success)] mt-0.5">{done}</span>
        </div>
      </div>
    </div>
  );
}

function TasksPageContent() {
  const [mounted, setMounted] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [addTaskTrigger, setAddTaskTrigger] = useState(false);

  const searchParams = useSearchParams();
  const projectQuery = searchParams.get("project") || searchParams.get("projectId");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (projectQuery) {
      setActiveProjectId(projectQuery);
    }
  }, [projectQuery]);

  const { data: projectsData, isLoading: isLoadingProjects } = useGetAllProjects();
  const { data: allUsers = [] } = useGetAllUsers();

  const projects: Project[] = projectsData?.data ?? [];

  const groupedByProject = useMemo(() => {
    const list: ProjectGroup[] = [];
    projects.forEach((proj) => {
      const clientObj = typeof proj.client === "object" ? proj.client : null;
      list.push({
        id: proj._id,
        name: proj.name,
        clientCode: clientObj?.code || "",
        clientName: clientObj?.name || "",
      });
    });
    return list;
  }, [projects]);

  const activeGroup = useMemo(() => {
    if (!activeProjectId) return null;
    return groupedByProject.find((g) => g.id === activeProjectId) || null;
  }, [activeProjectId, groupedByProject]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 tracking-tight">
            <CheckSquare className="h-6 w-6 text-[var(--primary)]" />
            {activeGroup ? (
              <span className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)] font-normal">Tasks</span>
                <span className="text-sm font-medium text-[var(--text-tertiary)]">/</span>
                <span>{activeGroup.name}</span>
              </span>
            ) : (
              "Tasks Management"
            )}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {activeGroup ? `Managing tasks for ${activeGroup.name}` : "Plan, assign, and organize developer tasks across active projects"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* View Switcher Toggle */}
          <div className="flex items-center rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] p-1 mr-1.5 shadow-sm">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-[var(--surface)] text-[var(--primary-text)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--primary-text)]"
              }`}
              title="Kanban View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-[var(--surface)] text-[var(--primary-text)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--primary-text)]"
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 font-medium shadow-sm transition-all ${
              filterSearch || filterPriority || filterAssignee
                ? "border-[var(--primary)] text-[var(--primary-text)] bg-[var(--primary-light)]/20"
                : showFilters ? "border-[var(--primary)] text-[var(--primary-text)] bg-[var(--primary-light)]/20" : ""
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {(filterSearch || filterPriority || filterAssignee) && (
              <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
            )}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all font-semibold"
            onClick={() => setAddTaskTrigger((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 h-9.5 bg-[var(--background)] border-[var(--border)]"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="All Priorities"
            value={filterPriority}
            onChange={(v) => setFilterPriority(v)}
            options={[
              { label: "All Priorities", value: "" },
              ...(["Critical", "High", "Medium", "Low"] as const).map((p) => ({ label: p, value: p })),
            ]}
            className="w-44 h-9.5 bg-[var(--background)]"
          />
          <Select
            placeholder="All Assignees"
            value={filterAssignee}
            onChange={(v) => setFilterAssignee(v)}
            options={[
              { label: "All Assignees", value: "" },
              ...allUsers.map((u) => ({ label: u.name, value: u._id })),
            ]}
            className="w-48 h-9.5 bg-[var(--background)]"
          />
          {(filterSearch || filterPriority || filterAssignee) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterSearch(""); setFilterPriority(""); setFilterAssignee(""); }} className="gap-1 text-xs hover:bg-[var(--surface-hover)]">
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingProjects ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-5 space-y-4 min-h-[180px] animate-pulse" />
          ))
        ) : activeGroup ? (
          <ProjectTasksCard
            key={activeGroup.id}
            group={activeGroup}
            isExpanded={true}
            onToggle={() => setActiveProjectId(null)}
            onBack={() => setActiveProjectId(null)}
            allUsers={allUsers}
            viewMode={viewMode}
            showAddTask={addTaskTrigger}
            filterSearch={filterSearch}
            filterPriority={filterPriority}
            filterAssignee={filterAssignee}
          />
        ) : groupedByProject.length > 0 ? (
          groupedByProject.map((group) => (
            <ProjectTasksCard
              key={group.id}
              group={group}
              isExpanded={false}
              onToggle={() => setActiveProjectId(group.id)}
              allUsers={allUsers}
              viewMode={viewMode}
              filterSearch={filterSearch}
              filterPriority={filterPriority}
              filterAssignee={filterAssignee}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-secondary)] shadow-sm">
            <FolderKanban className="h-10 w-10 text-[var(--text-tertiary)] opacity-40 mb-3" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No projects found</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Try resetting your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[50vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    }>
      <TasksPageContent />
    </Suspense>
  );
}
