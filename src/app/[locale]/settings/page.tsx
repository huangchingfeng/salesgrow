"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/stores/user-store";
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
} from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, name, email } = useUserStore();

  const displayName = name || "Sales Pro";
  const displayEmail = email || "user@example.com";

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
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" defaultValue={displayName} />
              <Input label="Email" defaultValue={displayEmail} type="email" />
            </div>
            <Input label="Company" defaultValue="" />
            <Button size="sm">{t("saveChanges")}</Button>
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
            {[
              { label: "Follow-up reminders", description: "Get notified when a follow-up is due" },
              { label: "Daily tasks", description: "Receive daily task reminders" },
              { label: "Achievement unlocked", description: "Celebrate when you unlock achievements" },
              { label: "Weekly report", description: "Get a weekly summary of your progress" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
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
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              {t("exportData")}
            </Button>
            <Button variant="destructive" className="w-full justify-start gap-2">
              <Trash2 className="h-4 w-4" />
              {t("deleteAccount")}
            </Button>
            <p className="text-xs text-text-muted">
              {t("deleteWarning")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
