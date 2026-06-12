"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Label,
  Select,
} from "@/components";
import { PRIORITIES, ISSUE_TYPES, ROLE_LABELS } from "@/lib/constants";
import { useCreateIssue, useUploadAttachments } from "@/api/services/issue-management/issue-service";
import { useGetAllClients, type Client } from "@/api/services/project-management/client-service";
import { useGetAllProjects, type Project } from "@/api/services/project-management/project-service";
import { useGetAllUsers, type User } from "@/api/services/user-management/user-service";

interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialForm = {
  title: "",
  description: "",
  client: "",
  project: "",
  priority: "Medium",
  type: "Bug",
  assignedTo: "",
  estimatedHours: "",
};

// Max file size 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(mimetype: string): boolean {
  return mimetype.startsWith("image/");
}

export function CreateIssueModal({ open, onOpenChange }: CreateIssueModalProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createIssueMutation = useCreateIssue();
  const uploadAttachmentsMutation = useUploadAttachments();
  const { data: clientsData } = useGetAllClients();
  const { data: projectsData } = useGetAllProjects(form.client || undefined);
  const { data: usersData } = useGetAllUsers();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
      setSelectedFiles([]);
      // Revoke preview URLs
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
      setFilePreviews([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset project when client changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, project: "" }));
  }, [form.client]);

  const clients: Client[] = clientsData?.data ?? [];
  const projects: Project[] = projectsData?.data ?? [];
  const users: User[] = usersData ?? [];

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ── File handling ──────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 10MB limit`);
        continue;
      }
      if (selectedFiles.length + validFiles.length >= 5) {
        toast.error("Maximum 5 files allowed per issue");
        break;
      }
      validFiles.push(file);
      if (isImageType(file.type)) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push("");
      }
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    if (filePreviews[index]) URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (form.title.length > 150) errs.title = "Title must be 150 characters or less";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.client) errs.client = "Client is required";
    if (!form.project) errs.project = "Project is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const issue = await createIssueMutation.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        client: form.client,
        project: form.project,
        priority: form.priority as "Critical" | "High" | "Medium" | "Low",
        type: form.type as
          | "Bug"
          | "Feature Request"
          | "Access Issue"
          | "Data Correction"
          | "Performance"
          | "Consultation",
        assignedTo: form.assignedTo || null,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      });

      // Upload attachments if any
      if (selectedFiles.length > 0) {
        await uploadAttachmentsMutation.mutateAsync({
          issueId: issue._id,
          files: selectedFiles,
        });
      }

      toast.success("Issue created successfully!");
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create issue";
      toast.error(message);
    }
  };

  const isPending = createIssueMutation.isPending || uploadAttachmentsMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-[var(--primary)]" />
            Create New Issue
          </DialogTitle>
          <DialogDescription className="text-sm">
            Fill in the details below to log a new support issue.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-3">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="issue-title" className="text-sm font-semibold">
              Title <span className="text-[var(--error)]">*</span>
            </Label>
            <Input
              id="issue-title"
              placeholder="e.g. Login page throws 500 error on submit"
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("title", e.target.value)
              }
              className={`h-11 text-sm ${errors.title ? "border-[var(--error)]" : ""}`}
            />
            {errors.title && (
              <p className="text-xs text-[var(--error)] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Client & Project Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue-client" className="text-sm font-semibold">
                Client <span className="text-[var(--error)]">*</span>
              </Label>
              <Select
                id="issue-client"
                placeholder="Select client"
                value={form.client}
                onChange={(v) => handleChange("client", v)}
                options={clients.map((c) => ({
                  label: `${c.name} (${c.code})`,
                  value: c._id,
                }))}
                className={`h-11 text-sm ${errors.client ? "border-[var(--error)]" : ""}`}
              />
              {errors.client && (
                <p className="text-xs text-[var(--error)] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.client}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-project" className="text-sm font-semibold">
                Project <span className="text-[var(--error)]">*</span>
              </Label>
              <Select
                id="issue-project"
                placeholder={form.client ? "Select project" : "Select client first"}
                value={form.project}
                onChange={(v) => handleChange("project", v)}
                options={projects.map((p) => ({ label: p.name, value: p._id }))}
                disabled={!form.client}
                className={`h-11 text-sm ${errors.project ? "border-[var(--error)]" : ""}`}
              />
              {errors.project && (
                <p className="text-xs text-[var(--error)] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.project}
                </p>
              )}
            </div>
          </div>

          {/* Priority & Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue-priority" className="text-sm font-semibold">
                Priority
              </Label>
              <Select
                id="issue-priority"
                value={form.priority}
                onChange={(v) => handleChange("priority", v)}
                options={PRIORITIES.map((p) => ({ label: p, value: p }))}
                className="h-11 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-type" className="text-sm font-semibold">
                Type
              </Label>
              <Select
                id="issue-type"
                value={form.type}
                onChange={(v) => handleChange("type", v)}
                options={ISSUE_TYPES.map((t) => ({ label: t, value: t }))}
                className="h-11 text-sm"
              />
            </div>
          </div>

          {/* Assigned To & Estimated Hours Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue-assignee" className="text-sm font-semibold">
                Assign To
              </Label>
              <Select
                id="issue-assignee"
                placeholder="Unassigned (Backlog)"
                value={form.assignedTo}
                onChange={(v) => handleChange("assignedTo", v)}
                options={[
                  { label: "Unassigned (Backlog)", value: "" },
                  ...users
                    .filter((u) => u.isActive)
                    .map((u) => ({
                      label: `${u.name} — ${ROLE_LABELS[u.role] || u.role}`,
                      value: u._id,
                    })),
                ]}
                className="h-11 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-hours" className="text-sm font-semibold">
                Estimated Hours
              </Label>
              <Input
                id="issue-hours"
                type="number"
                min={0}
                step={0.5}
                placeholder="e.g. 4"
                value={form.estimatedHours}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange("estimatedHours", e.target.value)
                }
                className="h-11 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="issue-description" className="text-sm font-semibold">
              Description <span className="text-[var(--error)]">*</span>
            </Label>
            <Textarea
              id="issue-description"
              placeholder="Describe the issue in detail: steps to reproduce, expected behavior, actual behavior..."
              rows={4}
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleChange("description", e.target.value)
              }
              className={`text-sm ${errors.description ? "border-[var(--error)]" : ""}`}
            />
            {errors.description && (
              <p className="text-xs text-[var(--error)] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Paperclip className="h-4 w-4" />
              Attachments
              <span className="text-xs font-normal text-[var(--text-tertiary)]">
                (Screenshots, documents — max 5 files, 10MB each)
              </span>
            </Label>

            {/* File Upload Area */}
            <div
              className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/50 p-5 transition-colors cursor-pointer bg-[var(--background)]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-[var(--text-tertiary)]" />
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  PNG, JPG, PDF, DOCX, XLSX, CSV, TXT
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] group"
                  >
                    {/* Preview / Icon */}
                    {filePreviews[index] ? (
                      <img
                        src={filePreviews[index]}
                        alt={file.name}
                        className="h-10 w-10 rounded-md object-cover border border-[var(--border)]"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-[var(--surface-hover)] flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[var(--text-tertiary)]" />
                      </div>
                    )}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {formatFileSize(file.size)}
                        {isImageType(file.type) && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5">
                            <ImageIcon className="h-3 w-3" /> Image
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--surface-hover)] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-10 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white min-w-[140px] h-10 text-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                {uploadAttachmentsMutation.isPending ? "Uploading..." : "Creating..."}
              </>
            ) : (
              "Create Issue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
