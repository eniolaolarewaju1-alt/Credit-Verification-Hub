import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session && (req.session as { userId?: string }).userId) {
    next();
    return;
  }
  res.status(401).json({ error: "Not authenticated" });
}
