"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { VoiceRecorder } from "@/components/modules/voice-recorder";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { trpc } from "@/lib/trpc";
import { useUserStore } from "@/lib/stores/user-store";
import {
  Mic,
  Keyboard,
  Save,
  TrendingUp,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Inbox,
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
  const { isAuthenticated } = useUserStore();
  const utils = trpc.useUtils();

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VisitResult | null>(null);
  const [textNotes, setTextNotes] = useState("");
  const [hasError, setHasError] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- Web Speech API for live transcription ---
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    const SR = typeof window !== "undefined"
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    if (!SR) setSpeechSupported(false);
  }, []);

  const startSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    const langMap: Record<string, string> = {
      "zh-TW": "zh-TW", "zh-CN": "zh-CN", "ja": "ja-JP",
      "ko": "ko-KR", "th": "th-TH", "vi": "vi-VN",
      "ms": "ms-MY", "id": "id-ID",
    };
    recognition.lang = langMap[locale] || "en-US";

    let finalText = "";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setLiveTranscript(finalText + interim);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setLiveTranscript("");
  }, [locale]);

  const stopSpeechRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // --- tRPC queries ---
  const clientsQuery = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const visitHistoryQuery = trpc.visitLog.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createVisitLog = trpc.visitLog.create.useMutation({
    onSuccess: () => {
      toast(t("saveSuccess"), "success");
      utils.visitLog.list.invalidate();
      setResult(null);
      setTextNotes("");
      setLiveTranscript("");
      setSelectedClientId("");
      setIsSaving(false);
    },
    onError: (err) => {
      toast(err.message || tErr("aiError"), "error");
      setIsSaving(false);
    },
  });

  const clientOptions = (clientsQuery.data ?? []).map((c) => ({
    value: c.id,
    label: c.companyName,
  }));

  // 用 clientId 反查 client 名稱
  const clientNameMap = new Map(
    (clientsQuery.data ?? []).map((c) => [c.id, c.companyName])
  );

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
    // 如果有 live transcript 就用它，否則 fallback 到手動輸入提示
    if (liveTranscript.trim()) {
      await summarizeTranscript(liveTranscript.trim());
    } else {
      toast(t("noSpeechDetected"), "error");
    }
  };

  const handleTextSubmit = async () => {
    if (!textNotes.trim()) {
      toast(t("notesRequired"), "error");
      return;
    }
    await summarizeTranscript(textNotes);
  };

  const handleSaveVisit = () => {
    if (!selectedClientId) {
      toast(t("selectClientFirst"), "error");
      return;
    }
    if (!result) return;

    setIsSaving(true);
    createVisitLog.mutate({
      clientId: selectedClientId,
      transcript: lastTranscript || undefined,
      summary: result.summary || undefined,
      nextSteps: result.nextSteps.map((s) => s.action),
      dealProbability: result.probability,
      clientMood: (result.mood.toLowerCase() as "positive" | "neutral" | "negative" | "interested" | "mixed") || undefined,
      visitDate: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("newVisit")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Client selector */}
            {isAuthenticated && (
              <div className="mb-4">
                {clientsQuery.isLoading ? (
                  <Skeleton className="h-10 w-full rounded-lg" />
                ) : (
                  <Select
                    label={t("clientName")}
                    placeholder={t("selectClient")}
                    options={clientOptions}
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  />
                )}
              </div>
            )}

            <Tabs defaultValue={speechSupported ? "voice" : "text"}>
              <TabList>
                {speechSupported && (
                  <Tab value="voice">
                    <span className="flex items-center gap-1.5">
                      <Mic className="h-4 w-4" />
                      {t("recordVoice")}
                    </span>
                  </Tab>
                )}
                <Tab value="text">
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="h-4 w-4" />
                    {t("meetingNotes")}
                  </span>
                </Tab>
              </TabList>

              {speechSupported && (
                <TabPanel value="voice">
                  <div className="flex flex-col items-center">
                    <VoiceRecorder
                      onRecordingComplete={handleRecordingComplete}
                      onRecordingStart={startSpeechRecognition}
                      onRecordingStop={stopSpeechRecognition}
                      isProcessing={isProcessing}
                      labels={{
                        micDenied: t("micDenied"),
                        processingVoice: t("processingVoice"),
                        tapToStop: t("tapToStop"),
                        tapToStart: t("tapToStart"),
                      }}
                    />
                    {/* Live transcript display */}
                    {liveTranscript && (
                      <div className="mt-3 w-full rounded-lg bg-bg-muted p-3">
                        <p className="text-xs text-text-muted mb-1">{t("liveTranscript")}</p>
                        <p className="text-sm text-text-secondary">{liveTranscript}</p>
                      </div>
                    )}
                  </div>
                </TabPanel>
              )}

              <TabPanel value="text">
                <div className="space-y-4">
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
              {t("retry")}
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
                        {t(`priorities.${step.priority}`)}
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
                  <Badge variant="success">{t(`moods.${result.mood}`) || result.mood}</Badge>
                </div>
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={handleSaveVisit}
                disabled={isSaving || !selectedClientId}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? t("processing") : t("save")}
              </Button>
              {!selectedClientId && (
                <p className="text-xs text-danger">{t("selectClientFirst")}</p>
              )}
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
            {!isAuthenticated ? (
              <div className="rounded-lg border border-primary/30 bg-primary-light p-3 text-center text-sm text-primary">
                {t("demoDataNotice")}
              </div>
            ) : visitHistoryQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !visitHistoryQuery.data?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-secondary">
                  {t("emptyHistory")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitHistoryQuery.data.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-text">
                          {clientNameMap.get(visit.clientId) ?? t("unknownClient")}
                        </p>
                        <span className="text-xs text-text-muted">{visit.visitDate}</span>
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {visit.summary ?? t("noSummary")}
                      </p>
                    </div>
                    {visit.dealProbability != null && (
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-success" />
                          <span className="text-sm font-medium text-text">
                            {visit.dealProbability}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
