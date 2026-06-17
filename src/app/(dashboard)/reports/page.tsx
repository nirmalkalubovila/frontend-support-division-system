"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, Calendar, FileText, TrendingUp, Users, DollarSign, Briefcase, 
  AlertTriangle, CheckCircle2, ShieldAlert, Award, Clock, ArrowUpRight, 
  HelpCircle, RefreshCw, BarChart2, Activity, Info, ArrowLeft
} from "lucide-react";
import { 
  Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, 
  Input, Label, Button, Badge 
} from "@/components";
import { useGetProjectPerformance } from "@/api/services/reports/performance-service";
import { useGetTeamComparison, useGetUserScorecard } from "@/api/services/reports/user-performance-service";
import useSessionStore from "@/store/session-store";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { toast } from "sonner";

export default function ReportsPage() {
  // Date range selectors (Default: Last 30 Days)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState<string>("30d");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const userInfo = useSessionStore((state) => state.userInfo);
  const userRole = userInfo?.role;
  const isManagerOrAdmin = userRole === "manager" || userRole === "super_admin";
  
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const { data, isLoading, isError, refetch } = useGetProjectPerformance(startDate, endDate);

  const { data: teamData, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useGetTeamComparison(
    startDate,
    endDate,
    isManagerOrAdmin && !selectedUserId
  );

  const { data: scorecardData, isLoading: scorecardLoading, isError: scorecardError, refetch: refetchScorecard } = useGetUserScorecard(
    startDate,
    endDate,
    selectedUserId || undefined,
    !isManagerOrAdmin || !!selectedUserId
  );

  // Compute days in selected range
  const getDaysCount = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1);
  };

  const daysCount = getDaysCount();

  // Helper presets
  const applyPreset = (presetName: string, days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setActivePreset(presetName);
  };

  const getRangeDescription = () => {
    if (daysCount === 1) return "";
    if (daysCount <= 7) return `Short-term view (${daysCount} days) — per-day breakdowns unlocked. Trends locked.`;
    if (daysCount <= 31) return `Medium-term view (${daysCount} days) — comparisons, SLA rates, project burn, backlog age unlocked.`;
    if (daysCount <= 90) return `Quarterly view (${daysCount} days) — month-over-month trend lines, estimation accuracy trend unlocked.`;
    return `Long-term view (${daysCount} days) — full capacity predictions & anomaly detection unlocked.`;
  };

  const isAnyLoading = isLoading || teamLoading || scorecardLoading;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
            Analytics & Reports
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Monitor division support performance metrics, workloads, client agreements, and resource utilization
          </p>
        </div>
      </div>

      {/* Range Picker and Presets bar */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[var(--text-secondary)]">Start Date</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset("custom");
                }} 
                className="h-9 w-40 text-xs bg-[var(--background)]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[var(--text-secondary)]">End Date</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset("custom");
                }} 
                className="h-9 w-40 text-xs bg-[var(--background)]"
              />
            </div>
            <div className="pt-5 flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setActivePreset("custom");
                  refetch();
                  refetchTeam();
                  refetchScorecard();
                }} 
                disabled={isAnyLoading}
                className="h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAnyLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-4 lg:pt-0">
            <Button 
              size="sm" 
              onClick={() => applyPreset("today", 0)} 
              className={`text-xs h-8 font-semibold transition-all ${
                activePreset === "today" 
                  ? "bg-[var(--success)] hover:bg-[var(--success)]/90 text-white border-[var(--success)] shadow-sm" 
                  : "border border-[var(--success)] text-[var(--success)] hover:bg-[var(--success-light)] hover:text-[var(--success)] bg-transparent"
              }`}
            >
              Today
            </Button>
            <Button 
              variant={activePreset === "7d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => applyPreset("7d", 6)} 
              className="text-xs h-8"
            >
              Last 7 Days
            </Button>
            <Button 
              variant={activePreset === "30d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => applyPreset("30d", 30)} 
              className="text-xs h-8"
            >
              Last 30 Days
            </Button>
            <Button 
              variant={activePreset === "90d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => applyPreset("90d", 90)} 
              className="text-xs h-8"
            >
              Last 90 Days
            </Button>
            <Button 
              variant={activePreset === "365d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => applyPreset("365d", 365)} 
              className="text-xs h-8"
            >
              Last Year
            </Button>
          </div>
        </div>

        {getRangeDescription() && (
          <div className="flex items-center gap-2 text-xs text-[var(--primary-text)] font-semibold p-2.5 rounded-lg bg-[var(--primary-light)] border border-[var(--primary-hover)]">
            <Info className="h-4 w-4 shrink-0" />
            <span>{getRangeDescription()}</span>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="project-performance" className="w-full">
        <TabsList className="bg-[var(--surface)] border border-[var(--border)] w-fit flex h-auto p-1 gap-1">
          <TabsTrigger value="project-performance" className="text-xs py-2 px-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Project Performance
          </TabsTrigger>
          <TabsTrigger value="user-performance" className="text-xs py-2 px-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Performance
          </TabsTrigger>
          <TabsTrigger value="executive-view" className="text-xs py-2 px-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Executive View
          </TabsTrigger>
        </TabsList>

        {/* ── SECTION 1: PROJECT PERFORMANCE ─────────────────────────────────── */}
        <TabsContent value="project-performance" className="mt-6 space-y-6">

          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
              <div className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
              <p className="text-sm text-[var(--text-secondary)] font-medium">Computing report performance analytics...</p>
            </div>
          ) : isError || !data ? (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center p-6">
              <ShieldAlert className="h-12 w-12 text-[var(--destructive)] mb-3" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to fetch report data</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Please verify that backend server is running and dates are correctly selected.</p>
              <Button onClick={() => refetch()} className="mt-4 bg-[var(--primary)] text-white">Retry Connection</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Overview Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all animate-slide-in">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Revenue Collected</span>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">LKR {data.finance.summary.collected.toLocaleString()}</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">Out of LKR {data.finance.summary.billed.toLocaleString()} billed</p>
                      </div>
                      <div className="p-3 bg-[var(--success-light)] rounded-xl text-[var(--success)]">
                        <DollarSign className="h-5 w-5 text-[var(--success)]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-xs font-semibold text-[var(--success)]">{data.finance.summary.collectionRate}%</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">collection efficiency</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all animate-slide-in">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">SLA Compliance</span>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{data.issues.slaMetrics.complianceRate}%</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">Issues closed within due dates</p>
                      </div>
                      <div className="p-3 bg-[var(--primary-light)] rounded-xl text-[var(--primary)]">
                        <Award className="h-5 w-5 text-[var(--primary-text)]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5">
                      <Badge className={`${data.issues.slaMetrics.complianceRate >= 95 ? "bg-[var(--success)] text-white" : "bg-[var(--warning)] text-white"} text-[10px]`}>
                        {data.issues.slaMetrics.complianceRate >= 95 ? "Healthy Target" : "Under Target"}
                      </Badge>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Threshold is 95%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all animate-slide-in">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">CR Estimation Accuracy</span>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{data.crs.accuracyMetrics.averageAccuracy}%</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">Over {data.crs.summary.completed} completed CRs</p>
                      </div>
                      <div className="p-3 bg-[var(--secondary-light)] rounded-xl text-[var(--secondary)]">
                        <TrendingUp className="h-5 w-5 text-[var(--secondary)]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-xs font-semibold text-[var(--secondary)]">{data.crs.accuracyMetrics.underestimatedCount} underestimated</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">CR estimation scope</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all animate-slide-in">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Live Risks</span>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{data.issues.slaMetrics.liveAtRiskCount + data.tasks.summary.liveOverdueCount} Items</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">SLA At-Risk issues & Overdue tasks</p>
                      </div>
                      <div className="p-3 bg-[var(--destructive-light)] rounded-xl text-[var(--destructive)]">
                        <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                      <Badge className="bg-[var(--destructive)] text-white text-[10px]">{data.issues.slaMetrics.liveAtRiskCount} Issues</Badge>
                      <Badge className="bg-[var(--warning)] text-white text-[10px]">{data.tasks.summary.liveOverdueCount} Overdue Tasks</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Accordion Panels for Details */}
              <div className="grid grid-cols-1 gap-6">
                
                {/* 1.1 ISSUES SECTION */}
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="border-b border-[var(--border)] py-4">
                    <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[var(--primary)]" />
                      1.1 — Support Issues Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Counts Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { label: "Opened Today", val: data.issues.summary.opened, border: "border-l-4 border-l-[var(--warning)]" },
                        { label: "In Progress", val: data.issues.summary.inProgress, border: "border-l-4 border-l-[var(--info)]" },
                        { label: "Resolved", val: data.issues.summary.resolved, border: "border-l-4 border-l-[var(--success)]" },
                        { label: "Closed", val: data.issues.summary.closed, border: "border-l-4 border-l-[var(--text-tertiary)]" },
                        { label: "Reopened", val: data.issues.summary.reopened, border: "border-l-4 border-l-[var(--destructive)]" },
                        { label: "On Hold", val: data.issues.summary.onHold, border: "border-l-4 border-l-orange-400" },
                      ].map((item, idx) => (
                        <div key={idx} className={`p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm ${item.border}`}>
                          <p className="text-xs text-[var(--text-secondary)] font-medium">{item.label}</p>
                          <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{item.val}</h4>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* SLA and Resolution Times */}
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-5">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <CheckCircle2 className="h-4.5 w-4.5 text-[var(--success)]" />
                          SLA & Resolution Performance
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Avg Resolution Time</span>
                            <h5 className="text-lg font-bold text-[var(--text-primary)]">{data.issues.resolutionMetrics.averageResolutionTimeHours} hrs</h5>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">P95 Resolution (Slowest 5%)</span>
                            <h5 className="text-lg font-bold text-[var(--text-primary)]">{data.issues.resolutionMetrics.p95ResolutionTimeHours} hrs</h5>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Median Resolution</span>
                            <h5 className="text-lg font-bold text-[var(--text-primary)]">{data.issues.resolutionMetrics.medianResolutionTimeHours} hrs</h5>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Avg SLA Breach Duration</span>
                            <h5 className="text-lg font-bold text-[var(--text-primary)]">{data.issues.slaMetrics.averageBreachDurationHours} hrs</h5>
                          </div>
                        </div>

                        {/* Priority SLA compliance rates */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Avg Resolution Speed per Priority</span>
                          <div className="space-y-2">
                            {Object.entries(data.issues.resolutionMetrics.averageResolutionTimeByPriority).map(([prio, val]) => (
                              <div key={prio} className="flex items-center justify-between text-xs p-2 rounded bg-[var(--surface)]">
                                <span className="font-medium">{prio}</span>
                                <span className="font-bold text-[var(--text-primary)]">{val} hrs</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Priorities & Types breakdowns */}
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-5">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <BarChart2 className="h-4.5 w-4.5 text-[var(--primary)]" />
                          Priority & Issue Type Breakdown
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Priority bar */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">By Priority</span>
                            <div className="space-y-2">
                              {Object.entries(data.issues.priorityBreakdown).map(([prio, count]) => (
                                <div key={prio} className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-medium">
                                    <span>{prio}</span>
                                    <span>{count}</span>
                                  </div>
                                  <div className="h-2 rounded bg-[var(--surface)] overflow-hidden">
                                    <div 
                                      className="h-full rounded" 
                                      style={{
                                        width: `${data.issues.summary.opened > 0 ? (count / data.issues.summary.opened) * 100 : 0}%`,
                                        backgroundColor: prio === "Critical" ? "var(--destructive)" : prio === "High" ? "var(--warning)" : prio === "Medium" ? "var(--info)" : "var(--text-tertiary)"
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Types list */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">By Category</span>
                            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2 select-none">
                              {Object.entries(data.issues.typeBreakdown).length === 0 ? (
                                <span className="text-xs text-[var(--text-tertiary)] italic">No issues raised</span>
                              ) : (
                                Object.entries(data.issues.typeBreakdown).map(([typeStr, count]) => (
                                  <div key={typeStr} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                                    <span className="font-medium text-[var(--text-secondary)]">{typeStr}</span>
                                    <Badge variant="outline" className="text-[10px] font-bold">{count}</Badge>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trend Block (Unlocked at 8+ days) */}
                    {daysCount >= 8 && data.issues.trend && (
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <TrendingUp className="h-4.5 w-4.5 text-[var(--primary)]" />
                          Issues Backlog Trend (New vs Resolved)
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.issues.trend}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                              <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Bar dataKey="new" name="Opened Issues" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="resolved" name="Resolved Issues" fill="var(--info)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Predictions Block (Unlocked at 91+ days) */}
                    {daysCount >= 91 && data.issues.predictions && (
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--primary-light)] border-[var(--primary-hover)] space-y-4">
                        <h4 className="text-sm font-bold text-[var(--primary-text)] flex items-center gap-1.5">
                          <Award className="h-4.5 w-4.5 text-[var(--primary-text)]" />
                          Quarterly Predictions & Strategic Anomaly Flags
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Capacity Projections</span>
                            <div className="space-y-2 p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                              <div className="flex justify-between text-xs">
                                <span>Projected Next Month Issue Volume:</span>
                                <span className="font-bold text-[var(--text-primary)]">{data.issues.predictions.projectedNextMonthVolume} Issues</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Projected SLA Compliance Rate:</span>
                                <span className="font-bold text-[var(--text-primary)]">{data.issues.predictions.projectedSlaRate}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Anomaly Warnings</span>
                            <div className="space-y-1.5">
                              {data.issues.predictions.anomalies.length === 0 ? (
                                <div className="text-xs text-[var(--success)] p-3 rounded bg-[var(--success-light)] border border-[var(--success-hover)] font-medium">
                                  No issue categories spiking above normal 90-day baseline averages.
                                </div>
                              ) : (
                                data.issues.predictions.anomalies.map((anom, i) => (
                                  <div key={i} className="flex items-center gap-2 p-3 text-xs bg-[var(--destructive-light)] border border-[var(--destructive-hover)] text-[var(--destructive)] rounded-lg font-medium">
                                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                                    <span>{anom.message}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 1.2 CHANGE REQUESTS SECTION */}
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="border-b border-[var(--border)] py-4">
                    <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[var(--secondary)]" />
                      1.2 — Change Requests (CRs) Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">CR On-Time Delivery Rate</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{data.crs.deliveryMetrics.onTimeDeliveryRate}%</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Target is 100% within estimate</p>
                      </div>
                      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Average CR Completion Time</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{data.crs.deliveryMetrics.averageCompletionTimeDays} Days</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">From creation to closed status</p>
                      </div>
                      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Total CR Revenue Billed</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">LKR {data.crs.financials.totalRevenue.toLocaleString()}</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{data.crs.financials.totalBilledHours} actual hours logged</p>
                      </div>
                      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Effective Hourly Billed Rate</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">LKR {data.crs.financials.effectiveHourlyRate.toLocaleString()} /hr</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Total revenue ÷ actual hours</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Estimation accurate splits */}
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <CheckCircle2 className="h-4.5 w-4.5 text-[var(--secondary)]" />
                          Estimation Calibration (Estimated vs Actual)
                        </h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                            <span>Average Estimation Accuracy per CR:</span>
                            <span className="font-bold text-[var(--text-primary)]">{data.crs.accuracyMetrics.averageAccuracy}%</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3.5 rounded bg-[var(--surface)] border border-[var(--border)] text-center">
                              <h5 className="text-base font-bold text-[var(--success)]">{data.crs.accuracyMetrics.overestimatedCount} CRs</h5>
                              <p className="text-[10px] text-[var(--text-secondary)] uppercase mt-0.5">Overestimated</p>
                              <p className="text-[9px] text-[var(--text-tertiary)] mt-1">Actual hours &lt; Estimated</p>
                            </div>
                            <div className="p-3.5 rounded bg-[var(--surface)] border border-[var(--border)] text-center">
                              <h5 className="text-base font-bold text-[var(--destructive)]">{data.crs.accuracyMetrics.underestimatedCount} CRs</h5>
                              <p className="text-[10px] text-[var(--text-secondary)] uppercase mt-0.5">Underestimated</p>
                              <p className="text-[9px] text-[var(--text-tertiary)] mt-1">by avg {data.crs.accuracyMetrics.averageUnderestimatedHours} hrs</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Project Breakdown for CRs */}
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Briefcase className="h-4.5 w-4.5 text-[var(--secondary)]" />
                          CR Accuracy per Project Breakdown
                        </h4>
                        
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                          {data.crs.accuracyMetrics.projectAccuracy.map((proj, i) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                              <span className="font-semibold text-[var(--text-secondary)]">{proj.projectName}</span>
                              <Badge className={`${proj.accuracy >= 80 ? "bg-[var(--success)] text-white" : "bg-[var(--warning)] text-white"}`}>
                                {proj.accuracy}% accuracy
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Weekly CR Trend (8+ days) */}
                    {daysCount >= 8 && data.crs.trend && (
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <TrendingUp className="h-4.5 w-4.5 text-[var(--secondary)]" />
                          Weekly New vs Completed CR Delivery Trend
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.crs.trend}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                              <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Bar dataKey="new" name="New CRs Raised" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="completed" name="Completed CRs" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* predictions (91+ days) */}
                    {daysCount >= 91 && data.crs.predictions && (
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--secondary-light)] border-[var(--secondary)]/30 space-y-4">
                        <h4 className="text-sm font-bold text-[var(--secondary)] flex items-center gap-1.5">
                          <Award className="h-4.5 w-4.5" />
                          Quarterly CR Calibration & Demand Projections
                        </h4>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="text-xs">
                            <span className="font-semibold block text-[var(--text-secondary)]">Projected Next Month CR Volume:</span>
                            <span className="text-lg font-bold text-[var(--text-primary)] mt-1 block">{data.crs.predictions.projectedCrVolume} CRs</span>
                          </div>
                          {data.crs.predictions.calibrationFlag && (
                            <div className="flex items-center gap-2 p-3 bg-[var(--warning-light)] border border-[var(--warning-hover)] text-[var(--warning)] font-semibold rounded-lg text-xs">
                              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                              <span>{data.crs.predictions.calibrationFlag}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 1.3 TASKS SECTION */}
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="border-b border-[var(--border)] py-4">
                    <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                      1.3 — Operations Tasks Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Task Completion Rate</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{data.tasks.deliveryMetrics.completionRate}%</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{data.tasks.summary.completed} of {data.tasks.summary.created} completed</p>
                      </div>
                      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Avg Completion Time</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{data.tasks.deliveryMetrics.averageCompletionTimeHours} Hours</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Created to completed state</p>
                      </div>
                      <div className="p-4 bg-[var(--background)] border border(--border) rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Overdue Tasks</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{data.tasks.summary.liveOverdueCount} Tasks</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Tasks currently past end date</p>
                      </div>
                      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Avg Days Overdue</p>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{data.tasks.deliveryMetrics.liveAverageDaysOverdue} Days</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Delay average on open tasks</p>
                      </div>
                    </div>

                    {/* Priorities and project lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                        <span className="text-xs font-bold text-[var(--text-primary)] block">Task Load by Priority</span>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(data.tasks.priorityBreakdown).map(([prio, val]) => (
                            <div key={prio} className="p-3 rounded bg-[var(--surface)] border border-[var(--border)]">
                              <span className="text-[11px] text-[var(--text-secondary)] font-medium">{prio}</span>
                              <h5 className="text-base font-bold text-[var(--text-primary)] mt-1">{val}</h5>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                        <span className="text-xs font-bold text-[var(--text-primary)] block">Project Task Load Breakdown</span>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                          {data.tasks.projectBreakdown.map((proj, i) => (
                            <div key={i} className="flex justify-between items-center text-xs p-2 bg-[var(--surface)] rounded border border-[var(--border)]">
                              <span className="font-semibold text-[var(--text-secondary)]">{proj.projectName}</span>
                              <Badge variant="outline">{proj.count} tasks</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 1.4 FINANCE SECTION */}
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="border-b border-[var(--border)] py-4">
                    <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[var(--success)]" />
                      1.4 — Financial Performance & Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Total Billed", val: `LKR ${data.finance.summary.billed.toLocaleString()}`, icon: DollarSign, color: "text-[var(--info)]" },
                        { label: "Total Collected", val: `LKR ${data.finance.summary.collected.toLocaleString()}`, icon: DollarSign, color: "text-[var(--success)]" },
                        { label: "Outstanding Balance", val: `LKR ${data.finance.summary.outstanding.toLocaleString()}`, icon: DollarSign, color: "text-[var(--destructive)]" },
                        { label: "Collection Rate", val: `${data.finance.summary.collectionRate}%`, icon: TrendingUp, color: "text-[var(--primary)]" },
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">{item.label}</span>
                            <h4 className="text-lg font-bold text-[var(--text-primary)] mt-1">{item.val}</h4>
                          </div>
                          <div className={`p-2 rounded bg-[var(--surface)] ${item.color}`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Per Project Details Table */}
                    <div className="border border-[var(--border)] rounded-xl bg-[var(--background)] overflow-hidden">
                      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)]">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Project Resource Consumption & Hourly Efficiency</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--text-secondary)]">
                              <th className="p-3">Project</th>
                              <th className="p-3 text-right">Allocated Hours</th>
                              <th className="p-3 text-right">Logged Hours</th>
                              <th className="p-3 text-right">Remaining Hours</th>
                              <th className="p-3 text-right">Overrun Cost</th>
                              <th className="p-3 text-right">Effective Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.finance.projectDetails.map((proj, i) => (
                              <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                                <td className="p-3 font-semibold text-[var(--text-primary)]">{proj.projectName}</td>
                                <td className="p-3 text-right font-medium">{proj.allocatedHours}h</td>
                                <td className="p-3 text-right font-semibold">{proj.usedHours}h</td>
                                <td className={`p-3 text-right font-medium ${proj.remainingHours < 0 ? "text-[var(--destructive)]" : "text-[var(--success)]"}`}>
                                  {proj.remainingHours}h
                                </td>
                                <td className="p-3 text-right font-semibold text-[var(--destructive)]">
                                  {proj.overrunCost > 0 ? `LKR ${proj.overrunCost.toLocaleString()}` : "—"}
                                </td>
                                <td className="p-3 text-right font-semibold text-[var(--primary-text)]">
                                  LKR {proj.effectiveHourlyRate.toLocaleString()} /h
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Finance Trend (8+ days) */}
                    {daysCount >= 8 && data.finance.trend && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                          <span className="text-xs font-bold text-[var(--text-primary)] block">Weekly Billed vs Collected Trend</span>
                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data.finance.trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="billed" name="Billed Amount" stroke="var(--info)" strokeWidth={2} />
                                <Line type="monotone" dataKey="collected" name="Collected Amount" stroke="var(--success)" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {data.finance.projectBurnRate && (
                          <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                            <span className="text-xs font-bold text-[var(--text-primary)] block">Project Weekly Hour Burn Rate</span>
                            <div className="h-56 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.finance.projectBurnRate}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                  <XAxis dataKey="projectName" tick={{ fontSize: 10 }} />
                                  <YAxis tick={{ fontSize: 10 }} />
                                  <Tooltip />
                                  <Legend />
                                  <Bar dataKey="weeklyBurn" name="Weekly Burn Hours" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="weeklyNeeded" name="Target Burn Limit" fill="var(--success)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Predictions (91+ days) */}
                    {daysCount >= 91 && data.finance.predictions && (
                      <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--success-light)] border-[var(--success-hover)] space-y-4 animate-fade-in">
                        <h4 className="text-sm font-bold text-[var(--success)] flex items-center gap-1.5">
                          <TrendingUp className="h-4.5 w-4.5" />
                          Finance & Project Overrun Predictions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-3 bg-[var(--surface)] rounded border border-[var(--border)]">
                            <span className="text-[10px] text-[var(--text-secondary)] block font-semibold uppercase">Projected Next Month Revenue</span>
                            <h5 className="text-base font-bold text-[var(--success)] mt-1">LKR {data.finance.predictions.projectedRevenue.toLocaleString()}</h5>
                          </div>
                          
                          <div className="p-3 bg-[var(--surface)] rounded border border-[var(--border)]">
                            <span className="text-[10px] text-[var(--text-secondary)] block font-semibold uppercase">Projected Outstanding Debt</span>
                            <h5 className="text-base font-bold text-[var(--destructive)] mt-1">LKR {data.finance.predictions.projectedOutstanding.toLocaleString()}</h5>
                          </div>

                          <div className="p-3 bg-[var(--surface)] rounded border border-[var(--border)] space-y-1">
                            <span className="text-[10px] text-[var(--text-secondary)] block font-semibold uppercase">Overrun Forecast Risks</span>
                            {data.finance.predictions.projectedOverruns.length === 0 ? (
                              <span className="text-xs text-[var(--success)] font-semibold mt-1 block">No overruns predicted next month.</span>
                            ) : (
                              <div className="space-y-1 mt-1">
                                {data.finance.predictions.projectedOverruns.map((projName, i) => (
                                  <span key={i} className="text-[10px] font-medium bg-[var(--warning-light)] text-[var(--warning)] px-2 py-0.5 rounded border border-[var(--warning-hover)] inline-block mr-1">
                                    {projName} Risk
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 1.5 PROJECT HEALTH SUMMARY */}
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="border-b border-[var(--border)] py-4">
                    <CardTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />
                      1.5 — Project Health Summary Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                            <th className="p-4">Project Name</th>
                            <th className="p-4">Contract Type</th>
                            <th className="p-4 text-center">Open Issues</th>
                            <th className="p-4 text-center">SLA Rate</th>
                            <th className="p-4 text-center">Hours Burn</th>
                            <th className="p-4 text-center">CR Accuracy</th>
                            <th className="p-4 text-right">Outstanding (LKR)</th>
                            <th className="p-4 text-center">Health Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.projectHealthSummary.map((row, i) => (
                            <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]/50 transition-colors">
                              <td className="p-4 font-bold text-[var(--text-primary)]">{row.projectName}</td>
                              <td className="p-4 text-[var(--text-secondary)]">{row.contractType}</td>
                              <td className="p-4 text-center font-semibold text-[var(--warning)]">{row.openIssues}</td>
                              <td className="p-4 text-center font-bold text-[var(--text-primary)]">{row.slaRate}%</td>
                              <td className="p-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-semibold">{row.hoursUsed} / {row.hoursAllocated}h</span>
                                  <div className="w-20 h-1.5 rounded bg-[var(--surface)] overflow-hidden">
                                    <div 
                                      className="h-full rounded"
                                      style={{
                                        width: `${row.hoursAllocated > 0 ? Math.min(100, (row.hoursUsed / row.hoursAllocated) * 100) : 0}%`,
                                        backgroundColor: (row.hoursUsed / row.hoursAllocated) > 1.0 ? "var(--destructive)" : (row.hoursUsed / row.hoursAllocated) > 0.85 ? "var(--warning)" : "var(--success)"
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center font-semibold text-[var(--secondary)]">{row.crAccuracy}%</td>
                              <td className="p-4 text-right font-semibold text-[var(--text-primary)]">
                                {row.outstanding > 0 ? `LKR ${row.outstanding.toLocaleString()}` : "—"}
                              </td>
                              <td className="p-4 text-center">
                                <Badge 
                                  className={`shadow-sm font-bold border ${
                                    row.healthStatus === "Green" 
                                      ? "bg-[var(--success-light)] border-[var(--success-hover)] text-[var(--success)]" 
                                      : row.healthStatus === "Amber"
                                      ? "bg-[var(--warning-light)] border-[var(--warning-hover)] text-[var(--warning)]"
                                      : "bg-[var(--destructive-light)] border-[var(--destructive-hover)] text-[var(--destructive)]"
                                  }`}
                                >
                                  {row.healthStatus}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}
        </TabsContent>

        {/* ── SECTION 2: USER PERFORMANCE ─────────────────────────────────── */}
        <TabsContent value="user-performance" className="mt-6 space-y-6">
          {isManagerOrAdmin && !selectedUserId ? (
            teamLoading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <div className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
                <p className="text-sm text-[var(--text-secondary)] font-medium">Loading team comparison metrics...</p>
              </div>
            ) : teamError || !teamData ? (
              <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center p-6">
                <ShieldAlert className="h-12 w-12 text-[var(--destructive)] mb-3" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to fetch team data</h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Verify that the backend is running and the database is accessible.</p>
                <Button onClick={() => refetch()} className="mt-4 bg-[var(--primary)] text-white">Retry Connection</Button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Team Workload Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)] shadow-sm">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <BarChart2 className="h-4 w-4 text-[var(--primary)]" />
                        Active Workload Distribution (Issues, Tasks & CRs)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={teamData.workloadComparison} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="issues" name="Issues" stackId="a" fill="var(--info)" />
                            <Bar dataKey="crs" name="CRs" stackId="a" fill="var(--secondary)" />
                            <Bar dataKey="tasks" name="Tasks" stackId="a" fill="var(--success)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-[var(--primary)]" />
                        Team Summary Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-secondary)] block font-semibold uppercase">Team Avg Resolution Speed</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold text-[var(--primary-text)]">{teamData.teamAvgResolutionSpeed}h</span>
                          <span className="text-xs text-[var(--text-tertiary)]">per issue</span>
                        </div>
                      </div>

                      <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-secondary)] block font-semibold uppercase">Active Team Size</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold text-[var(--text-primary)]">{teamData.teamComparison.length}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">engineers online</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Team Resolution Speed Box Plot */}
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="py-4 border-b border-[var(--border)]">
                    <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
                      Resolution Speed Box Plot (Manager View)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    {daysCount < 31 ? (
                      <div className="py-8 text-center text-xs text-[var(--text-tertiary)] font-medium border border-dashed border-[var(--border)] rounded-xl bg-[var(--background)] flex flex-col items-center justify-center gap-2">
                        <Info className="h-5 w-5 text-[var(--text-tertiary)]" />
                        <span>Select a date range of 31 days or more to unlock the resolution speed box-and-whisker distribution plot.</span>
                        <span className="text-[10px] text-[var(--text-secondary)] max-w-md font-normal">
                          This chart shows min, Q1, median, Q3, and max resolution times, plus outliers. Side-by-side plots reveal skill distribution and consistency.
                        </span>
                      </div>
                    ) : !teamData.boxPlotData || teamData.boxPlotData.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--text-tertiary)] font-medium">
                        No resolution speed data available in this range for any engineer.
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider border-b border-[var(--border)] pb-2 mb-2">
                          <span className="w-28 shrink-0">Engineer</span>
                          <span className="flex-1 text-center">Speed Distribution (Hours)</span>
                          <span className="w-48 shrink-0 text-right">Summary Values</span>
                        </div>
                        <div className="space-y-4">
                          {(() => {
                            const validPlots = teamData.boxPlotData.filter(d => d.stats && d.stats.max > 0);
                            if (validPlots.length === 0) {
                              return (
                                <div className="text-center text-xs text-[var(--text-tertiary)] py-4">
                                  No issues resolved in this period.
                                </div>
                              );
                            }
                            const allMaxValues = validPlots.map(d => d.stats!.max);
                            const globalMax = Math.max(...allMaxValues) * 1.1;

                            return (
                              <>
                                {validPlots.map((item, idx) => {
                                  const s = item.stats!;
                                  const minPct = (s.min / globalMax) * 100;
                                  const q1Pct = (s.q1 / globalMax) * 100;
                                  const medPct = (s.median / globalMax) * 100;
                                  const q3Pct = (s.q3 / globalMax) * 100;
                                  const maxPct = (s.max / globalMax) * 100;

                                  return (
                                    <div key={idx} className="flex items-center gap-4 text-xs">
                                      <div className="w-28 font-semibold truncate text-[var(--text-primary)]" title={item.name}>
                                        {item.name}
                                      </div>
                                      <div className="flex-1 relative h-8 bg-[var(--background)] border border-[var(--border)] rounded-md px-2 flex items-center shadow-inner">
                                        <div 
                                          className="absolute h-[2px] bg-[var(--text-tertiary)] opacity-60" 
                                          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
                                        />
                                        <div 
                                          className="absolute w-[2px] h-3 bg-[var(--text-tertiary)]" 
                                          style={{ left: `${minPct}%` }}
                                        />
                                        <div 
                                          className="absolute w-[2px] h-3 bg-[var(--text-tertiary)]" 
                                          style={{ left: `${maxPct}%` }}
                                        />
                                        <div 
                                          className="absolute h-5 bg-[var(--info)]/20 border border-[var(--info)] rounded-sm" 
                                          style={{ left: `${q1Pct}%`, right: `${100 - q3Pct}%` }}
                                        />
                                        <div 
                                          className="absolute w-[2px] h-5 bg-[var(--destructive)]" 
                                          style={{ left: `${medPct}%` }}
                                        />
                                        {s.outliers?.map((out, oIdx) => {
                                          const outPct = (out / globalMax) * 100;
                                          return (
                                            <div 
                                              key={oIdx} 
                                              className="absolute w-2 h-2 rounded-full bg-[var(--warning)] border border-white" 
                                              style={{ left: `${outPct}%`, transform: 'translateX(-50%)' }}
                                              title={`Outlier: ${out}h`}
                                            />
                                          );
                                        })}
                                      </div>
                                      <div className="w-48 text-[10px] text-[var(--text-secondary)] font-mono text-right truncate">
                                        min:{s.min}h | Q1:{s.q1}h | med:{s.median}h | Q3:{s.q3}h | max:{s.max}h
                                      </div>
                                    </div>
                                  );
                                })}

                                <div className="flex border-t border-[var(--border)] pt-2 mt-2">
                                  <div className="w-28 shrink-0" />
                                  <div className="flex-1 relative h-4 text-[9px] text-[var(--text-tertiary)] font-mono">
                                    <span className="absolute left-0">0h</span>
                                    <span className="absolute" style={{ left: '25%' }}>{(globalMax * 0.25).toFixed(1)}h</span>
                                    <span className="absolute" style={{ left: '50%' }}>{(globalMax * 0.5).toFixed(1)}h</span>
                                    <span className="absolute" style={{ left: '75%' }}>{(globalMax * 0.75).toFixed(1)}h</span>
                                    <span className="absolute right-0">{globalMax.toFixed(1)}h</span>
                                  </div>
                                  <div className="w-48 shrink-0" />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Comparison Table */}
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="py-4">
                    <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[var(--primary)]" />
                      Team Member Comparison Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                            <th className="p-3 text-center">Rank</th>
                            <th className="p-3">Engineer</th>
                            <th className="p-3 text-right">Hours Logged</th>
                            <th className="p-3 text-right">Billable %</th>
                            <th className="p-3 text-right">Resolved</th>
                            <th className="p-3 text-right">SLA Rate</th>
                            <th className="p-3 text-right">Avg Speed</th>
                            <th className="p-3 text-right">Reopen %</th>
                            <th className="p-3 text-right">CR Accuracy</th>
                            <th className="p-3 text-right">Unlogged Days</th>
                            <th className="p-3 text-center">Score</th>
                            <th className="p-3">Flags</th>
                          </tr>
                        </thead>
                        <tbody>
                           {teamData.teamComparison.map((row, i) => (
                            <tr 
                              key={i} 
                              onClick={() => setSelectedUserId(row.engineer.id)}
                              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]/50 transition-colors cursor-pointer"
                            >
                              <td className="p-3 text-center font-bold">
                                {row.rank === 1 ? (
                                  <Badge className="bg-amber-500 text-white font-bold border-0 shadow-sm">🥇 1</Badge>
                                ) : row.rank === 2 ? (
                                  <Badge className="bg-slate-400 text-white font-bold border-0 shadow-sm">🥈 2</Badge>
                                ) : row.rank === 3 ? (
                                  <Badge className="bg-amber-700 text-white font-bold border-0 shadow-sm">🥉 3</Badge>
                                ) : (
                                  <span className="text-[var(--text-secondary)]">#{row.rank}</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1.5">
                                  <div className="font-bold text-[var(--primary-text)] flex items-center gap-2">
                                    {row.engineer.avatar ? (
                                      <img src={row.engineer.avatar} className="h-6 w-6 rounded-full border" />
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-[10px] font-bold">
                                        {row.engineer.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="hover:underline">{row.engineer.name}</span>
                                      <span className="text-[10px] text-[var(--text-secondary)] font-normal">{row.engineer.designation}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Project contribution breakdown showing how many hours worked in each project each developer */}
                                  <div className="flex flex-wrap gap-1 mt-0.5 max-w-[280px]">
                                    {row.projectBreakdown?.map((proj, pIdx) => (
                                      <Badge 
                                        key={pIdx} 
                                        variant="outline" 
                                        className="text-[9px] bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] py-0 px-1 font-normal scale-95 origin-left"
                                      >
                                        <span className="font-bold text-[var(--text-primary)] mr-0.5">{proj.projectName}:</span>
                                        {proj.hoursLogged}h
                                      </Badge>
                                    ))}
                                    {(!row.projectBreakdown || row.projectBreakdown.length === 0) && (
                                      <span className="text-[9px] text-[var(--text-tertiary)] font-normal">—</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-right font-semibold">{row.hoursLogged}h</td>
                              <td className="p-3 text-right font-semibold">{row.billablePercentage}%</td>
                              <td className="p-3 text-right font-medium">{row.issuesResolved}</td>
                              <td className={`p-3 text-right font-bold ${row.slaRate >= 95 ? "text-[var(--success)]" : row.slaRate >= 85 ? "text-[var(--warning)]" : "text-[var(--destructive)]"}`}>
                                {row.slaRate}%
                              </td>
                              <td className="p-3 text-right font-semibold">{row.avgResolutionTime}h</td>
                              <td className={`p-3 text-right font-medium ${row.reopenPercentage > 10 ? "text-[var(--destructive)]" : "text-[var(--text-secondary)]"}`}>
                                {row.reopenPercentage}%
                              </td>
                              <td className="p-3 text-right font-semibold text-[var(--secondary)]">{row.crAccuracyPercentage}%</td>
                              <td className={`p-3 text-right font-medium ${row.unloggedDays > 0 ? "text-[var(--destructive)]" : "text-[var(--text-secondary)]"}`}>
                                {row.unloggedDays} days
                              </td>
                              <td className="p-3 text-center">
                                <Badge className="bg-[var(--primary-light)] text-[var(--primary-text)] border-[var(--primary-hover)] font-bold">
                                  {row.compositeScore}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {row.flags.length === 0 ? (
                                    <span className="text-[10px] text-[var(--success)] font-semibold">Healthy</span>
                                  ) : (
                                    row.flags.map((flag, idx) => (
                                      <Badge
                                        key={idx}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                                          flag.severity === "high"
                                            ? "bg-[var(--destructive-light)] border-[var(--destructive-hover)] text-[var(--destructive)]"
                                            : flag.severity === "medium"
                                            ? "bg-[var(--warning-light)] border-[var(--warning-hover)] text-[var(--warning)]"
                                            : "bg-[var(--primary-light)] border-[var(--primary-hover)] text-[var(--primary-text)]"
                                        }`}
                                      >
                                        {flag.type}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          ) : (
            scorecardLoading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <div className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
                <p className="text-sm text-[var(--text-secondary)] font-medium">Loading scorecard details...</p>
              </div>
            ) : scorecardError || !scorecardData ? (
              <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center p-6">
                <ShieldAlert className="h-12 w-12 text-[var(--destructive)] mb-3" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to fetch scorecard</h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Verify that the backend is running and the database is accessible.</p>
                <Button onClick={() => refetch()} className="mt-4 bg-[var(--primary)] text-white">Retry Connection</Button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {isManagerOrAdmin && selectedUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUserId(null)}
                    className="flex items-center gap-1 text-xs h-8 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Team Comparison
                  </Button>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)] shadow-sm">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                      {scorecardData.engineer.avatar ? (
                        <img src={scorecardData.engineer.avatar} className="h-16 w-16 rounded-full border shadow-sm" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xl font-bold border shadow-sm">
                          {scorecardData.engineer.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                          {scorecardData.engineer.name}
                          <Badge variant="outline" className="text-[10px] bg-[var(--primary-light)] text-[var(--primary-text)] border-[var(--primary-hover)] font-bold">
                            {scorecardData.engineer.role.replace("_", " ")}
                          </Badge>
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">{scorecardData.engineer.designation}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{scorecardData.engineer.email}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border shadow-sm ${scorecardData.flags.length > 0 ? "bg-[var(--warning-light)] border-[var(--warning-hover)]" : "bg-[var(--surface)] border-[var(--border)]"}`}>
                    <CardHeader className="py-3 px-5 border-b border-[var(--border)]/20">
                      <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                        Performance Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {scorecardData.flags.length === 0 ? (
                        <p className="text-xs text-[var(--success)] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                          All stats within healthy targets
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                          {scorecardData.flags.map((flag, idx) => (
                            <div key={idx} className="text-[11px] font-medium flex items-start gap-1">
                              <Badge className={`text-[8px] font-extrabold uppercase px-1 shrink-0 ${
                                flag.severity === "high" ? "bg-[var(--destructive)] text-white border-0" : flag.severity === "medium" ? "bg-[var(--warning)] text-white border-0" : "bg-[var(--primary)] text-white border-0"
                              }`}>
                                {flag.type}
                              </Badge>
                              <span className="text-[var(--text-secondary)]">{flag.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm text-center">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Hours Logged</span>
                    <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{scorecardData.metrics.volume.hoursLogged}h</h4>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">Target: {scorecardData.metrics.utilization.capacityTarget}h</span>
                  </div>

                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm text-center">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Billable Util</span>
                    <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{scorecardData.metrics.utilization.billableUtilizationRate}%</h4>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">Target: 60%</span>
                  </div>

                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm text-center">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Issues Resolved</span>
                    <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{scorecardData.metrics.volume.issuesResolved}</h4>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">{scorecardData.metrics.volume.issuesResolvedPerHour} issues/h</span>
                  </div>

                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm text-center">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">SLA Compliance</span>
                    <h4 className={`text-xl font-bold mt-1 ${scorecardData.metrics.quality.slaHitRate >= 95 ? "text-[var(--success)]" : scorecardData.metrics.quality.slaHitRate >= 85 ? "text-[var(--warning)]" : "text-[var(--destructive)]"}`}>
                      {scorecardData.metrics.quality.slaHitRate}%
                    </h4>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">Target: 95%</span>
                  </div>

                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm text-center">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">CRs Completed</span>
                    <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{scorecardData.metrics.volume.crsCompleted}</h4>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">Accuracy: {scorecardData.metrics.quality.crEstimationAccuracy}%</span>
                  </div>

                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm text-center">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Tasks Done</span>
                    <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1">{scorecardData.metrics.volume.tasksCompleted}</h4>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">Escapes: {scorecardData.metrics.quality.escalationAwayCount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                    <CardHeader className="py-4 border-b border-[var(--border)]">
                      <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-[var(--primary)]" />
                        Speed and Response Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 text-xs">
                      <div className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span className="text-[var(--text-secondary)]">Average Resolution Time:</span>
                        <span className="font-bold text-[var(--text-primary)]">{scorecardData.metrics.speed.avgResolutionTime} hours</span>
                      </div>
                      <div className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span className="text-[var(--text-secondary)]">First Response (Time to First Update):</span>
                        <span className="font-bold text-[var(--text-primary)]">{scorecardData.metrics.speed.avgTimeToFirstResponse} hours</span>
                      </div>
                      <div className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span className="text-[var(--text-secondary)]">Median Resolution Time:</span>
                        <span className="font-bold text-[var(--text-primary)]">{scorecardData.metrics.speed.medianResolutionTime} hours</span>
                      </div>
                      <div className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span className="text-[var(--text-secondary)]">P95 (Slowest 5%):</span>
                        <span className="font-bold text-[var(--text-primary)]">{scorecardData.metrics.speed.p95ResolutionTime} hours</span>
                      </div>
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase">Avg Speed per Priority</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {Object.keys(scorecardData.metrics.speed.avgResolutionTimePerPriority).map((prio) => (
                            <div key={prio} className="p-2 bg-[var(--background)] rounded border border-[var(--border)] flex justify-between">
                              <span className="font-medium text-[var(--text-secondary)]">{prio}:</span>
                              <span className="font-bold text-[var(--text-primary)]">{scorecardData.metrics.speed.avgResolutionTimePerPriority[prio]}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="w-full bg-[var(--surface)] border-[var(--border)] shadow-sm">
                    <CardHeader className="py-4 border-b border-[var(--border)]">
                      <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-[var(--primary)]" />
                        Developer Logging Heatmap (Hours Logged per Day)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      {(() => {
                        const paddedList: { date: string; hours: number }[] = [];
                        
                        const heatmapData = scorecardData.visualizations.calendarHeatmap;
                        if (!heatmapData || heatmapData.length === 0) {
                          return (
                            <div className="text-center text-xs text-[var(--text-tertiary)] py-8">
                              No logging data available.
                            </div>
                          );
                        }

                        // Get starting day of week for the first date
                        const startDayOfWeek = new Date(heatmapData[0].date + "T00:00:00").getDay();
                        
                        // Pad start of first week
                        for (let i = 0; i < startDayOfWeek; i++) {
                          paddedList.push({ date: "", hours: -1 });
                        }
                        
                        // Add actual days
                        paddedList.push(...heatmapData);
                        
                        // Pad end of last week to make it a multiple of 7
                        const remainder = paddedList.length % 7;
                        if (remainder > 0) {
                          for (let i = 0; i < 7 - remainder; i++) {
                            paddedList.push({ date: "", hours: -1 });
                          }
                        }

                        const getHeatmapColorClass = (hours: number) => {
                          if (hours === -1) return "bg-transparent opacity-0 pointer-events-none";
                          if (hours === 0) return "bg-[var(--border)]/15 border border-[var(--border)]/30 hover:bg-[var(--border)]/30";
                          if (hours <= 4) return "bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/35";
                          if (hours <= 6) return "bg-emerald-500/45 border border-emerald-500/55 hover:bg-emerald-500/60";
                          if (hours <= 8) return "bg-emerald-500/75 border border-emerald-500/85 hover:bg-emerald-500/90";
                          if (hours <= 10) return "bg-amber-500 border border-amber-600 hover:bg-amber-600";
                          return "bg-red-500 border border-red-600 hover:bg-red-600";
                        };

                        return (
                          <div className="w-full overflow-x-auto select-none pb-2 scrollbar-thin">
                            {/* Heatmap Grid */}
                            <div 
                              className="grid grid-rows-7 grid-flow-col gap-[3px] w-max"
                              style={{ height: "186px" }}
                            >
                              {paddedList.map((day, idx) => {
                                const colorClass = getHeatmapColorClass(day.hours);
                                const formattedDate = day.date ? new Date(day.date + "T00:00:00").toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : "";
                                
                                return (
                                  <div
                                    key={idx}
                                    className={`w-6 h-6 border-[2px] border-black rounded-[2px] transition-all cursor-pointer ${colorClass}`}
                                    title={day.hours >= 0 ? `${formattedDate}: ${day.hours} hours logged` : undefined}
                                  />
                                );
                              })}
                            </div>

                            {/* Legend / Key */}
                            <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--text-tertiary)] pt-2 border-t border-[var(--border)]/35">
                              <div className="flex items-center gap-1">
                                <span>Unlogged days: {scorecardData.metrics.utilization.unloggedDays}</span>
                              </div>
                              <div className="flex items-center gap-1.5 select-none">
                                <span>Less</span>
                                <div className="w-6 h-6 border-[2px] border-black rounded-[2px] bg-[var(--border)]/15 border border-[var(--border)]/30" title="0h" />
                                <div className="w-6 h-6 border-[2px] border-black rounded-[2px] bg-emerald-500/20 border border-emerald-500/30" title="1-4h" />
                                <div className="w-6 h-6 border-[2px] border-black rounded-[2px] bg-emerald-500/45 border border-emerald-500/55" title="4-6h" />
                                <div className="w-6 h-6 border-[2px] border-black rounded-[2px] bg-emerald-500/75 border border-emerald-500/85" title="6-8h" />
                                <div className="w-6 h-6 border-[2px] border-black rounded-[2px] bg-amber-500 border border-amber-600" title="8-10h" />
                                <div className="w-6 h-6 border-[2px] border-black rounded-[2px] bg-red-500 border border-red-600" title=">10h" />
                                <span>More</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-[var(--primary)]" />
                        Logged Hours by Work Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="h-52 w-52 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={scorecardData.visualizations.workTypeDonut}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {scorecardData.visualizations.workTypeDonut.map((entry, index) => {
                                const colors: Record<string, string> = {
                                  Development: "var(--primary)",
                                  Investigation: "var(--info)",
                                  Testing: "var(--success)",
                                  Communication: "var(--warning)",
                                  Documentation: "var(--secondary)",
                                  Deployment: "var(--accent)",
                                };
                                return <Cell key={`cell-${index}`} fill={colors[entry.name] || "var(--text-tertiary)"} />;
                              })}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full space-y-2">
                        {scorecardData.visualizations.workTypeDonut.map((entry, index) => {
                          const bgColors: Record<string, string> = {
                            Development: "bg-[var(--primary)]",
                            Investigation: "bg-[var(--info)]",
                            Testing: "bg-[var(--success)]",
                            Communication: "bg-[var(--warning)]",
                            Documentation: "bg-[var(--secondary)]",
                            Deployment: "bg-[var(--accent)]",
                          };
                          return (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <span className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                                <span className={`h-2.5 w-2.5 rounded-full ${bgColors[entry.name] || "bg-gray-400"}`} />
                                {entry.name}
                              </span>
                              <span className="font-bold text-[var(--text-primary)]">{entry.value} hours</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-[var(--primary)]" />
                        Resolved Issue Types Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      {scorecardData.visualizations.issueTypeMixBar.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-xs text-[var(--text-tertiary)] border border-dashed rounded-xl bg-[var(--background)] font-medium">
                          No issues resolved in the selected date range.
                        </div>
                      ) : (
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scorecardData.visualizations.issueTypeMixBar}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey="value" name="Resolved Count" fill="var(--info)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {(scorecardData.visualizations.resolutionSpeedTrend || scorecardData.visualizations.personalSlaRateTrend) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {scorecardData.visualizations.resolutionSpeedTrend && (
                      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                        <CardHeader className="py-4">
                          <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                            Resolution Speed Trend (Personal vs Team Average)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={scorecardData.visualizations.resolutionSpeedTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="personalAvg" name="Personal Speed" stroke="var(--primary)" strokeWidth={2} />
                                <Line type="monotone" dataKey="teamAvg" name="Team Average" stroke="var(--text-tertiary)" strokeDasharray="4 4" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {scorecardData.visualizations.personalSlaRateTrend && (
                      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                        <CardHeader className="py-4">
                          <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                            Personal SLA Hit Rate Trend (Target: 95%)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={scorecardData.visualizations.personalSlaRateTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="slaRate" name="Personal SLA %" stroke="var(--success)" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Predictions & Capacity Projections Section */}
                {daysCount >= 91 && scorecardData.predictions ? (
                  <Card className="bg-[var(--surface)] border border-[var(--primary)]/30 shadow-md">
                    <CardHeader className="py-4 bg-[var(--primary-light)]/20 border-b border-[var(--border)]">
                      <CardTitle className="text-xs font-bold text-[var(--primary-text)] flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-[var(--primary)] animate-pulse" />
                        Predictions & Capacity Projections (91+ Days Range)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                          <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Projected Next-Month Workload</span>
                          <h4 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{scorecardData.predictions.projectedNextMonthHours} hrs</h4>
                          <span className="text-xs text-[var(--text-secondary)] block mt-1">Based on rolling average demand</span>
                        </div>
                        <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                          <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Projected Issues Throughput</span>
                          <h4 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{scorecardData.predictions.projectedIssuesResolved} resolutions</h4>
                          <span className="text-xs text-[var(--text-secondary)] block mt-1">Estimated monthly throughput</span>
                        </div>
                        <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                          <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Capacity Utilization Trend</span>
                          <h4 className={`text-2xl font-bold mt-1 ${
                            scorecardData.predictions.projectedCapacityUtil === 'High Overload Risk' 
                              ? 'text-[var(--destructive)]' 
                              : scorecardData.predictions.projectedCapacityUtil === 'Under-utilized Risk' 
                              ? 'text-[var(--warning)]' 
                              : 'text-[var(--success)]'
                          }`}>
                            {scorecardData.predictions.projectedCapacityUtil}
                          </h4>
                          <span className="text-xs text-[var(--text-secondary)] block mt-1">Division workload allocation status</span>
                        </div>
                      </div>

                      <div className="mt-4 p-4 rounded-xl border flex items-center gap-3 bg-[var(--background)] border-[var(--border)]">
                        <div className={`p-2 rounded-full ${scorecardData.predictions.isSlaAtRiskOfDecline ? 'bg-[var(--destructive-light)]' : 'bg-[var(--success-light)]'}`}>
                          {scorecardData.predictions.isSlaAtRiskOfDecline ? (
                            <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[var(--text-primary)]">SLA Hit Rate Trend Forecast</h5>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {scorecardData.predictions.isSlaAtRiskOfDecline 
                              ? "Warning: This engineer's personal SLA hit rate has been declining for 2+ consecutive months. Action is recommended before client agreements are breached."
                              : "Stable SLA Performance: No SLA decline trend detected over the past 3 consecutive months. Safe margin."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  daysCount < 91 && (
                    <div className="p-4 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center text-xs text-[var(--text-tertiary)] font-medium">
                      💡 Predictions, expected throughput, and capacity projections will unlock when you select a date range of 91 days or more. (Current selection is {daysCount} days).
                    </div>
                  )
                )}

                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardHeader className="py-4 border-b border-[var(--border)]">
                    <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-[var(--primary)]" />
                      Project-wise Performance Contributions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {scorecardData.projectBreakdown.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[var(--text-tertiary)] font-medium">
                        No projects recorded during the selected date range.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                              <th className="p-3">Project Name</th>
                              <th className="p-3 text-right">Hours Logged</th>
                              <th className="p-3 text-center">Issues Resolved</th>
                              <th className="p-3 text-center">SLA Compliance</th>
                              <th className="p-3 text-center">CRs Completed</th>
                              <th className="p-3 text-right">Billed Revenue (LKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scorecardData.projectBreakdown.map((row, i) => (
                              <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]/50 transition-colors">
                                <td className="p-3 font-bold text-[var(--text-primary)]">{row.projectName}</td>
                                <td className="p-3 text-right font-semibold">{row.hoursLogged}h</td>
                                <td className="p-3 text-center font-medium">{row.issuesResolved}</td>
                                <td className={`p-3 text-center font-bold ${row.slaRate >= 95 ? "text-[var(--success)]" : row.slaRate >= 85 ? "text-[var(--warning)]" : "text-[var(--destructive)]"}`}>
                                  {row.slaRate}%
                                </td>
                                <td className="p-3 text-center font-medium">{row.crsCompleted}</td>
                                <td className="p-3 text-right font-semibold text-[var(--primary-text)]">
                                  {row.billedHoursContribution > 0 ? `LKR ${row.billedHoursContribution.toLocaleString()}` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </TabsContent>

        {/* ── SECTION 3: EXECUTIVE VIEW (COMING SOON) ───────────────────────────── */}
        <TabsContent value="executive-view" className="mt-6">
          <Card className="bg-[var(--surface)] border-[var(--border)] border-dashed rounded-xl p-12 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
              <FileText className="h-16 w-16 text-[var(--secondary)] opacity-40" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Section 3 — Executive View</h2>
              <p className="text-sm text-[var(--text-secondary)] font-normal">
                Business Health Scorecard, Client Health Matrix, Revenue by Contract type, and strategic strategic signals for Board.
              </p>
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] w-full justify-center">
                <Badge variant="outline" className="text-[10px] bg-[var(--secondary-light)] text-[var(--secondary)] border-[var(--secondary)]/30 font-bold">Planned Phase</Badge>
                <span className="text-xs text-[var(--text-tertiary)] font-semibold">CEO, Operations Head & Executive Access</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
