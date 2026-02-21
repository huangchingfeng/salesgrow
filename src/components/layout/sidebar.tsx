"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Search,
  Mail,
  ClipboardList,
  Bell,
  Brain,
  Trophy,
  BookOpen,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { key: "research", icon: Search, href: "/research" },
  { key: "clients", icon: Users, href: "/clients" },
  { key: "outreach", icon: Mail, href: "/outreach" },
  { key: "visitLog", icon: ClipboardList, href: "/visit-log" },
  { key: "followUp", icon: Bell, href: "/follow-up" },
  { key: "coach", icon: Brain, href: "/coach" },
  { key: "leaderboard", icon: Trophy, href: "/leaderboard" },
  { key: "learning", icon: BookOpen, href: "/learning" },
  { key: "settings", icon: Settings, href: "/settings" },
] as const;

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-60 border-r border-border bg-bg-card h-[calc(100vh-4rem)] sticky top-16",
        className
      )}
    >
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
