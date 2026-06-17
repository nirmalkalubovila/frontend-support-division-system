"use client";

import { 
  ShieldAlert, Award, Briefcase, DollarSign, CheckCircle2, 
  AlertTriangle, Activity, RefreshCw, FileText, ArrowUp, 
  ArrowDown, Minus, Clock, Users, BarChart2, BarChart3, TrendingUp
} from "lucide-react";
import { 
  Card, CardContent, CardHeader, CardTitle, Badge, Button 
} from "@/components";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

interface ExecutivePerformanceViewProps {
  execData: any;
  execLoading: boolean;
  execError: boolean;
  refetchExec: () => void;
  isManagerOrAdmin: boolean;
  daysCount: number;
}

export function ExecutivePerformanceView({
  execData,
  execLoading,
  execError,
  refetchExec,
  isManagerOrAdmin,
  daysCount
}: ExecutivePerformanceViewProps) {
  if (!isManagerOrAdmin) {
    return (
      <Card className="bg-[var(--surface)] border-[var(--border)] p-12 text-center max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-[var(--destructive)] opacity-80" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Access Restricted</h2>
          <p className="text-sm text-[var(--text-secondary)] font-normal">
            Only Super Admin, CEO, Operations Head, and authorized Executives are permitted to access this strategic business view.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (execLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Analyzing executive strategic metrics...</p>
      </div>
    );
  }

  if (execError || !execData) {
    return (
      <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center p-6">
        <ShieldAlert className="h-12 w-12 text-[var(--destructive)] mb-3" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">Failed to fetch executive data</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Please verify backend server connectivity and authorization settings.</p>
        <Button onClick={refetchExec} className="mt-4 bg-[var(--primary)] text-white">Retry Connection</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* 3.1 Business Health Scorecard (8 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Overall SLA Rate</span>
                <h3 className={`text-2xl font-bold ${execData.scorecard.overallSlaRate >= 95 ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                  {execData.scorecard.overallSlaRate}%
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">Target: &gt;95% compliance</p>
              </div>
              <div className="p-2.5 bg-[var(--primary-light)] rounded-xl text-[var(--primary-text)]">
                <Award className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Active Projects</span>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {execData.scorecard.activeProjectsCount}
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {execData.scorecard.activeProjectsDelta >= 0 ? "+" : ""}{execData.scorecard.activeProjectsDelta} vs prior period
                </p>
              </div>
              <div className="p-2.5 bg-[var(--secondary-light)] rounded-xl text-[var(--secondary)]">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Revenue Billed</span>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  LKR {execData.scorecard.revenueBilled.toLocaleString()}
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">For selected range</p>
              </div>
              <div className="p-2.5 bg-[var(--success-light)] rounded-xl text-[var(--success)]">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Revenue Collected</span>
                <h3 className="text-2xl font-bold text-[var(--success)]">
                  LKR {execData.scorecard.revenueCollected.toLocaleString()}
                </h3>
                <p className="text-[10px] text-[var(--destructive)] font-medium">
                  LKR {execData.scorecard.outstandingBalance.toLocaleString()} outstanding
                </p>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Projects Overrun</span>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {execData.scorecard.projectsOverrunStr}
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">Hours used &gt; allocated</p>
              </div>
              <div className="p-2.5 bg-[var(--destructive-light)] rounded-xl text-[var(--destructive)]">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Team Utilization</span>
                <h3 className="text-2xl font-bold text-[var(--primary-text)]">
                  {execData.scorecard.teamUtilization}%
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">Billable vs total hours</p>
              </div>
              <div className="p-2.5 bg-[var(--primary-light)] rounded-xl text-[var(--primary)]">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Support Volume</span>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {execData.scorecard.totalIssuesCount} Issues
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {execData.scorecard.issuesResolvedPct}% resolved
                </p>
              </div>
              <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">
                <RefreshCw className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm hover:border-[var(--primary-light)] transition-all">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Collection Rate</span>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {execData.scorecard.collectionRate}%
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">Financial discipline metric</p>
              </div>
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600">
                <FileText className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3.2 Client Health Matrix */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader className="py-4 border-b border-[var(--border)]">
          <CardTitle className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[var(--primary)]" />
            3.2 — Client Health Matrix (Overview Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] select-none">
                  <th className="p-4">Client</th>
                  <th className="p-4">Contract Type</th>
                  <th className="p-4 text-center">SLA Rate</th>
                  <th className="p-4 text-center">Issues Handled</th>
                  <th className="p-4 text-center">Hours Burn</th>
                  <th className="p-4 text-right">Revenue Billed</th>
                  <th className="p-4 text-right">Outstanding (LKR)</th>
                  <th className="p-4 text-center">Trend</th>
                  <th className="p-4 text-center">Health Status</th>
                </tr>
              </thead>
              <tbody>
                {execData.clientHealthMatrix.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]/50 transition-colors">
                    <td className="p-4 font-bold text-[var(--text-primary)]">{row.clientName}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{row.contractType}</td>
                    <td className={`p-4 text-center font-bold ${row.slaRate >= 95 ? "text-[var(--success)]" : row.slaRate >= 85 ? "text-[var(--warning)]" : "text-[var(--destructive)]"}`}>
                      {row.slaRate}%
                    </td>
                    <td className="p-4 text-center font-semibold text-[var(--text-secondary)]">{row.issuesHandled}</td>
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
                    <td className="p-4 text-right font-semibold text-[var(--text-primary)]">LKR {row.billed.toLocaleString()}</td>
                    <td className={`p-4 text-right font-semibold ${row.outstanding > 0 ? "text-[var(--destructive)]" : "text-[var(--text-tertiary)]"}`}>
                      {row.outstanding > 0 ? `LKR ${row.outstanding.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-4 text-center">
                      {row.trend === "up" ? (
                        <span className="text-[var(--success)] flex items-center justify-center gap-0.5 font-bold"><ArrowUp className="h-3.5 w-3.5" /> ↑</span>
                      ) : row.trend === "down" ? (
                        <span className="text-[var(--destructive)] flex items-center justify-center gap-0.5 font-bold"><ArrowDown className="h-3.5 w-3.5" /> ↓</span>
                      ) : (
                        <span className="text-[var(--text-tertiary)] flex items-center justify-center gap-0.5 font-bold"><Minus className="h-3.5 w-3.5" /> →</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Badge 
                        className={`shadow-sm font-bold border ${
                          row.health === "Green" 
                            ? "bg-[var(--success-light)] border-[var(--success-hover)] text-[var(--success)]" 
                            : row.health === "Amber"
                            ? "bg-[var(--warning-light)] border-[var(--warning-hover)] text-[var(--warning)]"
                            : "bg-[var(--destructive-light)] border-[var(--destructive-hover)] text-[var(--destructive)]"
                        }`}
                      >
                        {row.health}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3.3 Financial Summary Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3.3.1 Financial Metrics & YTD */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <DollarSign className="h-4.5 w-4.5 text-[var(--primary)]" />
              YTD & Division Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg space-y-1">
              <span className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase">YTD Billed Revenue</span>
              <h4 className="text-base font-bold text-[var(--text-primary)]">LKR {execData.financials.ytdBilled.toLocaleString()}</h4>
            </div>

            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg space-y-1">
              <span className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase">YTD Collected Revenue</span>
              <h4 className="text-base font-bold text-[var(--success)]">LKR {execData.financials.ytdCollected.toLocaleString()}</h4>
            </div>

            <div className="flex justify-between border-b border-[var(--border)] pb-2 pt-1.5">
              <span className="text-[var(--text-secondary)]">Overrun Cost Total:</span>
              <span className="font-bold text-[var(--destructive)]">LKR {execData.financials.overrunCostTotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[var(--text-secondary)]">Division Effective Hourly Rate:</span>
              <span className="font-bold text-[var(--primary-text)]">LKR {execData.financials.divisionEffectiveRate.toLocaleString()} /hr</span>
            </div>
          </CardContent>
        </Card>

        {/* 3.3.2 Top Clients */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-[var(--primary)]" />
              Top 3 Revenue Generating Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {execData.financials.topClients.map((client: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[var(--primary-light)] text-[var(--primary-text)] border-[var(--primary-hover)] font-bold">#{idx+1}</Badge>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{client.clientName}</span>
                </div>
                <span className="text-xs font-bold text-[var(--success)]">LKR {client.revenue.toLocaleString()}</span>
              </div>
            ))}
            {execData.financials.topClients.length === 0 && (
              <span className="text-xs text-[var(--text-tertiary)] italic block text-center py-4">No billing recorded.</span>
            )}
          </CardContent>
        </Card>

        {/* 3.3.3 Client Outstanding Balance Breakdown */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-[var(--destructive)]" />
              Client Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {execData.financials.outstandingPerClient.map((client: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded bg-[var(--background)] border border-[var(--border)]">
                  <span className="font-semibold text-[var(--text-secondary)]">{client.clientName}</span>
                  <span className="font-bold text-[var(--destructive)]">LKR {client.outstanding.toLocaleString()}</span>
                </div>
              ))}
              {execData.financials.outstandingPerClient.length === 0 && (
                <div className="text-center py-6 text-xs text-[var(--success)] font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> No outstanding client debt.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3.4 Operational Efficiency Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-[var(--primary)]" />
              Historical Operational SLA & Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-2">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">SLA compliance rate (Last 4 periods)</span>
              <div className="space-y-1.5">
                {execData.operationalSignals.slaComplianceTrend.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-[var(--background)] border border-[var(--border)]">
                    <span className="font-semibold">{t.monthLabel}</span>
                    <Badge className={`${t.slaRate >= 95 ? "bg-[var(--success)] text-white" : "bg-[var(--warning)] text-white"}`}>{t.slaRate}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Average Resolution Speed (Last 4 periods)</span>
              <div className="space-y-1.5">
                {execData.operationalSignals.avgResolutionTimeTrend.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-[var(--background)] border border-[var(--border)]">
                    <span className="font-semibold">{t.monthLabel}</span>
                    <span className="font-bold text-[var(--text-primary)]">{t.avgResHours} hrs</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-[var(--warning)]" />
              Backlog Aging & Backlog Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold block">Open backlog age distribution</span>
            {(() => {
              const totalOpenBacklog = execData.operationalSignals.backlogAgeBreakdown.zeroToThree + 
                                       execData.operationalSignals.backlogAgeBreakdown.threeToSeven + 
                                       execData.operationalSignals.backlogAgeBreakdown.sevenToFourteen + 
                                       execData.operationalSignals.backlogAgeBreakdown.overFourteen;
              return (
                <div className="space-y-3">
                  {[
                    { label: "0-3 Days (Low Risk)", val: execData.operationalSignals.backlogAgeBreakdown.zeroToThree, color: "bg-[var(--success)]", pct: totalOpenBacklog > 0 ? (execData.operationalSignals.backlogAgeBreakdown.zeroToThree / totalOpenBacklog) * 100 : 0 },
                    { label: "3-7 Days (Medium Risk)", val: execData.operationalSignals.backlogAgeBreakdown.threeToSeven, color: "bg-[var(--info)]", pct: totalOpenBacklog > 0 ? (execData.operationalSignals.backlogAgeBreakdown.threeToSeven / totalOpenBacklog) * 100 : 0 },
                    { label: "7-14 Days (High Risk)", val: execData.operationalSignals.backlogAgeBreakdown.sevenToFourteen, color: "bg-[var(--warning)]", pct: totalOpenBacklog > 0 ? (execData.operationalSignals.backlogAgeBreakdown.sevenToFourteen / totalOpenBacklog) * 100 : 0 },
                    { label: "&gt;14 Days (Chronic Backlog)", val: execData.operationalSignals.backlogAgeBreakdown.overFourteen, color: "bg-[var(--destructive)]", pct: totalOpenBacklog > 0 ? (execData.operationalSignals.backlogAgeBreakdown.overFourteen / totalOpenBacklog) * 100 : 0 },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span dangerouslySetInnerHTML={{ __html: item.label }} />
                        <span>{item.val} issues</span>
                      </div>
                      <div className="h-2 rounded bg-[var(--background)] overflow-hidden">
                        <div className={`h-full rounded ${item.color}`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-[var(--primary)]" />
              CR Delivery & Division Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg text-center space-y-1">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Change Request On-Time Delivery</span>
              <h3 className="text-xl font-bold text-[var(--secondary)]">{execData.operationalSignals.crDeliveryRate}%</h3>
              <p className="text-[9px] text-[var(--text-tertiary)]">Delivered on timeline &amp; within scope</p>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Division Utilization Trend (Last 4 periods)</span>
              <div className="space-y-1.5">
                {execData.operationalSignals.utilizationRateTrend.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-[var(--background)] border border-[var(--border)]">
                    <span className="font-semibold">{t.monthLabel}</span>
                    <span className="font-bold text-[var(--primary-text)]">{t.utilizationRate}% billable</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3.5 Predictions & Strategic Signals */}
      {daysCount >= 91 && execData.predictions ? (
        <Card className="bg-[var(--surface)] border border-[var(--primary)]/30 shadow-md">
          <CardHeader className="py-4 bg-[var(--primary-light)]/20 border-b border-[var(--border)]">
            <CardTitle className="text-sm font-bold text-[var(--primary-text)] flex items-center gap-1.5">
              <TrendingUp className="h-5 w-5 text-[var(--primary)] animate-pulse" />
              3.5 — Strategic Predictions & Capacity Forecast (91+ Days Range)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Projected Hours Demand</span>
                <h4 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{execData.predictions.projectedDemandHours} hrs</h4>
                <span className="text-[10px] text-[var(--text-tertiary)] block mt-0.5">Rolling capacity is {execData.predictions.monthlyCapacity} hrs</span>
              </div>

              <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Projected Revenue Next Period</span>
                <h4 className="text-2xl font-bold text-[var(--success)] mt-1">LKR {execData.predictions.projectedNextMonthRevenue.toLocaleString()}</h4>
                <span className="text-[10px] text-[var(--text-tertiary)] block mt-0.5">Retainers + pipeline CR values</span>
              </div>

              <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] block uppercase">Growth Rates MoM &amp; YoY</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">MoM Demand</span>
                    <span className={`font-bold ${execData.predictions.momGrowth >= 0 ? "text-[var(--destructive)]" : "text-[var(--success)]"}`}>
                      {execData.predictions.momGrowth >= 0 ? "+" : ""}{execData.predictions.momGrowth}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-tertiary)] block">YoY Demand</span>
                    <span className={`font-bold ${execData.predictions.yoyGrowth >= 0 ? "text-[var(--destructive)]" : "text-[var(--success)]"}`}>
                      {execData.predictions.yoyGrowth >= 0 ? "+" : ""}{execData.predictions.yoyGrowth}%
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Alarms and Strategic Badges */}
            <div className="space-y-3 pt-2">
              
              {execData.predictions.capacityFlag && (
                <div className="p-3.5 rounded-lg bg-[var(--destructive-light)] border border-[var(--destructive-hover)] text-[var(--destructive)] flex items-center gap-2.5 text-xs font-semibold">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>{execData.predictions.capacityFlag}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* At risk projects */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2.5 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block">Contracts Projected to Overrun this Month</span>
                  <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                    {execData.predictions.atRiskContracts.map((c: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                        <span className="font-medium">{c.projectName}</span>
                        <Badge className="bg-[var(--destructive)] text-white font-bold">
                          +{c.overrunHours}h (LKR {c.overrunCost.toLocaleString()})
                        </Badge>
                      </div>
                    ))}
                    {execData.predictions.atRiskContracts.length === 0 && (
                      <span className="text-[11px] text-[var(--success)] font-medium block">All projects are projected to burn within allocation.</span>
                    )}
                  </div>
                </div>

                {/* Declining SLA Clients */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2.5 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block">Declining SLA Client Accounts</span>
                  <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                    {execData.predictions.decliningClients.map((clientName: string, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--destructive)] font-semibold">
                        <span>{clientName}</span>
                        <Badge variant="outline" className="border-[var(--destructive)] text-[var(--destructive)] text-[9px] font-bold">Consecutive SLA decline</Badge>
                      </div>
                    ))}
                    {execData.predictions.decliningClients.length === 0 && (
                      <span className="text-[11px] text-[var(--success)] font-medium block">No client accounts showing consecutive SLA decline.</span>
                    )}
                  </div>
                </div>

              </div>

              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--text-secondary)]">Division-wide Team Efficiency Trend:</span>
                <Badge className={`${
                  execData.predictions.efficiencyTrend === "improving" 
                    ? "bg-[var(--success)] text-white" 
                    : execData.predictions.efficiencyTrend === "declining"
                    ? "bg-[var(--destructive)] text-white"
                    : "bg-[var(--primary)] text-white"
                } font-bold`}>
                  {execData.predictions.efficiencyTrend.toUpperCase()}
                </Badge>
              </div>

            </div>

          </CardContent>
        </Card>
      ) : (
        daysCount < 91 && (
          <div className="p-4 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] text-center text-xs text-[var(--text-tertiary)] font-medium">
            💡 Capacity forecasts, retainer predictions, contract risk signals, and decline forecasts will unlock when you select a date range of 91 days or more. (Current selection is {daysCount} days).
          </div>
        )
      )}

      {/* 3.6 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Line */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-[var(--primary)]" />
              Revenue Trend (6-Month Billed vs Collected)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={execData.charts.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="billed" name="Billed Revenue" stroke="var(--info)" strokeWidth={2} />
                  <Line type="monotone" dataKey="collected" name="Collected Payment" stroke="var(--success)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SLA rate by Client Bar */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
              SLA Rate by Client Account (Selected Period)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={execData.charts.clientSla} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="slaRate" name="SLA Hit Rate %" radius={[0, 4, 4, 0]}>
                    {execData.charts.clientSla.map((entry: any, idx: number) => (
                      <Cell 
                        key={`cell-${idx}`} 
                        fill={entry.slaRate >= 95 ? "var(--success)" : entry.slaRate >= 85 ? "var(--warning)" : "var(--destructive)"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project hours utilization progress / radial gauges */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[var(--primary)]" />
              Active Contract Hours Utilization Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {execData.charts.projectUtilization.map((proj: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">{proj.projectName}</span>
                    <span className={`font-bold ${
                      proj.status === 'overrun' 
                        ? 'text-[var(--destructive)]' 
                        : proj.status === 'warning'
                        ? 'text-[var(--warning)]' 
                        : 'text-[var(--success)]'
                    }`}>
                      {proj.actualPercentage}% consumed ({proj.used} / {proj.allocated} hrs)
                    </span>
                  </div>
                  <div className="h-2 rounded bg-[var(--background)] overflow-hidden">
                    <div className={`h-full rounded ${
                      proj.status === 'overrun' 
                        ? 'bg-[var(--destructive)]' 
                        : proj.status === 'warning'
                        ? 'bg-[var(--warning)]' 
                        : 'bg-[var(--success)]'
                    }`} style={{ width: `${proj.percentage}%` }} />
                  </div>
                </div>
              ))}
              {execData.charts.projectUtilization.length === 0 && (
                <span className="text-xs text-[var(--text-tertiary)] italic block text-center py-8">No active project hours tracked in this range.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Division utilization donut chart */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="py-4 border-b border-[var(--border)]">
            <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[var(--primary)]" />
              Division-wide Support Capacity Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={execData.charts.divisionUtilizationDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {execData.charts.divisionUtilizationDonut.map((entry: any, index: number) => {
                      const colors = ["var(--success)", "var(--info)", "var(--text-tertiary)"];
                      return <Cell key={`cell-${index}`} fill={colors[index] || "var(--border)"} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {execData.charts.divisionUtilizationDonut.map((entry: any, index: number) => {
                const colors = ["bg-[var(--success)]", "bg-[var(--info)]", "bg-[var(--text-tertiary)]"];
                return (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                      <span className={`h-2.5 w-2.5 rounded-full ${colors[index] || "bg-gray-400"}`} />
                      {entry.name}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">{entry.value} hours</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 12-Month Support Volume Demand sparkline */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader className="py-4 border-b border-[var(--border)]">
          <CardTitle className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-[var(--primary)]" />
            12-Month Support Volume Demand sparkline (Issues Created vs Resolved)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={execData.operationalSignals.issueDemandTrend}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--info)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="created" name="Issues Raised" stroke="var(--warning)" fillOpacity={1} fill="url(#colorCreated)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Issues Resolved" stroke="var(--info)" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
