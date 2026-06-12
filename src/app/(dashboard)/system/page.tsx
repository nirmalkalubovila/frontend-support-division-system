"use client";

import { useState, useEffect, useRef } from "react";
import { Palette, Settings, Shield, Tag, Bell, UploadCloud, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, Input, Label, Button, Switch, Badge } from "@/components";
import { PRIORITIES } from "@/lib/constants";
import useThemeStore from "@/store/theme-store";
import { toast } from "sonner";

export default function SystemPage() {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const setPrimaryColor = useThemeStore((s) => s.setPrimaryColor);
  const storeCompanyName = useThemeStore((s) => s.companyName);
  const storeSlogan = useThemeStore((s) => s.slogan);
  const storeLogoUrl = useThemeStore((s) => s.logoUrl);
  const setCompanyName = useThemeStore((s) => s.setCompanyName);
  const setSlogan = useThemeStore((s) => s.setSlogan);
  const setLogoUrl = useThemeStore((s) => s.setLogoUrl);

  const [tempCompanyName, setTempCompanyName] = useState(storeCompanyName);
  const [tempSlogan, setTempSlogan] = useState(storeSlogan);
  const [tempLogoUrl, setTempLogoUrl] = useState(storeLogoUrl);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempCompanyName(storeCompanyName);
    setTempSlogan(storeSlogan);
    setTempLogoUrl(storeLogoUrl);
  }, [storeCompanyName, storeSlogan, storeLogoUrl]);

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG, WebP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo size should be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setTempLogoUrl(result);
        toast.success("Logo uploaded successfully! Click 'Save Changes' to apply.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Logo marked for removal. Click 'Save Changes' to apply.");
  };

  const handleSaveChanges = () => {
    setCompanyName(tempCompanyName);
    setSlogan(tempSlogan);
    setLogoUrl(tempLogoUrl);
    toast.success("Branding settings saved successfully!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="h-6 w-6 text-[var(--primary-text)]" />
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
                <Input
                  value={tempCompanyName}
                  onChange={(e) => setTempCompanyName(e.target.value)}
                  className="bg-[var(--background)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Slogan</Label>
                <Input
                  value={tempSlogan}
                  onChange={(e) => setTempSlogan(e.target.value)}
                  className="bg-[var(--background)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Primary Brand Color</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 p-1 cursor-pointer bg-[var(--background)] border-[var(--border)] rounded shrink-0"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("#") && val.length <= 7) {
                          setPrimaryColor(val);
                        } else if (!val.startsWith("#") && val.length <= 6) {
                          setPrimaryColor("#" + val);
                        }
                      }}
                      placeholder="#6366f1"
                      className="h-10 w-28 bg-[var(--background)] text-center font-mono text-sm shrink-0"
                    />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    This color will apply globally to buttons, active links, highlights, and icons.
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Logo</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={handleDropzoneClick}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFile(file);
                  }}
                  className={`h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-sm cursor-pointer transition-all ${
                    isDragging
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--primary)] bg-[var(--background)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {tempLogoUrl ? (
                    <div className="relative h-full w-full flex items-center justify-center p-4">
                      <img
                        src={tempLogoUrl}
                        alt="Logo Preview"
                        className="max-h-24 max-w-full object-contain rounded-md"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-[var(--destructive)] hover:bg-[var(--destructive-hover)] text-white shadow transition-colors"
                        title="Remove Logo"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <UploadCloud className="mx-auto h-8 w-8 text-[var(--text-tertiary)] animate-pulse-soft" />
                      <div className="text-[var(--text-primary)] font-medium">
                        Click to upload or drag & drop
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        PNG, JPG, SVG or WEBP (max 2MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
