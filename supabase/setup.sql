-- ============================================
-- SalesGrow 完整資料庫建表 + RLS
-- 在 Supabase SQL Editor 一次執行
-- ============================================

-- ─── Enums ──────────────────────────────────

DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('free', 'pro', 'team');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pipeline_stage AS ENUM ('lead', 'contacted', 'meeting', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('draft', 'sent', 'replied');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE client_mood AS ENUM ('positive', 'neutral', 'negative', 'interested');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE follow_up_status AS ENUM ('pending', 'done', 'snoozed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE daily_task_status AS ENUM ('pending', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Tables ─────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  name varchar(255),
  avatar_url text,
  locale varchar(10) NOT NULL DEFAULT 'en',
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  streak_last_date date,
  plan plan NOT NULL DEFAULT 'free',
  daily_ai_count integer NOT NULL DEFAULT 0,
  daily_ai_reset_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name varchar(255) NOT NULL,
  website text,
  industry varchar(100),
  research_data jsonb,
  pipeline_stage pipeline_stage NOT NULL DEFAULT 'lead',
  deal_value numeric(12, 2),
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outreach_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subject varchar(500) NOT NULL,
  body text NOT NULL,
  language varchar(10),
  tone varchar(50),
  score integer,
  ai_suggestions jsonb,
  status email_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  audio_url text,
  transcript text,
  summary text,
  next_steps text[],
  deal_probability integer,
  client_mood client_mood,
  visit_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  message_draft text,
  status follow_up_status NOT NULL DEFAULT 'pending',
  priority priority NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type varchar(100) NOT NULL,
  input_text text,
  output_text text,
  model_used varchar(100),
  tokens_input integer,
  tokens_output integer,
  cached boolean DEFAULT false,
  cost_usd numeric(10, 6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id varchar(100) NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type varchar(100) NOT NULL,
  description text NOT NULL,
  target_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  xp_reward integer NOT NULL DEFAULT 10,
  status daily_task_status NOT NULL DEFAULT 'pending',
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario varchar(200) NOT NULL,
  conversation jsonb NOT NULL DEFAULT '[]',
  score integer,
  feedback text,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period varchar(20) NOT NULL,
  xp_total integer NOT NULL DEFAULT 0,
  rank integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS Policies ───────────────────────────

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

-- users
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- clients
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update_own" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_delete_own" ON clients FOR DELETE USING (auth.uid() = user_id);

-- outreach_emails
CREATE POLICY "emails_select_own" ON outreach_emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emails_insert_own" ON outreach_emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "emails_update_own" ON outreach_emails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "emails_delete_own" ON outreach_emails FOR DELETE USING (auth.uid() = user_id);

-- visit_logs
CREATE POLICY "visits_select_own" ON visit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "visits_insert_own" ON visit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "visits_update_own" ON visit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "visits_delete_own" ON visit_logs FOR DELETE USING (auth.uid() = user_id);

-- follow_ups
CREATE POLICY "followups_select_own" ON follow_ups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "followups_insert_own" ON follow_ups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "followups_update_own" ON follow_ups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "followups_delete_own" ON follow_ups FOR DELETE USING (auth.uid() = user_id);

-- ai_interactions
CREATE POLICY "ai_select_own" ON ai_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_insert_own" ON ai_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- achievements
CREATE POLICY "achievements_select_own" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "achievements_insert_own" ON achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- daily_tasks
CREATE POLICY "tasks_select_own" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON daily_tasks FOR UPDATE USING (auth.uid() = user_id);

-- coach_sessions
CREATE POLICY "coach_select_own" ON coach_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coach_insert_own" ON coach_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_update_own" ON coach_sessions FOR UPDATE USING (auth.uid() = user_id);

-- leaderboard_entries (排行榜所有人可看)
CREATE POLICY "leaderboard_select_all" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "leaderboard_insert_own" ON leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leaderboard_update_own" ON leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);
