"use client";

import { BarChart3, FileText, Clock, Radio, Archive } from "lucide-react";
import { StatCard } from "@/components/atoms/statCard";
import type { ElectionSummary } from "@/types/election";

interface ElectionStatsBarProps {
  elections: ElectionSummary[];
}

export function ElectionStatsBar({ elections }: ElectionStatsBarProps) {
  const total = elections.length;
  const active = elections.filter((e) => e.status === "open").length;
  const scheduled = elections.filter((e) => e.status === "scheduled").length;
  const drafts = elections.filter((e) => e.status === "draft").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatCard icon={FileText} label="Total" value={total} />
      <StatCard icon={Radio} label="Active" value={active} />
      <StatCard icon={Clock} label="Scheduled" value={scheduled} />
      <StatCard icon={Archive} label="Drafts" value={drafts} />
    </div>
  );
}
