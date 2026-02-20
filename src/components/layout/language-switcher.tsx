"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className={cn("relative inline-flex items-center gap-1.5", className)}>
      <Globe className="h-4 w-4 text-text-muted" />
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "appearance-none bg-transparent text-sm text-text-secondary hover:text-text cursor-pointer focus:outline-none",
          compact ? "w-12" : "w-auto pr-4"
        )}
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {compact ? loc.toUpperCase().slice(0, 2) : localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
