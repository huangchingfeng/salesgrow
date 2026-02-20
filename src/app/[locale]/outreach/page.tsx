"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmailEditor } from "@/components/modules/email-editor";
import { EmailScore } from "@/components/modules/email-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2, Loader2, RefreshCw, Save, LogIn, Mail, Inbox } from "lucide-react";
import { localeNames, locales } from "@/i18n/routing";
import { useToast } from "@/components/ui/toast";
import { trpc } from "@/lib/trpc";
import { useUserStore } from "@/lib/stores/user-store";

interface ScoreData {
  totalScore: number;
  breakdown: { label: string; score: number }[];
  suggestions: string[];
}

export default function OutreachPage() {
  const t = useTranslations("outreach");
  const tErr = useTranslations("errors");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated } = useUserStore();
  const [client, setClient] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
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

  // tRPC queries & mutations
  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const emailsQuery = trpc.outreach.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createOutreach = trpc.outreach.create.useMutation({
    onSuccess: () => {
      toast("Email saved!", "success");
      utils.outreach.list.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  // Pre-fill from URL search param
  useEffect(() => {
    const clientParam = searchParams.get("client");
    if (clientParam) {
      setClient(clientParam);
      // Try to match to an existing client
      if (clientsQuery.data) {
        const match = clientsQuery.data.find(
          (c) => c.companyName.toLowerCase() === clientParam.toLowerCase()
        );
        if (match) setSelectedClientId(match.id);
      }
    }
  }, [searchParams, clientsQuery.data]);

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
      toast(t("clientRequired") || "Please enter a client name", "error");
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

  const handleSaveEmail = () => {
    if (!selectedClientId) {
      toast("Select a client to save the email", "error");
      return;
    }
    createOutreach.mutate({
      clientId: selectedClientId,
      subject,
      body,
      language,
      tone,
      score: score?.totalScore,
    });
  };

  const handleClientSelect = (id: string) => {
    setSelectedClientId(id);
    const match = clientsQuery.data?.find((c) => c.id === id);
    if (match) setClient(match.companyName);
  };

  const purposeOptions = [
    { value: "cold_email", label: t("purposes.coldEmail") },
    { value: "follow_up", label: t("purposes.followUp") },
    { value: "introduction", label: t("purposes.introduction") },
    { value: "proposal", label: t("purposes.proposal") },
    { value: "thank_you", label: t("purposes.thankYou") },
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

  const clientOptions = (clientsQuery.data ?? []).map((c) => ({
    value: c.id,
    label: c.companyName,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        {/* Settings */}
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Client selector: dropdown if clients exist, otherwise text input */}
              {isAuthenticated && clientOptions.length > 0 ? (
                <div>
                  <Select
                    label={t("clientLabel")}
                    options={[{ value: "", label: "-- Select client --" }, ...clientOptions]}
                    value={selectedClientId ?? ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleClientSelect(e.target.value);
                      } else {
                        setSelectedClientId(null);
                        setClient("");
                      }
                    }}
                  />
                  <Input
                    value={client}
                    onChange={(e) => {
                      setClient(e.target.value);
                      setSelectedClientId(null);
                    }}
                    placeholder="Or type a company name"
                    className="mt-2"
                  />
                </div>
              ) : (
                <Input
                  label={t("clientLabel")}
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="TechCorp Inc."
                />
              )}
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
                {isGenerating ? t("generating") || "Generating..." : t("generate")}
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
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <EmailEditor
                  subject={subject}
                  body={body}
                  onSubjectChange={setSubject}
                  onBodyChange={setBody}
                  onRegenerate={handleGenerate}
                />
                {/* Save button */}
                {isAuthenticated && selectedClientId ? (
                  <div className="mt-3">
                    <Button onClick={handleSaveEmail} disabled={createOutreach.isPending}>
                      {createOutreach.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {createOutreach.isPending ? "Saving..." : "Save Email"}
                    </Button>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
                    <LogIn className="h-4 w-4 shrink-0" />
                    Sign in to save emails.
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-text-muted">
                    Select a client above to save this email.
                  </div>
                )}
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
          </>
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
              {isAuthenticated && clientOptions.length === 0
                ? "Research a company first to get started"
                : t("suggestions")}
            </p>
          </div>
        )}

        {/* Email History */}
        {isAuthenticated && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Saved Emails
            </h2>
            {emailsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : emailsQuery.data && emailsQuery.data.length > 0 ? (
              <div className="space-y-2">
                {emailsQuery.data.map((email) => (
                  <Card key={email.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text truncate">
                            {email.subject}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                            {email.body}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {email.score && (
                            <span className="text-xs font-medium text-primary">
                              {email.score}pts
                            </span>
                          )}
                          <span className="text-xs text-text-muted">
                            {new Date(email.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Inbox className="h-8 w-8 text-text-muted mb-2" />
                <p className="text-sm text-text-muted">No saved emails yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
