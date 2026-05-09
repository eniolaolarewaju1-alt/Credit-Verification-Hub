import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, transfersTable, accountsTable } from "@workspace/db";
import { GetTransfersResponse, CreateTransferBody } from "@workspace/api-zod";
import { sendTransferAlert } from "../lib/email";

const router: IRouter = Router();

router.get("/transfers", async (_req, res): Promise<void> => {
  const transfers = await db.select().from(transfersTable).orderBy(desc(transfersTable.date));
  res.json(GetTransfersResponse.parse(transfers.map(t => ({ ...t, amount: Number(t.amount) }))));
});

router.post("/transfers", async (req, res): Promise<void> => {
  const parsed = CreateTransferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fromAccountId, toAccountId, amount, memo } = parsed.data;

  const [fromAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, fromAccountId));
  const [toAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, toAccountId));

  if (!fromAcc || !toAcc) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (Number(fromAcc.availableBalance) < amount) {
    res.status(400).json({ error: `Insufficient funds. Available: $${Number(fromAcc.availableBalance).toFixed(2)}` });
    return;
  }

  await db.update(accountsTable).set({
    balance: String((Number(fromAcc.balance) - amount).toFixed(2)),
    availableBalance: String((Number(fromAcc.availableBalance) - amount).toFixed(2)),
  }).where(eq(accountsTable.id, fromAccountId));

  await db.update(accountsTable).set({
    balance: String((Number(toAcc.balance) + amount).toFixed(2)),
    availableBalance: String((Number(toAcc.availableBalance) + amount).toFixed(2)),
  }).where(eq(accountsTable.id, toAccountId));

  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" }).split("/").reverse().join("-");

  const [transfer] = await db.insert(transfersTable).values({
    fromAccountId,
    toAccountId,
    amount: String(amount.toFixed(2)),
    date: today,
    status: "completed",
    memo: memo ?? "",
  }).returning();

  void sendTransferAlert({
    type: "internal",
    fromAccount: `${fromAcc.nickname} (...${fromAcc.maskedNumber})`,
    toAccount: `${toAcc.nickname} (...${toAcc.maskedNumber})`,
    amount,
    memo,
    status: "completed",
  });

  res.status(201).json({ ...transfer, amount: Number(transfer.amount) });
});

export default router;
