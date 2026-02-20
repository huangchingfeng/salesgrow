"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreRing } from "@/components/ui/score-ring";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
}

interface CoachFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  tip: string;
}

interface CoachChatProps {
  messages: ChatMessage[];
  feedback?: CoachFeedback;
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  scenario?: string;
  className?: string;
}

export function CoachChat({
  messages,
  feedback,
  onSendMessage,
  isLoading = false,
  scenario,
  className,
}: CoachChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage?.(input);
    setInput("");
  };

  return (
    <div className={cn("flex flex-col h-[500px]", className)}>
      {scenario && (
        <div className="px-4 py-2 bg-primary-light text-primary text-sm font-medium rounded-t-lg">
          Scenario: {scenario}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "coach"
                  ? "bg-primary text-white"
                  : "bg-bg-muted text-text-secondary"
              )}
            >
              {msg.role === "coach" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "coach"
                  ? "bg-bg-muted text-text"
                  : "bg-primary text-white"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-bg-muted px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Feedback panel */}
      {feedback && (
        <div className="border-t border-border p-4 bg-bg-muted">
          <div className="flex items-start gap-4">
            <ScoreRing score={feedback.score} size={80} strokeWidth={6} />
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs font-semibold text-success">Strengths</p>
                <ul className="text-xs text-text-secondary">
                  {feedback.strengths.map((s, i) => (
                    <li key={i}>+ {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-warning">Improve</p>
                <ul className="text-xs text-text-secondary">
                  {feedback.improvements.map((s, i) => (
                    <li key={i}>- {s}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-primary italic">💡 {feedback.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
