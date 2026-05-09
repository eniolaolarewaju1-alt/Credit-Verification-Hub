import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  GetTransactionsQueryParams,
  GetTransactionsResponse,
  GetRecentTransactionsResponse,
} from "@workspace/api-zod";

function toRow(t: typeof transactionsTable.$inferSelect) {
  return {
    ...t,
    amount: Number(t.amount),
    balance: Number(t.balance),
    merchant: t.merchant ?? null,
    disputed: t.disputed,
    disputeReason: t.disputeReason ?? null,
  };
}

const router: IRouter = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const params = GetTransactionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(transactionsTable).$dynamic();
  if (params.data.accountId) {
    query = query.where(eq(transactionsTable.accountId, params.data.accountId));
  }
  query = query.orderBy(desc(transactionsTable.date));
  if (params.data.limit) {
    query = query.limit(params.data.limit);
  }
  if (params.data.offset) {
    query = query.offset(params.data.offset);
  }

  const txns = await query;
  res.json(GetTransactionsResponse.parse(txns.map(toRow)));
});

router.get("/transactions/recent", async (_req, res): Promise<void> => {
  const txns = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.date))
    .limit(10);
  res.json(GetRecentTransactionsResponse.parse(txns.map(toRow)));
});

router.get("/transactions/export", async (req, res): Promise<void> => {
  const params = GetTransactionsQueryParams.safeParse(req.query);
  let query = db.select().from(transactionsTable).$dynamic();
  if (params.success && params.data.accountId) {
    query = query.where(eq(transactionsTable.accountId, params.data.accountId));
  }
  query = query.orderBy(desc(transactionsTable.date));
  const txns = await query;

  const header = "Date,Description,Merchant,Category,Type,Amount,Balance,Disputed\n";
  const rows = txns.map(t => {
    const amt = t.type === "debit" ? `-${t.amount}` : t.amount;
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    const merchant = t.merchant ? `"${t.merchant.replace(/"/g, '""')}"` : "";
    const cat = `"${t.category}"`;
    return [t.date, desc, merchant, cat, t.type, amt, t.balance, t.disputed ? "Yes" : "No"].join(",");
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(header + rows.join("\n"));
});

router.patch("/transactions/:transactionId/dispute", async (req, res): Promise<void> => {
  const id = parseInt(req.params["transactionId"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid transaction ID" });
    return;
  }

  const { reason } = req.body as { reason?: string };
  if (!reason) {
    res.status(400).json({ error: "reason is required" });
    return;
  }

  const [existing] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const [updated] = await db
    .update(transactionsTable)
    .set({ disputed: true, disputeReason: reason })
    .where(eq(transactionsTable.id, id))
    .returning();

  res.json(toRow(updated!));
});

export default router;
