"use client";

import Link from "next/link";
import { Calendar, Users, Vote, MoreHorizontal, Pencil, Share2, BarChart3, Copy, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/atoms/statusBadge";
import type { ElectionSummary } from "@/types/election";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";

interface ElectionCardProps {
  election: ElectionSummary;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function ElectionCard({ election, onDuplicate, onDelete, className }: ElectionCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--primary)]/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/elections/${election._id}`}
            className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors line-clamp-1"
          >
            {election.title}
          </Link>
          <div className="mt-1.5">
            <StatusBadge status={election.status} />
          </div>
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-all opacity-0 group-hover:opacity-100"
              aria-label="Election actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/elections/${election._id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/elections/${election._id}/share`}>
                <Share2 className="h-4 w-4" /> Share
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/elections/${election._id}/results`}>
                <BarChart3 className="h-4 w-4" /> Results
              </Link>
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(election._id)}>
                <Copy className="h-4 w-4" /> Duplicate
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[var(--destructive)] focus:text-[var(--destructive)]"
                  onClick={() => onDelete(election._id)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-4 text-sm text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {election.candidateCount} candidates
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Vote className="h-3.5 w-3.5" />
          {election.totalVotes} votes
        </span>
      </div>

      {/* Date */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Calendar className="h-3 w-3" />
        {new Date(election.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
