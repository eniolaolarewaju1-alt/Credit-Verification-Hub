import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, scheduledTransfersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/scheduled-transfers", async (_req, res): Promise<void> => {
  const transfers = await db
    .select()
    .from(scheduledTransfersTable)
    .where(eq(scheduledTransfersTable.status, "active"))
    .orderBy(scheduledTransfersTable.nextDate);

  res.json(transfers.map(t => ({
    ...t,
    amount: Number(t.amount),
    memo: t.memo ?? null,
  })));
});

router.post("/scheduled-transfers", async (req, res): Promise<void> => {
  const { fromAccountId, toAccountId, amount, memo, frequency, nextDate } = req.body as {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    memo?: string;
    frequency: string;
    nextDate: string;
  };

  if (!fromAccountId || !toAccountId || !amount || !frequency || !nextDate) {
    res.status(400).json({ error: "fromAccountId, toAccountId, amount, frequency, and nextDate are required" });
    return;
  }

  const [transfer] = await db.insert(scheduledTransfersTable).values({
    fromAccountId,
    toAccountId,
    amount: String(amount),
    memo: memo ?? null,
    frequency,
    nextDate,
    status: "active",
  }).returning();

  res.status(201).json({
    ...transfer,
    amount: Number(transfer!.amount),
    memo: transfer!.memo ?? null,
  });
});

router.delete("/scheduled-transfers/:scheduledTransferId", async (req, res): Promise<void> => {
  const id = parseInt(req.params["scheduledTransferId"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid scheduled transfer ID" });
    return;
  }

  await db
    .update(scheduledTransfersTable)
    .set({ status: "cancelled" })
    .where(eq(scheduledTransfersTable.id, id));

  res.json({ message: "Scheduled transfer cancelled" });
});

export default router;
