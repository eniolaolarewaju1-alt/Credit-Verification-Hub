import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scheduledTransfersTable = pgTable("scheduled_transfers", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  memo: text("memo"),
  frequency: text("frequency").notNull(), // weekly, biweekly, monthly
  nextDate: text("next_date").notNull(),
  status: text("status").notNull().default("active"), // active, paused, cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScheduledTransferSchema = createInsertSchema(scheduledTransfersTable).omit({ id: true, createdAt: true });
export type InsertScheduledTransfer = z.infer<typeof insertScheduledTransferSchema>;
export type ScheduledTransfer = typeof scheduledTransfersTable.$inferSelect;
