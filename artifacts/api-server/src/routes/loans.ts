import { Router, type IRouter } from "express";
import { db, loansTable } from "@workspace/db";
import { GetLoansResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/loans", async (_req, res): Promise<void> => {
  const loans = await db.select().from(loansTable).orderBy(loansTable.id);
  res.json(GetLoansResponse.parse(loans.map(l => ({
    ...l,
    originalAmount: Number(l.originalAmount),
    currentBalance: Number(l.currentBalance),
    monthlyPayment: Number(l.monthlyPayment),
    interestRate: Number(l.interestRate),
    nextPaymentAmount: Number(l.nextPaymentAmount),
    nickname: l.nickname ?? l.type,
  }))));
});

export default router;
