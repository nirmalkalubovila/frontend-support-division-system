"use client";

import { 
  BarChart3, DollarSign, Award, TrendingUp, AlertTriangle, 
  Activity, CheckCircle2, BarChart2, Briefcase, Info, 
  ShieldAlert, Clock 
} from "lucide-react";
import { 
  Card, CardContent, CardHeader, CardTitle, Badge, Button 
} from "@/components";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer
} from "recharts";

interface ProjectPerformanceViewProps {
  data: any;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  daysCount: number;
}

export function ProjectPerformanceView({
  data,
  isLoading,
  isError,
  refetch,
  daysCount
}: ProjectPerformanceViewProps) {
  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Computing report performance analytics...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center p-6">
        <ShieldAlert className="h-12 w-12 text-[var(--destructive)] mb-3" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to fetch report data</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Please verify that backend server is running and dates are correctly selected.</p>
        <Button onClick={refetch} className="mt-4 bg-[var(--primary)] text-white">Retry Connection</Button>
      </div>
    );
  }

  return (
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
                        <span className="font-bold text-[var(--text-primary)]">{val as number} hrs</span>
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
                            <span>{count as number}</span>
                          </div>
                          <div className="h-2 rounded bg-[var(--surface)] overflow-hidden">
                            <div 
                              className="h-full rounded" 
                              style={{
                                width: `${data.issues.summary.opened > 0 ? ((count as number) / data.issues.summary.opened) * 100 : 0}%`,
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
                            <Badge variant="outline" className="text-[10px] font-bold">{count as number}</Badge>
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
                        data.issues.predictions.anomalies.map((anom: any, i: number) => (
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
                  {data.crs.accuracyMetrics.projectAccuracy.map((proj: any, i: number) => (
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
              <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-sm">
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
                      <h5 className="text-base font-bold text-[var(--text-primary)] mt-1">{val as number}</h5>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background)] space-y-4">
                <span className="text-xs font-bold text-[var(--text-primary)] block">Project Task Load Breakdown</span>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                  {data.tasks.projectBreakdown.map((proj: any, i: number) => (
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
                    {data.finance.projectDetails.map((proj: any, i: number) => (
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
                        {data.finance.predictions.projectedOverruns.map((projName: string, i: number) => (
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
                  {data.projectHealthSummary.map((row: any, i: number) => (
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
  );
}
