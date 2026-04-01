import { Router, type IRouter } from "express";
import { db, medicalRecordsTable, patientsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { CreateMedicalRecordBody, UpdateMedicalRecordBody, ApproveMedicalRecordBody, RejectMedicalRecordBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

function generateVerifyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function enrichRecord(record: typeof medicalRecordsTable.$inferSelect) {
  let doctorName = undefined;
  let chairmanName = undefined;

  if (record.doctorId) {
    const doctors = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, record.doctorId)).limit(1);
    doctorName = doctors[0]?.name;
  }
  if (record.chairmanId) {
    const chairmen = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, record.chairmanId)).limit(1);
    chairmanName = chairmen[0]?.name;
  }

  return {
    ...record,
    doctorName,
    chairmanName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

router.post("/", async (req, res): Promise<void> => {
  const parsed = CreateMedicalRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  try {
    const existing = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, parsed.data.patientId)).limit(1);

    if (existing[0]) {
      const [updated] = await db.update(medicalRecordsTable).set(parsed.data).where(eq(medicalRecordsTable.id, existing[0].id)).returning();
      res.json(await enrichRecord(updated));
      return;
    }

    const [record] = await db.insert(medicalRecordsTable).values({ ...parsed.data, status: "draft" }).returning();
    res.json(await enrichRecord(record));
  } catch (err) {
    req.log.error({ err }, "Create medical record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, id)).limit(1);
    if (!records[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(await enrichRecord(records[0]));
  } catch (err) {
    req.log.error({ err }, "Get medical record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateMedicalRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  try {
    const [record] = await db.update(medicalRecordsTable).set(parsed.data).where(eq(medicalRecordsTable.id, id)).returning();
    if (!record) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(await enrichRecord(record));
  } catch (err) {
    req.log.error({ err }, "Update medical record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/approve", requireRole(["super_admin", "admin", "doctor"]), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = ApproveMedicalRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  try {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, id)).limit(1);
    const record = records[0];

    if (!record) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const recordUuid = uuidv4();
    const verifyCode = generateVerifyCode();

    const verifyUrl = `${process.env.PUBLIC_URL || "https://fanamed.uz"}/verify/${recordUuid}`;
    const qrCode = await QRCode.toDataURL(verifyUrl);

    const [updated] = await db.update(medicalRecordsTable).set({
      ...parsed.data,
      status: "approved",
      uuid: recordUuid,
      verifyCode,
      qrCode,
      rejectionReason: null,
    }).where(eq(medicalRecordsTable.id, id)).returning();

    await db.update(patientsTable).set({ status: "approved" }).where(eq(patientsTable.id, record.patientId));

    res.json(await enrichRecord(updated));
  } catch (err) {
    req.log.error({ err }, "Approve medical record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/reject", requireRole(["super_admin", "admin", "doctor"]), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = RejectMedicalRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  try {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, id)).limit(1);
    const record = records[0];

    if (!record) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [updated] = await db.update(medicalRecordsTable).set({
      status: "rejected",
      rejectionReason: parsed.data.reason,
    }).where(eq(medicalRecordsTable.id, id)).returning();

    await db.update(patientsTable).set({ status: "rejected" }).where(eq(patientsTable.id, record.patientId));

    res.json(await enrichRecord(updated));
  } catch (err) {
    req.log.error({ err }, "Reject medical record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/pdf", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, id)).limit(1);
    const record = records[0];

    if (!record || !record.uuid) {
      res.status(404).json({ error: "Not found", message: "Hujjat tasdiqlanmagan" });
      return;
    }

    const host = req.headers.host || "localhost";
    const protocol = req.headers["x-forwarded-proto"] || (process.env.NODE_ENV === "production" ? "https" : "http");
    const pdfUrl = `${protocol}://${host}/api/pdf/${record.uuid}`;

    res.json({ pdfUrl, uuid: record.uuid });
  } catch (err) {
    req.log.error({ err }, "Generate PDF error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
