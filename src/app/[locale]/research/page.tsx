"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResearchResult } from "@/components/modules/research-result";
import { Search, Loader2 } from "lucide-react";

const MOCK_RESULT = {
  company: "TechCorp Inc.",
  overview:
    "TechCorp is a mid-size SaaS company specializing in enterprise project management tools. Founded in 2018, they have 500+ employees and serve clients across APAC.",
  industry: "Enterprise SaaS",
  news: [
    "Raised $50M Series C in January 2026",
    "Launched AI-powered project scheduling feature",
    "Expanded to Japanese market last quarter",
  ],
  painPoints: [
    "Customer churn in SMB segment",
    "Sales team scaling challenges",
    "CRM migration from legacy system",
  ],
  icebreakers: [
    "Congratulate on Series C funding round",
    "Ask about their AI feature launch experience",
    "Discuss APAC expansion challenges",
  ],
  contacts: [
    { name: "Sarah Chen", title: "VP of Sales" },
    { name: "Michael Park", title: "Head of Business Development" },
    { name: "Lisa Wong", title: "Chief Revenue Officer" },
  ],
};

export default function ResearchPage() {
  const t = useTranslations("research");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null);
  const remainingQueries = 4;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setResult(MOCK_RESULT);
    setIsLoading(false);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {t("remaining", { count: remainingQueries })}
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

        {/* Results */}
        {!isLoading && result && (
          <ResearchResult
            {...result}
            onWriteEmail={() => {}}
            onSave={() => {}}
          />
        )}

        {/* Empty state */}
        {!isLoading && !result && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-primary-light p-4 mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">
              Start your research
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Enter a company name or website to get a comprehensive briefing powered by AI.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
