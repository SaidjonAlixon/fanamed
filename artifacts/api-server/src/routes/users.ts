import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, and, count } from "drizzle-orm";
import { CreateUserBody, UpdateUserBody, GetUsersQueryParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", requireRole(["super_admin", "admin"]), async (req, res): Promise<void> => {
  const parsed = GetUsersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const role = parsed.success ? parsed.data.role : undefined;
  const search = parsed.success ? parsed.data.search : undefined;

  try {
    const whereConditions = [];
    if (role) whereConditions.push(eq(usersTable.role, role));
    if (search) {
      whereConditions.push(or(
        ilike(usersTable.name, `%${search}%`),
        ilike(usersTable.username, `%${search}%`)
      ));
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [users, [{ total }]] = await Promise.all([
      db.select({
        id: usersTable.id,
        name: usersTable.name,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      }).from(usersTable).where(where).limit(limit).offset((page - 1) * limit),
      db.select({ total: count() }).from(usersTable).where(where),
    ]);

    res.json({
      users: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
      total: Number(total),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Get users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireRole(["super_admin", "admin"]), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ ...rest, passwordHash }).returning({
      id: usersTable.id,
      name: usersTable.name,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    });
    res.status(201).json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, id)).limit(1);

    if (!users[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const user = users[0];
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireRole(["super_admin", "admin"]), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning({
      id: usersTable.id,
      name: usersTable.name,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    });

    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireRole(["super_admin"]), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true, message: "Foydalanuvchi o'chirildi" });
  } catch (err) {
    req.log.error({ err }, "Delete user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
