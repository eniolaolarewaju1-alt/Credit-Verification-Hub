import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OtpCode = typeof otpCodesTable.$inferSelect;
