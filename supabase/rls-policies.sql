-- ============================================
-- SalesGrow RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- ─── users ──────────────────────────────────
-- 使用者只能看到和修改自己的 profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ─── clients ────────────────────────────────
CREATE POLICY "clients_select_own" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clients_delete_own" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- ─── outreach_emails ────────────────────────
CREATE POLICY "emails_select_own" ON outreach_emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "emails_insert_own" ON outreach_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_update_own" ON outreach_emails
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "emails_delete_own" ON outreach_emails
  FOR DELETE USING (auth.uid() = user_id);

-- ─── visit_logs ─────────────────────────────
CREATE POLICY "visits_select_own" ON visit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "visits_insert_own" ON visit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visits_update_own" ON visit_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "visits_delete_own" ON visit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ─── follow_ups ─────────────────────────────
CREATE POLICY "followups_select_own" ON follow_ups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "followups_insert_own" ON follow_ups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "followups_update_own" ON follow_ups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "followups_delete_own" ON follow_ups
  FOR DELETE USING (auth.uid() = user_id);

-- ─── ai_interactions ────────────────────────
CREATE POLICY "ai_select_own" ON ai_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_insert_own" ON ai_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── achievements ───────────────────────────
CREATE POLICY "achievements_select_own" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "achievements_insert_own" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── daily_tasks ────────────────────────────
CREATE POLICY "tasks_select_own" ON daily_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own" ON daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own" ON daily_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── coach_sessions ─────────────────────────
CREATE POLICY "coach_select_own" ON coach_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "coach_insert_own" ON coach_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_update_own" ON coach_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── leaderboard_entries ────────────────────
-- 排行榜大家都可以看，但只能新增/修改自己的
CREATE POLICY "leaderboard_select_all" ON leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "leaderboard_insert_own" ON leaderboard_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leaderboard_update_own" ON leaderboard_entries
  FOR UPDATE USING (auth.uid() = user_id);
