import { Router, type IRouter } from "express";
import { eq, lt } from "drizzle-orm";
import { db, otpCodesTable } from "@workspace/db";
import { sendOtpEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/auth/otp/send", async (req, res): Promise<void> => {
  const pendingEmail = (req.session as { pendingOtpEmail?: string }).pendingOtpEmail;
  if (!pendingEmail) {
    res.status(401).json({ error: "No pending login session. Please log in first." });
    return;
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.delete(otpCodesTable).where(lt(otpCodesTable.expiresAt, new Date()));
  await db.insert(otpCodesTable).values({ code, expiresAt });

  await sendOtpEmail({ code, expiresAt });
  req.log.info({ email: pendingEmail }, "OTP sent");

  res.json({ message: "Verification code sent to your email" });
});

router.post("/auth/otp/verify", async (req, res): Promise<void> => {
  const { code } = req.body as { code?: string };
  const pendingEmail = (req.session as { pendingOtpEmail?: string }).pendingOtpEmail;

  if (!pendingEmail) {
    res.status(401).json({ error: "No pending login session" });
    return;
  }
  if (!code) {
    res.status(400).json({ error: "Code is required" });
    return;
  }

  const [otpRow] = await db
    .select()
    .from(otpCodesTable)
    .where(eq(otpCodesTable.code, code))
    .limit(1);

  if (!otpRow || otpRow.used || otpRow.expiresAt < new Date()) {
    res.status(401).json({ error: "Invalid or expired code. Please request a new one." });
    return;
  }

  await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, otpRow.id));

  (req.session as { userId?: string; pendingOtpEmail?: string }).userId = pendingEmail;
  (req.session as { pendingOtpEmail?: string }).pendingOtpEmail = undefined;

  logger.info({ email: pendingEmail }, "OTP verified — user logged in");
  res.json({ email: pendingEmail });
});

export default router;
