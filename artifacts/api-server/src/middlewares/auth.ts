import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Tizimga kiring" });
    return;
  }
  next();
}

export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Unauthorized", message: "Tizimga kiring" });
      return;
    }

    try {
      const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
      const user = users[0];

      if (!user || !roles.includes(user.role)) {
        res.status(403).json({ error: "Forbidden", message: "Ruxsat yo'q" });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
