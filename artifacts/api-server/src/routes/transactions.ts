import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  GetTransactionsQueryParams,
  GetTransactionsResponse,
  GetRecentTransactionsResponse,
} from "@workspace/api-zod";

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
  res.json(GetTransactionsResponse.parse(txns.map(t => ({
    ...t,
    amount: Number(t.amount),
    balance: Number(t.balance),
    merchant: t.merchant ?? null,
  }))));
});

router.get("/transactions/recent", async (_req, res): Promise<void> => {
  const txns = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.date))
    .limit(10);
  res.json(GetRecentTransactionsResponse.parse(txns.map(t => ({
    ...t,
    amount: Number(t.amount),
    balance: Number(t.balance),
    merchant: t.merchant ?? null,
  }))));
});

export default router;
