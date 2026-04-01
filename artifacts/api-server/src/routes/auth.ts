import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

router.post("/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    const user = users[0];

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized", message: "Noto'g'ri login yoki parol" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Noto'g'ri login yoki parol" });
      return;
    }

    req.session.userId = user.id;

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() }, message: "Muvaffaqiyatli kirildi" });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Chiqildi" });
  });
});

router.get("/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Tizimga kirmagan" });
    return;
  }

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    const user = users[0];

    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Unauthorized", message: "Foydalanuvchi topilmadi" });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
