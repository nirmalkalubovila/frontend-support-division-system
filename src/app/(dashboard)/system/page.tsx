"use client";

import { useState, useEffect } from "react";
import { Palette, Settings, Shield, Tag, Bell, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, Input, Label, Button, Switch, Badge, ImageUploader } from "@/components";
import { PRIORITIES } from "@/lib/constants";
import useThemeStore from "@/store/theme-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateBranding, useUploadLogo } from "@/api/services/system/settings-service";

const brandingSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  slogan: z.string().min(1, "Slogan is required"),
});

type BrandingForm = z.infer<typeof brandingSchema>;

export default function SystemPage() {
  const {
    primaryColor,
    setPrimaryColor,
    companyName,
    slogan,
    setCompanyName,
    setSlogan,
    logoUrl: storeLogoUrl,
    setLogoUrl: setStoreLogoUrl,
  } = useThemeStore();

  const updateBrandingMutation = useUpdateBranding();
  const uploadLogoMutation = useUploadLogo();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (storeLogoUrl !== undefined) {
      setLogoUrl(storeLogoUrl);
    }
  }, [storeLogoUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    values: { companyName, slogan },
  });

  const onSubmitBranding = (data: BrandingForm) => {
    updateBrandingMutation.mutate({
      companyName: data.companyName,
      slogan: data.slogan,
      primaryColor: primaryColor,
      logoUrl: logoUrl || "",
    }, {
      onSuccess: () => {
        setCompanyName(data.companyName);
        setSlogan(data.slogan);
        setStoreLogoUrl(logoUrl);
        toast.success("Branding settings saved successfully!");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to save branding settings";
        toast.error(errMsg);
      }
    });
  };

  const handleUploadLogo = (file: File) => {
    uploadLogoMutation.mutate(file, {
      onSuccess: (res) => {
        setLogoUrl(res.logoUrl);
        toast.success("Logo uploaded successfully! Click 'Save Changes' to apply.");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to upload logo";
        toast.error(errMsg);
      },
    });
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    toast.success("Logo removed. Click 'Save Changes' to update.");
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
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
            <CardContent>
              {mounted ? (
                <form onSubmit={handleSubmit(onSubmitBranding)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName"
                      className="bg-[var(--background)]" 
                      {...register("companyName")}
                    />
                    {errors.companyName && (
                      <p className="text-xs text-[var(--destructive)]">{errors.companyName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="slogan">Slogan</Label>
                    <Input 
                      id="slogan"
                      className="bg-[var(--background)]" 
                      {...register("slogan")}
                    />
                    {errors.slogan && (
                      <p className="text-xs text-[var(--destructive)]">{errors.slogan.message}</p>
                    )}
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
                    <ImageUploader
                      value={logoUrl}
                      onUpload={handleUploadLogo}
                      onRemove={handleRemoveLogo}
                      isUploading={uploadLogoMutation.isPending}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={updateBrandingMutation.isPending}
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
                  >
                    {updateBrandingMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
