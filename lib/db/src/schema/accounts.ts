import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  type: text("type").notNull(), // checking, savings, money_market, cd
  nickname: text("nickname").notNull(),
  maskedNumber: text("masked_number").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  availableBalance: numeric("available_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 4 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accountsTable).omit({ id: true, createdAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;
