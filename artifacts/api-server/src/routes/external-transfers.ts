import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, externalTransfersTable, externalPayeesTable, accountsTable } from "@workspace/db";
import { sendTransferAlert } from "../lib/email";

const router: IRouter = Router();

router.get("/external-transfers", async (_req, res): Promise<void> => {
  const transfers = await db
    .select()
    .from(externalTransfersTable)
    .orderBy(desc(externalTransfersTable.createdAt));

  res.json(transfers.map(t => ({
    ...t,
    amount: Number(t.amount),
    createdAt: t.createdAt.toISOString(),
  })));
});

router.post("/external-transfers", async (req, res): Promise<void> => {
  const { fromAccountId, externalPayeeId, amount, memo } = req.body as {
    fromAccountId?: number;
    externalPayeeId?: number;
    amount?: number;
    memo?: string;
  };

  if (!fromAccountId || !externalPayeeId || !amount || amount <= 0) {
    res.status(400).json({ error: "fromAccountId, externalPayeeId, and a positive amount are required" });
    return;
  }

  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, fromAccountId));
  if (!account) {
    res.status(404).json({ error: "Source account not found" });
    return;
  }

  const available = Number(account.availableBalance);
  if (amount > available) {
    res.status(400).json({ error: `Insufficient funds. Available balance: $${available.toFixed(2)}` });
    return;
  }

  const [payee] = await db.select().from(externalPayeesTable).where(eq(externalPayeesTable.id, externalPayeeId));
  if (!payee) {
    res.status(404).json({ error: "Payee not found" });
    return;
  }

  const newBalance = available - amount;
  await db.update(accountsTable).set({
    availableBalance: String(newBalance.toFixed(2)),
    balance: String((Number(account.balance) - amount).toFixed(2)),
  }).where(eq(accountsTable.id, fromAccountId));

  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" }).split("/").reverse().join("-");
  const [transfer] = await db.insert(externalTransfersTable).values({
    fromAccountId,
    externalPayeeId,
    amount: String(amount.toFixed(2)),
    memo: memo ?? "",
    status: "processing",
    date: today,
  }).returning();

  void sendTransferAlert({
    type: "external",
    fromAccount: `${account.nickname} (...${account.maskedNumber})`,
    toAccount: `${payee.recipientName} at ${payee.bankName}`,
    amount,
    memo,
    status: "processing",
  });

  res.status(201).json({
    ...transfer,
    amount: Number(transfer.amount),
    createdAt: transfer.createdAt.toISOString(),
  });
});

export default router;
