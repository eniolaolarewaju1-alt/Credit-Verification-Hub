import { Router, type IRouter } from "express";
import { and, desc, eq, ne, sql } from "drizzle-orm";
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

  // All balance/history/status changes happen atomically in a single DB transaction.
  // The conditional UPDATE on status guarantees exactly-once execution across
  // concurrent callers (manual click, double-click, scheduled auto-reversal job).
  const result = await db.transaction(async (tx) => {
    const claimed = await tx.update(transfersTable)
      .set({ status: "reversed", reversedAt: new Date() })
      .where(and(eq(transfersTable.id, transferId), ne(transfersTable.status, "reversed")))
      .returning();

    if (claimed.length === 0) return { kind: "already_reversed" as const };

    const transfer = claimed[0];
    const amountStr = transfer.amount;
    const amount = Number(amountStr);

    const [fromAcc] = await tx.select().from(accountsTable).where(eq(accountsTable.id, transfer.fromAccountId));
    const [toAcc] = await tx.select().from(accountsTable).where(eq(accountsTable.id, transfer.toAccountId));
    if (!fromAcc || !toAcc) throw new Error("Account not found during reversal");

    // Atomic SQL arithmetic — no read-modify-write race.
    const [updatedFrom] = await tx.update(accountsTable).set({
      balance: sql`${accountsTable.balance} + ${amountStr}`,
      availableBalance: sql`${accountsTable.availableBalance} + ${amountStr}`,
    }).where(eq(accountsTable.id, transfer.fromAccountId)).returning();

    const [updatedTo] = await tx.update(accountsTable).set({
      balance: sql`${accountsTable.balance} - ${amountStr}`,
      availableBalance: sql`${accountsTable.availableBalance} - ${amountStr}`,
    }).where(eq(accountsTable.id, transfer.toAccountId)).returning();

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    await tx.insert(transactionsTable).values({
      accountId: transfer.fromAccountId,
      description: `Transfer Reversal — Ref ${transfer.referenceNumber}`,
      amount: amountStr,
      type: "credit",
      category: "Transfer",
      date: today,
      balance: updatedFrom?.balance ?? "0",
      merchant: null,
    });

    await tx.insert(transactionsTable).values({
      accountId: transfer.toAccountId,
      description: `Transfer Reversal — Ref ${transfer.referenceNumber}`,
      amount: amountStr,
      type: "debit",
      category: "Transfer",
      date: today,
      balance: updatedTo?.balance ?? "0",
      merchant: null,
    });

    return {
      kind: "reversed" as const,
      transfer,
      fromName: `${fromAcc.nickname} (···${fromAcc.maskedNumber})`,
      toName: `${toAcc.nickname} (···${toAcc.maskedNumber})`,
      amount,
    };
  });

  if (result.kind === "already_reversed") {
    return { ok: false, status: 400, error: "Transfer already reversed" };
  }

  // Email outside transaction — best-effort, doesn't affect data integrity.
  void sendTransferReversalEmail({
    referenceNumber: result.transfer.referenceNumber,
    fromAccount: result.fromName,
    toAccount: result.toName,
    amount: result.amount,
    memo: result.transfer.memo,
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
