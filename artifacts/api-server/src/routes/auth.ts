import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Verify password against stored credential.
 * Supports two modes:
 *   1. ADMIN_PASSWORD_HASH is a bcrypt hash (starts with $2b$ or $2a$) — compare with bcrypt.
 *   2. ADMIN_PASSWORD_HASH is the plaintext password — compare directly (less secure, still works).
 * In plaintext mode we also auto-generate and log a bcrypt hash so the user can upgrade.
 */
async function verifyPassword(candidate: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2b$") || stored.startsWith("$2a$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(candidate, stored);
  }
  // Plaintext fallback
  const match = candidate === stored;
  if (match) {
    const hash = await bcrypt.hash(stored, 12);
    logger.warn(
      { hint: "Store this as ADMIN_PASSWORD_HASH for better security", hash },
      "ADMIN_PASSWORD_HASH is stored as plaintext — upgrade to bcrypt hash"
    );
  }
  return match;
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminCredential = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminCredential) {
    req.log.error("ADMIN_EMAIL or ADMIN_PASSWORD_HASH not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await verifyPassword(password, adminCredential);
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
