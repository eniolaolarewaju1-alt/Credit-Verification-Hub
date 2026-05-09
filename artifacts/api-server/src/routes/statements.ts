import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, statementsTable } from "@workspace/db";
import { GetStatementsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/statements", async (_req, res): Promise<void> => {
  const statements = await db.select().from(statementsTable).orderBy(desc(statementsTable.startDate));
  res.json(GetStatementsResponse.parse(statements.map(s => ({
    ...s,
    openingBalance: Number(s.openingBalance),
    closingBalance: Number(s.closingBalance),
    totalCredits: Number(s.totalCredits),
    totalDebits: Number(s.totalDebits),
  }))));
});

export default router;
