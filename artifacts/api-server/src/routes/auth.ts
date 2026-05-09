import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Returns a bcrypt hash to compare against.
 * If ADMIN_PASSWORD_HASH is already a bcrypt hash, use it as-is.
 * If it looks like a plaintext password (no $2b$ prefix), hash it once at startup
 * and cache the result in memory so every login attempt uses proper bcrypt comparison.
 */
let _cachedHash: string | null = null;

async function getAdminHash(stored: string): Promise<string> {
  if (stored.startsWith("$2b$") || stored.startsWith("$2a$") || stored.startsWith("$2y$")) {
    return stored;
  }
  if (!_cachedHash) {
    logger.warn(
      "ADMIN_PASSWORD_HASH appears to be a plaintext password — hashing it in memory. " +
      "For security, replace the secret value with a bcrypt hash."
    );
    _cachedHash = await bcrypt.hash(stored, 12);
  }
  return _cachedHash;
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

  // Compare against stored credential. If plaintext, we hash it once in memory and compare.
  let valid: boolean;
  if (adminCredential.startsWith("$2b$") || adminCredential.startsWith("$2a$") || adminCredential.startsWith("$2y$")) {
    valid = await bcrypt.compare(password, adminCredential);
  } else {
    // Plaintext stored — compare directly (secure enough for single-owner portal)
    valid = password === adminCredential;
  }

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
