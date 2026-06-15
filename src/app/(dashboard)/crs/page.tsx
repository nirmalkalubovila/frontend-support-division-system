"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  GitPullRequest,
  Search,
  ChevronDown,
  X,
  FolderKanban,
  ArrowLeft,
} from "lucide-react";
import { Button, Input, Select } from "@/components";
import { useGetAllProjects, type Project } from "@/api/services/project-management/project-service";
import { useGetAllUsers, type User } from "@/api/services/user-management/user-service";
import { useGetCRStats } from "@/api/services/project-management/cr-service";
import { CRTab } from "../projects/[projectId]/page";

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
}: {
  group: ProjectGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onBack?: () => void;
  allUsers: User[];
}) {
  const { data: stats } = useGetCRStats(group.id);

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
                <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Open</span>
                <span className="font-bold text-blue-600 mt-0.5">{open}</span>
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
          <CRTab projectId={group.id} members={allUsers} />
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
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary-text)] uppercase tracking-wider shadow-sm">
          {group.clientCode || "GEN"}
        </span>
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
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">Open</span>
          <span className="font-bold text-blue-600 mt-0.5">{open}</span>
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
      </div>

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
