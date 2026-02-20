"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Clock, MessageSquare, Check, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpCardProps {
  clientName: string;
  clientAvatar?: string;
  daysAgo: number;
  suggestedMessage: string;
  stage: string;
  onMarkDone?: () => void;
  onSnooze?: () => void;
  onSendMessage?: () => void;
  className?: string;
}

export function FollowUpCard({
  clientName,
  clientAvatar,
  daysAgo,
  suggestedMessage,
  stage,
  onMarkDone,
  onSnooze,
  onSendMessage,
  className,
}: FollowUpCardProps) {
  const isOverdue = daysAgo > 7;

  return (
    <Card className={cn(isOverdue && "border-danger/30", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={clientName} src={clientAvatar} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-text truncate">{clientName}</h4>
              <Badge variant={isOverdue ? "destructive" : "secondary"}>
                {stage}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
              <Clock className="h-3 w-3" />
              <span>Last contact: {daysAgo} days ago</span>
            </div>

            {/* Suggested message */}
            <div className="rounded-lg bg-bg-muted p-3 mb-3">
              <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Suggested message
              </p>
              <p className="text-sm text-text-secondary">{suggestedMessage}</p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={onSendMessage} className="flex-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Send
              </Button>
              <Button size="sm" variant="outline" onClick={onMarkDone}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onSnooze}>
                <BellOff className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
