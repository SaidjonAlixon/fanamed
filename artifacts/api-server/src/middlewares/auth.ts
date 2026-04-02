import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function getUserId(req: Request): number | undefined {
  const anyReq = req as any;
  return anyReq?.session?.userId;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!getUserId(req)) {
    res.status(401).json({ error: "Unauthorized", message: "Tizimga kiring" });
    return;
  }
  next();
}

export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Tizimga kiring" });
      return;
    }

    try {
      const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
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
