"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, FolderKanban, LayoutDashboard, CheckSquare,
  Calendar, Mail, Phone, Tag, Users, BarChart3,
  AlertCircle, CheckCircle2, GitPullRequest, Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/atoms/statCard";
import { useGetProjectById } from "@/api/services/project-management/project-service";
import { useGetIssues } from "@/api/services/issue-management/issue-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import { useGetProjectTasks } from "@/api/services/project-management/task-service";
import type { User } from "@/api/services/user-management/user-service";
import { TasksTab, CRTab, IssuesTab } from "./tabs";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────
// Dashboard Tab
// ─────────────────────────────────────────────────────────────
function DashboardTab({ projectId }: { projectId: string }) {
  const { data: project, isLoading } = useGetProjectById(projectId);
  const { data: issuesData } = useGetIssues({ project: projectId, limit: 200 });
  const { data: tasks = [] } = useGetProjectTasks(projectId);

  const issues = issuesData?.data ?? [];

  const issueStats = useMemo(() => ({
    total: issues.length,
    open: issues.filter((i) => !["Resolved", "Closed"].includes(i.status)).length,
    resolved: issues.filter((i) => ["Resolved", "Closed"].includes(i.status)).length,
    critical: issues.filter((i) => i.priority === "Critical").length,
  }), [issues]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === "Done").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
  }), [tasks]);

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map((i) => <div key={i} className="h-24 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}
    </div>
  );

  if (!project) return null;

  const photoUrl = project.photo ? `http://localhost:5001${project.photo}` : null;

  return (
    <div className="space-y-6">
      {/* Project Summary Card */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt={project.name} className="h-16 w-16 rounded-xl object-cover border border-[var(--border)] shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-2xl shrink-0">
                {project.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{project.name}</h2>
                <Badge variant={project.isActive ? "default" : "secondary"}
                  className={`text-[10px] font-bold ${project.isActive ? "bg-[var(--success)] text-white border-0" : ""}`}>
                  {project.isActive ? "Active" : "Inactive"}
                </Badge>
                {project.projectType?.map((t) => (
                  <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">{t}</span>
                ))}
              </div>

              {project.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">{project.description}</p>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Completion</span>
                  <span className="font-semibold text-[var(--primary)]">{project.completion ?? 0}%</span>
                </div>
                <Progress value={project.completion ?? 0} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={AlertCircle} label="Open Issues" value={issueStats.open} />
        <StatCard icon={CheckCircle2} label="Resolved Issues" value={issueStats.resolved} />
        <StatCard icon={CheckSquare} label="Total Tasks" value={taskStats.total} />
        <StatCard icon={BarChart3} label="Tasks Done" value={`${taskStats.done}/${taskStats.total}`} />
      </div>

      {/* Two-column: Info + Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Start Date</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtDate(project.startDate)}</span>
            </div>
            <Separator className="bg-[var(--border)]" />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">End Date</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtDate(project.endDate)}</span>
            </div>
            <Separator className="bg-[var(--border)]" />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Total Issues</span>
              <span className="font-semibold text-[var(--text-primary)]">{issueStats.total}</span>
            </div>
            <Separator className="bg-[var(--border)]" />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Critical Issues</span>
              <span className={`font-semibold ${issueStats.critical > 0 ? "text-red-500" : "text-[var(--text-primary)]"}`}>{issueStats.critical}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Users className="h-4 w-4" /> Main Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(project.mainContact?.name || project.mainContact?.email || project.mainContact?.phone) ? (
              <div className="space-y-3">
                {project.mainContact.name && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold shrink-0">
                      {project.mainContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{project.mainContact.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Primary Contact</p>
                    </div>
                  </div>
                )}
                {project.mainContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                    <a href={`mailto:${project.mainContact.email}`} className="text-[var(--primary)] hover:underline truncate">
                      {project.mainContact.email}
                    </a>
                  </div>
                )}
                {project.mainContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                    <span className="text-[var(--text-primary)]">{project.mainContact.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No contact information set.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack */}
      {project.techStack?.length > 0 && (
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span key={tech} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                  {tech}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Issues */}
      {issues.length > 0 && (
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {issues.slice(0, 5).map((issue) => (
              <div key={issue._id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${issue.priority === "Critical" ? "bg-red-500" : issue.priority === "High" ? "bg-orange-500" : issue.priority === "Medium" ? "bg-yellow-400" : "bg-green-500"}`} />
                  <span className="text-sm text-[var(--text-primary)] truncate">{issue.title}</span>
                </div>
                <span className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 ml-2">{issue.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project, isLoading } = useGetProjectById(projectId);
  const { data: allUsers = [] } = useGetAllUsers();

  const members = useMemo(() => {
    if (!project) return allUsers;
    if (Array.isArray(project.members) && project.members.length > 0 && typeof project.members[0] === "object") {
      return project.members as unknown as User[];
    }
    return allUsers;
  }, [project, allUsers]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-lg animate-pulse" />
        <div className="h-32 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderKanban className="h-12 w-12 text-[var(--text-tertiary)] mb-3" />
        <p className="text-base font-semibold text-[var(--text-primary)]">Project not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/projects")} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/projects")} className="gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] h-8 px-2">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Button>
        <span className="text-[var(--text-tertiary)]">/</span>
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</span>
          <Badge variant={project.isActive ? "default" : "secondary"}
            className={`text-[9px] font-bold ${project.isActive ? "bg-[var(--success)] text-white border-0" : ""}`}>
            {project.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Tabbed Layout */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="bg-[var(--background)] border border-[var(--border)] h-10">
          <TabsTrigger value="dashboard" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <CheckSquare className="h-4 w-4" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="crs" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <GitPullRequest className="h-4 w-4" /> CR
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <Ticket className="h-4 w-4" /> Issues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab projectId={projectId} members={members} />
        </TabsContent>

        <TabsContent value="crs">
          <CRTab projectId={projectId} members={members} />
        </TabsContent>

        <TabsContent value="issues">
          <IssuesTab projectId={projectId} members={members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
