import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

type Session = { userId?: number } | null | undefined;
function getSession(req: any): Session {
  return req.session as Session;
}

function parseChangeCredentialsBody(body: any):
  | { ok: true; data: { currentPassword: string; newUsername?: string; newPassword?: string } }
  | { ok: false; message: string } {
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword.trim() : "";
  const newUsername = typeof body?.newUsername === "string" ? body.newUsername.trim() : undefined;
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : undefined;

  if (!currentPassword) return { ok: false, message: "Joriy parolni kiriting" };
  if (!newUsername && !newPassword) return { ok: false, message: "Yangi login yoki parol kiriting" };
  if (newUsername && newUsername.length < 4) return { ok: false, message: "Login kamida 4 ta belgi bo'lishi kerak" };
  if (newPassword && newPassword.length < 6) return { ok: false, message: "Parol kamida 6 ta belgi bo'lishi kerak" };

  return { ok: true, data: { currentPassword, newUsername, newPassword } };
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

    const sess = getSession(req) ?? (req.session = {});
    (sess as any).userId = user.id;

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() }, message: "Muvaffaqiyatli kirildi" });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res): void => {
  req.session = null;
  res.json({ success: true, message: "Chiqildi" });
});

router.get("/me", async (req, res): Promise<void> => {
  const sess = getSession(req);
  if (!sess?.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Tizimga kirmagan" });
    return;
  }

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, sess.userId)).limit(1);
    const user = users[0];

    if (!user || !user.isActive) {
      req.session = null;
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

// Change currently logged-in user's login/password and force re-login.
router.patch("/credentials", async (req, res): Promise<void> => {
  const sess = getSession(req);
  if (!sess?.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Tizimga kirmagan" });
    return;
  }

  const parsed = parseChangeCredentialsBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: "Invalid request", message: parsed.message });
    return;
  }

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, sess.userId)).limit(1);
    const user = users[0];
    if (!user || !user.isActive) {
      req.session = null;
      res.status(401).json({ error: "Unauthorized", message: "Foydalanuvchi topilmadi" });
      return;
    }

    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Unauthorized", message: "Joriy parol noto'g'ri" });
      return;
    }

    const update: Record<string, any> = {};
    if (parsed.data.newUsername) update.username = parsed.data.newUsername;
    if (parsed.data.newPassword) update.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

    await db.update(usersTable).set(update).where(eq(usersTable.id, user.id));

    // Force re-login with new credentials
    req.session = null;
    res.json({ success: true, message: "Login/parol yangilandi. Qayta kiring." });
  } catch (err) {
    req.log.error({ err }, "Change credentials error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
