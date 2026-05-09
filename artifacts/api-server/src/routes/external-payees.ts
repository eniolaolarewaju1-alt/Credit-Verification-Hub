import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, externalPayeesTable } from "@workspace/db";

const router: IRouter = Router();

const ROUTING_BANK_MAP: Record<string, string> = {
  "021000021": "JPMorgan Chase Bank",
  "021000089": "Citibank",
  "026009593": "Bank of America",
  "121000248": "Wells Fargo Bank",
  "053000219": "Truist Bank (formerly BB&T)",
  "053101121": "First Citizens Bank",
  "053207766": "South State Bank",
  "253270635": "SC Federal Credit Union",
  "053100300": "TD Bank",
  "044000037": "JPMorgan Chase Bank",
  "267084131": "Navy Federal Credit Union",
  "056073502": "Bank of America",
  "031100157": "Wells Fargo Bank",
  "121042882": "Wells Fargo Bank",
};

function lookupBank(routing: string): string {
  return ROUTING_BANK_MAP[routing] ?? "Financial Institution";
}

function isValidRouting(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;
  const d = routing.split("").map(Number);
  const checksum =
    3 * (d[0] + d[3] + d[6]) +
    7 * (d[1] + d[4] + d[7]) +
    1 * (d[2] + d[5] + d[8]);
  return checksum % 10 === 0;
}

router.post("/external-payees/verify", async (req, res): Promise<void> => {
  const { routingNumber, accountNumber } = req.body as {
    routingNumber?: string;
    accountNumber?: string;
  };

  if (!routingNumber || !accountNumber) {
    res.status(400).json({ error: "routingNumber and accountNumber are required" });
    return;
  }

  if (!isValidRouting(routingNumber)) {
    res.json({ verified: false, bankName: "", routingNumber, message: "Invalid routing number" });
    return;
  }

  if (accountNumber.length < 4 || accountNumber.length > 17 || !/^\d+$/.test(accountNumber)) {
    res.json({ verified: false, bankName: "", routingNumber, message: "Invalid account number format" });
    return;
  }

  const bankName = lookupBank(routingNumber);
  res.json({
    verified: true,
    bankName,
    routingNumber,
    message: `Account verified at ${bankName}`,
  });
});

router.get("/external-payees", async (_req, res): Promise<void> => {
  const payees = await db.select().from(externalPayeesTable).orderBy(externalPayeesTable.createdAt);
  res.json(payees.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/external-payees", async (req, res): Promise<void> => {
  const { nickname, recipientName, routingNumber, accountNumber, bankName, accountType } = req.body as {
    nickname?: string;
    recipientName?: string;
    routingNumber?: string;
    accountNumber?: string;
    bankName?: string;
    accountType?: string;
  };

  if (!nickname || !recipientName || !routingNumber || !accountNumber) {
    res.status(400).json({ error: "nickname, recipientName, routingNumber, and accountNumber are required" });
    return;
  }

  const [payee] = await db.insert(externalPayeesTable).values({
    nickname,
    recipientName,
    routingNumber,
    accountNumber,
    bankName: bankName ?? lookupBank(routingNumber),
    accountType: accountType ?? "checking",
  }).returning();

  res.status(201).json({ ...payee, createdAt: payee.createdAt.toISOString() });
});

router.delete("/external-payees/:payeeId", async (req, res): Promise<void> => {
  const id = parseInt(req.params.payeeId);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid payee ID" });
    return;
  }
  await db.delete(externalPayeesTable).where(eq(externalPayeesTable.id, id));
  res.json({ message: "Payee removed" });
});

export default router;
