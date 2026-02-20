import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// 延遲初始化，避免 build time 缺少環境變數時報錯
let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return { url, key };
}

// 公開 client（前端使用）
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_supabase) {
      const { url, key } = getSupabaseConfig();
      _supabase = createClient(url, key);
    }
    return (_supabase as any)[prop];
  },
});

// 伺服器端 client（帶 cookie auth）
export async function createServerSupabase() {
  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

// 取得目前登入的使用者
export async function getCurrentUser() {
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
      .returning();
    return newUser;
  }

  return dbUser;
}
