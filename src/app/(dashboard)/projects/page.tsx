"use client";

import { FolderKanban, Plus, Search } from "lucide-react";
import { Button, Input, Badge, Card, CardContent, Progress } from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";

// Mock projects for shell
const MOCK_PROJECTS = [
  { name: "AquaFresh ERP Support", client: "AquaFresh Ltd", status: "Active", usedHours: 14, allocatedHours: 20, openIssues: 5, closedIssues: 12 },
  { name: "SwiftMove CMS Monthly", client: "SwiftMove Corp", status: "Active", usedHours: 8, allocatedHours: 15, openIssues: 3, closedIssues: 7 },
  { name: "ElevateSoft Factory ERP", client: "ElevateSoft", status: "On Hold", usedHours: 19, allocatedHours: 20, openIssues: 2, closedIssues: 20 },
];

export default function ProjectsPage() {
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
            Manage client projects and hour allocations
          </p>
        </div>
        <ValidatePermission permission="projects.project.create">
          <Button size="sm" className="gap-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </ValidatePermission>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input placeholder="Search projects..." className="pl-9 h-10 bg-[var(--surface)]" />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_PROJECTS.map((project) => (
          <Card key={project.name} className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all cursor-pointer hover:shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{project.client}</p>
                </div>
                <Badge
                  variant={project.status === "Active" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {project.status}
                </Badge>
              </div>

              {/* Hours Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Hours Used</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {project.usedHours}/{project.allocatedHours}h
                  </span>
                </div>
                <Progress
                  value={(project.usedHours / project.allocatedHours) * 100}
                  className="h-2"
                />
              </div>

              {/* Issue counts */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[var(--warning)]" />
                  <span className="text-[var(--text-secondary)]">{project.openIssues} open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                  <span className="text-[var(--text-secondary)]">{project.closedIssues} closed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
