import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billsTable = pgTable("bills", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  payeeName: text("payee_name").notNull(),
  accountNumber: text("account_number").notNull(),
  dueDate: text("due_date").notNull(),
  amountDue: numeric("amount_due", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  autopay: boolean("autopay").notNull().default(false),
  lastPaidDate: text("last_paid_date"),
  lastPaidAmount: numeric("last_paid_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billPaymentsTable = pgTable("bill_payments", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  fromAccountId: integer("from_account_id").notNull(),
  payDate: text("pay_date").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBillSchema = createInsertSchema(billsTable).omit({ id: true, createdAt: true });
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof billsTable.$inferSelect;

export const insertBillPaymentSchema = createInsertSchema(billPaymentsTable).omit({ id: true, createdAt: true });
export type InsertBillPayment = z.infer<typeof insertBillPaymentSchema>;
export type BillPayment = typeof billPaymentsTable.$inferSelect;
