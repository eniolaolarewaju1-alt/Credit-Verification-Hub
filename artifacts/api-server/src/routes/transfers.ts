import { Router, type IRouter } from "express";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, transfersTable, accountsTable, transactionsTable } from "@workspace/db";
import { GetTransfersResponse, CreateTransferBody, GetTransferReceiptResponse } from "@workspace/api-zod";
import { sendTransferConfirmation, sendTransferReversalEmail } from "../lib/email";

const router: IRouter = Router();

function generateRef(): string {
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }).replace(/-/g, "");
  const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
  return `HCU-${date}-${hex}`;
}

async function performReversal(transferId: number): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  // Pre-check for clearer error messages on the not-found case
  const [existing] = await db.select().from(transfersTable).where(eq(transfersTable.id, transferId));
  if (!existing) return { ok: false, status: 404, error: "Transfer not found" };

  // Atomic conditional status transition — claim this reversal exactly once.
  // Any concurrent caller (manual click, double-click, scheduled job) that loses
  // the race will get 0 rows back and abort cleanly without touching balances
  // or sending duplicate emails.
  const claimed = await db.update(transfersTable)
    .set({ status: "reversed", reversedAt: new Date() })
    .where(and(eq(transfersTable.id, transferId), ne(transfersTable.status, "reversed")))
    .returning();

  if (claimed.length === 0) {
    return { ok: false, status: 400, error: "Transfer already reversed" };
  }

  const transfer = claimed[0];
  const amount = Number(transfer.amount);
  const [fromAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, transfer.fromAccountId));
  const [toAcc] = await db.select().from(accountsTable).where(eq(accountsTable.id, transfer.toAccountId));
  if (!fromAcc || !toAcc) return { ok: false, status: 404, error: "Account not found" };

  // Restore from account balance
  await db.update(accountsTable).set({
    balance: String((Number(fromAcc.balance) + amount).toFixed(2)),
    availableBalance: String((Number(fromAcc.availableBalance) + amount).toFixed(2)),
  }).where(eq(accountsTable.id, transfer.fromAccountId));

  // Deduct from to account
  await db.update(accountsTable).set({
    balance: String((Number(toAcc.balance) - amount).toFixed(2)),
    availableBalance: String((Number(toAcc.availableBalance) - amount).toFixed(2)),
  }).where(eq(accountsTable.id, transfer.toAccountId));

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [updatedFrom] = await db.select().from(accountsTable).where(eq(accountsTable.id, transfer.fromAccountId));
  const [updatedTo] = await db.select().from(accountsTable).where(eq(accountsTable.id, transfer.toAccountId));

  // Insert refund credit on source (the account getting money back)
  await db.insert(transactionsTable).values({
    accountId: transfer.fromAccountId,
    description: `Transfer Reversal — Ref ${transfer.referenceNumber}`,
    amount: String(amount.toFixed(2)),
    type: "credit",
    category: "Transfer",
    date: today,
    balance: updatedFrom?.balance ?? "0",
    merchant: null,
  });

  // Insert offsetting debit on destination so its history matches reality
  await db.insert(transactionsTable).values({
    accountId: transfer.toAccountId,
    description: `Transfer Reversal — Ref ${transfer.referenceNumber}`,
    amount: String(amount.toFixed(2)),
    type: "debit",
    category: "Transfer",
    date: today,
    balance: updatedTo?.balance ?? "0",
    merchant: null,
  });

  const fromName = `${fromAcc.nickname} (···${fromAcc.maskedNumber})`;
  const toName = `${toAcc.nickname} (···${toAcc.maskedNumber})`;

  void sendTransferReversalEmail({
    referenceNumber: transfer.referenceNumber,
    fromAccount: fromName,
    toAccount: toName,
    amount,
    memo: transfer.memo,
  });

  return { ok: true };
}

async function scheduleReversal(transferId: number) {
  setTimeout(async () => {
    try {
      await performReversal(transferId);
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

router.post("/transfers/:transferId/reverse", async (req, res): Promise<void> => {
  const id = parseInt(req.params.transferId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid transfer ID" });
    return;
  }

  const result = await performReversal(id);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const [transfer] = await db.select().from(transfersTable).where(eq(transfersTable.id, id));
  if (!transfer) {
    res.status(404).json({ error: "Transfer not found" });
    return;
  }

  res.json({
    ...transfer,
    amount: Number(transfer.amount),
    reversedAt: transfer.reversedAt ? transfer.reversedAt.toISOString() : null,
  });
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

  scheduleReversal(transfer.id);

  res.status(201).json({
    ...transfer,
    amount: Number(transfer.amount),
    reversedAt: null,
  });
});

export default router;
