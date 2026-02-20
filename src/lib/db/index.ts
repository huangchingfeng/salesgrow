import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 延遲初始化，避免 build time 缺少環境變數時報錯
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  const isPooler = connectionString.includes('pooler.supabase.com');
  const queryClient = postgres(connectionString, {
    max: 1, // serverless：每個 function instance 用一個連線
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: isPooler ? false : true, // pooler 不支援 prepared statements
  });
  return drizzle(queryClient, { schema });
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as any)[prop];
  },
});

export type DB = ReturnType<typeof createDb>;
