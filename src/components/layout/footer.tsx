"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";

export function Footer() {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <footer className="border-t border-border bg-bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
              <TrendingUp className="h-5 w-5" />
              {t("appName")}
            </div>
            <p className="text-sm text-text-secondary">{t("tagline")}</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-text">Product</h4>
            <nav className="flex flex-col gap-2">
              <Link href={`/${locale}/research`} className="text-sm text-text-secondary hover:text-text">Research</Link>
              <Link href={`/${locale}/outreach`} className="text-sm text-text-secondary hover:text-text">Outreach</Link>
              <Link href={`/${locale}/coach`} className="text-sm text-text-secondary hover:text-text">AI Coach</Link>
              <Link href={`/${locale}/leaderboard`} className="text-sm text-text-secondary hover:text-text">Leaderboard</Link>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-text">Company</h4>
            <nav className="flex flex-col gap-2">
              <Link href={`/${locale}`} className="text-sm text-text-secondary hover:text-text">About</Link>
              <Link href={`/${locale}`} className="text-sm text-text-secondary hover:text-text">Privacy Policy</Link>
              <Link href={`/${locale}`} className="text-sm text-text-secondary hover:text-text">Terms of Service</Link>
            </nav>
          </div>

          {/* Language */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-text">{t("language")}</h4>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} SalesGrow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
