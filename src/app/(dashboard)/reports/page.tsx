"use client";

import { BarChart3, Calendar, Download, FileText } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
            Reports
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Auto-generated performance and operational reports
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="bg-[var(--surface)] border border-[var(--border)]">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--primary)]" />
                Daily Operations Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 text-sm text-[var(--text-tertiary)]">
                <div className="text-center space-y-2">
                  <FileText className="h-10 w-10 mx-auto text-[var(--text-tertiary)] opacity-50" />
                  <p>Daily reports will be generated automatically at the end of each business day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base">Weekly Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 text-sm text-[var(--text-tertiary)]">
                Weekly reports generated every Monday
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base">Monthly Executive Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 text-sm text-[var(--text-tertiary)]">
                Monthly reports generated on the 1st of each month
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
