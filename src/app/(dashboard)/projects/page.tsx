"use client";

import React, { useState } from "react";
import {
  FolderKanban, Plus, Search, Eye, Pencil, Trash2, Calendar,
  Mail, Phone, Tag, LayoutGrid, List, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { ConfirmDialog } from "@/components/molecules/confirmDialog";
import { ProjectFormModal, ProjectViewModal } from "@/components";
import {
  usePaginateProjects, useDeleteProject, type Project,
} from "@/api/services/project-management/project-service";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ProjectTypeBadges({ types }: { types: string[] }) {
  if (!types?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((t) => (
        <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(99,102,241,0.1)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
          {t}
        </span>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Project Card (Grid View)
// ──────────────────────────────────────────────────────────────
function ProjectCard({
  project, onView, onEdit, onDelete,
}: {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const photoUrl = project.photo ? `http://localhost:5001${project.photo}` : null;

  return (
    <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-md transition-all">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt={project.name} className="h-11 w-11 rounded-xl object-cover border border-[var(--border)] shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-lg shrink-0">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{project.name}</h3>
              <Badge
                variant={project.isActive ? "default" : "secondary"}
                className={`text-[9px] font-bold shrink-0 ${project.isActive ? "bg-[var(--success)] text-white border-0" : ""}`}
              >
                {project.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <ProjectTypeBadges types={project.projectType} />
          </div>
        </div>

        {/* Completion */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Completion</span>
            <span className="font-semibold text-[var(--text-primary)]">{project.completion ?? 0}%</span>
          </div>
          <Progress value={project.completion ?? 0} className="h-1.5" />
        </div>

        {/* Dates */}
        <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {fmtDate(project.startDate)}
          </span>
          <span className="text-[var(--text-tertiary)]">→</span>
          <span>{fmtDate(project.endDate)}</span>
        </div>

        {/* Contact */}
        {(project.mainContact?.name || project.mainContact?.email) && (
          <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
            {project.mainContact.name && (
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{project.mainContact.email || project.mainContact.name}</span>
              </div>
            )}
            {project.mainContact.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{project.mainContact.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Tech Stack */}
        {project.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.techStack.slice(0, 4).map((tech) => (
              <span key={tech} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--text-secondary)]">
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--text-tertiary)]">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 pt-1 border-t border-[var(--border)]">
          <Button variant="ghost" size="sm" onClick={onView} className="flex-1 h-8 text-xs gap-1 text-[var(--text-secondary)] hover:text-[var(--primary)]">
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <ValidatePermission permission="projects.project.update">
            <Button variant="ghost" size="sm" onClick={onEdit} className="flex-1 h-8 text-xs gap-1 text-[var(--text-secondary)] hover:text-[var(--primary)]">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </ValidatePermission>
          <ValidatePermission permission="projects.project.delete">
            <Button variant="ghost" size="sm" onClick={onDelete} className="flex-1 h-8 text-xs gap-1 text-[var(--text-secondary)] hover:text-[var(--error)]">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </ValidatePermission>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Project Table Row (List View)
// ──────────────────────────────────────────────────────────────
function ProjectTableRow({
  project, onView, onEdit, onDelete,
}: {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const photoUrl = project.photo ? `http://localhost:5001${project.photo}` : null;

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt={project.name} className="h-9 w-9 rounded-lg object-cover border border-[var(--border)] shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold shrink-0">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</p>
            <ProjectTypeBadges types={project.projectType} />
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge
          variant={project.isActive ? "default" : "secondary"}
          className={`text-[10px] font-bold ${project.isActive ? "bg-[var(--success)] text-white border-0" : ""}`}
        >
          {project.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="space-y-1 min-w-[100px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">{project.completion ?? 0}%</span>
          </div>
          <Progress value={project.completion ?? 0} className="h-1.5 w-24" />
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
        {fmtDate(project.startDate)} → {fmtDate(project.endDate)}
      </td>
      <td className="py-3 px-4">
        {project.mainContact?.email ? (
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
            <Mail className="h-3 w-3" />{project.mainContact.email}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)]">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {project.techStack?.slice(0, 3).map((t) => (
            <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--text-secondary)]">
              {t}
            </span>
          ))}
          {(project.techStack?.length ?? 0) > 3 && (
            <span className="text-[9px] text-[var(--text-tertiary)]">+{project.techStack.length - 3}</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onView} className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-[var(--primary)]">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <ValidatePermission permission="projects.project.update">
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-[var(--primary)]">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </ValidatePermission>
          <ValidatePermission permission="projects.project.delete">
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-[var(--error)]">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </ValidatePermission>
        </div>
      </td>
    </tr>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const deleteMutation = useDeleteProject();

  const { data, isLoading } = usePaginateProjects({
    page,
    limit: 12,
    search: search || undefined,
    sortBy: "createdAt:desc",
  });

  const projects: Project[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  const handleView = (p: Project) => { setSelectedProject(p); setShowViewModal(true); };
  const handleEdit = (p: Project) => { setSelectedProject(p); setShowFormModal(true); };
  const handleDeleteClick = (p: Project) => { setProjectToDelete(p); setShowDeleteDialog(true); };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await deleteMutation.mutateAsync(projectToDelete._id);
      toast.success(`"${projectToDelete.name}" archived successfully.`);
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    } catch {
      toast.error("Failed to archive project.");
    }
  };

  const handleNewProject = () => { setSelectedProject(null); setShowFormModal(true); };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-[var(--primary)]" />
            Projects
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isLoading ? "Loading..." : `${totalResults} project${totalResults !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <ValidatePermission permission="projects.project.create">
          <Button
            size="sm"
            onClick={handleNewProject}
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </ValidatePermission>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 bg-[var(--surface)]"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[var(--primary)] text-white" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-[var(--primary)] text-white" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="h-12 w-12 text-[var(--text-tertiary)] mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">No projects found</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {search ? `No results for "${search}"` : "Get started by creating your first project."}
          </p>
          {!search && (
            <ValidatePermission permission="projects.project.create">
              <Button size="sm" onClick={handleNewProject} className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
                <Plus className="h-3.5 w-3.5" /> New Project
              </Button>
            </ValidatePermission>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              onView={() => handleView(p)}
              onEdit={() => handleEdit(p)}
              onDelete={() => handleDeleteClick(p)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                {["Project", "Status", "Completion", "Dates", "Contact", "Tech Stack", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <ProjectTableRow
                  key={p._id}
                  project={p}
                  onView={() => handleView(p)}
                  onEdit={() => handleEdit(p)}
                  onDelete={() => handleDeleteClick(p)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 text-xs">
            Previous
          </Button>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 text-xs">
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      <ProjectFormModal
        open={showFormModal}
        onOpenChange={(v) => { setShowFormModal(v); if (!v) setSelectedProject(null); }}
        project={selectedProject}
      />

      <ProjectViewModal
        project={selectedProject}
        open={showViewModal}
        onOpenChange={(v) => { setShowViewModal(v); if (!v) setSelectedProject(null); }}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Archive Project"
        description={`Are you sure you want to archive "${projectToDelete?.name}"? The project will be hidden from active views but all historical data — issues, time tracking, and reports — will be preserved.`}
        confirmLabel="Archive Project"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
