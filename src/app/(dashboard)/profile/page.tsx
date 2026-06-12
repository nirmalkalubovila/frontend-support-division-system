"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Mail, Phone, Briefcase, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components";
import useSessionStore from "@/store/session-store";
import { useUpdateMe, useChangePassword } from "@/api/services/auth/auth-service";
import { ROLE_LABELS } from "@/lib/constants";

export default function ProfilePage() {
  const userInfo = useSessionStore((s) => s.userInfo);
  const updateMeMutation = useUpdateMe();
  const changePasswordMutation = useChangePassword();

  // Profile fields state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initialize fields on load/hydrate
  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || "");
      setPhone(userInfo.phone || "");
      setDesignation(userInfo.designation || "");
    }
  }, [userInfo]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    try {
      await updateMeMutation.mutateAsync({
        name,
        phone: phone || null,
        designation: designation || null,
      });
      toast.success("Profile details updated successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully.");
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password. Make sure current password is correct.");
    }
  };

  if (!userInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[var(--text-secondary)]">
        <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)] mb-2" />
        <span className="text-sm font-medium">Loading profile...</span>
      </div>
    );
  }

  // Format initials
  const initials = userInfo.name
    ? userInfo.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <User className="h-6 w-6 text-[var(--primary)]" />
          Profile Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your personal details, designations, and account security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Avatar/Summary Card */}
        <Card className="lg:col-span-4 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border-2 border-[var(--primary)] shadow-md mb-4">
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white select-none">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{userInfo.name}</h2>
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mt-1">
              <Mail className="h-3 w-3" />
              {userInfo.email}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Badge
                variant={userInfo.role === "super_admin" ? "default" : "secondary"}
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
              >
                {ROLE_LABELS[userInfo.role] ?? userInfo.role}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border-[var(--border)] ${
                  userInfo.isActive ? "text-emerald-500 bg-emerald-500/5" : "text-[var(--text-tertiary)]"
                }`}
              >
                {userInfo.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="w-full border-t border-[var(--border)] mt-6 pt-6 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <Shield className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Account Role</p>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                    {ROLE_LABELS[userInfo.role] ?? userInfo.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <Briefcase className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Designation</p>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                    {userInfo.designation || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Tab Forms */}
        <Card className="lg:col-span-8 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <Tabs defaultValue="details" className="w-full">
            <CardHeader className="border-b border-[var(--border)] pb-0">
              <TabsList className="bg-transparent h-auto p-0 gap-6 flex">
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:bg-transparent px-1 pb-4 pt-1 text-sm font-semibold text-[var(--text-secondary)] data-[state=active]:text-[var(--text-primary)]"
                >
                  Profile Details
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:bg-transparent px-1 pb-4 pt-1 text-sm font-semibold text-[var(--text-secondary)] data-[state=active]:text-[var(--text-primary)]"
                >
                  Password & Security
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Profile Details Tab */}
              <TabsContent value="details" className="mt-0">
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-[var(--text-secondary)]">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        className="h-10 bg-[var(--background)] border-[var(--border)] text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold text-[var(--text-secondary)]">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          value={userInfo.email}
                          disabled
                          className="h-10 bg-[var(--surface-hover)] border-[var(--border)] text-sm font-medium text-[var(--text-tertiary)] pr-8 cursor-not-allowed"
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] italic">
                        Email address is managed by administrator
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-semibold text-[var(--text-secondary)]">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +94 77 123 4567"
                          className="h-10 bg-[var(--background)] border-[var(--border)] text-sm font-medium pl-8"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="designation" className="text-xs font-semibold text-[var(--text-secondary)]">
                        Designation
                      </Label>
                      <div className="relative">
                        <Input
                          id="designation"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Software Engineer"
                          className="h-10 bg-[var(--background)] border-[var(--border)] text-sm font-medium pl-8"
                        />
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={updateMeMutation.isPending}
                      className="h-10 px-6 font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-sm"
                    >
                      {updateMeMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="security" className="mt-0">
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-xs font-semibold text-[var(--text-secondary)]">
                      Current Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 bg-[var(--background)] border-[var(--border)] text-sm font-medium pl-8"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs font-semibold text-[var(--text-secondary)]">
                      New Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 bg-[var(--background)] border-[var(--border)] text-sm font-medium pl-8"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[var(--text-secondary)]">
                      Confirm New Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 bg-[var(--background)] border-[var(--border)] text-sm font-medium pl-8"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="h-10 px-6 font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-sm"
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
