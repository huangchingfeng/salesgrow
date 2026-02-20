"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmailEditor } from "@/components/modules/email-editor";
import { EmailScore } from "@/components/modules/email-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2, Loader2, RefreshCw } from "lucide-react";
import { localeNames, locales } from "@/i18n/routing";
import { useToast } from "@/components/ui/toast";

interface ScoreData {
  totalScore: number;
  breakdown: { label: string; score: number }[];
  suggestions: string[];
}

export default function OutreachPage() {
  const t = useTranslations("outreach");
  const tErr = useTranslations("errors");
  const locale = useLocale();
  const { toast } = useToast();
  const [client, setClient] = useState("");
  const [purpose, setPurpose] = useState("cold_email");
  const [tone, setTone] = useState("formal");
  const [language, setLanguage] = useState(locale);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [score, setScore] = useState<ScoreData | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const scoreEmail = async (emailContent: string) => {
    setIsScoring(true);
    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailContent, language }),
      });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setScore({
          totalScore: d.totalScore,
          breakdown: [
            { label: "Personalization", score: d.dimensions.personalization.score * 4 },
            { label: "Value Proposition", score: d.dimensions.valueProposition.score * 4 },
            { label: "Call to Action", score: d.dimensions.callToAction.score * 4 },
            { label: "Tone", score: d.dimensions.toneAppropriateness.score * 4 },
          ],
          suggestions: d.improvements,
        });
      }
    } catch {
      // Score is optional, don't block on failure
    } finally {
      setIsScoring(false);
    }
  };

  const handleGenerate = async () => {
    if (!client.trim()) {
      toast(t("clientLabel"), "error");
      return;
    }
    setIsGenerating(true);
    setGenerated(false);
    setScore(null);
    setHasError(false);

    try {
      const res = await fetch("/api/ai/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client, purpose, tone, language }),
      });

      const json = await res.json();

      if (!json.success) {
        toast(json.error?.message || tErr("aiError"), "error");
        setHasError(true);
        return;
      }

      setSubject(json.data.subject);
      setBody(json.data.body);
      setGenerated(true);

      // Auto-score the generated email
      scoreEmail(`Subject: ${json.data.subject}\n\n${json.data.body}`);
    } catch {
      toast(tErr("aiError"), "error");
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const purposeOptions = [
    { value: "cold_email", label: t("purposes.coldEmail") },
    { value: "follow_up", label: t("purposes.followUp") },
    { value: "introduction", label: t("purposes.introduction") },
    { value: "proposal", label: t("purposes.proposal") },
    { value: "thank_you", label: t("purposes.thankYou") },
  ];

  const toneOptions = [
    { value: "formal", label: t("tones.professional") },
    { value: "friendly", label: t("tones.friendly") },
    { value: "urgent", label: t("tones.formal") },
    { value: "consultative", label: t("tones.casual") },
  ];

  const languageOptions = locales.map((loc) => ({
    value: loc,
    label: localeNames[loc],
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        {/* Settings */}
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label={t("clientLabel")}
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="TechCorp Inc."
              />
              <Select
                label={t("purposeLabel")}
                options={purposeOptions}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
              <Select
                label={t("toneLabel")}
                options={toneOptions}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
              <Select
                label={t("languageLabel")}
                options={languageOptions}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isGenerating ? t("generate") : t("generate")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("generate")}...
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {/* Error with retry */}
        {!isGenerating && hasError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-text-secondary mb-3">{tErr("aiError")}</p>
            <Button variant="outline" onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {t("regenerate")}
            </Button>
          </div>
        )}

        {/* Generated content */}
        {generated && !isGenerating && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EmailEditor
                subject={subject}
                body={body}
                onSubjectChange={setSubject}
                onBodyChange={setBody}
                onRegenerate={handleGenerate}
              />
            </div>
            {isScoring ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : score ? (
              <EmailScore
                totalScore={score.totalScore}
                breakdown={score.breakdown}
                suggestions={score.suggestions}
              />
            ) : null}
          </div>
        )}

        {/* Empty state */}
        {!generated && !isGenerating && !hasError && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-primary-light p-4 mb-4">
              <Wand2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">
              {t("title")}
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {t("suggestions")}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
