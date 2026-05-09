import { Router, type IRouter } from "express";
import { db, cardsTable } from "@workspace/db";
import { GetCardsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/cards", async (_req, res): Promise<void> => {
  const cards = await db.select().from(cardsTable).orderBy(cardsTable.id);
  res.json(GetCardsResponse.parse(cards.map(c => ({
    ...c,
    creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
    currentBalance: Number(c.currentBalance),
    availableCredit: c.availableCredit ? Number(c.availableCredit) : null,
    rewardsPoints: c.rewardsPoints ?? null,
  }))));
});

export default router;
