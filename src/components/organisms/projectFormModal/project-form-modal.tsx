"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, FolderKanban, UploadCloud, X, Plus, Code2, Headphones } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useCreateProject, useUpdateProject,
  type Project, type CreateProjectPayload, type MainContact,
} from "@/api/services/project-management/project-service";
import { useGetAllClients } from "@/api/services/project-management/client-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";
import { API_BASE_URL } from "@/lib/constants";

const STATIC_BASE = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

const PROJECT_TYPES = ["New Development", "CR", "Support"] as const;

const TECH_SUGGESTIONS = [
  "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express",
  "NestJS", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker",
  "TypeScript", "JavaScript", "Python", "PHP", "Laravel", "AWS",
  "Azure", "Firebase", "GraphQL", "REST API",
];

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

const makeEmptyForm = () => ({
  name: "",
  description: "",
  isActive: true,
  completion: 0,
  startDate: "",
  endDate: "",
  projectType: [] as string[],
  techStack: [] as string[],
  mainContact: { name: "", email: "", phone: "" } as MainContact,
  client: "",
  contractType: "" as any,
  allocatedHours: 0,
  members: [] as string[],
  stage: "development" as "development" | "support",
});

export function ProjectFormModal({ open, onOpenChange, project }: ProjectFormModalProps) {
  const isEdit = !!project;
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: clients } = useGetAllClients();
  const { data: users } = useGetAllUsers();

  const [form, setForm] = useState(makeEmptyForm());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [techInput, setTechInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (project) {
      const inferredStage: "development" | "support" =
        (project.allocatedHours && project.allocatedHours > 0) ? "support" : "development";
      setForm({
        name: project.name || "",
        description: project.description || "",
        isActive: project.isActive,
        completion: project.completion ?? 0,
        startDate: project.startDate ? project.startDate.split("T")[0] : "",
        endDate: project.endDate ? project.endDate.split("T")[0] : "",
        projectType: project.projectType || [],
        techStack: project.techStack || [],
        mainContact: {
          name: project.mainContact?.name || "",
          email: project.mainContact?.email || "",
          phone: project.mainContact?.phone || "",
        },
        client: typeof project.client === "object" && project.client ? project.client._id : (project.client || ""),
        contractType: project.contractType || "",
        allocatedHours: project.allocatedHours || 0,
        members: project.members ? project.members.map((m: any) => typeof m === "object" ? m._id : m) : [],
        stage: inferredStage,
      });
      setPhotoPreview(project.photo ? `${STATIC_BASE}${project.photo}` : null);
    } else {
      setForm(makeEmptyForm());
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setValidationError(null);
    setTechInput("");
  }, [open, project]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPhotoFile(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const toggleProjectType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      projectType: prev.projectType.includes(type)
        ? prev.projectType.filter((t) => t !== type)
        : [...prev.projectType, type],
    }));
  };

  const addTech = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed || form.techStack.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, techStack: [...prev.techStack, trimmed] }));
    setTechInput("");
    setShowSuggestions(false);
  };

  const removeTech = (tech: string) => {
    setForm((prev) => ({ ...prev, techStack: prev.techStack.filter((t) => t !== tech) }));
  };

  const filteredSuggestions = TECH_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(techInput.toLowerCase()) && !form.techStack.includes(s)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!form.name.trim()) {
      setValidationError("Project name is required.");
      return;
    }
    if (form.stage === "support" && (!form.allocatedHours || form.allocatedHours <= 0)) {
      setValidationError("Monthly allocation hours are required for support stage projects.");
      return;
    }

    const payload: CreateProjectPayload & { isActive?: boolean } = {
      name: form.name.trim(),
      description: form.description || null,
      isActive: form.isActive,
      completion: form.completion,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      projectType: form.projectType,
      techStack: form.techStack,
      mainContact: {
        name: form.mainContact.name || null,
        email: form.mainContact.email || null,
        phone: form.mainContact.phone || null,
      },
      photo: photoFile,
      client: form.client || null,
      contractType: form.contractType || null,
      allocatedHours: Number(form.allocatedHours) || 0,
      members: form.members,
    };

    try {
      if (isEdit && project) {
        await updateMutation.mutateAsync({ id: project._id, data: payload });
        toast.success("Project updated successfully!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Project created successfully!");
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} project.`;
      setValidationError(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
        <DialogHeader className="space-y-1.5 border-b border-[var(--border)] pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-[var(--primary)]" />
            {isEdit ? "Edit Project" : "New Project"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-secondary)]">
            {isEdit ? "Update the project details below." : "Fill in the project details to create a new project."}
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[var(--error)] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">

          {/* ── Basic Information ─────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Basic Information
            </h3>

            {/* Name + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Project Name *
                </Label>
                <Input
                  placeholder="e.g. AquaFresh ERP Support"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Status
                </Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                  />
                  <span className={`text-xs font-semibold ${form.isActive ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"}`}>
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Project Photo
              </Label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              {photoPreview ? (
                <div className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
                    <img
                      src={photoPreview}
                      alt="Project photo preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-xs">Replace</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => {
                      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }} className="h-8 text-xs">Remove</Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] cursor-pointer transition-all"
                >
                  <UploadCloud className="h-6 w-6 text-[var(--text-tertiary)] mb-1" />
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Click to upload</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">PNG, JPG, WEBP (Max 5MB)</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Description
              </Label>
              <Textarea
                placeholder="Describe the project scope, goals, and context..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium min-h-[90px]"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                />
              </div>
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Project Type
              </Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleProjectType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.projectType.includes(type)
                        ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                        : "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--background)] w-fit">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, stage: "development", allocatedHours: 0 }))}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  form.stage === "development"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" /> Development
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, stage: "support" }))}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  form.stage === "support"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Headphones className="h-3.5 w-3.5" /> Support
              </button>
            </div>

            {/* Monthly Allocation — support stage only */}
            {form.stage === "support" && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.05)]">
                <Headphones className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                    Monthly Allocation Hours *
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 40"
                    value={form.allocatedHours || ""}
                    onChange={(e) => setForm((p) => ({ ...p, allocatedHours: Number(e.target.value) }))}
                    className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                    min={1}
                    required
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)]">Total hours allocated to this project per month.</p>
                </div>
              </div>
            )}
          </section>

          {/* ── Retainer & Contract Configuration ─────────── */}
          <section className="space-y-4 pt-2 border-t border-[var(--border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Retainer & Contract Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Client
                </Label>
                <select
                  value={form.client}
                  onChange={(e) => setForm((p) => ({ ...p, client: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-medium"
                >
                  <option value="">Select Client</option>
                  {clients?.data?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Contract Type Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Contract Type
                </Label>
                <select
                  value={form.contractType}
                  onChange={(e) => setForm((p) => ({ ...p, contractType: e.target.value as any }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-medium"
                >
                  <option value="">Select Contract Type</option>
                  <option value="Monthly Retainer">Monthly Retainer</option>
                  <option value="Per-Incident">Per-Incident</option>
                  <option value="Time & Material">Time & Material</option>
                  <option value="Fixed">Fixed Price</option>
                </select>
              </div>
            </div>

            {/* Team Members Allocation */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Assigned Team Members
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] max-h-36 overflow-y-auto">
                {users?.map((u) => {
                  const isChecked = form.members.includes(u._id);
                  return (
                    <label key={u._id} className="flex items-center gap-2 text-xs font-medium cursor-pointer text-[var(--text-primary)] select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            members: checked
                              ? [...prev.members, u._id]
                              : prev.members.filter((id) => id !== u._id),
                          }));
                        }}
                        className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                      />
                      <span>{u.name} ({u.designation || u.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Main Contact ─────────────────────────────── */}
          <section className="space-y-3 pt-2 border-t border-[var(--border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Main Contact Point
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Name</Label>
                <Input
                  placeholder="Contact name"
                  value={form.mainContact.name || ""}
                  onChange={(e) => setForm((p) => ({ ...p, mainContact: { ...p.mainContact, name: e.target.value } }))}
                  className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Email</Label>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  value={form.mainContact.email || ""}
                  onChange={(e) => setForm((p) => ({ ...p, mainContact: { ...p.mainContact, email: e.target.value } }))}
                  className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Phone</Label>
                <Input
                  placeholder="+94 77 123 4567"
                  value={form.mainContact.phone || ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d+]/g, "");
                    let formatted = digits;
                    if (digits.startsWith("+94")) {
                      const local = digits.slice(3);
                      if (local.length <= 2) formatted = `+94 ${local}`;
                      else if (local.length <= 4) formatted = `+94 ${local.slice(0,2)} ${local.slice(2)}`;
                      else formatted = `+94 ${local.slice(0,2)} ${local.slice(2,5)} ${local.slice(5,9)}`;
                    } else if (digits.startsWith("0")) {
                      const body = digits.slice(1);
                      if (body.length <= 2) formatted = `0${body}`;
                      else if (body.length <= 5) formatted = `0${body.slice(0,2)} ${body.slice(2)}`;
                      else formatted = `0${body.slice(0,2)} ${body.slice(2,5)} ${body.slice(5,9)}`;
                    }
                    setForm((p) => ({ ...p, mainContact: { ...p.mainContact, phone: formatted } }));
                  }}
                  className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                />
              </div>
            </div>
          </section>

          {/* ── Tech Stack ───────────────────────────────── */}
          <section className="space-y-3 pt-2 border-t border-[var(--border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Tech Stack
            </h3>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a technology and press Enter..."
                  value={techInput}
                  onChange={(e) => { setTechInput(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTech(techInput); }
                    if (e.key === "Escape") setShowSuggestions(false);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addTech(techInput)} className="h-10 px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showSuggestions && techInput && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-12 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => addTech(s)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[rgba(99,102,241,0.1)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]"
                  >
                    {tech}
                    <button type="button" onClick={() => removeTech(tech)} className="hover:text-[var(--error)] transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <DialogFooter className="pt-4 gap-2 border-t border-[var(--border)] mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-10 text-sm font-semibold border-[var(--border)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow hover:opacity-90 transition-opacity"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />{isEdit ? "Saving..." : "Creating..."}</>
              ) : (
                isEdit ? "Save Changes" : "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
