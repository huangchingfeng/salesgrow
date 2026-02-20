"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { TrendingUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleSignUp() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <UserPlus className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-text">
              Check your email
            </h2>
            <p className="text-sm text-text-secondary">
              We sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account.
            </p>
            <Link
              href={`/${locale}/auth/sign-in`}
              className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
            >
              {common("signIn")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold text-primary"
        >
          <TrendingUp className="h-8 w-8" />
          <span>{common("appName")}</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("signUpTitle")}</CardTitle>
            <CardDescription>{common("tagline")}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full mb-6"
              onClick={handleGoogleSignUp}
              type="button"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("google")}
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-card px-2 text-text-muted">
                  {t("orContinueWith")}
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                label={t("email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              <Input
                label={t("password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <Input
                label={t("confirmPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />

              {error && (
                <p className="text-sm text-danger">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                <UserPlus className="h-4 w-4" />
                {loading ? common("loading") : common("signUp")}
              </Button>
            </form>

            {/* Terms */}
            <p className="mt-4 text-center text-xs text-text-muted">
              {t("termsAgree", {
                terms: t("terms"),
                privacy: t("privacy"),
              })}
            </p>

            {/* Links */}
            <div className="mt-4 text-center text-sm text-text-secondary">
              <p>
                {t("hasAccount")}{" "}
                <Link
                  href={`/${locale}/auth/sign-in`}
                  className="font-medium text-primary hover:underline"
                >
                  {common("signIn")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
