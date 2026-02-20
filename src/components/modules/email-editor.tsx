"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailEditorProps {
  subject: string;
  body: string;
  onSubjectChange?: (value: string) => void;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => void;
  className?: string;
}

export function EmailEditor({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  className,
}: EmailEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      {/* Editor */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-text mb-3">Edit</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Subject</label>
            <input
              value={subject}
              onChange={(e) => onSubjectChange?.(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Body</label>
            <Textarea
              value={body}
              onChange={(e) => onBodyChange?.(e.target.value)}
              className="min-h-[300px]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-text mb-3">Preview</h3>
        <div className="rounded-lg border border-border bg-bg-muted p-4">
          <p className="text-sm font-semibold text-text mb-3">
            Subject: {subject}
          </p>
          <div className="border-t border-border pt-3">
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {body}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
