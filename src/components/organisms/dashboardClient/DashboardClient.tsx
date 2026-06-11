"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button, ConfirmDialog, ElectionStatsBar, ElectionGrid, EmptyState, SearchFilterBar  } from "@/components";
import { deleteElection, duplicateElection  } from "@/lib/api/server";
import type { ElectionSummary, ElectionStatus } from "@/types";

interface DashboardClientProps {
  elections: ElectionSummary[];
}

export function DashboardClient({ elections }: DashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ElectionStatus | "all">("all");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter elections
  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const matchesSearch =
        searchQuery === "" ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [elections, searchQuery, statusFilter]);

  // Handlers
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      await deleteElection(deleteTargetId);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      router.refresh();
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      await duplicateElection(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <ElectionStatsBar elections={elections} />

      {/* Search, filter, and create button row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>
        <Button asChild className="shrink-0">
          <Link href="/elections/create">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Election</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </Button>
      </div>

      {/* Election grid or empty state */}
      {elections.length === 0 ? (
        <EmptyState />
      ) : filteredElections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No elections match your search
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="mt-2 text-sm text-[var(--primary)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ElectionGrid
          elections={filteredElections}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Election"
        description="Are you sure you want to delete this election? This action cannot be undone. All candidates and votes will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={isPending}
      />
    </div>
  );
}
