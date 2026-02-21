"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Search,
  Mail,
  Brain,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { key: "research", icon: Search, href: "/research" },
  { key: "clients", icon: Users, href: "/clients" },
  { key: "outreach", icon: Mail, href: "/outreach" },
  { key: "coach", icon: Brain, href: "/coach" },
  { key: "settings", icon: User, href: "/settings" },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden border-t border-border bg-bg-card/95 backdrop-blur-md">
      {navItems.map((item) => {
        const href = `/${locale}${item.href}`;
        const isActive = pathname === href || pathname.startsWith(href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.key}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
