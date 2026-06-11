"use client";

import { Palette, Settings, Shield, Tag, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, Input, Label, Button, Switch, Badge } from "@/components";
import { PRIORITIES } from "@/lib/constants";

export default function SystemPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="h-6 w-6 text-[var(--primary)]" />
          System Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure priorities, categories, notifications, and branding
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="priorities" className="w-full">
        <TabsList className="bg-[var(--surface)] border border-[var(--border)]">
          <TabsTrigger value="priorities" className="gap-1">
            <Shield className="h-3.5 w-3.5" />
            Priorities
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1">
            <Tag className="h-3.5 w-3.5" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1">
            <Palette className="h-3.5 w-3.5" />
            Branding
          </TabsTrigger>
        </TabsList>

        {/* Priorities */}
        <TabsContent value="priorities" className="mt-4 space-y-4">
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base">SLA Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PRIORITIES.map((priority) => (
                  <div key={priority} className="flex items-center gap-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <Badge
                      className="text-xs min-w-[80px] justify-center"
                      style={{
                        backgroundColor: `var(--priority-${priority.toLowerCase()})`,
                        color: "white",
                      }}
                    >
                      {priority}
                    </Badge>
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs text-[var(--text-secondary)]">First Response</Label>
                        <Input placeholder="30 min" className="h-8 text-xs bg-[var(--surface)]" disabled />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-[var(--text-secondary)]">Resolution</Label>
                        <Input placeholder="4 hours" className="h-8 text-xs bg-[var(--surface)]" disabled />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-[var(--text-secondary)]">Escalation</Label>
                        <Input placeholder="2 hours" className="h-8 text-xs bg-[var(--surface)]" disabled />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Issue Categories</CardTitle>
              <Button size="sm" variant="outline">Add Category</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["Bug", "Feature Request", "Access Issue", "Data Correction", "Performance", "Consultation"].map((cat) => (
                  <Badge key={cat} variant="outline" className="py-1.5 px-3 text-xs cursor-pointer hover:bg-[var(--surface-hover)]">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Email for critical issues", defaultChecked: true },
                { label: "In-app SLA breach alerts", defaultChecked: true },
                { label: "Daily summary emails", defaultChecked: false },
                { label: "Project hour warnings (80%)", defaultChecked: true },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-primary)]">{pref.label}</span>
                  <Switch defaultChecked={pref.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base">Company Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Company Name</Label>
                <Input defaultValue="Prologics (Pvt) Ltd" className="bg-[var(--background)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Slogan</Label>
                <Input defaultValue="Support Division System" className="bg-[var(--background)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Logo</Label>
                <div className="h-24 rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                  Drop logo here or click to upload
                </div>
              </div>
              <Button className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
