"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components";
import { Textarea } from "@/components";
import { Button } from "@/components";
import { Badge } from "@/components";
import { ConfirmDialog } from "@/components";
import { CandidateImageField } from "@/components";
import { addCandidate } from "@/lib/api/server/candidate/add-candidate";
import { updateCandidate } from "@/lib/api/server/candidate/update-candidate";
import { removeCandidate } from "@/lib/api/server/candidate/remove-candidate";
import { Plus, Pencil, Trash2, Save, X, Vote } from "lucide-react";

function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
}

function CandidateAvatar({
  imageUrl,
  nameForInitials,
}: {
  imageUrl: string | null;
  nameForInitials: string;
}) {
  const shell =
    "flex h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-sm";

  if (imageUrl) {
    return (
      <div className={shell}>
        <Image src={imageUrl} alt="" width={56} height={56} preload className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${shell} items-center justify-center bg-[var(--primary-light)] text-sm font-semibold text-[var(--primary)]`}
      aria-hidden
    >
      {candidateInitials(nameForInitials)}
    </div>
  );
}

interface CandidateData {
  _id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  position: number;
  voteCount: number;
}

interface CandidatesManagerProps {
  electionId: string;
  initialCandidates: CandidateData[];
}

export function CandidatesManager({ electionId, initialCandidates }: CandidatesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Add candidate state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState<string | undefined>(undefined);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | undefined>(undefined);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      await addCandidate(electionId, {
        name: newName.trim(),
        description: newDescription.trim(),
        ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
      });
      setNewName("");
      setNewDescription("");
      setNewImageUrl(undefined);
      setShowAddForm(false);
      router.refresh();
    });
  };

  const startEdit = (c: CandidateData) => {
    setEditId(c._id);
    setEditName(c.name);
    setEditDesc(c.description);
    setEditImageUrl(c.imageUrl ?? undefined);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditImageUrl(undefined);
  };

  const handleUpdate = () => {
    if (!editId || !editName.trim()) return;
    startTransition(async () => {
      await updateCandidate(editId, {
        name: editName.trim(),
        description: editDesc.trim(),
        imageUrl: editImageUrl ?? null,
      });
      setEditId(null);
      setEditImageUrl(undefined);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await removeCandidate(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Candidate list */}
      <div className="space-y-3">
        {initialCandidates.map((c, i) => (
          <div
            key={c._id}
            className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--primary)]/20"
          >
            <span className="mt-3.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-semibold text-[var(--primary)]">
              {i + 1}
            </span>

            {editId === c._id ? (
              <CandidateImageField
                imageUrl={editImageUrl}
                onImageUrlChange={setEditImageUrl}
                disabled={isPending}
              />
            ) : (
              <CandidateAvatar
                imageUrl={c.imageUrl}
                nameForInitials={c.name}
              />
            )}

            {editId === c._id ? (
              <div className="flex-1 min-w-0 space-y-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
                <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} disabled={isPending}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">{c.name}</p>
                  <Badge variant="outline" className="w-fit shrink-0 text-xs sm:mt-0.5">
                    <Vote className="h-3 w-3 mr-1" /> {c.voteCount} votes
                  </Badge>
                </div>
                {c.description ? (
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2">{c.description}</p>
                ) : null}
              </div>
            )}

            {editId !== c._id && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
                  aria-label="Edit candidate"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteId(c._id); setDeleteDialogOpen(true); }}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-light)] transition-all"
                  aria-label="Remove candidate"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--primary)]/30 bg-[var(--primary-light)]/30 p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <CandidateImageField
              imageUrl={newImageUrl}
              onImageUrlChange={setNewImageUrl}
              disabled={isPending}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <Input placeholder="Candidate name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Textarea
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending || !newName.trim()}>
              <Plus className="h-3.5 w-3.5" /> {isPending ? "Adding..." : "Add"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setNewName("");
                setNewDescription("");
                setNewImageUrl(undefined);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4" /> Add Candidate
        </Button>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Candidate"
        description="Are you sure? This candidate and their votes will be removed."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={isPending}
      />
    </div>
  );
}
