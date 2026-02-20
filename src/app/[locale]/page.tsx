"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Mail,
  Mic,
  Bell,
  Brain,
  Trophy,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const t = useTranslations("landing");
  const common = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="default" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" />
              Free Forever
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl md:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
              {t("hero.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link href={`/${locale}/dashboard`} className={buttonVariants({ size: "lg" })}>
              {t("hero.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("hero.ctaSecondary")}
            </Button>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-sm text-text-muted"
          >
            {t("hero.socialProof", { count: "2,500" })}
          </motion.p>
        </div>

        {/* Background gradient decoration */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-success/10 blur-3xl" />
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-text mb-12">
            {t("features.title")}
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "research", icon: Search, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
              { key: "outreach", icon: Mail, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
              { key: "visitLog", icon: Mic, color: "text-red-500 bg-red-50 dark:bg-red-950" },
              { key: "followUp", icon: Bell, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
              { key: "coach", icon: Brain, color: "text-green-500 bg-green-50 dark:bg-green-950" },
              { key: "gamification", icon: Trophy, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950" },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.key}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className={`inline-flex rounded-lg p-2.5 mb-4 ${feature.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-text mb-2">
                        {t(`features.${feature.key}.title`)}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {t(`features.${feature.key}.description`)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="bg-bg-muted px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-text mb-12">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Sign Up Free", desc: "Create your account in 30 seconds. No credit card needed.", icon: Users },
              { step: "2", title: "Train Daily", desc: "Complete daily tasks, practice with AI coach, earn XP.", icon: Zap },
              { step: "3", title: "Close More Deals", desc: "Use AI research, outreach, and follow-ups to grow your sales.", icon: TrendingUp },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-text mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-text mb-12">
            {t("pricing.title")}
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {(["free", "pro", "team"] as const).map((plan, i) => {
              const isPro = plan === "pro";
              const features = t.raw(`pricing.${plan}.features`) as string[];
              return (
                <motion.div
                  key={plan}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Card
                    className={`h-full ${isPro ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
                  >
                    <CardHeader className="text-center">
                      {isPro && (
                        <Badge className="mx-auto mb-2 w-fit">Most Popular</Badge>
                      )}
                      <CardTitle>{t(`pricing.${plan}.title`)}</CardTitle>
                      <div className="mt-2">
                        <span className="text-4xl font-bold text-text">
                          {t(`pricing.${plan}.price`)}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {t(`pricing.${plan}.period`)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {features.map((feature: string, j: number) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isPro ? "default" : "outline"}
                      >
                        {t(`pricing.${plan}.cta`)}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <section id="cta" className="bg-primary px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-lg text-white/80 mb-8">
            {t("cta.subtitle")}
          </p>
          <Link
            href={`/${locale}/dashboard`}
            className={buttonVariants({ size: "lg", variant: "secondary", className: "bg-white text-primary hover:bg-white/90" })}
          >
            {t("cta.button")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FAQSection() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState<string | null>(null);

  const items = [
    { key: "isFree" },
    { key: "languages" },
    { key: "data" },
    { key: "crm" },
  ];

  return (
    <section id="faq" className="bg-bg-muted px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold text-text mb-12">
          {t("faq.title")}
        </h2>
        <div className="space-y-3">
          {items.map((item) => {
            const isOpen = open === item.key;
            return (
              <Card key={item.key} className="overflow-hidden">
                <button
                  className="flex w-full items-center justify-between p-4 text-left"
                  onClick={() => setOpen(isOpen ? null : item.key)}
                >
                  <span className="text-sm font-medium text-text">
                    {t(`faq.items.${item.key}.q`)}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="text-sm text-text-secondary">
                      {t(`faq.items.${item.key}.a`)}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
