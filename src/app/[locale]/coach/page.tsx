"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoachChat } from "@/components/modules/coach-chat";
import { useToast } from "@/components/ui/toast";
import {
  Phone,
  ShieldAlert,
  Handshake,
  Search,
  DollarSign,
  Brain,
  History,
  RefreshCw,
} from "lucide-react";

const SCENARIOS = [
  { key: "coldCall", apiKey: "cold_call", icon: Phone, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  { key: "objectionHandling", apiKey: "objection_price", icon: ShieldAlert, color: "text-red-500 bg-red-50 dark:bg-red-950" },
  { key: "closing", apiKey: "closing_assumptive", icon: Handshake, color: "text-green-500 bg-green-50 dark:bg-green-950" },
  { key: "needsDiscovery", apiKey: "needs_discovery", icon: Search, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  { key: "priceNegotiation", apiKey: "negotiation_discount", icon: DollarSign, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
];

interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
}

export default function CoachPage() {
  const t = useTranslations("coach");
  const tErr = useTranslations("errors");
  const locale = useLocale();
  const { toast } = useToast();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    tip: string;
  } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startScenario = async (key: string) => {
    const scenario = SCENARIOS.find((s) => s.key === key);
    if (!scenario) return;

    setActiveScenario(key);
    setMessages([]);
    setFeedback(null);
    setIsLoading(true);
    setHasError(false);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          scenario: scenario.apiKey,
          locale,
          culture: "taiwan",
        }),
      });

      const json = await res.json();
      if (!json.success) {
        toast(json.error?.message || tErr("aiError"), "error");
        setActiveScenario(null);
        setHasError(true);
        return;
      }

      setSessionId(json.data.sessionId);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "coach",
          content: json.data.initialMessage,
        },
      ]);
    } catch {
      toast(tErr("aiError"), "error");
      setActiveScenario(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionId) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          sessionId,
          message: content,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        toast(json.error?.message || tErr("aiError"), "error");
        setIsLoading(false);
        return;
      }

      const coachMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "coach",
        content: json.data.reply,
      };
      setMessages((prev) => [...prev, coachMsg]);

      // If session is complete, get feedback
      if (json.data.isComplete) {
        await endSession();
      }
    } catch {
      toast(tErr("aiError"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId }),
      });

      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setFeedback({
          score: d.totalScore,
          strengths: d.strengths,
          improvements: d.improvements,
          tip: d.encouragement,
        });
      }
    } catch {
      // Feedback is best-effort
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        {!activeScenario ? (
          <>
            {/* Error retry */}
            {hasError && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-text-secondary mb-3">{tErr("aiError")}</p>
                <Button variant="outline" onClick={() => setHasError(false)}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  {t("startRolePlay")}
                </Button>
              </div>
            )}

            {/* Scenario selection */}
            {!hasError && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    {t("rolePlay")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary mb-4">
                    {t("rolePlayDesc")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SCENARIOS.map((scenario) => {
                      const Icon = scenario.icon;
                      return (
                        <button
                          key={scenario.key}
                          onClick={() => startScenario(scenario.key)}
                          className="flex items-center gap-3 rounded-xl border border-border p-4 text-left hover:bg-bg-muted hover:shadow-sm transition-all"
                        >
                          <div className={`rounded-lg p-2 ${scenario.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text">
                              {t(`scenarios.${scenario.key}`)}
                            </p>
                            <p className="text-xs text-text-muted">{t("practiceThis")}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  {t("practiceHistory")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { scenario: t("scenarios.coldCall"), score: 72, date: "Feb 19" },
                    { scenario: t("scenarios.objectionHandling"), score: 85, date: "Feb 18" },
                    { scenario: t("scenarios.closing"), score: 68, date: "Feb 17" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text">{item.scenario}</p>
                        <p className="text-xs text-text-muted">{item.date}</p>
                      </div>
                      <Badge
                        variant={item.score >= 80 ? "success" : item.score >= 60 ? "warning" : "destructive"}
                      >
                        {item.score}/100
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveScenario(null);
                setSessionId(null);
              }}
              className="mb-4"
            >
              {t("backToScenarios")}
            </Button>
            <Card className="overflow-hidden">
              <CoachChat
                messages={messages}
                feedback={feedback ?? undefined}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                scenario={t(`scenarios.${activeScenario}`)}
              />
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
