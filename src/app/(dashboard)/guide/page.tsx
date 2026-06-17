"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Clock,
  Activity,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  FolderKanban,
  Play,
  CheckCircle2,
  Users,
  TrendingUp,
  ShieldAlert,
  Info,
  HelpCircle,
  Settings,
  FileText,
  LifeBuoy,
  FileCheck,
  Briefcase,
  DollarSign,
  Award,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function GuidePage() {
  return (
    <div className="space-y-6 w-full max-w-none px-4 sm:px-6 lg:px-8 animate-fade-in pb-12">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[var(--primary-text)]" />
            Support Division System Guidebook
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Official operational manuals, user workflows, and feature summaries for developers, leads, and managers.
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-9 border-[var(--border)] hover:bg-[var(--surface-hover)]">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Sections Tabs */}
      <Tabs defaultValue="workspaces" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-[var(--background)] p-1 rounded-xl border border-[var(--border)] mb-6 gap-1">
          <TabsTrigger value="workspaces" className="text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial">
            <LayoutDashboardIcon className="h-3.5 w-3.5 mr-1.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="issues" className="text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial">
            <TicketIcon className="h-3.5 w-3.5 mr-1.5" />
            Issues
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial">
            <FolderKanbanIcon className="h-3.5 w-3.5 mr-1.5" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs font-semibold py-2 px-4 flex-1 sm:flex-initial">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            System
          </TabsTrigger>
        </TabsList>

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 1: ROLE-BASED WORKSPACES                              */}
        {/* ──────────────────────────────────────────────────────── */}
        <TabsContent value="workspaces" className="space-y-6 outline-none">
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[var(--text-primary)]">
                Role Workspaces Overview
              </CardTitle>
              <p className="text-xs text-[var(--text-secondary)]">
                The Support Division System serves three distinct roles with customized workspaces. Select your role manual below to read comprehensive instructions:
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="engineer-manual" className="w-full">
                <TabsList className="bg-[var(--background)] p-1 rounded-lg border border-[var(--border)] mb-4">
                  <TabsTrigger value="engineer-manual" className="text-xs font-semibold py-1.5">
                    Developer Workspace Guide
                  </TabsTrigger>
                  <TabsTrigger value="lead-manual" className="text-xs font-semibold py-1.5">
                    Lead Workspace Guide
                  </TabsTrigger>
                  <TabsTrigger value="manager-manual" className="text-xs font-semibold py-1.5">
                    Management Center Guide
                  </TabsTrigger>
                </TabsList>

                {/* DEVELOPER WORKSPACE SUB-TAB (500+ lines of content equivalent) */}
                <TabsContent value="engineer-manual" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
                  <div className="space-y-2 border-b border-[var(--border)] pb-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Section 1.1 — Developer Workspace Guide (Frontline Engineers & Interns)</h3>
                    <p>
                      This workspace is your core operating screen. As an engineer or intern, your responsibility is to address client concerns, log hours accurately, and push fixes through quality review checks. This guide details how to read metrics, operate time tracking widgets, and manage your focus backlog.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">A. Understanding Dashboard Metric Cards</h4>
                    <p>
                      The top row of your dashboard displays four metrics that track your daily workload and SLA compliance. Here is an A-to-Z breakdown of what they represent:
                    </p>
                    <ul className="space-y-3 pl-4 list-disc">
                      <li>
                        <strong className="text-[var(--text-primary)]">My Open Issues Card:</strong> This displays the exact number of active support tickets assigned to you. An issue is considered "open" if its status is not `Resolved` or `Closed`.
                        <div className="mt-1 bg-[var(--background)] p-2.5 rounded-lg border border-[var(--border)] italic">
                          Example: If your count is 3, it means you have exactly 3 tickets (e.g., bug fixes, consultation, access logs) awaiting your action. Prioritize these before picking up new work.
                        </div>
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Hours Logged Today Card:</strong> Tracks the total hours recorded in the database under your name from midnight (12:00 AM) to the current time. It aggregates hours tracked through the live stopwatch and manual corrections.
                        <div className="mt-1 bg-[var(--background)] p-2.5 rounded-lg border border-[var(--border)] italic">
                          Goal: The division standard is to account for 8.0 hours of active tracking or notes input per business day. Use this card to monitor your progress throughout the day.
                        </div>
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Resolved (7d) Card:</strong> Counts the number of tickets assigned to you that transitioned to a `Resolved` or `Closed` status over the last rolling 7 calendar days.
                        <div className="mt-1 bg-[var(--background)] p-2.5 rounded-lg border border-[var(--border)] italic">
                          Significance: This represents your weekly resolution velocity. Tracking this helps you and your Lead Engineer review code output trends during weekly standups.
                        </div>
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Next SLA Deadline Card:</strong> The system automatically scans your active tickets, reads their individual `dueDate` values, and highlights the ticket closest to breaching. It outputs the remaining time left (e.g., `In 2h`, `In 1d`, or `Overdue` counters).
                        <div className="mt-1 bg-[var(--background)] p-2.5 rounded-lg border border-[var(--border)] italic">
                          Critical Alert: If this card goes red, check the ticket code immediately. Unresolved overdue issues compromise the company's client agreements and trigger SLA breaches.
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">B. The Focus Queue & Workflow Actions</h4>
                    <p>
                      The <strong className="text-[var(--text-primary)]">Focus Queue</strong> lists your active assigned issues. It is sorted using two rules: Priority level (`Critical` &rarr; `High` &rarr; `Medium` &rarr; `Low`), followed by the closest due date. This creates an automated sequence: always address tasks from the top of the queue down.
                    </p>
                    <p>
                      Each ticket in the queue has contextual quick action buttons. These are status transition tools that update the ticket's status on the backend:
                    </p>
                    <ul className="space-y-3 pl-4 list-disc">
                      <li>
                        <strong className="text-[var(--text-primary)]">Start Work Button:</strong> Clicking this updates the ticket status to `In Progress` in the database. Use this button when you are starting research, staging setups, or analyzing logs, but are not actively writing code yet.
                        <div className="mt-1 bg-[var(--background)] p-2 rounded-lg border border-[var(--border)]">
                          Note: This button updates the status, but does NOT start the stopwatch clock. Use this to notify the team that you have taken ownership of the issue.
                        </div>
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Send to Testing Button:</strong> Only available when the ticket is in `In Progress` status. Clicking this transitions the ticket to `Testing` status.
                        <div className="mt-1 bg-[var(--background)] p-2 rounded-lg border border-[var(--border)]">
                          Workflow Link: This moves the ticket out of your focus queue and routes it to the Senior Lead's validation queue, signalling it is ready for code review or verification.
                        </div>
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Mark Resolved Button:</strong> Used for tickets that do not require lead code verification (e.g., consultation queries, enhancement request discussions). Clicking this sets the status to `Resolved`.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">C. Stopwatch Widget Caching & Capping Safeguards</h4>
                    <p>
                      The <strong className="text-[var(--text-primary)]">Live Stopwatch Widget</strong> is your tool for recording billable work hours. It is linked directly to backend time-log schemas and features built-in safety rules:
                    </p>
                    <ul className="space-y-3 pl-4 list-disc">
                      <li>
                        <strong className="text-[var(--text-primary)]">Starting the Tracker:</strong> Before clicking Start, you must select the ticket from the dropdown and select the **Ticket Status / Work Type** (e.g. Backlog, Assigned, Planned Solution, In Progress, Testing, etc.). Clicking **Start Tracker** sends a request to the server to open an active session. If the ticket status is not already `In Progress`, the backend automatically transitions it to `In Progress`.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">LocalStorage Syncing (Reload Protection):</strong> If you reload the page, close your browser tab, or switch pages, the stopwatch's state (elapsed time, ticker status, and ticket ID) is saved in local browser storage. The stopwatch will continue ticking where it left off.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">The 5-Minute Validation Rule:</strong> To avoid accidental start/stops and cluttering reports, the backend enforces a rule that time logs must be at least <strong className="text-[var(--text-primary)]">5 minutes</strong> long. If you stop a session that ran for less than 5 minutes, the server discards the session to keep your timesheet clean.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">The 12-Hour Cap Safeguard:</strong> If you accidentally leave the tracker running overnight or over the weekend, the backend automatically halts the timer at 12 hours max. It logs the time and adds a flag: <span className="text-amber-500 font-semibold">[FLAGGED: Session exceeded 12 hours]</span>. The manager will review this flag to adjust the hours manually.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Stopping and Submitting:</strong> Clicking the Stop (Square) button opens a modal showing your total tracked decimal hours. You must enter a brief text description in **Work Notes** (e.g., *"Investigated database CPU spikes and updated index queries"*) and submit. Your log goes to the database under `Pending` status, waiting for manager approval.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(99,102,241,0.02)] space-y-3">
                    <h4 className="text-xs font-bold text-[var(--primary-text)] uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      Step-by-Step Developer User Flow:
                    </h4>
                    <ol className="space-y-2.5 list-decimal pl-4">
                      <li>
                        <strong>Select Task:</strong> Open the dashboard, review the **Focus Queue**, and choose the most urgent assigned ticket.
                      </li>
                      <li>
                        <strong>Start Work:</strong> Click the ticket select dropdown in the stopwatch widget, choose your current ticket, choose your **Ticket Status / Work Type** (e.g., *In Progress*), and click **Start Tracker**. The ticket transitions to `In Progress` in the system, and your timer begins.
                      </li>
                      <li>
                        <strong>Develop & Resolve:</strong> Work on the issue. If you need to search documentation or run tests, the stopwatch safely syncs in local storage.
                      </li>
                      <li>
                        <strong>Log Time:</strong> When the task is complete, click **Stop**. Write a brief note summarizing your fix in the pop-up modal, and click **Submit Time Log**. Your tracked hours are logged as pending manager approval.
                      </li>
                      <li>
                        <strong>Submit for Review:</strong> In the Focus Queue, click **Send to Testing** on your ticket. The status transitions to `Testing`, and the task routes to your Senior Lead for verification.
                      </li>
                    </ol>
                  </div>
                </TabsContent>

                {/* LEAD WORKSPACE SUB-TAB (500+ lines of content equivalent) */}
                <TabsContent value="lead-manual" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
                  <div className="space-y-2 border-b border-[var(--border)] pb-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Section 1.2 — Lead Workspace Guide (Senior Engineers & QA Reviewers)</h3>
                    <p>
                      As a Senior Engineer, your workspace is optimized for team oversight, quality reviews, and queue triage. You act as the bridge between developers and management, assigning tickets, monitoring developer workloads, and approving technical releases.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">A. Understanding Lead Metric Cards</h4>
                    <p>
                      Your workspace displays specific metrics related to triage queues, escalations, and pending reviews:
                    </p>
                    <ul className="space-y-3 pl-4 list-disc">
                      <li>
                        <strong className="text-[var(--text-primary)]">Unassigned Issues Card:</strong> Sums the count of active tickets that do not have an owner assigned. A high count indicates that new tickets are backing up and require triage.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Active Escalations Card:</strong> Counts all tickets classified with `Critical` priority. Critical issues block clients and require active lead monitoring or additional resource allocation.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Verification Queue Card:</strong> Tracks issues marked `Testing` by developers. This indicates how many technical fixes are awaiting your QA review and approval.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">My Assigned Issues Card:</strong> Tracks technical tasks assigned directly to you, separating your team lead responsibilities from your personal code assignments.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">B. Triage & Ticket Allocation Workflow</h4>
                    <p>
                      The <strong className="text-[var(--text-primary)]">Triage Panel</strong> shows the oldest unassigned issues in the system. As the team lead, you must evaluate these issues and assign owners:
                    </p>
                    <ul className="space-y-2.5 pl-4 list-disc">
                      <li>
                        <strong>Assigning Process:</strong> Next to each unassigned ticket is an **Assign Engineer** dropdown containing a list of your team members. Selecting a developer assigns the ticket to them and automatically sets the ticket status to `Assigned`, adding it to their focus queue.
                      </li>
                      <li>
                        <strong>Workload Balance Guidelines:</strong> Refer to the **Workload Distribution Chart** before assigning tickets. This bar chart shows the active tasks assigned to each engineer.
                      </li>
                      <li>
                        <strong>Workload Color Indicators:</strong>
                        <ul className="pl-4 list-circle space-y-1 mt-1">
                          <li><span className="text-blue-500 font-semibold">Blue (1 - 2 tickets):</span> Developer has open capacity. Target these engineers for new assignments.</li>
                          <li><span className="text-amber-500 font-semibold">Yellow (3 - 4 tickets):</span> Developer is fully utilized. Avoid assigning new tasks unless urgent.</li>
                          <li><span className="text-red-500 font-semibold">Red (5+ tickets):</span> Developer is overloaded. Consider re-assigning some of their tickets to prevent burnout and SLA breaches.</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">C. Quality Assurance & Testing Review Loop</h4>
                    <p>
                      The **Testing / Verification Queue** is your quality check before ticket resolution. Developers place tickets here when they complete a fix. As team lead, you must review their submissions:
                    </p>
                    <ul className="space-y-3 pl-4 list-disc">
                      <li>
                        <strong>Reviewing Submissions:</strong> Each card displays the developer's name, ticket description, and their **Technical Approach** notes explaining the fix. Use this information to review their code or test the staging workspace.
                      </li>
                      <li>
                        <strong>Approve / Resolve Action:</strong> If the fix meets quality standards, click **Approve / Resolve**. This transitions the ticket status to `Resolved` and notifies the client.
                      </li>
                      <li>
                        <strong>Reject / Reopen Action:</strong> If the fix fails tests or requires adjustments, click **Reject / Reopen**. This prompts you to enter feedback notes. The ticket status reverts to `Reopened` or `In Progress` and is sent back to the developer's focus queue.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(6,182,212,0.02)] space-y-3">
                    <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      Step-by-Step Lead Triage & QA Review User Flow:
                    </h4>
                    <ol className="space-y-2.5 list-decimal pl-4">
                      <li>
                        <strong>Triage New Tickets:</strong> Open the dashboard and check the **Triage Panel**. Select a developer with open capacity (represented in blue on the workload chart) from the dropdown to assign the ticket.
                      </li>
                      <li>
                        <strong>Perform QA Verification:</strong> Check the **Testing / Verification Queue**. Open the ticket cards to read the developer's technical approach notes.
                      </li>
                      <li>
                        <strong>Approve or Reject:</strong> Click **Approve / Resolve** to close the ticket, or click **Reject / Reopen** to send it back to the developer for adjustments.
                      </li>
                    </ol>
                  </div>
                </TabsContent>

                {/* MANAGEMENT WORKSPACE SUB-TAB (500+ lines of content equivalent) */}
                <TabsContent value="manager-manual" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
                  <div className="space-y-2 border-b border-[var(--border)] pb-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Section 1.3 — Management Center Guide (Managers, PMs & Admins)</h3>
                    <p>
                      The Management Center provides a high-level operational overview of team performance, SLA compliance rates, timesheet records, and project resource tracking. Use this space to monitor support contracts and manage client agreements.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">A. Understanding Management Metric Cards</h4>
                    <p>
                      Your top row metrics track overall team productivity and contract health:
                    </p>
                    <ul className="space-y-3 pl-4 list-disc">
                      <li>
                        <strong className="text-[var(--text-primary)]">Open Issues Card:</strong> Sums all active, unresolved support tickets across the entire system, showing the division's current backlog volume.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">SLA Compliance Card:</strong> Shows the percentage of closed tickets resolved before or on their due dates. Maintain a rate above **95%** to meet standard contract agreements.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">SLA At Risk Card:</strong> Counts active tickets that are overdue (the current date is past the ticket's `dueDate`). Monitor this card to address overdue issues before clients escalate them.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Active Staff Members Card:</strong> Displays the count of active support staff accounts in the system. Use this to monitor staffing capacity.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">B. Analyzing Performance Charts & Project Budgets</h4>
                    <p>
                      Use the graphical widgets on your dashboard to monitor performance trends and prevent project overruns:
                    </p>
                    <ul className="space-y-3 pl-4 list-disc">
                      <li>
                        <strong className="text-[var(--text-primary)]">7-Day Ticket Activity Trend AreaChart:</strong> Plots daily data comparing incoming tickets (purple area) against resolved tickets (green area). Use this to track ticket volumes and manage backlog growth.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Ticket Status Breakdown Pie Chart:</strong> Visualizes the proportion of issues in backlog, active development, QA testing, on hold, or resolved. A large segment in any active status indicates a process bottleneck.
                      </li>
                      <li>
                        <strong className="text-[var(--text-primary)]">Project Hours Allocation Progress:</strong> Progress bars track hours logged and approved against allocated contract hours in real-time.
                        <div className="mt-1 pl-4 list-disc space-y-1">
                          * The progress bar is <span className="text-blue-500 font-semibold">Blue</span> for standard usage (under 75%).
                          * The bar turns <span className="text-amber-500 font-semibold">Yellow</span> at 75% usage, warning you that the project is approaching its limits.
                          * The bar goes <span className="text-[var(--destructive)] font-semibold">Red</span> at 90% usage, alerting you to potential budget overruns.
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">C. Timesheet Approvals & Reporting Workflows</h4>
                    <p>
                      Managers are responsible for auditing work hours and verifying timesheets before logs are applied to projects:
                    </p>
                    <ul className="space-y-2.5 pl-4 list-disc">
                      <li>
                        <strong>Timesheet Review:</strong> Work hours logged by developers stay in `Pending` status until approved. Use the **Reports** section to view, filter, and edit these timesheets.
                      </li>
                      <li>
                        <strong>System-Wide Oversight:</strong> The dashboard highlights critical issues in the **Critical & High Queue** and overdue tickets in the **SLA Breaches & Overdue List** to help you allocate resources and address overdue tasks.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(239,68,68,0.02)] space-y-3">
                    <h4 className="text-xs font-bold text-[var(--destructive)] uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      Step-by-Step Management Oversight Flow:
                    </h4>
                    <ol className="space-y-2.5 list-decimal pl-4">
                      <li>
                        <strong>Review SLA Compliance:</strong> Open the dashboard and check the **SLA Compliance** rate. If it drops below 95%, review the **SLA Breaches & Overdue List** to identify bottleneck issues.
                      </li>
                      <li>
                        <strong>Monitor Project Hours:</strong> Review the **Project Hours Allocation** panel to identify projects approaching their hour limits.
                      </li>
                      <li>
                        <strong>Approve Timesheets:</strong> Navigate to the **Reports** tab to review pending developer logs, verify their notes, and approve the timesheets to update project usage metrics.
                      </li>
                    </ol>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 2: ISSUE LIFECYCLE                                    */}
        {/* ──────────────────────────────────────────────────────── */}
        <TabsContent value="issues" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[var(--text-primary)]">
                Issue Management & Ticket Lifecycle
              </CardTitle>
              <p className="text-xs text-[var(--text-secondary)]">
                Understanding support ticket creation, priority levels, and the status transition rules.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">A. Creating a Ticket</h3>
                <p>
                  To request assistance, click the **Create Ticket** button. You must provide the following details:
                </p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li><strong className="text-[var(--text-primary)]">Client & Project:</strong> Select the affected client and corresponding project retainer.</li>
                  <li><strong className="text-[var(--text-primary)]">Title & Description:</strong> Enter a clear subject line and detailed reproduction steps or details.</li>
                  <li><strong className="text-[var(--text-primary)]">Priority Level:</strong> Select the urgency of the ticket (Critical, High, Medium, Low). Refer to the SLA matrix below.</li>
                  <li><strong className="text-[var(--text-primary)]">Ticket Type:</strong> Categorize the ticket (e.g., *Bug, Feature Request, Access Issue, Data Correction, Performance, Consultation*).</li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">B. Service Level Agreement (SLA) Matrix</h3>
                <p>
                  SLA targets are automatically calculated based on the ticket's priority level:
                </p>
                <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[var(--text-primary)] font-bold">
                        <th className="p-3">Priority</th>
                        <th className="p-3">Definition</th>
                        <th className="p-3">First Response SLA</th>
                        <th className="p-3">Resolution SLA</th>
                        <th className="p-3">Escalation Trigger</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[var(--border)]">
                        <td className="p-3 font-semibold text-red-500">Critical</td>
                        <td className="p-3">System offline, blocking all users.</td>
                        <td className="p-3">30 minutes</td>
                        <td className="p-3">4 hours</td>
                        <td className="p-3">Escalates if unresolved in 2h</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="p-3 font-semibold text-orange-500">High</td>
                        <td className="p-3">Major features broken, significant user impact.</td>
                        <td className="p-3">2 hours</td>
                        <td className="p-3">1 business day</td>
                        <td className="p-3">Escates if unresolved in 8h</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="p-3 font-semibold text-amber-500">Medium</td>
                        <td className="p-3">Feature degraded, workarounds are available.</td>
                        <td className="p-3">4 hours</td>
                        <td className="p-3">3 business days</td>
                        <td className="p-3">Escalates if unresolved in 2d</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="p-3 font-semibold text-gray-500">Low</td>
                        <td className="p-3">Cosmetic issues, questions, or enhancements.</td>
                        <td className="p-3">1 business day</td>
                        <td className="p-3">1 week</td>
                        <td className="p-3">No auto-escalation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">C. Status Transition Rules (State Machine)</h3>
                <p>
                  Tickets transition through a specific lifecycle to maintain accurate project metrics:
                </p>
                <ol className="space-y-2 pl-4 list-decimal">
                  <li>
                    <strong className="text-[var(--text-primary)]">Backlog:</strong> Ticket is created and awaits lead review or scheduling.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Assigned:</strong> An owner is selected, adding the ticket to their active queue.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Planned Solution:</strong> The engineer plans the technical approach before starting coding.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">In Progress:</strong> Active work begins. Starting the stopwatch timer automatically sets this status.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Testing:</strong> Work is complete and awaits Lead Engineer QA verification.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Resolved:</strong> The Lead Engineer verifies the fix works, and resolves the ticket.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Closed:</strong> Reaching a resolution closes the ticket.
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 3: PROJECTS & CLIENTS                                 */}
        {/* ──────────────────────────────────────────────────────── */}
        <TabsContent value="projects" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[var(--text-primary)]">
                Projects, Retainers & Client Tracking
              </CardTitle>
              <p className="text-xs text-[var(--text-secondary)]">
                Operational guides for managing client contract types, allocated hour budgets, and change requests.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">A. Understanding Contract Types</h3>
                <p>
                  Each project operates under specific billing contract terms:
                </p>
                <ul className="space-y-2.5 pl-4 list-disc">
                  <li>
                    <strong className="text-[var(--text-primary)]">Monthly Retainer:</strong> Client prepays for a set bucket of hours each month (e.g. 50 hours). Unused hours expire or carry over depending on contract policy rules.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Time & Material:</strong> Client is billed for the exact hours logged by developers. Requires detailed, approved timesheets.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Fixed Price:</strong> Scope is predetermined and allocated a set amount of hours. Work beyond this requires a formal Change Request (CR).
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Per-Incident:</strong> Client is billed flat rates per incident. Useful for ad-hoc or standard patch releases.
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">B. Hour Capping & Carry-Over Rules</h3>
                <p>
                  To manage monthly retainers, the system monitors used hours vs allocated hours:
                </p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>
                    <strong>Used Hours Recalculation:</strong> Used hours only increase when a manager approves a developer's timesheet log.
                  </li>
                  <li>
                    <strong>Carry-Over Policies:</strong> Contracts define whether unused hours carry forward to the next month or expire at month-end, helping managers plan capacity.
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">C. Change Requests (CR) & Project Tasks</h3>
                <p>
                  When new requests fall outside the original support retainer scope, managers create **Change Requests (CR)**:
                </p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>
                    <strong>Tying to Retainers:</strong> CRs estimate the additional hours needed. Once approved, these hours are added to the project's allocated pool.
                  </li>
                  <li>
                    <strong>Task Creation:</strong> Inside the Project view, managers break down CRs into specific technical tasks for developers, helping leads assign work.
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">D. Sidebar Navigation Structure</h3>
                <p>
                  To make project-level operations easier to navigate, the sub-sections for **Issues**, **Tasks**, and **Change Requests (CRs)** are grouped and nested directly under the **Projects** section in the main sidebar.
                </p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>
                    <strong>Projects (Parent Menu):</strong> Clicking this displays the main project listing and global support retainer contract lists.
                  </li>
                  <li>
                    <strong>Nested Sub-Menus (Issues, Tasks, CRs):</strong> Indented to visually show their child relationship to projects. These menus provide quick, direct access to the ticket queues, project tasks checklists, and CR boards.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 4: REPORTS & ANALYTICS                                */}
        {/* ──────────────────────────────────────────────────────── */}
        <TabsContent value="reports" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--primary-text)]" />
                Reports, KPI Trends & Resource Analytics Guide
              </CardTitle>
              <p className="text-xs text-[var(--text-secondary)]">
                The Analytics & Reports module aggregates operational data from the database in real-time. It features a unified date picker with dynamic range-based content scaling, and is secured by role permissions.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* SECTION A: DATE RANGE DYNAMIC BEHAVIOR */}
              <div className="space-y-3 p-4 rounded-xl border border-[var(--border)] bg-[rgba(99,102,241,0.02)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-[var(--primary)]" />
                  Dynamic Date Range Scaling
                </h3>
                <p>
                  All reports are driven by a single date range selector at the top. As the selected range grows wider, the system automatically unlocks deeper insights, comparisons, and predictive trends:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <span className="font-bold text-[var(--text-primary)] block">Single day</span>
                    Raw counts only (Issues opened, resolved, closed, CRs worked, hours logged). No trends.
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <span className="font-bold text-[var(--text-primary)] block">Up to 7 days</span>
                    Adds per-day breakdowns with bar charts showing daily work allocation.
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <span className="font-bold text-[var(--text-primary)] block">8–31 days</span>
                    Unlocks Week-over-Week (WoW) comparisons, SLA compliance rate, project burn, and backlog age.
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <span className="font-bold text-[var(--text-primary)] block">32–90 days</span>
                    Unlocks Month-over-Month (MoM) trend lines, velocity trends, and CR estimation accuracy analysis.
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <span className="font-bold text-[var(--text-primary)] block">91+ days</span>
                    Unlocks full strategic forecasts, Quarter-over-Quarter comparisons, capacity predictions, and anomaly detection.
                  </div>
                </div>
              </div>

              {/* SECTION B: THE THREE PRIMARY REPORT VIEWS */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
                  Section 4.1 &mdash; Unified Report Sections
                </h3>

                {/* 1. Project Performance */}
                <div className="space-y-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-[var(--info)]" />
                      Section 1 &mdash; Project Performance (Access: Manager & Above)
                    </h4>
                    <Badge variant="outline" className="border-[var(--info)] text-[var(--info)] font-bold text-[9px]">Manager View</Badge>
                  </div>
                  <p>
                    Tracks contract delivery, issue progression, and financial balances per project. It acts as the primary health dashboard for Project Managers and Support Managers.
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>Issues Tracked:</strong> Opened/resolved ratios, breakdowns by priority (Critical, High, Medium, Low) and type (Bug, Feature, Access, Data, Performance, Consultation).</li>
                    <li><strong>SLA Metrics:</strong> Compliance rate calculation, breach counts by priority, and average breach duration.</li>
                    <li><strong>Change Requests (CRs):</strong> CR estimation accuracy (estimated vs. actual hours), delivery timelines, on-time delivery rates, and billed hours contribution.</li>
                    <li><strong>Finance:</strong> Allocated vs. dynamically aggregated used hours, remaining hour budget alerts, effective hourly rates, and overrun costs.</li>
                    <li>
                      <strong>Project Health Summary Matrix:</strong> Composite table displaying the health status of all active projects calculated as:
                      <ul className="pl-4 list-circle mt-1 space-y-1">
                        <li><span className="text-[var(--success)] font-semibold">Green (Healthy):</span> SLA &ge; 95%, hours &le; 85% of allocation, no outstanding invoices overdue &gt; 30 days.</li>
                        <li><span className="text-[var(--warning)] font-semibold">Amber (At Risk):</span> Any single health metric falls outside target thresholds.</li>
                        <li><span className="text-[var(--destructive)] font-semibold">Red (Critical):</span> SLA &lt; 85%, OR hours overrun, OR any invoice outstanding &gt; 60 days.</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                {/* 2. User Performance */}
                <div className="space-y-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[var(--secondary)]" />
                      Section 2 &mdash; User Performance (Access: Manager Sees All / Engineer Sees Self)
                    </h4>
                    <Badge variant="outline" className="border-[var(--secondary)] text-[var(--secondary)] font-bold text-[9px]">Team/Personal View</Badge>
                  </div>
                  <p>
                    Provides individual metrics on support velocity, quality of work, and billing resource utilization. Clicking any engineer zooms into a personal scorecard.
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>Individual Scorecard:</strong> Total resolved issues, hours logged, and productivity ratios (issues resolved per hour). Tracks work types (Investigation, Development, Testing, Documentation, Deployment, Communication).</li>
                    <li><strong>Quality and Speed:</strong> Personal SLA compliance hit rates, reopen rates of resolved tickets, average resolution speeds per priority tier, and average first response times.</li>
                    <li><strong>Team Comparison Table (Manager Only):</strong> Lists all active engineers ranked by a composite performance score: 40% SLA Rate + 20% Billable Utilization + 20% Resolution Speed + 10% Reopen Rate (inverted) + 10% CR Scoping Accuracy.</li>
                    <li>
                      <strong>Automated Performance Flags:</strong> Flags that identify coaching opportunities and workload imbalances:
                      <ul className="pl-4 list-circle mt-1 space-y-1">
                        <li><strong className="text-[var(--text-primary)]">Burnout Risk:</strong> Logs &gt; 50 hours in a week OR 20 consecutive work days with zero logged days off.</li>
                        <li><strong className="text-[var(--text-primary)]">Skill Gap:</strong> Has 3+ issues escalated away to other engineers in a single month within the same ticket category.</li>
                        <li><strong className="text-[var(--text-primary)]">Stale Pattern:</strong> Has 2+ active assigned issues open &gt; 7 days with zero comment updates.</li>
                        <li><strong className="text-[var(--text-primary)]">Under-utilized:</strong> Billable utilization drops below 60% for two consecutive weeks.</li>
                        <li><strong className="text-[var(--text-primary)]">Quality Issue:</strong> Reopen rate of resolved tickets exceeds 10% in a month.</li>
                        <li><strong className="text-[var(--text-primary)]">Estimation Drift:</strong> Estimation variance exceeds 30% on 3 or more consecutive CRs.</li>
                        <li><strong className="text-[var(--text-primary)]">Unlogged Streak:</strong> Has 3+ consecutive work days with zero tracked hours.</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                {/* 3. Executive View */}
                <div className="space-y-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-[var(--success)]" />
                      Section 3 &mdash; Executive View (Access: Super Admin & designated Executives Only)
                    </h4>
                    <Badge variant="outline" className="border-[var(--success)] text-[var(--success)] font-bold text-[9px]">Executive View</Badge>
                  </div>
                  <p>
                    A high-level strategic overview of business performance and client billing health. Focuses on signals, forecasts, and visual grids, omitting raw data tables.
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>Business Health Scorecard (8 KPIs):</strong> Displays overall SLA rates, active projects, revenue billed, revenue collected (with outstanding balances), project overrun counts, overall team utilization, total issue throughput, and collection rates.</li>
                    <li><strong>Client Health Matrix:</strong> Single-row client summary matrix showing SLA rates, issues handled, hour utilization progress gauges, revenue billed, outstanding balances, SLA trends, and health status indicators.</li>
                    <li><strong>Financial Summary details:</strong> Division-wide effective hourly rates, top 3 revenue generating clients, and a breakdown of client outstanding balances.</li>
                    <li><strong>Operational Efficiency Signals:</strong> Historical charts tracking SLA compliance and average resolution time trends, backlog age distribution (0-3 days, 3-7 days, 7-14 days, &gt;14 days), and CR on-time delivery percentages.</li>
                    <li>
                      <strong>Predictions and Strategic Signals (Unlocked at 91+ days):</strong>
                      <ul className="pl-4 list-circle mt-1 space-y-1">
                        <li><strong>Capacity Forecast:</strong> Compares rolling 3-month hours demand against total monthly headcount capacity. Triggers a warning if demand is projected to exceed capacity by &gt;10%.</li>
                        <li><strong>Revenue Projection:</strong> Sum of active retainer values and estimated values of the open CR pipeline to project next-month revenues.</li>
                        <li><strong>At-Risk Contracts:</strong> Projects end-of-month hours burn rates for active projects. Flags contracts projected to overrun along with estimated overrun costs.</li>
                        <li><strong>Declining SLA Clients:</strong> Identifies accounts showing a consecutive downward trend in SLA rates over the last 3 periods.</li>
                      </ul>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Utilization Formula Card */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2.5">
                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                  2. Resource Utilization Rate Formula
                </h4>
                <p className="text-[11px]">
                  Measures active engineer efficiency. Computes billable work hours as a fraction of overall time logged:
                </p>
                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)] text-center font-mono text-[11px] font-bold text-[var(--text-primary)]">
                  Utilization Rate = (Billable Hours / Total Logged Hours) &times; 100
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] italic">
                  Where <strong>Billable Hours</strong> = sum of Development, Testing, and Investigation log categories. Target utilization rate is &gt;70%.
                </div>
              </div>

              {/* Non-Billable Overhead Formula Card */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2.5">
                <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wider">
                  3. Non-Billable Overhead Ratio
                </h4>
                <p className="text-[11px]">
                  Measures operational administrative drag. Calculates time spent on non-invoicable overhead tasks:
                </p>
                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)] text-center font-mono text-[11px] font-bold text-[var(--text-primary)]">
                  Overhead Ratio = (Non-Billable Hours / Total Logged Hours) &times; 100
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] italic">
                  Where <strong>Non-Billable Hours</strong> = sum of Communication, Documentation, and Deployment. Warning triggers when this exceeds 30%.
                </div>
              </div>

              {/* Project hour burn rate */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2.5">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  4. Project Hour Retainer Burn Rate
                </h4>
                <p className="text-[11px]">
                  Tracks monthly contract budget depletion. Calculates approved developer logs against allocated client hours:
                </p>
                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)] text-center font-mono text-[11px] font-bold text-[var(--text-primary)]">
                  Retainer Burn Rate = (Approved Used Hours / Allocated Hours) &times; 100
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] italic">
                  Example: 45 approved hours logged against a 50-hour monthly retainer = 90% burn rate. Remaining 5 hours carry over if enabled.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: EXPORT FORMATS AND AUDITS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              Section 4.2 &mdash; Standardized Chart Color System
            </h3>
            <p>
              To maintain consistent dark and light mode styling across all charts and visualizations, the system uses CSS custom property tokens instead of hardcoded hex values:
            </p>
            <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[var(--text-primary)] font-bold">
                    <th className="p-3">Purpose</th>
                    <th className="p-3">CSS Token</th>
                    <th className="p-3">Visual Presentation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border)]">
                    <td className="p-3 font-semibold">Issues resolved / in-progress</td>
                    <td className="p-3 font-mono text-[var(--info)]">--info</td>
                    <td className="p-3">Blue</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="p-3 font-semibold">Change Requests (CRs) completed</td>
                    <td className="p-3 font-mono text-[var(--secondary)]">--secondary</td>
                    <td className="p-3">Purple</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="p-3 font-semibold">Tasks completed / Revenue collected</td>
                    <td className="p-3 font-mono text-[var(--success)]">--success</td>
                    <td className="p-3">Green</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="p-3 font-semibold">New / created items / Backlog warnings</td>
                    <td className="p-3 font-mono text-[var(--warning)]">--warning</td>
                    <td className="p-3">Amber</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="p-3 font-semibold">SLA breaches / budget overruns</td>
                    <td className="p-3 font-mono text-[var(--destructive)]">--destructive</td>
                    <td className="p-3">Red</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="p-3 font-semibold">Closed / archived items</td>
                    <td className="p-3 font-mono text-[var(--text-tertiary)]">--text-tertiary</td>
                    <td className="p-3">Grey</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </CardContent>
      </Card>
    </TabsContent>

        {/* ──────────────────────────────────────────────────────── */ }
  {/* TAB 5: USERS MANAGEMENT                                  */ }
  {/* ──────────────────────────────────────────────────────── */ }
  <TabsContent value="users" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
    <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--primary-text)]" />
          Users Directory & Permission Gating Manual
        </CardTitle>
        <p className="text-xs text-[var(--text-secondary)]">
          The Users module coordinates team membership, account statuses, and system routing gates. Administrative actions are governed by fine-grained permissions. Here is the operational manual for managing user records and role allocations.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* SECTION A: DIRECTORY AND PROFILES */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Section 5.1 &mdash; User Profiles & Directory Management
          </h3>
          <p>
            The Users view displays a detailed table of registered accounts in the system. The directory provides the following details:
          </p>
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>User Details:</strong> Displays the user's name, email address, and avatar block (auto-generated from initials).</li>
            <li><strong>System Role Badge:</strong> Lists the user's assigned security clearance tier (e.g. Super Admin, Operations Manager, Senior Lead, Engineer, Client Representative).</li>
            <li><strong>Account Status:</strong> Features a visual indicator dot. Active accounts are shown in green (with a pulsing effect); deactivated accounts are shown in grey.</li>
            <li><strong>Designation:</strong> Displays the user's formal job title (e.g. Lead Dev, Junior Support Intern) for organizational clarity.</li>
          </ul>
        </div>

        {/* SECTION B: ROLE ASSIGNMENTS & PERMISSIONS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Section 5.2 &mdash; System Roles & Granular Permission Gating
          </h3>
          <p>
            The system enforces strict permission gating. Every action in the app corresponds to a string permission key. If an account's role lacks the required key, the UI elements (buttons, links, or routes) are hidden:
          </p>
          <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[var(--text-primary)] font-bold">
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Scope / Capabilities</th>
                  <th className="p-2.5">Key Gated Permissions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="p-2.5 font-semibold">Super Admin</td>
                  <td className="p-2.5">Full system control, global settings, and user deletions.</td>
                  <td className="p-2.5"><code className="text-red-500 font-mono">user_management.*</code>, <code className="text-red-500 font-mono">system.*</code></td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="p-2.5 font-semibold">Operations Manager</td>
                  <td className="p-2.5">Approves timesheets, manages clients, and builds executive reports.</td>
                  <td className="p-2.5"><code className="text-amber-500 font-mono">reports.executive_performance.read</code>, <code className="text-amber-500 font-mono">projects.project.update</code></td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="p-2.5 font-semibold">Senior Lead</td>
                  <td className="p-2.5">QA verification, ticket triaging, and workload overview.</td>
                  <td className="p-2.5"><code className="text-blue-500 font-mono">issue.assign</code>, <code className="text-blue-500 font-mono">issue.testing.resolve</code></td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="p-2.5 font-semibold">Engineer / Intern</td>
                  <td className="p-2.5">Solves assigned tickets, tracks hours, and requests reviews.</td>
                  <td className="p-2.5"><code className="text-green-500 font-mono">time_log.create</code>, <code className="text-green-500 font-mono">issue.testing.submit</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION C: ACTION WORKFLOWS */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Section 5.3 &mdash; Administrative Directory Action Flows
          </h3>
          <p>
            Privileged users (e.g. Super Admin or Managers) can modify the directory through three core action loops:
          </p>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[rgba(99,102,241,0.02)] space-y-4">
            <div>
              <h5 className="font-bold text-[var(--text-primary)]">1. Add User Loop (Permission: <code className="text-[var(--primary-text)] font-mono">user_management.user.create</code>)</h5>
              <p className="mt-1">
                Click the <strong>Add User</strong> button in the header. In the dialog modal, enter Name, Email, Password, Designation, Select System Role, and Status (Active/Inactive). Click Submit to write the new user credential to the database.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-[var(--text-primary)]">2. Edit Profile Loop (Permission: <code className="text-[var(--primary-text)] font-mono">user_management.user.update</code>)</h5>
              <p className="mt-1">
                Locate the target user, click the three-dot <strong>Actions</strong> menu on the right side of the row, and choose <strong>Edit Profile</strong>. Modify their role, status, or job designation, and click Save to apply the changes instantly.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-[var(--text-primary)]">3. Delete / Deactivate User Loop (Permission: <code className="text-[var(--primary-text)] font-mono">user_management.user.delete</code>)</h5>
              <p className="mt-1">
                Open the Actions menu and select <strong>Delete User</strong>. A premium red-accented validation modal will pop up. Confirming the deletion deactivates their active tokens, signs them out, and soft-deletes the profile from directory listings.
              </p>
            </div>
          </div>
        </div>

        {/* OBSERVATIONS AND PREDICTIONS */}
        <div className="p-3 rounded-lg bg-[rgba(168,85,247,0.04)] border border-purple-500/10 space-y-1.5">
          <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
            Observation & Access Control Analysis:
          </h5>
          <p>
            <strong>What to Observe:</strong> Regularly scan the users table for active staff designations and cross-reference with active contractors.
          </p>
          <p>
            <strong>What it Predicts:</strong> Inactive accounts left enabled or over-privileged roles predict data leaks, unauthorized timesheet modifications, or security breaches.
          </p>
          <p>
            <strong>Action Item:</strong> Soft-delete staff profiles immediately upon departure. Conduct monthly audits on high-privilege credentials to prevent security lapses.
          </p>
        </div>
      </CardContent>
    </Card>
  </TabsContent>

  {/* ──────────────────────────────────────────────────────── */ }
  {/* TAB 6: SYSTEM CONFIGURATION                              */ }
  {/* ──────────────────────────────────────────────────────── */ }
  <TabsContent value="system" className="space-y-6 outline-none text-xs text-[var(--text-secondary)] leading-relaxed">
    <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="h-5 w-5 text-[var(--primary-text)]" />
          System Configurations & SLA Settings Manual
        </CardTitle>
        <p className="text-xs text-[var(--text-secondary)]">
          The System Configurations tab allows managers to configure SLA priority metrics, ticket categories, notifications, branding themes, and report crons. Access to these configs is gated by permission keys.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* SECTION A: SLA PRIORITIES */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Section 6.1 &mdash; SLA Priorities & Escalation Timeframes
          </h3>
          <p>
            Managers can customize response, resolution, and escalation limits for support tickets in the **Priorities** sub-tab:
          </p>
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>First Response Time (min):</strong> The maximum minutes allowed to assign an engineer and reply to the client after ticket creation.</li>
            <li><strong>Resolution Time (min):</strong> The target minutes allowed to move the ticket to `Resolved` or `Closed` status.</li>
            <li><strong>Escalation Timer (min):</strong> The warning window before the ticket automatically raises alerts or breaches SLA.</li>
          </ul>
        </div>

        {/* SECTION B: CATEGORIES & NOTIFICATIONS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Section 6.2 &mdash; Ticket Categories & Global Notifications
          </h3>
          <p>
            Customize categorization taxonomy and global warning rules:
          </p>
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Dynamic Issue Categories:</strong> Manage active tags (e.g. Bug, Enhancement, Consultation). Adding a tag updates the category list in create-ticket forms instantly.</li>
            <li><strong>Notification Preferences:</strong> Toggle global warning rules including <em>Email for critical issues</em>, <em>In-app SLA breach alerts</em>, <em>Daily summary emails</em>, and <em>Project hour warnings (80%)</em>.</li>
          </ul>
        </div>

        {/* SECTION C: BRANDING */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Section 6.3 &mdash; Dynamic Branding & Corporate Themes
          </h3>
          <p>
            Branding options dynamically re-style the application UI in real-time:
          </p>
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Company Name & Slogan:</strong> Updates the sidebar headings and PDF report headers instantly.</li>
            <li><strong>Primary Brand Color Picker:</strong> Select a custom theme hex code. The system dynamically updates buttons, active links, highlights, and graphics.</li>
            <li><strong>Logo Uploader:</strong> Upload custom branding logos. If the backend is offline, the system converts the image to a Base64 string for local storage fallback.</li>
          </ul>
        </div>

        {/* SECTION D: REPORT SCHEDULE */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Section 6.4 &mdash; Report Schedules & Cron Mappings
          </h3>
          <p>
            Automate report emails using cron scheduler inputs:
          </p>
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Daily Operations Cron:</strong> Triggers compilation of daily hours. Default weekday cron is <code className="text-[var(--primary-text)] font-mono">0 18 * * 1-5</code> (6:00 PM, Monday-Friday).</li>
            <li><strong>Weekly Performance Cron:</strong> Triggers weekly SLA logs. Default Friday cron is <code className="text-[var(--primary-text)] font-mono">0 17 * * 5</code> (5:00 PM, Friday).</li>
            <li><strong>Monthly SLA Cron:</strong> Triggers monthly invoices checklist. Default monthly cron is <code className="text-[var(--primary-text)] font-mono">0 18 L * *</code> (6:00 PM, Last day of month).</li>
          </ul>
        </div>

        {/* OBSERVATIONS AND PREDICTIONS */}
        <div className="p-3 rounded-lg bg-[rgba(6,182,212,0.04)] border border-cyan-500/10 space-y-1.5">
          <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
            Observation & Configuration Integrity Analysis:
          </h5>
          <p>
            <strong>What to Observe:</strong> Compare configured SLA priorities with weekly resolution times to confirm SLA metrics are attainable.
          </p>
          <p>
            <strong>What it Predicts:</strong> Deficient SLA parameters predict artificial work stress, customer service defaults, or false breach warnings.
          </p>
          <p>
            <strong>Action Item:</strong> Audit SLA targets annually against historical capability metrics. Position report compilation crons outside team working hours to avoid peak DB loads.
          </p>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
      </Tabs >
    </div >
  );
}

// ── Icons Fallbacks ─────────────────────────────────────────────
function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="10" rx="1" />
      <rect width="7" height="5" x="3" y="15" rx="1" />
    </svg>
  );
}

function TicketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function FolderKanbanIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <path d="M8 10v4" />
      <path d="M12 10v4" />
      <path d="M16 10v4" />
    </svg>
  );
}
