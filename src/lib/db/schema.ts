import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  mode: text("mode").notNull(),
  topic: text("topic"),
  difficulty: text("difficulty").notNull().default("medium"),
  questionCount: integer("question_count").notNull().default(5),
  duration: integer("duration"),
  status: text("status").notNull().default("in_progress"),
  sessionToken: text("session_token").notNull(),
  startedAt: text("started_at").notNull().default("CURRENT_TIMESTAMP"),
  completedAt: text("completed_at"),
  overallScore: real("overall_score"),
  summary: text("summary"),
});

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  questions: many(questions),
  evaluations: many(evaluations),
}));

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  sequenceNumber: integer("sequence_number").notNull(),
  questionText: text("question_text").notNull(),
  type: text("type").notNull().default("opening"),
  skillCategory: text("skill_category"),
  difficulty: text("difficulty"),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  session: one(sessions, { fields: [questions.sessionId], references: [sessions.id] }),
  answers: many(answers),
  evaluations: many(evaluations),
}));

export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  startedAt: text("started_at"),
  submittedAt: text("submitted_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}));

export const evaluations = sqliteTable("evaluations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  questionId: text("question_id").references(() => questions.id),
  score: real("score"),
  feedbackJson: text("feedback_json"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  skillsAssessed: text("skills_assessed"),
});

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  session: one(sessions, { fields: [evaluations.sessionId], references: [sessions.id] }),
  question: one(questions, { fields: [evaluations.questionId], references: [questions.id] }),
}));
