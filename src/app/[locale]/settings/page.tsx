"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { useToast } from "@/components/ui/toast";
import { useUserStore } from "@/lib/stores/user-store";
import { supabase } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { locales, localeNames } from "@/i18n/routing";
import {
  User,
  Globe,
  BellRing,
  Shield,
  Download,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Loader2,
} from "lucide-react";

const NOTIFICATION_STORAGE_KEY = "salesgrow-notifications";

type NotificationSettings = Record<string, boolean>;

const defaultNotifications: NotificationSettings = {
  "follow-up-reminders": true,
  "daily-tasks": true,
  "achievement-unlocked": true,
  "weekly-report": true,
};

function loadNotifications(): NotificationSettings {
  if (typeof window === "undefined") return defaultNotifications;
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultNotifications;
  } catch {
    return defaultNotifications;
  }
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isAuthenticated, name, email, clearUser } = useUserStore();

  // --- Profile form state ---
  const [formName, setFormName] = useState(name || "");
  const [formEmail, setFormEmail] = useState(email || "");

  const { data: profile, isLoading: profileLoading } = trpc.user.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setFormName(profile.name || "");
      setFormEmail(profile.email || "");
    }
  }, [profile]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast(tc("profileSaved"), "success");
    },
    onError: () => {
      toast(tc("profileSaveError"), "error");
    },
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({ name: formName });
  };

  // --- Notification toggle state ---
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  const toggleNotification = useCallback((key: string) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // --- Privacy toggle ---
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("salesgrow-analytics");
    if (stored !== null) setAnalyticsEnabled(JSON.parse(stored));
  }, []);

  const toggleAnalytics = () => {
    setAnalyticsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("salesgrow-analytics", JSON.stringify(next));
      return next;
    });
  };

  // --- Export Data ---
  const [exporting, setExporting] = useState(false);

  const clientsQuery = trpc.clients.list.useQuery(undefined, { enabled: false });
  const outreachQuery = trpc.outreach.list.useQuery(undefined, { enabled: false });
  const visitLogQuery = trpc.visitLog.list.useQuery(undefined, { enabled: false });
  const coachQuery = trpc.coach.getHistory.useQuery(undefined, { enabled: false });

  const handleExport = async () => {
    setExporting(true);
    toast(tc("exportingData"), "info");
    try {
      const [clients, outreach, visitLogs, coachSessions] = await Promise.all([
        clientsQuery.refetch(),
        outreachQuery.refetch(),
        visitLogQuery.refetch(),
        coachQuery.refetch(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profile || { name: formName, email: formEmail },
        clients: clients.data || [],
        outreachEmails: outreach.data || [],
        visitLogs: visitLogs.data || [],
        coachSessions: coachSessions.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salesgrow-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast(tc("exportSuccess"), "success");
    } catch {
      toast(tc("exportError"), "error");
    } finally {
      setExporting(false);
    }
  };

  // --- Delete Account ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await supabase.auth.signOut();
      clearUser();
      toast(tc("accountDeleted"), "info");
      router.push(`/${locale}`);
    } catch {
      toast(tc("profileSaveError"), "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // --- Language ---
  const languageOptions = locales.map((loc) => ({
    value: loc,
    label: localeNames[loc],
  }));

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  // --- Notification items config ---
  const notificationItems = [
    { key: "follow-up-reminders", label: "Follow-up reminders", description: "Get notified when a follow-up is due" },
    { key: "daily-tasks", label: "Daily tasks", description: "Receive daily task reminders" },
    { key: "achievement-unlocked", label: "Achievement unlocked", description: "Celebrate when you unlock achievements" },
    { key: "weekly-report", label: "Weekly report", description: "Get a weekly summary of your progress" },
  ];

  if (!isAuthenticated) {
    return (
      <AppShell>
        <SignInPrompt />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("account")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  <Input
                    label="Email"
                    value={formEmail}
                    type="email"
                    disabled
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t("saveChanges")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("language")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label="Interface Language"
              options={languageOptions}
              value={locale}
              onChange={handleLanguageChange}
            />
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              {t("theme")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[
                { value: "light", icon: Sun, label: t("themes.light") },
                { value: "dark", icon: Moon, label: t("themes.dark") },
                { value: "system", icon: Monitor, label: t("themes.system") },
              ].map((themeOption) => {
                const Icon = themeOption.icon;
                const isActive = theme === themeOption.value;
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors flex-1 ${
                      isActive
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border hover:bg-bg-muted"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-text-secondary"}`} />
                    <span className={`text-sm ${isActive ? "font-medium text-primary" : "text-text"}`}>
                      {themeOption.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              {t("notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={notifications[item.key] ?? true}
                    onChange={() => toggleNotification(item.key)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t("privacy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Analytics</p>
                <p className="text-xs text-text-muted">Help us improve with anonymous usage data</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={toggleAnalytics}
                  className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("exportData")}
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              {t("deleteAccount")}
            </Button>
            <p className="text-xs text-text-muted">
              {t("deleteWarning")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogHeader onClose={() => setDeleteDialogOpen(false)}>
          {tc("deleteConfirmTitle")}
        </DialogHeader>
        <p className="text-sm text-text-muted mb-6">
          {tc("deleteConfirmMessage")}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {tc("confirm")}
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
