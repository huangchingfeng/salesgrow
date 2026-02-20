"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInPrompt() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <LogIn className="h-12 w-12 text-text-muted" />
      <h2 className="text-lg font-semibold text-text">
        {t("signInRequired")}
      </h2>
      <p className="text-sm text-text-muted">
        {t("signInDescription")}
      </p>
      <Button onClick={() => router.push(`/${locale}/auth/sign-in`)}>
        {t("signIn")}
      </Button>
    </div>
  );
}
