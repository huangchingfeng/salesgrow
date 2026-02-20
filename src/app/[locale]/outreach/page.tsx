"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmailEditor } from "@/components/modules/email-editor";
import { EmailScore } from "@/components/modules/email-score";
import { Wand2, Loader2 } from "lucide-react";
import { localeNames, locales } from "@/i18n/routing";

export default function OutreachPage() {
  const t = useTranslations("outreach");
  const [client, setClient] = useState("");
  const [purpose, setPurpose] = useState("coldEmail");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSubject(`Re: Partnership Opportunity with ${client || "Your Company"}`);
    setBody(
      `Dear Sarah,\n\nI hope this message finds you well. I recently came across your company's impressive work in the enterprise SaaS space, particularly your recent Series C funding round.\n\nAt our company, we specialize in helping fast-growing SaaS companies like yours optimize their sales processes. Given your expansion into the APAC market, I believe we could provide significant value.\n\nWould you be open to a brief 15-minute call this week to explore potential synergies?\n\nBest regards,\nAlex`
    );
    setGenerated(true);
    setIsGenerating(false);
  };

  const purposeOptions = [
    { value: "coldEmail", label: t("purposes.coldEmail") },
    { value: "followUp", label: t("purposes.followUp") },
    { value: "introduction", label: t("purposes.introduction") },
    { value: "proposal", label: t("purposes.proposal") },
    { value: "thankYou", label: t("purposes.thankYou") },
  ];

  const toneOptions = [
    { value: "professional", label: t("tones.professional") },
    { value: "friendly", label: t("tones.friendly") },
    { value: "formal", label: t("tones.formal") },
    { value: "casual", label: t("tones.casual") },
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
                {isGenerating ? "Generating..." : t("generate")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated content */}
        {generated && (
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
            <EmailScore
              totalScore={82}
              breakdown={[
                { label: "Personalization", score: 90 },
                { label: "Clarity", score: 85 },
                { label: "Call to Action", score: 75 },
                { label: "Subject Line", score: 78 },
              ]}
              suggestions={[
                "Add a specific metric or case study to build credibility",
                "Make your CTA more specific with a date suggestion",
                "Consider mentioning a mutual connection if available",
              ]}
            />
          </div>
        )}

        {/* Empty state */}
        {!generated && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-primary-light p-4 mb-4">
              <Wand2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">
              Write your first AI email
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Fill in the settings above and let AI generate a personalized outreach email for you.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
