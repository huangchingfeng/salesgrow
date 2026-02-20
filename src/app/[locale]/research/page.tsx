"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResearchResult } from "@/components/modules/research-result";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ResearchData {
  company: string;
  overview: string;
  industry: string;
  news: string[];
  painPoints: string[];
  icebreakers: string[];
  contacts: { name: string; title: string }[];
}

export default function ResearchPage() {
  const t = useTranslations("research");
  const tErr = useTranslations("errors");
  const locale = useLocale();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchData | null>(null);
  const [hasError, setHasError] = useState(false);
  const [remaining, setRemaining] = useState(5);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResult(null);
    setHasError(false);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: query, locale }),
      });

      const json = await res.json();

      if (!json.success) {
        if (json.error?.code === "RATE_LIMIT") {
          toast(t("limitReached"), "error");
          setRemaining(0);
        } else {
          toast(json.error?.message || tErr("aiError"), "error");
          setHasError(true);
        }
        return;
      }

      const data = json.data;
      setResult({
        company: query,
        overview: data.companyOverview,
        industry: data.industry,
        news: data.recentNews,
        painPoints: data.painPoints,
        icebreakers: data.icebreakers,
        contacts: data.keyContacts.map((c: { role: string; suggestedApproach: string }) => ({
          name: c.role,
          title: c.suggestedApproach,
        })),
      });
      setRemaining((prev) => Math.max(0, prev - 1));
    } catch {
      toast(tErr("aiError"), "error");
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {t("remaining", { count: remaining })}
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("placeholder")}
              className="w-full h-12 rounded-xl border border-border bg-bg-card pl-10 pr-4 text-base text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <Button size="lg" onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("button")
            )}
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading", { company: query })}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {/* Error with retry */}
        {!isLoading && hasError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-text-secondary mb-3">{tErr("aiError")}</p>
            <Button variant="outline" onClick={handleSearch}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {t("button")}
            </Button>
          </div>
        )}

        {/* Results */}
        {!isLoading && result && (
          <ResearchResult
            {...result}
            onWriteEmail={() => {}}
            onSave={() => {}}
          />
        )}

        {/* Empty state */}
        {!isLoading && !result && !hasError && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-primary-light p-4 mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">
              {t("title")}
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {t("placeholder")}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
