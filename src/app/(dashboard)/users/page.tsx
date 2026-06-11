"use client";

import { Plus, Search, Users as UsersIcon } from "lucide-react";
import { Button, Input, Badge, Card, CardContent, Avatar, AvatarFallback } from "@/components";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import { ROLE_LABELS } from "@/lib/constants";

// Mock users for shell
const MOCK_USERS = [
  { name: "Kavindu Perera", email: "kavindu@prologics.lk", role: "super_admin", isActive: true },
  { name: "Dilshan Silva", email: "dilshan@prologics.lk", role: "manager", isActive: true },
  { name: "Nuwan Jayawardena", email: "nuwan@prologics.lk", role: "senior_engineer", isActive: true },
  { name: "Hasitha Fernando", email: "hasitha@prologics.lk", role: "engineer", isActive: true },
  { name: "Amaya Wickramasinghe", email: "amaya@prologics.lk", role: "engineer", isActive: false },
  { name: "Sachini Rathnayake", email: "sachini@prologics.lk", role: "intern", isActive: true },
];

export default function UsersPage() {
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
          <Button size="sm" className="gap-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Button>
        </ValidatePermission>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input placeholder="Search users..." className="pl-9 h-10 bg-[var(--surface)]" />
      </div>

      {/* Users Table */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {MOCK_USERS.map((user) => (
                  <tr
                    key={user.email}
                    className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-[var(--border)]">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white">
                            {user.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {user.name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            user.isActive ? "bg-[var(--success)]" : "bg-[var(--text-tertiary)]"
                          }`}
                        />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
