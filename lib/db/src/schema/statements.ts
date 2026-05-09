import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const statementsTable = pgTable("statements", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  period: text("period").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).notNull(),
  closingBalance: numeric("closing_balance", { precision: 12, scale: 2 }).notNull(),
  totalCredits: numeric("total_credits", { precision: 12, scale: 2 }).notNull(),
  totalDebits: numeric("total_debits", { precision: 12, scale: 2 }).notNull(),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStatementSchema = createInsertSchema(statementsTable).omit({ id: true, createdAt: true });
export type InsertStatement = z.infer<typeof insertStatementSchema>;
export type Statement = typeof statementsTable.$inferSelect;
