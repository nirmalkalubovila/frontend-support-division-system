"use client";

import { ElectionCard } from "@/components/molecules/electionCard";
import type { ElectionSummary } from "@/types/election";

interface ElectionGridProps {
  elections: ElectionSummary[];
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ElectionGrid({ elections, onDuplicate, onDelete }: ElectionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
      {elections.map((election) => (
        <ElectionCard
          key={election._id}
          election={election}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
