import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, accountsTable, transactionsTable } from "@workspace/db";
import {
  GetAccountsResponse,
  GetAccountParams,
  GetAccountResponse,
  GetAccountSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/accounts", async (_req, res): Promise<void> => {
  const accounts = await db.select().from(accountsTable).orderBy(accountsTable.id);
  res.json(GetAccountsResponse.parse(accounts.map(a => ({
    ...a,
    balance: Number(a.balance),
    availableBalance: Number(a.availableBalance),
    interestRate: Number(a.interestRate),
  }))));
});

router.get("/accounts/summary", async (_req, res): Promise<void> => {
  const accounts = await db.select().from(accountsTable);
  const checking = accounts.find(a => a.type === "checking");
  const savings = accounts.find(a => a.type === "savings");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const allTxns = await db.select().from(transactionsTable);
  const monthTxns = allTxns.filter(t => t.date >= startOfMonth);
  const monthlyDeposits = monthTxns.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const monthlySpending = monthTxns.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  res.json(GetAccountSummaryResponse.parse({
    totalBalance,
    checkingBalance: Number(checking?.balance ?? 0),
    savingsBalance: Number(savings?.balance ?? 0),
    monthlyDeposits,
    monthlySpending,
    accountStatus: "Active",
  }));
});

router.get("/accounts/:accountId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
  const params = GetAccountParams.safeParse({ accountId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, params.data.accountId));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(GetAccountResponse.parse({
    ...account,
    balance: Number(account.balance),
    availableBalance: Number(account.availableBalance),
    interestRate: Number(account.interestRate),
  }));
});

export default router;
