"use client";

import React from "react";
import { Calendar, Mail, Phone, User, Tag, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@/api/services/project-management/project-service";

interface ProjectViewModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ProjectViewModal({ project, open, onOpenChange }: ProjectViewModalProps) {
  if (!project) return null;

  const photoUrl = project.photo ? `http://localhost:5001${project.photo}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
        <DialogHeader className="space-y-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-start gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={project.name}
                className="h-16 w-16 rounded-xl object-cover border border-[var(--border)] shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-2xl shrink-0">
                {project.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">
                  {project.name}
                </DialogTitle>
                <Badge
                  variant={project.isActive ? "default" : "secondary"}
                  className={`text-[10px] font-bold ${project.isActive ? "bg-[var(--success)] text-white" : ""}`}
                >
                  {project.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {project.projectType?.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {project.projectType.map((t) => (
                    <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.1)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <DialogDescription className="text-xs text-[var(--text-secondary)] mt-1">
                Created {fmtDate(project.createdAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Completion */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--text-secondary)] uppercase tracking-wider">Completion</span>
              <span className="text-[var(--primary)]">{project.completion ?? 0}%</span>
            </div>
            <Progress value={project.completion ?? 0} className="h-2.5" />
          </div>

          <Separator className="bg-[var(--border)]" />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
              <Calendar className="h-4 w-4 text-[var(--primary)] shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Start Date</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{fmtDate(project.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
              <Clock className="h-4 w-4 text-[var(--primary)] shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">End Date</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{fmtDate(project.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Description</h4>
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                {project.description}
              </div>
            </div>
          )}

          {/* Main Contact */}
          {(project.mainContact?.name || project.mainContact?.email || project.mainContact?.phone) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Main Contact</h4>
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
                {project.mainContact.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                    <span className="font-medium text-[var(--text-primary)]">{project.mainContact.name}</span>
                  </div>
                )}
                {project.mainContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                    <a href={`mailto:${project.mainContact.email}`} className="text-[var(--primary)] hover:underline font-medium">
                      {project.mainContact.email}
                    </a>
                  </div>
                )}
                {project.mainContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                    <span className="font-medium text-[var(--text-primary)]">{project.mainContact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {project.techStack?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tech Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[rgba(99,102,241,0.1)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] pt-1">
            <CheckCircle2 className="h-3 w-3" />
            Last updated {fmtDate(project.updatedAt)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
