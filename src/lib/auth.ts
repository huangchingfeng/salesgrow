import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return { url, key };
}

// 公開 client（前端使用）- 延遲初始化，避免 build time 缺少環境變數時報錯
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    if (!_supabase) {
      const { url, key } = getSupabaseConfig();
      _supabase = createBrowserClient(url, key);
    }
    return (_supabase as any)[prop];
  },
});

// 伺服器端 client（帶 cookie auth）
export async function createServerSupabase() {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Server Component 中無法設 cookie，忽略即可
          }
        }
      },
    },
  });
}

// 取得目前登入的使用者
export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    // 從 DB 取得完整 user profile
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      // 第一次登入：建立 user record
      const [newUser] = await db
        .insert(users)
        .values({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatarUrl: user.user_metadata?.avatar_url,
        })
        .onConflictDoNothing()
        .returning();
      return newUser ?? null;
    }

    return dbUser;
  } catch (err) {
    console.error('[getCurrentUser] DB error:', err);
    return null;
  }
}
