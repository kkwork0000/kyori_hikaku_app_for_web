import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userUsage = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  month: text("month").notNull(), // Format: "MM_YYYY"
  usageCount: integer("usage_count").notNull().default(0),
  lastUsed: timestamp("last_used").defaultNow(),
});

export const distanceQuery = pgTable("distance_query", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  origin: text("origin").notNull(),
  destinations: text("destinations").array().notNull(),
  travelMode: text("travel_mode").notNull(),
  results: text("results"), // JSON string of results
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUserUsageSchema = createInsertSchema(userUsage).omit({
  id: true,
  lastUsed: true,
});

export const insertDistanceQuerySchema = createInsertSchema(distanceQuery).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserUsage = z.infer<typeof insertUserUsageSchema>;
export type UserUsage = typeof userUsage.$inferSelect;
export type InsertDistanceQuery = z.infer<typeof insertDistanceQuerySchema>;
export type DistanceQuery = typeof distanceQuery.$inferSelect;
