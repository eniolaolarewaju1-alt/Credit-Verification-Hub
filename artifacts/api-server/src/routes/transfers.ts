import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, transfersTable } from "@workspace/db";
import {
  GetTransfersResponse,
  CreateTransferBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transfers", async (_req, res): Promise<void> => {
  const transfers = await db.select().from(transfersTable).orderBy(desc(transfersTable.date));
  res.json(GetTransfersResponse.parse(transfers.map(t => ({
    ...t,
    amount: Number(t.amount),
  }))));
});

router.post("/transfers", async (req, res): Promise<void> => {
  const parsed = CreateTransferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [transfer] = await db.insert(transfersTable).values({
    fromAccountId: parsed.data.fromAccountId,
    toAccountId: parsed.data.toAccountId,
    amount: String(parsed.data.amount),
    date: today,
    status: "completed",
    memo: parsed.data.memo ?? "",
  }).returning();

  res.status(201).json({
    ...transfer,
    amount: Number(transfer.amount),
  });
});

export default router;
