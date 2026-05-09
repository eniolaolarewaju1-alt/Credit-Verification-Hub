import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, transfersTable, accountsTable, transactionsTable } from "@workspace/db";
import { GetTransfersResponse, CreateTransferBody, GetTransferReceiptResponse } from "@workspace/api-zod";
import { sendTransferConfirmation, sendTransferReversalEmail } from "../lib/email";

const router: IRouter = Router();

function generateRef(): string {
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }).replace(/-/g, "");
  const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
  return `HCU-${date}-${hex}`;
}

async function scheduleReversal(transferId: number, amount: number, fromAccountId: number, toAccountId: number, referenceNumber: string, fromName: string, toName: string, memo: string) {
  setTimeout(async () => {
    try {
      const [fromAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, fromAccountId));
      const [toAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, toAccountId));
      if (!fromAcc || !toAcc) return;

      // Restore from account balance
      await db.update(accountsTable).set({
        balance: String((Number(fromAcc.balance) + amount).toFixed(2)),
        availableBalance: String((Number(fromAcc.availableBalance) + amount).toFixed(2)),
      }).where(eq(accountsTable.id, fromAccountId));

      // Deduct from to account
      await db.update(accountsTable).set({
        balance: String((Number(toAcc.balance) - amount).toFixed(2)),
        availableBalance: String((Number(toAcc.availableBalance) - amount).toFixed(2)),
      }).where(eq(accountsTable.id, toAccountId));

      const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      const [updatedFrom] = await db.select().from(accountsTable).where(eq(accountsTable.id, fromAccountId));

      // Insert refund credit transaction
      await db.insert(transactionsTable).values({
        accountId: fromAccountId,
        description: `Transfer Refund — Ref ${referenceNumber}`,
        amount: String(amount.toFixed(2)),
        type: "credit",
        category: "Transfer",
        date: today,
        balance: updatedFrom?.balance ?? "0",
        merchant: null,
      });

      // Mark transfer reversed
      await db.update(transfersTable).set({
        status: "reversed",
        reversedAt: new Date(),
      }).where(eq(transfersTable.id, transferId));

      void sendTransferReversalEmail({
        referenceNumber,
        fromAccount: fromName,
        toAccount: toName,
        amount,
        memo,
      });
    } catch (err) {
      console.error("Reversal job failed for transfer", transferId, err);
    }
  }, 5 * 60 * 1000);
}

router.get("/transfers", async (_req, res): Promise<void> => {
  const transfers = await db.select().from(transfersTable).orderBy(desc(transfersTable.date), desc(transfersTable.createdAt));
  res.json(GetTransfersResponse.parse(transfers.map(t => ({
    ...t,
    amount: Number(t.amount),
    reversedAt: t.reversedAt ? t.reversedAt.toISOString() : null,
  }))));
});

router.get("/transfers/:transferId/receipt", async (req, res): Promise<void> => {
  const id = parseInt(req.params.transferId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid transfer ID" });
    return;
  }

  const [transfer] = await db.select().from(transfersTable).where(eq(transfersTable.id, id));
  if (!transfer) {
    res.status(404).json({ error: "Transfer not found" });
    return;
  }

  const [fromAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, transfer.fromAccountId));
  const [toAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, transfer.toAccountId));

  res.json(GetTransferReceiptResponse.parse({
    id: transfer.id,
    referenceNumber: transfer.referenceNumber,
    date: transfer.date,
    amount: Number(transfer.amount),
    fromAccount: fromAcc ? `${fromAcc.nickname} (···${fromAcc.maskedNumber})` : `Account #${transfer.fromAccountId}`,
    toAccount: toAcc ? `${toAcc.nickname} (···${toAcc.maskedNumber})` : `Account #${transfer.toAccountId}`,
    status: transfer.status,
    memo: transfer.memo,
    reversedAt: transfer.reversedAt ? transfer.reversedAt.toISOString() : null,
  }));
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

  // Deduct from source
  await db.update(accountsTable).set({
    balance: String((Number(fromAcc.balance) - amount).toFixed(2)),
    availableBalance: String((Number(fromAcc.availableBalance) - amount).toFixed(2)),
  }).where(eq(accountsTable.id, fromAccountId));

  // Credit destination
  await db.update(accountsTable).set({
    balance: String((Number(toAcc.balance) + amount).toFixed(2)),
    availableBalance: String((Number(toAcc.availableBalance) + amount).toFixed(2)),
  }).where(eq(accountsTable.id, toAccountId));

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const referenceNumber = generateRef();

  // Insert "Transfer Out" debit transaction for source account
  const [fromAccUpdated] = await db.select().from(accountsTable).where(eq(accountsTable.id, fromAccountId));
  await db.insert(transactionsTable).values({
    accountId: fromAccountId,
    description: `Transfer Out — ${toAcc.nickname} · Ref ${referenceNumber}`,
    amount: String(amount.toFixed(2)),
    type: "debit",
    category: "Transfer",
    date: today,
    balance: fromAccUpdated?.balance ?? "0",
    merchant: null,
  });

  const [transfer] = await db.insert(transfersTable).values({
    fromAccountId,
    toAccountId,
    amount: String(amount.toFixed(2)),
    date: today,
    status: "pending_reversal",
    memo: memo ?? "",
    referenceNumber,
  }).returning();

  const fromName = `${fromAcc.nickname} (···${fromAcc.maskedNumber})`;
  const toName = `${toAcc.nickname} (···${toAcc.maskedNumber})`;

  void sendTransferConfirmation({
    referenceNumber,
    fromAccount: fromName,
    toAccount: toName,
    amount,
    memo,
  });

  scheduleReversal(transfer.id, amount, fromAccountId, toAccountId, referenceNumber, fromName, toName, memo ?? "");

  res.status(201).json({
    ...transfer,
    amount: Number(transfer.amount),
    reversedAt: null,
  });
});

export default router;
