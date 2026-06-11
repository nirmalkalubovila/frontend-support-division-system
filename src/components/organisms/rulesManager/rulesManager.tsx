"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { VotingRulesForm } from "@/components/organisms/createElectionWizard/forms/votingRulesForm";
import { updateVotingRules } from "@/lib/api/server/voting-rules/update-voting-rules";
import { updateCandidatePrivileges } from "@/lib/api/server/voting-rules/update-candidate-privileges";
import type { VotingRulesInput } from "@/types/election";
import { Save, ShieldCheck } from "lucide-react";

interface CandidateData {
  _id: string;
  name: string;
  maxVotesReceivable: number | null;
  isEligibleForVoting: boolean;
}

interface RulesManagerProps {
  electionId: string;
  initialRules: VotingRulesInput;
  candidates: CandidateData[];
}

export function RulesManager({ electionId, initialRules, candidates }: RulesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rules, setRules] = useState(initialRules);
  const [saved, setSaved] = useState(false);

  const handleSaveRules = () => {
    startTransition(async () => {
      await updateVotingRules(electionId, rules);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    });
  };

  const handleUpdatePrivileges = (candidateId: string, field: string, value: number | null | boolean) => {
    startTransition(async () => {
      const candidate = candidates.find((c) => c._id === candidateId);
      if (!candidate) return;
      await updateCandidatePrivileges(candidateId, {
        maxVotesReceivable: field === "maxVotesReceivable" ? (value as number | null) : candidate.maxVotesReceivable,
        isEligibleForVoting: field === "isEligibleForVoting" ? (value as boolean) : candidate.isEligibleForVoting,
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Election-level rules */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
          Election Rules
        </h3>
        <VotingRulesForm rules={rules} onRulesChange={setRules} />
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSaveRules} disabled={isPending}>
            <Save className="h-4 w-4" /> {isPending ? "Saving..." : "Save Rules"}
          </Button>
          {saved && <p className="text-sm text-[var(--secondary)]">Saved!</p>}
        </div>
      </div>

      <Separator />

      {/* Per-candidate privileges */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Per-Candidate Privileges
        </h3>
        <div className="space-y-3">
          {candidates.map((c) => (
            <div key={c._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Max votes</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="∞"
                    value={c.maxVotesReceivable ?? ""}
                    onChange={(e) =>
                      handleUpdatePrivileges(c._id, "maxVotesReceivable", e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-20 h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Eligible</Label>
                  <div className="pt-1">
                    <Switch
                      checked={c.isEligibleForVoting}
                      onCheckedChange={(val) => handleUpdatePrivileges(c._id, "isEligibleForVoting", val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
