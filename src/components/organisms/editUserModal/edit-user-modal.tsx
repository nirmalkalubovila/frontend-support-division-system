"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, UserCog, Shield, Info, Lock } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUpdateUser } from "@/api/services/user-management/user-service";
import { USER_ROLES, ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/types/global-types";
import type { User } from "@/api/services/user-management/user-service";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

// Map roles to their default backend permissions
const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  intern: [
    "issues.issue.read",
    "time_tracking.time_log.create",
    "time_tracking.time_log.read",
    "reports.user_performance.read",
  ],
  engineer: [
    "issues.issue.read",
    "time_tracking.time_log.create",
    "time_tracking.time_log.read",
    "reports.user_performance.read",
    "issues.issue.update",
    "time_tracking.time_log.update",
  ],
  senior_engineer: [
    "issues.issue.read",
    "time_tracking.time_log.create",
    "time_tracking.time_log.read",
    "reports.user_performance.read",
    "issues.issue.update",
    "time_tracking.time_log.update",
    "issues.issue.create",
    "issues.issue.delete",
    "projects.project.read",
    "projects.client.read",
    "projects.task.read",
    "projects.cr.read",
    "finance.payment.read",
  ],
  manager: [
    "issues.issue.read",
    "time_tracking.time_log.create",
    "time_tracking.time_log.read",
    "reports.user_performance.read",
    "issues.issue.update",
    "time_tracking.time_log.update",
    "issues.issue.create",
    "issues.issue.delete",
    "projects.project.read",
    "projects.client.read",
    "projects.project.create",
    "projects.project.update",
    "projects.project.delete",
    "projects.client.create",
    "projects.client.update",
    "projects.client.delete",
    "projects.task.create",
    "projects.task.read",
    "projects.task.update",
    "projects.task.delete",
    "projects.cr.create",
    "projects.cr.read",
    "projects.cr.update",
    "projects.cr.delete",
    "reports.project_performance.create",
    "reports.project_performance.read",
    "reports.project_performance.update",
    "reports.project_performance.delete",
    "reports.user_performance.create",
    "reports.user_performance.update",
    "reports.user_performance.delete",
    "reports.executive_performance.create",
    "reports.executive_performance.read",
    "reports.executive_performance.update",
    "reports.executive_performance.delete",
    "time_tracking.time_log.delete",
    "system.settings.read",
    "system.priority.read",
    "system.priority.update",
    "system.category.read",
    "system.category.create",
    "system.category.update",
    "system.category.delete",
    "system.notification.read",
    "system.notification.update",
    "user_management.user.create",
    "user_management.user.read",
    "user_management.user.update",
    "user_management.user.delete",
    "finance.payment.create",
    "finance.payment.read",
    "finance.payment.update",
    "finance.payment.delete",
  ],
  super_admin: [
    "issues.issue.read",
    "time_tracking.time_log.create",
    "time_tracking.time_log.read",
    "reports.user_performance.read",
    "issues.issue.update",
    "time_tracking.time_log.update",
    "issues.issue.create",
    "issues.issue.delete",
    "projects.project.read",
    "projects.client.read",
    "projects.project.create",
    "projects.project.update",
    "projects.project.delete",
    "projects.client.create",
    "projects.client.update",
    "projects.client.delete",
    "projects.task.create",
    "projects.task.read",
    "projects.task.update",
    "projects.task.delete",
    "projects.cr.create",
    "projects.cr.read",
    "projects.cr.update",
    "projects.cr.delete",
    "reports.project_performance.create",
    "reports.project_performance.read",
    "reports.project_performance.update",
    "reports.project_performance.delete",
    "reports.user_performance.create",
    "reports.user_performance.update",
    "reports.user_performance.delete",
    "reports.executive_performance.create",
    "reports.executive_performance.read",
    "reports.executive_performance.update",
    "reports.executive_performance.delete",
    "time_tracking.time_log.delete",
    "system.settings.read",
    "system.priority.read",
    "system.priority.update",
    "system.category.read",
    "system.category.create",
    "system.category.update",
    "system.category.delete",
    "system.notification.read",
    "system.notification.update",
    "user_management.user.create",
    "user_management.user.read",
    "user_management.user.update",
    "user_management.user.delete",
    "system.settings.update",
    "system.settings.delete",
    "finance.payment.create",
    "finance.payment.read",
    "finance.payment.update",
    "finance.payment.delete",
  ],
};

// Complete list of permissions in the system, grouped by module
const SYSTEM_PERMISSIONS = [
  { key: "user_management.user.create", label: "Create Users", module: "User Management" },
  { key: "user_management.user.read", label: "View Users", module: "User Management" },
  { key: "user_management.user.update", label: "Update Users", module: "User Management" },
  { key: "user_management.user.delete", label: "Delete/Deactivate Users", module: "User Management" },

  { key: "projects.client.create", label: "Create Clients", module: "Projects & Clients" },
  { key: "projects.client.read", label: "View Clients", module: "Projects & Clients" },
  { key: "projects.client.update", label: "Update Clients", module: "Projects & Clients" },
  { key: "projects.client.delete", label: "Delete Clients", module: "Projects & Clients" },
  
  { key: "projects.project.create", label: "Create Projects", module: "Projects & Clients" },
  { key: "projects.project.read", label: "View Projects", module: "Projects & Clients" },
  { key: "projects.project.update", label: "Update Projects", module: "Projects & Clients" },
  { key: "projects.project.delete", label: "Delete Projects", module: "Projects & Clients" },

  { key: "projects.task.create", label: "Create Tasks", module: "Projects & Clients" },
  { key: "projects.task.read", label: "View Tasks", module: "Projects & Clients" },
  { key: "projects.task.update", label: "Update Tasks", module: "Projects & Clients" },
  { key: "projects.task.delete", label: "Delete Tasks", module: "Projects & Clients" },

  { key: "projects.cr.create", label: "Create CRs", module: "Projects & Clients" },
  { key: "projects.cr.read", label: "View CRs", module: "Projects & Clients" },
  { key: "projects.cr.update", label: "Update CRs", module: "Projects & Clients" },
  { key: "projects.cr.delete", label: "Delete CRs", module: "Projects & Clients" },

  { key: "issues.issue.create", label: "Create Issues", module: "Issue Management" },
  { key: "issues.issue.read", label: "View Issues", module: "Issue Management" },
  { key: "issues.issue.update", label: "Update Issues Status/Notes", module: "Issue Management" },
  { key: "issues.issue.delete", label: "Delete/Close Issues", module: "Issue Management" },

  { key: "time_tracking.time_log.create", label: "Log Time", module: "Time Tracking" },
  { key: "time_tracking.time_log.read", label: "View Time Logs", module: "Time Tracking" },
  { key: "time_tracking.time_log.update", label: "Update Time Logs", module: "Time Tracking" },
  { key: "time_tracking.time_log.delete", label: "Delete Time Logs", module: "Time Tracking" },

  { key: "finance.payment.create", label: "Create Payments", module: "Finance" },
  { key: "finance.payment.read", label: "View Payments & KPIs", module: "Finance" },
  { key: "finance.payment.update", label: "Update Payments", module: "Finance" },
  { key: "finance.payment.delete", label: "Delete Payments", module: "Finance" },

  { key: "reports.project_performance.create", label: "Generate Project Performance Report", module: "Reporting" },
  { key: "reports.project_performance.read", label: "View Project Performance View", module: "Reporting" },
  { key: "reports.project_performance.update", label: "Update Project Performance Report", module: "Reporting" },
  { key: "reports.project_performance.delete", label: "Delete Project Performance Report", module: "Reporting" },

  { key: "reports.user_performance.create", label: "Generate User Performance Report", module: "Reporting" },
  { key: "reports.user_performance.read", label: "View User Performance View", module: "Reporting" },
  { key: "reports.user_performance.update", label: "Update User Performance Report", module: "Reporting" },
  { key: "reports.user_performance.delete", label: "Delete User Performance Report", module: "Reporting" },

  { key: "reports.executive_performance.create", label: "Build Executive Performance Report", module: "Reporting" },
  { key: "reports.executive_performance.read", label: "View Executive View", module: "Reporting" },
  { key: "reports.executive_performance.update", label: "Update Executive Performance Report", module: "Reporting" },
  { key: "reports.executive_performance.delete", label: "Delete Executive Performance Report", module: "Reporting" },

  { key: "system.settings.read", label: "Read System Settings", module: "System Administration" },
  { key: "system.settings.update", label: "Update System Settings", module: "System Administration" },
  { key: "system.priority.read", label: "Read Priorities", module: "System Administration" },
  { key: "system.priority.update", label: "Update Priorities", module: "System Administration" },
  { key: "system.category.read", label: "Read Categories", module: "System Administration" },
  { key: "system.category.create", label: "Create Categories", module: "System Administration" },
  { key: "system.category.update", label: "Update Categories", module: "System Administration" },
  { key: "system.category.delete", label: "Delete Categories", module: "System Administration" },
  { key: "system.notification.read", label: "Read Notification Settings", module: "System Administration" },
  { key: "system.notification.update", label: "Update Notification Settings", module: "System Administration" },
];

export function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const updateUserMutation = useUpdateUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "engineer" as UserRole,
    phone: "",
    designation: "",
    isActive: true,
  });

  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize form when user prop changes or modal opens
  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "engineer",
        phone: user.phone || "",
        designation: user.designation || "",
        isActive: user.isActive !== undefined ? user.isActive : true,
      });

      // Filter permissions to find user-specific overrides (custom grants)
      const defaultRights = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
      const userCustomPerms = (user.permissions || []).filter(
        (p) => !defaultRights.includes(p)
      );
      setCustomPermissions(userCustomPerms);
      setValidationError(null);
      setActiveTab("profile");
    }
  }, [user, open]);

  // Sync custom permissions if the selected role is changed
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    setFormData((prev) => ({ ...prev, role: newRole }));
    
    // Recalculate overrides based on new role
    const newDefaults = ROLE_DEFAULT_PERMISSIONS[newRole] || [];
    setCustomPermissions((prev) => prev.filter((p) => !newDefaults.includes(p)));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handlePermissionToggle = (key: string, checked: boolean) => {
    setCustomPermissions((prev) => {
      if (checked) {
        return [...prev, key];
      } else {
        return prev.filter((p) => p !== key);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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

    try {
      await updateUserMutation.mutateAsync({
        id: user._id,
        data: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          phone: formData.phone.trim() || undefined,
          designation: formData.designation.trim() || undefined,
          isActive: formData.isActive,
          permissions: customPermissions,
        },
      });

      toast.success("User updated successfully!");
      onOpenChange(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to update user. Please try again.";
      setValidationError(errMsg);
      toast.error(errMsg);
    }
  };

  // Group permissions by module
  const permissionsByModule = SYSTEM_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, typeof SYSTEM_PERMISSIONS>);

  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[formData.role] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 space-y-1.5 shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserCog className="h-5.5 w-5.5 text-[var(--primary-text)]" />
            Edit User Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-secondary)]">
            Update account information, active status, and assign granular custom permission overrides.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="mx-6 my-2 flex items-start gap-2.5 p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[var(--error)] text-xs shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 border-b border-[var(--border)] shrink-0">
            <TabsList className="flex w-fit bg-transparent border-b border-transparent gap-6 p-0 h-10 rounded-none justify-start">
              <TabsTrigger
                value="profile"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:bg-transparent px-1 py-2 font-semibold text-sm hover:text-[var(--primary-text)]"
              >
                Profile Details
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:bg-transparent px-1 py-2 font-semibold text-sm hover:text-[var(--primary-text)]"
              >
                Granular Permissions
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <TabsContent value="profile" className="space-y-4 mt-0">
                {/* Name & Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Full Name *
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Email Address *
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                  />
                </div>

                {/* Role & Designation Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-role" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      System Role *
                    </Label>
                    <select
                      id="edit-role"
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
                    <Label htmlFor="edit-designation" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Designation
                    </Label>
                    <Input
                      id="edit-designation"
                      name="designation"
                      placeholder="e.g. Senior QA Engineer"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Phone & Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Phone Number
                    </Label>
                    <Input
                      id="edit-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-10 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
                    />
                  </div>

                  <div className="flex flex-col justify-end pb-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                      Account Status
                    </Label>
                    <div className="flex items-center gap-3 bg-[var(--background)] border border-[var(--border)] rounded-lg h-10 px-3">
                      <Switch
                        id="edit-status"
                        checked={formData.isActive}
                        onCheckedChange={handleSwitchChange}
                      />
                      <Label htmlFor="edit-status" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${formData.isActive ? 'bg-[var(--success)]' : 'bg-[var(--text-tertiary)]'}`} />
                        {formData.isActive ? "Active (Access Enabled)" : "Inactive (Access Blocked)"}
                      </Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6 mt-0">
                {/* Information Header */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                  <Info className="h-4.5 w-4.5 text-[var(--primary)] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--text-primary)]">Role-Inherited Rights vs Overrides</p>
                    <p>
                      Permissions marked with <Lock className="inline h-3 w-3 align-text-bottom text-[var(--text-secondary)]" /> are inherited from the selected <strong>{ROLE_LABELS[formData.role]}</strong> role default configuration and cannot be toggled. You may check other switches to grant additional, user-specific permission overrides.
                    </p>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                    <div key={moduleName} className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary-text)] border-b border-[var(--border)] pb-1.5">
                        {moduleName}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        {perms.map((perm) => {
                          const isInherited = roleDefaults.includes(perm.key);
                          const isChecked = isInherited || customPermissions.includes(perm.key);

                          return (
                            <div
                              key={perm.key}
                              className={`flex items-center justify-between p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors ${
                                isInherited ? "bg-[rgba(var(--border-rgb),0.15)] opacity-85" : "bg-[var(--background)]"
                              }`}
                            >
                              <div className="space-y-0.5 pr-2">
                                <Label
                                  htmlFor={`perm-${perm.key}`}
                                  className="text-xs font-semibold cursor-pointer text-[var(--text-primary)] flex items-center gap-1.5"
                                >
                                  {perm.label}
                                </Label>
                                <span className="text-[10px] text-[var(--text-tertiary)] font-mono block">
                                  {perm.key}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isInherited && (
                                  <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 rounded-full select-none">
                                    <Lock className="h-2.5 w-2.5 text-[var(--text-secondary)]" />
                                    Default
                                  </span>
                                )}
                                <Switch
                                  id={`perm-${perm.key}`}
                                  checked={isChecked}
                                  disabled={isInherited}
                                  onCheckedChange={(checked) =>
                                    handlePermissionToggle(perm.key, checked)
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>

            {/* Modal Actions Footer */}
            <DialogFooter className="p-6 pt-4 gap-2 border-t border-[var(--border)] shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateUserMutation.isPending}
                className="h-10 text-sm font-semibold border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="h-10 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow hover:opacity-90 transition-opacity"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
