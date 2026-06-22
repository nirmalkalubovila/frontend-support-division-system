"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  GitPullRequest,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  FolderKanban,
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { Button, Input, Select } from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import useSessionStore from "@/store/session-store";
import { useGetAllProjects, type Project } from "@/api/services/project-management/project-service";
import { useGetAllUsers, type User } from "@/api/services/user-management/user-service";
import { useGetCRStats, useGetAssignedCRs } from "@/api/services/project-management/cr-service";
import { CRTab } from "../projects/[projectId]/tabs";

const CR_PRIORITIES = ["Critical", "High", "Medium", "Low"];
const CR_STATUSES = ["Submitted", "Under Review", "Approved", "Rejected", "In Progress", "Done", "On Hold"];

interface ProjectGroup {
  id: string;
  name: string;
  clientCode: string;
  clientName: string;
}

function ProjectCRCard({
  group,
  isExpanded,
  onToggle,
  onBack,
  allUsers,
  viewMode,
  openFormTrigger,
  filterPriority,
  filterStatus,
  filterSearch,
}: {
  group: ProjectGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onBack?: () => void;
  allUsers: User[];
  viewMode?: "list" | "kanban";
  openFormTrigger?: number;
  filterPriority?: string;
  filterStatus?: string;
  filterSearch?: string;
}) {
  const { data: stats } = useGetCRStats(group.id);
  const userInfo = useSessionStore((s) => s.userInfo);
  const { data: assignedCRs = [] } = useGetAssignedCRs(userInfo?._id);

  const hasNewAssignment = useMemo(() => {
    return assignedCRs.some((cr) => {
      const projId = typeof cr.project === "object" && cr.project ? cr.project._id : cr.project;
      return String(projId) === String(group.id) && ["Submitted", "To Do"].includes(cr.status);
    });
  }, [assignedCRs, group.id]);

  const total = stats?.total ?? 0;
  const open = stats?.open ?? 0;
  const approved = stats?.approved ?? 0;
  const completed = stats?.completed ?? 0;

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
                <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Completed</span>
                <span className="font-bold text-[var(--success)] mt-0.5">{completed}</span>
              </div>
            </div>

            <button className="h-8 w-8 rounded-full hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors">
              <ChevronDown className="h-5 w-5 text-[var(--text-tertiary)] transition-transform duration-300 rotate-180 text-[var(--primary)]" />
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface)]/40 dark:bg-[var(--surface)]/5">
          <CRTab
            projectId={group.id}
            members={allUsers}
            viewMode={viewMode}
            openFormTrigger={openFormTrigger}
            filterPriority={filterPriority}
            filterStatus={filterStatus}
            filterSearch={filterSearch}
          />
        </div>
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

      <div className="grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-tertiary)]">
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Total</span>
          <span className="font-bold text-[var(--text-secondary)] mt-0.5">{total}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Approved</span>
          <span className="font-bold text-emerald-600 mt-0.5">{approved}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Done</span>
          <span className="font-bold text-[var(--success)] mt-0.5">{completed}</span>
        </div>
      </div>
    </div>
  );
}

function CRPageContent() {
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [triggerNewCR, setTriggerNewCR] = useState(0);

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
      if (search && !proj.name.toLowerCase().includes(search.toLowerCase())) return;
      const clientObj = typeof proj.client === "object" ? proj.client : null;
      list.push({
        id: proj._id,
        name: proj.name,
        clientCode: clientObj?.code || "",
        clientName: clientObj?.name || "",
      });
    });
    return list;
  }, [projects, search]);

  const activeGroup = useMemo(() => {
    if (!activeProjectId) return null;
    return groupedByProject.find((g) => g.id === activeProjectId) || null;
  }, [activeProjectId, groupedByProject]);

  const hasActiveFilters = !!filterPriority || !!filterStatus || !!filterSearch;

  const clearFilters = () => {
    setFilterPriority("");
    setFilterStatus("");
    setFilterSearch("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 tracking-tight">
            <GitPullRequest className="h-6 w-6 text-[var(--primary)]" />
            {activeGroup ? (
              <span className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)] font-normal">Change Requests</span>
                <span className="text-sm font-medium text-[var(--text-tertiary)]">/</span>
                <span>{activeGroup.name}</span>
              </span>
            ) : (
              "Change Requests Management"
            )}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {activeGroup ? `Managing change requests for ${activeGroup.name}` : "Track, review, and schedule client change requests across active projects"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {!activeGroup && (
            <div className="relative w-full sm:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                placeholder="Search projects..."
                className="pl-9 h-9.5 bg-[var(--surface)] border-[var(--border)]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {activeGroup && (
            <>
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
                  hasActiveFilters ? "border-[var(--primary)] text-[var(--primary-text)] bg-[var(--primary-light)]/20" : ""
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
                {hasActiveFilters && (
                  <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                )}
                {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>

              <ValidatePermission permission="projects.cr.create">
                <Button
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all font-semibold"
                  onClick={() => setTriggerNewCR((n) => n + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New CR
                </Button>
              </ValidatePermission>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar — only shown when a project is active */}
      {activeGroup && showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search by title or CR number..."
              className="pl-9 h-9.5 bg-[var(--background)] border-[var(--border)]"
              value={filterSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="All Priorities"
            value={filterPriority}
            onChange={(v) => setFilterPriority(v)}
            options={[
              { label: "All Priorities", value: "" },
              ...CR_PRIORITIES.map((p) => ({ label: p, value: p })),
            ]}
            className="w-44 h-9.5 bg-[var(--background)]"
          />
          <Select
            placeholder="All Statuses"
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={[
              { label: "All Statuses", value: "" },
              ...CR_STATUSES.map((s) => ({ label: s, value: s })),
            ]}
            className="w-48 h-9.5 bg-[var(--background)]"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs hover:bg-[var(--surface-hover)]">
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
          <ProjectCRCard
            key={activeGroup.id}
            group={activeGroup}
            isExpanded={true}
            onToggle={() => setActiveProjectId(null)}
            onBack={() => setActiveProjectId(null)}
            allUsers={allUsers}
            viewMode={viewMode}
            openFormTrigger={triggerNewCR}
            filterPriority={filterPriority}
            filterStatus={filterStatus}
            filterSearch={filterSearch}
          />
        ) : groupedByProject.length > 0 ? (
          groupedByProject.map((group) => (
            <ProjectCRCard
              key={group.id}
              group={group}
              isExpanded={false}
              onToggle={() => setActiveProjectId(group.id)}
              allUsers={allUsers}
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

export default function CRsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[50vh]">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    }>
      <CRPageContent />
    </Suspense>
  );
}
