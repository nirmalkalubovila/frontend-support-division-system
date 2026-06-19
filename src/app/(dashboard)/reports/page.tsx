"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, FileText, Users, Briefcase, RefreshCw, Info
} from "lucide-react";
import { 
  Tabs, TabsList, TabsTrigger, TabsContent, Input, Label, Button 
} from "@/components";
import { useGetProjectPerformance } from "@/api/services/reports/performance-service";
import { useGetTeamComparison, useGetUserScorecard } from "@/api/services/reports/user-performance-service";
import { useGetExecutivePerformance } from "@/api/services/reports/executive-performance-service";
import useSessionStore from "@/store/session-store";
import { ProjectPerformanceView } from "./project-performance/project-performance-view";
import { UserPerformanceView } from "./user-performance/user-performance-view";
import { ExecutivePerformanceView } from "./executive-view/executive-view";

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

  const { data: execData, isLoading: execLoading, isError: execError, refetch: refetchExec } = useGetExecutivePerformance(
    startDate,
    endDate,
    isManagerOrAdmin
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

  const isAnyLoading = isLoading || teamLoading || scorecardLoading || (isManagerOrAdmin && execLoading);

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
                  if (isManagerOrAdmin) refetchExec();
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
        <TabsContent value="project-performance" className="mt-6">
          <ProjectPerformanceView 
            data={data}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            daysCount={daysCount}
          />
        </TabsContent>

        {/* ── SECTION 2: USER PERFORMANCE ─────────────────────────────────── */}
        <TabsContent value="user-performance" className="mt-6">
          <UserPerformanceView 
            teamData={teamData}
            teamLoading={teamLoading}
            teamError={teamError}
            scorecardData={scorecardData}
            scorecardLoading={scorecardLoading}
            scorecardError={scorecardError}
            refetch={() => {
              refetchTeam();
              refetchScorecard();
            }}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            isManagerOrAdmin={isManagerOrAdmin}
            daysCount={daysCount}
          />
        </TabsContent>

        {/* ── SECTION 3: EXECUTIVE VIEW ────────────────────────────────────────── */}
        <TabsContent value="executive-view" className="mt-6">
          <ExecutivePerformanceView 
            execData={execData}
            execLoading={execLoading}
            execError={execError}
            refetchExec={refetchExec}
            isManagerOrAdmin={isManagerOrAdmin}
            daysCount={daysCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
