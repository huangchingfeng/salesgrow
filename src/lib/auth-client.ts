import { createBrowserClient } from '@supabase/ssr';

// 前端使用的 Supabase client — 延遲初始化，避免 build time 缺少環境變數
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error('Supabase env vars not set');
      _supabase = createBrowserClient(url, key);
    }
    return (_supabase as any)[prop];
  },
});
