"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: any) => void;
}

export function ProjectForm({ open, onOpenChange, onSubmit }: ProjectFormProps) {
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");

  const toggleProjectType = (type: string) => {
    setProjectTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSubmit = () => {
    if (!projectName.trim() || !startDate || !endDate) {
      alert("Project Name, Start Date, and End Date are mandatory fields.");
      return;
    }
    
    const newProject = {
      name: projectName,
      client: clientName || "Unknown Client",
      status: isActive ? "Active" : "Inactive",
      usedHours: 0,
      allocatedHours: 0,
      openIssues: 0,
      closedIssues: 0,
      description,
      startDate,
      endDate,
      projectTypes,
      clientContact,
      photoUrl: photoPreview,
    };
    
    onSubmit(newProject);
    
    // Reset form
    setProjectName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    setClientName("");
    setClientContact("");
    setProjectTypes([]);
    setPhotoPreview(null);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Fill in the basic information to create a new project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col gap-2">
            <Label>Project Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center bg-[var(--surface-hover)] overflow-hidden">
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <Upload className="w-6 h-6 text-[var(--text-tertiary)]" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Upload a square image (max 2MB).
                </p>
              </div>
            </div>
          </div>

          {/* Project Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectName">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="projectName" 
              placeholder="Enter project name" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              className="resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="startDate" 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="endDate" 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Project Type */}
          <div className="flex flex-col gap-3">
            <Label>Project Type</Label>
            <div className="flex flex-wrap gap-4">
              {["New Development", "CR", "Support"].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      projectTypes.includes(type)
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : "border-[var(--border)] group-hover:border-[var(--primary)]"
                    }`}
                  >
                    {projectTypes.includes(type) && (
                      <svg
                        viewBox="0 0 14 14"
                        className="w-3 h-3 text-white fill-current"
                      >
                        <path d="M5.5 11.5L2 8l1.4-1.4 2.1 2.1 6.1-6.1L13 4l-7.5 7.5z" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={projectTypes.includes(type)}
                    onChange={() => toggleProjectType(type)}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
            <div className="flex flex-col">
              <Label>Project Status</Label>
              <span className="text-xs text-[var(--text-secondary)]">
                Set to active if the project is currently ongoing.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Inactive</span>
              <Switch 
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>

          {/* Client Details Section */}
          <div className="pt-2 border-t border-[var(--border)] mt-2 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Client Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input 
                  id="clientName" 
                  placeholder="Enter client name" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="clientContact">Contact</Label>
                <Input 
                  id="clientContact" 
                  placeholder="Enter contact info" 
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
