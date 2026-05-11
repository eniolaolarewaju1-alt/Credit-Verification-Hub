import { Router, type IRouter } from "express";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db, externalTransfersTable, externalPayeesTable, accountsTable, transactionsTable } from "@workspace/db";
import { sendTransferAlert, sendTransferReversalEmail } from "../lib/email";

const router: IRouter = Router();

const REVERSAL_DELAY_MS = 30 * 1000;

async function performExternalReversal(transferId: number): Promise<void> {
  // All balance/history/status changes happen atomically in a single DB transaction.
  // Concurrent callers either both succeed (one wins the conditional claim, the other no-ops)
  // or both abort cleanly with no partial state.
  const result = await db.transaction(async (tx) => {
    // Atomic conditional status claim — only one caller wins.
    const claimed = await tx.update(externalTransfersTable)
      .set({ status: "reversed" })
      .where(and(eq(externalTransfersTable.id, transferId), ne(externalTransfersTable.status, "reversed")))
      .returning();

    if (claimed.length === 0) return null; // already reversed by someone else

    const transfer = claimed[0];
    const amountStr = transfer.amount;

    const [account] = await tx.select().from(accountsTable).where(eq(accountsTable.id, transfer.fromAccountId));
    if (!account) throw new Error(`Source account ${transfer.fromAccountId} not found during reversal`);

    const [payee] = await tx.select().from(externalPayeesTable).where(eq(externalPayeesTable.id, transfer.externalPayeeId));

    // Atomic SQL arithmetic — no read-modify-write race possible on the balance columns.
    const [updated] = await tx.update(accountsTable).set({
      balance: sql`${accountsTable.balance} + ${amountStr}`,
      availableBalance: sql`${accountsTable.availableBalance} + ${amountStr}`,
    }).where(eq(accountsTable.id, transfer.fromAccountId)).returning();

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const recipientLabel = payee ? `${payee.recipientName} at ${payee.bankName}` : "External Recipient";

    await tx.insert(transactionsTable).values({
      accountId: transfer.fromAccountId,
      description: `External Transfer Reversal — ${recipientLabel}`,
      amount: amountStr,
      type: "credit",
      category: "Transfer",
      date: today,
      balance: updated?.balance ?? "0",
      merchant: null,
    });

    return { transfer, account, recipientLabel, amount: Number(amountStr) };
  });

  if (!result) return; // already reversed

  // Email outside the transaction — best-effort, doesn't affect data integrity.
  void sendTransferReversalEmail({
    referenceNumber: `EXT-${result.transfer.id}`,
    fromAccount: `${result.account.nickname} (···${result.account.maskedNumber})`,
    toAccount: result.recipientLabel,
    amount: result.amount,
    memo: result.transfer.memo,
  });
}

function scheduleExternalReversal(transferId: number): void {
  setTimeout(() => {
    performExternalReversal(transferId).catch(err => {
      console.error("External reversal failed for transfer", transferId, err);
    });
  }, REVERSAL_DELAY_MS);
}

router.get("/external-transfers", async (_req, res): Promise<void> => {
  const transfers = await db
    .select()
    .from(externalTransfersTable)
    .orderBy(desc(externalTransfersTable.createdAt));

  res.json(transfers.map(t => ({
    ...t,
    amount: Number(t.amount),
    createdAt: t.createdAt.toISOString(),
    newBalance: null,
    reversesAt: null,
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

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const amountStr = amount.toFixed(2);

  // Atomic: deduct balance, insert transfer + history entry in one transaction.
  const { transfer, newBalance } = await db.transaction(async (tx) => {
    const [updatedAcc] = await tx.update(accountsTable).set({
      availableBalance: sql`${accountsTable.availableBalance} - ${amountStr}`,
      balance: sql`${accountsTable.balance} - ${amountStr}`,
    }).where(eq(accountsTable.id, fromAccountId)).returning();

    const [createdTransfer] = await tx.insert(externalTransfersTable).values({
      fromAccountId,
      externalPayeeId,
      amount: amountStr,
      memo: memo ?? "",
      status: "completed",
      date: today,
    }).returning();

    await tx.insert(transactionsTable).values({
      accountId: fromAccountId,
      description: `External Transfer — ${payee.recipientName} at ${payee.bankName}`,
      amount: amountStr,
      type: "debit",
      category: "Transfer",
      date: today,
      balance: updatedAcc?.balance ?? "0",
      merchant: payee.bankName,
    });

    return { transfer: createdTransfer, newBalance: Number(updatedAcc?.availableBalance ?? "0") };
  });

  void sendTransferAlert({
    type: "external",
    fromAccount: `${account.nickname} (···${account.maskedNumber})`,
    toAccount: `${payee.recipientName} at ${payee.bankName}`,
    amount,
    memo,
    status: "completed",
  });

  // Schedule the 30-second auto-reversal
  scheduleExternalReversal(transfer.id);
  const reversesAt = new Date(Date.now() + REVERSAL_DELAY_MS);

  res.status(201).json({
    ...transfer,
    amount: Number(transfer.amount),
    createdAt: transfer.createdAt.toISOString(),
    newBalance,
    reversesAt: reversesAt.toISOString(),
  });
});

export default router;
