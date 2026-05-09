import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Resolve the stored ADMIN_PASSWORD_HASH into a bcrypt hash that can be used
 * for timing-safe comparison via bcrypt.compare().
 *
 * - If the stored value is already a bcrypt hash (starts with $2b$, $2a$, $2y$),
 *   it is used as-is.
 * - If the stored value is plaintext, it is hashed once at startup (cost 12) and
 *   the hash is cached in memory for the lifetime of this process.  The plaintext
 *   value never leaves the process; all subsequent comparisons use bcrypt.compare().
 *
 * This means all login attempts always go through bcrypt.compare() — providing
 * timing-safe, constant-time verification regardless of how the secret was stored.
 */
let _resolvedHash: string | null = null;

async function resolveAdminHash(stored: string): Promise<string> {
  if (stored.startsWith("$2b$") || stored.startsWith("$2a$") || stored.startsWith("$2y$")) {
    return stored;
  }
  if (!_resolvedHash) {
    logger.warn(
      "ADMIN_PASSWORD_HASH is not a bcrypt hash — hashing it once at startup. " +
        "For best practice, update the secret to a pre-computed bcrypt hash.",
    );
    _resolvedHash = await bcrypt.hash(stored, 12);
  }
  return _resolvedHash;
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

  const hashToCompare = await resolveAdminHash(adminCredential);
  const valid = await bcrypt.compare(password, hashToCompare);

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
