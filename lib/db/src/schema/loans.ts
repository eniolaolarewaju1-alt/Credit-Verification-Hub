import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  type: text("type").notNull(), // auto, home, personal, student
  nickname: text("nickname").notNull(),
  originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).notNull(),
  monthlyPayment: numeric("monthly_payment", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 4 }).notNull(),
  nextPaymentDate: text("next_payment_date").notNull(),
  nextPaymentAmount: numeric("next_payment_amount", { precision: 12, scale: 2 }).notNull(),
  termMonths: integer("term_months").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({ id: true, createdAt: true });
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
