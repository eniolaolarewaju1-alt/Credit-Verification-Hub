import { pgTable, serial, boolean, numeric, timestamp } from "drizzle-orm/pg-core";

export const notificationPrefsTable = pgTable("notification_prefs", {
  id: serial("id").primaryKey(),
  loginAlerts: boolean("login_alerts").notNull().default(true),
  transferAlerts: boolean("transfer_alerts").notNull().default(true),
  billPayAlerts: boolean("bill_pay_alerts").notNull().default(true),
  lowBalanceAlerts: boolean("low_balance_alerts").notNull().default(false),
  lowBalanceThreshold: numeric("low_balance_threshold", { precision: 12, scale: 2 }).notNull().default("500"),
  marketingEmails: boolean("marketing_emails").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationPrefs = typeof notificationPrefsTable.$inferSelect;
