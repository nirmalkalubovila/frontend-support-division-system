"use client";

import { 
  BarChart2, Activity, Users, Award, ShieldAlert, ArrowLeft, 
  AlertTriangle, CheckCircle2, Clock, Calendar, Briefcase, 
  TrendingUp, Info, BarChart3
} from "lucide-react";
import { 
  Card, CardContent, CardHeader, CardTitle, Badge, Button 
} from "@/components";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

interface UserPerformanceViewProps {
  teamData: any;
  teamLoading: boolean;
  teamError: boolean;
  scorecardData: any;
  scorecardLoading: boolean;
  scorecardError: boolean;
  refetch: () => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  isManagerOrAdmin: boolean;
  daysCount: number;
}

export function UserPerformanceView({
  teamData,
  teamLoading,
  teamError,
  scorecardData,
  scorecardLoading,
  scorecardError,
  refetch,
  selectedUserId,
  setSelectedUserId,
  isManagerOrAdmin,
  daysCount
}: UserPerformanceViewProps) {
  if (isManagerOrAdmin && !selectedUserId) {
    if (teamLoading) {
      return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--text-secondary)] font-medium">Loading team comparison metrics...</p>
        </div>
      );
    }

    if (teamError || !teamData) {
      return (
        <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center p-6">
          <ShieldAlert className="h-12 w-12 text-[var(--destructive)] mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to fetch team data</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Verify that the backend is running and the database is accessible.</p>
          <Button onClick={refetch} className="mt-4 bg-[var(--primary)] text-white">Retry Connection</Button>
        </div>
      );
    }

    return (
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
                    const validPlots = teamData.boxPlotData.filter((d: any) => d.stats && d.stats.max > 0);
                    if (validPlots.length === 0) {
                      return (
                        <div className="text-center text-xs text-[var(--text-tertiary)] py-4">
                          No issues resolved in this period.
                        </div>
                      );
                    }
                    const allMaxValues = validPlots.map((d: any) => d.stats!.max);
                    const globalMax = Math.max(...allMaxValues) * 1.1;

                    return (
                      <>
                        {validPlots.map((item: any, idx: number) => {
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
                                {s.outliers?.map((out: number, oIdx: number) => {
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
                   {teamData.teamComparison.map((row: any, i: number) => (
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
                          
                          {/* Project contribution breakdown */}
                          <div className="flex flex-wrap gap-1 mt-0.5 max-w-[280px]">
                            {row.projectBreakdown?.map((proj: any, pIdx: number) => (
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
                            row.flags.map((flag: any, idx: number) => (
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
    );
  }

  // Individual Engineer Scorecard view
  if (scorecardLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Loading scorecard details...</p>
      </div>
    );
  }

  if (scorecardError || !scorecardData) {
    return (
      <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center p-6">
        <ShieldAlert className="h-12 w-12 text-[var(--destructive)] mb-3" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to fetch scorecard</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Verify that the backend is running and the database is accessible.</p>
        <Button onClick={refetch} className="mt-4 bg-[var(--primary)] text-white">Retry Connection</Button>
      </div>
    );
  }

  return (
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
                {scorecardData.flags.map((flag: any, idx: number) => (
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

              const startDayOfWeek = new Date(heatmapData[0].date + "T00:00:00").getDay();
              
              for (let i = 0; i < startDayOfWeek; i++) {
                paddedList.push({ date: "", hours: -1 });
              }
              
              paddedList.push(...heatmapData);
              
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
                    {scorecardData.visualizations.workTypeDonut.map((entry: any, index: number) => {
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
              {scorecardData.visualizations.workTypeDonut.map((entry: any, index: number) => {
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
                  {scorecardData.projectBreakdown.map((row: any, i: number) => (
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
  );
}
