import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import { GetMemberResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/member", async (req, res): Promise<void> => {
  const [member] = await db.select().from(membersTable).limit(1);
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(GetMemberResponse.parse(member));
});

export default router;
