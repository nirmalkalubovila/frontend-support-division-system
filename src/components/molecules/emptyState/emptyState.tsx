import Link from "next/link";
import { Vote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 sm:py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-light)] mb-5">
        <Vote className="h-8 w-8 text-[var(--primary)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        No elections yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)] leading-relaxed">
        Create your first election to start collecting votes. Set up candidates,
        configure voting rules, and share with your voters.
      </p>
      <Button asChild className="mt-6">
        <Link href="/elections/create">
          <Plus className="h-4 w-4" />
          Create Your First Election
        </Link>
      </Button>
    </div>
  );
}
