"use client";

import { Card, CardContent } from "@/components";

export function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-[var(--border)]" />
          <div className="h-3 w-32 rounded bg-[var(--border)]" />
        </div>
        <div className="h-8 w-24 rounded bg-[var(--border)]" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[var(--surface)] border-[var(--border)]">
            <CardContent className="p-4 space-y-3">
              <div className="h-3 w-20 rounded bg-[var(--border)]" />
              <div className="h-7 w-16 rounded bg-[var(--border)]" />
              <div className="h-2 w-24 rounded bg-[var(--border)]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardContent className="p-4 space-y-3">
          <div className="h-4 w-40 rounded bg-[var(--border)]" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-3 w-32 rounded bg-[var(--border)]" />
              <div className="h-3 w-16 rounded bg-[var(--border)]" />
              <div className="h-3 w-20 rounded bg-[var(--border)]" />
              <div className="h-3 w-16 rounded bg-[var(--border)]" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chart skeleton */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardContent className="p-4">
          <div className="h-4 w-36 rounded bg-[var(--border)] mb-4" />
          <div className="h-48 w-full rounded bg-[var(--border)]" />
        </CardContent>
      </Card>
    </div>
  );
}
