import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  type: text("type").notNull(), // debit, credit, prepaid
  maskedNumber: text("masked_number").notNull(),
  cardholderName: text("cardholder_name").notNull(),
  expiryDate: text("expiry_date").notNull(),
  status: text("status").notNull().default("active"), // active, frozen, cancelled
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  availableCredit: numeric("available_credit", { precision: 12, scale: 2 }),
  rewardsPoints: integer("rewards_points"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true, createdAt: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
