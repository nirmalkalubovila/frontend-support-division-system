"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Users as UsersIcon, Loader2, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { CreateUserModal } from "@/components/organisms/createUserModal/create-user-modal";
import { EditUserModal } from "@/components/organisms/editUserModal/edit-user-modal";
import { ROLE_LABELS } from "@/lib/constants";
import { usePaginateUsers, useDeleteUser } from "@/api/services/user-management/user-service";
import type { User } from "@/api/services/user-management/user-service";
import { useHasPermission } from "@/hooks/use-permissions";
import useSessionStore from "@/store/session-store";

// Custom premium delete confirmation modal
interface DeleteUserConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  isPending: boolean;
}

function DeleteUserConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  userName,
  isPending,
}: DeleteUserConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] shadow-2xl p-5 overflow-hidden">
        <DialogHeader className="space-y-2.5 flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-full bg-[var(--destructive-light)] flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-[var(--destructive)]" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-base font-bold">
              Delete User
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-secondary)] leading-normal">
              Are you sure you want to delete user <strong className="text-[var(--text-primary)]">"{userName}"</strong>? This will deactivate their account and soft-delete them from the system.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-2 mt-4 sm:flex-row sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-9 text-xs font-semibold border-[var(--border)] hover:bg-[var(--surface-hover)] w-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="h-9 text-xs font-semibold bg-[var(--destructive)] hover:bg-[var(--destructive-hover)] text-white shadow-sm w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: usersData, isLoading } = usePaginateUsers({
    page,
    limit,
    search: search || undefined,
  });

  const deleteUserMutation = useDeleteUser();
  const users = usersData?.data ?? [];

  const hasUpdatePermission = useHasPermission("user_management.user.update");
  const hasDeletePermission = useHasPermission("user_management.user.delete");
  const isSuperAdmin = useSessionStore((s) => s.userInfo?.role === "super_admin");
  const canPerformActions = isSuperAdmin || hasUpdatePermission || hasDeletePermission;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const triggerDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation.mutateAsync(userToDelete._id);
      toast.success(`User "${userToDelete.name}" deleted successfully.`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to delete user "${userToDelete.name}".`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-[var(--primary-text)]" />
            Users
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage team members and permissions
          </p>
        </div>
        <ValidatePermission permission="user_management.user.create">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-sm font-semibold h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </ValidatePermission>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={handleSearchChange}
          className="pl-9 h-10 bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)] text-sm font-medium"
        />
      </div>

      {/* Users Table */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--primary)]" />
                <span className="text-sm font-semibold">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-sm text-[var(--text-tertiary)] font-medium">
                No users found.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      System Role
                    </th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Account Status
                    </th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Designation
                    </th>
                    {canPerformActions && (
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-[var(--border)]">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white font-bold">
                              {user.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {user.name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={user.role === "super_admin" ? "default" : "secondary"}
                          className="text-[10px] font-semibold uppercase tracking-wider"
                        >
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              user.isActive ? "bg-[var(--success)] animate-pulse-soft" : "bg-[var(--text-tertiary)]"
                            }`}
                          />
                          <span className="text-xs font-semibold text-[var(--text-secondary)]">
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-sm font-medium text-[var(--text-secondary)]">
                        {user.designation || "—"}
                      </td>
                      {canPerformActions && (
                        <td className="py-2.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] min-w-[140px]"
                            >
                              <DropdownMenuLabel className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider px-2 py-1.5">
                                Operations
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-[var(--border)]" />
                              {(isSuperAdmin || hasUpdatePermission) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowEditModal(true);
                                  }}
                                  className="cursor-pointer hover:bg-[var(--surface-hover)] gap-2 text-xs font-medium px-2 py-2"
                                >
                                  <Edit className="h-3.5 w-3.5 text-[var(--primary)]" />
                                  Edit Profile
                                </DropdownMenuItem>
                              )}
                              {(isSuperAdmin || hasDeletePermission) && (
                                <DropdownMenuItem
                                  onClick={() => triggerDeleteUser(user)}
                                  disabled={deleteUserMutation.isPending}
                                  className="cursor-pointer text-[var(--error)] hover:bg-[rgba(239,68,68,0.08)] focus:text-[var(--error)] gap-2 text-xs font-medium px-2 py-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-[var(--error)]" />
                                  Delete User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={selectedUser}
      />

      {/* Custom styled Delete Confirmation Modal */}
      <DeleteUserConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDeleteUser}
        userName={userToDelete?.name || ""}
        isPending={deleteUserMutation.isPending}
      />
    </div>
  );
}
