"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoachChat } from "@/components/modules/coach-chat";
import {
  Phone,
  ShieldAlert,
  Handshake,
  Search,
  DollarSign,
  Brain,
  History,
} from "lucide-react";

const SCENARIOS = [
  { key: "coldCall", icon: Phone, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  { key: "objectionHandling", icon: ShieldAlert, color: "text-red-500 bg-red-50 dark:bg-red-950" },
  { key: "closing", icon: Handshake, color: "text-green-500 bg-green-50 dark:bg-green-950" },
  { key: "needsDiscovery", icon: Search, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  { key: "priceNegotiation", icon: DollarSign, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
];

interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "coach",
    content:
      "Welcome! I'm your AI Sales Coach. I'll play the role of a potential client. Your task is to handle my objection professionally. Ready?",
  },
  {
    id: "2",
    role: "coach",
    content:
      "Scenario: You're calling the VP of Sales at a mid-size SaaS company. They said: 'We already have a CRM solution and we're happy with it. Why should we switch?' Go ahead and respond.",
  },
];

export default function CoachPage() {
  const t = useTranslations("coach");
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const handleSendMessage = async (content: string) => {
    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (messages.length >= 4) {
      // Give feedback after a few exchanges
      setFeedback({
        score: 78,
        strengths: [
          "Good acknowledgment of their current solution",
          "Strong value proposition delivery",
        ],
        improvements: [
          "Ask more discovery questions before pitching",
          "Use a specific case study for credibility",
        ],
        tip: "When facing 'we already have a solution' objection, focus on gaps they might not have considered.",
      });
      setIsLoading(false);
      return;
    }

    const coachMsg = {
      id: crypto.randomUUID(),
      role: "coach" as const,
      content:
        "Interesting approach. But I'm still not convinced. Our current vendor gave us a 20% discount last quarter, and the team is already trained on their platform. Switching costs seem too high. What would you say to that?",
    };
    setMessages((prev) => [...prev, coachMsg]);
    setIsLoading(false);
  };

  const startScenario = (key: string) => {
    setActiveScenario(key);
    setMessages(INITIAL_MESSAGES);
    setFeedback(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        {!activeScenario ? (
          <>
            {/* Scenario selection */}
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
                          <p className="text-xs text-text-muted">Practice this scenario</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Practice History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { scenario: "Cold Call", score: 72, date: "Feb 19" },
                    { scenario: "Objection Handling", score: 85, date: "Feb 18" },
                    { scenario: "Closing", score: 68, date: "Feb 17" },
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
              onClick={() => setActiveScenario(null)}
              className="mb-4"
            >
              ← Back to scenarios
            </Button>
            <Card className="overflow-hidden">
              <CoachChat
                messages={messages}
                feedback={feedback}
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
