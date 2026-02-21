"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  // --- Sales Profile ---
  const profileQuery = trpc.user.getSalesProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.user.updateSalesProfile.useMutation({
    onSuccess: () => {
      toast(t("salesProfile.saveSuccess"), "success");
      utils.user.getSalesProfile.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  const [salesForm, setSalesForm] = useState({
    jobTitle: "",
    companyName: "",
    companyDescription: "",
    productsServices: "",
    industry: "",
    targetAudience: "",
    uniqueSellingPoints: "",
    yearsExperience: "",
    communicationStyle: "",
    personalBio: "",
    phone: "",
    lineId: "",
    linkedinUrl: "",
    customLinks: [] as { label: string; url: string }[],
  });

  useEffect(() => {
    if (profileQuery.data) {
      setSalesForm({
        jobTitle: profileQuery.data.jobTitle ?? "",
        companyName: profileQuery.data.companyName ?? "",
        companyDescription: profileQuery.data.companyDescription ?? "",
        productsServices: profileQuery.data.productsServices ?? "",
        industry: profileQuery.data.industry ?? "",
        targetAudience: profileQuery.data.targetAudience ?? "",
        uniqueSellingPoints: profileQuery.data.uniqueSellingPoints ?? "",
        yearsExperience: profileQuery.data.yearsExperience?.toString() ?? "",
        communicationStyle: profileQuery.data.communicationStyle ?? "",
        personalBio: profileQuery.data.personalBio ?? "",
        phone: profileQuery.data.phone ?? "",
        lineId: profileQuery.data.lineId ?? "",
        linkedinUrl: profileQuery.data.linkedinUrl ?? "",
        customLinks: (profileQuery.data.customLinks as { label: string; url: string }[] | null) ?? [],
      });
    }
  }, [profileQuery.data]);

  const handleSaveSalesProfile = () => {
    updateProfileMutation.mutate({
      jobTitle: salesForm.jobTitle.trim() || undefined,
      companyName: salesForm.companyName.trim() || undefined,
      companyDescription: salesForm.companyDescription.trim() || undefined,
      productsServices: salesForm.productsServices.trim() || undefined,
      industry: salesForm.industry.trim() || undefined,
      targetAudience: salesForm.targetAudience.trim() || undefined,
      uniqueSellingPoints: salesForm.uniqueSellingPoints.trim() || undefined,
      yearsExperience: salesForm.yearsExperience ? parseInt(salesForm.yearsExperience) : undefined,
      communicationStyle: salesForm.communicationStyle.trim() || undefined,
      personalBio: salesForm.personalBio.trim() || undefined,
      phone: salesForm.phone.trim() || undefined,
      lineId: salesForm.lineId.trim() || undefined,
      linkedinUrl: salesForm.linkedinUrl.trim() || undefined,
      customLinks: salesForm.customLinks.filter(l => l.label.trim() && l.url.trim()),
    });
  };

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
    { key: "follow-up-reminders", label: t("notifyFollowUp"), description: t("notifyFollowUpDesc") },
    { key: "daily-tasks", label: t("notifyDailyTasks"), description: t("notifyDailyTasksDesc") },
    { key: "achievement-unlocked", label: t("notifyAchievement"), description: t("notifyAchievementDesc") },
    { key: "weekly-report", label: t("notifyWeeklyReport"), description: t("notifyWeeklyReportDesc") },
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
                    label={t("accountName")}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  <Input
                    label={t("accountEmail")}
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

        {/* Sales Profile */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text">{t("salesProfile.title")}</h2>
              <p className="text-sm text-text-secondary mt-1">{t("salesProfile.description")}</p>
            </div>

            {/* 基本資訊 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("salesProfile.jobTitle")}
                placeholder={t("salesProfile.jobTitlePlaceholder")}
                value={salesForm.jobTitle}
                onChange={(e) => setSalesForm(f => ({ ...f, jobTitle: e.target.value }))}
              />
              <Input
                label={t("salesProfile.companyName")}
                placeholder={t("salesProfile.companyNamePlaceholder")}
                value={salesForm.companyName}
                onChange={(e) => setSalesForm(f => ({ ...f, companyName: e.target.value }))}
              />
            </div>

            <Textarea
              label={t("salesProfile.companyDescription")}
              placeholder={t("salesProfile.companyDescriptionPlaceholder")}
              value={salesForm.companyDescription}
              onChange={(e) => setSalesForm(f => ({ ...f, companyDescription: e.target.value }))}
            />

            <Textarea
              label={t("salesProfile.productsServices")}
              placeholder={t("salesProfile.productsServicesPlaceholder")}
              value={salesForm.productsServices}
              onChange={(e) => setSalesForm(f => ({ ...f, productsServices: e.target.value }))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("salesProfile.industry")}
                placeholder={t("salesProfile.industryPlaceholder")}
                value={salesForm.industry}
                onChange={(e) => setSalesForm(f => ({ ...f, industry: e.target.value }))}
              />
              <Input
                label={t("salesProfile.yearsExperience")}
                placeholder="0"
                type="number"
                value={salesForm.yearsExperience}
                onChange={(e) => setSalesForm(f => ({ ...f, yearsExperience: e.target.value }))}
              />
            </div>

            <Textarea
              label={t("salesProfile.targetAudience")}
              placeholder={t("salesProfile.targetAudiencePlaceholder")}
              value={salesForm.targetAudience}
              onChange={(e) => setSalesForm(f => ({ ...f, targetAudience: e.target.value }))}
            />

            <Textarea
              label={t("salesProfile.uniqueSellingPoints")}
              placeholder={t("salesProfile.uniqueSellingPointsPlaceholder")}
              value={salesForm.uniqueSellingPoints}
              onChange={(e) => setSalesForm(f => ({ ...f, uniqueSellingPoints: e.target.value }))}
            />

            <Select
              label={t("salesProfile.communicationStyle")}
              options={[
                { value: "professional", label: t("salesProfile.styles.professional") },
                { value: "friendly", label: t("salesProfile.styles.friendly") },
                { value: "consultative", label: t("salesProfile.styles.consultative") },
                { value: "direct", label: t("salesProfile.styles.direct") },
              ]}
              value={salesForm.communicationStyle}
              onChange={(e) => setSalesForm(f => ({ ...f, communicationStyle: e.target.value }))}
            />

            <Textarea
              label={t("salesProfile.personalBio")}
              placeholder={t("salesProfile.personalBioPlaceholder")}
              value={salesForm.personalBio}
              onChange={(e) => setSalesForm(f => ({ ...f, personalBio: e.target.value }))}
            />

            {/* 聯繫方式 */}
            <div>
              <h3 className="text-sm font-medium text-text mb-3">{t("salesProfile.contactInfo")}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label={t("salesProfile.phone")}
                  placeholder="+886-"
                  value={salesForm.phone}
                  onChange={(e) => setSalesForm(f => ({ ...f, phone: e.target.value }))}
                />
                <Input
                  label={t("salesProfile.lineId")}
                  placeholder="LINE ID"
                  value={salesForm.lineId}
                  onChange={(e) => setSalesForm(f => ({ ...f, lineId: e.target.value }))}
                />
                <Input
                  label={t("salesProfile.linkedin")}
                  placeholder="https://linkedin.com/in/"
                  value={salesForm.linkedinUrl}
                  onChange={(e) => setSalesForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                />
              </div>
            </div>

            {/* 自訂連結 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-text">{t("salesProfile.customLinks")}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{t("salesProfile.customLinksDesc")}</p>
                </div>
                {salesForm.customLinks.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSalesForm(f => ({
                      ...f,
                      customLinks: [...f.customLinks, { label: "", url: "" }],
                    }))}
                  >
                    + {t("salesProfile.addLink")}
                  </Button>
                )}
              </div>

              {/* 快速新增常用平台 */}
              {salesForm.customLinks.length < 10 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["WhatsApp", "Instagram", "YouTube", "Facebook", "X / Twitter", "WeChat", t("salesProfile.platformSuggestions.newsletter"), t("salesProfile.platformSuggestions.website")].map((platform) => {
                    const alreadyAdded = salesForm.customLinks.some(
                      (l) => l.label.toLowerCase() === platform.toLowerCase()
                    );
                    if (alreadyAdded) return null;
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() =>
                          setSalesForm((f) => ({
                            ...f,
                            customLinks: [...f.customLinks, { label: platform, url: "" }],
                          }))
                        }
                        className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary hover:bg-bg-muted hover:text-text transition-colors"
                      >
                        + {platform}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 已新增的連結列表 */}
              {salesForm.customLinks.length > 0 && (
                <div className="space-y-2">
                  {salesForm.customLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={t("salesProfile.linkLabel")}
                        value={link.label}
                        onChange={(e) => {
                          const updated = [...salesForm.customLinks];
                          updated[index] = { ...updated[index], label: e.target.value };
                          setSalesForm(f => ({ ...f, customLinks: updated }));
                        }}
                        className="w-1/3"
                      />
                      <Input
                        placeholder={t("salesProfile.linkUrl")}
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...salesForm.customLinks];
                          updated[index] = { ...updated[index], url: e.target.value };
                          setSalesForm(f => ({ ...f, customLinks: updated }));
                        }}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSalesForm(f => ({
                            ...f,
                            customLinks: f.customLinks.filter((_, i) => i !== index),
                          }));
                        }}
                        className="rounded p-1.5 text-text-muted hover:bg-danger-light hover:text-danger transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {salesForm.customLinks.length >= 10 && (
                <p className="text-xs text-text-muted mt-2">
                  {t("salesProfile.maxLinks", { max: 10 })}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveSalesProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("saveChanges")}
              </Button>
            </div>
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
              label={t("interfaceLanguage")}
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
                <p className="text-sm font-medium text-text">{t("analyticsLabel")}</p>
                <p className="text-xs text-text-muted">{t("analyticsDesc")}</p>
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
