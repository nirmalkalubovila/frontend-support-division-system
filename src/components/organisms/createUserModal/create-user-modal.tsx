"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateUser } from "@/api/services/user-management/user-service";
import { USER_ROLES, ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/types/global-types";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const createUserMutation = useCreateUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "engineer" as UserRole,
    phone: "",
    designation: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "engineer",
      phone: "",
      designation: "",
    });
    setValidationError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, role: e.target.value as UserRole }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Simple Validation
    if (!formData.name.trim()) {
      setValidationError("Name is required");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setValidationError("Please enter a valid email address");
      return;
    }
    if (formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone.trim() || undefined,
        designation: formData.designation.trim() || undefined,
      });

      toast.success("User created successfully!");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to create user. Please try again.";
      setValidationError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-5.5 w-5.5 text-[var(--primary)]" />
            Add New User
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-secondary)]">
            Create a new account on the support system and configure their role.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[var(--error)] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Full Name *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Hasitha Fernando"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
            />
          </div>

          {/* Email & Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. name@prologics.lk"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Password *
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
              />
            </div>
          </div>

          {/* Role & Designation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                System Role *
              </Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                required
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                {USER_ROLES.map((roleKey) => (
                  <option key={roleKey} value={roleKey}>
                    {ROLE_LABELS[roleKey]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="designation" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Designation
              </Label>
              <Input
                id="designation"
                name="designation"
                placeholder="e.g. Associate Engineer"
                value={formData.designation}
                onChange={handleInputChange}
                className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              placeholder="e.g. 0771234567"
              value={formData.phone}
              onChange={handleInputChange}
              className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
            />
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 gap-2 border-t border-[var(--border)] mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createUserMutation.isPending}
              className="h-10 text-sm font-semibold border-[var(--border)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="h-10 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow hover:opacity-90 transition-opacity"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
