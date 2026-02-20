"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface VoiceRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  isProcessing?: boolean;
  className?: string;
  labels?: {
    micDenied?: string;
    processingVoice?: string;
    tapToStop?: string;
    tapToStart?: string;
  };
}

export function VoiceRecorder({
  onRecordingComplete,
  isProcessing = false,
  className,
  labels,
}: VoiceRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete?.(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast(labels?.micDenied ?? "Microphone access denied. Please allow microphone permission in your browser settings.", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (isProcessing) {
    return (
      <div className={cn("flex flex-col items-center gap-4 py-8", className)}>
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-sm text-text-secondary">{labels?.processingVoice ?? "Processing your voice note..."}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-4 py-8", className)}>
      {isRecording && (
        <>
          {/* Waveform placeholder */}
          <div className="flex items-center gap-0.5 h-12">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-danger animate-pulse"
                style={{
                  height: `${Math.random() * 32 + 8}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
          <p className="text-lg font-mono font-bold text-danger">
            {formatDuration(duration)}
          </p>
        </>
      )}

      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "h-16 w-16 rounded-full",
          !isRecording && "bg-danger hover:bg-danger-hover"
        )}
      >
        {isRecording ? (
          <Square className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>

      <p className="text-sm text-text-muted">
        {isRecording ? (labels?.tapToStop ?? "Tap to stop recording") : (labels?.tapToStart ?? "Tap to start recording")}
      </p>
    </div>
  );
}
