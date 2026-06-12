"use client";

import React, { useState } from "react";
import { Plus, Search, Users as UsersIcon, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Avatar,
  AvatarFallback,
} from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { CreateUserModal } from "@/components/organisms/createUserModal/create-user-modal";
import { ROLE_LABELS } from "@/lib/constants";
import { usePaginateUsers } from "@/api/services/user-management/user-service";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: usersData, isLoading } = usePaginateUsers({
    page,
    limit,
    search: search || undefined,
  });

  const users = usersData?.data ?? [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-[var(--primary)]" />
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
                    <th className="text-left p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      System Role
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Account Status
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Designation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="p-4">
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
                      <td className="p-4">
                        <Badge
                          variant={user.role === "super_admin" ? "default" : "secondary"}
                          className="text-[10px] font-semibold uppercase tracking-wider"
                        >
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
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
                      <td className="p-4 text-sm font-medium text-[var(--text-secondary)]">
                        {user.designation || "—"}
                      </td>
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
    </div>
  );
}
