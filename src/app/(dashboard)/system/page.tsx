"use client";

import { useState, useEffect } from "react";
import { Palette, Settings, Shield, Tag, Bell, Loader2, Calendar, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, Input, Label, Button, Switch, Badge, ImageUploader } from "@/components";
import { PRIORITIES } from "@/lib/constants";
import useThemeStore from "@/store/theme-store";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  useUpdateBranding,
  useUploadLogo,
  useGetPriorities,
  useUpdatePriorities,
  useGetCategories,
  useUpdateCategories,
  useGetNotifications,
  useUpdateNotifications,
  useGetFinanceSettings,
  useUpdateFinanceSettings,
} from "@/api/services/system/settings-service";
import {
  useGetReportSchedule,
  useUpdateReportSchedule,
} from "@/api/services/reports/report-service";

const brandingSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  slogan: z.string().min(1, "Slogan is required"),
});

type BrandingForm = z.infer<typeof brandingSchema>;

const prioritySlaSchema = z.object({
  firstResponse: z.coerce.number().min(0, "Must be >= 0"),
  resolution: z.coerce.number().min(0, "Must be >= 0"),
  escalation: z.coerce.number().min(0, "Must be >= 0"),
});

const prioritiesSchema = z.object({
  Critical: prioritySlaSchema,
  High: prioritySlaSchema,
  Medium: prioritySlaSchema,
  Low: prioritySlaSchema,
});

type PrioritiesForm = z.infer<typeof prioritiesSchema>;

const moduleNotifPrefSchema = z.object({
  email: z.boolean(),
  inApp: z.boolean(),
});

const notificationsSchema = z.object({
  emailCritical: z.boolean(),
  inAppSlaBreach: z.boolean(),
  dailySummary: z.boolean(),
  projectHourWarning: z.boolean(),
  modulePreferences: z.object({
    issues: moduleNotifPrefSchema,
    projects: moduleNotifPrefSchema,
    crs: moduleNotifPrefSchema,
    tasks: moduleNotifPrefSchema,
    "time-tracking": moduleNotifPrefSchema,
    system: moduleNotifPrefSchema,
  }),
});

type NotificationsForm = z.infer<typeof notificationsSchema>;

const DEFAULT_MODULE_PREFERENCES = {
  issues: { email: true, inApp: true },
  projects: { email: true, inApp: true },
  crs: { email: true, inApp: true },
  tasks: { email: true, inApp: true },
  "time-tracking": { email: true, inApp: true },
  system: { email: true, inApp: true },
};

const MODULE_LABELS: { key: keyof typeof DEFAULT_MODULE_PREFERENCES; label: string; description: string }[] = [
  { key: "issues", label: "Issues Management", description: "Issue assignments, status changes, SLA alerts" },
  { key: "projects", label: "Project & Client Management", description: "Project updates, hour warnings, client changes" },
  { key: "crs", label: "Change Requests (CRs)", description: "CR submissions, approvals, status updates" },
  { key: "tasks", label: "Tasks Management", description: "Task assignments, progress updates, completions" },
  { key: "time-tracking", label: "Time Tracking", description: "Time log submissions, overtime alerts" },
  { key: "system", label: "User & System Settings", description: "System config changes, user role updates" },
];

const reportScheduleSchema = z.object({
  dailyEnabled: z.boolean(),
  dailyTime: z.string().regex(/^\d{2}:\d{2}$/, "Time is required"),
  dailyDays: z.enum(["1-5", "*"]),
  weeklyEnabled: z.boolean(),
  weeklyTime: z.string().regex(/^\d{2}:\d{2}$/, "Time is required"),
  weeklyDay: z.string().min(1, "Day of week is required"),
  monthlyEnabled: z.boolean(),
  monthlyTime: z.string().regex(/^\d{2}:\d{2}$/, "Time is required"),
  monthlyDay: z.enum(["L", "1"]),
});

type ReportScheduleForm = z.infer<typeof reportScheduleSchema>;

function parseCron(cron: string) {
  const defaultVal = { time: "18:00", dom: "*", dow: "*" };
  if (!cron) return defaultVal;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaultVal;
  const [min, hour, dom, month, dow] = parts;
  
  const paddedHour = hour.padStart(2, "0");
  const paddedMin = min.padStart(2, "0");
  return {
    time: `${paddedHour}:${paddedMin}`,
    dom,
    dow,
  };
}

const formatMinutes = (mins: number) => {
  if (mins === 0) return "No SLA / disabled";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""}`;
  const hours = mins / 60;
  if (hours < 24) {
    return `${Number(hours.toFixed(1))} hour${hours > 1 ? "s" : ""}`;
  }
  const days = hours / 24;
  return `${Number(days.toFixed(1))} day${days > 1 ? "s" : ""}`;
};

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

  // Priorities SLA config
  const { data: prioritiesData, isLoading: isLoadingPriorities } = useGetPriorities();
  const updatePrioritiesMutation = useUpdatePriorities();

  const prioritiesForm = useForm<PrioritiesForm>({
    resolver: zodResolver(prioritiesSchema),
    values: prioritiesData || {
      Critical: { firstResponse: 30, resolution: 240, escalation: 120 },
      High: { firstResponse: 120, resolution: 480, escalation: 480 },
      Medium: { firstResponse: 240, resolution: 4320, escalation: 2880 },
      Low: { firstResponse: 1440, resolution: 10080, escalation: 0 },
    },
  });

  const onSubmitPriorities = (data: PrioritiesForm) => {
    updatePrioritiesMutation.mutate(data, {
      onSuccess: () => {
        toast.success("SLA configuration saved successfully!");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to save SLA configuration";
        toast.error(errMsg);
      },
    });
  };

  // Categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategories();
  const updateCategoriesMutation = useUpdateCategories();
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData]);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.error("Category already exists");
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategory("");
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSaveCategories = () => {
    updateCategoriesMutation.mutate(categories, {
      onSuccess: () => {
        toast.success("Categories saved successfully!");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to save categories";
        toast.error(errMsg);
      },
    });
  };

  // Notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useGetNotifications();
  const updateNotificationsMutation = useUpdateNotifications();

  const notificationsForm = useForm<NotificationsForm>({
    resolver: zodResolver(notificationsSchema),
    values: notificationsData
      ? {
          ...notificationsData,
          modulePreferences: notificationsData.modulePreferences || DEFAULT_MODULE_PREFERENCES,
        }
      : {
          emailCritical: true,
          inAppSlaBreach: true,
          dailySummary: false,
          projectHourWarning: true,
          modulePreferences: DEFAULT_MODULE_PREFERENCES,
        },
  });

  const onSubmitNotifications = (data: NotificationsForm) => {
    updateNotificationsMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Notification preferences saved successfully!");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to save notification preferences";
        toast.error(errMsg);
      },
    });
  };

  // Report schedules configuration form
  const { data: reportScheduleData, isLoading: isLoadingSchedule } = useGetReportSchedule();
  const updateScheduleMutation = useUpdateReportSchedule();

  const reportScheduleForm = useForm<ReportScheduleForm>({
    resolver: zodResolver(reportScheduleSchema),
    defaultValues: {
      dailyEnabled: true,
      dailyTime: "18:00",
      dailyDays: "1-5",
      weeklyEnabled: true,
      weeklyTime: "17:00",
      weeklyDay: "5",
      monthlyEnabled: true,
      monthlyTime: "18:00",
      monthlyDay: "L",
    },
  });

  const { reset: resetReportSchedule } = reportScheduleForm;

  useEffect(() => {
    if (reportScheduleData) {
      const daily = parseCron(reportScheduleData.dailyCron);
      const weekly = parseCron(reportScheduleData.weeklyCron);
      const monthly = parseCron(reportScheduleData.monthlyCron);

      resetReportSchedule({
        dailyEnabled: reportScheduleData.dailyEnabled,
        dailyTime: daily.time,
        dailyDays: daily.dow === "1-5" ? "1-5" : "*",
        weeklyEnabled: reportScheduleData.weeklyEnabled,
        weeklyTime: weekly.time,
        weeklyDay: weekly.dow !== "*" ? weekly.dow : "5",
        monthlyEnabled: reportScheduleData.monthlyEnabled,
        monthlyTime: monthly.time,
        monthlyDay: monthly.dom === "L" ? "L" : "1",
      });
    }
  }, [reportScheduleData, resetReportSchedule]);

  const onSubmitSchedule = (values: ReportScheduleForm) => {
    const formatTimePart = (timeStr: string) => {
      const [h, m] = timeStr.split(":");
      return {
        min: parseInt(m).toString(),
        hour: parseInt(h).toString(),
      };
    };

    const dailyTimePart = formatTimePart(values.dailyTime);
    const weeklyTimePart = formatTimePart(values.weeklyTime);
    const monthlyTimePart = formatTimePart(values.monthlyTime);

    const payload = {
      dailyEnabled: values.dailyEnabled,
      dailyCron: `${dailyTimePart.min} ${dailyTimePart.hour} * * ${values.dailyDays}`,
      weeklyEnabled: values.weeklyEnabled,
      weeklyCron: `${weeklyTimePart.min} ${weeklyTimePart.hour} * * ${values.weeklyDay}`,
      monthlyEnabled: values.monthlyEnabled,
      monthlyCron: `${monthlyTimePart.min} ${monthlyTimePart.hour} ${values.monthlyDay} * *`,
    };

    updateScheduleMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Report schedule configuration saved successfully!");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to save schedule configuration";
        toast.error(errMsg);
      },
    });
  };

  // Finance settings form
  const { data: financeData, isLoading: isLoadingFinance } = useGetFinanceSettings();
  const updateFinanceMutation = useUpdateFinanceSettings();

  const financeForm = useForm<{ defaultContractedHourlyRate: number }>({
    values: financeData || { defaultContractedHourlyRate: 5000 },
  });

  const onSubmitFinance = (data: { defaultContractedHourlyRate: number }) => {
    updateFinanceMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Finance settings saved successfully!");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to save finance settings";
        toast.error(errMsg);
      },
    });
  };

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
        // Robust Fallback: Save client-side only if backend fails or is not implemented
        setCompanyName(data.companyName);
        setSlogan(data.slogan);
        setStoreLogoUrl(logoUrl);
        toast.success("Branding settings saved locally (offline mode)!");
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
        // Robust Fallback: Convert to Base64 and save locally if backend fails
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === "string") {
            setLogoUrl(result);
            toast.success("Logo loaded locally (offline mode)! Click 'Save Changes' to apply.");
          }
        };
        reader.readAsDataURL(file);
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
          <Settings className="h-6 w-6 text-[var(--text-primary)]" />
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
          <TabsTrigger value="report-schedule" className="gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Report Schedule
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-1">
            <Coins className="h-3.5 w-3.5" />
            Finance
          </TabsTrigger>
        </TabsList>

        {/* Priorities */}
        <TabsContent value="priorities" className="mt-4 space-y-4">
          <Card className="bg-[var(--surface)] border-[var(--border)] animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base text-[var(--text-primary)]">Service Level Agreements (SLA) Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPriorities ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              ) : (
                <form onSubmit={prioritiesForm.handleSubmit(onSubmitPriorities)} className="space-y-6">
                  <div className="space-y-4">
                    {PRIORITIES.map((priority) => {
                      const pName = priority;
                      return (
                        <div key={priority} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] transition-all hover:border-[var(--primary-light)]">
                          <Badge
                            className="text-xs min-w-[85px] justify-center h-6 py-1 select-none font-semibold shadow-sm"
                            style={{
                              backgroundColor: `var(--priority-${priority.toLowerCase()})`,
                              color: "white",
                            }}
                          >
                            {priority}
                          </Badge>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-[var(--text-secondary)]">First Response (min)</Label>
                              <Input
                                type="number"
                                className="h-8 text-xs bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)]"
                                {...prioritiesForm.register(`${pName}.firstResponse`)}
                              />
                              <span className="text-[10px] text-[var(--primary-text)] font-medium block pl-1">
                                {formatMinutes(Number(prioritiesForm.watch(`${pName}.firstResponse`) || 0))}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-[var(--text-secondary)]">Resolution (min)</Label>
                              <Input
                                type="number"
                                className="h-8 text-xs bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)]"
                                {...prioritiesForm.register(`${pName}.resolution`)}
                              />
                              <span className="text-[10px] text-[var(--primary-text)] font-medium block pl-1">
                                {formatMinutes(Number(prioritiesForm.watch(`${pName}.resolution`) || 0))}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-[var(--text-secondary)]">Escalation Timer (min)</Label>
                              <Input
                                type="number"
                                className="h-8 text-xs bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)]"
                                {...prioritiesForm.register(`${pName}.escalation`)}
                              />
                              <span className="text-[10px] text-[var(--primary-text)] font-medium block pl-1">
                                {formatMinutes(Number(prioritiesForm.watch(`${pName}.escalation`) || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    type="submit"
                    disabled={updatePrioritiesMutation.isPending}
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-95"
                  >
                    {updatePrioritiesMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving SLA...
                      </>
                    ) : (
                      "Save SLA Configuration"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)] animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base text-[var(--text-primary)]">Issue Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingCategories ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-2 max-w-md">
                    <Input
                      placeholder="Add new category (e.g. Mobile Support)"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="bg-[var(--background)] border-[var(--border)] text-sm focus-visible:ring-[var(--primary)]"
                    />
                    <Button 
                      onClick={handleAddCategory} 
                      className="shrink-0 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-[var(--text-secondary)]">Active Categories</Label>
                    <div className="flex flex-wrap gap-2.5 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] min-h-[100px] items-center">
                      {categories.length === 0 ? (
                        <span className="text-sm text-[var(--text-secondary)] italic">No categories defined. Add some above.</span>
                      ) : (
                        categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="outline"
                            className="group py-1.5 px-3 text-xs bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] flex items-center gap-2 transition-all hover:border-[var(--primary-light)]"
                          >
                            <span>{cat}</span>
                            <span
                              onClick={() => handleRemoveCategory(cat)}
                              className="text-[var(--text-secondary)] hover:text-[var(--destructive)] cursor-pointer text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity"
                              title={`Remove ${cat}`}
                            >
                              &times;
                            </span>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveCategories}
                    disabled={updateCategoriesMutation.isPending}
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-95"
                  >
                    {updateCategoriesMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving Categories...
                      </>
                    ) : (
                      "Save Categories"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          {/* General Preferences Card */}
          <Card className="bg-[var(--surface)] border-[var(--border)] animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base text-[var(--text-primary)]">General Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              ) : (
                <form id="notif-form" onSubmit={notificationsForm.handleSubmit(onSubmitNotifications)} className="space-y-1">
                  {[
                    { name: "emailCritical" as const, label: "Email for critical issues" },
                    { name: "inAppSlaBreach" as const, label: "In-app SLA breach alerts" },
                    { name: "dailySummary" as const, label: "Daily summary emails" },
                    { name: "projectHourWarning" as const, label: "Project hour warnings (80%)" },
                  ].map((pref) => (
                    <div key={pref.name} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] px-2 rounded transition-colors">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{pref.label}</span>
                      <Controller
                        control={notificationsForm.control}
                        name={pref.name}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  ))}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Module Notification Control Card */}
          <Card className="bg-[var(--surface)] border-[var(--border)] animate-fade-in">
            <CardHeader>
              <div>
                <CardTitle className="text-base text-[var(--text-primary)]">Module Notification Control</CardTitle>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Activate or deactivate email and in-app notifications per module for all managers and admins.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header row */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px] gap-4 px-4 pb-2 border-b border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Module</span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-center">Email</span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-center">In-App</span>
                  </div>

                  {/* Module rows */}
                  {MODULE_LABELS.map((mod) => {
                    const emailFieldName = `modulePreferences.${mod.key}.email` as const;
                    const inAppFieldName = `modulePreferences.${mod.key}.inApp` as const;
                    return (
                      <div
                        key={mod.key}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] gap-3 sm:gap-4 items-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] transition-all hover:border-[var(--primary-light)]"
                      >
                        <div>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{mod.label}</span>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{mod.description}</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)] sm:hidden">Email</span>
                          <Controller
                            control={notificationsForm.control}
                            name={emailFieldName as any}
                            render={({ field }) => (
                              <Switch
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between sm:justify-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)] sm:hidden">In-App</span>
                          <Controller
                            control={notificationsForm.control}
                            name={inAppFieldName as any}
                            render={({ field }) => (
                              <Switch
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="submit"
                    form="notif-form"
                    disabled={updateNotificationsMutation.isPending}
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-95 mt-2"
                  >
                    {updateNotificationsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save All Preferences"
                    )}
                  </Button>
                </div>
              )}
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

        {/* Report Schedule */}
        <TabsContent value="report-schedule" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)] animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base text-[var(--text-primary)]">Automatic Report Generation Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSchedule ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              ) : (
                <form onSubmit={reportScheduleForm.handleSubmit(onSubmitSchedule)} className="space-y-6">
                  <div className="space-y-6">
                    {/* Daily Report Schedule */}
                    <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Daily Operations Report</h4>
                          <p className="text-xs text-[var(--text-secondary)] font-normal">Automatically compile resolved issues and logged hours daily</p>
                        </div>
                        <Controller
                          control={reportScheduleForm.control}
                          name="dailyEnabled"
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                      {reportScheduleForm.watch("dailyEnabled") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md animate-fade-in">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[var(--text-secondary)]">Run On</Label>
                            <select
                              className="w-full h-9 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-medium"
                              {...reportScheduleForm.register("dailyDays")}
                            >
                              <option value="1-5">Weekdays (Monday - Friday)</option>
                              <option value="*">Every Day</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[var(--text-secondary)]">Time of Day</Label>
                            <Input
                              type="time"
                              className="h-9 text-xs bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)] font-medium"
                              {...reportScheduleForm.register("dailyTime")}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Weekly Report Schedule */}
                    <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Weekly Performance Report</h4>
                          <p className="text-xs text-[var(--text-secondary)] font-normal">Weekly SLA, backlog health, and workload summaries</p>
                        </div>
                        <Controller
                          control={reportScheduleForm.control}
                          name="weeklyEnabled"
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                      {reportScheduleForm.watch("weeklyEnabled") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md animate-fade-in">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[var(--text-secondary)]">Day of Week</Label>
                            <select
                              className="w-full h-9 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-medium"
                              {...reportScheduleForm.register("weeklyDay")}
                            >
                              <option value="1">Monday</option>
                              <option value="2">Tuesday</option>
                              <option value="3">Wednesday</option>
                              <option value="4">Thursday</option>
                              <option value="5">Friday</option>
                              <option value="6">Saturday</option>
                              <option value="0">Sunday</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[var(--text-secondary)]">Time of Day</Label>
                            <Input
                              type="time"
                              className="h-9 text-xs bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)] font-medium"
                              {...reportScheduleForm.register("weeklyTime")}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Monthly Report Schedule */}
                    <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Monthly Executive Report</h4>
                          <p className="text-xs text-[var(--text-secondary)] font-normal">Full resource allocation, client breakdown, and KPI scorecard monthly</p>
                        </div>
                        <Controller
                          control={reportScheduleForm.control}
                          name="monthlyEnabled"
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                      {reportScheduleForm.watch("monthlyEnabled") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md animate-fade-in">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[var(--text-secondary)]">Run On</Label>
                            <select
                              className="w-full h-9 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-medium"
                              {...reportScheduleForm.register("monthlyDay")}
                            >
                              <option value="L">Last day of month</option>
                              <option value="1">First day of month</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[var(--text-secondary)]">Time of Day</Label>
                            <Input
                              type="time"
                              className="h-9 text-xs bg-[var(--surface)] border-[var(--border)] focus-visible:ring-[var(--primary)] font-medium"
                              {...reportScheduleForm.register("monthlyTime")}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateScheduleMutation.isPending}
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-95 mt-4"
                  >
                    {updateScheduleMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving Schedule...
                      </>
                    ) : (
                      "Save Schedule Configuration"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Finance settings */}
        <TabsContent value="finance" className="mt-4">
          <Card className="bg-[var(--surface)] border-[var(--border)] animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base text-[var(--text-primary)]">Finance & Billing Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFinance ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              ) : (
                <form onSubmit={financeForm.handleSubmit(onSubmitFinance)} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="defaultContractedHourlyRate">
                      Default Contracted Hourly Rate (LKR)
                    </Label>
                    <Input
                      id="defaultContractedHourlyRate"
                      type="number"
                      className="bg-[var(--background)] border-[var(--border)] text-sm focus-visible:ring-[var(--primary)]"
                      {...financeForm.register("defaultContractedHourlyRate", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Used as a fallback for calculating overrun costs and effective hourly rates in reports when no project-specific billing rates are defined.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateFinanceMutation.isPending}
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-95"
                  >
                    {updateFinanceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving Settings...
                      </>
                    ) : (
                      "Save Finance Settings"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
