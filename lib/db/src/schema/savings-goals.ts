import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savingsGoalsTable = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  targetDate: text("target_date"),
  color: text("color").notNull().default("#117ACA"),
  icon: text("icon").notNull().default("target"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoalsTable).omit({ id: true, createdAt: true });
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;
