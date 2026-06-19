"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import useSessionStore from "@/store/session-store";
import { ROLE_LABELS } from "@/lib/constants";
import { useGetIssues } from "@/api/services/issue-management/issue-service";
import { useGetAllProjects } from "@/api/services/project-management/project-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import {
  ManagementDashboard,
  SeniorLeadDashboard,
  EngineerDashboard,
} from "@/components/organisms";

export default function DashboardPage() {
  const userInfo = useSessionStore((s) => s.userInfo);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast.success("Dashboard data refreshed!");
    } catch {
      toast.error("Failed to refresh dashboard data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // API Queries (cached and managed via TanStack Query)
  // ──────────────────────────────────────────────────────────────
  const { data: issuesData, isLoading: isIssuesLoading } = useGetIssues({
    limit: 500,
    sortBy: "updatedAt:desc",
  });

  const { data: projectsData, isLoading: isProjectsLoading } = useGetAllProjects();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsers();

  const issues = useMemo(() => issuesData?.data ?? [], [issuesData]);
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData]);
  const users = useMemo(() => usersData ?? [], [usersData]);

  // Determine dashboard layout state
  const isLoaderShowing =
    isIssuesLoading ||
    isProjectsLoading ||
    (userInfo?.role && ["super_admin", "manager", "senior_engineer"].includes(userInfo.role) && isUsersLoading);

  if (isLoaderShowing || !userInfo) {
    return (
      <div className="space-y-6">
        <div className="h-14 w-1/3 bg-[var(--surface-hover)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[var(--surface-hover)] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-[var(--surface-hover)] rounded-xl animate-pulse" />
          <div className="h-[350px] bg-[var(--surface-hover)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Render dashboard variant based on user role
  const renderDashboard = () => {
    switch (userInfo.role) {
      case "super_admin":
      case "manager":
        return (
          <ManagementDashboard
            issues={issues}
            projects={projects}
            users={users}
          />
        );
      case "senior_engineer":
        return (
          <SeniorLeadDashboard
            issues={issues}
            users={users}
            currentUserId={userInfo._id}
          />
        );
      case "engineer":
      case "intern":
      default:
        return (
          <EngineerDashboard
            issues={issues}
            currentUserId={userInfo._id}
          />
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {userInfo.role === "super_admin" || userInfo.role === "manager"
              ? "Division Management Center"
              : userInfo.role === "senior_engineer"
              ? "Lead Workspace"
              : "Engineer Workspace"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Welcome back, <span className="font-semibold text-[var(--text-primary)]">{userInfo.name}</span> •{" "}
            <span className="text-[var(--primary-text)] font-semibold">
              {ROLE_LABELS[userInfo.role] || "Staff Engineer"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg px-3 py-1.5 h-8.5 cursor-pointer"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[var(--primary)]" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Link href="/guide">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg px-3 py-1.5 h-8.5"
              title="Open workspace guide manual"
            >
              <HelpCircle className="h-4 w-4" />
              Workspace Guide
            </Button>
          </Link>
        </div>
      </div>

      {/* Selected Dashboard Panel */}
      {renderDashboard()}
    </div>
  );
}
