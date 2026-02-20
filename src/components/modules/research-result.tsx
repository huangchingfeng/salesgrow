"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Newspaper, AlertTriangle, MessageCircle, Users, Mail, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchResultProps {
  company: string;
  overview: string;
  industry: string;
  news: string[];
  painPoints: string[];
  icebreakers: string[];
  contacts: { name: string; title: string }[];
  onWriteEmail?: () => void;
  onSave?: () => void;
  className?: string;
}

export function ResearchResult({
  company,
  overview,
  industry,
  news,
  painPoints,
  icebreakers,
  contacts,
  onWriteEmail,
  onSave,
  className,
}: ResearchResultProps) {
  const sections = [
    {
      icon: Building2,
      title: "Company Overview",
      content: (
        <div>
          <Badge variant="secondary" className="mb-2">{industry}</Badge>
          <p className="text-sm text-text-secondary">{overview}</p>
        </div>
      ),
    },
    {
      icon: Newspaper,
      title: "Recent News",
      content: (
        <ul className="space-y-1.5">
          {news.map((item, i) => (
            <li key={i} className="text-sm text-text-secondary flex gap-2">
              <span className="text-primary mt-1">•</span>
              {item}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: AlertTriangle,
      title: "Potential Pain Points",
      content: (
        <div className="flex flex-wrap gap-2">
          {painPoints.map((point, i) => (
            <Badge key={i} variant="warning">{point}</Badge>
          ))}
        </div>
      ),
    },
    {
      icon: MessageCircle,
      title: "Icebreaker Topics",
      content: (
        <ul className="space-y-1.5">
          {icebreakers.map((topic, i) => (
            <li key={i} className="text-sm text-text-secondary flex gap-2">
              <span className="text-success mt-1">💡</span>
              {topic}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: Users,
      title: "Key Contacts",
      content: (
        <div className="space-y-2">
          {contacts.map((contact, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-bg-muted flex items-center justify-center text-xs font-medium text-text-secondary">
                {contact.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-text">{contact.name}</p>
                <p className="text-xs text-text-muted">{contact.title}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-xl">{company}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-text">{section.title}</h4>
              </div>
              {section.content}
            </div>
          );
        })}

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button size="sm" onClick={onWriteEmail} className="flex-1">
            <Mail className="h-4 w-4" />
            Write Email
          </Button>
          <Button size="sm" variant="outline" onClick={onSave}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
