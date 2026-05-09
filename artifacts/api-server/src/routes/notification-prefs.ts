import { Router, type IRouter } from "express";
import { db, notificationPrefsTable } from "@workspace/db";

const router: IRouter = Router();

async function getOrCreatePrefs() {
  const [existing] = await db.select().from(notificationPrefsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(notificationPrefsTable).values({}).returning();
  return created!;
}

router.get("/notification-preferences", async (_req, res): Promise<void> => {
  const prefs = await getOrCreatePrefs();
  res.json({
    ...prefs,
    lowBalanceThreshold: Number(prefs.lowBalanceThreshold),
  });
});

router.patch("/notification-preferences", async (req, res): Promise<void> => {
  const { loginAlerts, transferAlerts, billPayAlerts, lowBalanceAlerts, lowBalanceThreshold, marketingEmails } = req.body as {
    loginAlerts?: boolean;
    transferAlerts?: boolean;
    billPayAlerts?: boolean;
    lowBalanceAlerts?: boolean;
    lowBalanceThreshold?: number;
    marketingEmails?: boolean;
  };

  const prefs = await getOrCreatePrefs();

  const updates: Partial<typeof notificationPrefsTable.$inferInsert> = {};
  if (loginAlerts !== undefined) updates.loginAlerts = loginAlerts;
  if (transferAlerts !== undefined) updates.transferAlerts = transferAlerts;
  if (billPayAlerts !== undefined) updates.billPayAlerts = billPayAlerts;
  if (lowBalanceAlerts !== undefined) updates.lowBalanceAlerts = lowBalanceAlerts;
  if (lowBalanceThreshold !== undefined) updates.lowBalanceThreshold = String(lowBalanceThreshold);
  if (marketingEmails !== undefined) updates.marketingEmails = marketingEmails;

  const { eq } = await import("drizzle-orm");
  const [updated] = await db
    .update(notificationPrefsTable)
    .set(updates)
    .where(eq(notificationPrefsTable.id, prefs.id))
    .returning();

  res.json({
    ...updated,
    lowBalanceThreshold: Number(updated!.lowBalanceThreshold),
  });
});

export default router;
