import { sql, eq } from "drizzle-orm";
import { db, accountsTable, transactionsTable } from "@workspace/db";
import { logger } from "./logger";

interface CreditSpec {
  key: string;
  accountId: number;
  delta: number;
  description: string;
}

// One-time credits applied on production server startup. Each credit runs
// at most once across all deploys/restarts thanks to the marker table.
const CREDITS: CreditSpec[] = [
  { key: "savings_plus_20k_2026_05", accountId: 2, delta: 20000, description: "Deposit" },
  { key: "savings_plus_20k_2026_05_b", accountId: 2, delta: 20000, description: "Deposit" },
];

export async function runStartupCredits(): Promise<void> {
  // Only run on the deployed server, not in development.
  if (process.env.NODE_ENV !== "production") return;

  try {
    // Marker table to guarantee idempotency. Stores which credits have been applied.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS startup_credit_log (
        key TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    for (const credit of CREDITS) {
      await db.transaction(async (tx) => {
        // Atomic claim: insert marker; if it already exists, skip.
        const claim = await tx.execute(sql`
          INSERT INTO startup_credit_log (key) VALUES (${credit.key})
          ON CONFLICT (key) DO NOTHING
          RETURNING key
        `);
        if (claim.rowCount === 0) return;

        const deltaStr = credit.delta.toFixed(2);
        const absStr = Math.abs(credit.delta).toFixed(2);
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

        const [updated] = await tx.update(accountsTable).set({
          balance: sql`${accountsTable.balance} + ${deltaStr}`,
          availableBalance: sql`${accountsTable.availableBalance} + ${deltaStr}`,
        }).where(eq(accountsTable.id, credit.accountId)).returning();

        if (!updated) {
          throw new Error(`Startup credit ${credit.key}: account ${credit.accountId} not found`);
        }

        await tx.insert(transactionsTable).values({
          accountId: credit.accountId,
          description: credit.description,
          amount: absStr,
          type: credit.delta >= 0 ? "credit" : "debit",
          category: "Adjustment",
          date: today,
          balance: updated.balance,
          merchant: null,
        });

        logger.info({ key: credit.key, accountId: credit.accountId, delta: credit.delta, newBalance: updated.balance }, "Applied startup credit");
      });
    }
  } catch (err) {
    // Never crash the server boot — just log and continue.
    logger.error({ err }, "Startup credits failed");
  }
}
