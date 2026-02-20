"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useUserStore } from "@/lib/stores/user-store";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFromSession, clearUser } = useUserStore();

  useEffect(() => {
    // 初始化：取得目前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setFromSession(session.user);
      }
    });

    // 監聽 auth 狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setFromSession(session.user);
      } else {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [setFromSession, clearUser]);

  return <>{children}</>;
}
