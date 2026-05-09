import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const externalPayeesTable = pgTable("external_payees", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull(),
  recipientName: text("recipient_name").notNull(),
  routingNumber: text("routing_number").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull().default(""),
  accountType: text("account_type").notNull().default("checking"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExternalPayeeSchema = createInsertSchema(externalPayeesTable).omit({ id: true, createdAt: true });
export type InsertExternalPayee = z.infer<typeof insertExternalPayeeSchema>;
export type ExternalPayee = typeof externalPayeesTable.$inferSelect;
