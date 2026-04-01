import { Router, type IRouter } from "express";
import { db, patientsTable, medicalRecordsTable, usersTable } from "@workspace/db";
import { eq, ilike, and, or, count } from "drizzle-orm";
import { CreatePatientBody, UpdatePatientBody, GetPatientsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", async (req, res): Promise<void> => {
  const parsed = GetPatientsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const status = parsed.success ? parsed.data.status : undefined;
  const search = parsed.success ? parsed.data.search : undefined;

  try {
    const whereConditions = [];
    if (status) whereConditions.push(eq(patientsTable.status, status));
    if (search) {
      whereConditions.push(or(
        ilike(patientsTable.fullName, `%${search}%`),
        ilike(patientsTable.passport, `%${search}%`),
        ilike(patientsTable.jshshir, `%${search}%`),
        ilike(patientsTable.phone, `%${search}%`)
      ));
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [patients, [{ total }]] = await Promise.all([
      db.select().from(patientsTable).where(where).orderBy(patientsTable.createdAt).limit(limit).offset((page - 1) * limit),
      db.select({ total: count() }).from(patientsTable).where(where),
    ]);

    res.json({
      patients: patients.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total: Number(total),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Get patients error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  try {
    const [patient] = await db.insert(patientsTable).values({
      ...parsed.data,
      createdById: req.session.userId!,
    }).returning();

    res.status(201).json({
      ...patient,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create patient error");
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
    const patients = await db.select().from(patientsTable).where(eq(patientsTable.id, id)).limit(1);
    const patient = patients[0];

    if (!patient) {
      res.status(404).json({ error: "Not found", message: "Bemor topilmadi" });
      return;
    }

    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, id)).limit(1);
    const medicalRecord = records[0];

    let enrichedRecord = null;
    if (medicalRecord) {
      let doctorName = undefined;
      let chairmanName = undefined;

      if (medicalRecord.doctorId) {
        const doctors = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, medicalRecord.doctorId)).limit(1);
        doctorName = doctors[0]?.name;
      }
      if (medicalRecord.chairmanId) {
        const chairmen = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, medicalRecord.chairmanId)).limit(1);
        chairmanName = chairmen[0]?.name;
      }

      enrichedRecord = {
        ...medicalRecord,
        doctorName,
        chairmanName,
        createdAt: medicalRecord.createdAt.toISOString(),
        updatedAt: medicalRecord.updatedAt.toISOString(),
      };
    }

    res.json({
      ...patient,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
      medicalRecord: enrichedRecord,
    });
  } catch (err) {
    req.log.error({ err }, "Get patient error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  try {
    const [patient] = await db.update(patientsTable).set(parsed.data).where(eq(patientsTable.id, id)).returning();
    if (!patient) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({
      ...patient,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update patient error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, id));
    await db.delete(patientsTable).where(eq(patientsTable.id, id));
    res.json({ success: true, message: "Bemor o'chirildi" });
  } catch (err) {
    req.log.error({ err }, "Delete patient error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/submit", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const patients = await db.select().from(patientsTable).where(eq(patientsTable.id, id)).limit(1);
    const patient = patients[0];

    if (!patient) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (patient.status !== "draft") {
      res.status(400).json({ error: "Bad request", message: "Bemor faqat draft statusida yuborilishi mumkin" });
      return;
    }

    const [updated] = await db.update(patientsTable).set({ status: "pending" }).where(eq(patientsTable.id, id)).returning();

    await db.update(medicalRecordsTable).set({ status: "pending" }).where(eq(medicalRecordsTable.patientId, id));

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Submit patient error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
