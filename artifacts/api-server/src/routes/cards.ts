import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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

router.patch("/cards/:cardId/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
  const cardId = parseInt(raw, 10);
  if (isNaN(cardId)) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const { status } = req.body as { status?: string };
  if (!status || !["active", "frozen", "cancelled"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [card] = await db
    .update(cardsTable)
    .set({ status })
    .where(eq(cardsTable.id, cardId))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  res.json({
    ...card,
    creditLimit: card.creditLimit ? Number(card.creditLimit) : null,
    currentBalance: Number(card.currentBalance),
    availableCredit: card.availableCredit ? Number(card.availableCredit) : null,
    rewardsPoints: card.rewardsPoints ?? null,
  });
});

export default router;
