import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, savingsGoalsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/savings-goals", async (_req, res): Promise<void> => {
  const goals = await db.select().from(savingsGoalsTable).orderBy(savingsGoalsTable.createdAt);
  res.json(goals.map(g => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
  })));
});

router.post("/savings-goals", async (req, res): Promise<void> => {
  const { name, targetAmount, currentAmount, targetDate, color, icon } = req.body as {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: string;
    color?: string;
    icon?: string;
  };

  if (!name || !targetAmount) {
    res.status(400).json({ error: "name and targetAmount are required" });
    return;
  }

  const [goal] = await db.insert(savingsGoalsTable).values({
    name,
    targetAmount: String(targetAmount),
    currentAmount: String(currentAmount ?? 0),
    targetDate: targetDate ?? null,
    color: color ?? "#117ACA",
    icon: icon ?? "target",
  }).returning();

  res.status(201).json({
    ...goal,
    targetAmount: Number(goal!.targetAmount),
    currentAmount: Number(goal!.currentAmount),
  });
});

router.patch("/savings-goals/:goalId", async (req, res): Promise<void> => {
  const goalId = parseInt(req.params["goalId"] ?? "");
  if (isNaN(goalId)) {
    res.status(400).json({ error: "Invalid goal ID" });
    return;
  }

  const { name, targetAmount, currentAmount, targetDate, color, icon, addAmount } = req.body as {
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: string;
    color?: string;
    icon?: string;
    addAmount?: number;
  };

  const [existing] = await db.select().from(savingsGoalsTable).where(eq(savingsGoalsTable.id, goalId));
  if (!existing) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const updates: Partial<typeof savingsGoalsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (targetAmount !== undefined) updates.targetAmount = String(targetAmount);
  if (targetDate !== undefined) updates.targetDate = targetDate;
  if (color !== undefined) updates.color = color;
  if (icon !== undefined) updates.icon = icon;
  if (addAmount !== undefined) {
    const newAmount = Number(existing.currentAmount) + addAmount;
    updates.currentAmount = String(Math.min(newAmount, Number(existing.targetAmount)));
  } else if (currentAmount !== undefined) {
    updates.currentAmount = String(currentAmount);
  }

  const [updated] = await db.update(savingsGoalsTable).set(updates).where(eq(savingsGoalsTable.id, goalId)).returning();

  res.json({
    ...updated,
    targetAmount: Number(updated!.targetAmount),
    currentAmount: Number(updated!.currentAmount),
  });
});

router.delete("/savings-goals/:goalId", async (req, res): Promise<void> => {
  const goalId = parseInt(req.params["goalId"] ?? "");
  if (isNaN(goalId)) {
    res.status(400).json({ error: "Invalid goal ID" });
    return;
  }

  await db.delete(savingsGoalsTable).where(eq(savingsGoalsTable.id, goalId));
  res.json({ message: "Goal deleted" });
});

export default router;
