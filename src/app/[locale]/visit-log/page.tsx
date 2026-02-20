"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VoiceRecorder } from "@/components/modules/voice-recorder";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import {
  Mic,
  Keyboard,
  Save,
  Calendar,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";

export default function VisitLogPage() {
  const t = useTranslations("visitLog");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<null | {
    summary: string;
    nextSteps: string[];
    probability: number;
    mood: string;
  }>(null);

  const handleRecordingComplete = async (_blob: Blob) => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setResult({
      summary:
        "Met with Sarah Chen at TechCorp office. Discussed their CRM migration needs and current pain points with their legacy system. They are evaluating 3 vendors including us. Decision expected by end of March.",
      nextSteps: [
        "Send product demo recording by Friday",
        "Schedule technical deep-dive with their IT team",
        "Prepare custom pricing proposal for 500 seats",
      ],
      probability: 65,
      mood: "interested",
    });
    setIsProcessing(false);
  };

  const visitHistory = [
    {
      client: "TechCorp Inc.",
      date: "Feb 19, 2026",
      summary: "Initial discovery meeting. Discussed pain points.",
      probability: 40,
    },
    {
      client: "GlobalTrade",
      date: "Feb 17, 2026",
      summary: "Product demo. Positive feedback on analytics features.",
      probability: 70,
    },
    {
      client: "MediHealth",
      date: "Feb 15, 2026",
      summary: "Follow-up on proposal. Awaiting budget approval.",
      probability: 55,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("newVisit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="voice">
              <TabList>
                <Tab value="voice">
                  <span className="flex items-center gap-1.5">
                    <Mic className="h-4 w-4" />
                    Voice
                  </span>
                </Tab>
                <Tab value="text">
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="h-4 w-4" />
                    Text
                  </span>
                </Tab>
              </TabList>

              <TabPanel value="voice">
                <div className="flex flex-col items-center">
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    isProcessing={isProcessing}
                  />
                </div>
              </TabPanel>

              <TabPanel value="text">
                <div className="space-y-4">
                  <Input label={t("clientName")} placeholder="TechCorp Inc." />
                  <Textarea
                    label="Meeting Notes"
                    placeholder="What happened during the meeting? Key takeaways, decisions, next steps..."
                    className="min-h-[160px]"
                  />
                  <Button>
                    <Save className="h-4 w-4" />
                    {t("save")}
                  </Button>
                </div>
              </TabPanel>
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">{t("summary")}</h4>
                <p className="text-sm text-text-secondary">{result.summary}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text mb-2">{t("nextSteps")}</h4>
                <ul className="space-y-1.5">
                  {result.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-primary font-bold">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-text mb-1">{t("dealProbability")}</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={result.probability} className="w-32" />
                    <span className="text-sm font-medium text-text">{result.probability}%</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text mb-1">{t("mood")}</h4>
                  <Badge variant="success">{t(`moods.${result.mood}`)}</Badge>
                </div>
              </div>
              <Button className="w-full sm:w-auto">
                <Save className="h-4 w-4" />
                {t("save")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Visit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t("history")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visitHistory.map((visit, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-text">{visit.client}</p>
                      <span className="text-xs text-text-muted">{visit.date}</span>
                    </div>
                    <p className="text-sm text-text-secondary truncate">{visit.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-sm font-medium text-text">{visit.probability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
