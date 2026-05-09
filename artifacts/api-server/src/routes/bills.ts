import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, billsTable, billPaymentsTable, accountsTable } from "@workspace/db";
import { GetBillsResponse, PayBillBody } from "@workspace/api-zod";
import { sendBillPayAlert } from "../lib/email";

const router: IRouter = Router();

router.get("/bills", async (_req, res): Promise<void> => {
  const bills = await db.select().from(billsTable).orderBy(billsTable.dueDate);
  res.json(GetBillsResponse.parse(bills.map(b => ({
    ...b,
    amountDue: Number(b.amountDue),
    lastPaidAmount: b.lastPaidAmount ? Number(b.lastPaidAmount) : null,
    lastPaidDate: b.lastPaidDate ?? null,
  }))));
});

router.post("/bills", async (req, res): Promise<void> => {
  const parsed = PayBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [payment] = await db.insert(billPaymentsTable).values({
    billId: parsed.data.billId,
    amount: String(parsed.data.amount),
    fromAccountId: parsed.data.fromAccountId,
    payDate: parsed.data.payDate,
    status: "pending",
  }).returning();

  const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, parsed.data.billId));
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, parsed.data.fromAccountId));

  void sendBillPayAlert({
    payeeName: bill?.payeeName ?? "Payee",
    amount: parsed.data.amount,
    fromAccount: account ? `${account.nickname} (...${account.maskedNumber})` : `Account #${parsed.data.fromAccountId}`,
    payDate: parsed.data.payDate,
  });

  res.status(201).json({ ...payment, amount: Number(payment.amount) });
});

export default router;
