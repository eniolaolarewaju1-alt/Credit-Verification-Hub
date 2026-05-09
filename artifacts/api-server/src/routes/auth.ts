import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    req.log.error("ADMIN_EMAIL or ADMIN_PASSWORD_HASH not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, adminHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  (req.session as { userId?: string }).userId = email;
  req.log.info({ email }, "User logged in");
  res.json({ email });
});

router.get("/auth/me", (req, res): void => {
  const userId = (req.session as { userId?: string }).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ email: userId });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      logger.error(err, "Failed to destroy session");
    }
    res.json({ message: "Signed out successfully" });
  });
});

export default router;
