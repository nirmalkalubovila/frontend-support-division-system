"use client";

import { use, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Users, Building, Activity, AlertCircle, 
  CheckCircle2, Clock, FileText, Download, TrendingUp, MoreVertical, Settings
} from "lucide-react";
import { 
  Button, Card, CardContent, CardHeader, CardTitle, Badge, 
  Progress, Avatar, AvatarFallback, AvatarImage, Tabs, TabsList, TabsTrigger, TabsContent,
  Separator
} from "@/components";
import { useGetProjectById } from "@/api/services/projects/project-service";
import useSessionStore from "@/store/session-store";

export default function ProjectDashboard({ params }: { params: Promise<{ projectId: string }> }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  
  const { data: project, isLoading } = useGetProjectById(projectId);
  const { userInfo } = useSessionStore();
  const role = userInfo?.role || "intern";
  
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Loading project dashboard...</div>;
  }

  if (!project) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Project not found</h2>
        <Link href="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  // Mock data for dashboard components that aren't in the DB schema yet
  const mockTeam = [
    { name: "Alice Smith", role: "Project Manager", initials: "AS", active: true },
    { name: "Bob Johnson", role: "Tech Lead", initials: "BJ", active: true },
    { name: "Charlie Davis", role: "Senior Engineer", initials: "CD", active: true },
    { name: "Dave Evans", role: "Intern", initials: "DE", active: false },
  ];
  
  const mockIssues = [
    { id: "ISS-102", title: "API Authentication failing on staging", priority: "High", status: "Open", assignee: "Bob Johnson", sla: "2h remaining" },
    { id: "ISS-105", title: "Update dashboard layout for mobile", priority: "Medium", status: "In Progress", assignee: "Charlie Davis", sla: "1d remaining" },
    { id: "ISS-108", title: "Database index optimization", priority: "Low", status: "Backlog", assignee: "Unassigned", sla: "5d remaining" },
  ];

  const mockTimeline = [
    { id: 1, action: "Issue ISS-105 moved to In Progress", time: "2 hours ago", user: "Charlie Davis" },
    { id: 2, action: "Sprint planning document uploaded", time: "1 day ago", user: "Alice Smith" },
    { id: 3, action: "Project status changed to Active", time: "3 days ago", user: "Bob Johnson" },
  ];

  // Calculations
  const hoursUsed = project.usedHours || 0;
  const hoursAlloc = project.allocatedHours || 0;
  const hoursRemaining = Math.max(0, hoursAlloc - hoursUsed);
  const overrun = hoursUsed > hoursAlloc ? hoursUsed - hoursAlloc : 0;
  const progressPercent = hoursAlloc ? Math.min(100, (hoursUsed / hoursAlloc) * 100) : 0;
  
  const totalIssues = (project.openIssues || 0) + (project.closedIssues || 0);
  const openIssues = project.openIssues || 0;
  const closedIssues = project.closedIssues || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
            <Badge variant={project.status === "Active" ? "default" : "secondary"}>{project.status}</Badge>
            {overrun > 0 && <Badge variant="destructive">Over budget</Badge>}
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mt-1">
            <span className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> {project.client || "No Client"}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> 
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : "TBD"} - 
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : "TBD"}
            </span>
          </div>
        </div>
        
        {/* Role-based actions */}
        {(role === "super_admin" || role === "manager" || role === "senior_engineer") && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            {(role === "super_admin" || role === "manager") && (
              <Button size="sm" className="gap-2 bg-[var(--primary)] text-white">
                <Settings className="h-4 w-4" /> Configure
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[var(--surface-hover)] p-1 rounded-lg">
          <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-[var(--surface)]">Overview</TabsTrigger>
          <TabsTrigger value="issues" className="rounded-md data-[state=active]:bg-[var(--surface)]">Issues</TabsTrigger>
          {(role === "super_admin" || role === "manager") && (
            <TabsTrigger value="team" className="rounded-md data-[state=active]:bg-[var(--surface)]">Team & Budget</TabsTrigger>
          )}
          <TabsTrigger value="documents" className="rounded-md data-[state=active]:bg-[var(--surface)]">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Total Issues</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{totalIssues}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Open Issues</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--warning)]">{openIssues}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-[var(--warning)]" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Hours Used</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{hoursUsed} <span className="text-sm font-normal text-[var(--text-tertiary)]">/ {hoursAlloc}</span></p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[var(--primary)]" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">SLA Compliance</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--success)]">94%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Analytics & Budget */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Budget & Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Budget Utilization</span>
                      <span className="font-medium text-[var(--text-primary)]">{progressPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercent} className={`h-2.5 ${overrun > 0 ? "[&>div]:bg-red-500" : ""}`} />
                    {overrun > 0 && <p className="text-xs text-red-500 mt-1">Overrun by {overrun} hours</p>}
                  </div>
                  
                  <Separator className="bg-[var(--border)]" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-3 text-[var(--text-secondary)]">Issue Status Distribution</p>
                      <div className="flex h-4 w-full rounded-full overflow-hidden">
                        <div className="bg-[var(--success)]" style={{ width: `${totalIssues ? (closedIssues/totalIssues)*100 : 0}%` }}></div>
                        <div className="bg-[var(--warning)]" style={{ width: `${totalIssues ? (openIssues/totalIssues)*100 : 0}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--success)]"></div> Closed</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--warning)]"></div> Open</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-3 text-[var(--text-secondary)]">Priority Breakdown (Mock)</p>
                      <div className="flex h-4 w-full rounded-full overflow-hidden">
                        <div className="bg-red-500" style={{ width: "20%" }}></div>
                        <div className="bg-orange-400" style={{ width: "50%" }}></div>
                        <div className="bg-blue-400" style={{ width: "30%" }}></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> High</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Med</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Low</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Issues Table */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Active Issues</CardTitle>
                  <Button variant="ghost" size="sm" className="text-[var(--primary)] h-8">View All</Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--surface-hover)]">
                        <tr>
                          <th className="px-4 py-3 rounded-l-lg">ID</th>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Priority</th>
                          <th className="px-4 py-3">Assignee</th>
                          <th className="px-4 py-3">SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockIssues.map((issue) => (
                          <tr key={issue.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]">
                            <td className="px-4 py-3 font-medium text-[var(--primary)]">{issue.id}</td>
                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{issue.title}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={
                                issue.priority === 'High' ? 'text-red-500 border-red-200 bg-red-50' : 
                                issue.priority === 'Medium' ? 'text-orange-500 border-orange-200 bg-orange-50' : 
                                'text-blue-500 border-blue-200 bg-blue-50'
                              }>{issue.priority}</Badge>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">{issue.assignee}</td>
                            <td className="px-4 py-3 text-xs font-medium text-orange-600 flex items-center gap-1.5 mt-1">
                              <Clock className="w-3.5 h-3.5" /> {issue.sla}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Team Allocation */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Team Allocation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockTeam.map((member, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-[var(--surface-hover)]">{member.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{member.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{member.role}</p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${member.active ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Client Info */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Client</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{project.client || "Not Specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Contact Details</p>
                    <p className="text-sm text-[var(--text-secondary)]">{project.clientContact || "Not Specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Project Types</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.projectTypes?.length ? project.projectTypes.map((pt: string) => (
                        <Badge key={pt} variant="secondary" className="text-[10px]">{pt}</Badge>
                      )) : <span className="text-sm text-[var(--text-secondary)]">None</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border)] before:to-transparent">
                    {mockTimeline.map((item) => (
                      <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[var(--primary)] bg-[var(--surface)] shrink-0 z-10 shadow"></div>
                        <div className="w-[calc(100%-2rem)] ml-4">
                          <p className="text-xs font-medium text-[var(--text-primary)]">{item.action}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-[var(--text-secondary)]">{item.time}</p>
                            <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
                            <p className="text-[10px] text-[var(--text-secondary)]">{item.user}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <Card className="bg-[var(--surface)] border-[var(--border)] p-8 text-center">
             <AlertCircle className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-4" />
             <h3 className="text-lg font-medium text-[var(--text-primary)]">Full Issue Tracking</h3>
             <p className="text-sm text-[var(--text-secondary)] mt-1">Detailed Kanban and list views would be implemented here.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="team" className="mt-6">
          <Card className="bg-[var(--surface)] border-[var(--border)] p-8 text-center">
             <Users className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-4" />
             <h3 className="text-lg font-medium text-[var(--text-primary)]">Resource Management</h3>
             <p className="text-sm text-[var(--text-secondary)] mt-1">Detailed capacity planning and utilization metrics would be implemented here.</p>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="bg-[var(--surface)] border-[var(--border)] p-8 text-center">
             <FileText className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-4" />
             <h3 className="text-lg font-medium text-[var(--text-primary)]">Project Documentation</h3>
             <p className="text-sm text-[var(--text-secondary)] mt-1">Contracts, specifications, and client assets would be listed here.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
