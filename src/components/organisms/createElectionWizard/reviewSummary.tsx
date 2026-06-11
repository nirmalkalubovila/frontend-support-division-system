"use client";

import { Badge } from "@/components/ui/badge";
import type { CreateElectionInput } from "@/types/election";

interface ReviewSummaryProps {
  data: CreateElectionInput;
}

export function ReviewSummary({ data }: ReviewSummaryProps) {
  return (
    <div className="space-y-5">
      {/* Basic Info */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Basic Info
        </h3>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-[var(--text-muted)]">Title</span>
            <p className="text-sm font-medium text-[var(--text-primary)]">{data.title}</p>
          </div>
          {data.description && (
            <div>
              <span className="text-xs text-[var(--text-muted)]">Description</span>
              <p className="text-sm text-[var(--text-secondary)]">{data.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Candidates */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Candidates ({data.candidates.length})
        </h3>
        <div className="space-y-2">
          {data.candidates.map((c, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg border border-[var(--border)] object-cover"
                />
              ) : null}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-medium text-[var(--primary)]">
                {i + 1}
              </span>
              <span className="text-sm text-[var(--text-primary)] truncate">{c.name}</span>
              {c.description && (
                <span className="text-xs text-[var(--text-muted)] truncate hidden sm:inline">
                  — {c.description}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Voting Rules */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Voting Rules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-xs text-[var(--text-muted)]">Max votes per voter</span>
            <p className="font-medium text-[var(--text-primary)]">{data.votingRules.maxTotalVotesPerVoter}</p>
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)]">Max per candidate</span>
            <p className="font-medium text-[var(--text-primary)]">{data.votingRules.maxVotesPerCandidate}</p>
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)]">Voter visibility</span>
            <Badge variant={data.votingRules.allowVoterVisibility ? "warning" : "outline"}>
              {data.votingRules.allowVoterVisibility ? "Visible" : "Hidden"}
            </Badge>
          </div>
        </div>
      </section>

      {/* Voter Base */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Voter Base
        </h3>
        <div className="text-sm">
          <Badge variant="info">
            {data.voterBase.mode === "anyone_with_link"
              ? "Anyone with link"
              : data.voterBase.mode === "restricted_emails"
                ? `${(data.voterBase.emails || []).length} specific emails`
                : `@${(data.voterBase.domains || [])[0] || "domain"}`}
          </Badge>
        </div>
      </section>

      {/* Scheduling */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Scheduling
        </h3>
        <div className="text-sm">
          <Badge variant={data.scheduling.mode === "automatic" ? "scheduled" : "outline"}>
            {data.scheduling.mode === "manual" ? "Manual" : "Automatic"}
          </Badge>
          {data.scheduling.mode === "automatic" && data.scheduling.scheduledStartAt && (
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              {new Date(data.scheduling.scheduledStartAt).toLocaleString()} →{" "}
              {data.scheduling.scheduledEndAt
                ? new Date(data.scheduling.scheduledEndAt).toLocaleString()
                : "No end date"}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
