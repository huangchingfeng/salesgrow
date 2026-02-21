"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoachChat } from "@/components/modules/coach-chat";
import { useToast } from "@/components/ui/toast";
import { trpc } from "@/lib/trpc";
import { useUserStore } from "@/lib/stores/user-store";
import {
  Phone,
  ShieldAlert,
  Handshake,
  Search,
  DollarSign,
  Brain,
  History,
  RefreshCw,
  Loader2,
  MessageSquare,
} from "lucide-react";

const SCENARIOS = [
  { key: "coldCall", apiKey: "cold_call", icon: Phone, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  { key: "objectionHandling", apiKey: "objection_price", icon: ShieldAlert, color: "text-red-500 bg-red-50 dark:bg-red-950" },
  { key: "closing", apiKey: "closing_assumptive", icon: Handshake, color: "text-green-500 bg-green-50 dark:bg-green-950" },
  { key: "needsDiscovery", apiKey: "needs_discovery", icon: Search, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  { key: "priceNegotiation", apiKey: "negotiation_discount", icon: DollarSign, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
];

// 將 scenario apiKey 對應到顯示用的 translation key
const SCENARIO_API_TO_KEY: Record<string, string> = {};
SCENARIOS.forEach((s) => { SCENARIO_API_TO_KEY[s.apiKey] = s.key; });

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
  const { isAuthenticated } = useUserStore();
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
  // Session config (replaces sessionId for stateless architecture)
  const [sessionConfig, setSessionConfig] = useState<{
    scenario: string;
    locale: string;
    culture: string;
    maxTurns: number;
  } | null>(null);
  // DB session ID (separate from AI session)
  const dbSessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // tRPC mutations for DB persistence (fire-and-forget with error toast)
  const startDbSession = trpc.coach.startSession.useMutation({
    onError: () => toast("Failed to save session.", "error"),
  });
  const sendDbMessage = trpc.coach.sendMessage.useMutation({
    onError: () => toast("Failed to save message.", "error"),
  });
  const endDbSession = trpc.coach.endSession.useMutation({
    onError: () => toast("Failed to save session results.", "error"),
  });
  const addXP = trpc.gamification.addXP.useMutation({
    onError: () => toast("Failed to save XP.", "error"),
  });

  // Practice history from DB
  const historyQuery = trpc.coach.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();

  // 將前端 messages 轉為 API 格式
  const toApiMessages = (msgs: ChatMessage[]) =>
    msgs.map((m) => ({
      role: (m.role === "coach" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    }));

  const startScenario = async (key: string) => {
    const scenario = SCENARIOS.find((s) => s.key === key);
    if (!scenario) return;

    setActiveScenario(key);
    setMessages([]);
    setFeedback(null);
    setIsLoading(true);
    setHasError(false);
    sessionStartTimeRef.current = Date.now();

    // Start DB session + AI call in parallel
    const dbSessionPromise = isAuthenticated
      ? startDbSession.mutateAsync({ scenario: scenario.apiKey }).catch(() => null)
      : Promise.resolve(null);

    try {
      const [dbSession, res] = await Promise.all([
        dbSessionPromise,
        fetch("/api/ai/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            scenario: scenario.apiKey,
            locale,
            culture: "taiwan",
          }),
        }),
      ]);

      if (dbSession) {
        dbSessionIdRef.current = dbSession.id;
      }

      const json = await res.json();
      if (!json.success) {
        toast(json.error?.message || tErr("aiError"), "error");
        setActiveScenario(null);
        setHasError(true);
        return;
      }

      // Store session config for subsequent requests
      setSessionConfig({
        scenario: json.data.scenario,
        locale: json.data.locale,
        culture: json.data.culture,
        maxTurns: json.data.maxTurns,
      });

      const initialMessage = json.data.initialMessage;
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "coach",
          content: initialMessage,
        },
      ]);

      // Save assistant message to DB (dbSessionIdRef is now guaranteed set)
      if (isAuthenticated && dbSessionIdRef.current) {
        sendDbMessage.mutate({
          sessionId: dbSessionIdRef.current,
          role: "assistant",
          content: initialMessage,
        });
      }
    } catch {
      toast(tErr("aiError"), "error");
      setActiveScenario(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionConfig) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Save user message to DB (fire-and-forget)
    if (isAuthenticated && dbSessionIdRef.current) {
      sendDbMessage.mutate({
        sessionId: dbSessionIdRef.current,
        role: "user",
        content,
      });
    }

    try {
      // Use functional update to get the latest messages including the new user message
      const currentMessages = await new Promise<ChatMessage[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev);
          return prev;
        });
      });

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          messages: toApiMessages(currentMessages),
          scenario: sessionConfig.scenario,
          locale: sessionConfig.locale,
          culture: sessionConfig.culture,
          maxTurns: sessionConfig.maxTurns,
          message: content,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        toast(json.error?.message || tErr("aiError"), "error");
        setIsLoading(false);
        return;
      }

      const aiReply = json.data.reply;
      const coachMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "coach",
        content: aiReply,
      };
      setMessages((prev) => [...prev, coachMsg]);

      // Save assistant message to DB (fire-and-forget)
      if (isAuthenticated && dbSessionIdRef.current) {
        sendDbMessage.mutate({
          sessionId: dbSessionIdRef.current,
          role: "assistant",
          content: aiReply,
        });
      }

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
    if (!sessionConfig) return;

    try {
      // Get the latest messages for feedback
      const currentMessages = await new Promise<ChatMessage[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev);
          return prev;
        });
      });

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          messages: toApiMessages(currentMessages),
          scenario: sessionConfig.scenario,
          locale: sessionConfig.locale,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const d = json.data;
        const score = d.totalScore;
        setFeedback({
          score,
          strengths: d.strengths,
          improvements: d.improvements,
          tip: d.encouragement,
        });

        const durationSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);

        // Persist score and feedback to DB
        if (isAuthenticated && dbSessionIdRef.current) {
          const feedbackText = JSON.stringify({
            strengths: d.strengths,
            improvements: d.improvements,
            encouragement: d.encouragement,
          });

          endDbSession.mutate({
            sessionId: dbSessionIdRef.current,
            score,
            feedback: feedbackText,
            durationSeconds,
          });

          // Award XP based on score
          const xpReward = Math.max(10, Math.round(score * 0.5));
          addXP.mutate(
            { amount: xpReward },
            {
              onSuccess: () => {
                toast(`Practice complete! +${xpReward} XP`, "success");
                // Refresh history
                utils.coach.getHistory.invalidate();
              },
            }
          );
        }
      }
    } catch {
      // Feedback is best-effort
    }
  };

  const history = historyQuery.data ?? [];

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
                {!isAuthenticated ? (
                  <p className="text-sm text-text-muted text-center py-4">
                    Sign in to track your practice history.
                  </p>
                ) : historyQuery.isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <MessageSquare className="h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm text-text-muted">
                      No practice sessions yet. Start your first role-play!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => {
                      const scenarioKey = SCENARIO_API_TO_KEY[item.scenario] ?? item.scenario;
                      const displayName = (() => {
                        try { return t(`scenarios.${scenarioKey}`); } catch { return item.scenario; }
                      })();
                      const date = new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });
                      const score = item.score ?? 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-text">{displayName}</p>
                            <p className="text-xs text-text-muted">{date}</p>
                          </div>
                          {item.score != null ? (
                            <Badge
                              variant={score >= 80 ? "success" : score >= 60 ? "warning" : "destructive"}
                            >
                              {score}/100
                            </Badge>
                          ) : (
                            <Badge variant="secondary">--</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                setSessionConfig(null);
                dbSessionIdRef.current = null;
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
