"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateElection } from "@/lib/api/server/election/update-election";
import { VoterBaseForm } from "@/components/organisms/createElectionWizard/forms/voterBaseForm";
import type { VoterBaseMode, VoterBaseInput } from "@/types/election";
import { Save } from "lucide-react";

interface EditElectionFormProps {
  electionId: string;
  initialTitle: string;
  initialDescription: string;
  initialVoterBaseMode: string;
  initialAllowedEmails: string[];
  initialAllowedDomains: string[];
}

export function EditElectionForm({
  electionId,
  initialTitle,
  initialDescription,
  initialVoterBaseMode,
  initialAllowedEmails,
  initialAllowedDomains,
}: EditElectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [voterBase, setVoterBase] = useState<VoterBaseInput>({
    mode: initialVoterBaseMode as VoterBaseMode,
    emails: initialAllowedEmails,
    domains: initialAllowedDomains,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        await updateElection(electionId, {
          title: title.trim(),
          description: description.trim(),
          voterBaseMode: voterBase.mode,
          allowedVoterEmails: voterBase.emails || [],
          allowedVoterDomains: voterBase.domains || [],
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title</Label>
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-desc">Description</Label>
          <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Voter Base</h3>
        <VoterBaseForm voterBase={voterBase} onVoterBaseChange={setVoterBase} />
      </div>

      {error && (
        <p className="text-sm text-[var(--destructive)] bg-[var(--destructive-light)] px-4 py-3 rounded-lg">{error}</p>
      )}
      {saved && (
        <p className="text-sm text-[var(--secondary)] bg-[var(--secondary-light)] px-4 py-3 rounded-lg">Changes saved successfully!</p>
      )}

      <Button onClick={handleSave} disabled={isPending}>
        <Save className="h-4 w-4" />
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
