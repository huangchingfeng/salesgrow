import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────

export const planEnum = pgEnum('plan', ['free', 'pro', 'team']);

export const pipelineStageEnum = pgEnum('pipeline_stage', [
  'lead',
  'contacted',
  'meeting',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
]);

export const emailStatusEnum = pgEnum('email_status', [
  'draft',
  'sent',
  'replied',
]);

export const clientMoodEnum = pgEnum('client_mood', [
  'positive',
  'neutral',
  'negative',
  'interested',
  'mixed',
]);

export const followUpStatusEnum = pgEnum('follow_up_status', [
  'pending',
  'done',
  'snoozed',
]);

export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);

export const dailyTaskStatusEnum = pgEnum('daily_task_status', [
  'pending',
  'completed',
  'skipped',
]);

// ─── Tables ──────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  locale: varchar('locale', { length: 10 }).notNull().default('en'),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  streakDays: integer('streak_days').notNull().default(0),
  streakLastDate: date('streak_last_date'),
  plan: planEnum('plan').notNull().default('free'),
  dailyAiCount: integer('daily_ai_count').notNull().default(0),
  dailyAiResetAt: timestamp('daily_ai_reset_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  website: text('website'),
  industry: varchar('industry', { length: 100 }),
  researchData: jsonb('research_data'),
  pipelineStage: pipelineStageEnum('pipeline_stage').notNull().default('lead'),
  dealValue: numeric('deal_value', { precision: 12, scale: 2 }),
  lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
  nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const outreachEmails = pgTable('outreach_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  language: varchar('language', { length: 10 }),
  tone: varchar('tone', { length: 50 }),
  score: integer('score'),
  aiSuggestions: jsonb('ai_suggestions'),
  status: emailStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const visitLogs = pgTable('visit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  audioUrl: text('audio_url'),
  transcript: text('transcript'),
  summary: text('summary'),
  nextSteps: text('next_steps').array(),
  dealProbability: integer('deal_probability'),
  clientMood: clientMoodEnum('client_mood'),
  visitDate: date('visit_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const followUps = pgTable('follow_ups', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  dueDate: date('due_date').notNull(),
  messageDraft: text('message_draft'),
  status: followUpStatusEnum('status').notNull().default('pending'),
  priority: priorityEnum('priority').notNull().default('medium'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const aiInteractions = pgTable('ai_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  interactionType: varchar('interaction_type', { length: 100 }).notNull(),
  inputText: text('input_text'),
  outputText: text('output_text'),
  modelUsed: varchar('model_used', { length: 100 }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  cached: boolean('cached').default(false),
  costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: varchar('badge_id', { length: 100 }).notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dailyTasks = pgTable('daily_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskType: varchar('task_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  targetClientId: uuid('target_client_id').references(() => clients.id, { onDelete: 'set null' }),
  xpReward: integer('xp_reward').notNull().default(10),
  status: dailyTaskStatusEnum('status').notNull().default('pending'),
  date: date('date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const coachSessions = pgTable('coach_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scenario: varchar('scenario', { length: 200 }).notNull(),
  conversation: jsonb('conversation').notNull().default([]),
  score: integer('score'),
  feedback: text('feedback'),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  period: varchar('period', { length: 20 }).notNull(),
  xpTotal: integer('xp_total').notNull().default(0),
  rank: integer('rank'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const salesProfiles = pgTable('sales_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  jobTitle: varchar('job_title', { length: 100 }),
  companyName: varchar('company_name', { length: 255 }),
  companyDescription: text('company_description'),
  productsServices: text('products_services'),
  industry: varchar('industry', { length: 100 }),
  targetAudience: text('target_audience'),
  uniqueSellingPoints: text('unique_selling_points'),
  yearsExperience: integer('years_experience'),
  communicationStyle: varchar('communication_style', { length: 50 }),
  personalBio: text('personal_bio'),
  phone: varchar('phone', { length: 50 }),
  lineId: varchar('line_id', { length: 100 }),
  linkedinUrl: text('linkedin_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ───────────────────────────────────────────

export const salesProfilesRelations = relations(salesProfiles, ({ one }) => ({
  user: one(users, { fields: [salesProfiles.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  salesProfile: one(salesProfiles),
  clients: many(clients),
  outreachEmails: many(outreachEmails),
  visitLogs: many(visitLogs),
  followUps: many(followUps),
  aiInteractions: many(aiInteractions),
  achievements: many(achievements),
  dailyTasks: many(dailyTasks),
  coachSessions: many(coachSessions),
  leaderboardEntries: many(leaderboardEntries),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  outreachEmails: many(outreachEmails),
  visitLogs: many(visitLogs),
  followUps: many(followUps),
  dailyTasks: many(dailyTasks),
}));

export const outreachEmailsRelations = relations(outreachEmails, ({ one }) => ({
  user: one(users, { fields: [outreachEmails.userId], references: [users.id] }),
  client: one(clients, { fields: [outreachEmails.clientId], references: [clients.id] }),
}));

export const visitLogsRelations = relations(visitLogs, ({ one }) => ({
  user: one(users, { fields: [visitLogs.userId], references: [users.id] }),
  client: one(clients, { fields: [visitLogs.clientId], references: [clients.id] }),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  user: one(users, { fields: [followUps.userId], references: [users.id] }),
  client: one(clients, { fields: [followUps.clientId], references: [clients.id] }),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  user: one(users, { fields: [aiInteractions.userId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
  user: one(users, { fields: [dailyTasks.userId], references: [users.id] }),
  targetClient: one(clients, { fields: [dailyTasks.targetClientId], references: [clients.id] }),
}));

export const coachSessionsRelations = relations(coachSessions, ({ one }) => ({
  user: one(users, { fields: [coachSessions.userId], references: [users.id] }),
}));

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  user: one(users, { fields: [leaderboardEntries.userId], references: [users.id] }),
}));

// ─── Type exports ────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type OutreachEmail = typeof outreachEmails.$inferSelect;
export type NewOutreachEmail = typeof outreachEmails.$inferInsert;
export type VisitLog = typeof visitLogs.$inferSelect;
export type NewVisitLog = typeof visitLogs.$inferInsert;
export type FollowUp = typeof followUps.$inferSelect;
export type NewFollowUp = typeof followUps.$inferInsert;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type NewAiInteraction = typeof aiInteractions.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type NewDailyTask = typeof dailyTasks.$inferInsert;
export type CoachSession = typeof coachSessions.$inferSelect;
export type NewCoachSession = typeof coachSessions.$inferInsert;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboardEntries.$inferInsert;
export type SalesProfile = typeof salesProfiles.$inferSelect;
export type NewSalesProfile = typeof salesProfiles.$inferInsert;
