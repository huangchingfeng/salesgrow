-- ============================================
-- 修復 RLS：允許 postgres 角色（Drizzle/tRPC 後端）存取資料
-- 在 Supabase SQL Editor 執行此檔案
-- ============================================

-- 確認 postgres 角色可以繞過 RLS（它是 superuser 應該已經可以，但確保一下）
ALTER ROLE postgres BYPASSRLS;

-- 如果上面不夠，為每個 table 新增 postgres 角色的 policy
-- 這些 policy 允許 postgres 角色（後端 Drizzle 連線）完全存取

-- users
DROP POLICY IF EXISTS "server_all_users" ON users;
CREATE POLICY "server_all_users" ON users FOR ALL TO postgres USING (true) WITH CHECK (true);

-- clients
DROP POLICY IF EXISTS "server_all_clients" ON clients;
CREATE POLICY "server_all_clients" ON clients FOR ALL TO postgres USING (true) WITH CHECK (true);

-- outreach_emails
DROP POLICY IF EXISTS "server_all_emails" ON outreach_emails;
CREATE POLICY "server_all_emails" ON outreach_emails FOR ALL TO postgres USING (true) WITH CHECK (true);

-- visit_logs
DROP POLICY IF EXISTS "server_all_visits" ON visit_logs;
CREATE POLICY "server_all_visits" ON visit_logs FOR ALL TO postgres USING (true) WITH CHECK (true);

-- follow_ups
DROP POLICY IF EXISTS "server_all_followups" ON follow_ups;
CREATE POLICY "server_all_followups" ON follow_ups FOR ALL TO postgres USING (true) WITH CHECK (true);

-- ai_interactions
DROP POLICY IF EXISTS "server_all_ai" ON ai_interactions;
CREATE POLICY "server_all_ai" ON ai_interactions FOR ALL TO postgres USING (true) WITH CHECK (true);

-- achievements
DROP POLICY IF EXISTS "server_all_achievements" ON achievements;
CREATE POLICY "server_all_achievements" ON achievements FOR ALL TO postgres USING (true) WITH CHECK (true);

-- daily_tasks
DROP POLICY IF EXISTS "server_all_tasks" ON daily_tasks;
CREATE POLICY "server_all_tasks" ON daily_tasks FOR ALL TO postgres USING (true) WITH CHECK (true);

-- coach_sessions
DROP POLICY IF EXISTS "server_all_coach" ON coach_sessions;
CREATE POLICY "server_all_coach" ON coach_sessions FOR ALL TO postgres USING (true) WITH CHECK (true);

-- leaderboard_entries
DROP POLICY IF EXISTS "server_all_leaderboard" ON leaderboard_entries;
CREATE POLICY "server_all_leaderboard" ON leaderboard_entries FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 驗證：測試查詢
SELECT count(*) as users_count FROM users;
SELECT count(*) as clients_count FROM clients;
