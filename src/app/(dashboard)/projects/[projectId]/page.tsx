"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, FolderKanban, LayoutDashboard, CheckSquare,
  Calendar, Mail, Phone, Tag, Users, BarChart3,
  AlertCircle, CheckCircle2, GitPullRequest, Ticket, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/atoms/statCard";
import { useGetProjectById } from "@/api/services/project-management/project-service";
import { useGetIssues } from "@/api/services/issue-management/issue-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import { useGetProjectTasks } from "@/api/services/project-management/task-service";
import type { User } from "@/api/services/user-management/user-service";
import { TasksTab, CRTab, IssuesTab } from "./tabs";
import { GanttTab } from "./gantt-tab";
import { API_BASE_URL } from "@/lib/constants";

const STATIC_BASE = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtHms(decimalHours: number) {
  const totalSecs = Math.round(decimalHours * 3600);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return { h, m, s, label: `${h}h ${m}m ${s}s` };
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

  const photoUrl = project.photo ? `${STATIC_BASE}${project.photo}` : null;

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
                {project.stage && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    project.stage === "support"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                  }`}>
                    {project.stage === "support" ? "Support Stage" : "Development Stage"}
                  </span>
                )}
                {project.projectType?.map((t) => (
                  <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">{t}</span>
                ))}
              </div>

              {project.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">{project.description}</p>
              )}
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

      {/* Time Allocation — support stage only */}
      {project.stage === "support" && project.allocatedHours > 0 && (() => {
        const allocated = fmtHms(project.allocatedHours);
        const used = fmtHms(project.usedHours || 0);
        const remaining = fmtHms(Math.max(0, (project.allocatedHours) - (project.usedHours || 0)));
        const percent = Math.min(100, Math.round(((project.usedHours || 0) / project.allocatedHours) * 100));
        const isOver = (project.usedHours || 0) >= project.allocatedHours;
        const isWarning = percent >= 80 && !isOver;
        return (
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
                <Clock className="h-4 w-4" /> Monthly Time Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Allocated</p>
                  <p className="text-lg font-bold text-[var(--text-primary)] font-mono">{allocated.h}h {allocated.m}m</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono">{allocated.s}s</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Time Spent</p>
                  <p className={`text-lg font-bold font-mono ${isOver ? "text-red-500" : "text-[var(--text-primary)]"}`}>{used.h}h {used.m}m</p>
                  <p className={`text-[10px] font-mono ${isOver ? "text-red-400" : "text-[var(--text-tertiary)]"}`}>{used.s}s</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Remaining</p>
                  <p className={`text-lg font-bold font-mono ${isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-[var(--success)]"}`}>{remaining.h}h {remaining.m}m</p>
                  <p className={`text-[10px] font-mono ${isOver ? "text-red-400" : isWarning ? "text-amber-400" : "text-[var(--text-tertiary)]"}`}>{remaining.s}s</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--text-secondary)]">Usage</span>
                  <span className={isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-[var(--primary)]"}>{percent}%</span>
                </div>
                <div className="h-2.5 w-full bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {isOver && (
                  <p className="text-[10px] font-semibold text-red-500">⚠ Monthly allocation exceeded</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

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
              <Users className="h-4 w-4" /> Contact Points
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(() => {
              // Support both new array (mainContacts) and old single-object (mainContact)
              const contacts = Array.isArray(project.mainContacts) && project.mainContacts.length > 0
                ? project.mainContacts
                : project.mainContact && (project.mainContact.name || project.mainContact.email || project.mainContact.phone)
                  ? [project.mainContact]
                  : [];
              if (contacts.length === 0) {
                return <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No contact information set.</p>;
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contacts.map((c, i) => (
                    <div key={i} className="space-y-2 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                      {contacts.length > 1 && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Contact {i + 1}</p>
                      )}
                      {c.name && (
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                            {contacts.length === 1 && (
                              <p className="text-xs text-[var(--text-secondary)]">Contact</p>
                            )}
                          </div>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                          <a href={`mailto:${c.email}`} className="text-[var(--primary)] hover:underline truncate text-xs">{c.email}</a>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                          <span className="text-[var(--text-primary)] text-xs">{c.phone}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Assigned Members */}
      {Array.isArray(project.members) && project.members.length > 0 && (
        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Users className="h-4 w-4" /> Assigned Members
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.1)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                {project.members.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(project.members as any[]).map((m: any, i: number) => {
                const name: string = typeof m === "object" ? m.name : "—";
                const email: string = typeof m === "object" ? m.email : "";
                const role: string = typeof m === "object" ? m.role : "";
                const initial = name.charAt(0).toUpperCase();
                return (
                  <div
                    key={typeof m === "object" ? m._id : i}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)]"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</p>
                      {email && (
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">{email}</p>
                      )}
                    </div>
                    {role && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] shrink-0 capitalize whitespace-nowrap">
                        {role.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
          <TabsTrigger value="gantt" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <Calendar className="h-4 w-4" /> Gantt Chart
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

        <TabsContent value="gantt">
          <GanttTab projectId={projectId} members={members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
