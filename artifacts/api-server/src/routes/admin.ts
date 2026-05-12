import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, accountsTable, transactionsTable } from "@workspace/db";

const router: IRouter = Router();

// Admin-only: adjust an account balance by a positive or negative delta.
// Atomic SQL arithmetic + matching transaction history entry.
// Protected by the global requireAuth middleware (single-owner portal).
router.post("/admin/adjust-balance", async (req, res): Promise<void> => {
  const { accountId, delta, description } = req.body ?? {};

  if (typeof accountId !== "number" || typeof delta !== "number" || !isFinite(delta) || delta === 0) {
    res.status(400).json({ error: "accountId (number) and non-zero delta (number) are required" });
    return;
  }

  const [acc] = await db.select().from(accountsTable).where(eq(accountsTable.id, accountId));
  if (!acc) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const deltaStr = delta.toFixed(2);
  const absStr = Math.abs(delta).toFixed(2);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const label = (typeof description === "string" && description.trim()) ? description.trim() : "Manual Balance Adjustment";

  const updated = await db.transaction(async (tx) => {
    const [u] = await tx.update(accountsTable).set({
      balance: sql`${accountsTable.balance} + ${deltaStr}`,
      availableBalance: sql`${accountsTable.availableBalance} + ${deltaStr}`,
    }).where(eq(accountsTable.id, accountId)).returning();

    await tx.insert(transactionsTable).values({
      accountId,
      description: label,
      amount: absStr,
      type: delta >= 0 ? "credit" : "debit",
      category: "Adjustment",
      date: today,
      balance: u?.balance ?? "0",
      merchant: null,
    });

    return u;
  });

  res.json({
    accountId,
    nickname: updated?.nickname,
    balance: Number(updated?.balance ?? 0),
    availableBalance: Number(updated?.availableBalance ?? 0),
    delta,
  });
});

export default router;
