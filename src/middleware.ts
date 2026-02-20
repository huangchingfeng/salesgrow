import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// 需要登入才能訪問的路徑
const protectedPaths = [
  "/dashboard",
  "/research",
  "/outreach",
  "/visit-log",
  "/follow-up",
  "/coach",
  "/leaderboard",
  "/learning",
  "/settings",
];

function isProtectedPath(pathname: string): boolean {
  // 移除 locale prefix 後檢查
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");
  return protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  // 先執行 intl middleware 處理 locale 路由
  const response = intlMiddleware(request);

  // 檢查是否需要 auth 保護
  if (isProtectedPath(request.nextUrl.pathname)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // 從 pathname 取得 locale
      const localeMatch = request.nextUrl.pathname.match(/^\/([a-z]{2}(-[A-Z]{2})?)/);
      const locale = localeMatch ? localeMatch[1] : "en";
      const signInUrl = new URL(`/${locale}/auth/sign-in`, request.url);
      signInUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
