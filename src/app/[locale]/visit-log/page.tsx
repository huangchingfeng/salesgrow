"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { VoiceRecorder } from "@/components/modules/voice-recorder";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  Mic,
  Keyboard,
  Save,
  TrendingUp,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface VisitResult {
  summary: string;
  nextSteps: { action: string; priority: string }[];
  probability: number;
  mood: string;
}

export default function VisitLogPage() {
  const t = useTranslations("visitLog");
  const tErr = useTranslations("errors");
  const locale = useLocale();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VisitResult | null>(null);
  const [textNotes, setTextNotes] = useState("");
  const [hasError, setHasError] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");

  const summarizeTranscript = async (transcript: string) => {
    setIsProcessing(true);
    setResult(null);
    setHasError(false);
    setLastTranscript(transcript);

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, locale }),
      });

      const json = await res.json();

      if (!json.success) {
        toast(json.error?.message || tErr("aiError"), "error");
        setHasError(true);
        return;
      }

      const data = json.data;
      setResult({
        summary: data.summary,
        nextSteps: data.actionItems.map((a: { action: string; priority: string }) => ({
          action: a.action,
          priority: a.priority,
        })),
        probability: data.closeProbability,
        mood: data.clientReaction,
      });
    } catch {
      toast(tErr("aiError"), "error");
      setHasError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    if (lastTranscript) {
      summarizeTranscript(lastTranscript);
    }
  };

  const handleRecordingComplete = async (_blob: Blob) => {
    // For now, use a placeholder transcript since we don't have speech-to-text yet.
    // In production, this would call a transcription API first.
    const placeholderTranscript =
      "Client meeting discussion about product demo and pricing. They expressed interest in the enterprise plan.";
    await summarizeTranscript(placeholderTranscript);
  };

  const handleTextSubmit = async () => {
    if (!textNotes.trim()) {
      toast(t("clientName"), "error");
      return;
    }
    await summarizeTranscript(textNotes);
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
                    {t("recordVoice")}
                  </span>
                </Tab>
                <Tab value="text">
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="h-4 w-4" />
                    {t("meetingNotes")}
                  </span>
                </Tab>
              </TabList>

              <TabPanel value="voice">
                <div className="flex flex-col items-center">
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    isProcessing={isProcessing}
                    labels={{
                      micDenied: t("micDenied"),
                      processingVoice: t("processingVoice"),
                      tapToStop: t("tapToStop"),
                      tapToStart: t("tapToStart"),
                    }}
                  />
                </div>
              </TabPanel>

              <TabPanel value="text">
                <div className="space-y-4">
                  <Input label={t("clientName")} placeholder="TechCorp Inc." />
                  <Textarea
                    label={t("meetingNotes")}
                    placeholder={t("summary")}
                    className="min-h-[160px]"
                    value={textNotes}
                    onChange={(e) => setTextNotes(e.target.value)}
                  />
                  <Button onClick={handleTextSubmit} disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isProcessing ? t("processing") : t("save")}
                  </Button>
                </div>
              </TabPanel>
            </Tabs>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("processing")}
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {/* Error with retry */}
        {!isProcessing && hasError && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-text-secondary mb-3">{tErr("aiError")}</p>
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {t("save")}
            </Button>
          </div>
        )}

        {/* AI Results */}
        {result && !isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t("aiAnalysis")}
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
                      {step.action}
                      <Badge variant={step.priority === "high" ? "destructive" : step.priority === "medium" ? "warning" : "secondary"} className="ml-auto text-xs">
                        {step.priority}
                      </Badge>
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
                  <Badge variant="success">{result.mood}</Badge>
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
