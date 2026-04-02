import { Router, type IRouter } from "express";
import { db, patientsTable, usersTable, medicalRecordsTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/stats", async (req, res): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      [{ totalPatients }],
      [{ approved }],
      [{ rejected }],
      [{ pending }],
      [{ draft }],
      [{ activeStaff }],
      [{ activeDoctors }],
      [{ todayChecks }],
    ] = await Promise.all([
      db.select({ totalPatients: count() }).from(patientsTable),
      db.select({ approved: count() }).from(patientsTable).where(eq(patientsTable.status, "approved")),
      db.select({ rejected: count() }).from(patientsTable).where(eq(patientsTable.status, "rejected")),
      db.select({ pending: count() }).from(patientsTable).where(eq(patientsTable.status, "pending")),
      db.select({ draft: count() }).from(patientsTable).where(eq(patientsTable.status, "draft")),
      db.select({ activeStaff: count() }).from(usersTable).where(and(eq(usersTable.role, "staff"), eq(usersTable.isActive, true))),
      db.select({ activeDoctors: count() }).from(usersTable).where(and(eq(usersTable.role, "doctor"), eq(usersTable.isActive, true))),
      db.select({ todayChecks: count() }).from(medicalRecordsTable).where(gte(medicalRecordsTable.createdAt, today)),
    ]);

    res.json({
      totalPatients: Number(totalPatients),
      todayChecks: Number(todayChecks),
      approved: Number(approved),
      rejected: Number(rejected),
      pending: Number(pending),
      draft: Number(draft),
      activeStaff: Number(activeStaff),
      activeDoctors: Number(activeDoctors),
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recent", async (req, res): Promise<void> => {
  try {
    const patients = await db.select().from(patientsTable).orderBy(patientsTable.createdAt).limit(10);
    res.json({
      patients: patients.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Recent activity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/doctors", async (req, res): Promise<void> => {
  try {
    const doctors = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(and(
      eq(usersTable.isActive, true),
      eq(usersTable.role, "doctor"),
    ));

    res.json({
      doctors: doctors.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "Get doctors error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
