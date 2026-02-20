"use client";

import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Play,
  Clock,
  Star,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

const COURSES = [
  { key: "coldEmail", lessons: 12, completedLessons: 8, duration: "3h", level: "beginner" },
  { key: "objectionHandling", lessons: 8, completedLessons: 3, duration: "2h", level: "intermediate" },
  { key: "closingTechniques", lessons: 10, completedLessons: 0, duration: "2.5h", level: "advanced" },
  { key: "needsDiscovery", lessons: 6, completedLessons: 0, duration: "1.5h", level: "beginner" },
  { key: "followUpStrategy", lessons: 8, completedLessons: 0, duration: "2h", level: "intermediate" },
  { key: "socialSelling", lessons: 7, completedLessons: 0, duration: "1.5h", level: "advanced" },
];

const ARTICLES = [
  { key: "coldEmail", source: "SalesGrow Blog", readTime: 5 },
  { key: "objectionHandling", source: "Harvard Business Review", readTime: 8 },
  { key: "closingTechniques", source: "SalesGrow Blog", readTime: 6 },
];

export default function LearningPage() {
  const t = useTranslations("learning");

  const levelBadgeVariant = (level: string) =>
    level === "beginner" ? "success" : level === "intermediate" ? "warning" : "default";

  const inProgress = COURSES.filter((c) => c.completedLessons > 0).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <Badge variant="default" className="gap-1">
            <GraduationCap className="h-3 w-3" />
            {inProgress} courses in progress
          </Badge>
        </div>

        {/* About the methodology */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary-light to-bg-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary p-3">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text mb-2">
                  The SalesGrow Method
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  {t("subtitle")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Research First", "Personalize Everything", "Follow Up Fast", "Always Be Learning"].map((principle) => (
                    <Badge key={principle} variant="secondary">
                      {principle}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {["all", "prospecting", "negotiation", "closing", "communication"].map((cat) => (
            <Badge key={cat} variant={cat === "all" ? "default" : "secondary"} className="cursor-pointer">
              {t(`categories.${cat}`)}
            </Badge>
          ))}
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Courses
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {COURSES.map((course) => {
              const progress = (course.completedLessons / course.lessons) * 100;
              return (
                <Card
                  key={course.key}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-text">
                          {t(`articles.${course.key}.title`)}
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {t(`articles.${course.key}.description`)}
                        </p>
                      </div>
                      <Badge variant={levelBadgeVariant(course.level)}>
                        {course.level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {course.lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-1" size="sm" />
                      <span className="text-xs font-medium text-text-secondary">
                        {course.completedLessons}/{course.lessons}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recommended Reading */}
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">
            Recommended Reading
          </h2>
          <div className="space-y-3">
            {ARTICLES.map((article) => (
              <Card
                key={article.key}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {t(`articles.${article.key}.title`)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                      <span>{article.source}</span>
                      <span>-</span>
                      <span>{t("readTime", { min: article.readTime })}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-text-muted shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
