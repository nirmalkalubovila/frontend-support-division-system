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
import { useGetCategories } from "@/api/services/system/settings-service";

interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
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

const DEFAULT_CLIENTS: Client[] = [];
const DEFAULT_PROJECTS: Project[] = [];
const DEFAULT_USERS: User[] = [];
const DEFAULT_CATEGORIES: string[] = [];

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

export function CreateIssueModal({ open, onOpenChange, defaultProjectId }: CreateIssueModalProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createIssueMutation = useCreateIssue();
  const uploadAttachmentsMutation = useUploadAttachments();
  const { data: clientsData } = useGetAllClients();
  const { data: projectsData } = useGetAllProjects();
  const { data: usersData } = useGetAllUsers();
  const { data: categoriesData } = useGetCategories();
  const categories = categoriesData ?? DEFAULT_CATEGORIES;

  const issueTypes = categories.length > 0 ? categories : ISSUE_TYPES;

  const estH = form.estimatedHours ? Number(form.estimatedHours) : 0;
  const hoursVal = form.estimatedHours ? String(Math.floor(estH)) : "";
  const minutesVal = form.estimatedHours ? String(Math.round((estH - Math.floor(estH)) * 60)) : "";

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = e.target.value;
    const m = minutesVal || "0";
    if (h === "" && m === "0") {
      handleChange("estimatedHours", "");
    } else {
      const dec = Number(h || 0) + Number(m) / 60;
      handleChange("estimatedHours", String(dec));
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let mVal = e.target.value;
    if (mVal !== "") {
      const mNum = Math.min(59, Math.max(0, Number(mVal)));
      mVal = String(mNum);
    }
    const h = hoursVal || "0";
    if (h === "0" && mVal === "") {
      handleChange("estimatedHours", "");
    } else {
      const dec = Number(h) + Number(mVal || 0) / 60;
      handleChange("estimatedHours", String(dec));
    }
  };

  // Reset form when dialog closes or initialize type when categories load
  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
      setSelectedFiles([]);
      // Revoke preview URLs
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
      setFilePreviews([]);
    } else {
      const defaultType = categories.length > 0 ? categories[0] : "Bug";
      setForm((prev) => {
        const nextType = prev.type === "Bug" ? defaultType : prev.type;
        if (prev.type === nextType) return prev;
        return { ...prev, type: nextType };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categories]);

  const clients = clientsData?.data ?? DEFAULT_CLIENTS;
  const projects = projectsData?.data ?? DEFAULT_PROJECTS;
  const users = usersData ?? DEFAULT_USERS;

  // Prefill defaultProjectId when open or when projects load
  useEffect(() => {
    if (open && defaultProjectId && projects.length > 0) {
      const proj = projects.find((p) => p._id === defaultProjectId);
      if (proj) {
        setForm((prev) => {
          const targetProject = defaultProjectId;
          const targetClient = proj.client
            ? (typeof proj.client === "object" ? proj.client._id : proj.client)
            : prev.client;
          if (prev.project === targetProject && prev.client === targetClient) {
            return prev;
          }
          return { ...prev, project: targetProject, client: targetClient };
        });
      }
    }
  }, [open, defaultProjectId, projects]);

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

  const handleClientChange = (clientId: string) => {
    setForm((prev) => {
      const next = { ...prev, client: clientId };
      // If the selected project does not belong to the selected client, clear the project
      if (prev.project) {
        const proj = projects.find((p) => p._id === prev.project);
        if (proj) {
          const projClient = typeof proj.client === "object" ? proj.client?._id : proj.client;
          if (projClient !== clientId && clientId !== "") {
            next.project = "";
          }
        }
      }
      return next;
    });

    setErrors((prev) => {
      const next = { ...prev };
      delete next.client;
      return next;
    });
  };

  const handleProjectChange = (projectId: string) => {
    setForm((prev) => {
      const next = { ...prev, project: projectId };
      // Resolve client from the selected project if available
      const proj = projects.find((p) => p._id === projectId);
      if (proj && proj.client) {
        if (typeof proj.client === "object") {
          next.client = proj.client._id;
        } else {
          next.client = proj.client;
        }
      }
      return next;
    });

    setErrors((prev) => {
      const next = { ...prev };
      delete next.project;
      delete next.client;
      return next;
    });
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
        type: form.type,
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
                Client <span className="text-xs font-normal text-[var(--text-tertiary)]">(Optional)</span>
              </Label>
              <Select
                id="issue-client"
                placeholder="Select client"
                value={form.client}
                onChange={handleClientChange}
                options={[
                  { label: "No Client / General Support", value: "" },
                  ...clients.map((c) => ({
                    label: `${c.name} (${c.code})`,
                    value: c._id,
                  })),
                ]}
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
                placeholder="Select project"
                value={form.project}
                onChange={handleProjectChange}
                options={projects
                  .filter((p) => {
                    if (!form.client) return true;
                    const projClient = typeof p.client === "object" ? p.client?._id : p.client;
                    return projClient === form.client;
                  })
                  .map((p) => ({ label: p.name, value: p._id }))}
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
                options={issueTypes.map((t) => ({ label: t, value: t }))}
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
                    .filter((u) => u.isActive && (u.role === "senior_engineer" || u.role === "engineer" || u.role === "intern"))
                    .map((u) => ({
                      label: `${u.name} — ${ROLE_LABELS[u.role] || u.role}`,
                      value: u._id,
                    })),
                ]}
                className="h-11 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center justify-between">
                <span>Estimated Time</span>
                {form.estimatedHours && (
                  <span className="text-xs font-normal text-[var(--text-tertiary)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-md">
                    {Math.round(Number(form.estimatedHours) * 60)} minutes total
                  </span>
                )}
              </Label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Hours"
                    value={hoursVal}
                    onChange={handleHoursChange}
                    className="h-11 text-sm pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] pointer-events-none">hrs</span>
                </div>
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    placeholder="Minutes"
                    value={minutesVal}
                    onChange={handleMinutesChange}
                    className="h-11 text-sm pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] pointer-events-none">mins</span>
                </div>
              </div>
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
