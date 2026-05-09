import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const externalTransfersTable = pgTable("external_transfers", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id").notNull(),
  externalPayeeId: integer("external_payee_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  memo: text("memo").notNull().default(""),
  status: text("status").notNull().default("pending"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExternalTransferSchema = createInsertSchema(externalTransfersTable).omit({ id: true, createdAt: true });
export type InsertExternalTransfer = z.infer<typeof insertExternalTransferSchema>;
export type ExternalTransfer = typeof externalTransfersTable.$inferSelect;
