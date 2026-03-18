import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const creatorScores = mysqlTable("creator_scores", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companySize: varchar("companySize", { length: 64 }).notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  annualRevenue: varchar("annualRevenue", { length: 64 }),
  estimatedCreatorSpend: varchar("estimatedCreatorSpend", { length: 64 }),
  currentPlatforms: text("currentPlatforms"),
  brandDescription: text("brandDescription"),
  creatorGoals: text("creatorGoals"),
  youtubeHandle: varchar("youtubeHandle", { length: 128 }),
  tiktokHandle: varchar("tiktokHandle", { length: 128 }),
  instagramHandle: varchar("instagramHandle", { length: 128 }),
  instagramFollowers: varchar("instagramFollowers", { length: 64 }),
  instagramEngagementRate: varchar("instagramEngagementRate", { length: 32 }),
  score: float("score"),
  scoreBreakdown: json("scoreBreakdown"),
  topRecommendations: json("topRecommendations"),
  reportSummary: text("reportSummary"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreatorScore = typeof creatorScores.$inferSelect;
export type InsertCreatorScore = typeof creatorScores.$inferInsert;

export const quizResponses = mysqlTable("quiz_responses", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  answers: json("answers").notNull(),
  strategyType: varchar("strategyType", { length: 128 }),
  strategyTitle: text("strategyTitle"),
  strategySummary: text("strategySummary"),
  platformRecommendations: json("platformRecommendations"),
  examples: json("examples"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;
