"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Menu, X, TrendingUp } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LanguageSwitcher } from "./language-switcher";
import { useUserStore } from "@/lib/stores/user-store";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("common");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, name } = useUserStore();

  const navItems = [
    { href: `/${locale}/research`, label: nav("research") },
    { href: `/${locale}/outreach`, label: nav("outreach") },
    { href: `/${locale}/coach`, label: nav("coach") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <TrendingUp className="h-6 w-6" />
          <span>{t("appName")}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {!isAuthenticated &&
            navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
              >
                {item.label}
              </Link>
            ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link href={`/${locale}/dashboard`}>
              <Avatar name={name || "User"} size="sm" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/dashboard`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {t("signIn")}
              </Link>
              <Link href={`/${locale}/dashboard`} className={buttonVariants({ size: "sm" })}>
                {t("signUp")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg-card p-4">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-text-secondary hover:text-text py-2"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border pt-3 mt-1">
              <LanguageSwitcher />
            </div>
            {!isAuthenticated && (
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  {t("signIn")}
                </Button>
                <Button size="sm" className="flex-1">
                  {t("signUp")}
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
