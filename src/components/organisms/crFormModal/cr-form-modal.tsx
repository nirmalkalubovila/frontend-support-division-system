"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useCreateCR, useUpdateCR,
  type ChangeRequest, type CRType, type CRPriority, type CRStatus,
} from "@/api/services/project-management/cr-service";
import type { User } from "@/api/services/user-management/user-service";

const CR_TYPES: CRType[] = ["Enhancement", "New Feature", "Modification", "Integration", "UI/UX Change", "Data Change", "Bug Fix", "Other"];
const CR_PRIORITIES: CRPriority[] = ["Critical", "High", "Medium", "Low"];
const CR_STATUSES: CRStatus[] = ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "In Development", "Testing", "Completed", "Closed"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  cr?: ChangeRequest | null;
  availableMembers: User[];
}

type Section = "basic" | "team" | "details";

export function CRFormModal({ open, onOpenChange, projectId, cr, availableMembers }: Props) {
  const isEdit = !!cr;
  const createMutation = useCreateCR(projectId);
  const updateMutation = useUpdateCR(projectId);
  const [activeSection, setActiveSection] = useState<Section>("basic");

  const emptyForm = {
    title: "", crType: "Enhancement" as CRType, priority: "Medium" as CRPriority, status: "Draft" as CRStatus,
    requestedBy: "", requestedDate: "", targetReleaseDate: "", estimatedHours: "", estimatedCost: "",
    assignedProjectManager: "", description: "", businessJustification: "", technicalApproach: "",
    impactAnalysis: "", dependencies: "", risks: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [assignedDevs, setAssignedDevs] = useState<string[]>([]);
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    if (cr) {
      setForm({
        title: cr.title,
        crType: cr.crType,
        priority: cr.priority,
        status: cr.status,
        requestedBy: cr.requestedBy || "",
        requestedDate: cr.requestedDate ? cr.requestedDate.split("T")[0] : "",
        targetReleaseDate: cr.targetReleaseDate ? cr.targetReleaseDate.split("T")[0] : "",
        estimatedHours: cr.estimatedHours != null ? String(cr.estimatedHours) : "",
        estimatedCost: cr.estimatedCost != null ? String(cr.estimatedCost) : "",
        assignedProjectManager: typeof cr.assignedProjectManager === "object" ? cr.assignedProjectManager?._id || "" : cr.assignedProjectManager || "",
        description: cr.description || "",
        businessJustification: cr.businessJustification || "",
        technicalApproach: cr.technicalApproach || "",
        impactAnalysis: cr.impactAnalysis || "",
        dependencies: cr.dependencies || "",
        risks: cr.risks || "",
      });
      setAssignedDevs(cr.assignedDevelopers?.map((d) => (typeof d === "object" ? d._id : d)) ?? []);
      setLinks(cr.relatedLinks ?? []);
    } else {
      setForm(emptyForm);
      setAssignedDevs([]);
      setLinks([]);
      setActiveSection("basic");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cr, open]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: form.title.trim(),
      crType: form.crType,
      priority: form.priority,
      status: form.status,
      requestedBy: form.requestedBy || null,
      requestedDate: form.requestedDate || null,
      targetReleaseDate: form.targetReleaseDate || null,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
      assignedProjectManager: form.assignedProjectManager || null,
      assignedDevelopers: assignedDevs,
      description: form.description || null,
      businessJustification: form.businessJustification || null,
      technicalApproach: form.technicalApproach || null,
      impactAnalysis: form.impactAnalysis || null,
      dependencies: form.dependencies || null,
      risks: form.risks || null,
      relatedLinks: links.filter((l) => l.url),
    };
    try {
      if (isEdit && cr) {
        await updateMutation.mutateAsync({ crId: cr._id, data: payload });
        toast.success("Change request updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Change request created");
      }
      onOpenChange(false);
    } catch { toast.error("Failed to save change request"); }
  };

  if (!open) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const SelectField = ({ label, field, options }: { label: string; field: keyof typeof form; options: string[] }) => (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</Label>
      <div className="relative">
        <select
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
          className="w-full h-9 appearance-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 pr-7 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-xs">▾</span>
      </div>
    </div>
  );

  const tabs: { key: Section; label: string }[] = [
    { key: "basic", label: "Basic Info" },
    { key: "team", label: "Team & Dates" },
    { key: "details", label: "Technical Details" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {isEdit ? "Edit Change Request" : "New Change Request"}
            </h2>
            {isEdit && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{cr?.crNumber}</p>}
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-6 shrink-0">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveSection(t.key)}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 -mb-px transition-all ${
                activeSection === t.key
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {activeSection === "basic" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">CR Title *</Label>
                  <Input value={form.title} onChange={(e) => set("title", e.target.value)}
                    placeholder="Describe the change request..." className="bg-[var(--background)] border-[var(--border)]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <SelectField label="CR Type" field="crType" options={CR_TYPES} />
                  <SelectField label="Priority" field="priority" options={CR_PRIORITIES} />
                  <SelectField label="Status" field="status" options={CR_STATUSES} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Requested By</Label>
                  <Input value={form.requestedBy} onChange={(e) => set("requestedBy", e.target.value)}
                    placeholder="Client contact name" className="bg-[var(--background)] border-[var(--border)]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Description</Label>
                  <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe the change in detail..." className="bg-[var(--background)] border-[var(--border)] min-h-[100px] resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Business Justification</Label>
                  <Textarea value={form.businessJustification} onChange={(e) => set("businessJustification", e.target.value)}
                    placeholder="Why is this change needed?" className="bg-[var(--background)] border-[var(--border)] min-h-[80px] resize-none" />
                </div>
              </>
            )}

            {activeSection === "team" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Requested Date</Label>
                    <Input type="date" value={form.requestedDate} onChange={(e) => set("requestedDate", e.target.value)} className="bg-[var(--background)] border-[var(--border)]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Target Release Date</Label>
                    <Input type="date" value={form.targetReleaseDate} onChange={(e) => set("targetReleaseDate", e.target.value)} className="bg-[var(--background)] border-[var(--border)]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Estimated Hours</Label>
                    <Input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => set("estimatedHours", e.target.value)}
                      placeholder="0" className="bg-[var(--background)] border-[var(--border)]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Estimated Cost ($)</Label>
                    <Input type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(e) => set("estimatedCost", e.target.value)}
                      placeholder="0.00" className="bg-[var(--background)] border-[var(--border)]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Project Manager</Label>
                  <div className="relative">
                    <select value={form.assignedProjectManager} onChange={(e) => set("assignedProjectManager", e.target.value)}
                      className="w-full h-9 appearance-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 pr-7 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]">
                      <option value="">— Unassigned —</option>
                      {availableMembers.filter((m) => ["super_admin", "manager", "senior_engineer"].includes(m.role)).map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-xs">▾</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Assigned Developers</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableMembers.filter((m) => m.role !== "intern").map((m) => {
                      const sel = assignedDevs.includes(m._id);
                      return (
                        <button key={m._id} type="button"
                          onClick={() => setAssignedDevs((p) => sel ? p.filter((id) => id !== m._id) : [...p, m._id])}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            sel
                              ? "bg-[rgba(99,102,241,0.08)] border-[rgba(99,102,241,0.3)] text-[var(--primary)]"
                              : "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sel ? "bg-[var(--primary)]" : "bg-[var(--text-tertiary)]"}`} />
                          {m.name.split(" ")[0]}
                        </button>
                      );
                    })}
                  </div>
                  {assignedDevs.length > 0 && (
                    <p className="text-[10px] text-[var(--text-secondary)]">{assignedDevs.length} developer{assignedDevs.length !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Related Links</Label>
                    <button type="button" onClick={() => setLinks((p) => [...p, { label: "", url: "" }])}
                      className="text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add Link
                    </button>
                  </div>
                  {links.map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={l.label}
                        onChange={(e) => setLinks((p) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        placeholder="Label" className="bg-[var(--background)] border-[var(--border)] text-sm w-28 shrink-0" />
                      <Input value={l.url}
                        onChange={(e) => setLinks((p) => p.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                        placeholder="https://..." className="bg-[var(--background)] border-[var(--border)] text-sm flex-1" />
                      <button type="button" onClick={() => setLinks((p) => p.filter((_, j) => j !== i))}
                        className="text-[var(--text-tertiary)] hover:text-red-500 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === "details" && (
              <>
                {(
                  [
                    { label: "Technical Approach", field: "technicalApproach", placeholder: "How will this be implemented?" },
                    { label: "Impact Analysis", field: "impactAnalysis", placeholder: "What areas will be affected?" },
                    { label: "Dependencies", field: "dependencies", placeholder: "List dependencies or blockers..." },
                    { label: "Risks", field: "risks", placeholder: "Potential risks and mitigation strategies..." },
                  ] as { label: string; field: keyof typeof form; placeholder: string }[]
                ).map(({ label, field, placeholder }) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</Label>
                    <Textarea value={form[field]} onChange={(e) => set(field, e.target.value)}
                      placeholder={placeholder} className="bg-[var(--background)] border-[var(--border)] min-h-[80px] resize-none" />
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] shrink-0">
            <div className="flex gap-1.5">
              {tabs.map((t) => (
                <span key={t.key} className={`h-1.5 w-6 rounded-full transition-all ${activeSection === t.key ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              {activeSection !== "details" && (
                <Button type="button" size="sm" variant="outline"
                  onClick={() => setActiveSection(activeSection === "basic" ? "team" : "details")}
                  className="h-9">Next →</Button>
              )}
              <Button type="submit" size="sm" disabled={isPending}
                className="h-9 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white gap-1.5">
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create CR"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
